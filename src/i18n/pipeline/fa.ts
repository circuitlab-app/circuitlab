import type { PipelineBook } from './types'

const code = (text: string) => `«${text}»`
const n = (value: number) => value.toLocaleString('fa-IR')

export const faPipeline: PipelineBook = {
  title: 'آزمایشگاه پایپ‌لاین',
  workflow: 'ورک‌فلو',
  list: (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join('، ')} و ${items.at(-1)}`),
  examples: {
    circuitlab: {
      name: 'Circuit Lab: بررسی، انتشار، راه‌اندازی',
      description: 'همان ورک‌فلوی واقعی که این سایت با آن منتشر می‌شود',
    },
    node: { name: 'CI برای Node.js', description: 'لینت و ماتریس تست هم‌زمان، بعد یک بیلد' },
    pull: { name: 'بررسی پول ریکوئست', description: 'سه بررسی هم‌زمان، بعد یک سایت پیش‌نمایش' },
    docker: { name: 'بیلد و دیپلوی', description: 'ایمیج داکر، استیجینگ، بعد پروداکشن با تأیید' },
    release: { name: 'انتشار با تگ', description: 'بیلد برای سه سیستم‌عامل، انتشار، خبر دادن به تیم' },
  },
  yours: 'ورک‌فلوی خودتان',
  controls: {
    run: 'اجرا',
    pause: 'مکث',
    resume: 'ادامه',
    again: 'اجرای دوباره',
    restart: 'از اول',
    cancel: 'لغو اجرا',
    speed: 'سرعت',
    clock: 'زمان شبیه‌سازی',
  },
  run: {
    ready: 'آماده',
    'not-triggered': 'اجرا نشد',
    running: 'در حال اجرا',
    waiting: 'منتظر تأیید',
    success: 'موفق',
    failure: 'ناموفق',
    cancelled: 'لغو شد',
  },
  job: {
    ready: 'آماده',
    pending: 'منتظر جاب‌های قبلی',
    waiting: 'منتظر تأیید',
    queued: 'منتظر یک رانر',
    running: 'در حال اجرا',
    success: 'موفق',
    failure: 'ناموفق',
    cancelled: 'لغو شد',
    skipped: 'رد شد',
  },
  events: {
    push: 'پوش',
    pull_request: 'پول ریکوئست',
    pull_request_target: 'پول ریکوئست (target)',
    workflow_dispatch: 'اجرای دستی',
    schedule: 'زمان‌بندی‌شده',
    release: 'ریلیز',
    workflow_call: 'فراخوانی از ورک‌فلوی دیگر',
    workflow_run: 'بعد از ورک‌فلوی دیگر',
    merge_group: 'صف مرج',
    issues: 'ایشو',
    issue_comment: 'کامنت ایشو',
  },
  trigger: { title: 'تریگر', fire: 'رخ دادن رویداد', fired: 'رخ داد', off: 'اجرا نشد', listens: 'گوش می‌دهد به' },
  why: (r) => {
    switch (r.code) {
      case 'noSuchEvent':
        return `این ورک‌فلو به رویداد ${code(r.event)} گوش نمی‌دهد.`
      case 'branch':
        return r.ignore
          ? `${code(r.name)} با branches-ignore جور است: ${r.patterns.join('، ')}.`
          : `${code(r.name)} در branches نیست: ${r.patterns.join('، ')}.`
      case 'tag':
        return r.ignore
          ? `${code(r.name)} با tags-ignore جور است: ${r.patterns.join('، ')}.`
          : `${code(r.name)} در tags نیست: ${r.patterns.join('، ')}.`
      case 'onlyTags':
        return 'این تریگر پوش فقط به تگ‌ها گوش می‌دهد، نه برنچ‌ها.'
      case 'onlyBranches':
        return 'این تریگر پوش فقط به برنچ‌ها گوش می‌دهد، نه تگ‌ها.'
      case 'types':
        return `فقط به این نوع فعالیت‌ها گوش می‌دهد: ${r.types.join('، ')}.`
    }
  },
  card: {
    copies: (count) => `${n(count)} نسخه`,
    waitingFor: (env) => `منتظر است کسی ${code(env)} را تأیید کند`,
    approve: 'تأیید',
    reject: 'رد',
    skippedIf: 'رد شد: شرط if آن نادرست بود',
    skippedNeeds: 'رد شد: جابی که به آن نیاز دارد موفق نشد',
    cancelled: 'پیش از اجرا لغو شد',
    rejected: 'دیپلوی رد شد',
    failFast: 'لغو شد: نسخهٔ دیگری شکست خورد (fail-fast)',
    breakStep: 'این استپ را خراب کن',
    fixStep: 'بگذار این استپ دوباره موفق شود',
    protected: 'نیاز به تأیید',
    added: 'گیت‌هاب این استپ را به همهٔ جاب‌ها اضافه می‌کند',
    waitsFor: (jobs) => `منتظر ${jobs}`,
  },
  result: { title: 'نتیجهٔ اجرا', hint: 'فقط وقتی هیچ جابی شکست نخورده باشد سبز روشن می‌شود' },
  tabs: { scenario: 'تنظیم', logs: 'لاگ‌ها', yaml: 'YAML', guide: 'چطور کار می‌کند' },
  scenario: {
    event: 'رویداد',
    pushTo: 'پوش به',
    branchPush: 'یک برنچ',
    tagPush: 'یک تگ',
    branch: 'برنچ',
    tag: 'تگ',
    from: 'از برنچ',
    into: 'به برنچ',
    inputs: 'ورودی‌ها',
    crons: 'زمان اجرا',
    starts: 'این رویداد ورک‌فلو را راه می‌اندازد.',
    paths: 'فیلترهای paths این‌طور خوانده می‌شوند: «یک فایل جور تغییر کرده است».',
    outputs: 'خروجی استپ‌ها',
    outputsHelp: 'چیزی که اسکریپت‌ها در ‎$GITHUB_OUTPUT می‌نویسند. شرط‌های بعدی این مقدارها را می‌خوانند.',
    reviews: 'محیط‌های محافظت‌شده',
    reviewsHelp: 'جابی که روی یک محیط محافظت‌شده دیپلوی می‌کند، منتظر می‌ماند تا کسی آن را تأیید کند.',
    failures: 'استپ‌هایی که شکست می‌خورند',
    failuresHelp: 'روی آیکون حشره کنار هر استپ روی برد بزنید تا شکست بخورد.',
    clear: 'همه موفق شوند',
    noEnvironments: 'هیچ جابی روی یک محیط دیپلوی نمی‌کند.',
    noOutputs: 'هیچ شرطی خروجی یک استپ را نمی‌خواند.',
  },
  logs: {
    pick: 'روی یک جاب در برد بزنید تا لاگش را ببینید.',
    history: 'چه اتفاقی افتاد',
    runner: 'رانر',
    needs: 'نیاز دارد به',
    condition: 'شرط (if)',
    yes: 'درست',
    no: 'نادرست',
    outputs: 'خروجی‌ها',
    environment: 'محیط',
    copy: 'نسخه',
    notYet: 'هنوز شروع نشده.',
    skippedIf: 'رد شد: شرط if آن نادرست بود.',
    skippedAfter: 'رد شد: استپی پیش از آن شکست خورد یا اجرا لغو شد.',
    forgiven: 'شکست خورد، ولی continue-on-error اجازه می‌دهد جاب ادامه پیدا کند.',
    nothing: 'هنوز چیزی چاپ نشده.',
  },
  yaml: {
    edit: 'ویرایش',
    apply: 'شبیه‌سازی کن',
    cancel: 'انصراف',
    paste: 'ورک‌فلوی خودتان را بچسبانید',
    placeholder: 'یک ورک‌فلو از ‎.github/workflows/‎ را این‌جا بچسبانید…',
    local: 'چیزی به جایی فرستاده نمی‌شود: ورک‌فلو در همین مرورگر خوانده و شبیه‌سازی می‌شود.',
    error: 'این ورک‌فلو خوانده نمی‌شود',
  },
  problem: (p) => {
    switch (p.code) {
      case 'yaml':
        return p.line ? `خطای YAML در خط ${n(p.line)}: ${p.message}` : `خطای YAML: ${p.message}`
      case 'notMap':
        return 'ورک‌فلو مجموعه‌ای از کلیدهاست، مثل on: و jobs:.'
      case 'noOn':
        return 'بخش on: نیست که بگوید گیت‌هاب کی آن را اجرا کند.'
      case 'noJobs':
        return 'بخش jobs: برای اجرا نیست.'
      case 'unknownNeed':
        return `جاب ${code(p.job)} به ${code(p.need)} نیاز دارد، ولی چنین جابی نیست.`
      case 'cycle':
        return `این جاب‌ها در یک حلقه به هم نیاز دارند: ${p.jobs.join('، ')}.`
    }
  },
  narrate: {
    ready: (event) => `«اجرا» را بزنید تا رویداد ${event} رخ دهد و جریان در پایپ‌لاین راه بیفتد.`,
    off: 'رویداد با فیلترهای تریگر جور نیست، پس هیچ چیز اجرا نمی‌شود: باتری وصل نیست.',
    running: (job, step) => `${job} دارد ${code(step)} را اجرا می‌کند.`,
    together: (jobs) => `${jobs} هم‌زمان اجرا می‌شوند، هر کدام روی ماشین خودش.`,
    queued: (job) => `${job} منتظر یک رانر آزاد است.`,
    waiting: (job, env) => `${job} منتظر است کسی ${code(env)} را تأیید کند.`,
    done: {
      success: (time) => `اجرا در ${time} موفق شد. همهٔ جاب‌هایی که اجرا شدند موفق بودند.`,
      failure: (time) => `اجرا بعد از ${time} شکست خورد. جاب‌هایی که به جاب ناموفق نیاز داشتند رد شدند.`,
      cancelled: (time) => `اجرا بعد از ${time} لغو شد.`,
    },
  },
  history: (e, name) => {
    switch (e.kind) {
      case 'trigger':
        return 'رویداد رخ داد: ورک‌فلو شروع می‌شود.'
      case 'cancel':
        return 'کسی اجرا را لغو کرد.'
      case 'job-skip':
        return e.reason === 'if'
          ? `${name(e.job)} رد شد: شرط if آن نادرست بود.`
          : e.reason === 'needs'
            ? `${name(e.job)} رد شد: جابی که به آن نیاز دارد موفق نشد.`
            : `${name(e.job)} پیش از شروع لغو شد.`
      case 'job-wait':
        return `${name(e.job)} برای دیپلوی روی ${code(e.env)} منتظر تأیید است.`
      case 'job-approve':
        return `${code(e.env)} تأیید شد: ${name(e.job)} ادامه می‌دهد.`
      case 'job-reject':
        return `${code(e.env)} رد شد: ${name(e.job)} شکست می‌خورد.`
      case 'job-start':
        return e.copies > 1
          ? `${name(e.job)} هم‌زمان روی ${n(e.copies)} ماشین شروع می‌شود.`
          : `${name(e.job)} روی ${e.runner} شروع می‌شود.`
      case 'step-fail':
        return e.forgiven
          ? `${code(e.step)} در ${name(e.job)} شکست خورد، ولی continue-on-error اجازهٔ ادامه می‌دهد.`
          : `${code(e.step)} در ${name(e.job)}${e.lane ? ` (${e.lane})` : ''} شکست خورد.`
      case 'fail-fast':
        return `fail-fast: نسخه‌های دیگر ${name(e.job)} لغو می‌شوند.`
      case 'job-end':
        return `${name(e.job)}: ${{ success: 'موفق شد', failure: 'شکست خورد', cancelled: 'لغو شد', skipped: 'رد شد' }[e.conclusion]}.`
      case 'run-end':
        return { success: 'اجرا موفق شد.', failure: 'اجرا شکست خورد.', cancelled: 'اجرا لغو شد.' }[e.conclusion]
    }
  },
  timeline: {
    title: 'خط زمانی',
    hint: 'رویش بکشید تا هر لحظه از اجرا را دوباره ببینید. نوارهای کنار هم، هم‌زمان اجرا شده‌اند.',
  },
  guide: {
    intro:
      'ورک‌فلو مداری برای کد شماست. یک رویداد کلید را می‌بندد، جریان وارد جاب‌ها می‌شود و هر جاب با اجرای استپ‌هایش روشن می‌شود. سیم‌ها را دنبال کنید تا ببینید چه چیزی منتظر چه چیزی است.',
    pairs: [
      {
        circuit: 'باتری و کلید',
        workflow: 'on: (تریگر)',
        text: 'تا رویدادی رخ ندهد هیچ چیز اجرا نمی‌شود: یک پوش، یک پول ریکوئست، دکمهٔ «Run workflow» یا یک زمان‌بندی. فیلترهایی مثل branches: [main] تعیین می‌کنند کدام رویدادها حساب شوند.',
      },
      {
        circuit: 'یک قطعه روی برد',
        workflow: 'یک جاب',
        text: 'هر جاب یک ماشین تازهٔ مخصوص خودش (رانر) می‌گیرد که بعد از کار دور انداخته می‌شود. جاب‌ها چیزی را با هم شریک نیستند، مگر آن‌که آن را به هم بدهند.',
      },
      {
        circuit: 'سیم',
        workflow: 'needs:',
        text: 'هر جاب فقط وقتی شروع می‌شود که همهٔ جاب‌هایی که به آن‌ها نیاز دارد تمام شده باشند. جاب‌های بدون needs با هم شروع می‌شوند، مثل شاخه‌های موازی.',
      },
      {
        circuit: 'قطعه‌های سری',
        workflow: 'steps:',
        text: 'استپ‌ها یکی پس از دیگری روی همان ماشین اجرا می‌شوند. اگر یکی شکست بخورد، بقیه رد می‌شوند، مثل قطع شدن یک مدار سری.',
      },
      {
        circuit: 'کلید',
        workflow: 'if:',
        text: 'یک شرط تعیین می‌کند جاب یا استپ اجرا شود یا نه. اگر در آن always() یا failure() نباشد، فقط وقتی اجرا می‌شود که همهٔ قبلی‌ها موفق بوده باشند.',
      },
      {
        circuit: 'یک قطعه، چند نسخهٔ موازی',
        workflow: 'strategy.matrix',
        text: 'جاب برای هر ترکیب کپی می‌شود، مثلاً Node 20 و 22 و 24. با fail-fast، شکست یک نسخه بقیه را لغو می‌کند.',
      },
      {
        circuit: 'کلیدی که کسی باید بزند',
        workflow: 'environment:',
        text: 'یک محیط محافظت‌شده منتظر می‌ماند تا یک نفر دیپلوی را تأیید کند.',
      },
      {
        circuit: 'سیگنالی روی سیم',
        workflow: 'outputs و artifacts',
        text: 'جاب‌ها مقدارها را با outputs و فایل‌ها را با artifacts به جاب‌های بعدی می‌دهند، چون هر ماشین خالی شروع می‌کند.',
      },
      {
        circuit: 'لامپ',
        workflow: 'نتیجهٔ اجرا',
        text: 'اجرا فقط وقتی سبز است که هیچ جابی شکست نخورده باشد. جاب‌های ردشده شکست حساب نمی‌شوند.',
      },
    ],
    tryTitle: 'امتحان کنید',
    tries: [
      '«اجرا» را بزنید و ببینید جریان چطور از تریگر از همهٔ جاب‌ها می‌گذرد.',
      'روی حشرهٔ یک استپ تست بزنید و دوباره اجرا کنید: سیم قطع می‌شود و جاب‌های بعدی رد می‌شوند.',
      'برنچ را به feature/login تغییر دهید: فیلتر تریگر نمی‌گذارد ورک‌فلو شروع شود.',
      'در «CI برای Node.js» تست یکی از نسخه‌های Node را خراب کنید: fail-fast نسخه‌های دیگر را لغو می‌کند.',
      'در «بیلد و دیپلوی» تگ v1.4.0 را پوش کنید: پروداکشن منتظر تأیید شما می‌ماند.',
      'روی خط زمانی بکشید تا هر لحظه از اجرا را دوباره ببینید.',
    ],
  },
}
