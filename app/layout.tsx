import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google';
import { RegisterSW } from '@/components/register-sw';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Huming — model playground',
  description:
    'Paste a curl command, get a working chat against any OpenAI-compatible model.',
  /*
     Installed on iOS, where the manifest is still only half-read.
     `capable` is what stops Safari from opening the home-screen icon in
     a browser tab, and 'black-translucent' hands the app the strip
     behind the clock — which is the same bargain viewportFit makes
     below, and paid for in the same place: the safe-area padding on the
     rail and the composer.
  */
  appleWebApp: {
    capable: true,
    title: 'Huming',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#01050a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  /*
     The keyboard resizes the page, not just the visible slice of it.
     Without this the layout viewport keeps its full height when the
     keyboard opens — and 100dvh with it — so the composer sitting at
     the foot of the shell ends up under the keys, with no page scroll
     to reveal it (globals.css keeps html and body overflow:hidden).
     Chrome honours this; Safari ignores it, which is what
     useKeyboardInset in lib/use-media.ts is for.
  */
  interactiveWidget: 'resizes-content',
  /*
     Installed, there is no browser chrome left to protect the edges, and
     a scene that stops short of the notch reads as a bug. This lets the
     page cover the whole display — which makes env(safe-area-inset-*)
     load-bearing rather than decorative: the rail and the composer add
     it to their own padding so the content stays out from under the
     hardware.
  */
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
