import React, { createContext, useContext, ReactNode } from "react";
import { reportError } from "@/utils/logger";
import type { AppContextType } from "@/providers/appProviderTypes";
import { useAppProviderState } from "@/providers/useAppProviderState";

const AppContext = createContext<AppContextType | undefined>(undefined);
let loggedContextError = false;

export function AppProvider({ children }: { children: ReactNode }) {
  const value = useAppProviderState();
  return React.createElement(AppContext.Provider, { value }, children);
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    const errorMsg =
      "useApp must be used within AppProvider. Check if you are using this hook in a component that is a child of AppProvider in App.tsx or similar.";
    if (!loggedContextError) {
      loggedContextError = true;
      reportError(new Error("Context Access Violation"), {
        scope: "infrastructure",
        action: "useApp_outside_provider",
        metadata: { errorMsg },
      });
    }
    throw new Error(errorMsg);
  }
  return context;
}
