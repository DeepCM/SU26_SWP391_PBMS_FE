# FE Deployment: S3 + CloudFront + GitHub Actions CI/CD

## Goal

Deploy the React/Vite FE (`github.com/DeepCM/SU26_SWP391_PBMS_FE`) to AWS S3 + CloudFront
with automated CI/CD via GitHub Actions. Replaces the teammate's Vercel copy as the
authoritative deployed FE, fully under the team's AWS account control.

## Architecture

```
GitHub push to main
       ↓
GitHub Actions
  1. npm run build → dist/
  2. aws s3 sync dist/ → S3 bucket (private)
  3. CloudFront cache invalidation (/* )
       ↓
CloudFront Distribution (HTTPS, default *.cloudfront.net URL)
  - Origin: S3 via OAC (Origin Access Control — bucket stays private)
  - Error pages: 403 + 404 → /index.html with HTTP 200 (React Router support)
       ↓
User's browser
```

## AWS Resources to Create

### S3 Bucket
- Name: `parking-fe-bucket` (or similar, must be globally unique)
- Region: `ap-southeast-1`
- Access: **private** — no public access, no static website hosting
- Versioning: off (CloudFront invalidation handles cache)

### CloudFront Distribution
- Origin: S3 bucket via OAC
- Viewer protocol: redirect HTTP → HTTPS
- Default root object: `index.html`
- Custom error responses:
  - 403 → `/index.html`, response code 200
  - 404 → `/index.html`, response code 200
- Price class: PriceClass_All (or PriceClass_100 for cost saving)

### IAM Policy (attach to existing BE IAM user)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::parking-fe-bucket",
        "arn:aws:s3:::parking-fe-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
```

## GitHub Actions Workflow

File: `.github/workflows/deploy.yml` in the FE repo

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

## GitHub Secrets (FE repo)

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Same key as BE repo |
| `AWS_SECRET_ACCESS_KEY` | Same key as BE repo |
| `AWS_REGION` | `ap-southeast-1` |
| `S3_BUCKET` | `parking-fe-bucket` |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront after creation |
| `VITE_API_URL` | `http://52.74.103.142:8080` |

## BE Config Update

After CloudFront distribution is created, update `deploy.yml` in the BE repo.
Replace all occurrences of `https://parking-car-frontend.vercel.app` with
the new CloudFront URL (e.g. `https://abc123.cloudfront.net`):

- `PayOS__ReturnUrl`
- `PayOS__CancelUrl`
- `CameraSession__MobileCameraBaseUrl`
- `CameraSession__MobileBookingScannerBaseUrl`
- `Cors__AllowedOrigins__1`

## Implementation Order

1. Create S3 bucket (AWS Console)
2. Create CloudFront distribution pointing to S3 (AWS Console)
3. Attach new IAM policy to existing IAM user (AWS Console)
4. Add GitHub Secrets to FE repo
5. Add `.github/workflows/deploy.yml` to FE repo and push
6. Verify GitHub Actions run succeeds and site loads at CloudFront URL
7. Update BE `deploy.yml` with new CloudFront URL and push to trigger BE redeploy
