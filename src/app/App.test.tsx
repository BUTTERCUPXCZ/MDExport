import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { appService } from "@/services/tauri/app";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the welcome message and the version from Rust", async () => {
    vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Welcome to MDForge" })).toBeInTheDocument();
    expect(await screen.findByText("v0.1.0")).toBeInTheDocument();
  });

  it("shows a fallback when the version cannot be loaded", async () => {
    vi.spyOn(appService, "getInfo").mockRejectedValue(new Error("IPC unavailable"));

    render(<App />);

    expect(await screen.findByText("Version unavailable")).toBeInTheDocument();
  });
});
