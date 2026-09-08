import { Worker, Job } from 'bullmq';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import redis from '../utils/redis';
import logger from '../utils/logger';
import { AUTOMATION_QUEUE_NAME } from '../utils/bullBoard';

const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || path.join(__dirname, '../../uploads/screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ─── Worker ───────────────────────────────────────────────────────────────────
const worker = new Worker(
  AUTOMATION_QUEUE_NAME,
  async (job: Job) => {
    const { taskId } = job.data as { taskId: string };
    logger.info(`[Worker] Starting job ${job.id} for task ${taskId}`);
    await runAutomation(taskId);
  },
  {
    connection: redis,
    concurrency: 3,
  }
);

worker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

logger.info('🤖 Playwright Worker started, waiting for jobs...');

// ─── Main Automation Runner ────────────────────────────────────────────────────
async function runAutomation(taskId: string): Promise<void> {
  const task = await prisma.automationTask.findUnique({
    where: { id: taskId },
    include: {
      profile: true,
      testUser: true,
      scenario: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
    },
  });

  if (!task) {
    logger.error(`[Worker] Task ${taskId} not found`);
    return;
  }

  // Create test run record
  const run = await prisma.testRun.create({
    data: {
      taskId: task.id,
      totalSteps: task.scenario.steps.length,
      status: 'RUNNING',
    },
  });

  // Mark task as running
  await prisma.automationTask.update({
    where: { id: taskId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let passedSteps = 0;
  let failedSteps = 0;
  let overallStatus: 'PASSED' | 'FAILED' | 'ERROR' = 'PASSED';

  async function addLog(
    message: string,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO',
    source: 'APP' | 'BROWSER' | 'CONSOLE' | 'NETWORK' | 'STEP' = 'APP',
    stepOrder?: number
  ) {
    logger.log(level.toLowerCase(), `[Run:${run.id}] ${message}`);
    await prisma.testLog.create({
      data: { runId: run.id, level, source, message, stepOrder },
    });
  }

  try {
    await addLog('Browser starting...');

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Apply profile user-agent if set
    const contextOptions: Record<string, unknown> = {};
    if (task.profile.userAgent) {
      contextOptions.userAgent = task.profile.userAgent;
    }
    if (task.profile.cookies) {
      contextOptions.storageState = { cookies: task.profile.cookies as never[], origins: [] };
    }

    context = await browser.newContext(contextOptions);

    // Capture console logs
    context.on('page', (p) => {
      p.on('console', async (msg) => {
        const level = msg.type() === 'error' ? 'ERROR' : 'INFO';
        await addLog(`[Console] ${msg.text()}`, level, 'CONSOLE').catch(() => {});
      });
    });

    page = await context.newPage();
    await addLog('Browser started successfully');

    // Capture network logs
    page.on('response', async (response) => {
      const status = response.status();
      const isError = status >= 400;
      await prisma.networkLog.create({
        data: {
          runId: run.id,
          method: response.request().method(),
          url: response.url(),
          statusCode: status,
          isError,
        },
      }).catch(() => {});

      if (isError) {
        await addLog(
          `HTTP ${status} on ${response.request().method()} ${response.url()}`,
          'ERROR',
          'NETWORK'
        ).catch(() => {});
      }
    });

    // Replace template variables with actual user data
    const resolveValue = (val: string | null) => {
      if (!val || !task.testUser) return val;
      return val
        .replace(/{{user\.firstName}}/g, task.testUser.firstName)
        .replace(/{{user\.lastName}}/g, task.testUser.lastName)
        .replace(/{{user\.email}}/g, task.testUser.email)
        .replace(/{{user\.username}}/g, task.testUser.username || '')
        .replace(/{{user\.password}}/g, task.testUser.password || '');
    };

    // Execute each step
    for (const step of task.scenario.steps) {
      await addLog(
        `Step ${step.stepOrder}: [${step.action}] ${step.description || step.selector || step.value || ''}`,
        'INFO',
        'STEP',
        step.stepOrder
      );

      try {
        await executeStep(page, step, resolveValue, run.id, SCREENSHOTS_DIR);
        passedSteps++;
        await addLog(`Step ${step.stepOrder}: PASSED ✓`, 'INFO', 'STEP', step.stepOrder);
      } catch (stepErr: unknown) {
        failedSteps++;
        overallStatus = 'FAILED';
        const errMsg = stepErr instanceof Error ? stepErr.message : String(stepErr);
        await addLog(`Step ${step.stepOrder}: FAILED ✗ — ${errMsg}`, 'ERROR', 'STEP', step.stepOrder);

        // Screenshot on failure
        try {
          const filename = `fail-step${step.stepOrder}-${Date.now()}.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          await prisma.screenshot.create({
            data: {
              runId: run.id,
              filename,
              path: `/uploads/screenshots/${filename}`,
              type: 'FAILURE',
              stepOrder: step.stepOrder,
              description: `Failure screenshot at step ${step.stepOrder}`,
            },
          });
          await addLog(`Failure screenshot saved: ${filename}`, 'INFO', 'STEP', step.stepOrder);
        } catch {}

        // Stop on first failure
        break;
      }
    }

    // Final screenshot on success
    if (overallStatus === 'PASSED' && page) {
      const filename = `success-${Date.now()}.png`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await prisma.screenshot.create({
        data: {
          runId: run.id,
          filename,
          path: `/uploads/screenshots/${filename}`,
          type: 'SUCCESS',
          description: 'Final success screenshot',
        },
      });
    }
  } catch (err: unknown) {
    overallStatus = 'ERROR';
    const errMsg = err instanceof Error ? err.message : String(err);
    await addLog(`Automation error: ${errMsg}`, 'ERROR');
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { errorMsg: errMsg },
    });
  } finally {
    try {
      await page?.close();
      await context?.close();
      await browser?.close();
    } catch {}

    const duration = (Date.now() - startTime) / 1000;

    await prisma.testRun.update({
      where: { id: run.id },
      data: {
        status: overallStatus,
        passedSteps,
        failedSteps,
        duration,
        finishedAt: new Date(),
      },
    });

    await prisma.automationTask.update({
      where: { id: taskId },
      data: {
        status: overallStatus === 'PASSED' ? 'COMPLETED' : 'FAILED',
        finishedAt: new Date(),
      },
    });

    await addLog(
      `Automation finished in ${duration.toFixed(2)}s — ${overallStatus} (${passedSteps} passed, ${failedSteps} failed)`,
      overallStatus === 'PASSED' ? 'INFO' : 'ERROR'
    );
  }
}

// ─── Step Executor ─────────────────────────────────────────────────────────────
async function executeStep(
  page: Page,
  step: {
    action: string;
    selector: string | null;
    value: string | null;
    timeout: number | null;
    expectedResult: string | null;
    stepOrder: number;
  },
  resolveValue: (v: string | null) => string | null,
  runId: string,
  screenshotsDir: string
): Promise<void> {
  const timeout = step.timeout || 15000;
  const selector = step.selector || '';
  const value = resolveValue(step.value) || '';

  switch (step.action) {
    case 'NAVIGATE':
      await page.goto(value, { waitUntil: 'domcontentloaded', timeout });
      break;

    case 'CLICK':
      await page.waitForSelector(selector, { timeout });
      await page.click(selector);
      break;

    case 'FILL':
      await page.waitForSelector(selector, { timeout });
      await page.fill(selector, value);
      break;

    case 'SELECT':
      await page.waitForSelector(selector, { timeout });
      await page.selectOption(selector, value);
      break;

    case 'WAIT_FOR_ELEMENT':
      await page.waitForSelector(selector, { timeout });
      break;

    case 'WAIT_FOR_URL':
      await page.waitForURL(`**${value}`, { timeout });
      break;

    case 'ASSERT_TEXT': {
      await page.waitForSelector(selector, { timeout });
      const text = await page.textContent(selector);
      if (!text?.includes(value)) {
        throw new Error(`Expected text "${value}" not found in element "${selector}". Got: "${text}"`);
      }
      break;
    }

    case 'ASSERT_VISIBLE':
      await page.waitForSelector(selector, { state: 'visible', timeout });
      break;

    case 'ASSERT_URL': {
      const currentUrl = page.url();
      if (!currentUrl.includes(value)) {
        throw new Error(`Expected URL to contain "${value}". Current: "${currentUrl}"`);
      }
      break;
    }

    case 'SCREENSHOT': {
      const filename = `step${step.stepOrder}-${Date.now()}.png`;
      const screenshotPath = path.join(screenshotsDir, filename);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await prisma.screenshot.create({
        data: {
          runId,
          filename,
          path: `/uploads/screenshots/${filename}`,
          type: 'STEP',
          stepOrder: step.stepOrder,
        },
      });
      break;
    }

    case 'SCROLL':
      if (selector) {
        await page.locator(selector).scrollIntoViewIfNeeded({ timeout });
      } else {
        await page.evaluate(() => (window as Window & typeof globalThis).scrollBy(0, 500));
      }
      break;

    case 'HOVER':
      await page.hover(selector, { timeout });
      break;

    case 'PRESS_KEY':
      if (selector) {
        await page.press(selector, value);
      } else {
        await page.keyboard.press(value);
      }
      break;

    case 'EVALUATE':
      await page.evaluate(value);
      break;

    default:
      throw new Error(`Unknown step action: ${step.action}`);
  }
}

export default worker;
