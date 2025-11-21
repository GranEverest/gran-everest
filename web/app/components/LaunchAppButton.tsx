"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type LaunchAppButtonProps = {
  children?: React.ReactNode;
  className?: string;
};

export function LaunchAppButton({
  children = "Launch app",
  className = "",
}: LaunchAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Delay “pesado” antes de ir a /borrow
    setTimeout(() => {
      router.push("/borrow");
    }, 1000); // 1000 ms = 1 segundo
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? "Launching…" : children}
    </button>
  );
}
