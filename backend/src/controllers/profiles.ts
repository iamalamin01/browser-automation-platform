import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';

// Helper: generate sequential profile ID
async function generateProfileId(): Promise<string> {
  const count = await prisma.browserProfile.count();
  return `profile_${String(count + 1).padStart(3, '0')}`;
}

export async function getProfiles(req: Request, res: Response): Promise<void> {
  const { status, search, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { profileId: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.browserProfile.findMany({
      where,
      include: { testUser: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.browserProfile.count({ where }),
  ]);

  res.json({ profiles, total, page: Number(page), limit: Number(limit) });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await prisma.browserProfile.findUnique({
    where: { id: req.params.id },
    include: { testUser: true, automationTasks: { take: 10, orderBy: { createdAt: 'desc' } } },
  });

  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
}

export async function createProfile(req: Request, res: Response): Promise<void> {
  const { name, browserType, userAgent, notes, testUserId } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Profile name is required' });
    return;
  }

  const profileId = await generateProfileId();
  const profile = await prisma.browserProfile.create({
    data: { profileId, name, browserType, userAgent, notes, testUserId },
    include: { testUser: true },
  });

  res.status(201).json(profile);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { name, browserType, userAgent, notes, testUserId, status } = req.body;

  const profile = await prisma.browserProfile.update({
    where: { id: req.params.id },
    data: { name, browserType, userAgent, notes, testUserId, status },
    include: { testUser: true },
  });

  res.json(profile);
}

export async function deleteProfile(req: Request, res: Response): Promise<void> {
  await prisma.browserProfile.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function duplicateProfile(req: Request, res: Response): Promise<void> {
  const original = await prisma.browserProfile.findUnique({ where: { id: req.params.id } });
  if (!original) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const profileId = await generateProfileId();
  const copy = await prisma.browserProfile.create({
    data: {
      profileId,
      name: `${original.name} (Copy)`,
      browserType: original.browserType,
      userAgent: original.userAgent ?? undefined,
      notes: original.notes ?? undefined,
    },
  });

  res.status(201).json(copy);
}

export async function startProfile(req: Request, res: Response): Promise<void> {
  const profile = await prisma.browserProfile.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
  });
  res.json(profile);
}

export async function stopProfile(req: Request, res: Response): Promise<void> {
  const profile = await prisma.browserProfile.update({
    where: { id: req.params.id },
    data: { status: 'STOPPED' },
  });
  res.json(profile);
}
