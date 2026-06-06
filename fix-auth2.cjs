const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceAuth(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('auth.currentUser')) return;

  // Add import if not exists
  if (!content.includes('@clerk/clerk-react') && filePath.endsWith('.tsx')) {
    content = content.replace(/(import .* from ['"]react['"];?\n?)/, "$1import { useUser } from '@clerk/clerk-react';\n");
  }

  // Find component function definition to insert const { user } = useUser();
  // We'll look for `export default function Name() {` or `const Name = () => {`
  const compMatch = content.match(/(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/);
  if (compMatch && filePath.endsWith('.tsx') && !content.includes('useUser()')) {
    content = content.replace(compMatch[0], `${compMatch[0]}\n  const { user } = useUser();\n`);
  }

  // Replace usages
  content = content.replace(/auth\.currentUser\?\.uid/g, 'user?.id');
  content = content.replace(/auth\.currentUser\.uid/g, 'user.id');
  content = content.replace(/auth\.currentUser\?\.displayName/g, 'user?.fullName');
  content = content.replace(/auth\.currentUser\.displayName/g, 'user.fullName');
  content = content.replace(/auth\.currentUser\?\.email/g, 'user?.primaryEmailAddress?.emailAddress');
  content = content.replace(/auth\.currentUser\.email/g, 'user.primaryEmailAddress?.emailAddress');
  content = content.replace(/auth\.currentUser\?\.photoURL/g, 'user?.imageUrl');
  content = content.replace(/auth\.currentUser\.photoURL/g, 'user.imageUrl');
  content = content.replace(/auth\.currentUser\?\.getIdToken\(\)/g, 'window.Clerk?.session?.getToken()');
  content = content.replace(/auth\.currentUser\.getIdToken\(\)/g, 'window.Clerk?.session?.getToken()');
  content = content.replace(/auth\.currentUser/g, 'user');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
}

walkDir(srcDir, replaceAuth);
