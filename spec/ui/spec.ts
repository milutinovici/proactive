import * as it from "tape";
import * as tapeDom from "tape-dom";

if (tapeDom) {
    tapeDom.installCSS();
    tapeDom.stream(it);
}

import "./bindingProvider-spec";
import "./expressionCompiler-spec";
import "./bindings-spec";
