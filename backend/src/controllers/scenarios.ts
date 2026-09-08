import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getScenarios(req: Request, res: Response): Promise<void> {
  const { search, environment, enabled, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (environment) where.environment = environment;
  if (enabled !== undefined) where.isEnabled = enabled === 'true';
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const [scenarios, total] = await Promise.all([
    prisma.testScenario.findMany({
      where,
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        _count: { select: { automationTasks: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.testScenario.count({ where }),
  ]);

  res.json({ scenarios, total, page: Number(page), limit: Number(limit) });
}

export async function getScenario(req: Request, res: Response): Promise<void> {
  const scenario = await prisma.testScenario.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  if (!scenario) {
    res.status(404).json({ error: 'Scenario not found' });
    return;
  }
  res.json(scenario);
}

export async function createScenario(req: Request, res: Response): Promise<void> {
  const { name, description, targetUrl, environment, authMethod, timeout, retryCount, steps } =
    req.body;

  if (!name || !targetUrl) {
    res.status(400).json({ error: 'name and targetUrl are required' });
    return;
  }

  const scenario = await prisma.testScenario.create({
    data: {
      name,
      description,
      targetUrl,
      environment,
      authMethod,
      timeout: timeout || 30000,
      retryCount: retryCount || 1,
      steps: steps
        ? {
            create: steps.map((s: Record<string, unknown>, idx: number) => ({
              stepOrder: Number(s.stepOrder) || idx + 1,
              action: s.action,
              selector: s.selector || null,
              value: s.value || null,
              expectedResult: s.expectedResult || null,
              timeout: s.timeout ? Number(s.timeout) : null,
              description: s.description || null,
            })),
          }
        : undefined,
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  res.status(201).json(scenario);
}

export async function updateScenario(req: Request, res: Response): Promise<void> {
  const { name, description, targetUrl, environment, authMethod, timeout, retryCount, steps } =
    req.body;

  // Replace all steps
  const scenario = await prisma.$transaction(async (tx) => {
    await tx.testStep.deleteMany({ where: { scenarioId: req.params.id } });

    return tx.testScenario.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        targetUrl,
        environment,
        authMethod,
        timeout,
        retryCount,
        steps: steps
          ? {
              create: steps.map((s: Record<string, unknown>, idx: number) => ({
                stepOrder: Number(s.stepOrder) || idx + 1,
                action: s.action,
                selector: s.selector || null,
                value: s.value || null,
                expectedResult: s.expectedResult || null,
                timeout: s.timeout ? Number(s.timeout) : null,
                description: s.description || null,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  });

  res.json(scenario);
}

export async function deleteScenario(req: Request, res: Response): Promise<void> {
  await prisma.testScenario.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function toggleScenario(req: Request, res: Response): Promise<void> {
  const scenario = await prisma.testScenario.findUnique({ where: { id: req.params.id } });
  if (!scenario) {
    res.status(404).json({ error: 'Scenario not found' });
    return;
  }

  const updated = await prisma.testScenario.update({
    where: { id: req.params.id },
    data: { isEnabled: !scenario.isEnabled },
  });

  res.json(updated);
}
