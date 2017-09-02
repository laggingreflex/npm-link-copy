# npm-link-copy

Alternative to [npm link] that works by copying files instead of linking.

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
npm install -g laggingreflex/npm-link-copy
```

## Usage

```sh

npm-link-copy [..modules] [options]
```

* **`--watch, -w`** Watch for changes
* **`--ignored, -i`** `[defalut:['node_modules', '.git']]` Ignored dirs


<Links/>

[npm link]: https://docs.npmjs.com/cli/link
