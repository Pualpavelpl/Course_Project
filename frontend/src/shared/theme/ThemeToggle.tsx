import { useState } from "react";
import { Form } from "react-bootstrap";
import {
  getPreferredTheme,
  saveTheme,
  type ColorTheme,
} from "./theme";

interface ThemeToggleProps {
  id: string;
}

export function ThemeToggle({ id }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ColorTheme>(getPreferredTheme);
  const darkThemeEnabled = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = darkThemeEnabled ? "light" : "dark";

    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Form.Check
      type="switch"
      id={id}
      className="theme-toggle mb-0"
      label="Dark theme"
      checked={darkThemeEnabled}
      onChange={toggleTheme}
      aria-label="Toggle dark theme"
    />
  );
}
