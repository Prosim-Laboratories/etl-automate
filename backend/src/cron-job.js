// src/cron-job.js
import { scheduleJob } from 'node-schedule';

let currentJob  = null;
let currentCron = null;

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/**
 * Convert [day, hour, minute, second] → cron string "sec min hour * * day"
 */
export function buildCronExpression([day, hour, minute, second]) {
  return `${second} ${minute} ${hour} * * ${day}`;
}

/**
 * Schedule a task by array or cron string, logging pattern and next run.
 * @param {number[]|string} cronConfig  Either [D, H, M, S] or full cron string
 * @param {Function}        task        Async function to run each tick
 * @returns {import('node-schedule').Job}
 */
export function schedule(cronConfig, task) {
  if (currentJob) currentJob.cancel();

  const cronExpr = Array.isArray(cronConfig)
    ? buildCronExpression(cronConfig)
    : cronConfig;

  // console.info(`[Scheduler] ⏰ pattern = "${cronExpr}"`);
  currentCron = cronExpr;

  currentJob = scheduleJob(cronExpr, async () => {
    try { await task(); }
    catch (err) { console.error('[Job] 💥', err); }
  });

  // Derive day/hour/min/sec for human log
  let day, hr, min, sec;
  if (Array.isArray(cronConfig)) {
    [day, hr, min, sec] = cronConfig;
  } else {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length === 6) {
      [sec, min, hr, , , day] = parts;
    } else if (parts.length === 5) {
      sec = '0';
      [min, hr, , , day] = parts;
    } else {
      console.info('[Scheduler] Unable to parse schedule for description');
      return currentJob;
    }
    day = parseInt(day, 10);
    hr  = parseInt(hr, 10);
    min = parseInt(min, 10);
    sec = parseInt(sec, 10);
  }

  const dayName = DAYS[day] || `Day#${day}`;
  const hh = String(hr).padStart(2,'0');
  const mm = String(min).padStart(2,'0');
  const ss = String(sec).padStart(2,'0');
  console.info(`[Scheduler] Scheduled for: ${dayName} at ${hh}:${mm}:${ss}`);

  return currentJob;
}

export function getCurrentCron() {
  return currentCron;
}

export function cancelSchedule() {
  if (currentJob) currentJob.cancel();
  currentJob  = null;
  currentCron = null;
}
