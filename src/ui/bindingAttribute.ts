import { exception } from "./exceptionHandlers";
import { Observable } from "rxjs";
import { ICompiledExpression, IDataContext, IBindingAttribute } from "./interfaces";
import { isRxObservable } from "./utils";

export class BindingAttribute<T> implements IBindingAttribute {
    public readonly tag: string;
    public readonly name: string;
    public readonly text: string;
    public readonly parameter?: string;
    public readonly expression: ICompiledExpression<T | null>;

    constructor(tag: string, name: string, text: string, parameter?: string) {
        this.tag = tag;
        this.name = name;
        this.text = text;
        this.parameter = parameter;
        this.expression = this.compileBindingExpression(text);
    }

    public toObservable(ctx: IDataContext, element: Element): Observable<T | null> {
        let result = this.expression(ctx, element);
        if (isRxObservable(result)) {
            return result;
        } else { // wrap it
            return Observable.of(result);
        }
    }

    private compileBindingExpression(expression: string, twoWay?: boolean): ICompiledExpression<T | null> {
        expression = expression.trim();

        let fn = (ctx: IDataContext, el: Element) => {
                try {
                    const readBody = expression ? `with($context){with($data||{}){return ${expression};}}` : "return null;";
                    let read = new Function("$context", "$element", readBody) as (ctx: IDataContext, el: Element) => T | null;
                    return read(ctx, el);
                } catch (e) {
                    exception.next(new Error(`Binding expression "${expression}" on element ${el.nodeName} failed. ${e.message}`));
                    return null;
                }
            };
        fn["text"] = expression;
        if (twoWay && this.canWrite(expression)) {
            const writeBody = `with($context){with($data||{}){return function(_z){ ${expression} = _z;}}}`;
            fn["write"] = new Function("$context", "$element", writeBody);
        }
        return fn as ICompiledExpression<T | null>;
    }

    private canWrite(expression: string): boolean {
        const javaScriptReservedWords = ["true", "false", "null", "undefined"];

        // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
        // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
        // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
        const javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;
        if (javaScriptReservedWords.indexOf(expression) >= 0) {
            return false;
        }
        const match = expression.match(javaScriptAssignmentTarget);
        return match !== null;
    }
}
