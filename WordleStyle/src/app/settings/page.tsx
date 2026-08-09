"use client";

import { useEffect, useState } from "react";
import { GameThemeUpload } from "@/components/game-theme/GameThemeUpload";
import {
  readGameThemePreference,
  saveGameThemePreference,
  type GameThemePreference,
} from "@/lib/gameThemePreference";

type Appearance = "light" | "dark" | "system";

const YEAR_SECONDS = 60 * 60 * 24 * 365;
const options: { id: Appearance; name: string; description: string; icon: string }[] = [
  { id: "light", name: "Light", description: "Bright workspace for daytime use.", icon: "☀" },
  { id: "dark", name: "Dark", description: "Reduced-glare workspace for darker rooms.", icon: "☾" },
  { id: "system", name: "System", description: "Follow your device light or dark setting.", icon: "◐" },
];

function getAppearanceCookie(): Appearance {
  if (typeof document === "undefined") return "system";
  const row = document.cookie
    .split("; ")
    .find((item) => item.startsWith("phoneme-appearance="));
  const value = row ? decodeURIComponent(row.split("=").slice(1).join("=")) : "system";
  return options.some((option) => option.id === value) ? (value as Appearance) : "system";
}

function resolveAppearance(appearance: Appearance) {
  if (appearance !== "system") return appearance;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function SettingsPage() {
  const [appearance, setAppearance] = useState<Appearance>("system");
  const [gameTheme, setGameTheme] = useState<GameThemePreference>({ fileName: "", customCss: "" });

  useEffect(() => {
    setAppearance(getAppearanceCookie());
    setGameTheme(readGameThemePreference());
  }, []);

  useEffect(() => {
    if (appearance !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [appearance]);

  function chooseAppearance(nextAppearance: Appearance) {
    setAppearance(nextAppearance);
    document.documentElement.dataset.appearance = nextAppearance;
    document.documentElement.dataset.theme = resolveAppearance(nextAppearance);
    document.documentElement.dataset.density = "compact";
    document.cookie = `phoneme-appearance=${nextAppearance}; Max-Age=${YEAR_SECONDS}; Path=/; SameSite=Lax`;
  }

  function changeGameTheme(nextTheme: GameThemePreference) {
    setGameTheme(nextTheme);
    saveGameThemePreference(nextTheme);
  }

  return (
    <div className="page-width page-stack">
      <header className="page-intro">
        <span className="eyebrow"><i /> Preferences</span>
        <h1>Settings</h1>
        <p>
          Manage WordleStyle&apos;s system-wide appearance and the default theme embedded into every generated classroom activity.
        </p>
      </header>

      <div className="settings-layout">
        <section className="content-card settings-card">
          <div className="settings-heading">
            <div>
              <span className="section-kicker">Builder appearance</span>
              <h2>Light or dark mode</h2>
            </div>
            <span className="preference-status">
              {options.find((item) => item.id === appearance)?.name}
            </span>
          </div>

          <div className="theme-options" role="radiogroup" aria-label="Builder appearance">
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={appearance === item.id}
                className={`theme-option ${appearance === item.id ? "is-selected" : ""}`}
                onClick={() => chooseAppearance(item.id)}
              >
                <span className="appearance-icon" aria-hidden="true">{item.icon}</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="content-card settings-card">
          <div className="settings-heading">
            <div>
              <span className="section-kicker">Classroom output</span>
              <h2>Generated game theme</h2>
            </div>
            <span className="preference-status">
              {gameTheme.customCss ? "Custom CSS" : "Crimson"}
            </span>
          </div>

          <GameThemeUpload
            fileName={gameTheme.fileName}
            customCss={gameTheme.customCss}
            onChange={changeGameTheme}
          />
        </section>

      </div>
    </div>
  );
}
