import { openUrl } from "@tauri-apps/plugin-opener";

const EXTERNAL_URL = /^(https?:|mailto:)/i;

export const openerService = {
  isExternalUrl(href: string): boolean {
    return EXTERNAL_URL.test(href);
  },

  /** Opens http(s)/mailto links in the system browser/mail app. Other URLs are ignored. */
  async openExternal(href: string): Promise<void> {
    if (!EXTERNAL_URL.test(href)) return;
    await openUrl(href);
  },
};
