
export class HtmlTemplateEngine {
    public parse(data: string): Node[] {
        const container = document.createElement("div");
        container.insertAdjacentHTML("afterbegin", data);
        const arr: Node[] = [];
        for (let i = 0, n: Node; n = container.childNodes[i]; ++i) {
            arr.push(n);
        }
        return arr;
    }
}

export const html = new HtmlTemplateEngine();
