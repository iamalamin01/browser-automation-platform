import { PrismaClient, UserRole, Environment, StepAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@browserauto.local' },
    update: {},
    create: {
      email: 'admin@browserauto.local',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Demo browser profile
  const profile = await prisma.browserProfile.upsert({
    where: { profileId: 'profile_001' },
    update: {},
    create: {
      profileId: 'profile_001',
      name: 'Demo Profile 001',
      browserType: 'CHROMIUM',
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  console.log('✅ Demo browser profile created:', profile.profileId);

  // Demo scenario
  const scenario = await prisma.testScenario.create({
    data: {
      name: 'Registration Flow Test',
      description: 'Tests the full user registration flow on the target site',
      targetUrl: 'https://staging.example.com/register',
      environment: Environment.STAGING,
      timeout: 30000,
      retryCount: 2,
      steps: {
        create: [
          {
            stepOrder: 1,
            action: StepAction.NAVIGATE,
            value: 'https://staging.example.com/register',
            description: 'Open registration page',
          },
          {
            stepOrder: 2,
            action: StepAction.FILL,
            selector: '#firstName',
            value: '{{user.firstName}}',
            description: 'Enter first name',
          },
          {
            stepOrder: 3,
            action: StepAction.FILL,
            selector: '#email',
            value: '{{user.email}}',
            description: 'Enter email',
          },
          {
            stepOrder: 4,
            action: StepAction.FILL,
            selector: '#password',
            value: '{{user.password}}',
            description: 'Enter password',
          },
          {
            stepOrder: 5,
            action: StepAction.CLICK,
            selector: 'button[type="submit"]',
            description: 'Submit form',
          },
          {
            stepOrder: 6,
            action: StepAction.WAIT_FOR_URL,
            value: '/dashboard',
            description: 'Wait for redirect to dashboard',
          },
          {
            stepOrder: 7,
            action: StepAction.SCREENSHOT,
            description: 'Take success screenshot',
          },
        ],
      },
    },
  });
  console.log('✅ Demo scenario created:', scenario.name);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
