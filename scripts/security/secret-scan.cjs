const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const files = [
  ...new Set(
    execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard', '-z'], { encoding: 'utf8' })
      .split('\0')
      .filter(Boolean),
  ),
];
const rules = [
  ['supabase-secret', /sb_secret_[A-Za-z0-9_-]{12,}/g],
  ['supabase-access-token', /sbp_[A-Za-z0-9]{30,}/g],
  ['resend-token', /\bre_[A-Za-z0-9_-]{25,}\b/g],
  ['github-token', /(?:github_pat_[A-Za-z0-9_]{25,}|ghp_[A-Za-z0-9]{30,})/g],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
const findings = [];
let scanned = 0;
for (const file of files) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString('utf8');
  scanned++;
  for (const [rule, regex] of rules) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex))
      findings.push({ file, rule, line: text.slice(0, match.index).split('\n').length });
  }
  for (const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      if (JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString()).role === 'service_role')
        findings.push({
          file,
          rule: 'service-role-jwt',
          line: text.slice(0, match.index).split('\n').length,
        });
    } catch {
      /* Non-token fixtures are not credentials. */
    }
  }
}
// Never print matching values, even when a finding blocks commit.
console.log(JSON.stringify({ scanned_text_files: scanned, findings }, null, 2));
if (findings.length) process.exitCode = 1;
