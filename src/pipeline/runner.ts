import { firstLine } from './parse'
import type { Job, Step } from './types'

/*
 * What a GitHub runner would do with each step: how long it takes and what it
 * prints. Nothing is executed. The times and the lines are made up from what
 * the step says (`npm ci`, `actions/checkout`, `docker build` …), so a run
 * looks and feels like a real one.
 */

export type Os = 'linux' | 'windows' | 'macos' | 'self-hosted'

export type LogKind = 'head' | 'muted' | 'out' | 'ok' | 'error'

/** One line of a step's log; `at` is how far through the step it appears (0–1). */
export type LogLine = { at: number; text: string; kind: LogKind }

export function osOf(runner: string): Os {
  const r = runner.toLowerCase()
  if (r.includes('self-hosted')) return 'self-hosted'
  if (r.includes('windows')) return 'windows'
  if (r.includes('macos') || r.includes('mac-')) return 'macos'
  return 'linux'
}

/** Windows and macOS runners are slower to install and build. */
const OS_PACE: Record<Os, number> = { linux: 1, 'self-hosted': 0.8, macos: 1.3, windows: 1.5 }

const SYSTEM: Record<Os, { system: string; image: string }> = {
  linux: { system: 'Ubuntu 24.04.3 LTS', image: 'ubuntu-24.04' },
  windows: { system: 'Microsoft Windows Server 2025 Datacenter', image: 'windows-2025' },
  macos: { system: 'macOS 15.6 (arm64)', image: 'macos-15-arm64' },
  'self-hosted': { system: 'Ubuntu 22.04 LTS (your own machine)', image: 'self-hosted' },
}

/* ───────────────────────── run: scripts ───────────────────────── */

type Command = { re: RegExp; secs: number | ((m: RegExpExecArray) => number); out?: string[]; fail?: string[] }

const COMMANDS: Command[] = [
  {
    re: /\b(playwright|cypress|e2e)\b/,
    secs: 45,
    out: ['Running 24 tests using 4 workers', '', '  24 passed (38.2s)'],
    fail: [
      'Running 24 tests using 4 workers',
      '  1) [chromium] › login.spec.ts:12:5 › signs in',
      '    Error: expect(locator).toBeVisible() failed',
      '  1 failed',
      '  23 passed (41.0s)',
    ],
  },
  {
    re: /\b((npm|pnpm|yarn|bun)( run)? test|vitest|jest|pytest|go test|cargo test|mvn test|gradle test|dotnet test|rspec|phpunit)\b/,
    secs: 20,
    out: [
      ' ✓ src/app.test.ts (24 tests) 112ms',
      ' ✓ src/api.test.ts (41 tests) 260ms',
      '',
      ' Test Files  12 passed (12)',
      '      Tests  318 passed (318)',
    ],
    fail: [
      ' ✓ src/api.test.ts (41 tests) 260ms',
      ' ✗ src/app.test.ts > adds up the basket',
      '   AssertionError: expected 41 to be 42',
      '',
      ' Test Files  1 failed | 11 passed (12)',
      '      Tests  1 failed | 317 passed (318)',
    ],
  },
  {
    re: /\b(npm (ci|install|i)|pnpm (install|i)|yarn install|bun install|pip install|poetry install|bundle install|composer install|go mod download|cargo fetch)\b|^yarn$/,
    secs: 18,
    out: [
      'added 412 packages, and audited 413 packages in 11s',
      '',
      '58 packages are looking for funding',
      '',
      'found 0 vulnerabilities',
    ],
    fail: ['npm error code ERESOLVE', 'npm error ERESOLVE could not resolve', 'npm error While resolving: your-project@1.0.0'],
  },
  {
    re: /\b(lint|eslint|oxlint|prettier|ruff|flake8|golangci-lint|stylelint|biome|clippy)\b/,
    secs: 8,
    out: ['Found 0 warnings and 0 errors.'],
    fail: [
      'src/cart.ts',
      "  12:7  error  'total' is assigned a value but never used  no-unused-vars",
      '',
      '✖ 1 problem (1 error, 0 warnings)',
    ],
  },
  {
    re: /\b(tsc|typecheck|type-check|mypy)\b/,
    secs: 12,
    out: ['Checked 214 files: no type errors.'],
    fail: ["src/cart.ts(12,7): error TS2322: Type 'string' is not assignable to type 'number'.", 'Found 1 error.'],
  },
  {
    re: /\b((npm|pnpm|yarn|bun)( run)? build|vite build|next build|webpack|go build|cargo build|mvn (package|install)|gradle build|dotnet build|make)\b/,
    secs: 24,
    out: [
      'vite v8.3.6 building for production...',
      '✓ 1843 modules transformed.',
      'dist/index.html                4.12 kB',
      'dist/assets/index-B7xQ2.js   412.80 kB',
      '✓ built in 6.42s',
    ],
    fail: ["src/App.tsx(12,7): error TS2322: Type 'string' is not assignable to type 'number'.", 'Found 1 error.'],
  },
  {
    re: /\bdocker (buildx )?build\b/,
    secs: 40,
    out: [
      '#1 [internal] load build definition from Dockerfile',
      '#6 [build 3/6] RUN npm ci',
      '#9 [build 6/6] RUN npm run build',
      '#12 exporting to image',
      '#12 naming to ghcr.io/you/your-project:latest done',
    ],
    fail: [
      '#9 [build 6/6] RUN npm run build',
      '#9 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1',
    ],
  },
  {
    re: /\bdocker push\b/,
    secs: 14,
    out: ['The push refers to repository [ghcr.io/you/your-project]', 'latest: digest: sha256:4f1c0e9a2e size: 1784'],
    fail: ['denied: permission_denied: write_package'],
  },
  {
    re: /\b(kubectl|helm)\b/,
    secs: 12,
    out: [
      'deployment.apps/web configured',
      'Waiting for deployment "web" rollout to finish: 2 of 3 updated replicas are available...',
      'deployment "web" successfully rolled out',
    ],
    fail: ['error: deployment "web" exceeded its progress deadline'],
  },
  { re: /\bterraform init\b/, secs: 6, out: ['Terraform has been successfully initialized!'] },
  { re: /\bterraform plan\b/, secs: 14, out: ['Plan: 2 to add, 1 to change, 0 to destroy.'] },
  {
    re: /\bterraform apply\b/,
    secs: 25,
    out: ['Apply complete! Resources: 2 added, 1 changed, 0 destroyed.'],
    fail: ['Error: creating S3 Bucket: BucketAlreadyExists'],
  },
  { re: /\bgh release\b/, secs: 4, out: ['https://github.com/you/your-project/releases/tag/v1.4.0'] },
  { re: /\bgh (pr|issue|api)\b/, secs: 3, out: ['https://github.com/you/your-project/pull/42#issuecomment-1'] },
  {
    re: /\b(curl|wget)\b/,
    secs: 2,
    out: ['HTTP/2 200'],
    fail: ['curl: (22) The requested URL returned error: 503'],
  },
  { re: /\b(aws|gcloud|az|vercel|netlify|wrangler|flyctl)\s/, secs: 8, out: ['Deployed.'] },
  { re: /\bsleep (\d+)/, secs: (m) => Number(m[1]) },
]

