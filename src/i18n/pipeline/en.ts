import type { PipelineBook } from './types'

const code = (text: string) => `“${text}”`

export const enPipeline: PipelineBook = {
  title: 'Pipeline Lab',
  subtitle: 'Watch a GitHub Actions workflow run, like current through a circuit',
  back: 'Circuit board',
  workflow: 'Workflow',
  list: (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`),
  examples: {
    circuitlab: {
      name: 'Circuit Lab: check, release, publish',
      description: 'The real workflow this site is published with',
    },
    node: { name: 'Node.js CI', description: 'Lint and a test matrix side by side, then one build' },
    pull: { name: 'Pull request checks', description: 'Three checks at once, then a preview site' },
    docker: { name: 'Build and deploy', description: 'Docker image, staging, then production with approval' },
    release: { name: 'Release on a tag', description: 'Build for three systems, publish, tell the team' },
  },
  yours: 'Your workflow',
  controls: {
    run: 'Run',
    pause: 'Pause',
    resume: 'Resume',
    again: 'Run again',
    restart: 'Start over',
    cancel: 'Cancel run',
    speed: 'Speed',
    clock: 'Simulated time',
  },
  run: {
    ready: 'Ready',
    'not-triggered': 'Not triggered',
    running: 'Running',
    waiting: 'Waiting for approval',
    success: 'Passed',
    failure: 'Failed',
    cancelled: 'Cancelled',
  },
  job: {
    ready: 'Ready',
    pending: 'Waiting for its needs',
    waiting: 'Waiting for approval',
    queued: 'Waiting for a runner',
    running: 'Running',
    success: 'Passed',
    failure: 'Failed',
    cancelled: 'Cancelled',
    skipped: 'Skipped',
  },
  events: {
    push: 'Push',
    pull_request: 'Pull request',
    pull_request_target: 'Pull request (target)',
    workflow_dispatch: 'Run by hand',
    schedule: 'On a schedule',
    release: 'Release',
    workflow_call: 'Called by another workflow',
    workflow_run: 'After another workflow',
    merge_group: 'Merge queue',
    issues: 'Issue',
    issue_comment: 'Issue comment',
  },
  trigger: { title: 'Trigger', fire: 'Fire the event', fired: 'Fired', off: 'Not triggered', listens: 'Listens to' },
  why: (r) => {
    switch (r.code) {
      case 'noSuchEvent':
        return `The workflow doesn't listen to ${code(r.event)}.`
      case 'branch':
        return r.ignore
          ? `${code(r.name)} matches branches-ignore: ${r.patterns.join(', ')}.`
          : `${code(r.name)} isn't in branches: ${r.patterns.join(', ')}.`
      case 'tag':
        return r.ignore
          ? `${code(r.name)} matches tags-ignore: ${r.patterns.join(', ')}.`
          : `${code(r.name)} isn't in tags: ${r.patterns.join(', ')}.`
      case 'onlyTags':
        return 'This push trigger only listens to tags, not branches.'
      case 'onlyBranches':
        return 'This push trigger only listens to branches, not tags.'
      case 'types':
        return `It only listens to these activity types: ${r.types.join(', ')}.`
    }
  },
  card: {
    copies: (n) => `${n} copies`,
    waitingFor: (env) => `Waiting for someone to approve ${code(env)}`,
    approve: 'Approve',
    reject: 'Reject',
    skippedIf: 'Skipped: its if: was false',
    skippedNeeds: "Skipped: a job it needs didn't succeed",
    cancelled: 'Cancelled before it ran',
    rejected: 'The deployment was rejected',
    failFast: 'Cancelled: another copy failed (fail-fast)',
    breakStep: 'Make this step fail',
    fixStep: 'Let this step pass again',
    protected: 'needs approval',
    added: 'GitHub adds this step to every job',
    waitsFor: (jobs) => `Waits for ${jobs}`,
  },
  result: { title: 'Run result', hint: 'Lights up green only when no job failed' },
  tabs: { scenario: 'Set up', logs: 'Logs', yaml: 'YAML', guide: 'How it works' },
  scenario: {
    event: 'Event',
    pushTo: 'Push to',
    branchPush: 'a branch',
    tagPush: 'a tag',
    branch: 'Branch',
    tag: 'Tag',
    from: 'From branch',
    into: 'Into branch',
    inputs: 'Inputs',
    crons: 'Runs at',
    starts: 'This event starts the workflow.',
    paths: 'paths: filters are read as “a matching file changed”.',
    outputs: 'Step outputs',
    outputsHelp: 'What the scripts would write to $GITHUB_OUTPUT. Later conditions read these values.',
    reviews: 'Protected environments',
    reviewsHelp: 'A job deploying to a protected environment waits until someone approves it.',
    failures: 'Steps set to fail',
    failuresHelp: 'Click the bug on any step on the board to make it fail.',
    clear: 'Let them all pass',
    noEnvironments: 'No job deploys to an environment.',
    noOutputs: 'No condition reads a step output.',
  },
  logs: {
    pick: 'Click a job on the board to read its log.',
    history: 'What happened',
    runner: 'Runner',
    needs: 'Needs',
    condition: 'Condition (if)',
    yes: 'true',
    no: 'false',
    outputs: 'Outputs',
    environment: 'Environment',
    copy: 'Copy',
    notYet: 'Not started yet.',
    skippedIf: 'Skipped: its if: was false.',
    skippedAfter: 'Skipped: a step before it failed or the run was cancelled.',
    forgiven: 'Failed, but continue-on-error lets the job go on.',
    nothing: 'No lines yet.',
  },
  yaml: {
    edit: 'Edit',
    apply: 'Simulate this',
    cancel: 'Cancel',
    paste: 'Paste your own',
    placeholder: 'Paste a workflow from .github/workflows/ here…',
    local: 'Nothing is sent anywhere: the workflow is read and simulated in your browser.',
    error: "This workflow can't be read",
  },
  problem: (p) => {
    switch (p.code) {
      case 'yaml':
        return p.line ? `YAML error on line ${p.line}: ${p.message}` : `YAML error: ${p.message}`
      case 'notMap':
        return 'A workflow is a map of keys like on: and jobs:.'
      case 'noOn':
        return 'There is no on: telling GitHub when to run it.'
      case 'noJobs':
        return 'There are no jobs: to run.'
      case 'unknownNeed':
        return `The job ${code(p.job)} needs ${code(p.need)}, but there is no such job.`
      case 'cycle':
        return `These jobs need each other in a loop: ${p.jobs.join(', ')}.`
    }
  },
  narrate: {
    ready: (event) => `Press Run to fire the ${event} event and send current through the pipeline.`,
    off: "The event doesn't match the trigger's filters, so nothing runs: the battery isn't connected.",
    running: (job, step) => `${job} is running ${code(step)}.`,
    together: (jobs) => `${jobs} are running at the same time, each on its own machine.`,
    queued: (job) => `${job} is waiting for a free runner.`,
    waiting: (job, env) => `${job} is waiting for a person to approve ${code(env)}.`,
    done: {
      success: (time) => `The run passed in ${time}. Every job that ran succeeded.`,
      failure: (time) => `The run failed after ${time}. Jobs that needed the failed one were skipped.`,
      cancelled: (time) => `The run was cancelled after ${time}.`,
    },
  },
  history: (e, name) => {
    switch (e.kind) {
      case 'trigger':
        return 'The event fired: the workflow starts.'
      case 'cancel':
        return 'Someone cancelled the run.'
      case 'job-skip':
        return e.reason === 'if'
          ? `${name(e.job)} was skipped: its if: was false.`
          : e.reason === 'needs'
            ? `${name(e.job)} was skipped: a job it needs didn't succeed.`
            : `${name(e.job)} was cancelled before it started.`
      case 'job-wait':
        return `${name(e.job)} waits for approval to deploy to ${code(e.env)}.`
      case 'job-approve':
        return `${code(e.env)} was approved: ${name(e.job)} goes ahead.`
      case 'job-reject':
        return `${code(e.env)} was rejected: ${name(e.job)} fails.`
      case 'job-start':
        return e.copies > 1
          ? `${name(e.job)} starts on ${e.copies} machines at once.`
          : `${name(e.job)} starts on ${e.runner}.`
      case 'step-fail':
        return e.forgiven
          ? `${code(e.step)} failed in ${name(e.job)}, but continue-on-error lets it go on.`
          : `${code(e.step)} failed in ${name(e.job)}${e.lane ? ` (${e.lane})` : ''}.`
      case 'fail-fast':
        return `fail-fast: the other copies of ${name(e.job)} are cancelled.`
      case 'job-end':
        return `${name(e.job)}: ${{ success: 'passed', failure: 'failed', cancelled: 'cancelled', skipped: 'skipped' }[e.conclusion]}.`
      case 'run-end':
        return { success: 'The run passed.', failure: 'The run failed.', cancelled: 'The run was cancelled.' }[
          e.conclusion
        ]
    }
  },
  timeline: {
    title: 'Timeline',
    hint: 'Drag along it to replay any moment. Bars side by side ran at the same time.',
  },
  guide: {
    intro:
      'A workflow is a circuit for your code. An event closes the switch, current flows into the jobs, and each job lights up as its steps run. Follow the wires to see what waits for what.',
    pairs: [
      {
        circuit: 'Battery and switch',
        workflow: 'on: (the trigger)',
        text: 'Nothing runs until an event happens: a push, a pull request, “Run workflow” or a schedule. Filters like branches: [main] decide which events count.',
      },
      {
        circuit: 'A part on the board',
        workflow: 'A job',
        text: 'Each job gets its own fresh machine, a runner, which is thrown away afterwards. Jobs share nothing unless they pass it on.',
      },
      {
        circuit: 'A wire',
        workflow: 'needs:',
        text: 'A job starts only when every job it needs has finished. Jobs without needs start together, like branches in parallel.',
      },
      {
        circuit: 'Parts in series',
        workflow: 'steps:',
        text: 'Steps run one after another on the same machine. When one fails, the rest are skipped, like a break in a series circuit.',
      },
      {
        circuit: 'A switch',
        workflow: 'if:',
        text: 'A condition decides whether a job or step runs. Without always() or failure() in it, it only runs when everything before it succeeded.',
      },
      {
        circuit: 'The same part, in parallel',
        workflow: 'strategy.matrix',
        text: 'The job is copied for every combination, such as Node 20, 22 and 24. With fail-fast, one failing copy cancels the others.',
      },
      {
        circuit: 'A switch someone presses',
        workflow: 'environment:',
        text: 'A protected environment waits until a person approves the deployment.',
      },
      {
        circuit: 'A signal on a wire',
        workflow: 'outputs and artifacts',
        text: 'Jobs hand values to later jobs through outputs, and files through artifacts, because each machine starts empty.',
      },
      {
        circuit: 'The bulb',
        workflow: 'The run result',
        text: 'The run is green only when no job failed. Skipped jobs do not count as failures.',
      },
    ],
    tryTitle: 'Try this',
    tries: [
      'Press Run and watch the current flow from the trigger through every job.',
      'Click the bug on a test step, then run again: the wire breaks and the jobs after it are skipped.',
      'Change the branch to feature/login: the trigger’s filter keeps the workflow from starting.',
      'In Node.js CI, break the tests on one Node version: fail-fast cancels the other copies.',
      'In Build and deploy, push the tag v1.4.0: production waits for your approval.',
      'Drag along the timeline to replay any moment of the run.',
    ],
  },
}
