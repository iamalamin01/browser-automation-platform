import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [
    totalProfiles,
    activeProfiles,
    totalTestUsers,
    runningTasks,
    completedTasks,
    failedTasks,
    pendingTasks,
    recentTasks,
    recentErrors,
  ] = await Promise.all([
    prisma.browserProfile.count(),
    prisma.browserProfile.count({ where: { status: { in: ['ACTIVE', 'RUNNING'] } } }),
    prisma.testUser.count(),
    prisma.automationTask.count({ where: { status: 'RUNNING' } }),
    prisma.automationTask.count({ where: { status: 'COMPLETED' } }),
    prisma.automationTask.count({ where: { status: 'FAILED' } }),
    prisma.automationTask.count({ where: { status: 'PENDING' } }),
    prisma.automationTask.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { profileId: true, name: true } },
        scenario: { select: { name: true } },
        testRuns: { take: 1, orderBy: { startedAt: 'desc' }, select: { status: true } },
      },
    }),
    prisma.testLog.findMany({
      where: { level: 'ERROR' },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { run: { select: { taskId: true } } },
    }),
  ]);

  res.json({
    profiles: { total: totalProfiles, active: activeProfiles },
    tasks: {
      running: runningTasks,
      completed: completedTasks,
      failed: failedTasks,
      pending: pendingTasks,
    },
    testUsers: { total: totalTestUsers },
    recentTasks,
    recentErrors,
  });
}
