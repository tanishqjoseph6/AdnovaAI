import Link from "next/link";
import Image from "next/image";

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
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/icon.png"
                alt="Advora AI"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-semibold text-white">
                Advora<span className="text-cyan-400">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              The complete AI ad platform — generate creative, analyze
              competitors, score performance, and schedule social posts from one
              workspace.
            </p>
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
            © {new Date().getFullYear()} Advora AI. All rights reserved.
          </p>
          <p className="text-sm text-zinc-600">Built for marketers who move fast</p>
        </div>
      </div>
    </footer>
  );
}
