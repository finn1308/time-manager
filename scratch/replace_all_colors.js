const fs = require('fs');
const path = require('path');

const mappings = [
  { regex: /text-\[#192e22\]\s+dark:text-\[#f0f7f2\]/g, replacement: 'text-[var(--text-ink)]' },
  { regex: /text-\[#526b5c\]\s+dark:text-\[#a3bda9\]/g, replacement: 'text-[var(--text-subtle)]' },
  { regex: /text-\[#73927d\]\s+dark:text-\[#8ba393\]/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /text-\[#2d6a4f\]\s+dark:text-\[#52b788\]/g, replacement: 'text-[var(--mint-dark)]' },
  { regex: /text-\[#1b4332\]\s+dark:text-\[#86e2a8\]/g, replacement: 'text-[var(--mint-dark)]' },
  
  { regex: /border-\[#dbe7dd\]\s+dark:border-\[#263d2e\]/g, replacement: 'border-[var(--border)]' },
  { regex: /border-\[#b7d8c3\]\s+dark:border-\[#2f523c\]/g, replacement: 'border-[var(--mint-soft)]' },
  { regex: /border-\[#dbe7dd\]\/70\s+dark:border-\[#263d2e\]/g, replacement: 'border-[var(--border)]' },
  { regex: /border-\[#dbe7dd\]\/80\s+dark:border-\[#263d2e\]/g, replacement: 'border-[var(--border)]' },
  { regex: /border-\[#dbe7dd\]\/60\s+dark:border-\[#263d2e\]/g, replacement: 'border-[var(--border)]' },
  
  { regex: /bg-white\s+dark:bg-\[#17261c\]/g, replacement: 'bg-[var(--bg-surface)]' },
  { regex: /bg-\[#f8fbf8\]\s+dark:bg-\[#142318\]/g, replacement: 'bg-[var(--bg-muted)]' },
  { regex: /bg-\[#f8fbf8\]\s+dark:bg-\[#132217\]/g, replacement: 'bg-[var(--bg-muted)]' },
  { regex: /bg-\[#fbfdfc\]\s+dark:bg-\[#142318\]\/60/g, replacement: 'bg-[var(--bg-muted)]' },
  { regex: /bg-\[#f8fbf8\]\s+dark:bg-\[#142318\]\/50/g, replacement: 'bg-[var(--bg-muted)]' },
  
  { regex: /bg-\[#d8ebe0\]\s+dark:bg-\[#1d3827\]/g, replacement: 'bg-[var(--mint-bg)]' },
  { regex: /bg-\[#eef5f0\]\s+dark:bg-\[#1d3024\]/g, replacement: 'bg-[var(--mint-bg)]' },
  { regex: /bg-\[#eef5f0\]\s+dark:bg-\[#263d2e\]/g, replacement: 'bg-[var(--mint-bg)]' },
  
  { regex: /hover:bg-\[#eef5f0\]\s+dark:hover:bg-\[#1d3024\]/g, replacement: 'hover:bg-[var(--mint-soft)]' },
  { regex: /hover:bg-\[#f4f8f5\]\s+dark:hover:bg-\[#142318\]/g, replacement: 'hover:bg-[var(--mint-soft)]' },
  { regex: /hover:bg-\[#eef5f0\]\s+dark:hover:bg-\[#1b3426\]/g, replacement: 'hover:bg-[var(--mint-soft)]' },
  
  { regex: /bg-\[#2d6a4f\]\s+hover:bg-\[#1b4332\]/g, replacement: 'bg-[var(--mint)] hover:bg-[var(--mint-dark)]' },
  { regex: /bg-\[#1b4332\]\s+hover:bg-\[#11291f\]/g, replacement: 'bg-[var(--mint-dark)] hover:bg-[var(--text-ink)]' },
  { regex: /bg-\[#2d6a4f\]\s+dark:bg-\[#52b788\]/g, replacement: 'bg-[var(--mint)]' },
  
  { regex: /bg-\[#d8ebe0\]\s+text-\[#1b4332\]\s+dark:bg-\[#1d3827\]\s+dark:text-\[#86e2a8\]/g, replacement: 'bg-[var(--mint-bg)] text-[var(--mint-dark)]' },
  
  { regex: /hover:border-\[#74a882\]/g, replacement: 'hover:border-[var(--mint-soft)]' },
  
  { regex: /text-\[#2d6a4f\]/g, replacement: 'text-[var(--mint-dark)]' },
  { regex: /bg-\[#2d6a4f\]/g, replacement: 'bg-[var(--mint)]' },
  { regex: /border-\[#2d6a4f\]/g, replacement: 'border-[var(--mint)]' },
  
  { regex: /text-\[#526b5c\]/g, replacement: 'text-[var(--text-subtle)]' },
  { regex: /text-\[#192e22\]/g, replacement: 'text-[var(--text-ink)]' },
  { regex: /text-\[#73927d\]/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /text-\[#1b4332\]/g, replacement: 'text-[var(--mint-dark)]' },
  
  { regex: /bg-\[#f8fbf8\]/g, replacement: 'bg-[var(--bg-muted)]' },
  { regex: /bg-\[#d8ebe0\]/g, replacement: 'bg-[var(--mint-bg)]' },
  { regex: /bg-\[#eef5f0\]/g, replacement: 'bg-[var(--mint-bg)]' },
  { regex: /bg-\[#f4f8f5\]/g, replacement: 'bg-[var(--mint-bg)]' },
  
  { regex: /hover:bg-\[#eef5f0\]/g, replacement: 'hover:bg-[var(--mint-soft)]' },
  { regex: /hover:bg-\[#f4f8f5\]/g, replacement: 'hover:bg-[var(--mint-soft)]' },
  { regex: /border-\[#dbe7dd\]/g, replacement: 'border-[var(--border)]' },
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { regex, replacement } of mappings) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir('src/app/(dashboard)');
processDir('src/components');

console.log('Replaced all hardcoded green colors successfully.');
