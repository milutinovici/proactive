import { DomManager } from "./domManager";
import { ProactiveUI } from "./proactiveUI";
import { NodeStateManager } from "./nodeState";

const app = new ProactiveUI(new DomManager(new NodeStateManager()));
export = app;
