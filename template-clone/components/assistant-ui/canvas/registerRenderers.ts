import { registerRenderer } from "./registry";
import defaultRenderer from "./renderers/default";
import streamdownRenderer from "./renderers/streamdown";
import markdownReportRenderer from "./renderers/markdown-report";

// Register built-in renderers
registerRenderer("default", defaultRenderer);
registerRenderer("streamdown", streamdownRenderer);
registerRenderer("markdown-report", markdownReportRenderer);

// Optional: map common tool names to streamdown
// You can expand this list as needed or set payload.rendererType = 'streamdown' when calling openCanvas
