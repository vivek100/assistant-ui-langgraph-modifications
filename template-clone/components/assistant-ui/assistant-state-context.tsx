"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

// Error state type
export type ErrorState = {
  title: string;
  message?: string;
  showRefresh?: boolean;
  showNewChat?: boolean;
} | null;

// Base assistant state
export type AssistantStateBase = {
  errorState: ErrorState;
  disabled?: boolean;
  threadIdRef?: React.RefObject<string | undefined>;
};

// Base actions
export type AssistantStateActions = {
  setErrorState: Dispatch<SetStateAction<ErrorState>>;
  openNewChat: () => void;
};

// Combined context type with generic extension
export type AssistantStateContextType<TCustom = object> = AssistantStateBase &
  AssistantStateActions &
  TCustom;

// Default context
const AssistantStateContext = createContext<AssistantStateContextType | undefined>(undefined);

// Hook to use assistant state
export function useAssistantState<TCustom = object>(): AssistantStateContextType<TCustom> {
  const context = useContext(AssistantStateContext);
  if (!context) {
    throw new Error("useAssistantState must be used within AssistantStateProvider");
  }
  return context as AssistantStateContextType<TCustom>;
}

// Provider props
export interface AssistantStateProviderProps<TCustom = object> {
  children: ReactNode;
  threadIdRef?: React.RefObject<string | undefined>;
  disabled?: boolean;
  /** Custom state to merge into context */
  customState?: TCustom;
  /** Custom actions to merge into context */
  customActions?: Record<string, (...args: unknown[]) => unknown>;
  /** Callback when openNewChat is called */
  onNewChat?: () => void;
}

// Provider component
export function AssistantStateProvider<TCustom = object>({
  children,
  threadIdRef,
  disabled = false,
  customState,
  customActions,
  onNewChat,
}: AssistantStateProviderProps<TCustom>) {
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const openNewChat = useCallback(() => {
    // Clear error state
    setErrorState(null);
    
    // Call custom handler if provided
    if (onNewChat) {
      onNewChat();
    }
  }, [onNewChat]);

  const value = useMemo(
    () => ({
      // Base state
      errorState,
      disabled,
      threadIdRef,
      // Base actions
      setErrorState,
      openNewChat,
      // Custom extensions
      ...customState,
      ...customActions,
    }),
    [errorState, disabled, threadIdRef, openNewChat, customState, customActions]
  );

  return (
    <AssistantStateContext.Provider value={value as AssistantStateContextType}>
      {children}
    </AssistantStateContext.Provider>
  );
}

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AssistantErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AssistantErrorBoundary] caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm mt-1">
            An error occurred while rendering the assistant UI. Check console for details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utility: snake_case to Title Case
export function snakeCaseToTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
