import { PrismaClient } from '@prisma/client';
import { evaluateGoalRisk } from '../intelligence/risk-engine/index.js';

const prisma = new PrismaClient();

export async function getGoals(req, res) {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        owner: true,
        parentGoal: true,
        childGoals: true,
        milestones: {
          include: {
            tasks: {
              include: { assignedEmployee: true }
            }
          }
        },
        riskAssessments: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });
    return res.json(goals);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
}

export async function getGoalHierarchy(req, res) {
  try {
    const rootGoals = await prisma.goal.findMany({
      where: { parentGoalId: null },
      include: {
        owner: true,
        milestones: { include: { tasks: { include: { assignedEmployee: true } } } },
        riskAssessments: { orderBy: { timestamp: 'desc' }, take: 1 },
        childGoals: {
          include: {
            owner: true,
            milestones: { include: { tasks: { include: { assignedEmployee: true } } } },
            riskAssessments: { orderBy: { timestamp: 'desc' }, take: 1 },
            childGoals: {
              include: {
                owner: true,
                milestones: { include: { tasks: { include: { assignedEmployee: true } } } },
                riskAssessments: { orderBy: { timestamp: 'desc' }, take: 1 },
                childGoals: {
                  include: {
                    owner: true,
                    milestones: { include: { tasks: { include: { assignedEmployee: true } } } },
                    riskAssessments: { orderBy: { timestamp: 'desc' }, take: 1 }
                  }
                }
              }
            }
          }
        }
      }
    });

    return res.json(rootGoals);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch goal hierarchy' });
  }
}

export async function createGoal(req, res) {
  try {
    const { title, description, priority, startDate, deadline, level, parentGoalId, ownerId } = req.body;

    if (!title || !deadline || !level) {
      return res.status(400).json({ error: 'Title, deadline, and level are required' });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: new Date(deadline),
        level, // Corporate, Department, Team, Employee
        parentGoalId: parentGoalId || null,
        ownerId: ownerId || null,
        status: 'IN_PROGRESS'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'GOAL_CREATE',
        entityType: 'Goal',
        entityId: goal.id,
        detailsJson: JSON.stringify({ title, level, priority })
      }
    });

    return res.status(201).json(goal);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create goal' });
  }
}

export async function updateGoal(req, res) {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline, status, parentGoalId, ownerId } = req.body;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
        parentGoalId,
        ownerId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'GOAL_UPDATE',
        entityType: 'Goal',
        entityId: id,
        detailsJson: JSON.stringify(req.body)
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update goal' });
  }
}

export async function getMilestonesByGoal(req, res) {
  try {
    const { id } = req.params;
    const milestones = await prisma.milestone.findMany({
      where: { goalId: id },
      include: { tasks: { include: { assignedEmployee: true } } }
    });
    return res.json(milestones);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch milestones' });
  }
}

export async function createMilestone(req, res) {
  try {
    const { id } = req.params; // goalId
    const { title, deadline } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ error: 'Title and deadline are required for milestone' });
    }

    const milestone = await prisma.milestone.create({
      data: {
        goalId: id,
        title,
        deadline: new Date(deadline),
        status: 'NOT_STARTED'
      }
    });

    return res.status(201).json(milestone);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create milestone' });
  }
}
