# S3 + CloudFront + GitHub Actions CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the React/Vite FE to AWS S3 + CloudFront with automated GitHub Actions CI/CD, replacing the teammate's Vercel copy.

**Architecture:** GitHub Actions builds the Vite app on every push to `main` and syncs the `dist/` output to a private S3 bucket. CloudFront sits in front of S3 via OAC (Origin Access Control), serves HTTPS, and handles React Router's client-side routing by redirecting 404/403 errors to `index.html`.

**Tech Stack:** AWS S3, AWS CloudFront (OAC), AWS IAM, GitHub Actions, Vite, React 19

---

## Files to Create / Modify

| Action | Path |
|--------|------|
| Create | `PBMS_FE/.github/workflows/deploy.yml` |
| Modify | BE repo: `.github/workflows/deploy.yml` (update Vercel URLs → CloudFront URL) |

---

## Task 1: Create the S3 Bucket

**Why:** S3 stores the built static files (`index.html`, JS, CSS, assets). We keep it **private** — no public access — because CloudFront will be the only entry point. This prevents direct bucket URL access and forces all traffic through HTTPS.

- [ ] **Step 1: Open S3 in AWS Console**

  Go to AWS Console → search "S3" → click **Create bucket**

- [ ] **Step 2: Configure bucket basics**

  Fill in:
  - **Bucket name:** `parking-pbms-fe` *(must be globally unique — if taken, try `parking-pbms-fe-2024` or add your initials)*
  - **AWS Region:** `ap-southeast-1` (Singapore — same as your BE)

- [ ] **Step 3: Block all public access**

  Under "Block Public Access settings":
  - Leave **all 4 checkboxes checked** (default). This keeps the bucket private.
  - Do NOT uncheck anything — CloudFront doesn't need public access.

- [ ] **Step 4: Leave all other settings as default**

  - Object Ownership: ACLs disabled (default)
  - Versioning: Disable
  - Encryption: SSE-S3 (default)

- [ ] **Step 5: Click Create bucket**

  You should see the bucket appear in the list. Note the exact bucket name you used.

---

## Task 2: Create the CloudFront Distribution

**Why:** CloudFront is a CDN that sits in front of S3. It gives us HTTPS (required by the BE for CORS), caches files at edge locations for speed, and lets us redirect 404/403 errors to `index.html` — which is required for React Router's `BrowserRouter` to work. Without this, refreshing on `/bookings` would show a 403 error from S3 instead of your app.

- [ ] **Step 1: Open CloudFront in AWS Console**

  AWS Console → search "CloudFront" → click **Create distribution**

- [ ] **Step 2: Set the origin**

  Under "Origin":
  - **Origin domain:** Click the dropdown and select your S3 bucket (`parking-pbms-fe.s3.ap-southeast-1.amazonaws.com`)
  - **Origin access:** Select **"Origin access control settings (recommended)"**
  - Click **Create new OAC** → leave defaults → click **Create**
  - *(OAC = Origin Access Control. It lets CloudFront access your private S3 bucket securely without making the bucket public.)*

- [ ] **Step 3: Set viewer protocol**

  Under "Default cache behavior":
  - **Viewer protocol policy:** `Redirect HTTP to HTTPS`
  - **Allowed HTTP methods:** `GET, HEAD` (default, fine for static sites)

- [ ] **Step 4: Set default root object**

  Scroll down to "Settings":
  - **Default root object:** `index.html`
  - **Price class:** `Use only North America and Europe` (PriceClass_100) to stay closer to free tier, OR `Use all edge locations` for best global speed

- [ ] **Step 5: Create the distribution**

  Click **Create distribution**. It will take 5–10 minutes to deploy globally.

  AWS will show a **yellow banner** saying you need to update the S3 bucket policy. **Copy the policy from that banner** — you'll use it in Step 6.

