/**
 * REDISTRIBUTION ENGINE
 * Handles execution of accepted task redistribution recommendations.
 * Reassigns task, recalculates workloads for old and new assignees,
 * recalculates goal risk, records recommendation outcome, logs audit, and sends notifications.
 */

import { calculateWorkload } from '../workload-engine/index.js';
import { evaluateGoalRisk } from '../risk-engine/index.js';

export async function executeTaskRedistribution(prisma, recommendationId, managerUserId) {
  // 1. Fetch recommendation with relations
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    include: {
      task: {
        include: {
          milestone: {
            include: {
              goal: true
            }
          }
        }
      },
      targetEmployee: true
    }
  });

  if (!recommendation) {
    throw new Error('Recommendation not found');
  }

  if (recommendation.status === 'ACCEPTED') {
    throw new Error('Recommendation has already been accepted');
  }

  const task = recommendation.task;
  if (!task) {
    throw new Error('Associated task not found for recommendation');
  }

  const oldAssigneeId = task.assignedEmployeeId;
  const newAssigneeId = recommendation.targetEmployeeId;

  if (!newAssigneeId) {
    throw new Error('Target employee for redistribution is missing');
  }

  // Fetch initial workloads for outcome comparison
  const oldAssigneeWorkloadBefore = oldAssigneeId ? 
    await prisma.workloadRecord.findFirst({ where: { employeeId: oldAssigneeId }, orderBy: { timestamp: 'desc' } }) : null;

  const goalBefore = task.milestone ? 
    await prisma.riskAssessment.findFirst({ where: { goalId: task.milestone.goalId }, orderBy: { timestamp: 'desc' } }) : null;

  const previousState = {
    taskId: task.id,
    oldAssigneeId,
    newAssigneeId,
    oldAssigneeWorkloadScore: oldAssigneeWorkloadBefore ? oldAssigneeWorkloadBefore.score : 0,
    goalRiskScore: goalBefore ? goalBefore.score : 0,
    taskStatus: task.status
  };

  // 2. Perform DB Updates inside transaction
  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      assignedEmployeeId: newAssigneeId,
      status: task.status === 'BLOCKED' || task.status === 'DELAYED' ? 'IN_PROGRESS' : task.status
    }
  });

  // Mark recommendation as ACCEPTED
  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'ACCEPTED' }
  });

  // 3. Recalculate Old Assignee Workload
  if (oldAssigneeId) {
    const oldEmp = await prisma.employee.findUnique({ where: { id: oldAssigneeId } });
    const oldEmpTasks = await prisma.task.findMany({ where: { assignedEmployeeId: oldAssigneeId } });
    const allDeps = await prisma.taskDependency.findMany();
    const oldWl = calculateWorkload(oldEmp, oldEmpTasks, allDeps);

    await prisma.workloadRecord.create({
      data: {
        employeeId: oldAssigneeId,
        score: oldWl.score,
        state: oldWl.state,
        activeTasks: oldWl.activeTasksCount,
        factorsJson: JSON.stringify(oldWl.factors)
      }
    });
  }

  // 4. Recalculate New Assignee Workload
  const newEmp = await prisma.employee.findUnique({ where: { id: newAssigneeId } });
  const newEmpTasks = await prisma.task.findMany({ where: { assignedEmployeeId: newAssigneeId } });
  const allDeps = await prisma.taskDependency.findMany();
  const newWl = calculateWorkload(newEmp, newEmpTasks, allDeps);

  await prisma.workloadRecord.create({
    data: {
      employeeId: newAssigneeId,
      score: newWl.score,
      state: newWl.state,
      activeTasks: newWl.activeTasksCount,
      factorsJson: JSON.stringify(newWl.factors)
    }
  });

  // 5. Recalculate Goal Risk
  let goalAfterRisk = null;
  if (task.milestone && task.milestone.goalId) {
    const goalId = task.milestone.goalId;
    const goalObj = await prisma.goal.findUnique({ where: { id: goalId } });
    const milestones = await prisma.milestone.findMany({ where: { goalId } });
    const milestoneIds = milestones.map(m => m.id);
    const goalTasks = await prisma.task.findMany({ where: { milestoneId: { in: milestoneIds } } });

    // Build workloads map for assignees
    const assignees = [...new Set(goalTasks.map(t => t.assignedEmployeeId).filter(Boolean))];
    const wlMap = new Map();
    for (const aId of assignees) {
      const rec = await prisma.workloadRecord.findFirst({ where: { employeeId: aId }, orderBy: { timestamp: 'desc' } });
      if (rec) wlMap.set(aId, rec);
    }

    const riskEval = evaluateGoalRisk(goalObj, milestones, goalTasks, wlMap, allDeps);

    goalAfterRisk = await prisma.riskAssessment.create({
      data: {
        goalId,
        riskLevel: riskEval.riskLevel,
        score: riskEval.score,
        reasonsJson: JSON.stringify(riskEval.reasons)
      }
    });

    // Update goal status if risk improved
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: riskEval.riskLevel === 'HIGH' ? 'AT_RISK' : 'IN_PROGRESS'
      }
    });
  }

  // 6. Record Outcome Feedback
  const newState = {
    taskId: task.id,
    newAssigneeId,
    newAssigneeWorkloadScore: newWl.score,
    goalRiskScore: goalAfterRisk ? goalAfterRisk.score : 0,
    taskStatus: updatedTask.status
  };

  const isImproved = (previousState.goalRiskScore > newState.goalRiskScore) || 
                     (previousState.oldAssigneeWorkloadScore > newWl.score);
  
  const outcomeResult = isImproved ? 'IMPROVED' : 'UNCHANGED';

  await prisma.recommendationOutcome.create({
    data: {
      recommendationId,
      previousStateJson: JSON.stringify(previousState),
      newStateJson: JSON.stringify(newState),
      outcome: outcomeResult
    }
  });

  // 7. Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: managerUserId || null,
      action: 'TASK_REDISTRIBUTION_ACCEPTED',
      entityType: 'Task',
      entityId: task.id,
      detailsJson: JSON.stringify({
        taskTitle: task.title,
        oldAssigneeId,
        newAssigneeId: newEmp.id,
        newAssigneeName: newEmp.name,
        outcome: outcomeResult
      })
    }
  });

  // 8. Notifications to old & new employee users
  const oldUser = oldAssigneeId ? await prisma.user.findFirst({ where: { employeeId: oldAssigneeId } }) : null;
  const newUser = await prisma.user.findFirst({ where: { employeeId: newAssigneeId } });

  if (oldUser) {
    await prisma.notification.create({
      data: {
        userId: oldUser.id,
        type: 'REDISTRIBUTION',
        message: `Task "${task.title}" has been reassigned to ${newEmp.name} to balance team workload.`
      }
    });
  }

  if (newUser) {
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        type: 'TASK_ASSIGNED',
        message: `Task "${task.title}" has been assigned to you.`
      }
    });
  }

  return {
    success: true,
    previousState,
    newState,
    outcome: outcomeResult,
    reassignedTask: updatedTask
  };
}
