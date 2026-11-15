import type { GenerationStatus } from "@/lib/api/types";

/**
 * The studio's own state machine. It mirrors the service's job states but keeps
 * the browser's work (upload, prepare) separate from the service's work
 * (render), so the UI can tell the customer exactly which step they are on.
 */
export type StudioPhase =
  | "idle"
  | "uploading"
  | "preparing"
  | "processing"
  | "completed"
  | "failed";

export const busyPhases: StudioPhase[] = ["uploading", "preparing", "processing"];

export function isBusy(phase: StudioPhase): boolean {
  return busyPhases.includes(phase);
}

export const phaseLabel: Record<StudioPhase, string> = {
  idle: "Ready to generate",
  uploading: "Uploading your photo",
  preparing: "Preparing your scene",
  processing: "Rendering your visual",
  completed: "Visual ready",
  failed: "Generation didn't start",
};

/** Human label for a service job status, shown under the progress bar. */
export function jobStatusLabel(status: GenerationStatus): string {
  switch (status) {
    case "queued":
      return "Queued — your job is next in line";
    case "preparing":
      return "Preparing the scene";
    case "rendering":
      return "Rendering your visual";
    case "completed":
      return "Finished";
    case "failed":
      return "The render failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Working";
  }
}