- [ ] **Step 6: Apply the S3 bucket policy**

  The policy CloudFront gives you looks like this (with your actual account ID and distribution ID filled in):

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontServicePrincipal",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::parking-pbms-fe/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
          }
        }
      }
    ]
  }
  ```

  Go to: S3 → `parking-pbms-fe` → **Permissions** tab → **Bucket policy** → **Edit** → paste the policy → **Save changes**

- [ ] **Step 7: Add custom error pages (critical for React Router)**

  Go to: CloudFront → your distribution → **Error pages** tab → **Create custom error response**

  Add these two entries:

  **Entry 1:**
  - HTTP error code: `403`
  - Customize error response: Yes
  - Response page path: `/index.html`
  - HTTP response code: `200`

  **Entry 2:**
  - HTTP error code: `404`
  - Customize error response: Yes
  - Response page path: `/index.html`
  - HTTP response code: `200`

  **Why:** When a user navigates directly to `/bookings`, S3 has no file at that path and returns 403. Without this rule, the user sees an XML error. With it, CloudFront serves `index.html` instead and React Router takes over.

- [ ] **Step 8: Note the CloudFront domain name**

  On the distribution detail page, copy the **Distribution domain name** — it looks like `abc123def456.cloudfront.net`. You'll need this later.

---

## Task 3: Attach IAM Policy to Existing IAM User

**Why:** The GitHub Actions workflow needs AWS credentials to run `aws s3 sync` and `aws cloudfront create-invalidation`. Rather than creating a new IAM user (and managing new secrets), we attach a new policy to the existing IAM user already used by the BE. That way the FE repo can reuse the same `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` already stored in the BE.

- [ ] **Step 1: Find the existing IAM user**

  AWS Console → IAM → **Users** → find the user your BE uses.
  *(If unsure which user, check the BE repo's GitHub Secrets — the key ID starts with `AKIA...`. In IAM → Users, the Access Key ID column matches.)*

- [ ] **Step 2: Create an inline policy**

  Click the user → **Permissions** tab → **Add permissions** → **Create inline policy** → **JSON** tab

  Paste this policy (replace `parking-pbms-fe` with your actual bucket name if different):

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "S3FEDeploy",
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::parking-pbms-fe",
          "arn:aws:s3:::parking-pbms-fe/*"
        ]
      },
      {
        "Sid": "CloudFrontInvalidate",
        "Effect": "Allow",
        "Action": ["cloudfront:CreateInvalidation"],
        "Resource": "*"
      }
    ]
  }
  ```

- [ ] **Step 3: Name and save the policy**

  - Policy name: `ParkingFEDeployPolicy`
  - Click **Create policy**

  Verify it appears under the user's Permissions tab.

---

## Task 4: Add GitHub Secrets to FE Repo

**Why:** GitHub Actions can't hardcode credentials in the workflow file (that would expose them publicly). Instead, secrets are stored encrypted in GitHub and injected as environment variables at runtime.

- [ ] **Step 1: Open the FE repo settings**

  Go to `github.com/DeepCM/SU26_SWP391_PBMS_FE` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

- [ ] **Step 2: Add each secret**

  Add these one by one (click "New repository secret" for each):

  | Name | Value |
  |------|-------|
  | `AWS_ACCESS_KEY_ID` | Same value as in the BE repo |
  | `AWS_SECRET_ACCESS_KEY` | Same value as in the BE repo |
  | `AWS_REGION` | `ap-southeast-1` |
  | `S3_BUCKET` | `parking-pbms-fe` *(your exact bucket name)* |
  | `CLOUDFRONT_DISTRIBUTION_ID` | The distribution ID from Task 2 Step 8 *(looks like `E1ABCDEF2GHIJK`)* |
  | `VITE_API_URL` | `http://52.74.103.142:8080` |

  **Why `VITE_API_URL`?** Vite bakes environment variables into the compiled JS at build time — not at runtime. So the API URL must be provided during `npm run build` via the GitHub Actions environment.

---

## Task 5: Write the GitHub Actions Workflow

**Why:** This is the CI/CD pipeline. Every push to `main` triggers: install → build → upload to S3 → clear CloudFront cache. The `--delete` flag on `s3 sync` removes old files from S3 that no longer exist in the build output, keeping the bucket clean.

