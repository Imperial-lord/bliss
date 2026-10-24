# Ultra-Efficient GitHub Actions Plan for Bliss (Private Repo: ≤ 2,000 min/mo)

## 1. Budget Mathematics & Optimization Strategy

GitHub gives **2,000 free runner minutes per month** for private repositories on Ubuntu runners ($1\times$ multiplier).
To guarantee you stay well below the 2,000-minute threshold:

- **Target Run Time**: $\le 60\text{ to }90\text{ seconds}$ per workflow run.
- **Run Budget**: With 90-second runs, 2,000 minutes allows for **~1,300+ full CI runs per month** (over 40 builds every single day).
- **Core Optimization Rules**:
  1. **Path-Based Triggering (`paths:`)**:
     - Changes only to `client/` only run frontend build & checks.
     - Changes only to `server/` only run server unit tests.
     - Markdown/documentation changes (`*.md`, `LICENSE`, `deploy/`) do NOT trigger CI.
  2. **Aggressive `npm` Caching (`cache: 'npm'`)**:
     - Cuts `npm ci` install time from 30s down to ~4s.
  3. **Concurrency Cancellation (`cancel-in-progress: true`)**:
     - If you push 3 commits in rapid succession, GitHub immediately cancels runs 1 and 2, saving 66% of the runner minutes.
  4. **Single Unified Job (vs Matrix)**:
     - Matrix jobs duplicate setup overhead. Running client build + server unit tests in a single runner reuses Node setup in < 60 seconds total.

---

## 2. Proposed Workflows

### Workflow 1: Fast CI Validation (`.github/workflows/ci.yml`)
*Triggers*: Pull Requests and pushes to `main` when code files change.
*Average Runtime*: **~45 to 60 seconds** (~1 minute consumed).

```yaml
name: CI

on:
  push:
    branches: [ main ]
    paths:
      - 'client/**'
      - 'server/**'
      - 'package*.json'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'client/**'
      - 'server/**'
      - 'package*.json'
      - '.github/workflows/ci.yml'

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci
          npm ci --prefix server
          npm ci --prefix client

      - name: Verify Client Build
        run: npm run build --prefix client

      - name: Run Server Unit & Signaling Tests
        run: npm test --prefix server
```

---

### Workflow 2: Automated Deployment to OCI (`.github/workflows/deploy.yml`)
*Triggers*: Pushes to `main` only (after CI passes).
*Average Runtime*: **~30 to 45 seconds**.
*Secrets needed*: `OCI_SSH_KEY` (Ed25519 private key), `OCI_HOST` (`140.245.246.201`).

```yaml
name: CD - Deploy to OCI

on:
  push:
    branches: [ main ]
    paths:
      - 'client/**'
      - 'server/**'
      - 'deploy/**'
      - 'docker-compose.yml'
      - '.github/workflows/deploy.yml'

concurrency:
  group: deploy-production
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Build Production Client Bundle
        run: |
          npm ci --prefix client
          npm run build --prefix client

      - name: Deploy Frontend to VM 1 & Backend to VM 2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.OCI_HOST }}
          username: ubuntu
          key: ${{ secrets.OCI_SSH_KEY }}
          script: |
            echo "Deploying update on OCI..."
            # Sync to VM 2 over internal VCN and restart containers
            ssh -i ~/.ssh/bliss_oci_key ubuntu@10.0.1.20 "cd /home/ubuntu/bliss && git pull && docker compose up -d --build"
```

---

### Workflow 3: On-Demand Live E2E Smoke Test (`.github/workflows/e2e-smoke.yml`)
*Triggers*: Manual trigger via GitHub UI (`workflow_dispatch`) or weekly schedule.
*Average Runtime*: **~40 seconds**.
*Validates*: Tests live WebSocket connection, room join, and HTTP 206 partial streaming against `https://bliss.webhop.me`.

```yaml
name: E2E Production Smoke Test

on:
  workflow_dispatch:
  schedule:
    # Runs weekly on Sunday at midnight UTC (consumes ~4 minutes/month)
    - cron: '0 0 * * 0'

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --prefix server
      - run: TARGET_URL=https://bliss.webhop.me npm run test:e2e
```

---

## 3. Estimated Monthly Minute Consumption Table

| Workflow | Frequency | Duration | Monthly Minutes | % of Free Limit (2,000 min) |
| :--- | :--- | :--- | :--- | :--- |
| **CI Validation** | 60 pushes/month | ~50 sec (1 min billed) | **~60 min** | **3.0%** |
| **CD Auto-Deploy** | 20 releases/month | ~40 sec (1 min billed) | **~20 min** | **1.0%** |
| **Weekly Smoke Test** | 4 runs/month | ~40 sec (1 min billed) | **~4 min** | **0.2%** |
| **Total Usage** | — | — | **~84 minutes** | **4.2%** |

This leaves you with **over 1,900+ spare minutes** every single month.
