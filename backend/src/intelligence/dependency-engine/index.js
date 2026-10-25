/**
 * DEPENDENCY ENGINE
 * Handles task dependency graph traversal, cycle detection, and downstream dependent resolution.
 */

/**
 * Detects if adding a dependency (taskId depends on dependsOnTaskId) would create a cycle.
 * @param {Array<{taskId: string, dependsOnTaskId: string}>} allDependencies 
 * @param {string} taskId 
 * @param {string} dependsOnTaskId 
 * @returns {boolean} true if cycle detected
 */
export function detectCycle(allDependencies, taskId, dependsOnTaskId) {
  if (taskId === dependsOnTaskId) return true;

  // Build adjacency list: target -> list of prerequisites, or prerequisite -> list of dependents
  // To check if adding (taskId -> dependsOnTaskId) creates a cycle,
  // we check if taskId is reachable from dependsOnTaskId by following existing dependencies (where A depends on B means edge A -> B).
  // If taskId depends on dependsOnTaskId, and dependsOnTaskId already depends transitively on taskId, it's a cycle!
  
  const adj = new Map();
  for (const dep of allDependencies) {
    if (!adj.has(dep.taskId)) adj.set(dep.taskId, []);
    adj.get(dep.taskId).push(dep.dependsOnTaskId);
  }

  // Traverse starting from dependsOnTaskId to see if we ever reach taskId
  const visited = new Set();
  const queue = [dependsOnTaskId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === taskId) return true; // Cycle found!

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return false;
}

/**
 * Finds all downstream tasks that depend directly or indirectly on a given source task.
 * @param {Array<{id: string, milestoneId: string, title: string, status: string}>} allTasks 
 * @param {Array<{taskId: string, dependsOnTaskId: string}>} allDependencies 
 * @param {string} sourceTaskId 
 * @returns {Array<object>} List of downstream tasks and distance
 */
export function getDownstreamImpact(allTasks, allDependencies, sourceTaskId) {
  // Build mapping of prerequisite -> list of tasks that depend on it
  // (dependsOnTaskId -> [taskId1, taskId2, ...])
  const dependentsMap = new Map();
  for (const dep of allDependencies) {
    if (!dependentsMap.has(dep.dependsOnTaskId)) {
      dependentsMap.set(dep.dependsOnTaskId, []);
    }
    dependentsMap.get(dep.dependsOnTaskId).push(dep.taskId);
  }

  const taskMap = new Map(allTasks.map(t => [t.id, t]));
  const affectedTasks = [];
  const visited = new Set();
  const queue = [{ id: sourceTaskId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();

    const children = dependentsMap.get(id) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        const childTask = taskMap.get(childId);
        if (childTask) {
          affectedTasks.push({
            ...childTask,
            depth: depth + 1
          });
        }
        queue.push({ id: childId, depth: depth + 1 });
      }
    }
  }

  return affectedTasks;
}

/**
 * Gets tasks that are bottlenecking multiple downstream tasks.
 */
export function findBottlenecks(allTasks, allDependencies) {
  const countMap = new Map();
  for (const dep of allDependencies) {
    const prev = countMap.get(dep.dependsOnTaskId) || 0;
    countMap.set(dep.dependsOnTaskId, prev + 1);
  }

  const taskMap = new Map(allTasks.map(t => [t.id, t]));
  const bottlenecks = [];

  for (const [taskId, blockedCount] of countMap.entries()) {
    if (blockedCount >= 2) {
      const task = taskMap.get(taskId);
      if (task && task.status !== 'COMPLETED') {
        bottlenecks.push({
          task,
          blockedCount
        });
      }
    }
  }

  return bottlenecks;
}
