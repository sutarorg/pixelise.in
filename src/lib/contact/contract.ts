/**
 * Typed contract for the Pixelise support contact channel.
 *
 * Stage 1 ships the public site only: this contract is the agreed shape between
 * the marketing site and the backend delivered in stage 4. No request is sent
 * from the UI yet, and no success state is simulated. See docs/API-CONTRACT.md.
 */

export const contactTopics = [
  "product-question",
  "billing-and-credits",
  "technical-issue",
  "partnership",
] as const;

export type ContactTopic = (typeof contactTopics)[number];

export type ContactRequest = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  /** Page the visitor sent the message from, for triage. */
  sourcePath: string;
  /** Honeypot — must stay empty for a valid submission. */
  website?: "";
};

export type ContactResponse =
  | {
      ok: true;
      /** Opaque reference the visitor can quote in later correspondence. */
      ticketId: string;
    }
  | {
      ok: false;
      /** Field-level errors keyed by request field, plus a form-level message. */
      errors: Partial<Record<keyof ContactRequest | "form", string>>;
    };

/** Validation shared by the UI and the future route handler. */
export const contactLimits = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  message: { min: 20, max: 2000 },
} as const;

export const contactTopicLabels: Record<ContactTopic, string> = {
  "product-question": "Product question",
  "billing-and-credits": "Packs, credits or billing",
  "technical-issue": "Technical issue",
  partnership: "Partnership or press",
};
