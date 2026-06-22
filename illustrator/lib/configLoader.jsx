// Loads and merges journal presets + user override into a single QA_CONFIG object.
// Depends on: core.generated.jsx (provides mergeConfig, loadPresetChain)

function readJsonFile(filePath) {
    var f = new File(filePath);
    if (!f.exists) return null;
    f.open("r");
    var content = f.read();
    f.close();
    try {
        return eval("(" + content + ")");
    } catch (e) {
        return null;
    }
}

// Resolve the repo-root configs/ directory relative to this script's location.
// Works whether run from illustrator/ directly or via a symlink in the Illustrator
// Scripts folder (install.sh writes install.path.txt for that case).
function findConfigsDir() {
    var scriptFile = new File($.fileName);
    // illustrator/lib/configLoader.jsx → go up two levels to reach repo root.
    var repoRoot = scriptFile.parent.parent.parent;

    // If install.path.txt exists beside figure_qa.jsx, read the repo root from it.
    var pathHint = new File(scriptFile.parent.parent.fsName + "/install.path.txt");
    if (pathHint.exists) {
        pathHint.open("r");
        var hint = pathHint.read().replace(/[\r\n]/g, "");
        pathHint.close();
        if (hint) repoRoot = new Folder(hint);
    }

    return new Folder(repoRoot.fsName + "/configs");
}

function loadQAConfig(journalName) {
    journalName = journalName || "default";
    var configsDir = findConfigsDir();
    var journalsDir = new Folder(configsDir.fsName + "/journals");

    // Load all available journal presets.
    var presets = {};
    var journalFiles = journalsDir.getFiles("*.json");
    for (var i = 0; i < journalFiles.length; i++) {
        var preset = readJsonFile(journalFiles[i].fsName);
        if (preset && preset.name) {
            presets[preset.name] = preset;
        }
    }

    if (!presets["default"]) {
        throw new Error("Missing default journal preset at " + journalsDir.fsName);
    }

    // Try to read optional user override from ~/.figure-qa/config.json
    var userOverride = null;
    var userConfigEnv = "";
    try { userConfigEnv = $.getenv("FIGURE_QA_USER_CONFIG"); } catch (e) {}
    var userConfigPath = userConfigEnv ||
        (new Folder("~/.figure-qa").fsName + "/config.json");
    userOverride = readJsonFile(userConfigPath);

    // If user override specifies a journal, honour it.
    if (userOverride && userOverride.journal) {
        journalName = userOverride.journal;
    }

    return loadPresetChain(presets, journalName, userOverride);
}
