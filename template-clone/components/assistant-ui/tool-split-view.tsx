import { ChevronDownIcon, ChevronUpIcon, ListTreeIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";

function tryParseJson(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function pretty(value: unknown): string {
  try {
    return typeof value === "string"
      ? JSON.stringify(tryParseJson(value), null, 2)
      : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

type ToolProps = {
  toolName: string;
  argsText: string;
  result?: unknown;
};

export const ToolSplitView = ({ toolName, argsText, result }: ToolProps) => {
  const [open, setOpen] = useState(false);
  const parsedArgs = useMemo(() => tryParseJson(argsText), [argsText]);
  const parsedResult = useMemo(() => tryParseJson(result), [result]);

  return (
    <div className="mb-4 w-full rounded-lg border">
      <div className="flex items-center gap-2 px-4 py-2">
        <ListTreeIcon className="size-4" />
        <p className="flex-grow text-sm">
          Tool: <b>{toolName}</b>
        </p>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>

      {open && (
        <div className="border-t">
          <section className="grid grid-cols-1 gap-0 md:grid-cols-2">
            <div className="border-b md:border-b-0 md:border-r">
              <div className="px-4 pt-2 pb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Args</p>
                <div className="rounded-md bg-muted/40 p-2">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {pretty(parsedArgs)}
                  </pre>
                </div>
              </div>
            </div>
            <div>
              <div className="px-4 pt-2 pb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result</p>
                <div className="rounded-md bg-muted/40 p-2">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {parsedResult === undefined ? "<no result>" : pretty(parsedResult)}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
