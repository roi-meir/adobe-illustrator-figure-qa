#!/usr/bin/env node
// Drive Adobe Illustrator via AppleScript on macOS.

"use strict";

const { execSync } = require("child_process");
const path = require("path");

function runJsx(jsxPath) {
    const abs = path.resolve(jsxPath);
    const script = `tell application "Adobe Illustrator" to do javascript file "${abs}"`;
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, { stdio: "inherit" });
}

function isIllustratorRunning() {
    try {
        const out = execSync('osascript -e \'tell application "System Events" to (name of processes) contains "Adobe Illustrator"\'', { encoding: "utf8" });
        return out.trim() === "true";
    } catch (e) {
        return false;
    }
}

module.exports = { runJsx, isIllustratorRunning };
