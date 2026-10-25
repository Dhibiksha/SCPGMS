import { PrismaClient } from '@prisma/client';
import { detectCycle, getDownstreamImpact } from '../intelligence/dependency-engine/index.js';
import { propagateTaskImpact } from '../intelligence/impact-engine/index.js';
import { calculateWorkload } from '../intelligence/workload-engine/index.js';
import { evaluateGoalRisk } from '../intelligence/risk-engine/index.js';

const prisma = new PrismaClient();

export async function getTasks(req, res) {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedEmployee: true,
        milestone: { include: { goal: true } },
        dependencies: { include: { dependsOnTask: true } },
        reverseDeps: { include: { task: true } }
      }
    });
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

export async function createTask(req, res) {
  try {
    const { milestoneId, title, description, assignedEmployeeId, priority, complexity, estimatedEffort, deadline } = req.body;

    if (!milestoneId || !title || !deadline) {
      return res.status(400).json({ error: 'Milestone ID, title, and deadline are required' });
    }

    const task = await prisma.task.create({
      data: {
        milestoneId,
        title,
        description,
        assignedEmployeeId: assignedEmployeeId || null,
        priority: priority || 'MEDIUM',
        complexity: complexity || 'MEDIUM',
        estimatedEffort: estimatedEffort ? parseFloat(estimatedEffort) : 8.0,
        deadline: new Date(deadline),
        status: 'NOT_STARTED',
        progressPct: 0.0
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'TASK_CREATE',
        entityType: 'Task',
        entityId: task.id,
        detailsJson: JSON.stringify({ title, priority, assignedEmployeeId })
      }
    });

    // Update assigned employee workload if assigned
    if (assignedEmployeeId) {
      await updateEmployeeWorkloadRecord(assignedEmployeeId);
    }

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create task' });
  }
}

export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, assignedEmployeeId, priority, complexity, estimatedEffort, deadline, status, progressPct } = req.body;

    const currentTask = await prisma.task.findUnique({ where: { id } });
    if (!currentTask) return res.status(404).json({ error: 'Task not found' });

    const oldAssigneeId = currentTask.assignedEmployeeId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        assignedEmployeeId,
        priority,
        complexity,
        estimatedEffort: estimatedEffort ? parseFloat(estimatedEffort) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
        progressPct: progressPct !== undefined ? parseFloat(progressPct) : undefined
      },
      include: {
        milestone: { include: { goal: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'TASK_UPDATE',
        entityType: 'Task',
        entityId: id,
        detailsJson: JSON.stringify(req.body)
      }
    });

    // Recalculate workloads
    if (oldAssigneeId) await updateEmployeeWorkloadRecord(oldAssigneeId);
    if (assignedEmployeeId && assignedEmployeeId !== oldAssigneeId) {
      await updateEmployeeWorkloadRecord(assignedEmployeeId);
    }

    // Recalculate goal risk
    if (updatedTask.milestone && updatedTask.milestone.goalId) {
      await updateGoalRiskRecord(updatedTask.milestone.goalId);
    }

    return res.json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

export async function addDependency(req, res) {
  try {
    const { id } = req.params; // taskId
    const { dependsOnTaskId } = req.body;

    if (!dependsOnTaskId) {
      return res.status(400).json({ error: 'dependsOnTaskId is required' });
    }

    const allDependencies = await prisma.taskDependency.findMany();

    // Check for circular dependency
    const isCircular = detectCycle(allDependencies, id, dependsOnTaskId);
    if (isCircular) {
      return res.status(400).json({ error: 'Circular dependency detected! This relationship is not allowed.' });
    }

    const dep = await prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnTaskId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DEPENDENCY_CREATE',
        entityType: 'TaskDependency',
        entityId: dep.id,
        detailsJson: JSON.stringify({ taskId: id, dependsOnTaskId })
      }
    });

    return res.status(201).json(dep);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Dependency relationship already exists' });
    }
    return res.status(500).json({ error: 'Failed to add dependency' });
  }
}

export async function getDownstreamImpactHandler(req, res) {
  try {
    const { id } = req.params; // sourceTaskId

    const allTasks = await prisma.task.findMany();
    const allDeps = await prisma.taskDependency.findMany();

    const downstreamTasks = getDownstreamImpact(allTasks, allDeps, id);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        milestone: {
          include: {
            goal: true
          }
        }
      }
    });

    const allGoals = await prisma.goal.findMany();
    const milestone = task ? task.milestone : null;
    const goal = milestone ? milestone.goal : null;

    const impactChain = propagateTaskImpact(task, milestone, goal, allGoals);

    return res.json({
      sourceTask: task,
      downstreamTasks,
      impactChain
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate downstream impact' });
  }
}

async function updateEmployeeWorkloadRecord(employeeId) {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) return;
    const tasks = await prisma.task.findMany({ where: { assignedEmployeeId: employeeId } });
    const allDeps = await prisma.taskDependency.findMany();
    const wl = calculateWorkload(emp, tasks, allDeps);

    await prisma.workloadRecord.create({
      data: {
        employeeId,
        score: wl.score,
        state: wl.state,
        activeTasks: wl.activeTasksCount,
        factorsJson: JSON.stringify(wl.factors)
      }
    });
  } catch (e) {
    console.error('Workload update error:', e);
  }
}

async function updateGoalRiskRecord(goalId) {
  try {
    const goalObj = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goalObj) return;
    const milestones = await prisma.milestone.findMany({ where: { goalId } });
    const milestoneIds = milestones.map(m => m.id);
    const goalTasks = await prisma.task.findMany({ where: { milestoneId: { in: milestoneIds } } });
    const allDeps = await prisma.taskDependency.findMany();

    const assignees = [...new Set(goalTasks.map(t => t.assignedEmployeeId).filter(Boolean))];
    const wlMap = new Map();
    for (const aId of assignees) {
      const rec = await prisma.workloadRecord.findFirst({ where: { employeeId: aId }, orderBy: { timestamp: 'desc' } });
      if (rec) wlMap.set(aId, rec);
    }

    const riskEval = evaluateGoalRisk(goalObj, milestones, goalTasks, wlMap, allDeps);

    await prisma.riskAssessment.create({
      data: {
        goalId,
        riskLevel: riskEval.riskLevel,
        score: riskEval.score,
        reasonsJson: JSON.stringify(riskEval.reasons)
      }
    });
  } catch (e) {
    console.error('Risk update error:', e);
  }
}
