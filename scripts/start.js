// ZZSP Forum - cross-platform dev launcher.
// A single `npm run dev` starts BOTH services:
//   - Express server on http://localhost:4000
//   - Vite client  on http://localhost:5173
// It detects the OS (Windows / macOS / other) so the same command works
// everywhere, and prints an OS-specific note when relevant.

const path = require('path');
const { spawn } = require('child_process');

// --- Detect OS ------------------------------------------------------------
const platform = process.platform; // 'win32' | 'darwin' | 'linux' | ...
const osName =
  platform === 'win32' ? 'Windows' :
  platform === 'darwin' ? 'macOS' :
  (platform === 'linux' ? 'Linux' : platform);

const root = path.join(__dirname, '..');

console.log('');
console.log('=========================================');
console.log('  ZZSP Forum - starting dev environment');
console.log('  Detected OS: ' + osName);
console.log('  Server -> http://localhost:4000');
console.log('  Client -> http://localhost:5173');
console.log('=========================================');

// On Windows, the firewall may block incoming connections (e.g. from a phone
// on the same WiFi). If others cannot reach it over the network, check that
// Node / Vite are allowed through the Windows Firewall.
if (osName === 'Windows') {
  console.log('  Note: if others can\'t reach it over the network, check the');
  console.log('        Windows Firewall and allow incoming connections for Node.');
}

// --- Launch both services -------------------------------------------------
// `npm --prefix <dir> run dev` is portable across Windows and macOS, so these
// exact spawn calls work on either machine with no path/shell differences.
const targets = [
  { name: 'Server (Express)', cmd: 'npm', args: ['--prefix', 'server', 'run', 'dev'] },
  { name: 'Client (Vite)   ', cmd: 'npm', args: ['--prefix', 'client', 'run', 'dev'] },
];

const children = targets.map((t) => {
  console.log('  > Launching ' + t.name + ' ...');
  // shell:true lets npm resolve correctly on Windows (npm.cmd) and macOS (/bin/sh).
  const child = spawn(t.cmd, t.args, { cwd: root, stdio: 'inherit', shell: true });
  return { name: t.name, child };
});

// --- Clean shutdown on Ctrl+C ---------------------------------------------
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('');
  console.log('Stopping servers...');
  children.forEach(({ child }) => {
    try { child.kill(); } catch (e) { /* already gone */ }
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
