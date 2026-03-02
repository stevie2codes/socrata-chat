"use client";

import { createContext, useContext, type Dispatch } from "react";
import type { SessionState, SocrataDataset, QueryFilter } from "@/types";
import { DEFAULT_PORTAL } from "@/lib/portals";

// Action types

export type SessionAction =
  | { type: "SET_PORTAL"; payload: string }
  | { type: "SET_DATASET"; payload: SocrataDataset | null }
  | { type: "ADD_FILTER"; payload: QueryFilter }
  | { type: "REMOVE_FILTER"; payload: number }
  | { type: "CLEAR_FILTERS" }
  | { type: "RESET" };

// Default state

function createInitialState(): SessionState {
  return {
    portal: DEFAULT_PORTAL.domain,
    activeDataset: null,
    filters: [],
    conversationId: crypto.randomUUID(),
  };
}

export const initialSessionState: SessionState = createInitialState();

// Reducer

export function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "SET_PORTAL":
      return {
        ...state,
        portal: action.payload,
        activeDataset: null,
        filters: [],
      };
    case "SET_DATASET":
      return {
        ...state,
        activeDataset: action.payload,
        filters: [],
      };
    case "ADD_FILTER":
      return {
        ...state,
        filters: [...state.filters, action.payload],
      };
    case "REMOVE_FILTER":
      return {
        ...state,
        filters: state.filters.filter((_, i) => i !== action.payload),
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: [],
      };
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}

// Contexts

export const SessionContext = createContext<SessionState>(initialSessionState);

export const SessionDispatchContext = createContext<Dispatch<SessionAction>>(
  () => {
    throw new Error(
      "SessionDispatchContext used outside of SessionProvider"
    );
  }
);

// Hooks

export function useSession(): SessionState {
  return useContext(SessionContext);
}

export function useSessionDispatch(): Dispatch<SessionAction> {
  return useContext(SessionDispatchContext);
}
