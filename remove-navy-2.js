const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;

  // Replace TSX conditions using Navy
  newContent = newContent.replace(/\|\|\s*theme\s*===\s*["']navy["']/g, '');
  newContent = newContent.replace(/\|\|\s*resolvedTheme\s*===\s*["']navy["']/g, '');
  newContent = newContent.replace(/resolvedTheme\s*===\s*["']navy["']\s*\|\|/g, '');
  newContent = newContent.replace(/theme\s*===\s*["']navy["']\s*\?\s*["'][^"']*["']\s*:\s*/g, '');
  newContent = newContent.replace(/\(\s*resolvedTheme\s*===\s*["']navy["']\s*\?\s*["'][^"']*["']\s*:\s*/g, '(');
  
  // Custom theme types inside arrays or css variant strings
  newContent = newContent.replace(/,\s*\[data-theme=navy\]/g, '');
  newContent = newContent.replace(/,\s*\[data-theme=navy\]\s*\*/g, '');

  if (content !== newContent) {
    fs.writeFileSync(f, newContent, 'utf8');
    console.log('Updated again', f);
  }
});
