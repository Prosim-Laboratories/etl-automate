import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/theme-provider";
import { debounce } from "lodash"; // Import debounce
import { validateEtl } from "../utils/etl-val.js"; // Import the validation function

export default function ETLFileSection({
  etlFile,
  setEtlFile,
  etlContent,
  setEtlContent,
  onMetaChange
}) {
  const theme = useTheme();
  const [errors, setErrors] = useState([]); // To store validation errors
  const [isValid, setIsValid] = useState(true); // To track if the content is valid

  // Debounced function to validate the ETL content
  const debouncedValidate = useCallback(
    debounce((content) => {
      let meta;
      try {
        // Validate the ETL content
        validateEtl(content.split("\n"));
        meta = parseETLMeta(content); // Parse the ETL metadata

        // If validation passes, process the meta
        const safeMeta = {
          ...meta,
          commands: meta.commands.filter(c => typeof c === "string"), // Keep only valid commands
        };
        onMetaChange?.(safeMeta);
        setIsValid(true);
        setErrors([]); // Clear previous errors if valid
      } catch (error) {
        // If validation fails, capture errors and mark as invalid
        setIsValid(false);
        setErrors(error.message.split('\n')); // Display validation errors
        onMetaChange?.({ input: "", output: "", overwrite: false, commands: [] });
      }
    }, 500), // Wait for 500ms after typing before validating
    []
  );

  // Re-parse and validate the ETL content on every change (debounced)
  useEffect(() => {
    debouncedValidate(etlContent);
  }, [etlContent, debouncedValidate]);

  // Load file content when chosen
  useEffect(() => {
    if (!etlFile) return;
    const rdr = new FileReader();
    rdr.onload = (e) => setEtlContent(e.target.result);
    rdr.readAsText(etlFile);
  }, [etlFile, setEtlContent]);

  // Parse the ETL metadata (input, output, overwrite, commands)
  const parseETLMeta = (text) => {
    const inputRe = /^\s*input\s*[:=]\s*(.+)$/i;
    const outputRe = /^\s*output\s*[:=]\s*(.+)$/i;
    const overwriteRe = /^\s*overwrite\s*[:=]\s*(true|false)$/i;
    const cmdRe = /^.+->.+$/;  // Must contain "->"

    const lines = text.split(/\r?\n/);
    let input = "", output = "", overwrite = false;
    const commands = [];

    lines.forEach(ln => {
      const t = ln.trim();
      if (!t || t.startsWith("#")) return;

      let m;
      if ((m = t.match(inputRe))) {
        input = m[1].trim();
      } else if ((m = t.match(outputRe))) {
        output = m[1].trim();
      } else if ((m = t.match(overwriteRe))) {
        overwrite = m[1].toLowerCase() === "true";
      } else if (cmdRe.test(t)) {
        commands.push(t);
      } else {
        // Invalid commands will be caught here, but continue processing others
        commands.push({ invalid: true, text: t });
      }
    });

    return { input, output, overwrite, commands };
  };

  // Handle exporting the ETL file content
  const exportScript = () => {
    if (!isValid) {
      alert("The script contains invalid commands. Please fix them before exporting.");
      return;
    }

    const blob = new Blob([etlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = etlFile?.name || "script.etl";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="flex-none w-80 p-4 flex flex-col"
      style={{ height: "91%", width: "400px" }}
    >
      <h3 className="font-semibold mb-2 dark:text-white">ETL Script</h3>

      <div
        className={`flex-1 overflow-auto border rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* Textarea for live editing */}
        <textarea
          value={etlContent}
          onChange={(e) => setEtlContent(e.target.value)}
          style={{
            fontFamily: '"Fira Code", monospace',
            fontSize: "13px",
            minHeight: "100%",
            whiteSpace: "pre", // preserve spacing/newlines
            outline: "none",
            padding: "10px",
            width: "100%",
          }}
          className="etl-editor text-black dark:text-white dark:bg-gray-800"
        />
      </div>

      <button
        onClick={exportScript}
        className="mt-3 px-3 py-1 bg-green-600 text-white rounded text-sm"
      >
        Save / Export
      </button>

      {/* Display validation error if necessary */}
      {!isValid && (
        <div className="mt-2 text-red-500 text-sm">
          The script contains invalid commands. Please correct them before exporting.
        </div>
      )}

      {/* Show error details */}
      {errors.length > 0 && (
        <div className="mt-2 text-red-500 text-sm">
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
