import "./globals.css";

export const metadata = {
  title: "Sales Agenda",
  description: "SaaS multi-tenant CRM + Calendar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
