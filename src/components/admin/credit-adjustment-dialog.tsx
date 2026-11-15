"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { request } from "@/lib/api/core";
import { adminPaths, listPath, adjustCredits } from "@/lib/api/admin";
import type { AdminCreditAdjustmentResult, AdminPaginated, AdminUserRow } from "@/lib/api/admin-types";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/format";

type Step = "search" | "form" | "review" | "done";

const MAX_ADJUSTMENT = 100_000;
const MIN_REASON = 10;

/**
 * Manual credit adjustment.
 *
 * Two rules shape this UI:
 *  1. It never touches a wallet. It sends an adjustment request; the service
 *     validates, writes the ledger entry and returns the resulting balance.
 *  2. A reason is mandatory and is sent with the request, so the audit log has
 *     something real to record.
 *
 * The balance shown afterwards is the number the service returned, not one this
 * component calculated.
 */
export function CreditAdjustmentDialog({
  initialUser = null,
  disabled = false,
  disabledReason,
  label = "Adjust credits",
}: {
  initialUser?: { id: string; label: string } | null;
  /** True when this admin lacks `credits:write`; the control explains instead of disappearing. */
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>(initialUser ? "form" : "search");

  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<AdminUserRow[]>([]);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searched, setSearched] = React.useState(false);

  const [user, setUser] = React.useState<{ id: string; label: string } | null>(initialUser);
  const [direction, setDirection] = React.useState<"credit" | "debit">("credit");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AdminCreditAdjustmentResult | null>(null);

  const parsedAmount = Number.parseInt(amount, 10);
  const amountValid =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= MAX_ADJUSTMENT;
  const reasonValid = reason.trim().length >= MIN_REASON;

  function reset() {
    setStep(initialUser ? "form" : "search");
    setQuery("");
    setResults([]);
    setSearched(false);
    setSearchError(null);
    setUser(initialUser);
    setDirection("credit");
    setAmount("");
    setReason("");
    setError(null);
    setResult(null);
    setSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (submitting) return;
    setOpen(next);
    if (!next) reset();
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) {
      setSearchError("Enter at least 2 characters of the customer's email or name.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    const response = await request<AdminPaginated<AdminUserRow>>(
      listPath(adminPaths.users, { q: term, limit: "6" }),
    );
    setSearching(false);
    setSearched(true);
    if (response.ok) {
      setResults(response.data.items);
      return;
    }
    setResults([]);
    setSearchError(
      response.error.code === "not_configured"
        ? "This build has no admin API endpoint, so customers can't be looked up."
        : response.error.message,
    );
  }

  async function submit() {
    if (!user || !amountValid || !reasonValid) return;
    setSubmitting(true);
    setError(null);

    const response = await adjustCredits({
      userId: user.id,
      direction,
      credits: parsedAmount,
      reason: reason.trim(),
    });

    setSubmitting(false);
    if (response.ok) {
      setResult(response.data);
      setStep("done");
      router.refresh();
      return;
    }
    setError(
      response.error.code === "forbidden"
        ? "The service refused this adjustment: this account doesn't have the credits permission."
        : response.error.code === "not_configured"
          ? "This build has no admin API endpoint, so nothing was written."
          : response.error.message,
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className="h-8 text-[0.75rem]"
        >
          {label}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(42rem,92dvh)] w-[calc(100vw-1.5rem)] max-w-[32rem] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-[14px] border border-line bg-white shadow-float data-[state=open]:animate-overlay-in",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">
                {step === "done" ? "Adjustment recorded" : "Adjust credits"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-[0.75rem] leading-[1.5] text-muted">
                {step === "search"
                  ? "Find the customer first. The service applies the change."
                  : step === "done"
                    ? "The service confirmed the new balance."
                    : "A reason is required and is written to the audit log."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              disabled={submitting}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <X className="size-4" strokeWidth={2} />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {step === "search" ? (
              <form onSubmit={search} className="space-y-3">
                <div>
                  <Label htmlFor="adjust-customer" className="mb-1.5 text-[0.75rem]">
                    Customer email or name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="adjust-customer"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="name@example.com"
                      autoComplete="off"
                      className="h-10 text-[0.875rem]"
                    />
                    <Button type="submit" size="sm" variant="secondary" disabled={searching} className="h-10">
                      {searching ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="size-4" aria-hidden="true" />
                      )}
                      Find
                    </Button>
                  </div>
                  {searchError ? (
                    <p role="alert" className="mt-1.5 text-[0.75rem] text-[#7d2a22]">
                      {searchError}
                    </p>
                  ) : null}
                </div>

                <div role="status" aria-live="polite" className="sr-only">
                  {searching ? "Searching" : searched ? `${results.length} customers found` : ""}
                </div>

                {searched && results.length === 0 && !searchError ? (
                  <p className="rounded-[8px] border border-line bg-surface px-3 py-2.5 text-[0.75rem] leading-[1.5] text-muted-strong">
                    No customers matched that search. Nothing was changed.
                  </p>
                ) : null}

                {results.length > 0 ? (
                  <ul className="divide-y divide-line rounded-[8px] border border-line">
                    {results.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setUser({ id: row.id, label: row.displayName?.trim() || row.email });
                            setStep("form");
                          }}
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet"
                        >
                          <span className="text-[0.8125rem] font-semibold text-ink">
                            {row.displayName?.trim() || row.email}
                          </span>
                          <span className="text-[0.71875rem] text-muted">
                            {row.email} · {formatCredits(row.creditsAvailable)} available
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </form>
            ) : null}

            {step === "form" ? (
              <div className="space-y-4">
                <div className="rounded-[8px] border border-line bg-surface px-3 py-2.5">
                  <p className="text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted">
                    Customer
                  </p>
                  <p className="mt-0.5 truncate text-[0.8125rem] font-semibold text-ink">
                    {user?.label ?? "—"}
                  </p>
                  {!initialUser && user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUser(null);
                        setStep("search");
                      }}
                      className="mt-1 rounded text-[0.71875rem] font-semibold text-violet-ink underline decoration-violet/30 underline-offset-2 hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                    >
                      Choose a different customer
                    </button>
                  ) : null}
                </div>

                <fieldset>
                  <legend className="text-[0.75rem] font-semibold text-ink">Direction</legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "credit", label: "Add credits" },
                        { id: "debit", label: "Deduct credits" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-[8px] border px-3 py-2 text-[0.78125rem] font-semibold",
                          direction === option.id
                            ? "border-violet/40 bg-tint text-violet-ink"
                            : "border-line-strong bg-white text-ink-soft hover:border-ink/25",
                        )}
                      >
                        <input
                          type="radio"
                          name="direction"
                          value={option.id}
                          checked={direction === option.id}
                          onChange={() => setDirection(option.id)}
                          className="size-3.5 accent-[#6045f5]"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <Label htmlFor="adjust-amount" className="mb-1.5 text-[0.75rem]">
                    Credits
                  </Label>
                  <Input
                    id="adjust-amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_ADJUSTMENT}
                    step={1}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="150"
                    className="h-10 text-[0.875rem]"
                    aria-describedby="adjust-amount-hint"
                    aria-invalid={amount.length > 0 && !amountValid ? true : undefined}
                  />
                  <p id="adjust-amount-hint" className="mt-1 text-[0.71875rem] text-muted">
                    Whole credits between 1 and {formatCredits(MAX_ADJUSTMENT)}. Deductions cannot
                    take a balance below zero — the service rejects that.
                  </p>
                </div>

                <div>
                  <Label htmlFor="adjust-reason" className="mb-1.5 text-[0.75rem]">
                    Reason <span className="font-normal text-muted">(required, min {MIN_REASON} characters)</span>
                  </Label>
                  <Textarea
                    id="adjust-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why this adjustment is needed, e.g. failed generation compensated after support ticket #4821"
                    className="min-h-[5.5rem] text-[0.875rem]"
                    aria-describedby="adjust-reason-hint"
                    aria-invalid={reason.length > 0 && !reasonValid ? true : undefined}
                  />
                  <p id="adjust-reason-hint" className="mt-1 flex justify-between text-[0.71875rem] text-muted">
                    <span>Stored with the admin, amount and timestamp.</span>
                    <span className="tabular-nums">{reason.trim().length}</span>
                  </p>
                </div>
              </div>
            ) : null}

            {step === "review" ? (
              <div className="space-y-3">
                <div className="rounded-[10px] border border-[#f0d9a8] bg-[#fdf6e7] px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[0.75rem] font-bold text-[#6a5320]">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    This writes a ledger entry
                  </p>
                  <p className="mt-1 text-[0.75rem] leading-[1.55] text-[#6a5320]">
                    The service validates the request, updates the balance in one transaction and
                    records the reason. It cannot be undone from this screen.
                  </p>
                </div>
                <dl className="divide-y divide-line rounded-[10px] border border-line text-[0.8125rem]">
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">Customer</dt>
                    <dd className="truncate font-semibold text-ink">{user?.label}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">Change</dt>
                    <dd className="font-bold tabular-nums text-ink">
                      {direction === "credit" ? "+" : "−"}
                      {formatCredits(parsedAmount)} credits
                    </dd>
                  </div>
                  <div className="px-3 py-2">
                    <dt className="text-muted">Reason</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-ink-soft">{reason.trim()}</dd>
                  </div>
                </dl>
                {error ? (
                  <p role="alert" className="rounded-[8px] bg-[#fdf1f0] px-3 py-2 text-[0.78125rem] text-[#7d2a22]">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === "done" && result ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-[10px] border border-[#bfe6d2] bg-[#eefaf3] px-3 py-2.5">
                  <CheckCircle2 className="mt-px size-4 shrink-0 text-success" aria-hidden="true" />
                  <div className="min-w-0 text-[0.78125rem] leading-[1.55] text-[#0d6b46]">
                    <p className="font-semibold">Recorded by the service.</p>
                    <p className="mt-0.5">
                      {direction === "credit" ? "Added" : "Deducted"}{" "}
                      {formatCredits(result.credits)} credits for {user?.label}.
                    </p>
                  </div>
                </div>
                <dl className="divide-y divide-line rounded-[10px] border border-line text-[0.8125rem]">
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">Available balance</dt>
                    <dd className="font-bold tabular-nums text-ink">
                      {formatCredits(result.balanceAvailable)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">Reserved balance</dt>
                    <dd className="font-bold tabular-nums text-ink">
                      {formatCredits(result.balanceReserved)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">Transaction</dt>
                    <dd className="break-all font-mono text-[0.71875rem] text-ink-soft">
                      {result.transactionId}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
            {step === "form" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-9"
                  disabled={!amountValid || !reasonValid || !user}
                  onClick={() => {
                    setError(null);
                    setStep("review");
                  }}
                >
                  Review adjustment
                </Button>
              </>
            ) : null}

            {step === "review" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9"
                  disabled={submitting}
                  onClick={() => setStep("form")}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  className="h-9"
                  disabled={submitting}
                  onClick={submit}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {submitting ? "Sending…" : `Confirm ${direction === "credit" ? "credit" : "deduction"}`}
                </Button>
              </>
            ) : null}

            {step === "done" ? (
              <Button size="sm" className="h-9" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            ) : null}

            {step === "search" ? (
              <p className="text-[0.6875rem] leading-[1.5] text-muted sm:mr-auto">
                Adjustments are authorized and recorded by the service, never by this page.
              </p>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
