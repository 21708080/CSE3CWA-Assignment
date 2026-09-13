"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/app/components/site-shell";

type ThemeMode = "light" | "dark" | "system";

const THEME_COOKIE = "phoneme-builder-theme";

function readCookie(name: string) {
  const prefix = `${name}=`;
  const item = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const cookieTheme = readCookie(THEME_COOKIE);
    if (cookieTheme === "light" || cookieTheme === "dark" || cookieTheme === "system") {
      setTheme(cookieTheme);
      document.documentElement.dataset.siteTheme = cookieTheme;
    }

    const storedLargeText = localStorage.getItem("phoneme-builder-large-text") === "true";
    const storedReducedMotion = localStorage.getItem("phoneme-builder-reduced-motion") === "true";
    setLargeText(storedLargeText);
    setReducedMotion(storedReducedMotion);
    document.documentElement.dataset.siteLargeText = String(storedLargeText);
    document.documentElement.dataset.siteReducedMotion = String(storedReducedMotion);
  }, []);

  function applyTheme(value: ThemeMode) {
    setTheme(value);
    document.documentElement.dataset.siteTheme = value;
    document.cookie = `${THEME_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setSaved("Theme saved in a cookie.");
  }

  function applyLargeText(value: boolean) {
    setLargeText(value);
    document.documentElement.dataset.siteLargeText = String(value);
    localStorage.setItem("phoneme-builder-large-text", String(value));
    setSaved("Accessibility preference saved.");
  }

  function applyReducedMotion(value: boolean) {
    setReducedMotion(value);
    document.documentElement.dataset.siteReducedMotion = String(value);
    localStorage.setItem("phoneme-builder-reduced-motion", String(value));
    setSaved("Accessibility preference saved.");
  }

  return (
    <SiteShell>
      <div className="page-stack narrow-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Settings</span>
            <h1>Interface preferences</h1>
            <p>
              These settings affect the teacher-facing website. Generated activities have
              their own appearance and accessibility settings in the Appearance editor.
            </p>
          </div>
        </section>

        <section className="panel">
          <span className="eyebrow">Theme</span>
          <h2>Light, dark or system</h2>
          <p>The selected theme is stored in a browser cookie.</p>
          <div className="theme-choice-grid">
            {(["light", "dark", "system"] as ThemeMode[]).map((value) => (
              <button
                key={value}
                type="button"
                className={theme === value ? "theme-choice selected" : "theme-choice"}
                onClick={() => applyTheme(value)}
                aria-pressed={theme === value}
              >
                <span className={`theme-swatch ${value}`} aria-hidden="true" />
                <strong>{value[0].toUpperCase() + value.slice(1)}</strong>
                <small>
                  {value === "system" ? "Follow the device preference" : `Always use ${value} mode`}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <span className="eyebrow">Accessibility</span>
          <h2>Teacher interface</h2>
          <div className="check-grid vertical">
            <label className="check-card">
              <input
                type="checkbox"
                checked={largeText}
                onChange={(event) => applyLargeText(event.target.checked)}
              />
              <span>
                <strong>Larger interface text</strong>
                <small>Increase the text size throughout the teacher-facing website.</small>
              </span>
            </label>
            <label className="check-card">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => applyReducedMotion(event.target.checked)}
              />
              <span>
                <strong>Reduced motion</strong>
                <small>Remove non-essential transitions and smooth scrolling.</small>
              </span>
            </label>
          </div>
          <p className="status-message success" role="status">{saved}</p>
        </section>
      </div>
    </SiteShell>
  );
}
