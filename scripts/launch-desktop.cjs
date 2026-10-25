const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const electronExe = path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe');

const child = spawn(electronExe, ['.'], {
  cwd: rootDir,
  stdio: 'inherit',
  windowsHide: false
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
