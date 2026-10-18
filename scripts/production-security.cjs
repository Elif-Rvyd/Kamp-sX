const fs = require('node:fs');
const path = require('node:path');
const { validateUrl } = require('./generate-environment.cjs');

class ProductionSecurityError extends Error {}

/** Keep Angular's hashed script policy and allow only the configured API origin. */
function secureProductionHtml(html, supabaseUrl) {
  const url = new URL(validateUrl(supabaseUrl));
  if (!/^(?:[a-z\d.-]+|\[[a-f\d:]+\])$/i.test(url.hostname))
    throw new ProductionSecurityError('Invalid API hostname for production security policy.');
  const socket = new URL(url.origin);
  socket.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const meta = /<meta\b[^>]*http-equiv\s*=\s*(["'])Content-Security-Policy\1[^>]*>/i;
  const match = html.match(meta);
  const content = match?.[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
  if (
    !content ||
    !content[2].includes("'strict-dynamic'") ||
    !/sha(?:256|384|512)-/.test(content[2]) ||
    content[2].includes('unsafe-eval')
  )
    throw new ProductionSecurityError('Production HTML must contain the strict Angular script policy.');
  const policy =
    content[2]
      .replace(/(?:^|;)\s*(?:connect-src|img-src|media-src|worker-src)\b[^;]*/gi, '')
      .replace(/;\s*$/, '') +
    `; connect-src 'self' ${url.origin} ${socket.origin}; img-src 'self' blob: data: ${url.origin}; media-src 'self' blob: ${url.origin}; worker-src 'self';`;
  return html.replace(meta, match[0].replace(content[0], `content="${policy}"`));
}

function secureProductionIndex(browserDirectory, supabaseUrl) {
  try {
    const target = path.join(browserDirectory, 'index.html');
    fs.writeFileSync(target, secureProductionHtml(fs.readFileSync(target, 'utf8'), supabaseUrl));
  } catch (error) {
    if (error instanceof ProductionSecurityError) throw error;
    throw new ProductionSecurityError('Could not secure production HTML.');
  }
}

module.exports = { ProductionSecurityError, secureProductionHtml, secureProductionIndex };
