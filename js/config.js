/* ========= LENZ Config — Konfigurasi Terpusat =========
 * Semua URL API dan setting global ada di sini.
 * Tidak boleh ada hardcode endpoint di file lain.
 */
window.CONFIG = {
  SITE_NAME: "LENZ ANIME NONTON",
  SHORT_NAME: "LENZ",
  TAGLINE: "Nonton Anime Lebih Mudah, Cepat, dan Nyaman",

  API_BASE: "https://shivraapi.my.id/otd",
  JIKAN_API: "https://api.jikan.moe/v4",

  PLACEHOLDER_IMAGE: "./assets/no-image.webp",

  // Durasi cache (ms)
  CACHE: {
    HOME: 300000,       // 5 menit
    ONGOING: 300000,
    COMPLETED: 300000,
    GENRES: 300000,
    SCHEDULE: 300000,
    ANIME: 600000,
    EPISODE: 300000,
    BATCH: 600000,
    SEARCH: 120000,
    LIST: 600000,
    POSTER: 86400000    // 24 jam
  },

  DEBOUNCE_SEARCH: 500,
  REQUEST_TIMEOUT: 15000
};
