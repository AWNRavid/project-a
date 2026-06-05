import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Kanban, Layers, Users } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  delay: number;
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0a0e1a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span
          className="text-xl font-extrabold tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Trackr
        </span>
        <nav className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-slate-300 hover:text-slate-600"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/sign-up">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Radial glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.6231 0.188 259.8145 / 0.18), transparent)",
        }}
      />

      {/* Badge */}
      <div
        className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300"
        style={{ animationDelay: "0ms" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Issue tracking, reimagined
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in-up max-w-3xl text-5xl leading-[1.05] font-extrabold tracking-tighter text-white sm:text-6xl lg:text-7xl"
        style={{
          fontFamily: "var(--font-display)",
          animationDelay: "80ms",
        }}
      >
        Project management
        <br />
        <span className="text-blue-400">that gets out of your way</span>
      </h1>

      {/* Sub-headline */}
      <p
        className="animate-fade-in-up mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
        style={{ animationDelay: "160ms" }}
      >
        From backlog to shipped. Track issues, manage sprints, and collaborate
        with your team — all in one focused workspace.
      </p>

      {/* CTA Row */}
      <div
        className="animate-fade-in-up mt-10 flex flex-wrap items-center justify-center gap-4"
        style={{ animationDelay: "240ms" }}
      >
        <Button size="lg" asChild className="gap-2 px-8">
          <Link href="/sign-up">
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          asChild
          className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/login">Sign in to your workspace</Link>
        </Button>
      </div>

      {/* Social proof */}
      <p
        className="animate-fade-in-up mt-8 flex items-center gap-2 text-sm text-slate-500"
        style={{ animationDelay: "320ms" }}
      >
        <CheckCircle2 className="h-4 w-4 text-slate-600" />
        No credit card required · Free to start
      </p>
    </section>
  );
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-white/6 bg-[#111827] p-6 transition-colors duration-200 hover:border-white/12"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 inline-flex rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
        {icon}
      </div>
      <h3
        className="mb-2 text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-4 text-center text-sm font-semibold tracking-widest text-blue-400 uppercase">
        Everything you need
      </div>
      <h2
        className="mb-16 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Built for how teams actually work
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          delay={0}
          icon={<Layers className="h-5 w-5" />}
          title="Issue Tracking"
          description="Create, assign, and track issues with custom statuses, priorities, and labels. Never lose sight of what needs to ship."
        />
        <FeatureCard
          delay={80}
          icon={<Kanban className="h-5 w-5" />}
          title="Kanban Boards"
          description="Visualize your workflow with drag-and-drop boards. Move issues across columns and see team progress at a glance."
        />
        <FeatureCard
          delay={160}
          icon={<Users className="h-5 w-5" />}
          title="Team Collaboration"
          description="Comment on issues, mention teammates, attach files, and keep context close to the work — not buried in chat."
        />
      </div>
    </section>
  );
}

function Step({ number, title, description, delay }: StepProps) {
  return (
    <div
      className="animate-fade-in-up flex-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="mb-3 text-6xl leading-none font-extrabold text-white/4"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {number}
      </div>
      <h3
        className="mb-2 text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="border-t border-white/6 bg-[#0d1117] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center text-sm font-semibold tracking-widest text-blue-400 uppercase">
          How it works
        </div>
        <h2
          className="mb-16 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Up and running in minutes
        </h2>
        <div className="flex flex-col gap-12 md:flex-row md:gap-8">
          <Step
            delay={0}
            number="01"
            title="Create your workspace"
            description="Set up in minutes. Invite your team, create your first project, and configure your workflow to match how you actually work."
          />
          <div className="hidden w-px bg-white/6 md:block" />
          <Step
            delay={100}
            number="02"
            title="Track your issues"
            description="Add issues, set priorities, assign owners, and move them through your pipeline. Everything stays organized automatically."
          />
          <div className="hidden w-px bg-white/6 md:block" />
          <Step
            delay={200}
            number="03"
            title="Ship faster"
            description="With everything in one place, your team spends less time in meetings and more time building. See progress at a glance."
          />
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-blue-500/20 bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent p-12 text-center">
          <h2
            className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to move fast?
          </h2>
          <p className="mb-8 text-slate-400">
            Start free — no credit card required. Set up your workspace in
            minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2 px-8">
              <Link href="/sign-up">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="text-slate-300 hover:text-white"
            >
              <Link href="/login">Already have an account?</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/6 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <span
            className="text-lg font-extrabold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Trackr
          </span>
          <p className="mt-1 text-sm text-slate-500">
            © {new Date().getFullYear()} Trackr. All rights reserved.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-slate-500">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-400">Product</span>
            <a href="#" className="transition-colors hover:text-slate-300">
              Features
            </a>
            <a href="#" className="transition-colors hover:text-slate-300">
              Changelog
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-400">Account</span>
            <Link
              href="/login"
              className="transition-colors hover:text-slate-300"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="transition-colors hover:text-slate-300"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default async function Page() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTABanner />
      <Footer />
    </div>
  );
}
