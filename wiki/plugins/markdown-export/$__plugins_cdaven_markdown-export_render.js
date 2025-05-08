"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = exports.TiddlyWikiRenderer = void 0;
const Node = globalThis.Node || {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
};
const btoa = globalThis.btoa || function (data) {
    const ascii = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let len = data.length - 1, i = -1, b64 = '';
    while (i < len) {
        const code = data.charCodeAt(++i) << 16 | data.charCodeAt(++i) << 8 | data.charCodeAt(++i);
        b64 += ascii[(code >>> 18) & 63] + ascii[(code >>> 12) & 63] + ascii[(code >>> 6) & 63] + ascii[code & 63];
    }
    const pads = data.length % 3;
    if (pads > 0) {
        b64 = b64.slice(0, pads - 3);
        while (b64.length % 4 !== 0) {
            b64 += '=';
        }
    }
    return b64;
};
function isTextNode(node) {
    return node.nodeType === Node.TEXT_NODE;
}
function isDomNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
class TiddlyWikiRenderer {
    constructor(tw) {
        this.tw = tw;
        const macroImport = "[[$:/core/ui/PageMacros]] [all[shadows+tiddlers]tag[$:/tags/Macro]!has[draft.of]] [all[shadows+tiddlers]tag[$:/tags/Macro/View]!has[draft.of]]";
        this.widgetOptions = {
            document: $tw.fakeDocument,
            mode: "block",
            importVariables: macroImport,
            recursionMarker: "yes",
            variables: {
                currentTiddler: null
            }
        };
    }
    renderWidgetTree(title) {
        this.widgetOptions.variables.currentTiddler = title;
        const widgetNode = this.tw.wiki.makeTranscludeWidget(title, this.widgetOptions);
        const container = this.tw.fakeDocument.createElement("div");
        widgetNode.render(container, null);
        return container.children[0].children;
    }
    wikifyText(text) {
        return this.tw.wiki.renderText("text/plain", "text/vnd.tiddlywiki", text);
    }
    getFields(title) {
        const tiddler = this.tw.wiki.getTiddler(title);
        if (tiddler == null) {
            console.warn("Found no such tiddler", title);
            return null;
        }
        return Object.assign({}, tiddler.fields);
    }
}
exports.TiddlyWikiRenderer = TiddlyWikiRenderer;
class MarkdownRenderer {
    constructor(tw) {
        this.tw = tw;
        this.rules = this.getRules();
    }
    renderTiddler(title) {
        if (this.rules == null) {
            console.warn("Cannot render tiddler without rules");
            return null;
        }
        const nodes = this.tw.renderWidgetTree(title);
        this.tiddlerFields = this.tw.getFields(title);
        let renderedNodes = "";
        for (const node of nodes) {
            const nodeMarkup = this.renderNode(node);
            if (nodeMarkup != null) {
                renderedNodes += nodeMarkup;
            }
        }
        const metaNode = {
            tag: "meta",
            nodeType: Node.ELEMENT_NODE,
            attributes: this.tiddlerFields,
            children: []
        };
        let markup = this.renderNode(metaNode) + renderedNodes;
        return markup.replace(/\n\n\n+/g, "\n\n").trim() + "\n";
    }
    getRules() {
        let rules = {
            "meta": (node) => {
                const fields = node.attributes;
                let frontMatter = [];
                if (fields.title) {
                    frontMatter.push(`title: '${fields.title}'`);
                }
                if (fields.author) {
                    frontMatter.push(`author: '${fields.author}'`);
                }
                if (fields.modified) {
                    frontMatter.push(`date: '${fields.modified.toISOString()}'`);
                }
                if (fields.description) {
                    frontMatter.push(`abstract: '${fields.description}'`);
                }
                if (fields.tags && fields.tags.length > 0) {
                    frontMatter.push(`tags: ['${fields.tags.join(',')}']`);
                }
                return `---\n${frontMatter.join("\n")}\n---\n\n# ${fields.title}\n\n`;
            },
            "p": (_, im) => `${im.trim()}\n\n`,
            "em": (_, im) => `*${im}*`,
            "strong": (_, im) => `**${im}**`,
            "u": (_, im) => `<u>${im}</u>`,
            "strike": (_, im) => `~~${im}~~`,
            "br": (node) => {
                const nextNode = this.getNextNode(node);
                if (nextNode == null || (isTextNode(nextNode) && nextNode.textContent === "\n")) {
                    return "\n";
                }
                else {
                    return "\\\n";
                }
            },
            "hr": () => `---\n\n`,
            "label": (_, im) => im,
            "mark": (_, im) => `<mark>${im}</mark>`,
            "span": (node, im) => {
                const katexStart = '<annotation encoding="application/x-tex">';
                if (node.rawHTML && node.rawHTML.indexOf(katexStart) !== -1) {
                    let mathEq = node.rawHTML.substring(node.rawHTML.indexOf(katexStart) + katexStart.length);
                    mathEq = mathEq.substring(0, mathEq.indexOf('</annotation>'));
                    if (mathEq.startsWith("\n") && mathEq.endsWith("\n")) {
                        return `$$${mathEq}$$\n\n`;
                    }
                    else {
                        return `$${mathEq}$`;
                    }
                }
                else {
                    return im;
                }
            },
            "sub": (_, im) => `~${im.replace(/ /g, "\\ ")}~`,
            "sup": (_, im) => `^${im.replace(/ /g, "\\ ")}^`,
            "h1": (_, im) => `# ${im}\n\n`,
            "h2": (_, im) => `## ${im}\n\n`,
            "h3": (_, im) => `### ${im}\n\n`,
            "h4": (_, im) => `#### ${im}\n\n`,
            "dl": (_, im) => `${im.trim()}\n\n`,
            "dt": (_, im) => `${im}\n`,
            "dd": (_, im) => ` ~ ${im}\n\n`,
            "pre": (node, im) => {
                if (node.children.every(child => isDomNode(child) && child.tag === "code")) {
                    return im;
                }
                else {
                    return `\`\`\`\n${im.trim()}\n\`\`\`\n\n`;
                }
            },
            "code": (node, im) => {
                var _a, _b, _c;
                if (((_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.tag) === "pre") {
                    let classRx = (_c = (_b = node.attributes) === null || _b === void 0 ? void 0 : _b.class) === null || _c === void 0 ? void 0 : _c.match(/^(.+) hljs$/);
                    if (classRx) {
                        const lang = classRx[1];
                        return `\`\`\`${lang}\n${im.trim()}\n\`\`\`\n\n`;
                    }
                    else {
                        return `\`\`\`\n${im.trim()}\n\`\`\`\n\n`;
                    }
                }
                else {
                    return `\`${im}\``;
                }
            },
            "blockquote": (_, im) => {
                return `> ${im.trim().replace(/\n/g, "\n> ")}\n\n`;
            },
            "cite": (_, im) => {
                return `<cite>${im}</cite>`;
            },
            "ul": (node, im) => {
                if (node.parentNode && node.parentNode.tag === "li") {
                    return `\n${im}`;
                }
                else {
                    return `${im.trim()}\n\n`;
                }
            },
            "li": (node, im) => {
                let curNode = node.parentNode;
                if (curNode == null) {
                    console.error("Found <li> without parent");
                    return null;
                }
                const listType = curNode.tag === "ul" ? "*" : "1.";
                const listTags = ["ul", "ol", "li"];
                let depth = -1;
                while (curNode && listTags.indexOf(curNode.tag) !== -1) {
                    if (curNode.tag !== "li") {
                        depth++;
                    }
                    curNode = curNode.parentNode;
                }
                return `${"    ".repeat(depth)}${listType} ${im}\n`;
            },
            "input": (node) => {
                var _a, _b;
                if (((_a = node.attributes) === null || _a === void 0 ? void 0 : _a.type) === "checkbox") {
                    if ((_b = node.attributes) === null || _b === void 0 ? void 0 : _b.checked) {
                        return "[x]";
                    }
                    else {
                        return "[ ]";
                    }
                }
                else {
                    console.warn("Unsupported input node type", node);
                    return null;
                }
            },
            "a": (node, im) => {
                var _a;
                const href = (_a = node.attributes) === null || _a === void 0 ? void 0 : _a.href;
                if (href == null || (href === null || href === void 0 ? void 0 : href.startsWith("#"))) {
                    return im;
                }
                else if (im && im != href) {
                    return `[${im}](${href})`;
                }
                else {
                    return `<${href}>`;
                }
            },
            "img": (node) => {
                var _a, _b;
                let caption = ((_a = node.attributes) === null || _a === void 0 ? void 0 : _a.title) || "";
                let src = ((_b = node.attributes) === null || _b === void 0 ? void 0 : _b.src) || "";
                const svgPrefix = "data:image/svg+xml,";
                if (src.startsWith(svgPrefix)) {
                    src = svgPrefix.replace("svg+xml,", "svg+xml;base64,") +
                        btoa(decodeURIComponent(src.substring(svgPrefix.length)));
                }
                return `![${caption}](${src})`;
            },
            "table": (node) => {
                let tbody = null;
                for (const child of node.children) {
                    if (isDomNode(child) && child.tag === "tbody") {
                        tbody = child;
                        break;
                    }
                }
                if (tbody == null) {
                    return null;
                }
                let justifyLeft = (s, w) => {
                    const sLen = (s === null || s === void 0 ? void 0 : s.length) || 0;
                    return s + ' '.repeat(w - sLen);
                };
                let justifyRight = (s, w) => {
                    const sLen = (s === null || s === void 0 ? void 0 : s.length) || 0;
                    return ' '.repeat(w - sLen) + s;
                };
                let center = (s, w) => {
                    const sLen = (s === null || s === void 0 ? void 0 : s.length) || 0;
                    const spacesLeft = Math.ceil((w - sLen) / 2);
                    const spacesRight = w - sLen - spacesLeft;
                    return ' '.repeat(spacesLeft) + s + ' '.repeat(spacesRight);
                };
                let grid = [];
                for (const row of tbody.children) {
                    if (isDomNode(row) && row.tag === "tr") {
                        let cellsInCurrentRow = [];
                        for (const cell of row.children) {
                            if (isDomNode(cell)) {
                                cellsInCurrentRow.push({
                                    innerMarkup: this.renderNode(cell),
                                    header: cell.tag === "th",
                                    align: cell.attributes.align,
                                });
                            }
                        }
                        grid.push(cellsInCurrentRow);
                    }
                }
                let columnWidths = [];
                for (let i = 0; i < grid[0].length; i++) {
                    columnWidths.push(Math.max(...grid.map(row => { var _a; return ((_a = row[i].innerMarkup) === null || _a === void 0 ? void 0 : _a.length) || 0; })));
                }
                let tableMarkup = [];
                let isFirstRow = true;
                for (const row of grid) {
                    let rowMarkup = [];
                    for (const column in row) {
                        const cell = row[column];
                        const innerMarkup = cell.innerMarkup;
                        const columnWidth = columnWidths[column];
                        if (cell.align === "center") {
                            rowMarkup.push(center(innerMarkup, columnWidth));
                        }
                        else if (cell.align === "right") {
                            rowMarkup.push(justifyRight(innerMarkup, columnWidth));
                        }
                        else {
                            rowMarkup.push(justifyLeft(innerMarkup, columnWidth));
                        }
                    }
                    tableMarkup.push("| " + rowMarkup.join(" | ") + " |");
                    if (isFirstRow) {
                        let rowMarkup = [];
                        for (const column in row) {
                            const columnWidth = columnWidths[column];
                            rowMarkup.push("-".repeat(columnWidth));
                        }
                        tableMarkup.push("|-" + rowMarkup.join("-|-") + "-|");
                        isFirstRow = false;
                    }
                }
                return tableMarkup.join("\n") + "\n\n";
            },
            "tr": () => null,
            "td": (_, im) => im,
            "th": (_, im) => im,
            "*": (node, im) => {
                return `<${node.tag}>${im.trim()}</${node.tag}>\n`;
            },
        };
        rules["div"] = rules["p"];
        rules["ol"] = rules["ul"];
        return rules;
    }
    getNodeText(node) {
        if (isTextNode(node)) {
            return node.textContent || "";
        }
        else if (isDomNode(node)) {
            return node.children.map(child => this.getNodeText(child)).join(" ");
        }
        else {
            return null;
        }
    }
    renderNode(node) {
        if (isTextNode(node)) {
            return node.textContent || "";
        }
        else if (isDomNode(node)) {
            const innerMarkup = node.children.map(child => this.renderNode(child)).join("");
            return this.executeRule(node, innerMarkup);
        }
        else {
            console.error("Unknown type of node", node);
            throw new Error("Unknown type of node");
        }
    }
    getNextNode(node) {
        if (node.parentNode == null) {
            return null;
        }
        let isNext = false;
        for (const n of node.parentNode.children) {
            if (isNext) {
                return n;
            }
            else if (n === node) {
                isNext = true;
            }
        }
        return null;
    }
    executeRule(node, innerMarkup) {
        if (node.tag in this.rules) {
            return this.rules[node.tag](node, innerMarkup);
        }
        else {
            return this.rules["*"](node, innerMarkup);
        }
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
