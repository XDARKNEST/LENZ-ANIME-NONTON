/* ========= Page: Episode (Streaming) ========= */
async function PageEpisode({params}){
  const app = document.getElementById("app");
  app.innerHTML = `<div class="state"><div class="emoji">⏳</div><h3>Memuat episode…</h3></div>`;
  try{
    const data = await LenzAPI.episode(params.slug);
    const e = data.data || data;
    const title = e.title || e.episode_title || params.slug;
    document.title = `${title} | LENZ ANIME NONTON`;

    // 1. ENGINE DEEP CRAWLER VIDEO
    function discoverStreams(obj) {
      let list = [];
      function scan(curr, key = "") {
        if (!curr) return;
        
        const kLower = key.toLowerCase();
        if (kLower.includes("download") || kLower.includes("episode") || kLower.includes("batch") || kLower.includes("meta")) {
          return;
        }
        
        if (typeof curr === "string") {
          if (curr.startsWith("http") || curr.startsWith("//") || curr.startsWith("<iframe")) {
            let url = curr;
            if (curr.startsWith("<iframe")) {
              const match = curr.match(/src=["']([^"']+)["']/);
              if (match) url = match[1];
            }
            const urlLower = url.toLowerCase();
            if (!urlLower.includes("/episode/") && !urlLower.includes("/anime/") && !urlLower.includes("localhost")) {
              if (!list.some(item => item.url === url)) {
                let cleanLabel = key.replace(/_/g, ' ').replace(/embeds/gi, '').trim();
                list.push({ name: cleanLabel || "Server Video", url: url });
              }
            }
          }
          return;
        }
        
        if (Array.isArray(curr)) {
          curr.forEach((item, idx) => {
            if (item && typeof item === "object") {
              let u = item.link || item.url || item.stream || item.embed || item.src;
              let n = item.quality || item.resolution || item.server || item.label || item.name || key;
              if (u && typeof u === "string") {
                let urlLower = u.toLowerCase();
                if (!urlLower.includes("/episode/") && !urlLower.includes("/anime/") && !urlLower.includes("localhost")) {
                  if (!list.some(el => el.url === u)) {
                    list.push({ name: String(n || "Server " + (idx + 1)), url: u });
                  }
                }
              } else {
                scan(item, key);
              }
            } else {
              scan(item, key);
            }
          });
          return;
        }
        
        if (typeof curr === "object") {
          for (let k in curr) {
            scan(curr[k], k);
          }
        }
      }
      scan(obj);
      return list;
    }

    const servers = discoverStreams(e);

    // 2. ENGINE DEFAULTSTREAMING CRAWLER
    let defaultIdx = 0;
    if (servers.length > 0) {
      const foundIdx = servers.findIndex(s => {
        const name = String(s.name || "").toLowerCase();
        const urlStr = String(s.url || "").toLowerCase();
        return name.includes("default") || name.includes("desustream") || urlStr.includes("desustream");
      });
      if (foundIdx !== -1) {
        defaultIdx = foundIdx;
      }
    }

    let defaultUrl = servers[defaultIdx] ? servers[defaultIdx].url : "";

    // ========================================================
    // FIX: EKSTRAKTOR SLUG ANTI-ZONK (UNTUK PREV/NEXT/ANIME)
    // ========================================================
    function cleanSlug(item) {
      if (!item) return "";
      // Jika berupa object, kupas property dalamnya. Jika string, gunakan langsung.
      let s = (typeof item === "object") ? (item.slug || item.endpoint || item.id || "") : String(item);
      
      // Bersihkan jika struktur data membawa path url lengkap (sisa slash)
      if (s.includes("/")) {
        const parts = s.split("/").filter(Boolean);
        s = parts[parts.length - 1] || s;
      }
      return s && s !== "[object Object]" ? s.trim() : "";
    }

    // Mengamankan penamaan key alternatif dari API agar tombol Prev aktif sempurna
    const prev = cleanSlug(e.previous_episode || e.prev || e.prev_episode || e.previous_slug || e.previous);
    const next = cleanSlug(e.next_episode || e.next || e.next_episode || e.next_slug);
    const animeSlug = cleanSlug(e.anime || e.anime_slug);
    
    // ========================================================
    // 3. ENGINE FILTRASI LIST EPISODE (ANTI-ZONK)
    // ========================================================
    let rawEpisodeList = [];
    try {
      rawEpisodeList = LenzAPI.extractList({data:e}, "episode_list", "episodes") || [];
    } catch(_) {}

    if (!Array.isArray(rawEpisodeList) || rawEpisodeList.length === 0) {
      function findEpArray(source) {
        for (let k in source) {
          if (Array.isArray(source[k]) && source[k].length > 0 && (k.toLowerCase().includes("episode") || k.toLowerCase().includes("list"))) {
            return source[k];
          }
          if (source[k] && typeof source[k] === "object") {
            let res = findEpArray(source[k]);
            if (res) return res;
          }
        }
        return [];
      }
      rawEpisodeList = findEpArray(e);
    }

    const validEpisodes = [];
    if (Array.isArray(rawEpisodeList)) {
      rawEpisodeList.forEach(ep => {
        if (!ep) return;
        
        let s = "";
        let n = "";
        
        if (typeof ep === "object") {
          s = ep.slug || ep.endpoint || ep.id || ep.url || "";
          n = ep.episode || ep.title || ep.number || ep.name || "";
        } else {
          s = String(ep);
          n = String(ep);
        }
        
        if (s.includes("/")) {
          const parts = s.split("/").filter(Boolean);
          s = parts[parts.length - 1] || s;
        }
        
        if (!n || String(n).trim() === "") {
          const matchNum = s.match(/(?:episode|ep|ep-|-)(\d+)/i) || s.match(/(\d+)/);
          n = matchNum ? matchNum[1] : s;
        }
        
        let displayLabel = String(n)
          .replace(/subtitle/gi, '')
          .replace(/indonesia/gi, '')
          .replace(/episode/gi, '')
          .replace(/sub/gi, '')
          .replace(/indo/gi, '')
          .trim();
          
        if (!displayLabel || displayLabel === "") {
          const fallbackNum = s.match(/(\d+)/);
          displayLabel = fallbackNum ? fallbackNum[1] : "Lihat";
        }
        
        if (s && s !== "[object Object]" && s.trim() !== "") {
          validEpisodes.push({ slug: s, label: displayLabel });
        }
      });
    }

    // Cek status penyimpanan fitur AI Enhance sebelum HTML di-render
    const isEnhanced = localStorage.getItem("lenz_enhance") === "1";

    app.innerHTML = `
      <section class="section">
        <div class="section-head"><h2>${LenzUI.escapeHTML(title)}</h2></div>
        <div class="player-wrap ${isEnhanced ? 'enhanced-mode' : ''}" id="player-wrap"></div>

        <div class="player-controls">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost" id="btn-prev" ${prev?'':'disabled'}>⏮ Prev</button>
            <button class="btn btn-ghost" id="btn-next" ${next?'':'disabled'}>Next ⏭</button>
            <label class="chip" style="cursor:pointer"><input type="checkbox" id="auto-next" style="margin-right:6px">Auto Next</label>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-enhance ${isEnhanced ? 'active' : ''}" id="btn-enhance">✨ AI Enhance</button>
            <button class="btn btn-ghost" id="btn-theater">🎭 Theater</button>
            <button class="btn btn-ghost" id="btn-pip">📺 PiP</button>
            <button class="btn btn-ghost" id="btn-fs">⛶ Fullscreen</button>
          </div>
        </div>

        ${servers.length ? `
        <div class="section-head"><h2>Pilih Server</h2></div>
        <div class="server-list">
          ${servers.map((s,i)=>`<button class="chip ${i===defaultIdx?'active':''}" data-url="${LenzUI.escapeHTML(s.url||'')}">${LenzUI.escapeHTML(s.name || ('Server '+(i+1)))}</button>`).join("")}
        </div>` : ""}

        ${animeSlug ? `<div style="padding:14px 16px"><a class="btn btn-ghost" href="#/anime/${encodeURIComponent(animeSlug)}">📄 Detail Anime</a></div>` : ""}

        ${validEpisodes.length ? `
        <div class="section-head"><h2>Episode Lain</h2></div>
        <div class="episode-list">
          ${validEpisodes.map(ep => `<a href="#/episode/${encodeURIComponent(ep.slug)}">Ep ${LenzUI.escapeHTML(ep.label)}</a>`).join("")}
        </div>` : ""}
      </section>
    `;

    const wrap = document.getElementById("player-wrap");
    LenzPlayer.render(wrap, defaultUrl);

    document.querySelectorAll(".server-list .chip").forEach(c=>{
      c.onclick = () => {
        document.querySelectorAll(".server-list .chip").forEach(x=>x.classList.remove("active"));
        c.classList.add("active");
        LenzPlayer.render(wrap, c.dataset.url);
      };
    });

    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");
    if(prev) prevBtn.onclick = () => location.hash = `#/episode/${encodeURIComponent(prev)}`;
    if(next) nextBtn.onclick = () => location.hash = `#/episode/${encodeURIComponent(next)}`;

    // Logika Tombol Jalur Pintas AI Enhance
    const enhanceBtn = document.getElementById("btn-enhance");
    enhanceBtn.onclick = () => {
      const isActive = wrap.classList.toggle("enhanced-mode");
      enhanceBtn.classList.toggle("active");
      localStorage.setItem("lenz_enhance", isActive ? "1" : "0");
    };

    document.getElementById("btn-theater").onclick = ()=>LenzPlayer.toggleTheater(wrap);
    document.getElementById("btn-pip").onclick = ()=>LenzPlayer.pip(wrap);
    document.getElementById("btn-fs").onclick = ()=>LenzPlayer.fullscreen(wrap);

    const autoNext = document.getElementById("auto-next");
    autoNext.checked = localStorage.getItem("lenz_autonext") === "1";
    autoNext.onchange = ()=> localStorage.setItem("lenz_autonext", autoNext.checked?"1":"0");
    const v = wrap.querySelector("video");
    if(v){
      v.addEventListener("ended",()=>{ if(autoNext.checked && next) location.hash = `#/episode/${encodeURIComponent(next)}`; });
    }
  }catch(err){ LenzError.show(err); }
}
