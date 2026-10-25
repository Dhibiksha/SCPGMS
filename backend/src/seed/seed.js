import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateWorkload } from '../intelligence/workload-engine/index.js';
import { evaluateGoalRisk } from '../intelligence/risk-engine/index.js';
import { generateRecommendations } from '../intelligence/recommendation-engine/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SCPGMS Database...');

  // Clean existing database records
  await prisma.recommendationOutcome.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.impactChain.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.productivityRecord.deleteMany();
  await prisma.workloadRecord.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.employee.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Skills
  const jsSkill = await prisma.skill.create({ data: { name: 'JavaScript / Node.js' } });
  const reactSkill = await prisma.skill.create({ data: { name: 'React / Frontend' } });
  const dbSkill = await prisma.skill.create({ data: { name: 'Database Architecture' } });
  const systemSkill = await prisma.skill.create({ data: { name: 'System Design' } });

  // 2. Create Employees
  // Employee A: Alex Rivera (Overloaded Senior Engineer)
  const empA = await prisma.employee.create({
    data: {
      name: 'Alex Rivera',
      designation: 'Senior Systems Engineer',
      capacityHours: 40.0,
      availability: true
    }
  });

  // Employee B: Sarah Chen (Available Fullstack Engineer)
  const empB = await prisma.employee.create({
    data: {
      name: 'Sarah Chen',
      designation: 'Full Stack Engineer',
      capacityHours: 40.0,
      availability: true
    }
  });

  // Employee C: Marcus Vance (Manager)
  const empC = await prisma.employee.create({
    data: {
      name: 'Marcus Vance',
      designation: 'Engineering Director',
      capacityHours: 40.0,
      availability: true
    }
  });

  // Admin User: Elena Rostova
  const empAdmin = await prisma.employee.create({
    data: {
      name: 'Elena Rostova',
      designation: 'VP of Operations (Admin)',
      capacityHours: 40.0,
      availability: true
    }
  });

  // 3. Create Departments & Link Managers
  const engDept = await prisma.department.create({
    data: {
      name: 'Engineering & Infrastructure',
      managerId: empC.id
    }
  });

  const productDept = await prisma.department.create({
    data: {
      name: 'Product & Design',
      managerId: empC.id
    }
  });

  // Assign employees to departments
  await prisma.employee.update({ where: { id: empA.id }, data: { departmentId: engDept.id } });
  await prisma.employee.update({ where: { id: empB.id }, data: { departmentId: engDept.id } });
  await prisma.employee.update({ where: { id: empC.id }, data: { departmentId: engDept.id } });
  await prisma.employee.update({ where: { id: empAdmin.id }, data: { departmentId: productDept.id } });

  // 4. Assign Skills
  await prisma.employeeSkill.createMany({
    data: [
      { employeeId: empA.id, skillId: dbSkill.id, proficiency: 'EXPERT' },
      { employeeId: empA.id, skillId: systemSkill.id, proficiency: 'ADVANCED' },
      { employeeId: empB.id, skillId: dbSkill.id, proficiency: 'ADVANCED' },
      { employeeId: empB.id, skillId: jsSkill.id, proficiency: 'EXPERT' },
      { employeeId: empB.id, skillId: reactSkill.id, proficiency: 'EXPERT' }
    ]
  });

  // 5. Create Users (Credentials for testing)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@corporate.com',
      passwordHash,
      role: 'ADMIN',
      employeeId: empAdmin.id
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@corporate.com',
      passwordHash,
      role: 'MANAGER',
      employeeId: empC.id
    }
  });

  const empUserA = await prisma.user.create({
    data: {
      email: 'alex@corporate.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empA.id
    }
  });

  const empUserB = await prisma.user.create({
    data: {
      email: 'sarah@corporate.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empB.id
    }
  });

  // 6. Create Goal Hierarchy
  // Top Level: Corporate Goal
  const corpGoal = await prisma.goal.create({
    data: {
      title: 'Q3 Enterprise Digital Platform Modernization',
      description: 'Scale architecture to handle 5x user throughput with zero downtime.',
      priority: 'CRITICAL',
      level: 'Corporate',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ownerId: empC.id,
      status: 'IN_PROGRESS'
    }
  });

  // Level 2: Department Goal
  const deptGoal = await prisma.goal.create({
    data: {
      title: 'High-Throughput Core Database & API Services',
      description: 'Refactor database indexing, query execution engine, and caching layers.',
      priority: 'HIGH',
      level: 'Department',
      parentGoalId: corpGoal.id,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      ownerId: empC.id,
      status: 'AT_RISK'
    }
  });

  // Level 3: Team Goal
  const teamGoal = await prisma.goal.create({
    data: {
      title: 'Database Engine Optimization & Real-Time Sync',
      description: 'Implement distributed locking and optimize query latency.',
      priority: 'CRITICAL',
      level: 'Team',
      parentGoalId: deptGoal.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ownerId: empA.id,
      status: 'AT_RISK'
    }
  });

  // 7. Milestones
  const m1 = await prisma.milestone.create({
    data: {
      goalId: teamGoal.id,
      title: 'Phase 1: Core Database Sharding & Index Tuning',
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS'
    }
  });

  const m2 = await prisma.milestone.create({
    data: {
      goalId: teamGoal.id,
      title: 'Phase 2: Real-time API & Middleware Integration',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'NOT_STARTED'
    }
  });

  // 8. Create Tasks for Demo Scenario
  // Task 1: Assigned to Alex (Employee A), Delayed, High Priority, High Complexity
  const task1 = await prisma.task.create({
    data: {
      milestoneId: m1.id,
      title: 'Core Database Sharding & Query Optimization',
      description: 'Heavy architectural refactoring of SQL engine indexes.',
      assignedEmployeeId: empA.id,
      priority: 'CRITICAL',
      complexity: 'HIGH',
      estimatedEffort: 36.0,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Past deadline (Delayed!)
      status: 'DELAYED',
      progressPct: 35.0
    }
  });

  // Additional tasks assigned to Alex (Employee A) to inflate workload to CRITICAL (>85)
  const taskA2 = await prisma.task.create({
    data: {
      milestoneId: m1.id,
      title: 'Legacy Data Migration & ETL Validation',
      description: 'Cleanse and validate 50M legacy database records.',
      assignedEmployeeId: empA.id,
      priority: 'HIGH',
      complexity: 'HIGH',
      estimatedEffort: 24.0,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      progressPct: 15.0
    }
  });

  const taskA3 = await prisma.task.create({
    data: {
      milestoneId: m1.id,
      title: 'System Failover & Disaster Recovery Protocol',
      description: 'Write automated failover scripts for multi-region nodes.',
      assignedEmployeeId: empA.id,
      priority: 'HIGH',
      complexity: 'HIGH',
      estimatedEffort: 20.0,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      progressPct: 10.0
    }
  });

  // Task 2: Assigned to Alex (Employee A) - Dependent on Task 1
  const task2 = await prisma.task.create({
    data: {
      milestoneId: m2.id,
      title: 'API Gateway Connector for DB Clusters',
      description: 'Expose optimized DB connection pool via REST API.',
      assignedEmployeeId: empA.id,
      priority: 'HIGH',
      complexity: 'MEDIUM',
      estimatedEffort: 16.0,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: 'BLOCKED',
      progressPct: 0.0
    }
  });

  // Task 3: Assigned to Sarah (Employee B) - Light workload
  const task3 = await prisma.task.create({
    data: {
      milestoneId: m2.id,
      title: 'Frontend API Client Caching Layer',
      description: 'Cache server response objects in memory on frontend.',
      assignedEmployeeId: empB.id,
      priority: 'MEDIUM',
      complexity: 'MEDIUM',
      estimatedEffort: 8.0,
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      progressPct: 60.0
    }
  });

  // 9. Create Dependencies (Task 2 depends on Task 1)
  await prisma.taskDependency.create({
    data: {
      taskId: task2.id,
      dependsOnTaskId: task1.id
    }
  });

  // 10. Initial Workload Calculation
  const allDeps = await prisma.taskDependency.findMany();
  const tasksA = [task1, taskA2, taskA3, task2];
  const wlA = calculateWorkload(empA, tasksA, allDeps);

  await prisma.workloadRecord.create({
    data: {
      employeeId: empA.id,
      score: wlA.score,
      state: wlA.state,
      activeTasks: wlA.activeTasksCount,
      factorsJson: JSON.stringify(wlA.factors)
    }
  });

  const tasksB = [task3];
  const wlB = calculateWorkload(empB, tasksB, allDeps);

  await prisma.workloadRecord.create({
    data: {
      employeeId: empB.id,
      score: wlB.score,
      state: wlB.state,
      activeTasks: wlB.activeTasksCount,
      factorsJson: JSON.stringify(wlB.factors)
    }
  });

  // 11. Initial Goal Risk Calculation
  const wlMap = new Map([[empA.id, wlA], [empB.id, wlB]]);
  const riskEval = evaluateGoalRisk(teamGoal, [m1, m2], [task1, taskA2, taskA3, task2, task3], wlMap, allDeps);

  await prisma.riskAssessment.create({
    data: {
      goalId: teamGoal.id,
      riskLevel: riskEval.riskLevel,
      score: riskEval.score,
      reasonsJson: JSON.stringify(riskEval.reasons)
    }
  });

  // 12. Generate Pre-seeded Recommendation for Demo
  const empSkillsMap = new Map([
    [empA.id, [{ skill: dbSkill, proficiency: 'EXPERT' }]],
    [empB.id, [{ skill: dbSkill, proficiency: 'ADVANCED' }, { skill: jsSkill, proficiency: 'EXPERT' }]]
  ]);
  const wlRecordsMap = new Map([[empA.id, wlA], [empB.id, wlB]]);

  const recs = generateRecommendations([teamGoal], [task1, taskA2, taskA3, task2, task3], [empA, empB], empSkillsMap, wlRecordsMap, allDeps);

  for (const r of recs) {
    await prisma.recommendation.create({
      data: {
        goalId: teamGoal.id,
        taskId: r.taskId,
        type: r.type,
        targetEmployeeId: r.targetEmployeeId,
        reasonJson: r.reasonJson,
        status: 'PENDING'
      }
    });
  }

  // 13. Audit Log & Notification for initialization
  await prisma.auditLog.create({
    data: {
      userId: managerUser.id,
      action: 'DEMO_SEED_INITIALIZED',
      entityType: 'System',
      detailsJson: JSON.stringify({ scenario: 'Alex Rivera overloaded, Sarah Chen available candidate' })
    }
  });

  await prisma.notification.create({
    data: {
      userId: managerUser.id,
      type: 'GOAL_RISK_ALERT',
      message: `Goal "${teamGoal.title}" is AT RISK (${riskEval.score}/100). Recommendation generated to reassign task.`
    }
  });

  console.log('SCPGMS Seed Completed Successfully!');
  console.log(`Demo Credentials:`);
  console.log(`- ADMIN: admin@corporate.com / password123`);
  console.log(`- MANAGER: manager@corporate.com / password123`);
  console.log(`- EMPLOYEE A (Overloaded): alex@corporate.com / password123`);
  console.log(`- EMPLOYEE B (Available): sarah@corporate.com / password123`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
