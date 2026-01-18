import React from "react";

export default function EthereumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      {/* Hemos eliminado la "Sub-Navbar". 
        Ahora este layout es transparente y solo muestra el contenido de la página.
      */}
      {children}
    </section>
  );
}