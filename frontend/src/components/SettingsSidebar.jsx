// src/components/SettingsSidebar.jsx
import React, { useState } from "react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "./shadcn-components/ui/sidebar";
import FileSelector from "./FileSelector";
import { ModeToggle } from "./user-interface/mode-toggle";
import { EditProfile } from "./user-interface/edit-profile";
import { useTheme } from "../context/theme-provider";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal as OptionsIcon,
  FolderOpen as InputIcon,
  Folder as OutputIcon,
  Database as ETLIcon,
  Terminal as CommandsIcon,
  Save as SaveIcon,
} from "lucide-react";

import packageJson from "../../package.json";

// Parses metadata and commands from ETL text
export function parseETLMeta(text, etlFile) {
  const inputRe = /^\s*input\s*[:=]\s*(.+)$/im;
  const outputRe = /^\s*output\s*[:=]\s*(.+)$/im;
  const overwriteRe = /^\s*overwrite\s*[:=]\s*(true|false)$/im;
  const lines = text.split(/\r?\n/);
  let input = "";
  let output = "";
  let overwrite = false;
  const commands = [];

  // Function to get the absolute path based on the etlFile's directory
  const getAbsolutePath = (relativePath) => {
    if (!etlFile) return relativePath; // If no ETL file, return the relative path as is

    // Extract the directory from the ETL file (etlfFile.name gives the full path of the ETL file)
    const basePath = etlFile ? etlFile.name.split('/').slice(0, -1).join('/') : "";

    // Log the ETL file path

    // Check if the path starts with `./` (indicating it's a relative path)
    if (relativePath.startsWith("./")) {
      return `${basePath}/${relativePath.slice(2)}`; // Remove `./` and resolve relative to the ETL file's directory
    }

    // Skip absolute paths (e.g., local system paths like C:\)
    if (relativePath.startsWith("C:\\") || relativePath.startsWith("/")) {
      console.log(`Skipping absolute path (local file system path): ${relativePath}`);
      return ""; // Return empty or handle appropriately (e.g., show error)
    }

    // Handle other cases as relative paths
    return `${basePath}/${relativePath}`;
  };

  // Parse the lines of the ETL file and extract input, output, and commands
  for (let ln of lines) {
    const t = ln.trim();
    if (!t || t.startsWith("#")) continue; // Ignore empty lines or comments
    let m;
    if ((m = t.match(inputRe))) input = getAbsolutePath(m[1].trim());
    else if ((m = t.match(outputRe))) output = getAbsolutePath(m[1].trim());
    else if ((m = t.match(overwriteRe))) overwrite = m[1].toLowerCase() === "true";
    else commands.push(t);
  }

  return { input, output, overwrite, commands };
}


// Helper to wrap icons
function IconWrapper({ size = 5, children }) {
  // automatically switch between light/dark icon color
  return (
    <div
      className={`
        flex-shrink-0 flex items-center justify-center
        h-${size} w-${size}
        text-gray-700     /* light mode icon color */
        dark:text-gray-300 /* dark mode icon color */
      `}
    >
      {children}
    </div>
  );
}

