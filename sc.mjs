import fs from 'fs';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch }
});

const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
const username = owner;

async function main() {
  // 1) Ambil daftar repositori publik user
  const { data: repos } = await octokit.repos.listForUser({
    username,
    per_page: 100
  });

  // 2) Hitung distribusi bahasa utama
  const langCount = {};
  repos.forEach(r => {
    const lang = r.language || 'Unknown';
    langCount[lang] = (langCount[lang] || 0) + 1;
  });
  const total = repos.length;
  // buat array [ {name, pct} ]
  const skills = Object.entries(langCount)
    .filter(([lang]) => lang !== 'Unknown')
    .map(([lang, cnt]) => ({
      name: lang,
      pct: Math.round((cnt / total) * 100)
    }))
    .sort((a, b) => b.pct - a.pct);

  // 3) Bangun markdown badge untuk tiap bahasa
  const skillTable = [
    '| Language | Usage |',
    '|---|---|',
    ...skills.map(s =>
      `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.pct}%25-brightgreen) |`
    )
  ].join('\n');

  // 4) GitHub Stats widget
  const ghStats = [
    '<div align="center">',
    `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />`,
    `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />`,
    '</div>'
  ].join('\n');

  // 5) Project cards (star > 0 atau punya package)
  const popular = repos.filter(r => r.stargazers_count > 0 || r.has_packages);
  const cards = popular.map(r => [
      `<td align="center">`,
      `  <a href="${r.html_url}">`,
      `    <img src="${r.owner.avatar_url}" width="120" />`,
      `    <h3>${r.name}</h3>`,
      `  </a>`,
      `  ⭐️ **${r.stargazers_count}**`,
      (r.has_packages ? `<br/>📦 Package Available` : ''),
      `</td>`
    ].join('\n')
  ).join('\n');
  const projectCards = `<table>\n<tr>\n${cards}\n</tr>\n</table>`;

  // 6) Daftar semua repo
  const repoList = repos
    .map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`)
    .join('\n');

  // 7) Baca template dan isi placeholder
  let tpl = fs.readFileSync('README.tpl.md', 'utf8');
  tpl = tpl.replace('<!-- SKILLS_TABLE -->', skillTable);
  tpl = tpl.replace('<!-- GH_STATS -->', ghStats);
  tpl = tpl.replace('<!-- PROJECT_CARDS -->', projectCards);
  tpl = tpl.replace('<!-- REPO_LIST -->', repoList);

  // 8) Tulis output ke README.md
  fs.writeFileSync('README.md', tpl, 'utf8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
