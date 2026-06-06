import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src');

const replaceInFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/bg-\[\#1A1A1A\]/g, 'bg-card-bg')
    .replace(/bg-\[\#1E1E1E\]/g, 'bg-card-bg')
    .replace(/bg-\[\#0D0D0D\]/g, 'bg-bg-primary')
    .replace(/bg-\[\#121212\]/g, 'bg-bg-primary')
    .replace(/bg-\[\#0B0B0B\]/g, 'bg-bg-primary')
    .replace(/bg-\[\#0A0A0A\]/g, 'bg-bg-primary')
    .replace(/border-white\/5/g, 'border-text-primary/5')
    .replace(/border-white\/10/g, 'border-text-primary/10')
    .replace(/border-white\/20/g, 'border-text-primary/20');
    
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  }
};

walkSync(directoryPath);
console.log('Refactoring complete.');
