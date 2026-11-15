import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { contactTopicLabels, contactTopics } from "@/lib/contact/contract";

/**
 * The support form is rendered in full but not wired to a backend. Fields and
 * the submit control are disabled, and the notice explains exactly why — no
 * submission is simulated and no success state is shown.
 */
export function ContactForm() {
  const disabledNoteId = "contact-unavailable-note";

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card sm:p-8">
      <div
        id={disabledNoteId}
        className="rounded-[10px] border border-line bg-surface px-4 py-3.5"
      >
        <p className="text-[0.8125rem] font-semibold text-ink">
          Support messaging is not open yet.
        </p>
        <p className="mt-1 text-[0.8125rem] leading-[1.55] text-muted">
          This is the form Pixelise will use for support. It cannot send a message
          yet, so nothing here pretends to. The FAQ and policy pages already answer
          most of what people write in about.
        </p>
      </div>

      <form className="mt-7 flex flex-col gap-5" aria-describedby={disabledNoteId}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">Your name</Label>
            <Input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              disabled
              aria-describedby={disabledNoteId}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email">Email address</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@store.com"
              disabled
              aria-describedby={disabledNoteId}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-topic">What is this about?</Label>
          <div className="relative">
            <Select
              id="contact-topic"
              name="topic"
              defaultValue="product-question"
              disabled
              aria-describedby={disabledNoteId}
            >
              {contactTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {contactTopicLabels[topic]}
                </option>
              ))}
            </Select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            name="message"
            placeholder="Tell us what you need help with."
            disabled
            aria-describedby={disabledNoteId}
          />
          <FieldHint>
            Include your pack name if your question is about a purchase, and the
            product category if it is about an image.
          </FieldHint>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.75rem] leading-[1.5] text-muted">
            A support address will be published here once the inbox is live.
            Nothing is collected by this form today.
          </p>
          <Button type="submit" size="lg" disabled aria-describedby={disabledNoteId}>
            Send message
          </Button>
        </div>
      </form>
    </div>
  );
}
