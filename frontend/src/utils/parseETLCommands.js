// src/utils/parseETLCommands.js

// Convert A1 or B2:C4 into zero-based indices
function cellToIndex(cell) {
  const colLetters = cell.match(/[A-Z]+/)[0];
  const rowNumber = parseInt(cell.match(/\d+/)[0], 10);
  const colIndex = colLetters
    .split("")
    .reduce((acc, letter) => acc * 26 + (letter.charCodeAt(0) - 65), 0);
  return { row: rowNumber - 1, column: colIndex };
}

export function parseETLCommands(commands) {
  return commands.map(cmd => {
    // split LHS and RHS
    const [lhsRaw, rhsRaw] = cmd.split("->").map(s => s.trim());

    // default sheet = 1
    let inputSheet  = 1;
    let outputSheet = 1;
    let lhs = lhsRaw;
    let rhs = rhsRaw;

    // strip optional S#(...) wrapper from lhs
    let m = lhs.match(/^S(\d+)\s*\((.+)\)$/i);
    if (m) {
      inputSheet = parseInt(m[1], 10);
      lhs = m[2];
    }

    // strip optional S#(...) wrapper from rhs
    m = rhs.match(/^S(\d+)\s*\((.+)\)$/i);
    if (m) {
      outputSheet = parseInt(m[1], 10);
      rhs = m[2];
    }

    // helper to pick the first range out of e.g. "E11:F12 + ..." or "B4+D7"
    function parseRange(str) {
      const match = str.match(/([A-Z]+\d+)(?::([A-Z]+\d+))?/);
      if (!match) return null;
      const start = cellToIndex(match[1]);
      const end   = match[2] ? cellToIndex(match[2]) : start;
      return { start, end };
    }

    const inputRange  = parseRange(lhs);
    const outputRange = parseRange(rhs);

    return { inputSheet, inputRange, outputSheet, outputRange };
  });
}
