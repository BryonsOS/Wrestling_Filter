/* Wrestling Filter — a curated YouTube lens for pro wrestling.
 * Uses the official YouTube Data API v3 for search and the official
 * embedded player for playback. Nothing is downloaded or re-hosted. */

(() => {
  "use strict";

  const API_BASE = "https://www.googleapis.com/youtube/v3/search";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // reuse results for a day to save quota
  const PAGE_SIZE = 25;

  const state = {
    apiKey: localStorage.getItem("wf_api_key") || "",
    watched: new Set(JSON.parse(localStorage.getItem("wf_watched") || "[]")),
    hiddenChannels: new Set(JSON.parse(localStorage.getItem("wf_hidden_channels") || "[]")),
    customShows: JSON.parse(localStorage.getItem("wf_custom_shows") || "[]"),
    current: null,          // { promo, show }
    videos: [],
    nextPageToken: null,
    sort: "chrono",
    longOnly: true,
    hideWatched: false,
    loading: false,
  };

  const $ = (sel) => document.querySelector(sel);

  // ---------- persistence ----------

  function saveWatched() {
    localStorage.setItem("wf_watched", JSON.stringify([...state.watched]));
  }

  function saveCustomShows() {
    localStorage.setItem("wf_custom_shows", JSON.stringify(state.customShows));
  }

  function saveHiddenChannels() {
    localStorage.setItem("wf_hidden_channels", JSON.stringify([...state.hiddenChannels]));
  }

  function cacheGet(key) {
    try {
      const raw = localStorage.getItem("wf_cache_" + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.t > CACHE_TTL_MS) {
        localStorage.removeItem("wf_cache_" + key);
        return null;
      }
      return entry.d;
    } catch {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem("wf_cache_" + key, JSON.stringify({ t: Date.now(), d: data }));
    } catch {
      // localStorage full — drop oldest cache entries and retry once
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("wf_cache_"));
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k));
      try {
        localStorage.setItem("wf_cache_" + key, JSON.stringify({ t: Date.now(), d: data }));
      } catch { /* give up silently */ }
    }
  }

  // ---------- date / episode parsing for chronological sort ----------

  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };

  // Try to pull a broadcast date out of a video title. Returns a sortable
  // number (yyyymmdd) or null.
  function parseTitleDate(title) {
    let m;

    // 1996.01.08 / 1996-01-08 / 1996/01/08
    m = title.match(/\b(19[5-9]\d|20[0-2]\d)[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\b/);
    if (m) return dateKey(+m[1], +m[2], +m[3]);

    // 01.08.1996 / 1/8/96 (US month-first)
    m = title.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/);
    if (m) {
      let year = +m[3];
      if (year < 100) year += year >= 50 ? 1900 : 2000;
      return dateKey(year, +m[1], +m[2]);
    }

    // January 8, 1996 / Jan 8 1996
    m = title.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(19[5-9]\d|20[0-2]\d)\b/i);
    if (m) return dateKey(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);

    // 8 January 1996
    m = title.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(19[5-9]\d|20[0-2]\d)\b/i);
    if (m) return dateKey(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);

    // Bare year as a last resort ("Starrcade 1997") — sorts by year only
    m = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (m) return dateKey(+m[1], 0, 0);

    return null;
  }

  function dateKey(y, mo, d) {
    if (mo < 0 || mo > 12 || d < 0 || d > 31) return null;
    return y * 10000 + mo * 100 + d;
  }

  function parseEpisodeNumber(title) {
    const m = title.match(/(?:ep(?:isode)?\.?\s*#?\s*|#)(\d{1,4})\b/i);
    return m ? +m[1] : null;
  }

  function sortVideos(videos, mode) {
    const list = [...videos];
    if (mode === "newest") {
      list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      return list;
    }
    if (mode === "relevance") return list; // API order as returned
    // chrono: title dates first (ascending), then episode numbers, then upload date
    const dated = [], numbered = [], rest = [];
    for (const v of list) {
      const dk = parseTitleDate(v.title);
      const ep = parseEpisodeNumber(v.title);
      if (dk) dated.push([dk, v]);
      else if (ep !== null) numbered.push([ep, v]);
      else rest.push(v);
    }
    dated.sort((a, b) => a[0] - b[0]);
    numbered.sort((a, b) => a[0] - b[0]);
    rest.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    return [...dated.map((x) => x[1]), ...numbered.map((x) => x[1]), ...rest];
  }

  // ---------- YouTube API ----------

  async function fetchPage(query, pageToken) {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: String(PAGE_SIZE),
      q: query,
      videoEmbeddable: "true",
      order: "relevance",
      key: state.apiKey,
    });
    if (state.longOnly) params.set("videoDuration", "long"); // >20 min = full episodes
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${API_BASE}?${params}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const reason = body?.error?.errors?.[0]?.reason || "";
      if (res.status === 403 && reason.includes("quota")) {
        throw new Error("Daily YouTube API quota reached. Cached sections still work — quota resets at midnight Pacific.");
      }
      if (res.status === 400 || res.status === 403) {
        throw new Error("YouTube rejected the API key. Double-check it in Settings and make sure “YouTube Data API v3” is enabled for it.");
      }
      throw new Error(`YouTube API error (${res.status}).`);
    }
    const data = await res.json();
    return {
      nextPageToken: data.nextPageToken || null,
      videos: (data.items || [])
        .filter((it) => it.id && it.id.videoId)
        .map((it) => ({
          id: it.id.videoId,
          title: decodeEntities(it.snippet.title),
          channel: decodeEntities(it.snippet.channelTitle),
          publishedAt: it.snippet.publishedAt,
          thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "",
        })),
    };
  }

  function decodeEntities(str) {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  }

  // ---------- show loading ----------

  function cacheKeyFor(show) {
    return `v2|${show.id}|${state.longOnly ? "long" : "any"}`;
  }

  // Talk sections (podcasts/interviews) and the user's own searches skip
  // the automatic junk filtering — there, "podcast" IS the content.
  function isFiltered(promo) {
    return promo && !promo.talk && promo.id !== "custom";
  }

  function effectiveQuery(promo, show) {
    return isFiltered(promo) ? show.query + QUERY_NEGATIVES : show.query;
  }

  function passesFilters(v) {
    const { promo, show } = state.current || {};
    if (state.hiddenChannels.has(v.channel)) return false;
    if (!isFiltered(promo)) return true;
    const t = v.title.toLowerCase();
    if (GLOBAL_EXCLUDE.some((w) => t.includes(w))) return false;
    if (show.exclude?.some((w) => t.includes(w.toLowerCase()))) return false;
    if (show.require?.length && !show.require.some((w) => t.includes(w.toLowerCase()))) return false;
    return true;
  }

  async function openShow(promo, show) {
    state.current = { promo, show };
    state.sort = show.sort || "chrono";
    state.videos = [];
    state.nextPageToken = null;
    renderShowHeader();
    renderGrid();

    if (!state.apiKey) {
      showSetupNotice();
      return;
    }

    const cached = cacheGet(cacheKeyFor(show));
    if (cached) {
      state.videos = cached.videos;
      state.nextPageToken = cached.nextPageToken;
      renderGrid();
      return;
    }
    await loadMore(true);
  }

  async function loadMore(fresh = false) {
    const { show } = state.current || {};
    if (!show || state.loading) return;
    state.loading = true;
    setStatus("Loading…");
    try {
      const page = await fetchPage(effectiveQuery(state.current.promo, show), fresh ? null : state.nextPageToken);
      const seen = new Set(state.videos.map((v) => v.id));
      state.videos.push(...page.videos.filter((v) => !seen.has(v.id)));
      state.nextPageToken = page.nextPageToken;
      cacheSet(cacheKeyFor(show), { videos: state.videos, nextPageToken: state.nextPageToken });
      setStatus("");
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      state.loading = false;
      renderGrid();
    }
  }

  // ---------- rendering ----------

  function renderSidebar() {
    const nav = $("#nav");
    nav.innerHTML = "";
    const catalog = catalogWithCustom();
    for (const promo of catalog) {
      const section = document.createElement("div");
      section.className = "nav-promo";
      const header = document.createElement("button");
      header.className = "nav-promo-header";
      header.style.setProperty("--promo-color", promo.color);
      header.innerHTML = `<span class="nav-icon">${promo.icon}</span><span>${promo.name}</span><span class="chevron">▸</span>`;
      const list = document.createElement("div");
      list.className = "nav-shows";
      list.hidden = true;
      header.addEventListener("click", () => {
        list.hidden = !list.hidden;
        header.classList.toggle("open", !list.hidden);
      });
      for (const show of promo.shows) {
        const btn = document.createElement("button");
        btn.className = "nav-show";
        btn.textContent = show.name;
        btn.addEventListener("click", () => {
          document.querySelectorAll(".nav-show.active").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          openShow(promo, show);
          document.body.classList.remove("sidebar-open"); // mobile
        });
        list.appendChild(btn);
      }
      if (promo.id === "custom") {
        const add = document.createElement("button");
        add.className = "nav-show nav-add";
        add.textContent = "+ Add a show / search";
        add.addEventListener("click", addCustomShow);
        list.appendChild(add);
      }
      section.append(header, list);
      nav.appendChild(section);
    }
  }

  function catalogWithCustom() {
    return [
      ...CATALOG,
      {
        id: "custom",
        name: "My Searches",
        icon: "⭐",
        color: "#607d8b",
        shows: state.customShows,
      },
    ];
  }

  function addCustomShow() {
    const name = prompt("Name for this section (e.g. “Ric Flair matches”):");
    if (!name) return;
    const query = prompt("YouTube search to use (e.g. “Ric Flair full match NWA”):", name + " full match");
    if (!query) return;
    state.customShows.push({ id: "custom-" + Date.now(), name, query, sort: "chrono" });
    saveCustomShows();
    renderSidebar();
  }

  function renderShowHeader() {
    const { promo, show } = state.current;
    $("#show-title").textContent = show.name;
    $("#show-promo").textContent = promo.name;
    $("#show-promo").style.background = promo.color;
    $("#controls").hidden = false;
    $("#sort-select").value = state.sort;
  }

  function visibleVideos() {
    let list = sortVideos(state.videos, state.sort).filter(passesFilters);
    if (state.hideWatched) list = list.filter((v) => !state.watched.has(v.id));
    return list;
  }

  function renderGrid() {
    const grid = $("#grid");
    grid.innerHTML = "";
    if (!state.current) return;

    const list = visibleVideos();
    for (const v of list) {
      const card = document.createElement("div");
      card.className = "card" + (state.watched.has(v.id) ? " watched" : "");
      const dk = parseTitleDate(v.title);
      const dateLabel = dk ? formatDateKey(dk) : new Date(v.publishedAt).getFullYear();
      card.innerHTML = `
        <div class="thumb-wrap">
          <img loading="lazy" src="${v.thumb}" alt="">
          <span class="date-badge">${dateLabel}</span>
          <span class="watched-badge">✓ Watched</span>
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(v.title)}</div>
          <div class="card-channel"><span>${escapeHtml(v.channel)}</span>
            <button class="hide-channel" title="Never show this channel again">🚫</button></div>
        </div>
        <button class="watch-toggle" title="Toggle watched">✓</button>
        <a class="yt-link" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener"
           title="Open in YouTube app (cast to TV from there)">▶ YouTube</a>`;
      card.querySelector(".thumb-wrap").addEventListener("click", () => playVideo(v));
      card.querySelector(".card-title").addEventListener("click", () => playVideo(v));
      card.querySelector(".watch-toggle").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWatched(v.id);
      });
      card.querySelector(".yt-link").addEventListener("click", (e) => e.stopPropagation());
      card.querySelector(".hide-channel").addEventListener("click", (e) => {
        e.stopPropagation();
        hideChannel(v.channel);
      });
      grid.appendChild(card);
    }

    $("#load-more").hidden = !state.nextPageToken || !state.apiKey;
    $("#empty-note").hidden = !(state.videos.length && !list.length);
  }

  function formatDateKey(dk) {
    const y = Math.floor(dk / 10000), mo = Math.floor((dk % 10000) / 100), d = dk % 100;
    if (!mo) return String(y);
    return `${String(mo).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setStatus(msg, isError = false) {
    const el = $("#status");
    el.textContent = msg;
    el.classList.toggle("error", isError);
  }

  // ---------- player ----------

  function playVideo(video) {
    const modal = $("#player-modal");
    $("#player-frame").src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
    $("#player-title").textContent = video.title;
    $("#player-youtube").href = `https://www.youtube.com/watch?v=${video.id}`;
    modal.dataset.videoId = video.id;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    if (!state.watched.has(video.id)) {
      state.watched.add(video.id);
      saveWatched();
    }
  }

  function closePlayer() {
    $("#player-frame").src = "";
    $("#player-modal").hidden = true;
    document.body.classList.remove("modal-open");
    renderGrid();
  }

  function playNextUnwatched() {
    const currentId = $("#player-modal").dataset.videoId;
    const list = sortVideos(state.videos, state.sort);
    const idx = list.findIndex((v) => v.id === currentId);
    const next = list.slice(idx + 1).find((v) => !state.watched.has(v.id));
    if (next) playVideo(next);
    else {
      closePlayer();
      setStatus("You've watched everything loaded — hit “Load more” for the next batch.");
    }
  }

  function hideChannel(name) {
    state.hiddenChannels.add(name);
    saveHiddenChannels();
    renderGrid();
    setStatus(`Hidden "${name}" everywhere — undo in Settings.`);
  }

  function renderHiddenChannels() {
    const box = $("#hidden-channels");
    box.innerHTML = "";
    if (!state.hiddenChannels.size) {
      box.innerHTML = `<p class="hint">None yet — tap 🚫 on any video to hide its channel from every section.</p>`;
      return;
    }
    for (const name of [...state.hiddenChannels].sort()) {
      const row = document.createElement("div");
      row.className = "hidden-channel-row";
      const label = document.createElement("span");
      label.textContent = name;
      const btn = document.createElement("button");
      btn.textContent = "Unhide";
      btn.addEventListener("click", () => {
        state.hiddenChannels.delete(name);
        saveHiddenChannels();
        renderHiddenChannels();
        renderGrid();
      });
      row.append(label, btn);
      box.appendChild(row);
    }
  }

  function toggleWatched(id) {
    if (state.watched.has(id)) state.watched.delete(id);
    else state.watched.add(id);
    saveWatched();
    renderGrid();
  }

  // ---------- settings / setup ----------

  function showSetupNotice() {
    $("#setup-notice").hidden = false;
  }

  function openSettings() {
    $("#api-key-input").value = state.apiKey;
    renderHiddenChannels();
    $("#settings-modal").hidden = false;
  }

  function saveSettings() {
    state.apiKey = $("#api-key-input").value.trim();
    localStorage.setItem("wf_api_key", state.apiKey);
    $("#settings-modal").hidden = true;
    $("#setup-notice").hidden = !!state.apiKey;
    if (state.apiKey && state.current) openShow(state.current.promo, state.current.show);
  }

  // ---------- init ----------

  function init() {
    renderSidebar();

    $("#settings-btn").addEventListener("click", openSettings);
    $("#setup-open-settings").addEventListener("click", openSettings);
    $("#settings-save").addEventListener("click", saveSettings);
    $("#settings-close").addEventListener("click", () => ($("#settings-modal").hidden = true));

    $("#player-close").addEventListener("click", closePlayer);
    $("#player-next").addEventListener("click", playNextUnwatched);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#player-modal").hidden) closePlayer();
    });

    $("#sort-select").addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderGrid();
    });
    $("#long-only").addEventListener("change", (e) => {
      state.longOnly = e.target.checked;
      if (state.current) openShow(state.current.promo, state.current.show);
    });
    $("#hide-watched").addEventListener("change", (e) => {
      state.hideWatched = e.target.checked;
      renderGrid();
    });
    $("#load-more").addEventListener("click", () => loadMore());
    $("#menu-btn").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));

    if (!state.apiKey) showSetupNotice();

    // PWA: works only over https (e.g. GitHub Pages), skipped on file://
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  // Console/debug hook
  window.__wf = { parseTitleDate, parseEpisodeNumber, sortVideos, state };
})();