- [ ] **Step 1: Create the workflow file**

  Create file at `PBMS_FE/.github/workflows/deploy.yml`:

  ```yaml
  name: Deploy FE to S3 + CloudFront

  on:
    push:
      branches: [main]

  jobs:
    deploy:
      name: Build & Deploy
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - name: Setup Node 20
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build
          run: npm run build
          env:
            VITE_API_URL: ${{ secrets.VITE_API_URL }}

        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v4
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: ${{ secrets.AWS_REGION }}

        - name: Sync to S3
          run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete

        - name: Invalidate CloudFront cache
          run: |
            aws cloudfront create-invalidation \
              --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
              --paths "/*"
  ```

- [ ] **Step 2: Commit and push**

  ```bash
  git -C "path/to/PBMS_FE" add .github/workflows/deploy.yml
  git -C "path/to/PBMS_FE" commit -m "ci: add S3 + CloudFront deployment workflow"
  git -C "path/to/PBMS_FE" push origin main
  ```

---

## Task 6: Verify the Deployment

**Why:** We need to confirm GitHub Actions ran successfully, files are in S3, and the site is reachable — including that React Router works on deep links.

- [ ] **Step 1: Check GitHub Actions**

  Go to `github.com/DeepCM/SU26_SWP391_PBMS_FE` → **Actions** tab

  You should see a workflow run triggered by your push. Wait for all steps to show green checkmarks.

  If it fails, click the failed step to read the error log.

- [ ] **Step 2: Check S3 has files**

  AWS Console → S3 → `parking-pbms-fe` → verify you see `index.html`, `assets/` folder, etc.

- [ ] **Step 3: Open the CloudFront URL**

  Open `https://YOUR_DISTRIBUTION.cloudfront.net` in a browser.

  Expected: Your React app's home page loads.

- [ ] **Step 4: Test React Router deep links**

  Navigate directly to `https://YOUR_DISTRIBUTION.cloudfront.net/bookings` (type it in the address bar, don't click a link).

  Expected: The Bookings page loads (not an XML error or 403).

  If you get an XML error, the custom error pages from Task 2 Step 7 weren't saved correctly — go back and re-check.

- [ ] **Step 5: Note the full CloudFront URL**

  Write it down — you need it for Task 7. Example: `https://abc123def456.cloudfront.net`

---

## Task 7: Update BE Config to Point to New CloudFront URL

**Why:** The BE's `deploy.yml` still has `https://parking-car-frontend.vercel.app` hardcoded in 5 places. If left unchanged, PayOS payment callbacks will redirect users to Vercel (which may be stale), and CORS will block requests from your new CloudFront domain.

- [ ] **Step 1: Open the BE workflow file**

  File: `D:\Study\FPTU\Term8\SWP391\BE\ParkingBuildingManagementSystem_BE\.github\workflows\deploy.yml`

- [ ] **Step 2: Replace all 5 Vercel URLs**

  Replace every occurrence of `https://parking-car-frontend.vercel.app` with your CloudFront URL (e.g. `https://abc123def456.cloudfront.net`).

  The 5 locations on line 68 are:
  - `-e PayOS__ReturnUrl=https://parking-car-frontend.vercel.app/bookings`
  - `-e PayOS__CancelUrl=https://parking-car-frontend.vercel.app/bookings`
  - `-e CameraSession__MobileCameraBaseUrl=https://parking-car-frontend.vercel.app/mobile-camera`
  - `-e CameraSession__MobileBookingScannerBaseUrl=https://parking-car-frontend.vercel.app/mobile-booking-scanner`
  - `-e Cors__AllowedOrigins__1=https://parking-car-frontend.vercel.app`

- [ ] **Step 3: Commit and push the BE change**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "config: update FE URLs from Vercel to CloudFront"
  git push origin main
  ```

  This triggers the BE's GitHub Actions to redeploy with the new CORS and PayOS URLs.

- [ ] **Step 4: Verify BE redeploy succeeded**

  Go to `github.com/NguyenQuocBaoILY/ParkingBuildingManagementSystem_BE` → **Actions** tab → confirm the new run is green.

- [ ] **Step 5: End-to-end smoke test**

  Open `https://YOUR_DISTRIBUTION.cloudfront.net` → log in → try creating a booking with payment.

  Expected: PayOS redirects back to `https://YOUR_DISTRIBUTION.cloudfront.net/bookings` (not Vercel).
