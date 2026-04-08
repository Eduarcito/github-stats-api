import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const USER = "Eduarcito";

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.get("/stats", async (req, res) => {
  try {
    const userRes = await fetch(`https://api.github.com/users/${USER}`);
    const user = await userRes.json();

    const svg = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { fill: #70a5fd; font-size: 18px; font-weight: bold; }
        .text { fill: #ffffff; font-size: 14px; }
      </style>

      <rect width="100%" height="100%" fill="#1a1b27" rx="10"/>

      <text x="20" y="40" class="title">${user.name}</text>
      <text x="20" y="80" class="text">Repos: ${user.public_repos}</text>
      <text x="20" y="110" class="text">Followers: ${user.followers}</text>
      <text x="20" y="140" class="text">Following: ${user.following}</text>
    </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);

  } catch (error) {
    res.status(500).send("Error");
  }
});

app.listen(3000, () => console.log("Servidor corriendo"));