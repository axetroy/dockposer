import { struct } from "superstruct";
import { Host } from "./index";

export function validaHost(host: Host): Host {
  const Article = struct({
    path: "string",
    name: "string",
    host: "string",
    port: "number",
    username: "string",
    password: "string"
  });

  return Article(host);
}
