// Offline resend stand-in: records sends to $OUTBOX_PATH (set by the controller).
import { appendFileSync } from "node:fs";
export const resend = {
  emails: {
    async send(msg) {
      const outbox = process.env.OUTBOX_PATH;
      if (!outbox) throw new Error("OUTBOX_PATH is not set");
      appendFileSync(outbox, JSON.stringify({ to: msg.to, at: "2026-10-27T00:00:00.000Z" }) + "\n");
      return { id: `mock-${msg.to}` };
    },
  },
};
