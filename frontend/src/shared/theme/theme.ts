export type ColorTheme = "light" | "dark";

const THEME_STORAGE_KEY = "course-project-color-theme";

function isColorTheme(value: string | null): value is ColorTheme {
  return value === "light" || value === "dark";
}

export function resolvePreferredTheme(
  storedTheme: string | null,
  prefersDark: boolean,
): ColorTheme {
  if (isColorTheme(storedTheme)) return storedTheme;
  return prefersDark ? "dark" : "light";
}

export function getPreferredTheme(): ColorTheme {
  return resolvePreferredTheme(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function applyTheme(theme: ColorTheme): void {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

export function saveTheme(theme: ColorTheme): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initializeTheme(): void {
  applyTheme(getPreferredTheme());
}
