import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import Page from "@/app/page";
const errors: string[] = [];
const origError = console.error;
console.error = (...a: unknown[]) => { errors.push(a.map(String).join(" ").slice(0, 300)); origError(...a); };
(window as unknown as { __hydrationErrors: string[] }).__hydrationErrors = errors;
hydrateRoot(document.getElementById("root") as HTMLElement, React.createElement(Page), {
  onRecoverableError: (e: unknown) => errors.push("recoverable: " + String(e).slice(0, 300)),
});
