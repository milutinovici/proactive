import * as it from "tape";
const tapeDom = require("tape-dom");

if (tapeDom) {
    tapeDom.installCSS();
    tapeDom.stream(it);
}

import "./bindingProvider-spec";
/////////////////////////
/// bindings specs
/////////////////////////
import "./bindings/text-spec";
import "./bindings/attr-spec";
import "./bindings/component-spec";
import "./bindings/css-spec";
import "./bindings/event-spec";
import "./bindings/if-spec";
import "./bindings/value-spec";
import "./bindings/checked-spec";
import "./bindings/as-spec";
import "./bindings/for-spec";
