/*
 * Huming's service worker.
 *
 * One job: make a launch from the home screen with no network render the
 * app instead of the browser's dinosaur. A soft navigation can be kept
 * pending and retried, but a cold load cannot — the browser needs HTML
 * from somewhere, and this is the only place it can come from.
 *
 * What it does not do is touch the chat. The request that carries the
 * user's API key is a POST, and the first rule below drops every method
 * that is not GET before anything else runs, so it is not merely
 * uncached — it never enters this file's control flow at all.
 *
 * Hand-written rather than generated. The whole policy is four ordered
 * rules and a version string; a build-time precache manifest would add
 * a dependency and a Turbopack caveat to cache two known URLs.
 */

/** Bump to invalidate everything. Old caches are dropped on activate. */
const VERSION = 'v1';
const CACHE = `huming-${VERSION}`;

/**
 * The two URLs worth having before they are asked for, because they are
 * the two that a cold offline launch cannot start without: the shell,
 * and the still frame of the scene behind it.
 *
 * The hashed chunks, the CSS and the fonts are deliberately absent —
 * their URLs are only knowable from the build manifest. Rule 3 catches
 * them the first time they load instead, so offline works from the
 * second visit rather than the first, and this install stays a 250KB
 * download instead of a guess.
 */
const PRECACHE = ['/', '/scene/poster.jpg'];

/** Content-hashed by the build, or versioned by hand. Safe to keep forever. */
const IMMUTABLE_PREFIXES = ['/_next/static/', '/scene/'];
const IMMUTABLE_FILES = [
  '/favicon.ico',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-icon.png',
];

const isImmutable = (path) =>
  IMMUTABLE_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
  IMMUTABLE_FILES.includes(path);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one miss cannot fail the install and leave the
      // app with no worker at all.
      .then((cache) =>
        Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Cache only what came from us and came back whole. */
function keep(cache, request, response) {
  if (response.ok && response.type === 'basic') {
    void cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  return keep(cache, request, await fetch(request));
}

/**
 * Network first, cache as a floor. A reachable server always wins — this
 * is not an offline-first app pretending the network is optional — and
 * every answer it gives refreshes the shell, so the copy sitting in the
 * cache is the last build the user actually loaded rather than the one
 * they installed.
 */
async function shellFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    return keep(cache, '/', await fetch(request));
  } catch (offline) {
    const shell = await cache.match('/');
    if (shell) return shell;
    throw offline;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Not a GET: not ours. The chat POST carries the user's key, and
  //    the guarantee that it never lands in a cache is this line, not a
  //    filter further down.
  if (request.method !== 'GET') return;

  // 2. Range requests: not ours either. The scene is served to <video>,
  //    which asks for byte ranges; answering one with a whole 200 out of
  //    a cache is the sort of thing Safari refuses outright. Offline,
  //    the video request simply fails and the poster underneath it
  //    stays up — which is a still of the same scene.
  if (request.headers.has('range')) return;

  const url = new URL(request.url);

  // 3. Someone else's origin, or our own API. GET /api/models carries
  //    the key in a header, so the API is excluded by path as well as
  //    by method — the same rule twice, on purpose.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 4. The immutable half of the app: hit the cache and stop.
  if (isImmutable(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 5. The reason any of this exists.
  if (request.mode === 'navigate') {
    event.respondWith(shellFirst(request));
  }
});
