# JavaScript Web Application Tutorial
A commit-by-commit walkthrough of how to bootstrap a JavaScript web application.

## Prerequisites

### Install Node.js
On Linux or OSX, a current version of Node.js should be available via package
manager.

Many operating systems, continuous integration environments, and deployment
environments ship with an outdated version of Node.js that lack features that
many external packages expect to be present. Ensuring that every environment
is running the newest current or LTS release is a low cost way to prevent all
of those issues.

#### References
- [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/)

### Install npm
Assuming that globally installed npm packages are available on the `PATH`, as
they would be if Node.js is installed via package manager, run the following
command:

```sh
npm install -g npm
```

npm changed how it organizes dependencies on the file system with version 3.
Dependencies are now, as much as possible, located immediately inside of the
`node_modules` directory instead of duplicated in the `node_modules`
directories of the packages that depend on them.

Because Babel, a commonly used JavaScript compiler has a large number of
plugin dependencies which depend on each other, `npm install` runs much more
quickly in version 3.

#### References
- [npm v3 Dependency Resolution](https://docs.npmjs.com/how-npm-works/npm3)
- [Seems like babel-node is running very slow.](https://github.com/babel/babel/issues/2706)

## Creating a New Project
Initialize a Git repository:

```sh
mkdir project
cd !$
git init
```

In order to leverage npm to manage external dependencies, a `package.json` must
be created in the root directory of the project:

```json
{
  "name": "project",
  "private": true
}
```

The `private` flag indicates to npm that this project is not meant to be
published as an npm package and suppresses warnings about missing values that
are specific to npm packages.

Many npm packages depend on a large number of other packages, themselves having
even more dependencies. The `node_modules` directory will typically consist of
several hundred megabytes of small files. It is important to exclude that
directory from the repository. Create a `.gitignore` containing:

```
/node_modules
```

Make an initial commit:

```sh
git add -A
git commit -m 'Creating a New Project'
```

### References
- [package.json](https://docs.npmjs.com/files/package.json)

## Serving Static Files
Let's start by building a "walking skeleton" of the application, which will
give us space to bootstrap testing infrastructure and deployment infrastructure,
while still having something to deploy and show.

### Automated Testing Infrastructure
The most popular testing frameworks today are Jasmine and Mocha. They can run
tests in Node.js, headless browsers like PhantomJS and full browsers.
Alternative test runners like Karma provide additional features.

Modern frontend frameworks no longer require application code to be executed in
a browser. They can be tested in a Node.js environment and provide strong browser
compatibility guarantees.

New JavaScript features like the `async` and `await` keywords allow asynchronous
logic to be tested more easily, but are not well supported in the established
testing frameworks.

In this tutorial, we'll write tests using AVA, which supports the newer
JavaScript features but does not support running tests in the browser. AVA also
runs tests in parallel by default, which helps keep the feedback cycle quick.

Install AVA with:

```sh
npm install -D ava
```

`-D` or `--save-dev` registers AVA as a non-runtime dependency of the project.

Then, add the `ava` command as the `test` script to the `package.json`:

```json
{
  "name": "project",
  "private": true,
  "scripts": {
    "test": "ava"
  },
  "devDependencies": {
    "ava": "^0.16.0"
  }
}
```

All continuous integration services that support Node.js applications will
default to running the `test` script.

Create a new test in `test/static.js`:

```js
import test from 'ava';

test((t) => {
  t.pass();
});
```

Run the test with:

```sh
npm test
```

By default, AVA will run all test cases found within the `test` directory.

Commit these changes:

```sh
git add -A
git commit -m 'Automated Testing Infrastructure'
```

### Serving Files Over HTTP
A web application that does not require any asset processing can be served using
an HTTP server that simply responds with the contents of files on the file
system.

There are many npm packages that provide a HTTP static file server. node-static
is a popular choice.

Let's start by writing an end-to-end test that starts the server, opens the
application in a browser, asserts that a piece of text is visible, and stops
the server and browser.

By convention, Node.js projects use a `start` script to start the server. The
command run by the script will typically print a url once the server is ready
to accept requests. The server can be stopped by sending a `SIGTERM` signal to
the server process.

Here is an example of an adapter that encapsulates starting and stopping the
server that can be copied into `test/static.js`:

```js
import {spawn} from 'child_process';

class Server {
  async start() {
    this.process = spawn('npm', ['start']);
    await new Promise((resolve, reject) => {
      this.process.once('close', () => {
        reject('Server did not start');
      });
      this.process.stdout.on('data', (data) => {
        if (data.includes('http://127.0.0.1')) {
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
```

An adapter that encapsulates communication with a browser can be implemented
using the same strategy. An example implementation has been published as
[phantomjs-adapter](https://github.com/vinsonchuong/phantomjs-adapter).

In this tutorial, for ease of getting started, we will use phantomjs-adapter.
Note that phantomjs-adapter is still not very mature and that there are more
established adapters like WebdriverIO. Install it with:

```sh
npm install -D phantomjs-adapter
```

Putting everything together in `test/static.js`:

```js
import test from 'ava';
import {spawn} from 'child_process';
import PhantomJS from 'phantomjs-adapter';

class Server {
  // ...
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
```

When we run the test with `npm test`, we get the error message:

```
1 failed


1. before
Promise rejected with: 'Server did not start'
```

This makes sense because as of yet, no HTTP server has been installed. Let's
make the test pass!

Install node-static:

```
npm install -D node-static
```

In `package.json`, make the `start` script run the `static` command:

```json
{
  "scripts": {
    "test": "ava",
    "start": "static"
  }
}
```

Now, when we re-run the test, we the following error message:

```
1 failed


1. before
failed with "Failed to open http://127.0.0.1:8080"
```

This makes sense because we've yet to create any files that can be served by
the server.

Create an `index.html` containing:

```html
<!doctype html>
<meta charset="utf-8">
<p>Hello World!</p>
```

The doctype indicates which HTML spec the file conforms to, in this case HTML5.
The charset roughly indicates which spoken language is used in the text content
of the file. Note that in HTML, the `<html>`, `<head>`, and `<body>` tags are
all optional.

If we re-run the test, this time it should pass.

When the tests failed, npm may have created debug logs in like
`test/npm-debug.log`. Clean them up with

```sh
rm test/npm-debug*
```

Commit the changes:

```sh
git add -A
git commit -m 'Serving Files Over HTTP'
```

### References
- [Walking skeleton](http://alistair.cockburn.us/Walking+skeleton)
- [AVA](https://github.com/avajs/ava)
- [npm-scripts](https://docs.npmjs.com/misc/scripts)
- [node-static](https://github.com/cloudhead/node-static)
- [Child Process](https://nodejs.org/api/child_process.html)
- [phantomjs-adapter](https://github.com/vinsonchuong/phantomjs-adapter)
- [WebdriverIO](http://webdriver.io/)