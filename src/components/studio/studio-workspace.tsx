"use client";

import * as React from "react";
import Link from "next/link";
import { Coins, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StepPanel } from "@/components/studio/panel";
import { ImageUploader, type SelectedPhoto } from "@/components/studio/image-uploader";
import { PhotographyStyleSelector } from "@/components/studio/photography-style-card";
import { SceneSelector } from "@/components/studio/scene-selector";
import { GenerationSettings } from "@/components/studio/generation-settings";
import { GenerationPreview } from "@/components/studio/generation-preview";
import { isBusy, type StudioPhase } from "@/components/studio/types";
import { formatCredits } from "@/lib/format";
import {
  completeUpload,
  createGeneration,
  createUploadTicket,
  getGeneration,
  putFileToStorage,
} from "@/lib/api/browser";
import type {
  ApiResult,
  AspectRatioOption,
  CreditWallet,
  Generation,
  GenerationStatus as JobStatus,
  PhotographyStyle,
  QualityOption,
  StudioScene,
} from "@/lib/api/types";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 48;

export interface StudioWorkspaceProps {
  styles: PhotographyStyle[];
  scenes: StudioScene[];
  aspectRatios: AspectRatioOption[];
  qualities: QualityOption[];
  configSource: "service" | "default";
  wallet: ApiResult<CreditWallet>;
  initialStyleId?: string;
}

/**
 * Upload → configure → generate → review → download.
 *
 * The browser never prices a generation, never deducts a credit and never
 * invents progress. It asks the service for a signed upload, uploads the bytes
 * to storage, asks the service to create the job, then reflects the job's real
 * status until it reaches a terminal state.
 */
