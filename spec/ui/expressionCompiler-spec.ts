import * as it from "tape";
import * as compiler from "../../src/ui/expressionCompiler";
// import * as util from "./spec-utils";

it("should return a function", expect => {
    const exp = compiler.compileBindingExpression<any>("");
    expect.assert(typeof(exp) === "function");
    expect.end();
});
