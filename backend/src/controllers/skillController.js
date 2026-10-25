import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSkills(req, res) {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        employeeSkills: {
          include: { employee: true }
        }
      }
    });
    return res.json(skills);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch skills' });
  }
}

export async function createSkill(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required' });

    const skill = await prisma.skill.create({
      data: { name }
    });

    return res.status(201).json(skill);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create skill' });
  }
}

export async function assignEmployeeSkill(req, res) {
  try {
    const { id } = req.params; // employeeId
    const { skillId, proficiency } = req.body;

    if (!skillId || !proficiency) {
      return res.status(400).json({ error: 'Skill ID and proficiency are required' });
    }

    const empSkill = await prisma.employeeSkill.upsert({
      where: {
        employeeId_skillId: {
          employeeId: id,
          skillId
        }
      },
      update: { proficiency },
      create: {
        employeeId: id,
        skillId,
        proficiency
      }
    });

    return res.json(empSkill);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to assign skill to employee' });
  }
}
