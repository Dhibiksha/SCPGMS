/**
 * ADAPTIVE RECOMMENDATION ENGINE
 * Analyzes high-risk goals, delayed tasks, and overloaded employees.
 * Finds candidate employees matching skills, workload (LOW/MODERATE), and capacity.
 * Generates actionable, explainable task redistribution recommendations.
 */

export function generateRecommendations(allGoals, allTasks, allEmployees, employeeSkillsMap, workloadRecordsMap, dependencies = []) {
  const recommendations = [];

  // Identify candidate employees who are available and have LOW or MODERATE workload
  const candidates = allEmployees.map(emp => {
    const wlRecord = workloadRecordsMap.get(emp.id) || { score: 30, state: 'LOW' };
    const skills = employeeSkillsMap.get(emp.id) || [];
    return {
      employee: emp,
      workloadScore: wlRecord.score,
      workloadState: wlRecord.state,
      skills
    };
  }).filter(c => c.workloadScore < 75 && c.employee.availability);

  // 1. Check for overloaded employees with delayed/high-priority tasks
  for (const task of allTasks) {
    if (task.status === 'COMPLETED') continue;

    const currentAssigneeId = task.assignedEmployeeId;
    const currentAssigneeWL = currentAssigneeId ? workloadRecordsMap.get(currentAssigneeId) : null;
    const isAssigneeCritical = currentAssigneeWL && currentAssigneeWL.score >= 80;
    const isTaskDelayed = task.status === 'DELAYED' || (new Date(task.deadline) < new Date() && task.status !== 'COMPLETED');
    const isTaskHighPriority = task.priority === 'HIGH' || task.priority === 'CRITICAL';

    // If current assignee is overloaded OR task is delayed/blocking
    if (isAssigneeCritical || isTaskDelayed || isTaskHighPriority) {
      // Find best alternative candidate employee
      const bestCandidate = findBestCandidate(task, candidates, currentAssigneeId);

      if (bestCandidate) {
        const goalId = task.milestone ? task.milestone.goalId : null;
        
        let reasonSummary = `Recommend reassigning task "${task.title}" to ${bestCandidate.employee.name}.`;
        let detailedReasons = [
          `${bestCandidate.employee.name} currently has ${bestCandidate.workloadState} workload (${bestCandidate.workloadScore}/100) and ${bestCandidate.employee.capacityHours}h capacity.`,
          `Task estimated effort is ${task.estimatedEffort || 8}h with priority ${task.priority}.`
        ];

        if (isAssigneeCritical) {
          detailedReasons.unshift(`Current assignee workload is ${currentAssigneeWL.state} (${currentAssigneeWL.score}/100).`);
        }
        if (isTaskDelayed) {
          detailedReasons.unshift(`Task is currently delayed past deadline.`);
        }

        if (bestCandidate.matchingSkill) {
          detailedReasons.push(`Employee possesses matching skill "${bestCandidate.matchingSkill.skill.name}" (${bestCandidate.matchingSkill.proficiency}).`);
        }

        recommendations.push({
          goalId,
          taskId: task.id,
          type: 'REASSIGN_TASK',
          targetEmployeeId: bestCandidate.employee.id,
          targetEmployeeName: bestCandidate.employee.name,
          currentAssigneeId,
          reasonJson: JSON.stringify({
            summary: reasonSummary,
            reasons: detailedReasons,
            candidateWorkloadScore: bestCandidate.workloadScore,
            taskPriority: task.priority
          }),
          status: 'PENDING'
        });
      }
    }
  }

  return recommendations;
}

/**
 * Score candidate employees for a given task.
 */
function findBestCandidate(task, candidates, currentAssigneeId) {
  let best = null;
  let highestScore = -1;

  for (const candidate of candidates) {
    if (candidate.employee.id === currentAssigneeId) continue;

    let score = 100 - candidate.workloadScore; // Higher score for lower workload

    // Skill match check
    let matchingSkill = null;
    if (candidate.skills && candidate.skills.length > 0) {
      // Prefer skills matching task title or complexity
      matchingSkill = candidate.skills[0]; // best available skill
      score += 20;
    }

    if (score > highestScore) {
      highestScore = score;
      best = {
        ...candidate,
        matchingSkill
      };
    }
  }

  return best;
}
