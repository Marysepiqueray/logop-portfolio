import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Portfolio – Logop’Aide et vous",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="container">
          <header className="header">
            <div className="header-row">
              <div className="brand">
                <img src="/logo.png" alt="Logo Logop’Aide et vous" />
              </div>

              <div style={{ flex: 1 }}>
                <div className="brand-title">
                  Logop’<span className="red">Aide</span> <span style={{ fontStyle: "italic", color: "#9CA3AF" }}>et vous</span>
                </div>
                <div className="brand-sub">Espace portfolio formations</div>
              </div>

              <div className="badge">Espace privé</div>
            </div>

        <nav className="navbar">

  <a href="/">Accueil</a>

  <a href="/me">Mon portfolio</a>

  {membre?.role === "admin" && (
    <a href="/admin">Admin</a>
  )}

</nav>
          </header>

          {/* Optionnel : une grande bannière comme sur ton site */}
          {/* Si tu veux une image, on l’ajoute dans /public/hero.jpg puis on dé-commente ci-dessous */}
          {/*
          <section className="hero">
            <img src="/hero.jpg" alt="Bannière" />
            <div className="hero-caption">Bienvenue !</div>
          </section>
          */}

          {children}
        </div>
      </body>
    </html>
  );
}
