"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SITE_LOGO_SRC, SITE_NAME, STUDENT_NAME, STUDENT_NUMBER } from "@/app/lib/site-config";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/wordlists", label: "Word Lists" },
  { href: "/wordle", label: "Wordle" },
  { href: "/word-search", label: "Word Search" },
  { href: "/builder", label: "Appearance" },
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" aria-label={`${SITE_NAME} home`}>
            {SITE_LOGO_SRC ? (
              <img className="brand-logo" src={SITE_LOGO_SRC} alt="" aria-hidden="true" />
            ) : (
              <span className="brand-mark" aria-hidden="true">/θ/</span>
            )}
            <span>
              <strong>{SITE_NAME}</strong>
              <small>Speech Pathology classroom activities</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isCurrent(pathname, item.href) ? "nav-link active" : "nav-link"}
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">☰</summary>
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isCurrent(pathname, item.href) ? "nav-link active" : "nav-link"}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div>
          <strong>{SITE_NAME}</strong>
          <span>{STUDENT_NAME} · {STUDENT_NUMBER}</span>
        </div>
      </footer>
    </div>
  );
}
