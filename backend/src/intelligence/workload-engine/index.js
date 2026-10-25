/**
 * WORKLOAD ENGINE
 * Calculates employee workload score (0-100) using 8 weighted factors.
 * Classifies state: LOW (<40), MODERATE (40-65), HIGH (65-85), CRITICAL (>85).
 */

export const WORKLOAD_WEIGHTS = {
  w1_active_tasks: 0.15,
  w2_priority: 0.15,
  w3_complexity: 0.15,
  w4_effort_capacity: 0.15,
  w5_deadline_proximity: 0.10,
  w6_dependency_load: 0.10,
  w7_remaining_progress: 0.10,
  w8_historical_delay: 0.10
};

const PRIORITY_MAP = { LOW: 25, MEDIUM: 50, HIGH: 75, CRITICAL: 100 };
const COMPLEXITY_MAP = { LOW: 33, MEDIUM: 66, HIGH: 100 };

/**
 * Calculates workload score and breakdown for an employee.
 * @param {object} employee Employee object with capacityHours
 * @param {Array<object>} assignedTasks List of tasks assigned to employee
 * @param {Array<object>} allDependencies List of task dependencies
 * @param {Array<object>} historicalTasks Historical completed/delayed tasks for employee
 * @returns {object} { score, state, activeTasksCount, factors }
 */
export function calculateWorkload(employee, assignedTasks, allDependencies = [], historicalTasks = []) {
  const activeTasks = assignedTasks.filter(t => t.status !== 'COMPLETED');
  const activeCount = activeTasks.length;

  if (activeCount === 0) {
    return {
      score: 0,
      state: 'LOW',
      activeTasksCount: 0,
      factors: {
        activeTaskFactor: 0,
        priorityFactor: 0,
        complexityFactor: 0,
        effortCapacityFactor: 0,
        deadlineFactor: 0,
        dependencyFactor: 0,
        remainingProgressFactor: 0,
        historicalDelayFactor: 0,
        weights: WORKLOAD_WEIGHTS,
        explanation: 'Employee currently has no active assigned tasks.'
      }
    };
  }

  // 1. Active Task Factor (Normalized: 5 tasks = 100%)
  const activeTaskFactor = Math.min(100, (activeCount / 5) * 100);

  // 2. Priority Factor (Average priority weight)
  const prioritySum = activeTasks.reduce((acc, t) => acc + (PRIORITY_MAP[t.priority] || 50), 0);
  const priorityFactor = prioritySum / activeCount;

  // 3. Complexity Factor (Average complexity weight)
  const complexitySum = activeTasks.reduce((acc, t) => acc + (COMPLEXITY_MAP[t.complexity] || 66), 0);
  const complexityFactor = complexitySum / activeCount;

  // 4. Effort vs Capacity Factor
  const totalRemainingEffort = activeTasks.reduce((acc, t) => {
    const remainingPct = Math.max(0, 100 - (t.progressPct || 0)) / 100;
    return acc + (t.estimatedEffort || 8) * remainingPct;
  }, 0);
  const capacity = employee.capacityHours || 40.0;
  const effortCapacityFactor = Math.min(100, (totalRemainingEffort / capacity) * 100);

  // 5. Deadline Proximity Factor (Tasks due within 72 hours get higher weight)
  const now = new Date().getTime();
  const deadlineScores = activeTasks.map(t => {
    const dueTime = new Date(t.deadline).getTime();
    const hoursLeft = (dueTime - now) / (1000 * 60 * 60);
    if (hoursLeft <= 0) return 100; // Overdue / Delayed
    if (hoursLeft <= 24) return 90;
    if (hoursLeft <= 48) return 75;
    if (hoursLeft <= 72) return 60;
    if (hoursLeft <= 168) return 40; // 1 week
    return 20;
  });
  const deadlineFactor = deadlineScores.reduce((a, b) => a + b, 0) / activeCount;

  // 6. Dependency Load Factor (Tasks that block other tasks or depend on blocked tasks)
  const blockingTaskIds = new Set(allDependencies.map(d => d.dependsOnTaskId));
  const blockedByMap = new Set(allDependencies.map(d => d.taskId));
  
  let depCount = 0;
  activeTasks.forEach(t => {
    if (blockingTaskIds.has(t.id)) depCount += 1.5;
    if (blockedByMap.has(t.id)) depCount += 1.0;
  });
  const dependencyFactor = Math.min(100, (depCount / Math.max(1, activeCount)) * 50);

  // 7. Remaining Progress Factor (Average uncompleted percentage)
  const remainingPctSum = activeTasks.reduce((acc, t) => acc + (100 - (t.progressPct || 0)), 0);
  const remainingProgressFactor = remainingPctSum / activeCount;

  // 8. Historical Delay Factor
  let historicalDelayFactor = 20; // baseline
  if (historicalTasks.length > 0) {
    const delayedCount = historicalTasks.filter(t => t.status === 'DELAYED' || (t.status === 'COMPLETED' && new Date(t.updatedAt || t.deadline) > new Date(t.deadline))).length;
    historicalDelayFactor = Math.min(100, (delayedCount / historicalTasks.length) * 100);
  }

  // Calculate Weighted Workload Score
  const score = Math.round(
    WORKLOAD_WEIGHTS.w1_active_tasks * activeTaskFactor +
    WORKLOAD_WEIGHTS.w2_priority * priorityFactor +
    WORKLOAD_WEIGHTS.w3_complexity * complexityFactor +
    WORKLOAD_WEIGHTS.w4_effort_capacity * effortCapacityFactor +
    WORKLOAD_WEIGHTS.w5_deadline_proximity * deadlineFactor +
    WORKLOAD_WEIGHTS.w6_dependency_load * dependencyFactor +
    WORKLOAD_WEIGHTS.w7_remaining_progress * remainingProgressFactor +
    WORKLOAD_WEIGHTS.w8_historical_delay * historicalDelayFactor
  );

  // Classify State
  let state = 'LOW';
  if (score >= 85) state = 'CRITICAL';
  else if (score >= 65) state = 'HIGH';
  else if (score >= 40) state = 'MODERATE';

  const factors = {
    activeTaskFactor: Math.round(activeTaskFactor),
    priorityFactor: Math.round(priorityFactor),
    complexityFactor: Math.round(complexityFactor),
    effortCapacityFactor: Math.round(effortCapacityFactor),
    deadlineFactor: Math.round(deadlineFactor),
    dependencyFactor: Math.round(dependencyFactor),
    remainingProgressFactor: Math.round(remainingProgressFactor),
    historicalDelayFactor: Math.round(historicalDelayFactor),
    totalRemainingEffortHours: Math.round(totalRemainingEffort * 10) / 10,
    employeeCapacityHours: capacity,
    weights: WORKLOAD_WEIGHTS,
    explanation: `Workload is ${state} (${score}/100) based on ${activeCount} active tasks totaling ${Math.round(totalRemainingEffort)}h remaining effort.`
  };

  return {
    score,
    state,
    activeTasksCount: activeCount,
    factors
  };
}
