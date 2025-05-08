"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.params = exports.name = void 0;
const render_js_1 = require("./render.js");
exports.name = "mdtiddler";
exports.params = [
    {
        name: "title",
        default: ""
    },
];
function run(title = "") {
    title = title || this.getVariable("currentTiddler");
    if (!title) {
        console.warn("No title specified, exiting");
        return "";
    }
    if (title === "$:/plugins/cdaven/markdown-export/md-tiddler") {
        console.warn("Shouldn't render itself...?");
        return "";
    }
    const twRenderer = new render_js_1.TiddlyWikiRenderer($tw);
    const renderer = new render_js_1.MarkdownRenderer(twRenderer);
    return renderer.renderTiddler(title) || "";
}
exports.run = run;
;
