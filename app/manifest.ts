import type { MetadataRoute } from 'next';

/**
 * What an installed Huming is.
 *
 * Served at /manifest.webmanifest; Next links it from every page. The
 * name and description are the same two strings as app/layout.tsx's
 * metadata, because an icon on a home screen and a tab in a browser are
 * the same app and should not describe themselves differently.
 *
 * Deliberately absent: `orientation`. The composer works in landscape,
 * a phone in a stand is a reasonable way to use this, and locking
 * rotation to save a layout that does not need saving is the sort of
 * thing that gets noticed only when it is wrong.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Huming — model playground',
    short_name: 'Huming',
    description:
      'Paste a curl command, get a working chat against any OpenAI-compatible model.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    /*
       Both --color-abyss. background_color is what the launcher paints
       while the app is still starting, so making it the page's own
       background is the difference between a splash and a flash of
       white.
    */
    background_color: '#01050a',
    theme_color: '#01050a',
    categories: ['developer', 'productivity', 'utilities'],
    icons: [
      // 'any' is the icon as drawn: the rail's glass tile on its ground.
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: '/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      /*
         'maskable' is the same artwork with the tile taken away. Android
         crops a maskable icon to a shape of its choosing inside the
         middle 80%, and the tile's corners are outside that — they would
         come off. What is left is the waves at half the canvas, whose
         own corners sit at 66%, comfortably inside.
      */
      {
        src: '/icon-maskable-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'maskable',
      },
    ],
  };
}
