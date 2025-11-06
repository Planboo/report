import { render, type RenderOptions, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { TestProviders } from "./TestProviders";

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: TestProviders, ...options });
}

export { screen };
