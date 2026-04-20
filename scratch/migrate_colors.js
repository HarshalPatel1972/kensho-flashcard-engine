const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /text-slate-100/g, to: 'text-primary' },
  { from: /text-slate-200/g, to: 'text-primary' },
  { from: /text-slate-300/g, to: 'text-primary' },
  { from: /text-slate-400/g, to: 'text-secondary' },
  { from: /text-slate-500/g, to: 'text-secondary' },
  { from: /text-slate-600/g, to: 'text-secondary' },
  { from: /text-white/g, to: 'text-primary' },
  { from: /border-slate-800/g, to: 'border-border/50' },
  { from: /hover:bg-slate-800/g, to: 'hover:bg-surface' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const r of replacements) {
        if (r.from.test(content)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walk(path.join(process.cwd(), 'src'));
