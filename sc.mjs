import fs from 'fs';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch }
});

const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
const username = owner;

function replaceSection(content, start, end, replacement) {
  const re = new RegExp(
    `(<!-- ${start} -->)[\\s\\S]*?(<!-- ${end} -->)`,
    'm'
  );
  return content.replace(re, `$1\n${replacement}\n$2`);
}

async function main() {
  // ambil repos user
  const { data: repos } = await octokit.repos.listForUser({
    username,
    per_page: 100
  });

  // === Languages Used ===
  const langCount = {};
  repos.forEach(r => {
    const lang = r.language || 'Unknown';
    langCount[lang] = (langCount[lang] || 0) + 1;
  });
  const total = repos.length;
  const skills = Object.entries(langCount)
    .filter(([lang]) => lang !== 'Unknown')
    .map(([lang, cnt]) => ({
      name: lang,
      pct: Math.round((cnt / total) * 100)
    }))
    .sort((a, b) => b.pct - a.pct);
  const skillsMd = [
    '### Languages Progamming Used',
    '',
    '| Language | Usage |',
    '|---|---|',
    ...skills.map(s =>
      `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.pct}%25-brightgreen) |`
    )
  ].join('\n');

  // === GitHub Highlights ===
  const ghStatsMd = [
    '### GitHub Highlights',
    '',
    '<div align="center">',
    `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />`,
    `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />`,
    '</div>'
  ].join('\n');

  // === Popular Projects (cards) ===
  const popular = repos.filter(r => r.stargazers_count > 0 || r.has_packages);
  const cardsHtml = popular.map(r => `
  <div style="
    border:1px solid #ddd;
    border-radius:8px;
    padding:1em;
    width:200px;
    margin:0.5em;
    text-align:center;
    box-shadow:0 2px 4px rgba(0,0,0,0.1);
    ">
    <a href="${r.html_url}" style="text-decoration:none; color:inherit;">
      <img src="${r.owner.avatar_url}" width="100" alt="${r.name} logo" />
      <h4 style="margin:0.5em 0 0.3em;">${r.name}</h4>
    </a>
    <p style="margin:0.2em 0;">
      ⭐&nbsp;${r.stargazers_count}<br/>
      ${r.has_packages ? '📦 Package Available' : ''}
    </p>
  </div>
  `).join('\n');

  const projectsMd = [
    '### Popular Projects',
    '',
    `<div style="display:flex; flex-wrap:wrap; justify-content:flex-start;">`,
    cardsHtml,
    '</div>'
  ].join('\n');

  // === All Repositories ===
  const repoListMd = [
    '### All Repositories',
    '',
    ...repos.map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`)
  ].join('\n');

  // baca, replace, dan tulis kembali
  let readme = fs.readFileSync('README.md', 'utf8');
  readme = replaceSection(readme, 'SKILLS-START', 'SKILLS-END', skillsMd);
  readme = replaceSection(readme, 'GHSTATS-START', 'GHSTATS-END', ghStatsMd);
  readme = replaceSection(readme, 'PROJECTS-START', 'PROJECTS-END', projectsMd);
  readme = replaceSection(readme, 'REPO-START', 'REPO-END', repoListMd);
  fs.writeFileSync('README.md', readme, 'utf8');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
