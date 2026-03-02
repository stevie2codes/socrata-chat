"use client";

import { useReducer } from "react";
import {
  SessionContext,
  SessionDispatchContext,
  sessionReducer,
  initialSessionState,
} from "@/lib/session/session-context";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  return (
    <SessionContext.Provider value={state}>
      <SessionDispatchContext.Provider value={dispatch}>
        {children}
      </SessionDispatchContext.Provider>
    </SessionContext.Provider>
  );
}
