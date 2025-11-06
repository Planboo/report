import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

export function TestProviders({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}


