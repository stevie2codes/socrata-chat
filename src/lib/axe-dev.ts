export async function initAxe() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined") return;

  const React = await import("react");
  const ReactDOM = await import("react-dom");
  const axe = await import("@axe-core/react");
  axe.default(React.default, ReactDOM.default, 1000);
}
