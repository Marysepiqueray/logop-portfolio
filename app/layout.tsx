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
                <img src="/logo.png" alt="Logo" />
                <div>
                  <div className="brand-title">
                    Logop'Aide <span className="red">et vous</span>
                  </div>
                  <div className="brand-sub">Passeport de compétences</div>
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
