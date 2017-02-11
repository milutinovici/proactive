export class HtmlTemplateEngine {
    public parse(data: string): DocumentFragment {
        const range = document.createRange();
        range.selectNode(document.body); // required in Safari
        return range.createContextualFragment(data);
    }
}

export const html = new HtmlTemplateEngine();