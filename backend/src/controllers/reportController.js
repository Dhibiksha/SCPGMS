import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getProductivityReport(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        productivityRecords: { orderBy: { timestamp: 'desc' }, take: 1 },
        assignedTasks: true
      }
    });

    const reportData = employees.map(emp => {
      const latestProd = emp.productivityRecords[0];
      const completed = emp.assignedTasks.filter(t => t.status === 'COMPLETED').length;
      const total = emp.assignedTasks.length;
      return {
        employeeId: emp.id,
        name: emp.name,
        department: emp.department ? emp.department.name : 'N/A',
        designation: emp.designation,
        score: latestProd ? latestProd.score : 75,
        completedTasks: completed,
        totalTasks: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 100
      };
    });

    return res.json(reportData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate productivity report' });
  }
}

export async function getWorkloadReport(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        workloadRecords: { orderBy: { timestamp: 'desc' }, take: 1 },
        assignedTasks: { where: { status: { not: 'COMPLETED' } } }
      }
    });

    const reportData = employees.map(emp => {
      const latestWl = emp.workloadRecords[0];
      const score = latestWl ? latestWl.score : 0;
      const state = latestWl ? latestWl.state : 'LOW';
      const factors = latestWl ? JSON.parse(latestWl.factorsJson || '{}') : {};
      return {
        employeeId: emp.id,
        name: emp.name,
        department: emp.department ? emp.department.name : 'N/A',
        activeTaskCount: emp.assignedTasks.length,
        capacityHours: emp.capacityHours,
        workloadScore: score,
        workloadState: state,
        factors
      };
    });

    const criticalCases = reportData.filter(r => r.workloadState === 'CRITICAL' || r.workloadState === 'HIGH');

    return res.json({
      allEmployees: reportData,
      criticalCases
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate workload report' });
  }
}

export async function getRiskReport(req, res) {
  try {
    const goals = await prisma.goal.findMany({
      include: {
        owner: true,
        riskAssessments: { orderBy: { timestamp: 'desc' }, take: 1 },
        milestones: { include: { tasks: true } }
      }
    });

    const riskData = goals.map(g => {
      const latestRisk = g.riskAssessments[0];
      const tasks = g.milestones.flatMap(m => m.tasks);
      const delayed = tasks.filter(t => t.status === 'DELAYED' || (t.status !== 'COMPLETED' && new Date(t.deadline) < new Date()));
      return {
        goalId: g.id,
        title: g.title,
        level: g.level,
        status: g.status,
        owner: g.owner ? g.owner.name : 'Unassigned',
        riskLevel: latestRisk ? latestRisk.riskLevel : 'LOW',
        riskScore: latestRisk ? latestRisk.score : 10,
        reasons: latestRisk ? JSON.parse(latestRisk.reasonsJson || '[]') : [],
        totalTasks: tasks.length,
        delayedTasks: delayed.length
      };
    });

    const highRiskGoals = riskData.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM');

    return res.json({
      allGoals: riskData,
      highRiskGoals
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate risk report' });
  }
}
