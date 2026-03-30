const { app, shell, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const net = require('net');

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    function check() {
      const client = new net.Socket();
      
      client.connect(port, '127.0.0.1', () => {
        client.destroy();
        resolve(true);
      });
      
      client.on('error', () => {
        client.destroy();
        if (Date.now() - startTime < timeout) {
          setTimeout(check, 1000);
        } else {
          resolve(false);
        }
      });
    }
    
    check();
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false
  });

  console.log('启动服务中...');
  
  // 启动 Next.js
  const server = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit'
  });

  // 等待端口就绪
  waitForPort(3000, 30000).then((ready) => {
    if (ready) {
      console.log('服务已就绪，打开浏览器...');
      shell.openExternal('http://localhost:3000');
    } else {
      console.log('服务启动超时，请手动访问 http://localhost:3000');
    }
    mainWindow.close();
  });
}

app.whenReady().then(() => {
  createWindow();
});
