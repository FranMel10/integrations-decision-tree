import "./globals.css";

export const metadata = {
  title: "Integrations Decision Tree — Support",
  description: "Interactive decision tree for integrations support cases",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
