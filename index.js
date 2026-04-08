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

    if (!totalBytes) {
      return res.send(`
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#0f172a" rx="12"/>
          <text x="50%" y="50%" fill="#e2e8f0" text-anchor="middle">
            No data
          </text>
        </svg>
      `);
    }

    const sorted = Object.entries(totalLangs)
      .map(([lang, value]) => ({
        lang,
        percent: (value / totalBytes) * 100
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);

    const colorsList = [
      "#38bdf8",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#a78bfa"
    ];

    let radius = 70;
    let circumference = 2 * Math.PI * radius;
    let offset = 0;

    let circles = "";
    let legend = "";
    let yLegend = 30;

    sorted.forEach((item, index) => {
      const percent = item.percent;
      const dash = (percent / 100) * circumference;
      const color = colorsList[index];

      circles += `
        <circle
          cx="100"
          cy="100"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="14"
          stroke-dasharray="${dash} ${circumference}"
          stroke-dashoffset="${-offset}"
          stroke-linecap="round"
        >
          <animate attributeName="stroke-dasharray"
            from="0 ${circumference}"
            to="${dash} ${circumference}"
            dur="1s"
            fill="freeze"/>
        </circle>
      `;

      offset += dash;

      legend += `
        <text x="200" y="${yLegend}" fill="#e2e8f0" font-size="13">
          ${item.lang} (${percent.toFixed(1)}%)
        </text>
      `;

      yLegend += 25;
    });

 const svg = `
<svg width="400" height="220" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f172a" rx="12"/>

  <!-- fondo círculo -->
  <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" stroke-width="14"/>

  ${sorted.map((item, index) => {
    const percent = item.percent || 0;
    const dash = (percent / 100) * circumference;
    const color = colorsList[index];
    
    const currentOffset = offset;
    offset += dash;

    return `
      <circle
        cx="100"
        cy="100"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="14"
        stroke-dasharray="${dash} ${circumference}"
        stroke-dashoffset="${-currentOffset}"
        stroke-linecap="round"
        transform="rotate(-90 100 100)"
      />
    `;
  }).join("")}

  <!-- centro -->
  <circle cx="100" cy="100" r="45" fill="#0f172a"/>

  <text x="100" y="105" text-anchor="middle" fill="#38bdf8" font-size="14">
    LANGS
  </text>

  <!-- leyenda -->
  ${sorted.map((item, i) => `
    <text x="200" y="${30 + (i * 25)}" fill="#e2e8f0" font-size="13">
      ${item.lang} (${item.percent.toFixed(1)}%)
    </text>
  `).join("")}

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