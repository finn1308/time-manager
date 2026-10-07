import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.tsx') || filepath.endsWith('.ts'))) {
      callback(filepath);
    }
  });
}

const srcDir = path.join(process.cwd(), 'src');

walkSync(srcDir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('alert(')) {
    // Determine if we need to add the import
    if (!content.includes('import { toast } from "sonner";')) {
      // Find the last import
      const importRegex = /^import\s+.*?;?\s*$/gm;
      let lastImportIndex = -1;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      if (lastImportIndex !== -1) {
        content = content.slice(0, lastImportIndex) + '\nimport { toast } from "sonner";' + content.slice(lastImportIndex);
      } else {
        content = 'import { toast } from "sonner";\n' + content;
      }
    }

    // Replace alert(...) with toast.error or toast.success
    content = content.replace(/alert\((.*?)\)/g, (match, innerText) => {
      if (innerText.toLowerCase().includes('"lỗi') || innerText.toLowerCase().includes("'lỗi") || innerText.toLowerCase().includes('lỗi') || innerText.toLowerCase().includes('không thể') || innerText.toLowerCase().includes('thất bại')) {
        return `toast.error(${innerText})`;
      } else if (innerText.toLowerCase().includes('thành công') || innerText.toLowerCase().includes('success')) {
        return `toast.success(${innerText})`;
      } else {
        return `toast(${innerText})`;
      }
    });

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
  }
});
