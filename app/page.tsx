// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold">
        GranEverest Autopilot (Base)
      </h1>
      <p className="text-sm text-neutral-400 max-w-md">
        MVP con una sola estrategia: pool stable/stable BOLD/USDC en
        Aerodrome V1 (Base).
      </p>
      <a
        href="/bold-usdc"
        className="px-4 py-2 border border-neutral-700 rounded-md text-sm hover:bg-white hover:text-black transition"
      >
        Ir a estrategia BOLD/USDC
      </a>
    </main>
  );
}
