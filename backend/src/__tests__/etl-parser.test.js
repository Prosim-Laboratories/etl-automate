// __tests__/etl-parser.test.js
import fs from 'fs/promises';
import path from 'path';
import parseEtl from '../etl-parser.js';

describe('parseEtl', () => {
  const testDir = path.resolve(__dirname, 'fixtures');
  const goodFile = path.join(testDir, 'good.etl');
  const badFile = path.join(testDir, 'bad.etl');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    // valid ETL with comments/metadata
    const goodContent = [
      '# metadata',
      'input = foo.csv',
      'output = bar.csv',
      '',
      '# commands',
      'A1 + B1 -> C1',
      '2 * (C1 + D2) -> E3',
      'A3:B3 + C3:D3 -> E3:F3'
    ].join('\n');
    await fs.writeFile(goodFile, goodContent, 'utf8');

    // invalid ETL
    const badContent = [
      '# missing arrow',
      'A1 + B1 C2',
      '# invalid expr',
      'A1 + -> B1'
    ].join('\n');
    await fs.writeFile(badFile, badContent, 'utf8');
  });

  afterAll(async () => {
    await fs.unlink(goodFile);
    await fs.unlink(badFile);
    await fs.rmdir(testDir);
  });

  test('parses a valid ETL file into commands (skips metadata)', async () => {
    const commands = await parseEtl(goodFile);
    expect(commands).toHaveLength(3);
    expect(commands[0]).toEqual({
      id: `${goodFile}:1`,
      expression: 'A1 + B1',
      output: 'C1'
    });
    expect(commands[1]).toEqual({
      id: `${goodFile}:2`,
      expression: '2 * (C1 + D2)',
      output: 'E3'
    });
    expect(commands[2]).toEqual({
      id: `${goodFile}:3`,
      expression: 'A3:B3 + C3:D3',
      output: 'E3:F3'
    });
  });

  test('throws an error for invalid ETL files', async () => {
    await expect(parseEtl(badFile)).rejects.toThrow();
  });
});
