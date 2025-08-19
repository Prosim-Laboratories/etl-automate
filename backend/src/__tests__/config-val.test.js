// __tests__/validation/config-val.test.js

import { validateConfig } from '../validation/config-val.js';
import fs from 'fs/promises';
import path from 'path';

describe('validateConfig', () => {
  test('returns null for valid config', async () => {
    const cfg = {
      cron: [0, 12, 30, 15],
      etl_files: []
    };
    // create a temp file for test in the same directory
    const tempFile = path.resolve(__dirname, 'sample.etl');
    await fs.writeFile(tempFile, 'A1 -> B1');
    // use absolute path so validateConfig can find it
    cfg.etl_files = [tempFile];

    const err = await validateConfig(cfg);
    expect(err).toBeNull();

    // cleanup
    await fs.unlink(tempFile);
  });

  test('errors on invalid cron shape', async () => {
    const cfg = { cron: [1,2,3], etl_files: ['dummy'] };
    const err = await validateConfig(cfg);
    expect(err).toMatch(/cron must be \[day, hour, minute, second\]/);
  });

  test('errors on out-of-range cron values', async () => {
    const cfg = { cron: [7,24,60,60], etl_files: ['dummy'] };
    const err = await validateConfig(cfg);
    expect(err).toMatch(/day must be 0–6/);
    expect(err).toMatch(/hour must be 0–23/);
    expect(err).toMatch(/minute must be 0–59/);
    expect(err).toMatch(/second must be 0–59/);
  });

  test('errors when etl_files is not array or empty', async () => {
    const cfg1 = { cron: [1,2,3,4], etl_files: [] };
    const e1 = await validateConfig(cfg1);
    expect(e1).toMatch(/etl_files must be a non-empty array/);

    const cfg2 = { cron: [1,2,3,4], etl_files: 'not-array' };
    const e2 = await validateConfig(cfg2);
    expect(e2).toMatch(/etl_files must be a non-empty array/);
  });

  test('errors when etl file not found', async () => {
    const cfg = { cron: [1,2,3,4], etl_files: ['nonexistent.etl'] };
    const err = await validateConfig(cfg);
    expect(err).toMatch(/ETL file not found: nonexistent\.etl/);
  });
});
