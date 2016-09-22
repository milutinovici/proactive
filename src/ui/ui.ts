import { DomManager } from "./domManager";
import HtmlTemplateEngine from "./templateEngines";
import { ProactiveUI } from "./proactiveUI";

const app = new ProactiveUI(new DomManager(), new HtmlTemplateEngine());
export = app;
