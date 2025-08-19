import fs   from 'fs/promises';
import os   from 'os';
import path from 'path';
import { validateEtl } from './validation/etl-val.js';

export default async function parseEtl(etlPath) {
  const baseDir  = path.dirname(etlPath);
  const rawLines = (await fs.readFile(etlPath, 'utf8'))
                      .split(/\r?\n/);

  let input, output;
  let overwrite = true;
  const dsl = [];

  for (let raw of rawLines) {
    // strip inline comments + trim
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;

    // metadata?
    const m = /^([a-zA-Z]+)\s*=\s*(.+)$/.exec(line);
    if (m) {
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === 'overwrite') {
        overwrite = val.toLowerCase() !== 'false';
      } else {
        const resolved = val.startsWith('~')
          ? path.join(os.homedir(), val.slice(1))
          : path.resolve(baseDir, val);
        if (key === 'input')  input  = resolved;
        if (key === 'output') output = resolved;
      }
      continue;
    }

    // only push lines that actually have '->'
    if (!line.includes('->')) continue;
    dsl.push(line);
  }

  // now validate *just* the DSL commands
  await validateEtl(dsl);

  const commands = dsl.map((ln, idx) => {
    const [expr, tgt] = ln.split('->').map(s => s.trim());
    return { 
      id:         `${etlPath}:${idx+1}`,
      expression: expr,
      output:     tgt
    };
  });

  commands.input     = input;
  commands.output    = output;
  commands.overwrite = overwrite;
  return commands;
}
