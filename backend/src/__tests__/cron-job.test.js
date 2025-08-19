// src/__tests__/cron-job.test.js
jest.mock('node-schedule', () => ({ scheduleJob: jest.fn() }));

import { scheduleJob } from 'node-schedule';
import {
  buildCronExpression,
  schedule,
  getCurrentCron,
  cancelSchedule
} from '../cron-job.js';

describe('cron-job module', () => {
  let mockJob;
  const dummyTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockJob = { cancel: jest.fn() };
    scheduleJob.mockReturnValue(mockJob);
    console.info = jest.fn();
  });

  test('buildCronExpression()', () => {
    expect(buildCronExpression([0, 0, 0, 0])).toBe('0 0 0 * * 0');    // Sunday
    expect(buildCronExpression([3, 9, 5, 30])).toBe('30 5 9 * * 3'); // Wednesday
  });

  test('schedule() logs correct times for different config arrays', () => {
    schedule([0, 0, 0, 0], dummyTask);
    expect(console.info).toHaveBeenCalledWith(
      '[Scheduler] Scheduled for: Sunday at 00:00:00'
    );

    schedule([3, 9, 5, 30], dummyTask);
    expect(console.info).toHaveBeenCalledWith(
      '[Scheduler] Scheduled for: Wednesday at 09:05:30'
    );

    schedule([6, 23, 59, 59], dummyTask);
    expect(console.info).toHaveBeenCalledWith(
      '[Scheduler] Scheduled for: Saturday at 23:59:59'
    );
  });

  test('getCurrentCron() and cancelSchedule()', () => {
    schedule([5, 13, 0, 0], dummyTask);
    expect(getCurrentCron()).toBe('0 0 13 * * 5');
    cancelSchedule();
    expect(mockJob.cancel).toHaveBeenCalled();
    expect(getCurrentCron()).toBeNull();
  });
});
