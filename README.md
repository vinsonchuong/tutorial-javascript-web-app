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
directory from the repository. Create a `.gitignore` containing

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
JavaScript features but does not support running tests in the browser.

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

Create a new test in `test/static.js`

```js
import test from 'ava';

test((t) => {
  t.pass();
});
```

By default, AVA will look for test cases in the `test` directory.

Run the tests with

```sh
npm test
```

Commit these changes

```sh
git add -A
git commit -m 'Automated Testing Infrastructure'
```

#### References
- [AVA](https://github.com/avajs/ava)
- [npm-scripts](https://docs.npmjs.com/misc/scripts)

### References
- [Walking skeleton](http://alistair.cockburn.us/Walking+skeleton)
