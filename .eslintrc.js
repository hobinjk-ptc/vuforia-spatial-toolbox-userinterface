module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "Stats": "readonly",

        "Block": "writable",
        "BlockLink": "writable",
        "CRAFTING_GRID_HEIGHT": "writable",
        "CRAFTING_GRID_WIDTH": "writable",
        "DEBUG_DATACRAFTING": "writable",
        "Frame": "writable",
        "Logic": "writable",
        "LogicGUIState": "writable",
        "Objects": "writable",
        "SEA3D": "writable",
        "TEMP_DISABLE_MEMORIES": "writable",
        "THREE": "writable",
        "ToolSocket": "writable",
        "TWEEN": "writable",
        "WebKitPoint": "writable",
        "acceptUDPBeats": "writable",
        "boundListeners": "writable",
        "cc": "writable",
        "cout": "writable",
        "createNameSpace": "writable",
        "d3": "writable",
        "editingAnimationsMatrix": "writable",
        "globalCanvas": "writable",
        "globalDOMCache": "writable",
        "globalProgram": "writable",
        "globalFrameScaleAdjustment": "writable",
        "globalNodeScaleAdjustment": "writable",
        "globalStates": "writable",
        "httpPort": "writable",
        "defaultHttpPort": "writable",
        "hull": "writable",
        "io": "writable",
        "objects": "writable",
        "overlayDiv": "writable",
        "p5": "writable",
        "pocketBegin": "writable",
        "pocketDropAnimation": "writable",
        "pocketFrame": "writable",
        "pocketItem": "writable",
        "pocketItemId": "writable",
        "pocketNode": "writable",
        "publicDataCache": "writable",
        "realityEditor": "writable",
        "realityElements": "writable",
        "rotateX": "writable",
        "rotationXMatrix": "writable",
        "rr": "writable",
        "shadowObjects": "writable",
        "targetDownloadStates": "writable",
        "timeCorrection": "writable",
        "timeForContentLoaded": "writable",
        "visibleObjectTapDelay": "writable",
        "visibleObjectTapInterval": "writable",
        "webkitConvertPointFromPageToNode": "writable",
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "no-prototype-builtins": "off",
        "no-redeclare": [
          "error",
          {"builtinGlobals": false}
        ],
        "no-unused-vars": [
          "error",
          {
            "varsIgnorePattern": "^_",
            "argsIgnorePattern": "^_",
          },
        ],
    },
    "overrides": [{
        "files": "src/gui/threejsScene.js",
        "parserOptions": {
            "ecmaVersion": 2018,
            "sourceType": "module"
        }
    }]
};
