#!/usr/bin/env node

// Patch fs.F_OK deprecation warning
const fs = require('fs');
if (!fs.constants) {
  fs.constants = {};
}
if (!fs.constants.F_OK) {
  fs.constants.F_OK = 0;
}

// Execute craco
const { spawn } = require('child_process');
const args = process.argv.slice(2);
const child = spawn('node', [require.resolve('@craco/craco/bin/index.js'), ...args], {
  stdio: 'inherit',
  env: { ...process.env },
});

child.on('exit', (code) => {
  process.exit(code);
});
