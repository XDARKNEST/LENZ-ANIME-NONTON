(function(){
  const { API_BASE, WBN_BASE, JIKAN_API, CACHE, REQUEST_TIMEOUT } = window.CONFIG;

  async function request(url, ttl, cacheKey){
    if(cacheKey){
      const cached = window.LenzCache.get(cacheKey);
      if(cached) return cached;
    }
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), REQUEST_TIMEOUT);
    try{
      const res = await fetch(url,{signal:controller.signal});
      if(!res.ok){ const err = new Error("HTTP "+res.status); err.status = res.status; throw err; }
      const data = await res.json();
      if(cacheKey && ttl) window.LenzCache.set(cacheKey,data,ttl);
      return data;
    } finally { clearTimeout(timer); }
  }

  const API = {
    // --- SMART FALLBACK: Coba WBN dulu, kalau gagal ke OTD ---
    async episode(slug) {
      try {
        // Coba WBN
        const wbnData = await request(`${WBN_BASE}/episode/${slug}`, CACHE.EPISODE, `ep_${slug}`);
        if (wbnData && wbnData.data) return wbnData;
      } catch (e) {
        console.warn("WBN API gagal, fallback ke OTD untuk episode:", slug);
      }
      // Fallback ke OTD
      return request(`${API_BASE}/episode/${slug}`, CACHE.EPISODE, `ep_${slug}`);
    },

    async anime(slug) {
      try {
        const wbnData = await request(`${WBN_BASE}/anime/${slug}`, CACHE.ANIME, `anime_${slug}`);
        if (wbnData && wbnData.data) return wbnData;
      } catch (e) {
        console.warn("WBN API gagal, fallback ke OTD untuk anime:", slug);
      }
      return request(`${API_BASE}/anime/${slug}`, CACHE.ANIME, `anime_${slug}`);
    },
    // --------------------------------------------------------

    home: ()         => request(`${API_BASE}/home`, CACHE.HOME, "home"),
    ongoing: (p=1)   => request(`${API_BASE}/ongoing?page=${p}`, CACHE.ONGOING, `ongoing_${p}`),
    completed: (p=1) => request(`${API_BASE}/completed?page=${p}`, CACHE.COMPLETED, `completed_${p}`),
    batch: (slug)    => request(`${API_BASE}/batch/${slug}`, CACHE.BATCH, `batch_${slug}`),
    schedule: (day)  => request(`${API_BASE}/schedule?day=${encodeURIComponent(day)}`, CACHE.SCHEDULE, `sch_${day}`),
    genres: ()       => request(`${API_BASE}/genres`, CACHE.GENRES, "genres"),
    genre: (g,p=1)   => request(`${API_BASE}/genres/${g}?page=${p}`, CACHE.GENRES, `genre_${g}_${p}`),
    search: (q)      => request(`${API_BASE}/search?q=${encodeURIComponent(q)}`, CACHE.SEARCH, `search_${q.toLowerCase()}`),
    list: ()         => request(`${API_BASE}/list`, CACHE.LIST, "list"),

    jikan: (title)   => request(`${JIKAN_API}/anime?q=${encodeURIComponent(title)}&limit=1`, CACHE.POSTER, `jikan_${title.toLowerCase()}`)
  };

  API.extractList = function(payload, ...keys){
    if(!payload) return [];
    if(Array.isArray(payload)) return payload;
    const root = payload.data || payload;
    for(const k of keys){
      if(root && Array.isArray(root[k])) return root[k];
    }
    if(root && typeof root === "object"){
      for(const v of Object.values(root)){
        if(Array.isArray(v)) return v;
      }
    }
    return [];
  };

  window.LenzAPI = API;
})();
