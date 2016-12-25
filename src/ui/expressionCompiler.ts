import { exception } from "./exceptionHandlers";
import * as Rx from "rxjs";
import { ICompiledExpression, IDataContext } from "./interfaces";
import { isRxObservable } from "./utils";

function canWrite(expression: string): boolean {
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

export function compileBindingExpression<T>(expression: string, twoWay?: boolean): ICompiledExpression<T | null> {
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
    if (twoWay && canWrite(expression)) {
        const writeBody = `with($context){with($data||{}){return function(_z){ ${expression} = _z;}}}`;
        fn["write"] = new Function("$context", "$element", writeBody);
    }
    return fn as ICompiledExpression<T | null>;
}

export function expressionToObservable<T>(exp: ICompiledExpression<T>, ctx: IDataContext, element: Element): Rx.Observable<T | null> {
    let result = exp(ctx, element);
    if (isRxObservable(result)) {
        return result;
    } else { // wrap it
        return Rx.Observable.of(result);
    }
}
