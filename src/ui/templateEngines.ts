
export default class HtmlTemplateEngine {
    public parse(data: string): Node[] {
        const context = document.implementation.createHTMLDocument("");
        context.documentElement.insertAdjacentHTML("afterbegin", data);
        const arr: Node[] = [];
        for (let i = 0, n: Node; n = context.body.childNodes[i]; ++i) {
            arr.push(n);
        }
        return arr;
    }
}
