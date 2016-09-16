import * as it from "tape";

if (typeof(window) === "object") {
    const tapeDom = require("tape-dom");
    tapeDom.installCSS();
    tapeDom.stream(it);
}

import "./text-spec";
import "./attr-spec";
import "./checked-spec";
import "./component-spec";
import "./css-spec";
import "./event-spec";
import "./if-spec";
import "./value-spec";
import "./with-spec";
import "./repeat-spec";
