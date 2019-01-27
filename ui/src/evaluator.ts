import { exception } from "./exceptionHandlers";
import { IScope } from "./interfaces";

export class Evaluator {

    public static read<T>(scope: IScope, text: string): T {
        try {
            const fn = Evaluator.expressionCache.get(text);
            if (fn !== undefined) {
                return fn(scope);
            } else {
                const readBody = text ? `with($scope){with($data||{}){return ${text};}}` : "return null;";
                const read = new Function("$scope", readBody) as (scope: IScope) => T;
                Evaluator.expressionCache.set(text, read);
                return read(scope);
            }
        } catch (e) {
            exception.next(new Error(`directive ${this.name}="${text}" failed. ${e.message}`));
            return null as any;
        }
    }
    public static write<T>(scope: IScope, text: string): (value: T) => void {
        try {
            const fn = Evaluator.writeCache.get(text);
            if (fn !== undefined) {
                return fn(scope);
            } else if (this.canWrite(text)) {
                const writeBody = `with($scope){with($data||{}){return function(_z){ ${text} = _z;}}}`;
                const write = new Function("$scope", writeBody);
                Evaluator.writeCache.set(text, write);
                return write(scope) as (value: T) => void;
            } else {
            return (value: T) => {};
          }
        } catch (e) {
            exception.next(new Error(`directive ${this.name}="${text}" failed. ${e.message}`));
            return (value: T) => {};
        }
    }
    private static expressionCache = new Map<string, Function>();
    private static writeCache = new Map<string, Function>();

    private static canWrite(expression: string): boolean {
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
