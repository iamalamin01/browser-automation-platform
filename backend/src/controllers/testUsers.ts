import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const FAKER_API = process.env.FAKER_API_URL || 'https://faker.tatsuyo.xyz/faker_app/user/generate.php';

async function generateProfileId(): Promise<string> {
  const count = await prisma.testUser.count();
  return `USER-${String(count + 1).padStart(3, '0')}`;
}

async function fetchFakerUser() {
  try {
    const response = await axios.get(FAKER_API, { timeout: 10000 });
    return response.data;
  } catch (err) {
    logger.warn('Faker API unavailable, generating fallback user data');
    // Fallback synthetic data
    const id = Math.floor(Math.random() * 9000) + 1000;
    return {
      first_name: `Test${id}`,
      last_name: `User${id}`,
      email: `testuser${id}@example.test`,
      gender: 'unknown',
      dob: '1990-01-01',
      phone: `+1-555-${id}`,
      username: `testuser${id}`,
      password: `Pass${id}!`,
      address: 'Test City, Test State',
    };
  }
}

function mapFakerData(raw: Record<string, string>) {
  return {
    firstName: raw.first_name || raw.firstName || 'Test',
    lastName: raw.last_name || raw.lastName || 'User',
    email: raw.email || '',
    gender: raw.gender || null,
    dateOfBirth: raw.dob ? new Date(raw.dob) : null,
    phone: raw.phone || null,
    username: raw.username || null,
    password: raw.password || null,
    location: raw.address || raw.location || null,
    avatarUrl: raw.avatar || raw.picture || null,
    rawData: raw,
  };
}

export async function getTestUsers(req: Request, res: Response): Promise<void> {
  const { status, search, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: String(search), mode: 'insensitive' } },
      { lastName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { userId: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.testUser.findMany({
      where,
      include: { browserProfiles: { select: { id: true, profileId: true, name: true } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.testUser.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), limit: Number(limit) });
}

export async function getTestUser(req: Request, res: Response): Promise<void> {
  const user = await prisma.testUser.findUnique({
    where: { id: req.params.id },
    include: { browserProfiles: true },
  });
  if (!user) {
    res.status(404).json({ error: 'Test user not found' });
    return;
  }
  res.json(user);
}

export async function generateUser(_req: Request, res: Response): Promise<void> {
  const raw = await fetchFakerUser();
  const mapped = mapFakerData(raw);
  const userId = await generateProfileId();

  const user = await prisma.testUser.create({
    data: { userId, ...mapped },
  });

  res.status(201).json(user);
}

export async function generateMultipleUsers(req: Request, res: Response): Promise<void> {
  const { count = 5 } = req.body;
  const num = Math.min(Number(count), 50); // max 50 at once

  const users = [];
  for (let i = 0; i < num; i++) {
    const raw = await fetchFakerUser();
    const mapped = mapFakerData(raw);
    const userId = await generateProfileId();
    const user = await prisma.testUser.create({ data: { userId, ...mapped } });
    users.push(user);
  }

  res.status(201).json({ created: users.length, users });
}

export async function updateTestUser(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, email, gender, phone, username, location, status } = req.body;

  const user = await prisma.testUser.update({
    where: { id: req.params.id },
    data: { firstName, lastName, email, gender, phone, username, location, status },
  });

  res.json(user);
}

export async function deleteTestUser(req: Request, res: Response): Promise<void> {
  await prisma.testUser.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function assignToProfile(req: Request, res: Response): Promise<void> {
  const { profileId } = req.body;
  if (!profileId) {
    res.status(400).json({ error: 'profileId required' });
    return;
  }

  await prisma.browserProfile.update({
    where: { id: profileId },
    data: { testUserId: req.params.id },
  });

  const user = await prisma.testUser.update({
    where: { id: req.params.id },
    data: { status: 'ASSIGNED' },
    include: { browserProfiles: true },
  });

  res.json(user);
}
