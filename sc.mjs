import fs from 'fs';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch }
});
const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
const username = owner;

function replaceSection(content, startMarker, endMarker, newSection) {
  const pattern = new RegExp(
    `(<!-- ${startMarker} -->)[\\s\\S]*?(<!-- ${endMarker} -->)`,
    'm'
  );
  return content.replace(pattern, `$1\n${newSection}\n$2`);
}

async function main() {
  // 1) Ambil repos publik
  const { data: repos } = await octokit.repos.listForUser({
    username,
    per_page: 100
  });

  // 2) Languages Used
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
    '## 🛠️ Languages Used',
    '',
    '| Language | Usage |',
    '|---|---|',
    ...skills.map(s =>
      `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.pct}%25-brightgreen) |`
    )
  ].join('\n');

  // 3) GitHub Stats
  const ghStatsMd = [
    '## 🚀 GitHub Highlights',
    '',
    '<div align="center">',
    `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />`,
    `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />`,
    '</div>'
  ].join('\n');

  // 4) Popular Projects
  const popular = repos.filter(r => r.stargazers_count > 0 || r.has_packages);
  const projectsMd = [
    '## 📦 Popular Projects',
    '',
    '<table>',
    '<tr>',
    ...popular.map(r => [
      `<td align="center">`,
      `  <a href="${r.html_url}">`,
      `    <img src="${r.owner.avatar_url}" width="120" />`,
      `    <h3>${r.name}</h3>`,
      `  </a>`,
      `  ⭐️ **${r.stargazers_count}**`,
      (r.has_packages ? `<br/>📦 Package Available` : ''),
      `</td>`
    ].join('\n')),
    '</tr>',
    '</table>'
  ].join('\n');

  // 5) All Repositories
  const repoListMd = [
    '## 📁 All Repositories',
    '',
    ...repos.map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`)
  ].join('\n');

  // 6) Baca README.md, replace tiap section, dan tulis ulang
  let readme = fs.readFileSync('README.md', 'utf8');
  readme = replaceSection(readme, 'SKILLS-START', 'SKILLS-END', skillsMd);
  readme = replaceSection(readme, 'GHSTATS-START', 'GHSTATS-END', ghStatsMd);
  readme = replaceSection(readme, 'PROJECTS-START', 'PROJECTS-END', projectsMd);
  readme = replaceSection(readme, 'REPO-START', 'REPO-END', repoListMd);
  fs.writeFileSync('README.md', readme, 'utf8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
