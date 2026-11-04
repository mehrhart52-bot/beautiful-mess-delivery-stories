// Conservative compatibility gate. Unknown formats require human review.
function compatibleVersion(before, after) {
  if (before === after) return true;
  const parse = value => /^(\d+)\.(\d+)\.(\d+)$/.exec(value || '')?.slice(1).map(Number);
  const a = parse(before), b = parse(after);
  return !!a && !!b && a[0] === b[0] && (a[0] !== 0 || a[1] === b[1]) &&
    (b[1] > a[1] || (b[1] === a[1] && b[2] >= a[2]));
}
function compatibleManifest(before, after) {
  const a = structuredClone(before), b = structuredClone(after);
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const old = a[field] || {}, next = b[field] || {};
    if (JSON.stringify(Object.keys(old).sort()) !== JSON.stringify(Object.keys(next).sort())) return false;
    for (const name of Object.keys(old)) {
      if (old[name] === next[name]) continue;
      const x = /^([~^]?)(\d+\.\d+\.\d+)$/.exec(old[name]);
      const y = /^([~^]?)(\d+\.\d+\.\d+)$/.exec(next[name]);
      if (!x || !y || x[1] !== y[1] || !compatibleVersion(x[2], y[2])) return false;
    }
    delete a[field]; delete b[field];
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
function compatibleLock(before, after) {
  if (before.lockfileVersion !== after.lockfileVersion || !before.packages || !after.packages) return false;
  for (const [path, pkg] of Object.entries(after.packages)) {
    if (!path) continue;
    const previous = before.packages[path];
    // Also hold transitive additions/removals, git dependencies and major bumps for review.
    if (!previous || !compatibleVersion(previous.version, pkg.version)) return false;
    if (JSON.stringify(previous) !== JSON.stringify(pkg)) {
      if (!/^https:\/\/registry\.npmjs\.org\//.test(pkg.resolved || '') || !pkg.integrity) return false;
    }
  }
  return Object.keys(before.packages).every(path => path in after.packages);
}
async function run({github, context, core}) {
  const repo = context.repo;
  const sha = context.payload.workflow_run.head_sha;
  const prs = await github.paginate(github.rest.pulls.list, {...repo, state: 'open', base: 'main', per_page: 100});
  for (const pr of prs) {
    if (pr.user.login !== 'dependabot[bot]' || pr.draft || pr.head.sha !== sha || pr.head.repo?.full_name !== `${repo.owner}/${repo.repo}`) continue;
    const files = await github.paginate(github.rest.pulls.listFiles, {...repo, pull_number: pr.number, per_page: 100});
    if (!files.length || files.some(f => !['package.json', 'package-lock.json'].includes(f.filename) || f.status !== 'modified')) continue;
    async function json(path, ref) {
      const {data} = await github.rest.repos.getContent({...repo, path, ref});
      if (!data.content || data.encoding !== 'base64') throw new Error('Unable to inspect dependency file');
      return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    }
    const [oldPackage, newPackage, oldLock, newLock] = await Promise.all([
      json('package.json', pr.base.sha), json('package.json', sha),
      json('package-lock.json', pr.base.sha), json('package-lock.json', sha),
    ]);
    if (!compatibleManifest(oldPackage, newPackage) || !compatibleLock(oldLock, newLock)) {
      core.info(`PR #${pr.number} requires review: outside conservative dependency compatibility rules.`);
      continue;
    }
    let passed = true;
    for (const workflow_id of ['validate.yml', 'code-security.yml']) {
      const {data} = await github.rest.actions.listWorkflowRuns({...repo, workflow_id, head_sha: sha, event: 'pull_request', per_page: 100});
      const latest = data.workflow_runs.sort((a,b) => b.id-a.id)[0];
      if (!latest || latest.status !== 'completed' || latest.conclusion !== 'success') passed = false;
    }
    if (!passed) { core.info(`PR #${pr.number}: waiting for both checks to succeed.`); continue; }
    const {data: current} = await github.rest.pulls.get({...repo, pull_number: pr.number});
    if (current.head.sha !== sha || current.base.sha !== pr.base.sha || current.state !== 'open') continue;
    // Require a branch that is not behind main, so tests cover the merge base.
    const {data: comparison} = await github.rest.repos.compareCommits({...repo, base: current.base.sha, head: sha});
    if (comparison.behind_by !== 0) { core.info('Branch needs updating against main before automatic merge.'); continue; }
    const {data: result} = await github.rest.pulls.merge({...repo, pull_number: pr.number, sha, merge_method: 'squash'});
    if (!result.merged) throw new Error(`PR #${pr.number} was not merged: ${result.message}`);
    core.info(`Merged compatible dependency PR #${pr.number} after build/audit and CodeQL passed.`);
  }
}
module.exports = {run, compatibleVersion, compatibleManifest, compatibleLock};
