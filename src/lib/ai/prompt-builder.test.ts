import { describe, expect, it } from "vitest";

import { buildPrompt, describePromptChoice } from "@/lib/ai/prompt-builder";

describe("prompt builder", () => {
  it("always protects product identity", () => {
    const { prompt } = buildPrompt({ styleId: "studio", aspectRatio: "1:1" });
    expect(prompt).toMatch(/silhouette, proportions/i);
    expect(prompt).toMatch(/label word/i);
    expect(prompt).toMatch(/logo/i);
    expect(prompt).toMatch(/colour values unchanged/i);
  });

  it("never claims guaranteed accuracy", () => {
    for (const styleId of ["studio", "lifestyle", "advertising"]) {
      const { prompt } = buildPrompt({ styleId, aspectRatio: "4:5" });
      expect(prompt.toLowerCase()).not.toContain("100%");
      expect(prompt.toLowerCase()).not.toContain("perfectly accurate");
      expect(prompt.toLowerCase()).not.toContain("guarantee");
    }
  });

  it("applies the style direction and the scene direction", () => {
    const studio = buildPrompt({ styleId: "studio", aspectRatio: "1:1" }).prompt;
    const lifestyle = buildPrompt({ styleId: "lifestyle", aspectRatio: "1:1" }).prompt;
    expect(studio).toContain("clean commercial studio");
    expect(lifestyle).toContain("believable real-world setting");

    const scene = buildPrompt({ styleId: "lifestyle", sceneId: "luxury-marble-setup", aspectRatio: "1:1" }).prompt;
    expect(scene).toContain("pale marble surface");
  });

  it("keeps the requested aspect ratio in the instructions", () => {
    expect(buildPrompt({ styleId: "studio", aspectRatio: "9:16" }).prompt).toContain("9:16");
  });

  it("is deterministic — the same ids always produce the same prompt", () => {
    const first = buildPrompt({ styleId: "advertising", sceneId: "premium-dramatic-lighting", aspectRatio: "16:9" });
    const second = buildPrompt({ styleId: "advertising", sceneId: "premium-dramatic-lighting", aspectRatio: "16:9" });
    expect(first.prompt).toBe(second.prompt);
  });

  it("describes the choice using server-side labels", () => {
    const label = describePromptChoice({ styleId: "studio", sceneId: "minimal-white-studio" });
    expect(label).toContain("·");
    expect(label.length).toBeGreaterThan(3);
  });
});
