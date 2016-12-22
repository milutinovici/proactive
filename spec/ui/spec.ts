import * as it from "tape";
const tapeDom = require("tape-dom");

if (tapeDom) {
    tapeDom.installCSS();
    tapeDom.stream(it);
}

// import "./bindingProvider-spec";
// import "./expressionCompiler-spec";
import "./bindings-spec";
