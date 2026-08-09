export const GAME_THEME_STORAGE_KEY = "wordlestyle-game-theme-css";
export const GAME_THEME_FILENAME_KEY = "wordlestyle-game-theme-filename";
export const GAME_THEME_EVENT = "wordlestyle-game-theme-change";

export type GameThemePreference = {
  fileName: string;
  customCss: string;
};

export const DEFAULT_GAME_THEME: GameThemePreference = {
  fileName: "",
  customCss: "",
};

export function readGameThemePreference(): GameThemePreference {
  if (typeof window === "undefined") return DEFAULT_GAME_THEME;

  return {
    fileName: window.localStorage.getItem(GAME_THEME_FILENAME_KEY) ?? "",
    customCss: window.localStorage.getItem(GAME_THEME_STORAGE_KEY) ?? "",
  };
}

export function saveGameThemePreference(preference: GameThemePreference) {
  if (typeof window === "undefined") return;

  if (preference.customCss) {
    window.localStorage.setItem(GAME_THEME_STORAGE_KEY, preference.customCss);
    window.localStorage.setItem(GAME_THEME_FILENAME_KEY, preference.fileName);
  } else {
    window.localStorage.removeItem(GAME_THEME_STORAGE_KEY);
    window.localStorage.removeItem(GAME_THEME_FILENAME_KEY);
  }

  window.dispatchEvent(
    new CustomEvent<GameThemePreference>(GAME_THEME_EVENT, { detail: preference }),
  );
}