export function StudioWorkspace({
  styles,
  scenes,
  aspectRatios,
  qualities,
  configSource,
  wallet,
  initialStyleId,
}: StudioWorkspaceProps) {
  const [photo, setPhoto] = React.useState<SelectedPhoto | null>(null);
  const [styleId, setStyleId] = React.useState<string>(
    () => styles.find((style) => style.id === initialStyleId)?.id ?? styles[0]?.id ?? "",
  );
  const [sceneChoice, setSceneChoice] = React.useState<{ styleId: string; sceneId: string | null }>({
    styleId: "",
    sceneId: null,
  });
  const [aspectRatioId, setAspectRatioId] = React.useState<string>(aspectRatios[0]?.id ?? "1:1");
  const [qualityId, setQualityId] = React.useState<string>(qualities[0]?.id ?? "standard");

  const [phase, setPhase] = React.useState<StudioPhase>("idle");
  const [generation, setGeneration] = React.useState<Generation | null>(null);
  const [jobStatus, setJobStatus] = React.useState<JobStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const availableScenes = React.useMemo(
    () => scenes.filter((scene) => scene.styleIds.includes(styleId)),
    [scenes, styleId],
  );

  /*
   * Scene validity is derived, not synchronised in an effect: if the chosen
   * scene does not belong to the current style (or the style just changed), the
   * first scene for that style is used. No cascading render, no stale state.
   */
  const sceneId =
    sceneChoice.styleId === styleId && availableScenes.some((scene) => scene.id === sceneChoice.sceneId)
      ? sceneChoice.sceneId
      : (availableScenes[0]?.id ?? null);

  const setSceneId = React.useCallback(
    (id: string) => setSceneChoice({ styleId, sceneId: id }),
    [styleId],
  );

  /* The local preview URL belongs to the customer's file, not to a stored
     asset, so it is revoked as soon as it is replaced or the page unmounts. */
  React.useEffect(() => {
    if (!photo) return;
    const url = photo.previewUrl;
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  React.useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const quality = qualities.find((option) => option.id === qualityId) ?? null;
  const aspect = aspectRatios.find((option) => option.id === aspectRatioId) ?? null;
  const cost = quality?.credits ?? null;
  const available = wallet.ok ? wallet.data.available : null;
  const shortfall = cost !== null && available !== null && available < cost ? cost - available : 0;
  const busy = isBusy(phase);

  function scrollToCanvas() {
    const node = canvasRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function applyJob(job: Generation) {
    setGeneration(job);
    setJobStatus(job.status);
    if (job.status === "completed") {
      setPhase("completed");
      setError(null);
      return true;
    }
    if (job.status === "failed" || job.status === "cancelled") {
      setPhase("failed");
      setError(job.failureReason ?? "The render didn't finish. Nothing was charged.");
      return true;
    }
    setPhase("processing");
    return false;
  }

  function pollJob(id: string, attempt = 0, misses = 0) {
    pollTimer.current = setTimeout(async () => {
      const result = await getGeneration(id);
      if (!result.ok) {
        if (misses >= 2) {
          setPhase("failed");
          setError(
            "We lost contact with the studio while your visual was rendering. Check My Creations in a moment — nothing is charged twice.",
          );
          return;
        }
        pollJob(id, attempt + 1, misses + 1);
        return;
      }
      const terminal = applyJob(result.data);
      if (terminal) return;
      if (attempt + 1 >= MAX_POLLS) {
        setPhase("failed");
        setError(
          "This render is taking longer than usual. It may still finish — check My Creations shortly.",
        );
        return;
      }
      pollJob(id, attempt + 1, 0);
    }, POLL_INTERVAL_MS);
  }

  function fail(message: string) {
    setPhase("failed");
    setError(message);
  }

  async function handleGenerate() {
    if (!photo || busy) return;
    if (!sceneId) {
      fail("Choose a scene before generating.");
      return;
    }

    scrollToCanvas();
    setError(null);
    setGeneration(null);
    setJobStatus(null);
    setPhase("uploading");

    const filename = photo.file.name || "product-photo";
    const ticket = await createUploadTicket({
      filename,
      mimeType: photo.file.type,
      bytes: photo.file.size,
    });

    if (!ticket.ok) {
      fail(
        ticket.error.code === "not_configured"
          ? "The studio service isn't connected in this environment, so nothing was uploaded and no credits were used."
          : ticket.error.message,
      );
      return;
    }

    const uploaded = await putFileToStorage(ticket.data, photo.file);
    if (!uploaded.ok) {
      fail(uploaded.message);
      return;
    }

    setPhase("preparing");
    const asset = await completeUpload(ticket.data.id);
    if (!asset.ok) {
      fail(asset.error.message);
      return;
    }

    setPhase("processing");
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const created = await createGeneration(
      {
        assetId: asset.data.id,
        styleId,
        sceneId,
        aspectRatioId,
        qualityId,
      },
      idempotencyKey,
    );

    if (!created.ok) {
      fail(created.error.message);
      return;
    }

    const terminal = applyJob(created.data.generation);
    if (!terminal) pollJob(created.data.generation.id);
  }

  function handleReset() {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setGeneration(null);
    setJobStatus(null);
    setError(null);
    setPhase("idle");
  }

  function handleRemovePhoto() {
    handleReset();
    setPhoto(null);
  }

  const buttonLabel = (() => {
    switch (phase) {
      case "uploading":
        return "Uploading…";
      case "preparing":
        return "Preparing…";
      case "processing":
        return "Rendering…";
      case "failed":
        return "Try again";
      case "completed":
        return "Generate another";
      default:
        return "Generate visual";
    }
  })();

  const blockedReason = !photo
    ? "Add a product photo to continue."
    : !sceneId
      ? "Choose a scene to continue."
      : shortfall > 0
        ? `You need ${formatCredits(shortfall)} more credits for this generation.`
        : null;

  return (
    <div className="grid gap-3 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)] xl:gap-4">
      <div className="min-w-0 space-y-3">
        {configSource === "default" ? (
          <Alert tone="offline" title="Default studio catalogue">
            The studio service isn&apos;t connected here, so these are the styles and scenes Pixelise
            ships as its default list. Cost and availability are confirmed by the service when you
            generate.
          </Alert>
        ) : null}

        <StepPanel step={1} title="Product photo">
          <ImageUploader
            photo={photo}
            error={null}
            disabled={busy}
            onSelect={(next) => {
              setPhoto(next);
              handleReset();
            }}
            onRemove={handleRemovePhoto}
          />
        </StepPanel>

        <StepPanel step={2} title="Photography style">
          <PhotographyStyleSelector
            styles={styles}
            value={styleId}
            onChange={setStyleId}
            disabled={busy}
          />
        </StepPanel>

        <StepPanel
          step={3}
          title="Scene"
          hint={availableScenes.length > 0 ? "Matched to the style you picked." : undefined}
        >
          <SceneSelector
            scenes={availableScenes}
            value={sceneId}
            onChange={setSceneId}
            disabled={busy}
          />
        </StepPanel>

        <StepPanel step={4} title="Output settings">
          <GenerationSettings
            aspectRatios={aspectRatios}
            qualities={qualities}
            aspectRatioId={aspectRatioId}
            qualityId={qualityId}
            onAspectRatioChange={setAspectRatioId}
            onQualityChange={setQualityId}
            disabled={busy}
          />
        </StepPanel>

        <div className="rounded-[14px] border border-line bg-white p-3.5 shadow-card sm:p-4">
          <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[0.75rem] font-semibold text-ink">Generation cost</p>
              <p className="mt-0.5 text-[0.6875rem] leading-[1.45] text-muted">
                {cost !== null
                  ? `${quality?.label ?? "Selected quality"} · confirmed before any credits are reserved`
                  : "Set by the studio service when you generate"}
              </p>
            </div>
            <p className="shrink-0 text-right">
              <span className="text-[1.0625rem] font-extrabold tabular-nums text-ink">
                {cost !== null ? formatCredits(cost) : "—"}
              </span>
              <span className="ml-1 text-[0.6875rem] font-semibold text-muted">credits</span>
            </p>
          </div>

          {available !== null ? (
            <p className="mt-2 text-[0.6875rem] text-muted">
              {formatCredits(available)} available
              {wallet.ok && wallet.data.reserved > 0
                ? ` · ${formatCredits(wallet.data.reserved)} reserved`
                : ""}
            </p>
          ) : null}

          {shortfall > 0 ? (
            <Alert
              tone="danger"
              className="mt-3"
              title="Not enough credits"
              action={
                <Button asChild size="sm">
                  <Link href="/credits">
                    <Coins className="size-3.5" aria-hidden="true" />
                    Buy credits
                  </Link>
                </Button>
              }
            >
              This generation needs {formatCredits(cost ?? 0)} credits and you have{" "}
              {formatCredits(available ?? 0)}.
            </Alert>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="mt-3 w-full"
            disabled={!photo || !sceneId || busy || shortfall > 0}
            onClick={handleGenerate}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {buttonLabel}
          </Button>

          <p
            className={cn(
              "mt-2 text-center text-[0.6875rem] leading-[1.5]",
              blockedReason ? "text-muted-strong" : "text-muted",
            )}
          >
            {blockedReason ??
              "Your photo is uploaded only when you generate. Credits settle after the render finishes."}
          </p>
        </div>
      </div>

      <div ref={canvasRef} className="min-w-0 scroll-mt-20">
        <GenerationPreview
          phase={phase}
          jobStatus={jobStatus}
          photo={photo}
          generation={generation}
          error={error}
          aspect={aspect}
          onRetry={handleGenerate}
          onReset={handleReset}
          onBrowse={() => document.getElementById("product-photo")?.click()}
        />
      </div>
    </div>
  );
}
