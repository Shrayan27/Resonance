# Web player reverse-engineering notes

Target: the public Spotify web player (`open.spotify.com`), analyzed with REA 6.7.0 (browser target listing, viewport capture, static JavaScript application analysis of the three shipped bundles) plus HTTP header inspection. Only publicly served, unauthenticated resources were inspected.

## Observed tech stack

| Area | Finding | Evidence |
| --- | --- | --- |
| Delivery | Envoy edge, Varnish/Fastly cache, static assets on `open.spotifycdn.com/cdn/build/web-player/*` | response headers, HTML |
| App shell | Single-page app, three webpack bundles: `web-player`, `vendor~web-player`, `encore~web-player` (2,739 modules, 0 parse failures) | REA `analyze-javascript-application` |
| Libraries | React + ReactDOM, Redux, Immer, Emotion, protobuf, GraphQL client, Sentry | string/module inventory of bundles |
| Design system | "Encore" (own component library), proprietary "Spotify Mix" fonts | `encore~web-player` bundle, font preloads |
| Bootstrap config | Base64 JSON in `<script id="appServerConfig">`, `featureFlags`, `remoteConfig` (market, locale, anonymous/premium, build version) | HTML |
| Backend hosts | `api-partner.spotify.com` (GraphQL "pathfinder"), `spclient.wg.spotify.com` (protobuf metadata, listening activity), `apresolve.spotify.com` (service discovery), `clienttoken.spotify.com`, `api.spotify.com` (Web API), `dealer` websocket (push state / connect devices) | preconnect links, bundle URLs |
| Playback | `MediaSource` + DASH/HLS handling, Widevine EME (`com.widevine.alpha`) for DRM-protected audio, player state machine ("PlayerState") | bundle string inventory |
| Observability / growth | Sentry, GTM, various ad pixels, reCAPTCHA Enterprise | CSP header, HTML |
| Layout | Top bar (home, search, account), left "Your Library" rail, central scrolling shelves (cards in horizontal rows), right "now playing" panel, persistent bottom player bar | rendered viewport capture |

## What this project reproduces

The interaction model and information architecture, with an original brand ("Resonance"), original UI code and a legal catalog:

- Same layout regions and behaviors: library rail, shelf-based home, search, collection and artist pages, now-playing and queue panels, bottom transport bar, keyboard shortcuts, Media Session integration.
- Catalog and audio come from the open Audius API (artist-uploaded, streamable tracks) behind our own Next.js route handlers (`/api/catalog/*`, `/api/stream/:id`), standing in for Spotify's GraphQL/protobuf backends.
- Library (liked songs, playlists) is stored locally in the browser.

## What it intentionally does not reproduce

- Spotify's catalog, DRM-protected streams, accounts, or private APIs. Circumventing Widevine or accessing Spotify's authenticated endpoints is out of scope.
- Spotify's logo, fonts, icons, artwork, or source code. Everything here is original.
