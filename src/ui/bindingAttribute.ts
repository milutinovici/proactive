import { exception } from "./exceptionHandlers";
import { Observable, Observer } from "rxjs";
import { IDataContext, IBindingAttribute } from "./interfaces";
import { isRxObservable } from "./utils";

export class BindingAttribute<T> implements IBindingAttribute {
    public readonly tag: string;
    public readonly name: string;
    public readonly text: string;
    public readonly parameter?: string;

    constructor(tag: string, name: string, text: string, parameter?: string) {
        this.tag = tag;
        this.name = name;
        this.text = text.trim();
        this.parameter = parameter;
    }

    public toObservable(ctx: IDataContext): Observable<T | null> {
        let result = this.expression(ctx);
        if (isRxObservable(result)) {
            return result;
        } else { // wrap it
            return Observable.of(result);
        }
    }

    public expression(ctx: IDataContext): T | null {
        try {
            const readBody = this.text ? `with($context){with($data||{}){return ${this.text};}}` : "return null;";
            let read = new Function("$context", "exception", readBody) as (ctx: IDataContext, ex: Observer<Error>) => T | null;
            return read(ctx, exception);
        } catch (e) {
            exception.next(new Error(`Binding expression "${this.text}" on element ${this.tag} failed. ${e.message}`));
            return null;
        }
    };

    public writeExpression(ctx: IDataContext): (value: any) => void {
        try {
            if (this.canWrite(this.text)) {
                const writeBody = `with($context){with($data||{}){return function(_z){ ${this.text} = _z;}}}`;
                return new Function("$context", writeBody)(ctx) as (value: T) => void;
            } else {
                return (value: T) => {};
            }
        } catch (e) {
            exception.next(new Error(`Binding expression "${this.text}" on element ${this.tag} failed. ${e.message}`));
            return (value: T) => {};
        }
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
