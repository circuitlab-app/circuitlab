import type { PipelineBook } from './types'

const code = (text: string) => `«${text}»`

export const arPipeline: PipelineBook = {
  title: 'مختبر خطوط الأنابيب',
  subtitle: 'شاهد سير عمل GitHub Actions وهو يعمل، مثل التيار في الدائرة',
  back: 'لوحة الدائرة',
  workflow: 'سير العمل',
  list: (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join('، ')} و${items.at(-1)}`),
  examples: {
    circuitlab: {
      name: 'Circuit Lab: فحص، إصدار، نشر',
      description: 'سير العمل الحقيقي الذي يُنشر به هذا الموقع',
    },
    node: { name: 'CI لـ Node.js', description: 'فحص الشيفرة ومصفوفة اختبارات معًا، ثم بناء واحد' },
    pull: { name: 'فحوص طلب الدمج', description: 'ثلاثة فحوص في وقت واحد، ثم موقع معاينة' },
    docker: { name: 'البناء والنشر', description: 'صورة Docker، ثم بيئة التجربة، ثم الإنتاج بموافقة' },
    release: { name: 'إصدار عند وسم', description: 'بناء لثلاثة أنظمة، نشر، وإبلاغ الفريق' },
  },
  yours: 'سير عملك',
  controls: {
    run: 'تشغيل',
    pause: 'إيقاف مؤقت',
    resume: 'متابعة',
    again: 'تشغيل مرة أخرى',
    restart: 'من البداية',
    cancel: 'إلغاء التشغيل',
    speed: 'السرعة',
    clock: 'الوقت المُحاكى',
  },
  run: {
    ready: 'جاهز',
    'not-triggered': 'لم يبدأ',
    running: 'يعمل',
    waiting: 'بانتظار الموافقة',
    success: 'نجح',
    failure: 'فشل',
    cancelled: 'أُلغي',
  },
  job: {
    ready: 'جاهزة',
    pending: 'بانتظار ما تحتاجه',
    waiting: 'بانتظار الموافقة',
    queued: 'بانتظار مُشغِّل',
    running: 'تعمل',
    success: 'نجحت',
    failure: 'فشلت',
    cancelled: 'أُلغيت',
    skipped: 'تم تخطيها',
  },
  events: {
    push: 'دفع (push)',
    pull_request: 'طلب دمج',
    pull_request_target: 'طلب دمج (target)',
    workflow_dispatch: 'تشغيل يدوي',
    schedule: 'حسب جدول',
    release: 'إصدار',
    workflow_call: 'استدعاء من سير عمل آخر',
    workflow_run: 'بعد سير عمل آخر',
    merge_group: 'طابور الدمج',
    issues: 'مشكلة (issue)',
    issue_comment: 'تعليق على مشكلة',
  },
  trigger: { title: 'المُحفِّز', fire: 'أطلق الحدث', fired: 'انطلق', off: 'لم يبدأ', listens: 'يستمع إلى' },
  why: (r) => {
    switch (r.code) {
      case 'noSuchEvent':
        return `سير العمل لا يستمع إلى ${code(r.event)}.`
      case 'branch':
        return r.ignore
          ? `${code(r.name)} يطابق branches-ignore: ${r.patterns.join('، ')}.`
          : `${code(r.name)} ليس ضمن branches: ${r.patterns.join('، ')}.`
      case 'tag':
        return r.ignore
          ? `${code(r.name)} يطابق tags-ignore: ${r.patterns.join('، ')}.`
          : `${code(r.name)} ليس ضمن tags: ${r.patterns.join('، ')}.`
      case 'onlyTags':
        return 'مُحفِّز الدفع هذا يستمع إلى الوسوم فقط، لا إلى الفروع.'
      case 'onlyBranches':
        return 'مُحفِّز الدفع هذا يستمع إلى الفروع فقط، لا إلى الوسوم.'
      case 'types':
        return `يستمع فقط إلى أنواع النشاط هذه: ${r.types.join('، ')}.`
    }
  },
  card: {
    copies: (n) => `${n} نسخ`,
    waitingFor: (env) => `بانتظار أن يوافق أحد على ${code(env)}`,
    approve: 'موافقة',
    reject: 'رفض',
    skippedIf: 'تم تخطيها: شرط if كان خاطئًا',
    skippedNeeds: 'تم تخطيها: مهمة تحتاجها لم تنجح',
    cancelled: 'أُلغيت قبل أن تعمل',
    rejected: 'رُفض النشر',
    failFast: 'أُلغيت: فشلت نسخة أخرى (fail-fast)',
    breakStep: 'اجعل هذه الخطوة تفشل',
    fixStep: 'دع هذه الخطوة تنجح مجددًا',
    protected: 'تحتاج موافقة',
    added: 'يضيف GitHub هذه الخطوة إلى كل مهمة',
    waitsFor: (jobs) => `تنتظر ${jobs}`,
  },
  result: { title: 'نتيجة التشغيل', hint: 'يضيء بالأخضر فقط إذا لم تفشل أي مهمة' },
  tabs: { scenario: 'الإعداد', logs: 'السجلات', yaml: 'YAML', guide: 'كيف يعمل' },
  scenario: {
    event: 'الحدث',
    pushTo: 'دفع إلى',
    branchPush: 'فرع',
    tagPush: 'وسم',
    branch: 'الفرع',
    tag: 'الوسم',
    from: 'من الفرع',
    into: 'إلى الفرع',
    inputs: 'المدخلات',
    crons: 'يعمل في',
    starts: 'هذا الحدث يبدأ سير العمل.',
    paths: 'مرشحات paths تُقرأ على أنها «تغيّر ملف مطابق».',
    outputs: 'مخرجات الخطوات',
    outputsHelp: 'ما تكتبه السكربتات في ‎$GITHUB_OUTPUT. الشروط اللاحقة تقرأ هذه القيم.',
    reviews: 'البيئات المحمية',
    reviewsHelp: 'المهمة التي تنشر إلى بيئة محمية تنتظر حتى يوافق عليها أحد.',
    failures: 'خطوات ستفشل',
    failuresHelp: 'انقر على الحشرة بجانب أي خطوة على اللوحة لتجعلها تفشل.',
    clear: 'دعها كلها تنجح',
    noEnvironments: 'لا توجد مهمة تنشر إلى بيئة.',
    noOutputs: 'لا يوجد شرط يقرأ مخرجات خطوة.',
  },
  logs: {
    pick: 'انقر على مهمة في اللوحة لقراءة سجلها.',
    history: 'ما الذي حدث',
    runner: 'المُشغِّل',
    needs: 'تحتاج',
    condition: 'الشرط (if)',
    yes: 'صحيح',
    no: 'خطأ',
    outputs: 'المخرجات',
    environment: 'البيئة',
    copy: 'النسخة',
    notYet: 'لم تبدأ بعد.',
    skippedIf: 'تم تخطيها: شرط if كان خاطئًا.',
    skippedAfter: 'تم تخطيها: فشلت خطوة قبلها أو أُلغي التشغيل.',
    forgiven: 'فشلت، لكن continue-on-error يسمح للمهمة بالمتابعة.',
    nothing: 'لا توجد أسطر بعد.',
  },
  yaml: {
    edit: 'تعديل',
    apply: 'حاكِ هذا',
    cancel: 'إلغاء',
    paste: 'الصق سير عملك',
    placeholder: 'الصق هنا سير عمل من ‎.github/workflows/‎…',
    local: 'لا يُرسل شيء إلى أي مكان: يُقرأ سير العمل ويُحاكى داخل متصفحك.',
    error: 'تعذّرت قراءة سير العمل هذا',
  },
  problem: (p) => {
    switch (p.code) {
      case 'yaml':
        return p.line ? `خطأ YAML في السطر ${p.line}: ${p.message}` : `خطأ YAML: ${p.message}`
      case 'notMap':
        return 'سير العمل مجموعة من المفاتيح مثل on: وjobs:.'
      case 'noOn':
        return 'لا يوجد on: يخبر GitHub متى يشغّله.'
      case 'noJobs':
        return 'لا توجد jobs: لتشغيلها.'
      case 'unknownNeed':
        return `المهمة ${code(p.job)} تحتاج ${code(p.need)}، لكن لا توجد مهمة بهذا الاسم.`
      case 'cycle':
        return `هذه المهام تحتاج بعضها في حلقة: ${p.jobs.join('، ')}.`
    }
  },
  narrate: {
    ready: (event) => `اضغط «تشغيل» لإطلاق حدث ${event} وإرسال التيار عبر خط الأنابيب.`,
    off: 'الحدث لا يطابق مرشحات المُحفِّز، فلا شيء يعمل: البطارية غير موصولة.',
    running: (job, step) => `${job} تشغّل ${code(step)}.`,
    together: (jobs) => `${jobs} تعمل في الوقت نفسه، كل منها على جهازها.`,
    queued: (job) => `${job} تنتظر مُشغِّلًا متاحًا.`,
    waiting: (job, env) => `${job} تنتظر أن يوافق أحد على ${code(env)}.`,
    done: {
      success: (time) => `نجح التشغيل في ${time}. كل مهمة عملت قد نجحت.`,
      failure: (time) => `فشل التشغيل بعد ${time}. تم تخطي المهام التي احتاجت المهمة الفاشلة.`,
      cancelled: (time) => `أُلغي التشغيل بعد ${time}.`,
    },
  },
  history: (e, name) => {
    switch (e.kind) {
      case 'trigger':
        return 'انطلق الحدث: يبدأ سير العمل.'
      case 'cancel':
        return 'ألغى أحدهم التشغيل.'
      case 'job-skip':
        return e.reason === 'if'
          ? `تم تخطي ${name(e.job)}: شرط if كان خاطئًا.`
          : e.reason === 'needs'
            ? `تم تخطي ${name(e.job)}: مهمة تحتاجها لم تنجح.`
            : `أُلغيت ${name(e.job)} قبل أن تبدأ.`
      case 'job-wait':
        return `${name(e.job)} تنتظر الموافقة على النشر إلى ${code(e.env)}.`
      case 'job-approve':
        return `تمت الموافقة على ${code(e.env)}: ${name(e.job)} تتابع.`
      case 'job-reject':
        return `رُفض ${code(e.env)}: ${name(e.job)} تفشل.`
      case 'job-start':
        return e.copies > 1
          ? `${name(e.job)} تبدأ على ${e.copies} أجهزة في وقت واحد.`
          : `${name(e.job)} تبدأ على ${e.runner}.`
      case 'step-fail':
        return e.forgiven
          ? `فشلت ${code(e.step)} في ${name(e.job)}، لكن continue-on-error يسمح بالمتابعة.`
          : `فشلت ${code(e.step)} في ${name(e.job)}${e.lane ? ` (${e.lane})` : ''}.`
      case 'fail-fast':
        return `fail-fast: أُلغيت النسخ الأخرى من ${name(e.job)}.`
      case 'job-end':
        return `${name(e.job)}: ${{ success: 'نجحت', failure: 'فشلت', cancelled: 'أُلغيت', skipped: 'تم تخطيها' }[e.conclusion]}.`
      case 'run-end':
        return { success: 'نجح التشغيل.', failure: 'فشل التشغيل.', cancelled: 'أُلغي التشغيل.' }[e.conclusion]
    }
  },
  timeline: {
    title: 'الخط الزمني',
    hint: 'اسحب عليه لإعادة أي لحظة من التشغيل. الأشرطة المتجاورة عملت في الوقت نفسه.',
  },
  guide: {
    intro:
      'سير العمل دائرة لشيفرتك. حدثٌ يغلق المفتاح، فيتدفق التيار إلى المهام، وتضيء كل مهمة كلما عملت خطواتها. تتبّع الأسلاك لترى ما الذي ينتظر ماذا.',
    pairs: [
      {
        circuit: 'البطارية والمفتاح',
        workflow: 'on: (المُحفِّز)',
        text: 'لا شيء يعمل حتى يقع حدث: دفع، أو طلب دمج، أو «Run workflow»، أو جدول زمني. مرشحات مثل branches: [main] تحدد أي الأحداث تُحتسب.',
      },
      {
        circuit: 'قطعة على اللوحة',
        workflow: 'مهمة (job)',
        text: 'كل مهمة تحصل على جهاز جديد خاص بها، المُشغِّل (runner)، ويُتخلَّص منه بعد ذلك. المهام لا تتشارك شيئًا إلا إذا مرّرته.',
      },
      {
        circuit: 'سلك',
        workflow: 'needs:',
        text: 'لا تبدأ المهمة إلا عندما تنتهي كل المهام التي تحتاجها. المهام التي بلا needs تبدأ معًا، مثل فروع متوازية.',
      },
      {
        circuit: 'قطع على التوالي',
        workflow: 'steps:',
        text: 'تعمل الخطوات واحدة تلو الأخرى على الجهاز نفسه. إذا فشلت إحداها تُتخطّى البقية، مثل انقطاع دائرة توالٍ.',
      },
      {
        circuit: 'مفتاح',
        workflow: 'if:',
        text: 'شرطٌ يقرر هل تعمل المهمة أو الخطوة. من دون always() أو failure() فيه، لا تعمل إلا إذا نجح كل ما قبلها.',
      },
      {
        circuit: 'القطعة نفسها على التوازي',
        workflow: 'strategy.matrix',
        text: 'تُنسخ المهمة لكل تركيبة، مثل Node 20 و22 و24. مع fail-fast، فشل نسخة واحدة يلغي النسخ الأخرى.',
      },
      {
        circuit: 'مفتاح يضغطه شخص',
        workflow: 'environment:',
        text: 'البيئة المحمية تنتظر حتى يوافق شخص على النشر.',
      },
      {
        circuit: 'إشارة على السلك',
        workflow: 'outputs وartifacts',
        text: 'تمرّر المهام القيم إلى المهام اللاحقة عبر outputs، والملفات عبر artifacts، لأن كل جهاز يبدأ فارغًا.',
      },
      {
        circuit: 'المصباح',
        workflow: 'نتيجة التشغيل',
        text: 'يكون التشغيل أخضر فقط إذا لم تفشل أي مهمة. المهام المتخطّاة لا تُحتسب فشلًا.',
      },
    ],
    tryTitle: 'جرّب هذا',
    tries: [
      'اضغط «تشغيل» وشاهد التيار يتدفق من المُحفِّز عبر كل مهمة.',
      'انقر على الحشرة بجانب خطوة اختبار ثم شغّل مجددًا: ينقطع السلك وتُتخطّى المهام التي بعدها.',
      'غيّر الفرع إلى feature/login: مرشح المُحفِّز يمنع سير العمل من البدء.',
      'في «CI لـ Node.js» أفشل اختبارات إصدار واحد من Node: يلغي fail-fast النسخ الأخرى.',
      'في «البناء والنشر» ادفع الوسم v1.4.0: الإنتاج ينتظر موافقتك.',
      'اسحب على الخط الزمني لإعادة أي لحظة من التشغيل.',
    ],
  },
}
