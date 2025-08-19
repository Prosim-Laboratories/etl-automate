import Papa from "papaparse";
import * as XLSX from "xlsx";

// Function to resolve relative file paths
const getAbsolutePath = (relativePath, etlFile) => {
  if (!etlFile) return relativePath; // If no ETL file, return the relative path as is
  const basePath = etlFile ? etlFile.name.split('/').slice(0, -1).join('/') : "";
  return relativePath.startsWith("./") ? `${basePath}/${relativePath.slice(2)}` : relativePath;
};

// Function to parse CSV and XLSX files
export function parseFile(file, setDataMap, setSheets, setSelected, etlFile) {
  if (!file) {
    setDataMap({});
    setSheets([]);
    setSelected("");
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  reader.onload = ({ target }) => {
    const rawMap = {};

    if (ext === 'csv') {
      // CSV parsing using PapaParse
      const { data } = Papa.parse(target.result, { skipEmptyLines: false });
      rawMap[file.name] = data;
    } else if (['xlsx', 'xls'].includes(ext)) {
      // XLSX parsing using XLSX library
      const wb = XLSX.read(target.result, { type: 'array' });
      wb.SheetNames.forEach(name => {
        const sheet = wb.Sheets[name];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const grid = [];
        for (let r = range.s.r; r <= range.e.r; ++r) {
          const row = [];
          for (let c = range.s.c; c <= range.e.c; ++c) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            row.push(sheet[cellRef]?.v ?? "");
          }
          grid.push(row);
        }
        rawMap[name] = grid;
      });
    } else {
      rawMap['Unsupported'] = [['Unsupported file type']];
    }

    // Set parsed data and sheet names
    setDataMap(rawMap);
    setSheets(Object.keys(rawMap));

    // Set the first sheet as the default selected sheet, or use the one from ETL metadata
    const firstSheet = Object.keys(rawMap)[0];
    setSelected(firstSheet);
  };

  // Determine file type and read accordingly
  if (ext === 'csv') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}
