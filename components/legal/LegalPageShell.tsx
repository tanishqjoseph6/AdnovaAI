import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_PAGES,
} from "@/lib/legal/constants";

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  currentPath: string;
  children: React.ReactNode;
};

function LegalNav({ currentPath }: { currentPath: string }) {
  return (
    <nav
      aria-label="Legal pages"
      className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2"
    >
      {LEGAL_PAGES.map((page) => {
        const active = page.href === currentPath;
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-cyan-400/20 to-violet-500/20 text-white"
                : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
            }`}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.06] pb-8 last:border-b-0 last:pb-0">
      <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export { LegalSection };

export default function LegalPageShell({
  title,
  subtitle,
  currentPath,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#030014] text-zinc-100">
      <Navbar />
      <main className="relative pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-600/10 blur-[100px]" />
          <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Legal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {subtitle}
            </p>
            <p className="text-xs text-zinc-500">Last Updated: {LEGAL_LAST_UPDATED}</p>
          </div>

          <LegalNav currentPath={currentPath} />

          <article className="glass mt-8 space-y-8 rounded-3xl border border-white/[0.08] p-6 shadow-2xl shadow-black/20 sm:p-10">
            {children}
          </article>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Questions? Contact us at{" "}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
