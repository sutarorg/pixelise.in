# Cloudflare R2 setup

## 1. Bucket

1. Cloudflare dashboard → R2 → **Create bucket**, e.g. `pixelise-assets`.
2. Leave public access **off**. Do not enable an `r2.dev` public URL in production.
3. Location hint: automatic (or EU/APAC if you have a preference; R2 is private and
   signed, so location mostly affects latency of signed PUT/GET).

## 2. API token

R2 → **Manage API tokens** → Create token → *Object Read & Write*, scoped to the
one bucket.

You receive:
* Access Key ID → `R2_ACCESS_KEY_ID`
* Secret Access Key → `R2_SECRET_ACCESS_KEY`
* Account ID is on the R2 overview page → `R2_ACCOUNT_ID`

The endpoint is derived automatically as
`https://<account-id>.r2.cloudflarestorage.com`; set `R2_ENDPOINT` only to
override it.

## 3. CORS

Bucket → Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://pixelise.in",
      "https://www.pixelise.in",
      "https://pixelise-in-git-*.vercel.app",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

`Content-Type` **must** be allowed: it is part of the signed PUT. Without this rule
the browser fails the preflight and the studio shows an upload error.

## 4. Sizing and limits

* Bucket limit: 20 MB per original (enforced server-side after upload).
* Generated images: 25 MB download ceiling, `4096 px` sanity limit on the longest
  side.
* Presigned PUT: 120 seconds. Presigned GET: 300 seconds.
* Upload ticket validity: 15 minutes.

## 5. Verification

```bash
curl -I "<a presigned PUT url>"
```

Expect `200`/`403` for a HEAD, never a public listing. A signed URL used after its
expiry must fail.

Then in the app:

1. Upload a JPEG in `/studio`; the object appears under
   `originals/<userId>/<assetId>.jpg`.
2. Complete the upload; `/api/v1/uploads/{id}/complete` returns real dimensions.
3. Try a PNG renamed to `.jpg`; completion is rejected (magic bytes).
4. Try a 25 MB file; the browser uploads, completion rejects it as too large.

## 6. Lifecycle (owner decision)

No object lifecycle rule is configured. Retention is an open owner input; when
decided, implement it as an explicit sweep (see `storage-flow.md` § Deletion) rather
than a bucket rule that silently deletes a customer's paid result.
