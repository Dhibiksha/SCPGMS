/**
 * GOAL DELAY-RISK ENGINE
 * Calculates risk score (0-100) and risk level (LOW, MEDIUM, HIGH) for a goal.
 * Generates explainable, human-readable reasons grounded in actual calculated data.
 */

export function evaluateGoalRisk(goal, milestones = [], tasks = [], employeeWorkloadsMap = new Map(), dependencies = []) {
  if (tasks.length === 0) {
    return {
      score: 10,
      riskLevel: 'LOW',
      reasons: ['No active tasks created for this goal yet. Baseline low risk.']
    };
  }

  const reasons = [];
  let riskPoints = 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const delayedTasks = tasks.filter(t => t.status === 'DELAYED' || (t.status !== 'COMPLETED' && new Date(t.deadline) < new Date()));
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
  const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL');
  const delayedHighPriority = highPriorityTasks.filter(t => t.status === 'DELAYED' || t.status === 'BLOCKED' || (t.status !== 'COMPLETED' && new Date(t.deadline) < new Date()));

  const incompleteRatio = (totalTasks - completedTasks.length) / totalTasks;
  const delayedRatio = delayedTasks.length / totalTasks;

  // 1. Task Completion Progress Risk
  if (incompleteRatio > 0.7) {
    riskPoints += 25;
    reasons.push(`${totalTasks - completedTasks.length} of ${totalTasks} tasks remain incomplete (${Math.round(incompleteRatio * 100)}%).`);
  } else if (incompleteRatio > 0.4) {
    riskPoints += 15;
  }

  // 2. Delayed Tasks Risk
  if (delayedTasks.length > 0) {
    riskPoints += Math.min(30, delayedTasks.length * 15);
    reasons.push(`${delayedTasks.length} task(s) are delayed or past deadline.`);
  }

  // 3. High-Priority / Critical Delayed Tasks Risk
  if (delayedHighPriority.length > 0) {
    riskPoints += 25;
    const titles = delayedHighPriority.map(t => `"${t.title}"`).join(', ');
    reasons.push(`${delayedHighPriority.length} high-priority task(s) (${titles}) are currently delayed or blocked.`);
  }

  // 4. Assignee Workload Overload Risk
  const assignees = tasks.map(t => t.assignedEmployeeId).filter(Boolean);
  let criticalAssigneeCount = 0;
  assignees.forEach(empId => {
    const wl = employeeWorkloadsMap.get(empId);
    if (wl && (wl.state === 'CRITICAL' || wl.score > 85)) {
      criticalAssigneeCount++;
    }
  });

  if (criticalAssigneeCount > 0) {
    riskPoints += 20;
    reasons.push(`Assigned employee(s) have CRITICAL workload (>85 score), limiting available capacity.`);
  }

  // 5. Dependency Bottlenecks
  const blockingTaskCountMap = new Map();
  dependencies.forEach(d => {
    const prev = blockingTaskCountMap.get(d.dependsOnTaskId) || 0;
    blockingTaskCountMap.set(d.dependsOnTaskId, prev + 1);
  });

  tasks.forEach(t => {
    const blockedCount = blockingTaskCountMap.get(t.id) || 0;
    if (blockedCount >= 2 && t.status !== 'COMPLETED') {
      riskPoints += 15;
      reasons.push(`Task "${t.title}" is blocking ${blockedCount} downstream tasks.`);
    }
  });

  // 6. Deadline Proximity vs Remaining Effort Risk
  const now = new Date().getTime();
  const goalDeadline = new Date(goal.deadline).getTime();
  const daysRemaining = (goalDeadline - now) / (1000 * 60 * 60 * 24);

  const totalRemainingHours = tasks.reduce((acc, t) => {
    if (t.status === 'COMPLETED') return acc;
    const remainingPct = (100 - (t.progressPct || 0)) / 100;
    return acc + (t.estimatedEffort || 8) * remainingPct;
  }, 0);

  if (daysRemaining <= 0 && completedTasks.length < totalTasks) {
    riskPoints += 30;
    reasons.push(`Goal deadline has passed with ${totalRemainingHours.toFixed(1)} hours of work remaining.`);
  } else if (daysRemaining > 0 && daysRemaining <= 7 && totalRemainingHours > daysRemaining * 8) {
    riskPoints += 20;
    reasons.push(`Goal deadline is in ${Math.round(daysRemaining)} days, but ${totalRemainingHours.toFixed(1)} hours of effort remain.`);
  }

  const score = Math.max(5, Math.min(100, Math.round(riskPoints)));

  let riskLevel = 'LOW';
  if (score >= 65) riskLevel = 'HIGH';
  else if (score >= 35) riskLevel = 'MEDIUM';

  if (reasons.length === 0) {
    reasons.push('Goal progress is on track with normal assignee workload and schedule.');
  }

  return {
    score,
    riskLevel,
    reasons
  };
}
