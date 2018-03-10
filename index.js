#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs-extra");
const globalRequire = require("require-global-node-module");
const chokidar = require("chokidar");
const yargs = require("yargs");
const debounce = require("debounce-queue");
const shelljs = require("shelljs");
const rimraf = require("rimraf");

const cwd = process.cwd();
const argv = yargs.options({
	watch: {type: "boolean", alias: "w"},
	ignored: {type: "string", alias: "i", default: ["node_modules", ".git"]},
	verbose: {type: "boolean", alias: "v"},
}).argv;

const log = (...msg) => console.log("[nlc]", ...msg);
log.verb = argv.verbose ? log : () => {
};
log.err = (...msg) => console.error("[nlc] [error]", ...msg);

argv._.forEach(moduleName => {
	const mlog = (...msg) => log("[" + moduleName + "]", ...msg);
	mlog.verb = (...msg) => log.verb("[" + moduleName + "]", ...msg);
	mlog.err = (...msg) => log.err("[" + moduleName + "]", ...msg);
	
	const modulePath = globalRequire.resolve(moduleName);
	const localModulePath = path.join(cwd, "node_modules", moduleName);
	
	shelljs.mkdir("-p", localModulePath);
	
	const watcher = chokidar.watch(modulePath, {
		cwd: modulePath,
		ignored: argv.ignored,
	});
	
	function copy(filePath) {
		return () => {
			const fullFilePath = path.join(modulePath, filePath);
			// const filePath = path.relative(modulePath, fullFilePath);
			const fullDestPath = path.join(localModulePath, filePath);
			try {
				shelljs.mkdir("-p", path.dirname(fullDestPath));
				shelljs.cp(fullFilePath, fullDestPath);
				mlog.verb("Copied", filePath);
			}
			catch (error) {
				mlog.err("Cannot copy", filePath, error.message);
			}
		};
	}
	
	function remove(filePath) {
		return () => {
			const fullPath = path.join(localModulePath, filePath);
			try {
				shelljs.rm(fullPath);
				mlog.verb("Removed", filePath);
			}
			catch (error) {
				mlog.err("Cannot remove", filePath, error.message);
			}
		};
	}
	
	function addDir(dir) {
		return () => {
			const fullPath = path.join(localModulePath, dir);
			try {
				shelljs.mkdir("-p", fullPath);
				mlog.verb("Created directory", dir);
			}
			catch (error) {
				mlog.err("Cannot create directory ", dir, error.message);
			}
		};
	}
	
	function removeDir(dir) {
		var operation = () => {
			const fullPath = path.join(localModulePath, dir);
			try {
				rimraf.sync(fullPath);
				mlog.verb("Removed directory", dir);
			}
			catch (error) {
				mlog.err("Cannot remove directory ", dir, error.message);
			}
		};
		operation.isRemoveDir = true;
		return operation;
	}
	
	const performOperation = debounce(operations => operations
			.sort((op1, op2) => {
				// Sort so that removeDir is performed after files have been deleted.
				if (op1.isRemoveDir && !op2.isRemoveDir) {
					return 1;
				}
				else if (!op1.isRemoveDir && op2.isRemoveDir) {
					return -1;
				}
				else {
					return 0;
				}
				
			})
			.forEach(operation => {
				operation();
			}),
		500);
	
	watcher.on("add", path => performOperation(copy(path)));
	watcher.on("ready", debounce(() => {
		mlog("Copied");
		if (argv.watch) {
			mlog("Watching for changes...");
			watcher.on("change", path => performOperation(copy(path)));
			watcher.on("unlink", path => performOperation(remove(path)));
			watcher.on("addDir", path => performOperation(addDir(path)));
			watcher.on("unlinkDir", path => performOperation(removeDir(path)));
		}
		else {
			watcher.removeListener("add", copy);
			watcher.close();
		}
	}, 1000));
});
