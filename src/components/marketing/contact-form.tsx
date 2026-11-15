"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { contactLimits, contactTopicLabels, contactTopics, type ContactTopic } from "@/lib/contact/contract";

/**
 * Support form, wired to `POST /api/v1/public/contact`.
 *
 * The same `contactLimits` and topic list the route validates with are used here,
 * so the form cannot accept something the server will reject for a different
 * reason. The honeypot field stays empty for people and is never shown.
 *
 * Every failure has a state of its own: a field error, a rate limit, an
 * unconfigured backend, or an outage. None of them is rendered as "sent".
 */

type Errors = Partial<Record<"name" | "email" | "topic" | "message" | "form", string>>;
type Status = "idle" | "sending" | "sent" | "error";

interface TicketResponse {
  ok: true;
  ticketId: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [ticketId, setTicketId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("product-question");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < contactLimits.name.min) next.name = "Enter your name.";
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (!contactTopics.includes(topic)) next.topic = "Choose a topic.";
    if (message.trim().length < contactLimits.message.min) {
      next.message = `Tell us a little more (${contactLimits.message.min}+ characters).`;
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          sourcePath: typeof window === "undefined" ? "/contact" : window.location.pathname,
          website: honeypot,
        }),
      });

      const body = (await response.json()) as
        | { success: true; data: TicketResponse }
        | { success: false; error: { code: string; message: string; details?: Record<string, string> } };

      if (body.success) {
        setTicketId(body.data.ticketId);
        setStatus("sent");
        return;
      }

      if (body.error.code === "validation_failed" && body.error.details) {
        setErrors(body.error.details as Errors);
        setStatus("error");
        return;
      }

      if (body.error.code === "not_configured") {
        setErrors({
          form: "Support messaging isn't connected in this deployment, so your message wasn't sent. Nothing was stored.",
        });
        setStatus("error");
        return;
      }

      setErrors({ form: body.error.message });
      setStatus("error");
    } catch {
      setErrors({
        form: "We couldn't reach the server. Your message wasn't sent — check your connection and try again.",
      });
      setStatus("error");
    }
  }

  if (status === "sent" && ticketId) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card sm:p-8">
        <p className="text-[0.9375rem] font-semibold text-ink">Message received.</p>
        <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted">
          Your reference is <span className="font-mono text-ink">{ticketId}</span>. We reply to the
          address you gave, usually within one working day.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-5"
          onClick={() => {
            setStatus("idle");
            setTicketId(null);
            setName("");
            setEmail("");
            setMessage("");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card sm:p-8">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">Your name</Label>
            <Input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
            {errors.name ? <FieldError id="contact-name-error">{errors.name}</FieldError> : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-email">Email address</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@store.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
            />
            {errors.email ? <FieldError id="contact-email-error">{errors.email}</FieldError> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-topic">What is this about?</Label>
          <div className="relative">
            <Select
              id="contact-topic"
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value as ContactTopic)}
            >
              {contactTopics.map((item) => (
                <option key={item} value={item}>
                  {contactTopicLabels[item]}
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
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
          />
          {errors.message ? (
            <FieldError id="contact-message-error">{errors.message}</FieldError>
          ) : (
            <FieldHint>
              Include your pack name if your question is about a purchase, and the product
              category if it is about an image.
            </FieldHint>
          )}
        </div>

        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        {errors.form ? (
          <p
            role="alert"
            className="rounded-[10px] border border-line bg-surface px-4 py-3 text-[0.8125rem] leading-[1.55] text-ink"
          >
            {errors.form}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.75rem] leading-[1.5] text-muted">
            We use your name and email only to answer this message.
          </p>
          <Button type="submit" size="lg" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </div>
  );
}
