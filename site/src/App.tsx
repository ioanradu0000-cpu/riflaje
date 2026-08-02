import {
  ArrowRight,
  BadgeCheck,
  Cpu,
  Gauge,
  Monitor,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'

function App() {
  const buildTypes = [
    {
      name: 'Gaming',
      spec: '1440p high refresh',
      parts: 'Ryzen 7 / RTX 5070 / 32 GB DDR5',
    },
    {
      name: 'Creator',
      spec: 'Editing and rendering',
      parts: 'Core Ultra 7 / RTX 5080 / 64 GB DDR5',
    },
    {
      name: 'Budget',
      spec: 'Value-first 1080p',
      parts: 'Ryzen 5 / RX 7600 XT / 16 GB DDR5',
    },
  ]

  const checks = [
    'Compatibility checks',
    'Balanced part lists',
    'Upgrade paths',
    'Price-aware planning',
  ]

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#151814]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a className="flex items-center gap-3" href="#">
          <span className="grid size-10 place-items-center rounded-md bg-[#151814] text-white">
            <Cpu className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">PCforge</span>
        </a>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#4c544b] md:flex">
          <a href="#builds">Builds</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-md bg-[#1f6f52] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#185b43]"
          href="#builds"
        >
          Start <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-20 lg:pt-16">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#d8ddd3] bg-white px-3 py-2 text-sm font-medium text-[#4c544b]">
            <Zap className="size-4 text-[#d07b25]" aria-hidden="true" />
            Smart PC planning for real budgets
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-[#10130f] sm:text-6xl lg:text-7xl">
            Build a faster PC without wasting money.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#556052]">
            PCforge helps you choose compatible parts, balance performance, and
            compare ready-to-build setups for gaming, streaming, and work.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#151814] px-5 py-3 font-semibold text-white transition hover:bg-[#2a3028]"
              href="#builds"
            >
              Browse Builds <ArrowRight className="size-5" aria-hidden="true" />
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cbd3c6] bg-white px-5 py-3 font-semibold text-[#151814] transition hover:border-[#9cad91]"
              href="#workflow"
            >
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              Tune Your Parts
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-[#d8ddd3] bg-white p-4 shadow-[0_24px_80px_rgba(31,53,39,0.12)]">
          <div className="rounded-md bg-[#10130f] p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-white/60">Recommended build</p>
                <h2 className="mt-1 text-2xl font-semibold">Forge 1440 Elite</h2>
              </div>
              <Gauge className="size-8 text-[#77d39b]" aria-hidden="true" />
            </div>
            <div className="grid gap-3 py-5 sm:grid-cols-2">
              {[
                ['CPU', 'Ryzen 7 9700X'],
                ['GPU', 'GeForce RTX 5070'],
                ['Memory', '32 GB DDR5'],
                ['Storage', '2 TB NVMe'],
              ].map(([label, value]) => (
                <div className="rounded-md bg-white/8 p-4" key={label}>
                  <p className="text-xs uppercase text-white/50">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#77d39b] px-4 py-3 text-[#10130f]">
              <span className="font-semibold">Performance score</span>
              <span className="text-2xl font-bold">94</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-y border-[#d8ddd3] bg-white px-5 py-12 sm:px-8"
        id="builds"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-[#1f6f52]">
                Starting points
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[#10130f]">
                Pick a build profile
              </h2>
            </div>
            <p className="max-w-lg text-[#556052]">
              Use these profiles as a baseline, then adjust parts around your
              budget, monitor, and upgrade plans.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {buildTypes.map((build) => (
              <article
                className="rounded-lg border border-[#d8ddd3] bg-[#fbfcf9] p-5"
                key={build.name}
              >
                <Monitor className="mb-5 size-7 text-[#1f6f52]" aria-hidden="true" />
                <h3 className="text-xl font-semibold">{build.name}</h3>
                <p className="mt-2 text-[#556052]">{build.spec}</p>
                <p className="mt-5 rounded-md bg-white p-3 text-sm font-medium text-[#2f372d]">
                  {build.parts}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2" id="workflow">
        <div>
          <p className="text-sm font-semibold uppercase text-[#1f6f52]">
            Workflow
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            Everything needed for a clean parts decision.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {checks.map((item) => (
            <div className="flex items-center gap-3 rounded-md bg-white p-4" key={item}>
              <BadgeCheck className="size-5 shrink-0 text-[#1f6f52]" aria-hidden="true" />
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#d8ddd3] bg-[#10130f] px-5 py-8 text-white sm:px-8" id="pricing">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-semibold">PCforge</p>
            <p className="mt-1 text-sm text-white/60">
              Built with Vite, React, TypeScript, Tailwind, and Lucide.
            </p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Ready for local development and production builds.
          </p>
        </div>
      </footer>
    </main>
  )
}

export default App
