import express from "express";
import fetch from "node-fetch";
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
    const reposRes = await fetch(`https://api.github.com/users/${USER}/repos`);
    const repos = await reposRes.json();

    const totalLangs = {};

    for (const repo of repos) {
      const langRes = await fetch(repo.languages_url);
      const data = await langRes.json();

      for (const lang in data) {
        totalLangs[lang] = (totalLangs[lang] || 0) + data[lang];
      }
    }

    const totalBytes = Object.values(totalLangs).reduce((a, b) => a + b, 0);

    const sorted = Object.entries(totalLangs)
      .map(([lang, value]) => ({
        lang,
        percent: ((value / totalBytes) * 100)
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);

    let bars = "";
    let y = 50;

    sorted.forEach(item => {
      const width = item.percent * 2.5;
      const color = colors[item.lang] || colors.default;

      bars += `
        <text x="20" y="${y}" fill="#e2e8f0" font-size="13">
          ${item.lang} (${item.percent.toFixed(1)}%)
        </text>
        <rect x="20" y="${y + 5}" width="${width}" height="10" fill="${color}" rx="5"/>
      `;
      y += 35;
    });

    const svg = `
    <svg width="420" height="${y}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { fill: #38bdf8; font-size: 18px; font-weight: bold; }
      </style>

      <rect width="100%" height="100%" fill="#0f172a" rx="12"/>

      <text x="20" y="30" class="title">
        Top Languages
      </text>

      ${bars}
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);

  } catch (error) {
    res.status(500).send("Error en languages");
  }
});

app.listen(3000, () => console.log("Servidor corriendo 🚀"));