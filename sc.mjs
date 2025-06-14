import fs from 'fs';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

// Beri tahu Octokit untuk pakai fetch ini
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch }
});
const username = process.env.GITHUB_ACTOR;

async function main() {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });

  // 1) Tabel skills
  const skills = JSON.parse(fs.readFileSync('scripts/skills.json', 'utf8'));
  const skillTable = [
    '| Skill | Level |',
    '|---|---|',
    ...skills.map(s =>
      `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.level}%25-${s.color}) |`
    )
  ].join('\n');

  // 2) GitHub Stats
  const ghStats = [
    '<div align="center">',
    `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />`,
    `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />`,
    '</div>'
  ].join('\n');

  // 3) Project cards
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

  // 4) Repo list
  const repoList = repos.map(r =>
    `- [${r.name}](${r.html_url}) — ${r.description || ''}`
  ).join('\n');

  // 5) Isi template
  let tpl = fs.readFileSync('README.tpl.md', 'utf8');
  tpl = tpl.replace('<!-- SKILLS_TABLE -->', skillTable);
  tpl = tpl.replace('<!-- GH_STATS -->', ghStats);
  tpl = tpl.replace('<!-- PROJECT_CARDS -->', projectCards);
  tpl = tpl.replace('<!-- REPO_LIST -->', repoList);

  // 6) Tulis README.md
  fs.writeFileSync('README.md', tpl, 'utf8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
