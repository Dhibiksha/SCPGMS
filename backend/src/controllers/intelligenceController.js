import { PrismaClient } from '@prisma/client';
import { calculateWorkload } from '../intelligence/workload-engine/index.js';
import { evaluateGoalRisk } from '../intelligence/risk-engine/index.js';

const prisma = new PrismaClient();

export async function getTeamWorkload(req, res) {
  try {
    const { deptId } = req.params;
    const employees = await prisma.employee.findMany({
      where: deptId ? { departmentId: deptId } : {},
      include: { department: true }
    });

    const allDeps = await prisma.taskDependency.findMany();
    const teamWorkloads = [];

    for (const emp of employees) {
      const assignedTasks = await prisma.task.findMany({ where: { assignedEmployeeId: emp.id } });
      const wl = calculateWorkload(emp, assignedTasks, allDeps);
      teamWorkloads.push({
        employee: emp,
        workload: wl
      });
    }

    return res.json(teamWorkloads);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch team workload' });
  }
}

export async function getGoalRisk(req, res) {
  try {
    const { goalId } = req.params;
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestones = await prisma.milestone.findMany({ where: { goalId } });
    const milestoneIds = milestones.map(m => m.id);
    const tasks = await prisma.task.findMany({
      where: { milestoneId: { in: milestoneIds } },
      include: { assignedEmployee: true }
    });
    const allDeps = await prisma.taskDependency.findMany();

    const assignees = [...new Set(tasks.map(t => t.assignedEmployeeId).filter(Boolean))];
    const wlMap = new Map();
    for (const aId of assignees) {
      const emp = await prisma.employee.findUnique({ where: { id: aId } });
      if (emp) {
        const empTasks = await prisma.task.findMany({ where: { assignedEmployeeId: aId } });
        const wl = calculateWorkload(emp, empTasks, allDeps);
        wlMap.set(aId, wl);
      }
    }

    const riskEval = evaluateGoalRisk(goal, milestones, tasks, wlMap, allDeps);

    return res.json({
      goal,
      ...riskEval
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to evaluate goal risk' });
  }
}

export async function getRiskDashboard(req, res) {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        milestones: { include: { tasks: { include: { assignedEmployee: true } } } },
        owner: true
      }
    });

    const allDeps = await prisma.taskDependency.findMany();
    const riskResults = [];

    for (const goal of goals) {
      const milestoneIds = goal.milestones.map(m => m.id);
      const tasks = goal.milestones.flatMap(m => m.tasks);

      const assignees = [...new Set(tasks.map(t => t.assignedEmployeeId).filter(Boolean))];
      const wlMap = new Map();
      for (const aId of assignees) {
        const emp = await prisma.employee.findUnique({ where: { id: aId } });
        if (emp) {
          const empTasks = await prisma.task.findMany({ where: { assignedEmployeeId: aId } });
          const wl = calculateWorkload(emp, empTasks, allDeps);
          wlMap.set(aId, wl);
        }
      }

      const riskEval = evaluateGoalRisk(goal, goal.milestones, tasks, wlMap, allDeps);
      riskResults.push({
        goalId: goal.id,
        title: goal.title,
        level: goal.level,
        deadline: goal.deadline,
        status: goal.status,
        ownerName: goal.owner ? goal.owner.name : 'Unassigned',
        ...riskEval
      });
    }

    return res.json(riskResults);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch risk dashboard' });
  }
}
