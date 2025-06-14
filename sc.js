const fs = require('fs');
const { Octokit } = require('@octokit/rest');

(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const username = process.env.GITHUB_ACTOR;
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });

  // 1. Generate table skills
  const skills = JSON.parse(fs.readFileSync('scripts/skills.json', 'utf8'));
  const skillTable = [
    '| Skill | Level |',
    '|---|---|',
    ...skills.map(s => `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.level}%25-${s.color}) |`)
  ].join('
');

  // 2. Generate GitHub Stats widget
  const ghStats = `<div align="center">
` +
                  `  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=dark" />
` +
                  `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark" />
` +
                  `</div>`;

  // 3. Generate project cards
  const popular = repos.filter(r => r.stargazers_count > 0 || r.package_registry);  
  const cards = popular.map(r => `  <td align=\"center\">
` +
    `    <a href=\"${r.html_url}\">
` +
    `      <img src=\"${r.owner.avatar_url}\" width=\"120\"/>
` +
    `      <h3>${r.name}</h3>
` +
    `    </a>
` +
    `    ⭐️ **${r.stargazers_count}**<br/>` +
    (r.package_registry ? `📦 Package Available` : ``) +
    `
  </td>`
  ).join('
');

  // 4. Generate repo list
  const repoList = repos.map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`).join('
');

  // 5. Read template and replace
  let tpl = fs.readFileSync('README.tpl.md', 'utf8');
  tpl = tpl.replace('<!-- SKILLS_TABLE -->', skillTable);
  tpl = tpl.replace('<!-- GH_STATS -->', ghStats);
  tpl = tpl.replace('<!-- PROJECT_CARDS -->', `<table><tr>
${cards}
</tr></table>`);
  tpl = tpl.replace('<!-- REPO_LIST -->', repoList);

  fs.writeFileSync('README.md', tpl);
})();
