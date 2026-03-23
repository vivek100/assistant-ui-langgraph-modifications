"use client";

import ReactJson from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, className }) => {
  return (
    <div
      className={`max-h-32 overflow-auto rounded border bg-muted/30 p-2 ${className || ""}`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "var(--muted-foreground) transparent",
      }}
    >
      <ReactJson
        value={data}
        theme={lightTheme}
        displayDataTypes={false}
        displayObjectSize={false}
        enableClipboard={false}
        collapsed={false}
        style={{
          backgroundColor: "transparent",
          fontSize: "0.75rem",
          lineHeight: "1.1rem",
        }}
      />
    </div>
  );
};
