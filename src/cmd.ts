import * as path from "path";
import * as fs from "fs-extra";
import * as prog from "caporal";
import Dockposer from "./index";
import { validaHost } from "./util";
import {
  Host,
  CommandArguments,
  CommandBuildOptions,
  CommandDeployOptions
} from "./type";

const pkg = require("../package.json");

const composer = new Dockposer({
  cwd: process.cwd()
});

prog.version(pkg.version).description(pkg.description);

prog
  .command("build", "Build an image")
  .argument("<tag>", "Specified the tag for image")
  .option("--dockerfile <dockerfile>", "Specified Dockerfile", prog.STRING)
  .option("--args <args>", "Docker build arguments", prog.STRING)
  .option("--cwd <cwd>", "Specified current working directory", prog.STRING)
  .action((args: CommandArguments, options: CommandBuildOptions) => {
    if (options.cwd) {
      composer.options.cwd = options.cwd;
    }

    return composer.build(args.tag, {
      dockerfile: options.dockerfile,
      args: []
    });
  });

prog
  .command("push", "Push image to registry")
  .argument("<tag>", "Specified the tag for image")
  .action((args: CommandArguments, options, logger) => {
    return composer.push(args.tag);
  });

prog
  .command("deploy", "Deploy image to remote host")
  .argument("<tag>", "Specified the tag for image")
  .option("--cwd <cwd>", "Specified current working directory", prog.STRING)
  .option(
    "--hostfile <hostfile>",
    "Specified the host json file.",
    prog.STRING,
    "dockercomposer.host.json"
  )
  .option("--name <name>", "the name of server", prog.STRING)
  .option("--host <host>", "Specified the host", prog.STRING)
  .option("--port <port>", "Specified the port", prog.STRING)
  .option("--username <username>", "Specified the username", prog.STRING)
  .option("--password <password>", "Specified the password", prog.STRING)
  .option("--path <path>", "Specified the path of the host", prog.STRING)
  .action(async (args: CommandArguments, options: CommandDeployOptions) => {
    if (options.cwd) {
      composer.options.cwd = options.cwd;
    }
    const hostPath = path.join(composer.options.cwd, options.hostfile);

    let host: Host = {
      path: "/",
      host: "",
      username: "",
      password: "",
      port: 22
    };

    if (await fs.pathExists(hostPath)) {
      const json: Host = await fs.readJSON(hostPath);
      host = { ...host, ...json };
    } else {
      // read it from options
      host.name = options.name;
      host.path = options.path;
      host.host = options.host;
      host.port = options.port;
      host.username = options.username;
      host.password = options.password;
    }

    // valida host schema
    try {
      validaHost(host);
    } catch (err) {
      console.log(`Invalid schema of host file.`);
      throw err;
    }

    return composer.deploy(args.tag, { server: host });
  });

export default function(args = process.argv) {
  prog.parse(args);
}
