const fs = require('fs');
const { Octokit } = require('@octokit/rest');

(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const username = process.env.GITHUB_ACTOR;
  // ambil max 100 repo
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });

  // 1. Generate table skills
  const skills = JSON.parse(fs.readFileSync('scripts/skills.json', 'utf8'));
  const skillTableLines = [
    '| Skill | Level |',
    '|---|---|',
    ...skills.map(s =>
      `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.level}%25-${s.color}) |`
    )
  ];
  const skillTable = skillTableLines.join('\n');  // pakai '\n' bukan literal enter

  // 2. Generate GitHub Stats widget
  const ghStats = [
    '<div align="center">',
    `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />`,
    `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />`,
    '</div>'
  ].join('\n');

  // 3. Generate project cards (star>0 atau punya packages)
  const popular = repos.filter(r => r.stargazers_count > 0 || r.has_packages);
  const cardLines = popular.map(r => [
      `  <td align="center">`,
      `    <a href="${r.html_url}">`,
      `      <img src="${r.owner.avatar_url}" width="120" />`,
      `      <h3>${r.name}</h3>`,
      `    </a>`,
      `    ⭐️ **${r.stargazers_count}**<br/>`,
      (r.has_packages ? `    📦 Package Available<br/>` : ''),
      `  </td>`
    ].join('\n')
  );
  const cardsTable = `<table>\n<tr>\n${cardLines.join('\n')}\n</tr>\n</table>`;

  // 4. Generate repo list
  const repoList = repos
    .map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`)
    .join('\n');

  // 5. Baca template dan replace placeholders
  let tpl = fs.readFileSync('README.tpl.md', 'utf8');
  tpl = tpl.replace('<!-- SKILLS_TABLE -->', skillTable);
  tpl = tpl.replace('<!-- GH_STATS -->', ghStats);
  tpl = tpl.replace('<!-- PROJECT_CARDS -->', cardsTable);
  tpl = tpl.replace('<!-- REPO_LIST -->', repoList);

  // 6. Tulis README.md
  fs.writeFileSync('README.md', tpl, 'utf8');
})();
