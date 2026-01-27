export const metadata = {
  title: 'GIGA.GREEN Vertragsvorlagen',
  description: 'Verwaltung der Vertragsvorlagen',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
