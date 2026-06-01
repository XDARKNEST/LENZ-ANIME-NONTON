async function PageSchedule({params}){
  const app = document.getElementById("app");
  const day = params.day || "senin";
  app.innerHTML = `<div class="state"><div class="emoji">⏳</div><h3>Memuat jadwal ${day}...</h3></div>`;
  
  try{
    const response = await LenzAPI.schedule(day);
    
    // DEBUG: Cek apa yang sebenarnya diterima dari API
    console.log("Respon API Schedule:", response);

    // LOGIKA EKTRAKSI DATA YANG FLEKSIBEL
    // Kita cek apakah data ada di response.data atau langsung di response
    const rootData = response.data || response;
    
    // Pastikan kita mengambil array berdasarkan hari yang benar
    const scheduleList = rootData[day.toLowerCase()] || [];

    if(scheduleList.length === 0){
      app.innerHTML = `<div class="state"><h3>Belum Ada Data</h3><p>Belum ada jadwal untuk ${day}.</p></div>`;
      return;
    }

    // Render HTML (Sesuaikan dengan class CSS kamu)
    app.innerHTML = `
      <section class="section">
        <div class="section-head"><h2>Jadwal Anime - ${day.charAt(0).toUpperCase() + day.slice(1)}</h2></div>
        <div class="anime-list">
          ${scheduleList.map(anime => `
            <a href="#/anime/${anime.slug || anime.endpoint}" class="anime-card">
              <img src="${anime.thumb || anime.poster}" loading="lazy">
              <h3>${anime.title}</h3>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  } catch(err) {
    app.innerHTML = `<div class="state"><h3>Error</h3><p>Gagal memuat jadwal.</p></div>`;
    console.error(err);
  }
}
