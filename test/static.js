import test from 'ava';
import {spawn} from 'child_process';
import PhantomJS from 'phantomjs-adapter';

class Server {
  async start() {
    this.process = spawn('npm', ['start']);
    await new Promise((resolve, reject) => {
      this.process.once('close', () => {
        reject('Server did not start');
      });
      this.process.stdout.on('data', (data) => {
        if (data.includes('http://127.0.0.1:8080')) {
          setTimeout(resolve, 1000);
        }
      });
    });
  }

  async stop() {
    this.process.kill();
    await new Promise((resolve) => {
      if (!this.process.connected) {
        resolve();
      }
      this.process.on('close', resolve);
    });
  }
}

const server = new Server();
const browser = new PhantomJS();

test.before(async () => {
  await server.start();
  await browser.open('http://127.0.0.1:8080');
});

test(async (t) => {
  const paragraph = await browser.find('p');
  t.not(paragraph, null);
  t.is(paragraph.textContent, 'Hello World!');
});

test.after.always(async () => {
  await browser.exit();
  await server.stop();
});
