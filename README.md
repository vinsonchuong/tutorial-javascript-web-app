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

### Install Ruby
This tutorial uses Travis CI for continuous integration, which publishes a CLI
tool written in Ruby.

On Linux or OSX, a current version of Ruby should be available via package
manager.

### References
- [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/)
- [npm v3 Dependency Resolution](https://docs.npmjs.com/how-npm-works/npm3)
- [Seems like babel-node is running very slow.](https://github.com/babel/babel/issues/2706)
- [Installing Ruby](https://www.ruby-lang.org/en/documentation/installation)

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


1. [anonymous]

t.not(paragraph, null)
      |
      null
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

### Continous Integration
Continuous integration is the foundation on top of which many team and
deployment workflows can be automated. Contributions from many team mebers can
be merged, tested, deployed to different environments, and accepted, all
automatically.

CI software and services all provide the same core functionality of detecting
commits to a repository, running automated tests on those commits, and deploying
them to a production or production-like environment. They differ mainly in their
pricing models, supported technology stacks, and integration with other
services.

Travis CI is a good choice for open source projects with it's tight integration
with GitHub. CircleCI is a good choice for new closed source projects due to its
free pricing tier.

For the purposes of this tutorial, we will be using Travis CI. The steps will
be similar for other CI services.

Create a `.travis.yml` file containing:

```yaml
---
sudo: required
dist: trusty
language: node_js
node_js:
  - node
```

The `language` key sets useful defaults like running `npm install` to install
external dependencies and running `npm test` to run automated tests. The
`node_js` key specifies the versions of Node.js to build against; `node` is
a stand-in for the latest stable version of Node.js. The `sudo` and `dist` keys
configure Travis CI to build within their new Ubuntu 14.04 images, which provide
a more recent version of gcc/g++ that npm requires to build packages that
include C extensions.

If you haven't already, now is the time to push the repository to GitHub. Create
a repository and configure the `origin` remote on your local repository. Then,
commit your changes and push:

```sh
git add -A
git commit -m 'Continuous Integration'
git push -u origin master
```

After doing so, add the repository on Travis CI.

### Continuous Deployment
Travis CI is capable of deploying to many providers given just login
credentials. In this tutorial, we will deploy to [Surge.sh](http://surge.sh/).
Refer to the [documentation](https://docs.travis-ci.com/user/deployment) for
other providers.

Install `surge`:

```sh
npm install -g surge
```

`-g` or `--global` installs the package into your user home directory instead
of into the current project; this is useful for CLI tools.

Create a Surge.sh account and make your first deployment by running:

```sh
surge
```

Configure Travis CI to deploy to Surge.sh by adding to `.travis.yml`:

```yaml
deploy:
  provider: surge
  domain: project.surge.sh
```

Make sure to change the domain to one that is not already in use.

Generate an API token for Surge.sh by running:

```sh
surge token
```

Then, store an encrypted version of the credentials in the `.travis.tml` by
running:

```sh
gem install travis
travis encrypt --add env SURGE_LOGIN='email' SURGE_TOKEN='token'
```

Commit the changes:

```sh
git add -A
git commit -m 'Continuous Deployment'
git push
```

### References
- [Walking skeleton](http://alistair.cockburn.us/Walking+skeleton)
- [AVA](https://github.com/avajs/ava)
- [npm-scripts](https://docs.npmjs.com/misc/scripts)
- [node-static](https://github.com/cloudhead/node-static)
- [Child Process](https://nodejs.org/api/child_process.html)
- [phantomjs-adapter](https://github.com/vinsonchuong/phantomjs-adapter)
- [WebdriverIO](http://webdriver.io/)
- [Building a Node.js project](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/)
- [The Trusty beta Build Environment](https://docs.travis-ci.com/user/trusty-ci-environment/)
- [Deployment](https://docs.travis-ci.com/user/deployment)
- [Surge.sh](http://surge.sh/)

## Developer Tooling and Infrastructure
As it stands, we know have everything needed to build, test, and deploy a
JavaScript web application.

### Current Capabilities
Visual styling can be applied by creating a `index.css`:

```css
p {
  color: #333;
  font-size: 24px;
}
```

and including it in `index.html`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="index.css">
<p>Hello World!</p>
```

CSS can be split into different files and included either by adding additional
`<link>` tags or by using `@import` in an already included CSS file.

JavaScript code can be written in an `index.js`:

```js
alert('Loaded');
```

and included in `index.html`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="index.css">
<script async src="index.js"></script>
<p>Hello World!</p>
```

Currently, the only way to split logic into multiple JavaScript files and
include them is by adding additional `<script>` tags. A similar restriction
exists in AVA, where we would not be able to put the server adapter into
its own file.

Furthermore, JavaScript has standardized many new features, commonly referred to
using names like ES6, ES2015, ES2016, ES2017, and ES.Next, that many browsers do
not support.

In order to be able to split code into multiple files as well as leverage the
newer features and increasing number of resources about them listed under common
search queries, let's introduce some asset compilation infrastructure.

Commit these changes:

```sh
git add -A
git commit -m 'Current Capabilities'
git push
```

### Compiling ES.Next
Babel is a plugin-based JavaScript compilation framework. It takes in ES.Next
modules, and compiles them and their imported dependencies into ECMAScript5
(ES5) code.

Start by opening `test/static.js` and extracting the server adapter into
`test/helpers/Server.js`:

```js
import {spawn} from 'child_process';

export default class {
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

Notice that `class Server` changed to `export default class`. `Server.js` is
now a module that exports a `class` that can be included in `test/static.js` as
follows:

```js
import Server from './helpers/Server';
```

Now when we run the test with `npm test`, we get the following error:

```
SyntaxError: Unexpected token import
```

This is because, Node.js does not currently support the `import` or `export`
keywords. Add support by running:

```sh
npm install -D babel-register babel-preset-latest babel-plugin-transform-runtime babel-runtime
```

And adding to `package.json`:

```json
{
  "babel": {
    "presets": ["latest"],
    "plugins": ["transform-runtime"]
  },
  "ava": {
    "babel": "inherit",
    "require": ["babel-register"]
  }
}
```

Each new JavaScript feature is compiled using one or more Babel plugins. A Babel
preset is a group of plugins that are all required by a specific specification
or usecase. The `latest` preset contains all of the plugins necessary to compile
all of the new features that are officially released. The `transform-runtime`
plugin configures Babel to look for new standard library methods and classes in
the `babel-runtime` package, where otherwise, it would assume them to be present
already as globals. `babel-register`, when required in a Node.js
environment, compiles modules at runtime when they are imported.

For AVA, we configure it to use the new Babel configuration as well as load
`babel-register` so that imported helpers are compiled.

Running the tests again, they should now pass.

Bringing ES.Next compilation to our implementation code is more challenging
because browsers do not provide a programmatic way to fetch JavaScript code from
a server, evaluate it, and do the same to imported dependencies. Node.js
provides such infrastructure, and `babel-register` is simply able to leverage
and extend it. So, in order to bring ES.Next to the browser, additional
infrastructure is needed.

To summarize, running ES.Next code in the browser requires a compiler to
transpile (or translate) ES.Next modules into ES5 code files and a loader to
get the compiled code into the browser in an order that satisfies every `import`
statement.

The current most common approach is to transpile ES.Next modules using Babel and
concatenate the result using webpack into a single file that can be loaded into
a browser using a `<script>` tag. webpack would provide an implementation of the
`import` statement that resolves dependencies and executes code in the correct
order.

Alternative solutions involve running one or both of the transpilation or
loading steps in the browser or transpiling on-the-fly as modules are requested
by the browser.

Let's start by removing the dummy text from `index.html`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="index.css">
<script async src="index.js"></script>
```

We will instead add the text using JavaScript in `index.js`:

```js
import render from './hello';

render();
```

Now, inside of `hello.js`:

```js
export default function() {
  const paragraph = document.createElement('p');
  paragraph.textContent = 'Hello World!';
  document.body.appendChild(paragraph);
}
```

If you run the tests, they will fail because no `<p>` tag is rendered to the
page. This is because the browser is unable to parse the `import` statement
in `index.js`.

Install webpack:

```sh
npm install -D webpack webpack-dev-server babel-loader
npm uninstall -D node-static
```

babel-loader will transpile ES.next modules (like babel-register), and webpack
will load them as a single file into the browser. webpack-dev-server replaces
node-static and will serve static assets as well as transpiled modules.

Change the `start` script in `package.json` to run `webpack-dev-server`:

```json
{
  "scripts": {
    "start": "webpack-dev-server"
  }
}
```

Configure webpack by creating a `webpack.config.js` containing:

```js
module.exports = {
  entry: './index.js',
  output: {
    filename: 'dist.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
        exclude: /node_modules/
      }
    ]
  }
};
```

`entry` is the path to the file that would be loaded using a `<script>` tag--
in this case, `index.js`. `output` is the transpiled file that must be loaded
instead. `loaders` are plugins that process or transpile specific files
whitelisted using `test` and blacklisted using `exclude`. In this case, we are
transpiling files with names ending in `.js` with `babel-loader` and not
transpiling external dependencies. `babel-loader` will use the presets and
plugins listed in `package.json`, transpiling files in the same way as
`babel-register` for AVA.

Change `index.html` to load `dist.js` instead of `index.js`:

```html
<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="index.css">
<script async src="dist.js"></script>
```

Now, run `npm start`. Notice that when the server is ready for browser requests,
it outputs:

```
webpack: bundle is now VALID.
```

Also, notice that `dist.js` is never saved to the file system but rather served
in-memory by the webpack-dev-server.

Update `test/helpers/Server.js` to wait for this text instead:

```js
        if (data.includes('webpack: bundle is now VALID.')) {
          setTimeout(resolve, 1000);
        }
```

If you run the tests, they should now pass.

When deploying, we must ensure that the `dist.js` file is created. `dist.js` can
be generated and saved by running

```sh
webpack
```

`dist.js` should also be excluded from the repository because it can always be
rebuilt from the actual JavaScript source code. Add to `.gitignore`:

```sh
/dist.js
```

We can configure Travis CI to create it before deploying by adding to
`.travis.yml`:

```yaml
before_deploy:
  - webpack
deploy:
  skip_cleanup: true
```

Commit these changes:

```sh
git add -A
git commit -m 'Compiling ES.Next'
git push
```

### References
- [Babel](https://babeljs.io/)
- [Babel: configuring standard library and helpers](https://leanpub.com/setting-up-es6/read#ch_babel-helpers-standard-library)
- [webpack Dev Server](https://webpack.github.io/docs/webpack-dev-server.html)
- [webpack Configuration](https://webpack.github.io/docs/configuration.html)
- [babel-loader](https://github.com/babel/babel-loader)
- [Travis CI: Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build#Deploying-your-Code)
