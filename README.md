# 🤼 Wrestling Filter

YouTube, but **only pro wrestling** — sorted the way a fan actually wants it.

Instead of fighting YouTube's algorithm, this app gives you a sidebar of
promotions and shows. Open **WCW → Monday Nitro** and get episodes sorted
**in broadcast order** (it parses dates like `1996.01.08` out of video
titles), mark episodes watched, and hit **Next episode** to binge in
sequence.

Everything plays in the official YouTube embedded player and is found via the
official YouTube Data API. **Nothing is downloaded, ripped, or re-hosted** —
this is just a better remote control for YouTube.

## Sections

| Category | Shows |
|---|---|
| **WWE / WWF** | Raw (classic & modern), SmackDown, Superstars, Prime Time Wrestling, Saturday Night's Main Event, Tuesday Night Titans, PPVs, Golden Era |
| **WCW** | Monday Nitro, Thunder, Saturday Night, WorldWide, Main Event, PPVs, NWA/Crockett era, nWo |
| **ECW** | Hardcore TV, ECW on TNN, PPVs, classic matches |
| **Territories** | Mid-South/UWF, World Class (WCCW), Memphis, AWA, Georgia, Florida, Stampede, Portland, Continental, Smoky Mountain, World of Sport |
| **Interviews** | Shoot interviews, Kayfabe Commentaries, legend sit-downs, classic promos, documentaries |
| **Podcasts** | Something to Wrestle, 83 Weeks, Grilling JR, Kurt Angle Show, Talk Is Jericho, Cornette |
| **My Searches** | Add your own sections with any search query |

## Features

- **Watch in order** — dates and episode numbers are parsed from titles for true chronological sorting
- **Watched tracking** — mark episodes off, hide watched, auto-marked when you play one
- **Next episode ▸** — jumps to the next unwatched episode in order
- **Full episodes only** filter (20+ minutes) to skip clips
- **24-hour result caching** so your free API quota goes a long way
- Dark theme, works on mobile, zero dependencies, zero build step

## Setup (one time, ~2 minutes)

The app needs a free YouTube Data API key. It's stored only in your browser.

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
   and click **Enable** on *YouTube Data API v3* (create a free project if prompted).
2. Go to [Credentials](https://console.cloud.google.com/apis/credentials) →
   **Create credentials → API key** and copy the key.
3. Open the app, click **⚙️ Settings**, paste the key, save.

The free tier gives 10,000 quota units/day (~100 searches). Results are
cached for 24 hours, so normal browsing uses very little.

## Running it

No install needed — it's a static page:

- **Locally:** just open `index.html` in your browser.
- **GitHub Pages:** repo Settings → Pages → deploy from branch → pick the
  branch and `/ (root)`. Your app will be live at
  `https://<your-username>.github.io/Wrestling_Filter/`.

## On your phone

The app is a PWA (progressive web app), so once it's on GitHub Pages you can
install it like a real app:

1. Open the GitHub Pages URL in your phone browser.
2. **Android/Chrome:** tap the ⋮ menu → **Add to Home screen** (Chrome may
   also offer an "Install app" banner). **iPhone/Safari:** tap Share →
   **Add to Home Screen**.
3. Launch it from the icon — it opens fullscreen with no browser chrome,
   caches itself for instant startup, and remembers your API key and
   watched-episode history on that device.

You'll be asked for the API key once per device (it's stored locally, never
synced anywhere).

## Notes

- Chronological sort works best when uploaders put dates in titles (most
  full-episode archives do, e.g. `WCW Nitro 01/08/1996`). Videos without a
  parseable date fall back to episode number, then upload date.
- If you hit the daily API quota, cached sections keep working; quota resets
  at midnight Pacific time.
