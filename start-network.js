const { spawn } = require('child_process');
const { VALIDATORS } = require('./src/network/validator-registry');

console.log('Starting Truvex network...');

const processes = VALIDATORS.map(v => {
  const proc = spawn('node', ['start-node.js', v.id], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', d => {
    const lines = d.toString().trim().split('\n');
    lines.forEach(line => console.log(line));
  });

  proc.stderr.on('data', d => {
    const lines = d.toString().trim().split('\n');
    lines.forEach(line => console.error(line));
  });

  proc.on('exit', code => {
    console.log(`[${v.id}] process exited with code ${code}`);
  });

  return proc;
});

process.on('SIGINT', () => {
  console.log('\nShutting down all validators...');
  processes.forEach(p => p.kill());
  process.exit(0);
});