// Loaded with `node --import`: lets tests import the app's TypeScript via the "@/" alias.
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
