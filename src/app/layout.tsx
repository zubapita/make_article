import "./globals.css";

export const metadata = {
  title: "make_article",
  description: "PoC for article planning and drafting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
