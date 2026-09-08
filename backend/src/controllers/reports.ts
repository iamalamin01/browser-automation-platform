import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getReports(req: Request, res: Response): Promise<void> {
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [runs, total] = await Promise.all([
    prisma.testRun.findMany({
      where,
      include: {
        task: {
          include: {
            profile: { select: { profileId: true, name: true } },
            testUser: { select: { userId: true, firstName: true, lastName: true } },
            scenario: { select: { name: true, targetUrl: true } },
          },
        },
        screenshots: { select: { id: true, filename: true, type: true, takenAt: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { startedAt: 'desc' },
    }),
    prisma.testRun.count({ where }),
  ]);

  res.json({ runs, total, page: Number(page), limit: Number(limit) });
}

export async function getReport(req: Request, res: Response): Promise<void> {
  const run = await prisma.testRun.findUnique({
    where: { id: req.params.runId },
    include: {
      task: {
        include: {
          profile: true,
          testUser: true,
          scenario: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        },
      },
      logs: { orderBy: { timestamp: 'asc' } },
      networkLogs: { orderBy: { timestamp: 'asc' } },
      screenshots: true,
    },
  });

  if (!run) {
    res.status(404).json({ error: 'Test run not found' });
    return;
  }

  // Build summary report
  const summary = {
    runId: run.id,
    test: run.task.scenario.name,
    profile: run.task.profile.profileId,
    user: run.task.testUser
      ? `${run.task.testUser.firstName} ${run.task.testUser.lastName}`
      : null,
    status: run.status,
    totalSteps: run.totalSteps,
    passedSteps: run.passedSteps,
    failedSteps: run.failedSteps,
    duration: run.duration,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    errors: run.logs.filter((l) => l.level === 'ERROR'),
    screenshotCount: run.screenshots.length,
    consoleErrorCount: run.logs.filter((l) => l.source === 'CONSOLE' && l.level === 'ERROR').length,
    networkErrorCount: run.networkLogs.filter((n) => n.isError).length,
  };

  res.json({ run, summary });
}

export async function getRunLogs(req: Request, res: Response): Promise<void> {
  const { level, source } = req.query;
  const where: Record<string, unknown> = { runId: req.params.runId };
  if (level) where.level = level;
  if (source) where.source = source;

  const logs = await prisma.testLog.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });

  res.json(logs);
}

export async function getNetworkLogs(req: Request, res: Response): Promise<void> {
  const { errorsOnly } = req.query;
  const where: Record<string, unknown> = { runId: req.params.runId };
  if (errorsOnly === 'true') where.isError = true;

  const logs = await prisma.networkLog.findMany({
    where,
    orderBy: { timestamp: 'asc' },
  });

  res.json(logs);
}

export async function getScreenshots(req: Request, res: Response): Promise<void> {
  const screenshots = await prisma.screenshot.findMany({
    where: { runId: req.params.runId },
    orderBy: { takenAt: 'asc' },
  });

  res.json(screenshots);
}
