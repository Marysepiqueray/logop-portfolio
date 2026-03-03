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
          <div className="topbar">
            <div className="brand">
              <img src="/logo.png" alt="Logo" />
              <div>
                <div className="brand-title">Portfolio</div>
                <div className="brand-sub">Logop’Aide et vous</div>
              </div>
            </div>
            <span className="badge">Espace privé</span>
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
