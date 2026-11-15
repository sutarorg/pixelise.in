import { test as base, expect } from "@playwright/test";

/**
 * Base test with a console/error collector.
 *
 * The collector is opt-in per test: pages that legitimately log a `not_configured`
 * API warning (the studio, dashboard and payment routes when no backend is wired)
 * are expected to produce noise, so asserting "zero console errors" globally would
 * be either flaky or meaningless. Tests that assert on it use `expectNoConsoleErrors`
 * with an allow-list.
 */
export type ErrorRecorder = {
  errors: string[];
  expectNone: (allowed?: readonly RegExp[]) => void;
};

export const test = base.extend<{ recorder: ErrorRecorder }>({
  // The second parameter is named `provide` rather than `use`: eslint's
  // react-hooks rule treats any identifier beginning with "use" as a React hook.
  recorder: async ({ page }, provide) => {
    const errors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => {
      errors.push(`pageerror: ${error.message}`);
    });

    const recorder: ErrorRecorder = {
      errors,
      expectNone(allowed = []) {
        const unexpected = errors.filter((entry) => !allowed.some((pattern) => pattern.test(entry)));
        expect(unexpected, `Unexpected console/page errors:\n${unexpected.join("\n")}`).toEqual([]);
      },
    };

    await provide(recorder);
  },
});

export { expect };

/** Console noise that is expected when the backend is intentionally unconfigured. */
export const notConfiguredNoise = [
  /503/,
  /not_configured/i,
  /Failed to load resource/i,
  /the server responded with a status of 5\d\d/i,
];
