import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markAllNotificationsAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
}
