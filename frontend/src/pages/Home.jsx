import React, { useState, useEffect } from "react";
import SettingsSidebarWrapper from "../components/SettingsSidebar";
import PreviewSection from "../components/PreviewSection";
import ETLFileSection from "../components/ETLFileSection";
import { parseFile } from "../utils/fileParser";
import { parseETLMeta } from "../components/SettingsSidebar";
import { parseETLCommands } from "../utils/parseETLCommands";

export default function HomePage() {
  const [inputFile, setInputFile] = useState(null);
  const [outputFile, setOutputFile] = useState(null);

  const [etlFile, setEtlFile] = useState(null);
  const [etlContent, setEtlContent] = useState("");
  const [etlMeta, setEtlMeta] = useState({
    input: "", output: "", overwrite: false, commands: []
  });

  const [inputDataMap, setInputDataMap] = useState({});
  const [outputDataMap, setOutputDataMap] = useState({});
  const [inputSheets, setInputSheets] = useState([]);
  const [outputSheets, setOutputSheets] = useState([]);
  const [selectedInputSheet, setSelectedInputSheet] = useState("");
  const [selectedOutputSheet, setSelectedOutputSheet] = useState("");

  const [parsedRanges, setParsedRanges] = useState([]);

  useEffect(() => {
    if (!etlFile) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      setEtlContent(text);
      setEtlMeta(parseETLMeta(text, etlFile));
    };
    reader.readAsText(etlFile);
  }, [etlFile]);

  useEffect(() => {
    const ranges = parseETLCommands(etlMeta.commands || []);
    setParsedRanges(ranges);
  }, [etlMeta.commands]);

  useEffect(() => {
    if (inputFile) {
      parseFile(
        inputFile,
        setInputDataMap,
        setInputSheets,
        setSelectedInputSheet,
        etlFile
      );
    }
  }, [inputFile, etlFile]);

  useEffect(() => {
    if (outputFile) {
      parseFile(
        outputFile,
        setOutputDataMap,
        setOutputSheets,
        setSelectedOutputSheet,
        etlFile
      );
    }
  }, [outputFile, etlFile]);

  useEffect(() => {
    if (inputSheets.length) setSelectedInputSheet(inputSheets[0]);
  }, [inputSheets]);

  useEffect(() => {
    if (outputSheets.length) setSelectedOutputSheet(outputSheets[0]);
  }, [outputSheets]);

  const inputSheetIndex = inputSheets.indexOf(selectedInputSheet) + 1;
  const outputSheetIndex = outputSheets.indexOf(selectedOutputSheet) + 1;

  const highlightInputRanges = parsedRanges
    .filter(r => r.inputSheet === inputSheetIndex)
    .map(r => r.inputRange);

  const highlightOutputRanges = parsedRanges
    .filter(r => r.outputSheet === outputSheetIndex)
    .map(r => r.outputRange);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar wrapper */}
      <div className="flex-none w-0">
        <SettingsSidebarWrapper
          inputFile={inputFile} setInputFile={setInputFile}
          outputFile={outputFile} setOutputFile={setOutputFile}
          etlFile={etlFile} setEtlFile={setEtlFile}
          etlContent={etlContent} setEtlContent={setEtlContent}
          onMetaChange={setEtlMeta} etlMeta={etlMeta}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-auto p-4">
        <div className="flex flex-1 gap-4">
          <PreviewSection
            title="Input Preview"
            data={inputDataMap[selectedInputSheet] || []}
            sheets={inputSheets}
            selectedSheet={selectedInputSheet}
            setSelectedSheet={setSelectedInputSheet}
            highlightRanges={highlightInputRanges}
            fileName={inputFile ? inputFile.name : "No file selected"}
          />

          <PreviewSection
            title="Output Preview"
            data={outputDataMap[selectedOutputSheet] || []}
            sheets={outputSheets}
            selectedSheet={selectedOutputSheet}
            setSelectedSheet={setSelectedOutputSheet}
            highlightRanges={highlightOutputRanges}
            fileName={outputFile ? outputFile.name : "No file selected"}
          />

          <ETLFileSection
            etlFile={etlFile}
            setEtlFile={setEtlFile}
            etlContent={etlContent}
            setEtlContent={setEtlContent}
            onMetaChange={setEtlMeta}
          />
        </div>
      </div>
    </div>
  );
}
