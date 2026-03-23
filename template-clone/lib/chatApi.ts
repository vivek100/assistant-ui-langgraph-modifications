import { Client, ThreadState, ThreadStatus, Metadata } from "@langchain/langgraph-sdk";
import {
  LangChainMessage,
  LangGraphCommand,
} from "@assistant-ui/react-langgraph";

const createClient = () => {
  const apiUrl =
    process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] ||
    new URL("/api", window.location.href).href;
  return new Client({
    apiUrl,
  });
};

/**
 * Create a new thread with optional metadata for filtering.
 * @param userId - User ID to associate with the thread
 * @param customMetadata - Additional metadata to store with the thread
 */
export const createThread = async (
  userId?: string | null,
  customMetadata?: Record<string, string>
) => {
  const client = createClient();
  
  const metadata: Metadata = {};
  if (userId) {
    metadata.user_id = userId;
  }
  if (customMetadata) {
    Object.assign(metadata, customMetadata);
  }
  
  const hasMetadata = Object.keys(metadata).length > 0;
  return client.threads.create(hasMetadata ? { metadata } : undefined);
};

export const getThreadState = async (
  threadId: string
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = createClient();
  console.log("threadId", threadId);
  return client.threads.getState(threadId);
};

/**
 * Send a message to a thread with optional config data.
 * @param params.userId - User ID to pass in run config (available to agent)
 * @param params.customConfig - Additional config data to pass to the agent
 */
export const sendMessage = async (params: {
  threadId: string;
  messages?: LangChainMessage[];
  command?: LangGraphCommand | undefined;
  userId?: string | null;
  customConfig?: Record<string, unknown>;
}) => {
  const client = createClient();
  
  // Build config object with user_id and any custom config
  const configData: Record<string, unknown> = {};
  if (params.threadId) {
    configData.thread_id = params.threadId;
  }
  if (params.userId) {
    configData.user_id = params.userId;
  }
  if (params.customConfig) {
    Object.assign(configData, params.customConfig);
  }
  
  const hasConfig = Object.keys(configData).length > 0;
  
  return client.runs.stream(
    params.threadId,
    process.env["NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID"]!,
    {
      input: params.messages?.length
        ? {
            messages: params.messages,
          }
        : null,
      command: params.command,
      config: hasConfig ? { configurable: configData } : undefined,
      streamMode: ["messages", "updates", "events"],
      streamSubgraphs: true,
    }
  );
};

/**
 * List all threads with optional filters.
 */
export const listThreads = async (options?: { 
  limit?: number; 
  status?: ThreadStatus; 
  metadata?: Metadata 
}) => {
  const client = createClient();
  return client.threads.search(options);
};

/**
 * List threads filtered by user_id (and optionally other metadata).
 * This is the recommended way to fetch threads for a specific user.
 */
export const listThreadsByUser = async (params: {
  userId: string;
  limit?: number;
  additionalMetadata?: Record<string, string>;
}) => {
  console.log("[chatApi] listThreadsByUser called with userId:", params.userId);
  const client = createClient();
  
  const metadata: Metadata = {
    user_id: params.userId,
  };
  if (params.additionalMetadata) {
    Object.assign(metadata, params.additionalMetadata);
  }
  
  const result = await client.threads.search({
    limit: params.limit ?? 50,
    metadata,
  });
  
  console.log("[chatApi] User threads retrieved:", result?.length ?? 0);
  return result;
};

export const deleteThread = async (threadId: string) => {
  const client = createClient();
  return client.threads.delete(threadId);
};

/**
 * Update thread metadata (e.g., to set a title after first message).
 */
export const updateThreadMetadata = async (
  threadId: string,
  metadata: Metadata
) => {
  const client = createClient();
  return client.threads.update(threadId, { metadata });
};

/**
 * Generate a meaningful thread title from the user's first message.
 * Removes common prefixes and truncates to 50 characters.
 */
export const generateThreadTitle = (message: string): string => {
  const cleanMessage = message.trim();
  
  // Remove common prefixes that don't make good titles
  const cleaned = cleanMessage
    .replace(/^please\s+/i, "")
    .replace(/^can you\s+/i, "")
    .replace(/^i need\s+/i, "")
    .replace(/^help me\s+/i, "")
    .replace(/^how do i\s+/i, "")
    .replace(/^what is\s+/i, "")
    .replace(/^tell me\s+/i, "");
  
  // Capitalize first letter
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  // Truncate to reasonable length (max 50 chars)
  return title.length > 50 ? title.substring(0, 47) + "..." : title;
};
