import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: true,
        employees: true
      }
    });
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, managerId } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const dept = await prisma.department.create({
      data: {
        name,
        managerId: managerId || null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DEPARTMENT_CREATE',
        entityType: 'Department',
        entityId: dept.id,
        detailsJson: JSON.stringify({ name, managerId })
      }
    });

    return res.status(201).json(dept);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create department' });
  }
}

export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, managerId } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name,
        managerId: managerId || null
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update department' });
  }
}
