
export class HtmlTemplateEngine {
    public parse(data: string): Node[] {
        const container = document.createElement("div");
        container.insertAdjacentHTML("afterbegin", data);
        const arr: Node[] = [];
        for (let i = 0; container.childNodes[i] !== undefined; i++) {
            arr.push(container.childNodes[i]);
        }
        return arr;
    }
}

export const html = new HtmlTemplateEngine();
