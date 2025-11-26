// web/src/hooks/useThemeBoot.ts
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Memoria compartida entre todas las páginas (mismo tab)
// No depende de cookies ni localStorage.
let memoryTheme: Theme | null = null;

export function useThemeBoot() {
  const [dark, setDark] = useState(false);

  // Leer tema inicial
  useEffect(() => {
    try {
      let isDark: boolean;

      if (memoryTheme) {
        // Si ya se eligió tema en otra página de la app
        isDark = memoryTheme === "dark";
      } else {
        // Intentamos leer de localStorage (si Safari lo permite)
        const saved =
          typeof window !== "undefined"
            ? localStorage.getItem("geTheme")
            : null;

        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-color-scheme: dark)").matches;

        isDark = saved ? saved === "dark" : !!prefersDark;
      }

      memoryTheme = isDark ? "dark" : "light";
      const theme = isDark ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", theme);
      setDark(isDark);
    } catch {
      // Sin localStorage (cookies bloqueadas), usamos sólo prefers-color-scheme
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;

      const isDark = !!prefersDark;
      memoryTheme = isDark ? "dark" : "light";
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
      setDark(isDark);
    }
  }, []);

  // Cada vez que cambiás el tema, lo guardamos en memoria + localStorage (si se puede)
  useEffect(() => {
    const theme = dark ? "dark" : "light";
    memoryTheme = theme;

    try {
      document.documentElement.setAttribute("data-theme", theme);
      if (typeof window !== "undefined") {
        localStorage.setItem("geTheme", theme);
      }
    } catch {
      // Si localStorage está bloqueado, igual aplicamos el data-theme
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [dark]);

  return { dark, setDark };
}
