import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateWorkload } from '../intelligence/workload-engine/index.js';
import { calculateProductivity } from '../intelligence/productivity-engine/index.js';

const prisma = new PrismaClient();

export async function getEmployees(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        skills: { include: { skill: true } },
        user: { select: { email: true, role: true } }
      }
    });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
}

export async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        skills: { include: { skill: true } },
        user: { select: { email: true, role: true } },
        assignedTasks: { include: { milestone: { include: { goal: true } } } },
        workloadRecords: { orderBy: { timestamp: 'desc' }, take: 10 },
        productivityRecords: { orderBy: { timestamp: 'desc' }, take: 10 }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch employee' });
  }
}

export async function createEmployee(req, res) {
  try {
    const { name, email, password, role, departmentId, designation, capacityHours } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          name,
          departmentId: departmentId || null,
          designation: designation || 'Staff Member',
          capacityHours: capacityHours ? parseFloat(capacityHours) : 40.0,
          availability: true
        }
      });

      const usr = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          employeeId: emp.id
        }
      });

      return { emp, usr };
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EMPLOYEE_CREATE',
        entityType: 'Employee',
        entityId: result.emp.id,
        detailsJson: JSON.stringify({ name, email, role, designation })
      }
    });

    return res.status(201).json(result.emp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create employee' });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { name, departmentId, designation, capacityHours, availability } = req.body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        departmentId,
        designation,
        capacityHours: capacityHours ? parseFloat(capacityHours) : undefined,
        availability: availability !== undefined ? Boolean(availability) : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EMPLOYEE_UPDATE',
        entityType: 'Employee',
        entityId: id,
        detailsJson: JSON.stringify(req.body)
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update employee' });
  }
}

export async function getEmployeeWorkload(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const assignedTasks = await prisma.task.findMany({ where: { assignedEmployeeId: id } });
    const allDeps = await prisma.taskDependency.findMany();
    const historicalTasks = await prisma.task.findMany({
      where: { assignedEmployeeId: id, status: { in: ['COMPLETED', 'DELAYED'] } }
    });

    const wl = calculateWorkload(employee, assignedTasks, allDeps, historicalTasks);

    // Save record to DB
    await prisma.workloadRecord.create({
      data: {
        employeeId: id,
        score: wl.score,
        state: wl.state,
        activeTasks: wl.activeTasksCount,
        factorsJson: JSON.stringify(wl.factors)
      }
    });

    return res.json(wl);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate workload' });
  }
}

export async function getEmployeeProductivity(req, res) {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const assignedTasks = await prisma.task.findMany({ where: { assignedEmployeeId: id } });
    const latestWorkload = await prisma.workloadRecord.findFirst({
      where: { employeeId: id },
      orderBy: { timestamp: 'desc' }
    });

    const prod = calculateProductivity(employee, assignedTasks, latestWorkload ? latestWorkload.score : 50);

    // Save record to DB
    await prisma.productivityRecord.create({
      data: {
        employeeId: id,
        score: prod.score,
        factorsJson: JSON.stringify(prod.factors)
      }
    });

    return res.json(prod);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate productivity' });
  }
}
