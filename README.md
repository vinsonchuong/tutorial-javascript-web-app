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

Make an initial commit:

```sh
git add -A
git commit -m 'Initial Commit'
```

### References
- [package.json](https://docs.npmjs.com/files/package.json)