const TRIVIAL =
  /^(echo|printf|cp|mv|mkdir|rm|cat|ls|cd|export|test|true|touch|tee|set|source|\.|if|then|else|elif|fi|for|do|done|while|case|esac|\{|\}|\[|\(|\))\b|^[A-Za-z_][A-Za-z0-9_]*=|^\S+\)$|^;;$/

/** The lines of a script that do something, without comments and continuation breaks. */
function commands(script: string): string[] {
  return script
    .replace(/\\\n/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function commandSeconds(line: string): number {
  for (const cmd of COMMANDS) {
    const m = cmd.re.exec(line)
    if (m) return typeof cmd.secs === 'function' ? cmd.secs(m) : cmd.secs
  }
  return TRIVIAL.test(line) ? 0.2 : 1.5
}

/* ───────────────────────── uses: actions ───────────────────────── */

type Action = { secs: number; log: (step: Step) => string[] }

const ACTIONS: Record<string, Action> = {
  'actions/checkout': {
    secs: 3,
    log: (s) => [
      'Syncing repository: you/your-project',
      'Getting Git version info',
      s.with['fetch-depth'] === '0'
        ? '[command]/usr/bin/git -c protocol.version=2 fetch --prune origin +refs/heads/*:refs/remotes/origin/* +refs/tags/*:refs/tags/*'
        : '[command]/usr/bin/git -c protocol.version=2 fetch --no-tags --prune --depth=1 origin',
      'Checking out the ref',
      'HEAD is now at 3f9c2e1 Update the app',
    ],
  },
  'actions/setup-node': {
    secs: 4,
    log: (s) => [
      `Attempting to download ${s.with['node-version'] || 'lts/*'}...`,
      `Found in cache @ /opt/hostedtoolcache/node/${s.with['node-version'] || '24'}.x/x64`,
      ...(s.with.cache ? [`Cache restored from key: node-cache-Linux-x64-${s.with.cache}-9d1c4f`] : []),
    ],
  },
  'actions/setup-python': { secs: 4, log: (s) => [`Successfully set up CPython (${s.with['python-version'] || '3.13'})`] },
  'actions/setup-go': { secs: 4, log: (s) => [`Setup go version spec ${s.with['go-version'] || '1.25'}`, 'Found in cache'] },
  'actions/setup-java': {
    secs: 5,
    log: (s) => [`Java ${s.with['java-version'] || '21'} was downloaded`, 'Setting Java as the default'],
  },
  'actions/setup-dotnet': { secs: 6, log: () => ['Installed .NET SDK'] },
  'actions/cache': { secs: 3, log: () => ['Cache restored successfully', 'Cache restored from key: Linux-deps-9d1c4f'] },
  'actions/upload-artifact': {
    secs: 4,
    log: (s) => [
      'With the provided path, there will be 18 files uploaded',
      `Artifact ${s.with.name || 'artifact'} has been successfully uploaded! Final size is 412 KB.`,
    ],
  },
  'actions/download-artifact': {
    secs: 3,
    log: (s) => [`Downloading artifact '${s.with.name || 'all'}'`, 'Artifact download completed successfully.'],
  },
  'actions/upload-pages-artifact': {
    secs: 5,
    log: (s) => [`Archiving '${s.with.path || '_site'}'`, 'Uploaded artifact github-pages (1.2 MB)'],
  },
  'actions/configure-pages': { secs: 1, log: () => ['Pages site: https://you.github.io/your-project/'] },
  'actions/deploy-pages': {
    secs: 12,
    log: () => [
      'Fetching artifact metadata for "github-pages"',
      'Created deployment for 3f9c2e1',
      'Getting Pages deployment status...',
      'Reported success!',
    ],
  },
  'actions/github-script': { secs: 2, log: () => ['Script ran.'] },
  'docker/setup-buildx-action': { secs: 4, log: () => ['Creating a new builder instance', 'Booting builder'] },
  'docker/setup-qemu-action': { secs: 3, log: () => ['Installing QEMU static binaries'] },
  'docker/login-action': {
    secs: 2,
    log: (s) => [`Logging into ${s.with.registry || 'Docker Hub'}...`, 'Login Succeeded!'],
  },
  'docker/metadata-action': {
    secs: 1,
    log: () => ['Tags: ghcr.io/you/your-project:main, ghcr.io/you/your-project:sha-3f9c2e1'],
  },
  'docker/build-push-action': {
    secs: 45,
    log: () => [
      '#1 [internal] load build definition from Dockerfile',
      '#6 [build 3/6] RUN npm ci',
      '#9 [build 6/6] RUN npm run build',
      '#14 exporting to image',
      '#14 pushing layers done',
      '#14 pushing manifest for ghcr.io/you/your-project:sha-3f9c2e1 done',
    ],
  },
  'github/codeql-action/init': { secs: 6, log: () => ['Initializing CodeQL for javascript-typescript'] },
  'github/codeql-action/autobuild': { secs: 20, log: () => ['Nothing to build for JavaScript.'] },
  'github/codeql-action/analyze': { secs: 40, log: () => ['Interpreting results.', 'No new alerts.'] },
  'softprops/action-gh-release': {
    secs: 4,
    log: () => ['Release ready at https://github.com/you/your-project/releases/tag/v1.4.0'],
  },
  'codecov/codecov-action': { secs: 4, log: () => ['Coverage report uploaded: 87.4%'] },
  'aws-actions/configure-aws-credentials': { secs: 2, log: () => ['Assuming role with OIDC'] },
  'peaceiris/actions-gh-pages': { secs: 6, log: () => ['Pushed to gh-pages'] },
}

const actionOf = (uses: string) => ACTIONS[uses.split('@')[0].toLowerCase()]

/* ───────────────────────── how long ───────────────────────── */

/** How long a step takes on this kind of runner, in simulated seconds (before each copy's own wobble). */
export function stepSeconds(step: Step, os: Os): number {
  let secs: number
  if (step.uses) {
    const action = actionOf(step.uses)
    secs = action?.secs ?? (step.uses.startsWith('docker://') ? 10 : 4)
    if (step.uses.startsWith('actions/checkout') && step.with['fetch-depth'] === '0') secs += 2
    if (step.uses.startsWith('actions/setup-') && step.with.cache) secs += 2
  } else if (step.run) {
    secs = commands(step.run).reduce((sum, line) => sum + commandSeconds(line), 0)
  } else secs = 1
  return Math.max(1, secs * OS_PACE[os])
}

export const SETUP_SECONDS = 2
export const COMPLETE_SECONDS = 1
/** A job that calls a reusable workflow runs that whole workflow. */
export const CALL_SECONDS = 25

/* ───────────────────────── what it prints ───────────────────────── */

function spread(lines: string[], kind: LogKind, from: number, to: number): LogLine[] {
  return lines.map((text, i) => ({
    at: lines.length === 1 ? (from + to) / 2 : from + ((to - from) * i) / (lines.length - 1),
    text,
    kind,
  }))
}

const SHELL: Record<Os, string> = {
  linux: '/usr/bin/bash -e {0}',
  'self-hosted': '/usr/bin/bash -e {0}',
  macos: '/bin/bash -e {0}',
  windows: 'C:\\Program Files\\PowerShell\\7\\pwsh.EXE -command ". \'{0}\'"',
}

/** What `echo "…"` prints, when it prints to the log and not into a file. */
function echoed(line: string): string | null {
  const m = /^echo\s+(.*)$/.exec(line)
  if (!m || /\s>>?\s*\S/.test(m[1]) || /\$\{?GITHUB_(OUTPUT|ENV|STEP_SUMMARY|PATH)/.test(m[1])) return null
  return m[1].replace(/^["']|["']$/g, '')
}

/**
 * A step's log. `fill` puts the run's values into `${{ }}`; a failing step
 * ends with the error GitHub prints.
 */
export function stepLog(step: Step, os: Os, failed: boolean, fill: (text: string) => string): LogLine[] {
  const head: LogLine[] = []
  const body: string[] = []
  let failure: string[] = []

  if (step.uses) {
    head.push({ at: 0, text: `Run ${step.uses}`, kind: 'head' })
    for (const [key, value] of Object.entries(step.with)) {
      head.push({ at: 0, text: `  ${key}: ${fill(value)}`, kind: 'muted' })
    }
    body.push(...(actionOf(step.uses)?.log(step) ?? ['Done.']))
    failure = ['Error: the action failed (simulated)']
  } else if (step.run) {
    head.push({ at: 0, text: `Run ${fill(firstLine(step.run))}`, kind: 'head' })
    const lines = commands(step.run)
    if (lines.length > 1) for (const line of lines) head.push({ at: 0, text: `  ${fill(line)}`, kind: 'muted' })
    head.push({ at: 0, text: `  shell: ${SHELL[os]}`, kind: 'muted' })
    for (const [key, value] of Object.entries(step.env)) head.push({ at: 0, text: `  ${key}: ${fill(value)}`, kind: 'muted' })

    // the slowest command is the one that fails
    let worst = 0
    let worstSecs = -1
    lines.forEach((line, i) => {
      const secs = commandSeconds(line)
      if (secs >= worstSecs) {
        worst = i
        worstSecs = secs
      }
    })
    lines.forEach((line, i) => {
      if (failed && i > worst) return
      const cmd = COMMANDS.find((c) => c.re.test(line))
      if (failed && i === worst) {
        failure = cmd?.fail ?? []
        return
      }
      const said = echoed(line)
      if (said !== null) body.push(fill(said))
      if (cmd?.out) body.push(...cmd.out)
    })
  }

  const out = spread(body, 'out', 0.12, failed ? 0.6 : 0.95)
  if (!failed) return [...head, ...out]
  return [
    ...head,
    ...out,
    ...spread(failure, 'error', 0.7, 0.95),
    { at: 1, text: '##[error]Process completed with exit code 1.', kind: 'error' },
  ]
}

/** "Set up job": the fresh machine, its token and the actions it downloads. */
export function setupLog(job: Job, runner: string, os: Os, name: string): LogLine[] {
  const { system, image } = SYSTEM[os]
  const actions = [...new Set(job.steps.map((s) => s.uses).filter((u): u is string => !!u && !u.startsWith('./')))]
  const lines: [string, LogKind][] = [
    [`Current runner version: '2.330.0'`, 'out'],
    [`Runner: ${runner || 'ubuntu-latest'}`, 'out'],
    [`Operating System: ${system}`, 'out'],
    [`Runner Image: ${image}`, 'out'],
    [`GITHUB_TOKEN Permissions: ${job.permissions ?? 'contents: read, metadata: read'}`, 'out'],
    ['Secret source: Actions', 'muted'],
    ['Prepare workflow directory', 'muted'],
    ['Prepare all required actions', 'muted'],
    ...actions.map((a): [string, LogKind] => [`Download action repository '${a}'`, 'muted']),
    [`Complete job name: ${name}`, 'ok'],
  ]
  return lines.map(([text, kind], i) => ({ at: i / Math.max(1, lines.length - 1), text, kind }))
}

export function callLog(uses: string): LogLine[] {
  return [
    { at: 0, text: `Uses: ${uses}`, kind: 'head' },
    { at: 0.3, text: 'The called workflow runs its own jobs, one after another.', kind: 'out' },
    { at: 1, text: 'The called workflow finished.', kind: 'ok' },
  ]
}

export function completeLog(): LogLine[] {
  return [
    { at: 0, text: 'Post job cleanup.', kind: 'muted' },
    { at: 0.5, text: 'Cleaning up orphan processes', kind: 'muted' },
    { at: 1, text: 'The machine is thrown away: nothing is kept for the next job.', kind: 'muted' },
  ]
}
