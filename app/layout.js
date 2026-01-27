export const metadata = {
  title: 'GIGA.GREEN Vertragsvorlagen',
  description: 'Verwaltung der Vertragsvorlagen',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
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
