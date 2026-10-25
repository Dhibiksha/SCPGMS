import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAuditLogs(req, res) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, role: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}
