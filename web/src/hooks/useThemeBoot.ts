// web/src/hooks/useThemeBoot.ts
"use client";

import { useEffect, useState } from "react";

let launchNavWired = false;

export function useThemeBoot() {
  const [dark, setDark] = useState(false);

  // Boot inicial: lee preferencia y aplica tema
  useEffect(() => {
    try {
      const saved = localStorage.getItem("geTheme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;

      const isDark = saved ? saved === "dark" : !!prefersDark;
      setDark(isDark);
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
    } catch {
      // ignore
    }
  }, []);

  // Cada vez que cambia `dark`, actualiza atributo + guarda en localStorage
  useEffect(() => {
    try {
      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );
      localStorage.setItem("geTheme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [dark]);

  // Hook global para agregar DELAY al botón "Launch app" del NAV en todas las páginas
  useEffect(() => {
    // Evitar wiring duplicado si useThemeBoot se usa en varias páginas
    if (launchNavWired) return;
    launchNavWired = true;

    function wireLaunchLinks() {
      if (typeof document === "undefined") return;

      const anchors =
        document.querySelectorAll<HTMLAnchorElement>('a[href="/borrow"]');

      anchors.forEach((a) => {
        // Evitar agregar el listener dos veces al mismo <a>
        if (a.dataset.launchBound === "1") return;
        a.dataset.launchBound = "1";

        a.addEventListener("click", (ev) => {
          // Permitir abrir en nueva pestaña con Ctrl/⌘, etc.
          const mouseEvent = ev as MouseEvent;
          if (
            ev.defaultPrevented ||
            mouseEvent.button !== 0 ||
            mouseEvent.metaKey ||
            mouseEvent.ctrlKey ||
            mouseEvent.shiftKey ||
            mouseEvent.altKey
          ) {
            return;
          }

          ev.preventDefault();

          if (a.dataset.launchPending === "1") return;
          a.dataset.launchPending = "1";

          const originalText = a.textContent || "";

          // Sólo cambiamos el texto si es el botón de Launch app
          if (originalText.trim().toLowerCase() === "launch app") {
            a.textContent = "Launching…";
          }

          // Delay de 1 segundo antes de ir a /borrow
          setTimeout(() => {
            window.location.href = "/borrow";
          }, 1000);
        });
      });
    }

    // Wire inicial
    wireLaunchLinks();

    // Observar cambios en el DOM (cuando cambiás de página, etc.)
    const observer = new MutationObserver(() => {
      wireLaunchLinks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => setDark((prev) => !prev);

  return { dark, toggleTheme };
}
