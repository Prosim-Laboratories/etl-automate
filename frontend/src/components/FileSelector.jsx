import React from "react";
import { X as CloseIcon } from "lucide-react";

export default function FileSelector({
  label,
  file,
  setFile,
  textSecondary = "text-gray-500 dark:text-gray-400",
  accept = ".csv,.xlsx,.xls",
  resolvedPath
}) {
  // Browse button styling
  const browseBtnClasses = `
    flex items-center space-x-2 px-3 py-2 rounded
    bg-gray-100 hover:bg-gray-200
    dark:bg-gray-700 dark:hover:bg-gray-600
    cursor-pointer
    transition-colors duration-150
    whitespace-nowrap
  `;

  const removeBtnClasses = `
    p-1 ml-2 rounded
    hover:bg-red-50 dark:hover:bg-red-900/10
    transition-colors
  `;

  const onChange = e => {
    const selected = e.target.files?.[0] || null;
    if (selected && resolvedPath) {
      setFile({
        ...selected,
        resolvedPath: `${resolvedPath}/${selected.name}`
      });
    } else {
      setFile(selected);
    }
  };

  return (
    <div className="mb-4">
      {/* Main label */}
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </label>

      <div className="flex items-center space-x-2">
        {/* Browse file button */}
        {!file && (
          <label className={browseBtnClasses}>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              Browse file
            </span>
            <input
              type="file"
              accept={accept}
              onChange={onChange}
              className="sr-only"
            />
          </label>
        )}

        {/* File name displayed inside a button with 'X' to remove */}
        {file && (
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
              {file.name}
            </p>
            <button
              onClick={() => setFile(null)}
              className={removeBtnClasses}
              title="Remove file"
            >
              <CloseIcon className="w-4 h-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
