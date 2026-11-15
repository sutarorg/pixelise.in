# Storage flow (Cloudflare R2)

Private bucket, direct browser upload, server-side verification, short-lived
downloads. The Next.js server never proxies image bytes.

## Buckets and keys

One private bucket (`R2_BUCKET_NAME`). Public access is off; there is no custom
domain serving objects.

```
originals/{user-id}/{asset-id}.{ext}
generated/{user-id}/{generation-id}/{output-id}.{ext}
```

`{user-id}` comes from the session, `{asset-id}`/`{output-id}` are UUIDs minted by
the server, and `{ext}` is derived from the sniffed MIME type. A filename from the
browser never reaches a key.

## Upload

```
1. POST /api/v1/uploads {filename, mimeType, bytes}
     ├─ requireUser, rate limit (60/h)
     ├─ validate type against uploadConstraints
     ├─ insert pending_uploads (object_key, mime, expected bytes, 15-min expiry)
     └─ sign PUT (ContentType signed, 120 s) → UploadTicket
2. Browser PUT <signed url> with the returned Content-Type header
3. POST /api/v1/uploads/{id}/complete
     ├─ HEAD the object (exists? length ≤ 20 MB?)
     ├─ range-GET first 64 KB → magic bytes + dimensions
     ├─ declared type must equal sniffed type; min 640 px per side
     ├─ insert assets (asset_type = original), mark pending completed
     └─ return UploadAsset
```

Rejections (wrong type, oversized, truncated, expired ticket) leave no asset row
and take no credits.

## Downloads

`createPresignedDownload(key, 300)` — five minutes, minted per request by the
service that owns the row. URLs are never stored in the database, never cached and
never logged.

## Generated images

After a completed fal job:

1. download the provider result with `fetchProviderResult` — https only, host
   allow-list (`fal.media`, `v3.fal.media`, `storage.googleapis.com`, `fal.run`),
   `redirect: "error"`, 25 MB ceiling;
2. sniff the bytes; an unreadable file fails the job and refunds the hold;
3. `PutObject` to `generated/...` with the sniffed content type;
4. insert `assets` (type `generated`, `generation_id` set) and
   `generation_outputs`;
5. settle credits and mark the generation completed.

If step 4 fails on a duplicate webhook, the unique constraint loses the race
safely and the existing output stands.

## Deletion

* `DELETE /api/v1/creations/{id}` sets `assets.deleted_at` and marks the
  generation cancelled — the audit trail survives.
* Object deletion is a separate, idempotent sweep (documented retention workflow).
  It is not done inline because a bucket delete cannot share a transaction with
  Postgres.
* Account deletion marks the account `deleted` immediately; assets and objects are
  removed by the same sweep, while payments and the ledger are retained for
  accounting.

## CORS

The bucket needs one rule for the deployed origins:

```json
[
  {
    "AllowedOrigins": ["https://pixelise.in", "https://www.pixelise.in", "https://<vercel-preview>.vercel.app", "http://127.0.0.1:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

`Content-Type` must be allowed because it is part of the signature. Preview URLs
change per deployment; either use a wildcard on the project domain or update the
rule when the preview host matters.

## Operational checks

* Bucket is private (no r2.dev public URL enabled for production).
* Access key is scoped to this bucket.
* Object lifecycle: none today — retention is an owner decision.
* `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
  are set as server-only environment variables.

## Local development

R2 has no emulator in this repo. With no R2 credentials the upload endpoints
return `not_configured`, and the studio shows its designed "storage not connected"
state instead of pretending. To exercise the flow locally, use a development
bucket and the CORS rule above with `http://127.0.0.1:3000`.
