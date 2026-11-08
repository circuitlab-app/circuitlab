import circuitLabWorkflow from '../../.github/workflows/deploy.yml?raw'

/*
 * Workflows to try in the Pipeline Lab. The first is Circuit Lab's own
 * release workflow, read straight from .github/workflows/deploy.yml, so the
 * page always shows the pipeline this site is really published with.
 */

export type ExampleId = 'circuitlab' | 'node' | 'pull' | 'docker' | 'release'

const NODE_CI = `# Lint and test side by side, then build once both pass.
name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    # one copy of this job for every Node.js version
    name: Test on Node \${{ matrix.node }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test

  build:
    name: Build
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
`

const PULL_CHECKS = `# Every pull request gets checked three ways at once,
# and a preview site when all three pass.
name: Pull request checks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  types:
    name: Type check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit

  unit:
    name: Unit tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      # a coverage upload that fails must not fail the check
      - uses: codecov/codecov-action@v5
        continue-on-error: true

  e2e:
    name: Browser tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm ci
      - run: npx playwright test
      # only when the tests failed: keep the report to look at
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report

  preview:
    name: Preview site
    needs: [types, unit, e2e]
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: https://pr-\${{ github.event.pull_request.number }}.preview.example.com
    steps:
      - uses: actions/checkout@v5
      - run: |
          npm ci
          npm run build
      - run: npx wrangler pages deploy dist --branch \${{ github.head_ref }}
      - uses: actions/github-script@v8
        with:
          script: "github.rest.issues.createComment({ ...context.repo, issue_number: context.issue.number, body: 'Preview is ready' })"
`

const DOCKER_DEPLOY = `# Test, build a Docker image, try it on staging,
# then put it live when a version tag is pushed.
name: Build and deploy

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: Where to deploy
        type: choice
        options: [staging, production]
        default: staging

env:
  IMAGE: ghcr.io/you/your-project

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm ci
      - run: npm test

  image:
    name: Build the image
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      tag: \${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v5
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.IMAGE }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: \${{ steps.meta.outputs.tags }}

  staging:
    name: Deploy to staging
    needs: image
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - run: helm upgrade web ./chart --set image.tag=\${{ needs.image.outputs.tag }}
      - name: Smoke test
        run: curl --fail https://staging.example.com/health

  production:
    name: Deploy to production
    # a job can only read the outputs of the jobs it needs itself
    needs: [image, staging]
    if: startsWith(github.ref, 'refs/tags/v') || inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - run: helm upgrade web ./chart --set image.tag=\${{ needs.image.outputs.tag }}
      - name: Smoke test
        run: curl --fail https://example.com/health
`

const RELEASE = `# Pushing a tag like v1.4.0 builds the app for three systems,
# publishes a release with all three, and tells the team either way.
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  build:
    name: Build for \${{ matrix.os }}
    runs-on: \${{ matrix.os }}
    strategy:
      # one system failing should not stop the others
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-go@v6
        with:
          go-version: '1.25'
      - run: go test ./...
      - run: go build -o dist/app ./cmd/app
      - uses: actions/upload-artifact@v4
        with:
          name: app-\${{ runner.os }}
          path: dist

  publish:
    name: Publish the release
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v5
      - uses: softprops/action-gh-release@v2
        with:
          files: app-*/*
          generate_release_notes: true

  notify:
    name: Tell the team
    needs: [build, publish]
    # runs even when a job before it failed
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Say it worked
        if: needs.publish.result == 'success'
        run: curl -X POST "$CHAT_WEBHOOK" -d "Released \${{ github.ref_name }}"
        env:
          CHAT_WEBHOOK: \${{ secrets.CHAT_WEBHOOK }}
      - name: Say it failed
        if: needs.publish.result != 'success'
        run: curl -X POST "$CHAT_WEBHOOK" -d "Release \${{ github.ref_name }} failed"
        env:
          CHAT_WEBHOOK: \${{ secrets.CHAT_WEBHOOK }}
`

export type Example = {
  id: ExampleId
  source: string
  /** the event to start with, when not the first one the page would pick */
  prefer?: string
}

export const EXAMPLES: Example[] = [
  { id: 'circuitlab', source: circuitLabWorkflow },
  { id: 'node', source: NODE_CI },
  { id: 'pull', source: PULL_CHECKS, prefer: 'pull_request' },
  { id: 'docker', source: DOCKER_DEPLOY },
  { id: 'release', source: RELEASE },
]

export const exampleById = (id: string) => EXAMPLES.find((e) => e.id === id)
