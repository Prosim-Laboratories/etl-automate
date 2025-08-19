/**
 * main.js
 * Orchestrates the ETL engine.
 *   • reads / validates config.json
 *   • caches full ETL defs { input, output, commands }
 *   • optional single run (-run) and/or cron scheduling (-cron)
 */
import os   from 'os';
import path from 'path';
import { parseConfig } from './config-parser.js';
import parseEtl        from './etl-parser.js';
import { runEtl }      from './etl-runner.js';
import { schedule }    from './cron-job.js';

/* ─── CLI flags ──────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
let cfgPathArg = null;
let runOnce    = false;
let enableCron = false;

for (const a of argv) {
  if (a === '-run'  || a === '--run')  runOnce = true;
  else if (a === '-cron' || a === '--cron') enableCron = true;
  else if (!cfgPathArg) cfgPathArg = a;
}
if (!enableCron && !runOnce) enableCron = true;   // default: cron only

cfgPathArg = cfgPathArg ?? 'config.json';
if (cfgPathArg.startsWith('~'))
  cfgPathArg = path.join(os.homedir(), cfgPathArg.slice(1));
const CONFIG_PATH = path.isAbsolute(cfgPathArg)
  ? cfgPathArg
  : path.resolve(process.cwd(), cfgPathArg);

/* ─── state ──────────────────────────────────────────────────────── */
let currentCron  = null;
let etlFiles     = [];
let cache        = [];   // [{ etlPath, etlDef }]

/* ─── bootstrap ──────────────────────────────────────────────────── */
(async () => {
  if (!(await loadConfigAndEtls())) return;

  // --run  (always perform the first run if requested)
  if (runOnce) {
    await jobHandler();
    if (!enableCron) {
      console.info('[ETL] run-once completed – exiting');
      process.exit(0);          // <-- clean shutdown
    }
  }

  // --cron  (schedule only when requested / defaulted)
  if (enableCron) {
    // console.info(`[Scheduler] starting cron pattern "${currentCron}"`);
    schedule(currentCron, jobHandler);
  }
})();

/* ─── helpers ────────────────────────────────────────────────────── */
async function loadConfigAndEtls() {
  const res = await parseConfig(CONFIG_PATH);
  if (res.error) { console.error('[Config] ❌', res.error); return false; }

  currentCron = res.cronExpression;
  etlFiles    = res.etlPaths;

  cache = [];
  for (const p of etlFiles) {
    const etlDef = await parseEtl(p);           // {input, output, commands}
    cache.push({ etlPath: p, etlDef });
  }
  return true;
}

async function jobHandler() {
  console.info(`[Job] ▶ ${new Date().toISOString()}`);

  /* 1️⃣ re-load config */
  const cfg = await parseConfig(CONFIG_PATH);
  if (cfg.error) { console.error('[Config] ❌', cfg.error); return; }

  /* 2️⃣ hot-reload cron */
  if (cfg.cronExpression !== currentCron) {
    console.info(`[Config] cron changed → "${cfg.cronExpression}"`);
    currentCron = cfg.cronExpression;
    schedule(currentCron, jobHandler);
  }

  /* 3️⃣ hot-reload ETL list */
  if (JSON.stringify(cfg.etlPaths) !== JSON.stringify(etlFiles)) {
    console.info('[Config] ETL list changed – reloading …');
    etlFiles = cfg.etlPaths;
    cache = [];
    for (const p of etlFiles) {
      const etlDef = await parseEtl(p);
      cache.push({ etlPath: p, etlDef });
    }
  }

  /* 4️⃣ run each ETL */
  for (const { etlPath, etlDef } of cache) {
    console.info(`[ETL] ${path.basename(etlPath)}`);
    await runEtl(etlDef);
  }

  console.info(`[Job] ✅ finished – ${new Date().toISOString()}`);
}
