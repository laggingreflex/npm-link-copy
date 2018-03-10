# npm-link-copy

Alternative to [npm link] that works by copying files instead of linking.

## Why this fork?

This fork is based on laggingreflex's package. That one is great, but it only supports listening to file changes in the watch mode.
This is fixed here: the tool now watches for adding, removing and renaming files and directories.


## Why?

Suppose you have the following setup:

```
/home
├───your-projects
│   └───some-project
├───your-npm-libs
│   └───your-awesome-module
```

Where `some-project` uses `your-awesome-module`.

While developing locally, you'd obviously want to make use of [npm link]

```sh
~/your-npm-libs/your-awesome-module $ npm link
```
```sh
~/your-projects/some-project $ npm link your-awesome-module
```

While this does *link* `your-awesome-module` inside `some-project/node_modules` and you can carry on as though it's actually installed, but internally node uses `fs.realPath` and therefore ***knows*** that `your-awesome-module` is actually in `~/your-npm-libs/your-awesome-module` and not *really* in `some-project/node_modules/your-awesome-module`. This reflects in things like **`require` calls** or access to **`__dirname`** from your module **or** its dependencies which sometimes causes issues.


So to help with that, this tool actually **copies** `your-awesome-module` in `some-project/node_modules/your-awesome-module` and optionally keeps it updated (with --watch)

One downside is that you need to run it every time you make changes to `your-awesome-module`

## Install

```sh
npm install -g blissi/npm-link-copy
```

## Usage

```sh

npm-link-copy [..modules] [options]
```

* **`--watch, -w`** Watch for changes
* **`--ignored, -i`** `[default:['node_modules', '.git']]` Ignored dirs
* **`--clearInitially, -c`** Clears the target directory initially.
* **`--verbose, -v`** Log every file and directory operation that's done.


## Libraries used

* [fs-extra]: better `fs`
* [require-global-node-module]: resolve from `npm root -g`
* [chokidar]: better `fs.watch`
* [yargs]: enhanced `process.argv`
* [debounce-queue] prevent bursts of callbacks
* [rimraf] delete directory recursively
* [shelljs] copy, mkdir, ...

<Links/>

[npm link]: https://docs.npmjs.com/cli/link
[fs-extra]: https://github.com/jprichardson/node-fs-extra
[require-global-node-module]: http://github.com/sdgluck/require-global-node-module
[chokidar]: https://github.com/paulmillr/chokidar/
[yargs]: https://github.com/yargs/yargs
[debounce-queue]: https://github.com/laggingreflex/debounce-queue/
