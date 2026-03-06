"use client";

import { useEffect } from "react";

export function AxeInit() {
  useEffect(() => {
    import("@/lib/axe-dev").then((m) => m.initAxe());
  }, []);
  return null;
}
