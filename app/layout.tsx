import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata = {
  title: "Logop'Aide et vous",
  description: "Passeport de compétences",
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
                <div className="brand-logo-wrap">
                  <img src="/logo.png" alt="Logo Logop'Aide et vous" />
                </div>

                <div className="brand-text">
                  <div className="brand-title">
                    Logop'Aide <span className="red">et vous</span>
                  </div>

                  <div className="brand-sub">
                    Passeport de compétences • formations • réseau
                  </div>
                </div>
              </div>
            </div>

            <NavBar />
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
