import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const USER = "Eduarcito";

/* 🎨 colores por lenguaje */
const colors = {
  JavaScript: "#f1e05a",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  default: "#38bdf8"
};

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

/* =========================
   📊 STATS MODERNO
========================= */
app.get("/stats", async (req, res) => {
  try {
    const userRes = await fetch(`https://api.github.com/users/${USER}`);
    const user = await userRes.json();

    const svg = `
    <svg width="420" height="180" xmlns="http://www.w3.org/2000/svg">
      <style>
        .card { fill: #0f172a; }
        .title { fill: #38bdf8; font-size: 20px; font-weight: bold; }
        .text { fill: #e2e8f0; font-size: 14px; }
        .box { fill: #1e293b; rx: 8; }
      </style>

      <rect width="100%" height="100%" class="card" rx="12"/>

      <text x="20" y="40" class="title">${user.name}</text>

      <rect x="20" y="60" width="180" height="40" class="box"/>
      <text x="30" y="85" class="text">Repos: ${user.public_repos}</text>

      <rect x="220" y="60" width="180" height="40" class="box"/>
      <text x="230" y="85" class="text">Followers: ${user.followers}</text>

      <rect x="20" y="110" width="180" height="40" class="box"/>
      <text x="30" y="135" class="text">Following: ${user.following}</text>

      <rect x="220" y="110" width="180" height="40" class="box"/>
      <text x="230" y="135" class="text">@${user.login}</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);

  } catch (error) {
    res.status(500).send("Error en stats");
  }
});

/* =========================
   🧠 LENGUAJES CON %
========================= */
app.get("/languages", async (req, res) => {
  try {
    let page = 1;
    let repos = [];

    // 🔄 Obtener todos los repos
    while (true) {
      const reposRes = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
          }
        }
      );

      const data = await reposRes.json();

      if (!Array.isArray(data) || data.length === 0) break;

      repos = repos.concat(data);
      page++;
    }

    const totalLangs = {};

    // 🔥 Obtener lenguajes por repo
    await Promise.all(
      repos.map(async (repo) => {
        if (!repo.languages_url) return;

        try {
          const langRes = await fetch(repo.languages_url, {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
            }
          });

          const data = await langRes.json();

          if (!data || data.message) return;
          if (!Object.keys(data).length) return;

          for (const lang in data) {
            totalLangs[lang] = (totalLangs[lang] || 0) + data[lang];
          }
        } catch {}
      })
    );

    const totalBytes = Object.values(totalLangs).reduce((a, b) => a + b, 0);

    // 🚨 fallback
    if (!totalBytes) {
      return res.send(`
        <svg width="500" height="120" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#0f172a" rx="10"/>
          <text x="20" y="70" fill="#e2e8f0">
            No language data available
          </text>
        </svg>
      `);
    }

    // 🔥 Top lenguajes
    const sorted = Object.entries(totalLangs)
      .map(([lang, value]) => ({
        lang,
        percent: (value / totalBytes) * 100
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);

    // 🎨 Colores tipo GitHub
    const colors = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Python: "#3572A5",
      Java: "#b07219",
      HTML: "#e34c26",
      CSS: "#563d7c",
      default: "#38bdf8"
    };

    // 🔥 Barra horizontal (tipo GitHub)
    let offset = 0;
    let segments = "";

    sorted.forEach((item) => {
      const width = item.percent * 5; // escala
      const color = colors[item.lang] || colors.default;

      segments += `
        <rect
          x="${offset}"
          y="0"
          width="${width}"
          height="12"
          fill="${color}"
        />
      `;

      offset += width;
    });

    // 🔥 Leyenda
    let legend = "";
    let y = 40;

    sorted.forEach((item) => {
      const color = colors[item.lang] || colors.default;

      legend += `
        <circle cx="20" cy="${y - 5}" r="5" fill="${color}" />
        <text x="35" y="${y}" fill="#e2e8f0" font-size="13">
          ${item.lang} (${item.percent.toFixed(1)}%)
        </text>
      `;

      y += 25;
    });

    const svg = `
    <svg width="500" height="${y}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0f172a" rx="10"/>

      <!-- barra -->
      <g transform="translate(20,20)">
        ${segments}
      </g>

      <!-- leyenda -->
      ${legend}
    </svg>
    `;

    res.setHeader("Cache-Control", "s-maxage=3600");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error en languages");
  }
});
app.listen(3000, () => console.log("Servidor corriendo 🚀"));