import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, AtSign, Briefcase, Code } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Tools: [
    { label: "Generate Ads", href: "/signup" },
    { label: "Competitor Analyzer", href: "/signup" },
    { label: "Landing Analyzer", href: "/signup" },
    { label: "Brand Kit", href: "/signup" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Refund Policy", href: "/refund-policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#020010]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/icon.png"
                alt="Advora"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-semibold text-white">
                Advora
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              The marketing operating system for teams that want to move from
              insight to execution without the busywork.
            </p>
            <div className="mt-6 flex gap-2">
              {[AtSign, Briefcase, Code].map((Icon, index) => (
                <a key={index} href="#" aria-label="Social link" className="rounded-lg border border-white/10 p-2 text-white/45 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:text-cyan-200">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition hover:text-zinc-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-zinc-500 transition hover:text-zinc-300"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Advora. All rights reserved.
          </p>
          <a href="#cta" className="group inline-flex items-center gap-1 text-sm text-zinc-600 transition hover:text-zinc-300">
            Built for marketers who move fast <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
