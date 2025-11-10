import { prisma } from '@/lib/prisma';

export async function logAudit(
  action: string,
  entity: string,
  entityId: string,
  userId?: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.auditLog.create({
    data: {
      userId: userId || null,
      action,
      entity,
      entityId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent,
    },
  });
}