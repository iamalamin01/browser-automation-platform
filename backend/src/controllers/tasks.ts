import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { automationQueue } from '../utils/bullBoard';
import { AuthRequest } from '../middleware/auth';

async function generateTaskId(): Promise<string> {
  const count = await prisma.automationTask.count();
  return `TASK-${String(count + 1).padStart(3, '0')}`;
}

export async function getTasks(req: Request, res: Response): Promise<void> {
  const { status, profileId, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (profileId) where.profileId = profileId;

  const [tasks, total] = await Promise.all([
    prisma.automationTask.findMany({
      where,
      include: {
        profile: { select: { id: true, profileId: true, name: true } },
        testUser: { select: { id: true, userId: true, firstName: true, lastName: true } },
        scenario: { select: { id: true, name: true, targetUrl: true } },
        testRuns: { take: 1, orderBy: { startedAt: 'desc' } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.automationTask.count({ where }),
  ]);

  res.json({ tasks, total, page: Number(page), limit: Number(limit) });
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.automationTask.findUnique({
    where: { id: req.params.id },
    include: {
      profile: true,
      testUser: true,
      scenario: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      testRuns: {
        orderBy: { startedAt: 'desc' },
        include: {
          logs: { orderBy: { timestamp: 'asc' } },
          networkLogs: { orderBy: { timestamp: 'asc' } },
          screenshots: true,
        },
      },
    },
  });

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const { profileId, testUserId, scenarioId, priority = 0 } = req.body;

  if (!profileId || !scenarioId) {
    res.status(400).json({ error: 'profileId and scenarioId are required' });
    return;
  }

  const taskId = await generateTaskId();
  const task = await prisma.automationTask.create({
    data: {
      taskId,
      profileId,
      testUserId,
      scenarioId,
      createdBy: req.user?.id,
      priority: Number(priority),
      status: 'PENDING',
    },
    include: {
      profile: true,
      testUser: true,
      scenario: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
    },
  });

  res.status(201).json(task);
}

export async function startTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.automationTask.findUnique({
    where: { id: req.params.id },
    include: {
      scenario: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      testUser: true,
      profile: true,
    },
  });

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (['RUNNING', 'QUEUED'].includes(task.status)) {
    res.status(400).json({ error: 'Task is already running or queued' });
    return;
  }

  // Add to BullMQ queue
  const job = await automationQueue.add(
    'run-automation',
    { taskId: task.id },
    { priority: task.priority }
  );

  await prisma.automationTask.update({
    where: { id: task.id },
    data: { status: 'QUEUED' },
  });

  res.json({ message: 'Task queued', jobId: job.id, taskId: task.id });
}

export async function stopTask(req: Request, res: Response): Promise<void> {
  const task = await prisma.automationTask.update({
    where: { id: req.params.id },
    data: { status: 'STOPPED', finishedAt: new Date() },
  });

  res.json(task);
}

export async function retryTask(req: Request, res: Response): Promise<void> {
  const original = await prisma.automationTask.findUnique({ where: { id: req.params.id } });
  if (!original) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const taskId = await generateTaskId();
  const newTask = await prisma.automationTask.create({
    data: {
      taskId,
      profileId: original.profileId,
      testUserId: original.testUserId,
      scenarioId: original.scenarioId,
      createdBy: original.createdBy,
      status: 'PENDING',
    },
  });

  await automationQueue.add('run-automation', { taskId: newTask.id });
  await prisma.automationTask.update({ where: { id: newTask.id }, data: { status: 'QUEUED' } });

  res.status(201).json(newTask);
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  await prisma.automationTask.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
