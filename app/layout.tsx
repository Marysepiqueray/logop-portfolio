import "./globals.css";
import NavBar from "./components/NavBar";

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
                  <div className="brand-sub">Formations et certifications</div>
                </div>
              </div>
            </div>

            <NavBar />
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
