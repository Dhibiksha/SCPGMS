import { PrismaClient } from '@prisma/client';
import { generateRecommendations } from '../intelligence/recommendation-engine/index.js';
import { executeTaskRedistribution } from '../intelligence/redistribution-engine/index.js';
import { evaluateHistoricalOutcomes } from '../intelligence/feedback-engine/index.js';

const prisma = new PrismaClient();

export async function getRecommendations(req, res) {
  try {
    const { goalId } = req.query;
    const where = {};
    if (goalId) where.goalId = goalId;

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        goal: true,
        task: {
          include: {
            assignedEmployee: true
          }
        },
        targetEmployee: true,
        outcomes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(recommendations);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

export async function triggerGenerateRecommendations(req, res) {
  try {
    const allGoals = await prisma.goal.findMany();
    const allTasks = await prisma.task.findMany({
      include: {
        milestone: true,
        assignedEmployee: true
      }
    });
    const allEmployees = await prisma.employee.findMany();
    const empSkills = await prisma.employeeSkill.findMany({ include: { skill: true } });
    const empSkillsMap = new Map();
    empSkills.forEach(es => {
      if (!empSkillsMap.has(es.employeeId)) empSkillsMap.set(es.employeeId, []);
      empSkillsMap.get(es.employeeId).push(es);
    });

    const workloadRecordsMap = new Map();
    for (const emp of allEmployees) {
      const latestWl = await prisma.workloadRecord.findFirst({
        where: { employeeId: emp.id },
        orderBy: { timestamp: 'desc' }
      });
      if (latestWl) workloadRecordsMap.set(emp.id, latestWl);
    }

    const dependencies = await prisma.taskDependency.findMany();

    const generated = generateRecommendations(allGoals, allTasks, allEmployees, empSkillsMap, workloadRecordsMap, dependencies);

    const createdRecs = [];
    for (const rec of generated) {
      // Check if pending recommendation already exists for this task
      const existing = await prisma.recommendation.findFirst({
        where: {
          taskId: rec.taskId,
          status: 'PENDING'
        }
      });

      if (!existing) {
        const created = await prisma.recommendation.create({
          data: {
            goalId: rec.goalId,
            taskId: rec.taskId,
            type: rec.type,
            targetEmployeeId: rec.targetEmployeeId,
            reasonJson: rec.reasonJson,
            status: 'PENDING'
          },
          include: {
            goal: true,
            task: { include: { assignedEmployee: true } },
            targetEmployee: true
          }
        });
        createdRecs.push(created);
      } else {
        createdRecs.push(existing);
      }
    }

    return res.json({
      message: `Generated ${createdRecs.length} actionable recommendation(s)`,
      recommendations: createdRecs
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}

export async function acceptRecommendationHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await executeTaskRedistribution(prisma, id, req.user.id);
    return res.json(result);
  } catch (error) {
    console.error('Accept recommendation error:', error);
    return res.status(400).json({ error: error.message || 'Failed to accept recommendation' });
  }
}

export async function rejectRecommendationHandler(req, res) {
  try {
    const { id } = req.params;

    const rec = await prisma.recommendation.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RECOMMENDATION_REJECTED',
        entityType: 'Recommendation',
        entityId: id,
        detailsJson: JSON.stringify({ recommendationId: id })
      }
    });

    return res.json({ message: 'Recommendation rejected', recommendation: rec });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject recommendation' });
  }
}

export async function getRecommendationOutcomeHandler(req, res) {
  try {
    const { id } = req.params;
    const outcome = await prisma.recommendationOutcome.findFirst({
      where: { recommendationId: id },
      include: { recommendation: true }
    });

    if (!outcome) {
      return res.status(404).json({ error: 'Outcome not found for this recommendation' });
    }

    return res.json(outcome);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch recommendation outcome' });
  }
}

export async function getFeedbackSummary(req, res) {
  try {
    const summary = await evaluateHistoricalOutcomes(prisma);
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to evaluate feedback loop outcomes' });
  }
}
