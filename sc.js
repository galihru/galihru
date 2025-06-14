const fs = require('fs');
const { Octokit } = require('@octokit/rest');
(async () => {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const username = process.env.GITHUB_ACTOR;
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });

  // Generate SKILLS_TABLE (bisa manual atau via file skills.json)
  const skills = require('../skills.json');
  const skillTable = skills.map(s => `| ${s.name} | ![${s.name}](https://img.shields.io/badge/${encodeURIComponent(s.name)}-${s.level}%25-${s.color}) |`).join("
");

  // Generate project cards: filter repos with stars>0 or packages
  const popular = repos.filter(r => r.stargazers_count > 0);
  const cards = popular.map(r => `<td align=\"center\">
<a href=\"${r.html_url}\">
<img src=\"${r.owner.avatar_url}\" width=\"120\"/>
<h3>${r.name}</h3>
</a>
⭐️ **${r.stargazers_count}** stars<br>
</td>`).join("
");

  // Generate list of all repos
  const list = repos.map(r => `- [${r.name}](${r.html_url}) — ${r.description || ''}`).join("
");

  let template = fs.readFileSync('README.tpl.md', 'utf8');
  template = template.replace('<!-- SKILLS_TABLE -->', `| Skill | Level |
|---|---|
${skillTable}`);
  template = template.replace('<!-- GH_STATS -->', `<div align=\"center\">...stats widget...</div>`);
  template = template.replace('<!-- PROJECT_CARDS -->', `<table><tr>
${cards}
</tr></table>`);
  template = template.replace('<!-- REPO_LIST -->', list);
  fs.writeFileSync('README.md', template);
})();
