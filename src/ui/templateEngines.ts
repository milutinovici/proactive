
export default class HtmlTemplateEngine {
    public parse(data: string): Node[] {
        let context = document.implementation.createHTMLDocument("");
        context.documentElement.insertAdjacentHTML("afterbegin", data);
        let arr: Node[] = [];
        for (let i = 0, n: Node; n = context.body.childNodes[i]; ++i) {
            arr.push(n);
        }
        return arr;
    }
}
