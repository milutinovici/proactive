export class HtmlEngine {
    private document: Document;
    constructor(document: Document) {
        this.document = document;
    }
    public parse(data: string): DocumentFragment {
        if (this.document.createRange !== undefined) {
            const range = this.document.createRange();
            range.selectNode(this.document.body); // required in Safari
            return range.createContextualFragment(data);
        } else {
            const div = this.document.createElement("div");
            div.innerHTML = data;
            const nodes = Array.prototype.slice.call(div.childNodes);
            const fragment = this.createFragment();
            for (let i = 0; i < nodes.length; i++) {
                fragment.appendChild(nodes[i]);
            }
            return fragment;
        }
    }
    public createEvent(event: string): Event {
        const evt = this.document.createEvent("HTMLEvents");
        evt.initEvent(event, false, true);
        return evt;
    }
    public createFragment(): DocumentFragment {
        return this.document.createDocumentFragment();
    }
    public isFragment(obj: Node) {
        return obj.nodeType === this.document.DOCUMENT_FRAGMENT_NODE;
    }
    // public isTemplate(obj: Node) {
    //     return obj.nodeType === this.document.Htmlte;
    // }
    public createComment(data: string): Comment {
        return this.document.createComment(data);
    }
    public nodeListToFragment(nodes: NodeList): DocumentFragment {
        const fragment = this.createFragment();
        for (let i = 0; i < nodes.length; i++) {
            fragment.appendChild(nodes[i]);
        }
        return fragment;
    }
    public getElementById(id: string) {
        return this.document.getElementById(id);
    }
}

// export const html = new HtmlTemplateEngine(document);
