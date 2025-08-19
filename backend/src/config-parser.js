// config-parser.js
// Reads config.json and validates it, resolving ETL paths relative to config file.
import fs from 'fs/promises';
import path from 'path';
import { validateConfig } from './validation/config-val.js';

export async function parseConfig(configPath) {
  const absConfig = path.resolve(configPath);
  const baseDir = path.dirname(absConfig);

  // 1️⃣ Load JSON
  let cfg;
  try {
    cfg = JSON.parse(await fs.readFile(absConfig, 'utf8'));
  } catch (e) {
    return { error: `Failed to read/parse ${path.basename(absConfig)} – ${e.message}` };
  }

  // 2️⃣ Validate cron & etl_files, passing baseDir for relative checks
  const err = await validateConfig(cfg, baseDir);
  if (err) return { error: err };

  // 3️⃣ Build cron expression
  const [day, hour, minute, second] = cfg.cron;
  const cronExpression = `${second} ${minute} ${hour} * * ${day}`;

  // 4️⃣ Resolve ETL paths **in original order, allowing duplicates**
  const etlPaths = cfg.etl_files.map(rel =>
    path.resolve(baseDir, rel)
  );

  return { cronExpression, etlPaths };
}

