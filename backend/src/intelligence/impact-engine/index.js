/**
 * IMPACT PROPAGATION ENGINE
 * Traces organizational impact up the hierarchy:
 * Task -> Milestone -> Goal (Employee/Team) -> Parent Goal (Department) -> Top Goal (Corporate)
 */

export function propagateTaskImpact(task, milestone, goal, allGoals = []) {
  const impactChain = [];
  
  if (!task) return impactChain;

  const taskName = task.title;
  let currentDesc = `Task "${taskName}" delay/bottleneck`;

  // 1. Milestone Impact
  if (milestone) {
    currentDesc += ` directly impacts Milestone "${milestone.title}"`;
    impactChain.push({
      sourceTaskId: task.id,
      affectedEntityType: 'Milestone',
      affectedEntityId: milestone.id,
      impactDescription: `Milestone "${milestone.title}" schedule compromised by task "${taskName}".`
    });
  }

  // 2. Immediate Goal (Team/Employee Level)
  if (goal) {
    currentDesc += `, which threatens ${goal.level} Goal "${goal.title}"`;
    impactChain.push({
      sourceTaskId: task.id,
      affectedEntityType: 'Goal',
      affectedEntityId: goal.id,
      impactDescription: `${goal.level} Goal "${goal.title}" risk level elevated due to downstream task delay.`
    });

    // 3. Traversal up parent goals (Department & Corporate levels)
    const goalMap = new Map(allGoals.map(g => [g.id, g]));
    let parentId = goal.parentGoalId;
    let depth = 0;

    while (parentId && depth < 5) {
      const parentGoal = goalMap.get(parentId);
      if (!parentGoal) break;

      impactChain.push({
        sourceTaskId: task.id,
        affectedEntityType: `${parentGoal.level}Goal`,
        affectedEntityId: parentGoal.id,
        impactDescription: `${parentGoal.level} Goal "${parentGoal.title}" potentially affected via organizational hierarchy.`
      });

      parentId = parentGoal.parentGoalId;
      depth++;
    }
  }

  return impactChain;
}