function SettingsSidebar({
  wrapContent,
  setWrapContent,
  inputFile,
  setInputFile,
  outputFile,
  setOutputFile,
  etlFile,
  setEtlFile,
  etlContent,
  setEtlContent,
  onMetaChange,
  etlMeta,
}) {
  const theme = useTheme();
  const { open: sidebarOpen } = useSidebar();
  const [etlMode, setEtlMode] = useState(etlFile ? "load" : "new");

  // Handle selecting ETL file and parsing
  const handleEtlFile = (file) => {
    setEtlFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setEtlContent(text);

        // only update meta when creating a NEW ETL, not when loading one
        if (etlMode === "new") {
          const meta = parseETLMeta(text, file);
          onMetaChange && onMetaChange(meta);
        }
      };
      reader.readAsText(file);
    } else {
      // clearing the ETL always resets meta
      setEtlContent("");
      onMetaChange && onMetaChange({ input: "", output: "", overwrite: false, commands: [] });
    }
  };

  // Validation flags
  const inputError = etlMode === "load" && !etlMeta?.input;
  const outputError = etlMode === "load" && !etlMeta?.output;
  const commandErrors = (etlMeta?.commands || []).map(cmd => !/^.+->.+$/.test(cmd));

  const [openSections, setOpenSections] = useState({
    "ETL Setup": true,
    "Input File": true,
    "Output File": true,
    Options: true,
    Commands: true,
    "Save/Export": true,
  });
  const toggleSection = (label) => setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));

  const menu = [
    // ETL Setup
    {
      Icon: ETLIcon,
      label: "ETL Setup",
      render: () => (
        <div className="space-y-3">
          <FileSelector
            label="Choose .etl File"
            file={etlFile}
            setFile={handleEtlFile}
            textSecondary="text-gray-500"
            accept=".etl"
          />
        </div>
      ),
    },

    // Input File
    {
      Icon: InputIcon,
      label: "Input File",
      render: () => (
        <div>
          <FileSelector
            label="Select Input File"
            file={inputFile}
            setFile={setInputFile}
            accept=".csv,.xls,.xlsx"
          />
        </div>
      ),
    },
    // Output File
    {
      Icon: OutputIcon,
      label: "Output File",
      render: () => (
        <div>
          <FileSelector
            label="Select Ouput File"
            file={outputFile}
            setFile={setOutputFile}
            accept=".csv,.xls,.xlsx"
          />
        </div>
      ),
    },

    // // Overwrite Option
    // {
    //   Icon: OptionsIcon,
    //   label: "Options",
    //   render: () => (
    //     <label className="inline-flex items-center cursor-pointer" onClick={() => onMetaChange && onMetaChange({ ...etlMeta, overwrite: !etlMeta?.overwrite })}>
    //       <input
    //         type="checkbox"
    //         checked={etlMeta?.overwrite || false}
    //         onChange={e => onMetaChange && onMetaChange({ ...etlMeta, overwrite: e.target.checked })}
    //         onClick={e => e.stopPropagation()}
    //         className="mr-2"
    //       />Overwrite
    //     </label>
    //   ),
    // },

    // // Commands (bubble style)
    // {
    //   Icon: CommandsIcon,
    //   label: "Commands",
    //   render: () => (
    //     <div className="flex flex-col items-start space-y-2 max-h-64 overflow-auto font-mono text-sm">
    //       {(etlMeta?.commands || []).map((cmd, i) => (
    //         <div
    //           key={i}
    //           className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-md px-3 py-1 w-full whitespace-pre-wrap"
    //         >
    //           {cmd}
    //         </div>
    //       ))}
    //       {commandErrors.includes(true) && (
    //         <div className="text-red-500 text-xs text-left mt-1">Invalid commands present</div>
    //       )}
    //     </div>
    //   ),
    // }
  ];

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="bg-white dark:bg-gray-900">
      <SidebarHeader className="p-3 border-b">
        <div className="flex items-center justify-center ">  {/* Adjusted space-x-5 for spacing */}

          {/* Centered Text Content */}
          {sidebarOpen && (
            <div className="flex flex-col items-center ml-2 space-y-1">
              <span className="font-bold text-lg block" style={{ color: theme.primaryText }}>
                ETL-Automate GUI
              </span>
              <span className="text-sm text-gray-500 block">Prosim Laboratories LLC</span>
              <span className="text-sm text-gray-500 block">v{packageJson.version}</span>
            </div>
          )}
        </div>
      </SidebarHeader>



      <SidebarContent
        className={`flex flex-col justify-between h-full overflow-auto bg-white dark:bg-gray-900 p-2 ${sidebarOpen ? "" : "p-2"}`}
      >
        <SidebarMenu>
          {menu.map(({ Icon, label, render }) => {
            const isOpen = openSections[label];
            return (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => toggleSection(label)}
                    className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center -ml-[3px]">
                      <IconWrapper size={5}>
                        <Icon />
                      </IconWrapper>
                      {sidebarOpen && <span className="ml-2">{label}</span>}
                    </div>
                    {sidebarOpen && (
                      <IconWrapper size={5}>
                        {isOpen ? <ChevronUp /> : <ChevronDown />}
                      </IconWrapper>
                    )}
                  </button>
                </SidebarMenuButton>
                {sidebarOpen && isOpen && <div className="pl-12 pr-4 py-2">{render()}</div>}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {sidebarOpen ? (
          <div className="flex items-center space-x-2">
            <ModeToggle />
            {/* <SidebarTrigger className="rounded dark:bg-gray-800 -ml-[5px]">
            <IconWrapper size={5}>
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </IconWrapper>
          </SidebarTrigger> */}
          </div>
        ) : (
          <div className="flex justify-center">
            {/* <SidebarTrigger className="rounded dark:bg-gray-800 -ml-[5px]">
            <IconWrapper size={5}>
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </IconWrapper>
          </SidebarTrigger> */}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

// Wrap the sidebar in its provider and export
export default function SettingsSidebarWrapper(props) {
  return (
    <SidebarProvider defaultOpen>
      <SettingsSidebar {...props} />
    </SidebarProvider>
  );
}
