import { invoke } from "@tauri-apps/api/core";

export const markdownService = {
  /** Renders Markdown to sanitized HTML in Rust (the app's single Markdown parser). */
  render(markdown: string): Promise<string> {
    return invoke<string>("render_markdown", { markdown });
  },
};
