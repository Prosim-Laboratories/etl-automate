import React from "react";

export default function CommandsSection({ commands }) {
  return (
    <section className="w-64 p-4 border-l flex flex-col">
      <h3 className="font-semibold mb-3">Commands</h3>
      <div className="flex-1 overflow-auto font-mono text-sm space-y-1">
        {commands.length
          ? commands.map((cmd, i) => (
              <pre key={i} className="whitespace-pre-wrap bg-gray-50 p-2 rounded">
                {cmd}
              </pre>
            ))
          : <div className="text-gray-500">No commands</div>}
      </div>
    </section>
  );
}
