#!/usr/bin/env node

"use strict";

const path = require('path');
const fs = require('fs-extra');
const globalRequire = require('require-global-node-module');
const chokidar = require('chokidar');
const yargs = require('yargs');
const debounce = require('debounce-queue');

const cwd = process.cwd();
const argv = yargs.options({
  watch: { type: 'boolean', alias: 'w' },
  ignored: { type: 'string', alias: 'i', default: ['node_modules', '.git'] },
  verbose: { type: 'boolean', alias: 'v' },
}).argv;

const log = (...msg) => console.log('[nlc]', ...msg);
log.verb = argv.verbose ? log : () => {};
log.err = (...msg) => console.error('[nlc] [error]', ...msg);

argv._.forEach(moduleName => {
  const mlog = (...msg) => log('[' + moduleName + ']', ...msg);
  mlog.verb = (...msg) => log.verb('[' + moduleName + ']', ...msg);
  mlog.err = (...msg) => log.err('[' + moduleName + ']', ...msg);
  const modulePath = globalRequire.resolve(moduleName);
  const watcher = chokidar.watch(modulePath, {
    cwd: modulePath,
    ignored: argv.ignored,
  });

  const copy = debounce(_ => _.forEach(filePath => {
    const fullFilePath = path.join(modulePath, filePath);
    // const filePath = path.relative(modulePath, fullFilePath);
    const fullDestPath = path.join(cwd, 'node_modules', moduleName, filePath);
    fs.copy(fullFilePath, fullDestPath, error => {
      if (error) {
        mlog.err('Cannot copy', filePath, error.message);
      } else {
        mlog.verb('Copied', filePath);
      }
    });
  }), 500);

  watcher.on('add', copy);
  watcher.on('ready', debounce(() => {
    mlog('Copied');
    watcher.removeListener('add', copy);
    if (argv.watch) {
      mlog('Watching for changes...');
      watcher.on('change', copy);
    } else {
      watcher.close();
    }
  }, 1000));
});
