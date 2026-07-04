"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#030014]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          aria-label="Advora AI home"
          className="group flex items-center gap-2.5"
        >
          <Image
            src="/icon.png"
            alt="Advora AI"
            width={34}
            height={34}
            priority
            className="rounded-lg"
          />
          <span className="flex items-baseline gap-[0.15em] text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-white">
            Advora
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text font-bold text-transparent">
              AI
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 md:hidden"
          onClick={() => setOpen(!open)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {open ? (
        <div className="glass mx-4 mb-4 rounded-2xl border border-white/[0.08] p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
