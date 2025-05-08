"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportedForTesting = exports.run = exports.params = exports.name = void 0;
const render_js_1 = require("./render.js");
exports.name = "markdown-export";
exports.params = [
    {
        name: "filter",
        default: ""
    },
    {
        name: "note",
        default: ""
    },
    {
        name: "version",
        default: ""
    },
];
function insertNote(markdownTiddler, note) {
    return markdownTiddler.replace(/(---\n+)(#)/, `$1<!-- ${note.replace(/\$/g, "$$$$")} -->\n\n$2`);
}
function run(filter = "", note = "", version = "") {
    console.log(`Running Markdown Export ${version} with filter ${filter}`);
    if (!filter) {
        console.warn("No filter specified, exiting");
        return "";
    }
    const twRenderer = new render_js_1.TiddlyWikiRenderer($tw);
    const renderer = new render_js_1.MarkdownRenderer(twRenderer);
    note = twRenderer.wikifyText(note);
    let markdownTiddlers = [];
    for (const title of $tw.wiki.filterTiddlers(filter)) {
        console.log(`Rendering [[${title}]] to Markdown`);
        let markdownTiddler = null;
        try {
            markdownTiddler = renderer.renderTiddler(title);
        }
        catch (err) {
            console.error(err);
        }
        if (markdownTiddler) {
            if (note) {
                markdownTiddler = insertNote(markdownTiddler, note);
            }
            markdownTiddlers.push(markdownTiddler.trim());
        }
    }
    const pageBreak = "\n\n\\newpage\n\n";
    return markdownTiddlers.join(pageBreak);
}
exports.run = run;
;
exports.exportedForTesting = {
    insertNote
};
