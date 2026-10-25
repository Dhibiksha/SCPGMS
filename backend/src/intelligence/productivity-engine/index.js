/**
 * PRODUCTIVITY ENGINE
 * Calculates employee productivity score (0-100) based on real performance factors:
 * - On-time completion rate
 * - Deadline adherence
 * - Goal contribution progress
 * - Complexity-weighted completion
 * - Priority-weighted completion
 * - Workload overload penalty
 * - Historical trend
 */

export function calculateProductivity(employee, allAssignedTasks = [], workloadScore = 50) {
  if (allAssignedTasks.length === 0) {
    return {
      score: 75, // Baseline starting productivity score
      factors: {
        completedCount: 0,
        onTimeRate: 100,
        complexityWeightedScore: 75,
        priorityWeightedScore: 75,
        workloadPenalty: 0,
        explanation: 'No task history recorded yet. Default baseline performance.'
      }
    };
  }

  const completedTasks = allAssignedTasks.filter(t => t.status === 'COMPLETED');
  const totalTasks = allAssignedTasks.length;
  const completionRatio = totalTasks > 0 ? (completedTasks.length / totalTasks) : 0;

  // On-time completion rate (tasks completed on or before deadline)
  const onTimeCompleted = completedTasks.filter(t => {
    if (!t.deadline) return true;
    return new Date(t.updatedAt || new Date()) <= new Date(t.deadline);
  });
  const onTimeRate = completedTasks.length > 0 ? (onTimeCompleted.length / completedTasks.length) * 100 : 100;

  // Complexity & Priority weighted completions
  const complexityWeightMap = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const priorityWeightMap = { LOW: 1, MEDIUM: 1.5, HIGH: 2, CRITICAL: 3 };

  let totalEarnedPoints = 0;
  let totalPossiblePoints = 0;

  allAssignedTasks.forEach(t => {
    const cWeight = complexityWeightMap[t.complexity] || 2;
    const pWeight = priorityWeightMap[t.priority] || 1.5;
    const points = cWeight * pWeight;
    totalPossiblePoints += points;
    if (t.status === 'COMPLETED') {
      totalEarnedPoints += points;
    } else {
      totalEarnedPoints += points * ((t.progressPct || 0) / 100);
    }
  });

  const weightedCompletionRate = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;

  // Workload penalty (if workload > 85, productivity is strained)
  let workloadPenalty = 0;
  if (workloadScore > 85) {
    workloadPenalty = (workloadScore - 85) * 0.8;
  }

  // Raw Productivity Calculation
  let rawScore = (onTimeRate * 0.35) + (weightedCompletionRate * 0.45) + (completionRatio * 20) - workloadPenalty;
  const score = Math.max(10, Math.min(100, Math.round(rawScore)));

  const factors = {
    completedTasksCount: completedTasks.length,
    totalAssignedTasks: totalTasks,
    onTimeRate: Math.round(onTimeRate),
    weightedCompletionRate: Math.round(weightedCompletionRate),
    workloadPenalty: Math.round(workloadPenalty),
    explanation: `Productivity score is ${score}/100 based on ${completedTasks.length}/${totalTasks} tasks completed with ${Math.round(onTimeRate)}% on-time rate.`
  };

  return {
    score,
    factors
  };
}
