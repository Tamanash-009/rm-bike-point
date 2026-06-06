const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Calculate relative path to src/lib/firebase
  const fileDir = path.dirname(file);
  let relativePath = path.relative(fileDir, path.join(__dirname, 'src', 'lib', 'firebase'));
  
  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  // Replace windows slashes
  relativePath = relativePath.replace(/\\/g, '/');

  let changed = false;
  
  // Replace firebase/firestore
  if (content.includes("'firebase/firestore'") || content.includes('"firebase/firestore"')) {
    content = content.replace(/['"]firebase\/firestore['"]/g, `'${relativePath}'`);
    changed = true;
  }
  
  // Replace firebase/storage
  if (content.includes("'firebase/storage'") || content.includes('"firebase/storage"')) {
    content = content.replace(/['"]firebase\/storage['"]/g, `'${relativePath}'`);
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated imports in ${file}`);
  }
});
