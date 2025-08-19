
// validation/config-val.js
// Validates cron array & ETL file presence relative to config file directory
import fs from 'fs/promises';
import path from 'path';

/**
 * @param {{cron:any, etl_files:any}} cfg
 * @param {string} baseDir  Directory containing the config.json
 * @returns {string|null}  error messages or null if valid
 */
export async function validateConfig(cfg, baseDir = process.cwd()) {
  const errors = [];

  // Cron shape & ranges
  if (!Array.isArray(cfg.cron) || cfg.cron.length !== 4 || !cfg.cron.every(Number.isInteger)) {
    errors.push('cron must be [day, hour, minute, second]');
  } else {
    const [d, h, m, s] = cfg.cron;
    if (d < 0 || d > 6)  errors.push(`day must be 0–6 (got ${d})`);
    if (h < 0 || h > 23) errors.push(`hour must be 0–23 (got ${h})`);
    if (m < 0 || m > 59) errors.push(`minute must be 0–59 (got ${m})`);
    if (s < 0 || s > 59) errors.push(`second must be 0–59 (got ${s})`);
  }

  // ETL files array
  if (!Array.isArray(cfg.etl_files) || cfg.etl_files.length === 0) {
    errors.push('etl_files must be a non-empty array');
  } else {
    for (const rel of cfg.etl_files) {
      const abs = path.resolve(baseDir, rel);
      try {
        await fs.access(abs);
      } catch {
        errors.push(`ETL file not found: ${rel}`);
      }
    }
  }

  return errors.length ? errors.join('\n') : null;
}
