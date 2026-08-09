"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Wordle", "/wordle"],
  ["Word Search", "/word-search"],
  ["About", "/about"],
  ["Settings", "/settings"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><img src="/brand/eagle-logo.svg" alt="" /></span>
          <span><strong>WordleStyle</strong><small>Activity Builder</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(v => !v)}>
          <span className="sr-only">Toggle navigation</span>{open ? "×" : "☰"}
        </button>
      </div>
      {open && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      </nav>}
    </header>
  );
}
