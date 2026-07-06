const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

const target = process.argv[2] || 'http://localhost:3000';
const client = target.startsWith('https:') ? https : http;

function openBrowser() {
  const platform = process.platform;
  if (platform === 'win32') {
    execFile('cmd.exe', ['/d', '/c', 'start', '', target], { windowsHide: true });
  } else if (platform === 'darwin') {
    execFile('open', [target]);
  } else {
    execFile('xdg-open', [target]);
  }
}

let attempts = 0;
const timer = setInterval(() => {
  attempts += 1;
  const request = client.get(target, { timeout: 1500 }, (response) => {
    response.resume();
    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
      clearInterval(timer);
      openBrowser();
      process.exit(0);
    }
  });
  request.on('timeout', () => request.destroy());
  request.on('error', () => {});

  if (attempts >= 240) {
    clearInterval(timer);
    process.exit(1);
  }
}, 1000);
