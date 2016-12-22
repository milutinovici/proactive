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

export function compileBindingExpression<T>(expression: string): ICompiledExpression<T | null> {
    expression = expression.trim();
    let fn: ICompiledExpression<T | null>;
    if (expression === "") {
        fn = ($context?, $element?) => null;
    }
    const readBody = `with($context){with($data||{}){return ${expression};}}`;
    fn =  <any> new Function("$context", "$element", readBody);
    fn.text = expression;
    if (canWrite(expression)) {
        const writeBody = `with($context){with($data||{}){return function(_z){ ${expression} = _z;}}}`;
        fn.write = <any> new Function("$context", "$element", writeBody);
    }
    return (ctx: IDataContext, el: Element) => {
            try {
                let result = fn(ctx, el);
                return result;
            } catch (e) {
                exception.next(new Error(`Binding expression "${fn.text}" on element ${el.nodeName} failed. ${e.message}`));
                return null;
            }
        };
}

export function expressionToObservable<T>(exp: ICompiledExpression<T>, ctx: IDataContext, element: Element): Rx.Observable<T | null> {
    let result = exp(ctx, element);
    if (isRxObservable(result)) {
        return result;
    } else { // wrap it
        return Rx.Observable.of(result);
    }
}
