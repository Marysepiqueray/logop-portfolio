import "./globals.css";

export const metadata = {
  title: "Portfolio Logop'aide & Vous",
  description: "Portfolio de formation des membres",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>

        <div className="container">

          <header className="header">

            <div className="header-row">

              <div className="brand">

                <img src="/logo.png" alt="Logo" />

                <div>
                  <div className="brand-title">
                    Portfolio <span className="red">Logop'aide & Vous</span>
                  </div>

                  <div className="brand-sub">
                    Formations et certifications
                  </div>
                </div>

              </div>

            </div>

            <nav className="navbar">

              <a href="/">Accueil</a>

              <a href="/me">Mon portfolio</a>

              <a href="/admin">Admin</a>

            </nav>

          </header>

          {children}

        </div>

      </body>
    </html>
  );
}
