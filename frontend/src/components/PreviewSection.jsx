import React from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.css";
import { useTheme } from "../context/theme-provider";

export default function PreviewSection({
  title,
  data,
  sheets,
  selectedSheet,
  setSelectedSheet,
  highlightRanges = [],
  fileName // New prop for the file name
}) {
  const theme = useTheme();

  // Render the four “edge” classes on any cell in a highlight rectangle
  const cellRenderer = (row, col) => {
    const cellProps = {};

    // Filter out invalid highlight ranges
    const validRanges = highlightRanges.filter(range => range && range.start && range.end);

    validRanges.forEach(({ start, end }) => {
      if (
        row >= start.row &&
        row <= end.row &&
        col >= start.column &&
        col <= end.column
      ) {
        if (row === start.row)    cellProps.className = (cellProps.className || "") + " ht__range-top";
        if (row === end.row)      cellProps.className = (cellProps.className || "") + " ht__range-bottom";
        if (col === start.column) cellProps.className = (cellProps.className || "") + " ht__range-left";
        if (col === end.column)   cellProps.className = (cellProps.className || "") + " ht__range-right";
      }
    });
    return cellProps;
  };

  // Function to filter out invalid rows (replace with your own validation logic)
  const filterInvalidData = (data) => {
    // Assuming invalid data is any row where a cell is empty or invalid command. Modify logic based on your needs.
    return data.filter(row => row.every(cell => cell !== null && cell !== undefined));
  };

  const validData = filterInvalidData(data);  // Filter out invalid data before passing it to HotTable

  return (
    <section
      className={`flex-none flex flex-col
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800`}
      style={{ width: 650, height: "90%" }}
    >
      <h3 className="font-semibold px-4 pt-4 text-gray-900 dark:text-white">
        {title} {fileName && ` - ${fileName}`} {/* Display file name in title */}
      </h3>

      {sheets.length >= 1 && (
        <div className="px-4">
          <select
            value={selectedSheet}
            onChange={e => setSelectedSheet(e.target.value)}
            className={`w-full p-1 mb-2 text-sm rounded
              border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-gray-100`}
          >
            {sheets.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      )}

      <div className="flex-1 px-4 pb-4">
        {selectedSheet && validData.length > 0 ? (
          <HotTable
            data={validData} // Pass filtered data
            rowHeaders
            colHeaders
            width="100%"
            height="100%"
            licenseKey="non-commercial-and-evaluation"
            manualRowResize
            manualColumnResize
            contextMenu
            stretchH="all"
            cells={cellRenderer}
            readOnly={true} // Make the entire table read-only
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
            No {title.toLowerCase()} selected or invalid data to display
          </div>
        )}
      </div>
    </section>
  );
}
