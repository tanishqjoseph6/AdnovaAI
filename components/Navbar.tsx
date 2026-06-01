"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#cta", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Advora<span className="text-cyan-400">AI</span>
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
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
          >
            Dashboard
          </Link>
          <a
            href="#cta"
            className="rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
          >
            Start free
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-300 md:hidden"
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

      {open && (
        <div className="glass mx-4 mb-4 rounded-2xl p-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <a
              href="#cta"
              className="mt-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Start free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
