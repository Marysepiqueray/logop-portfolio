import type { ReactNode } from "react";

export const metadata = {
  title: "Portfolio – Logop’Aide et vous",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
