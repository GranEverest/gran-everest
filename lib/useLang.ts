// src/lib/useLang.ts
import { useState, useEffect } from 'react';

export function useLang() {
  // 1. Estado inicial SIEMPRE en inglés
  const [lang, setLangState] = useState<"en" | "es">("en");

  useEffect(() => {
    // 2. Solo cambiamos si el usuario ya guardó "es" explícitamente antes.
    // Ignoramos el idioma del navegador para priorizar tu preferencia de "Inglés por defecto".
    const saved = localStorage.getItem('ge-lang') as "en" | "es";
    if (saved) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: "en" | "es") => {
    setLangState(newLang);
    localStorage.setItem('ge-lang', newLang);
  };

  return { lang, setLang };
}