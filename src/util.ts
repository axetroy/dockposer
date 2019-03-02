import { struct } from "superstruct";
import { Host } from "./type";

export function validaHost(host: Host): Host {
  const Article = struct({
    name: "string?",
    path: "string",
    host: "string",
    port: "number",
    username: "string",
    password: "string"
  });

  return Article(host);
}
