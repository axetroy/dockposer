import * as path from "path";
import * as exec from "execa";
import * as fs from "fs-extra";
import { Client as SSH } from "ssh2";
import chalk from "chalk";
import {
  DockposerOptions,
  DockposerBuildOptions,
  DockposerDeployOptions
} from "./type";

export default class Dockposer {
  constructor(public options: DockposerOptions) {}
  /**
   * Build image
   * @param {string} tag
   * @param {BuildOptions} options
   * @memberof Composer
   */
  public async build(tag: string, options: DockposerBuildOptions) {
    const { cwd } = this.options;
    const dockerfile = options.dockerfile;
    tag = await this.formatTag(tag);
    // ensure Dockerfile exist
    if (dockerfile) {
      const dockerFilePath = path.join(cwd, dockerfile);
      if ((await fs.pathExists(dockerFilePath)) === false) {
        throw new Error(
          `The Dockerfile '${chalk.green(dockerFilePath)}' does not exist.`
        );
      }
    }

    const fileArguments = dockerfile ? ["--file", dockerfile] : [];
    const buildArguments = options.args || [];

    const command = [
      "docker",
      "build",
      "--tag",
      tag,
      cwd,
      ...fileArguments,
      ...buildArguments
    ];

    await exec(command.shift(), command, {
      cwd,
      stdio: "inherit"
    });
  }
  /**
   * Push image to the registry
   * @param {string} tag
   * @memberof Composer
   */
  public async push(tag: string) {
    const { cwd } = this.options;
    tag = await this.formatTag(tag);

    const command = ["docker", "push", tag];

    await exec(command.shift(), command, { cwd, stdio: "inherit" });
  }
  /**
   * deploy image to remote server
   * @param {string} tag
   * @param {DeployOptions} options
   * @memberof Composer
   */
  public async deploy(tag: string, options: DockposerDeployOptions) {
    const { server } = options;
    tag = await this.formatTag(tag);

    const connection = new SSH();

    const address = server.host + ":" + server.port;

    console.log(
      chalk.yellow(
        `Connect to ${chalk.green(
          server.name ? `${server.name}(${address})` : address
        )}`
      )
    );

    process.on("exit", () => {
      connection.destroy();
    });

    // connect to server
    await new Promise((resolve, reject) => {
      connection
        .on("ready", () => {
          resolve();
        })
        .on("error", (err: Error) => {
          reject(err);
        })
        .on("timeout", () => {
          console.log(chalk.red("Connect timeout!"));
        })
        .connect(options.server);
    });

    try {
      console.log(chalk.yellow(`Pulling ${chalk.green(tag)}...`));

      // pull image
      await new Promise((resolve, reject) => {
        connection.exec(`docker pull ${tag}`, (err, stream) => {
          if (err) throw err;
          stream.on("close", (code: number, signal: string) =>
            code ? reject(signal) : resolve()
          );
          stream.stdout.pipe(process.stdout);
          stream.stderr.pipe(process.stderr);
        });
      });

      console.log(chalk.yellow(`Updating docker-compose...`));

      // update docker-compose.yml
      await new Promise((resolve, reject) => {
        const [imageName, imageVersion] = tag.split(":");
        const inputFile = `${server.path}/docker-compose.yml`;
        const input = `cat ${inputFile}`;
        // custom name
        const filter =
          `sed -E 's/(${imageName
            .replace(/\//g, "\\/")
            .replace(/\./, ".")}:)([0-9.A-Za-z]+)/\\` + `1${imageVersion}/g'`;
        const outputFile = `${server.path}/docker-compose.dockposer.yml`;
        const command = `${input} | ${filter} > ${outputFile} && mv -f ${outputFile} ${inputFile}`;

        connection.exec(command, (err, stream) => {
          if (err) throw err;
          stream.on("close", (code: number, signal: string) =>
            code ? reject(signal) : resolve()
          );
          stream.stdout.pipe(process.stdout);
          stream.stderr.pipe(process.stderr);
        });
      });

      console.log(chalk.yellow(`Starting...`));

      // docker-compose down && docker-compose up -d
      await new Promise((resolve, reject) => {
        connection.exec(
          `cd ${server.path} && docker-compose down && docker-compose up -d`,
          (err, stream) => {
            if (err) throw err;
            stream.on("close", (code: number, signal: string) =>
              code ? reject(signal) : resolve()
            );
            stream.stdout.pipe(process.stdout);
            stream.stderr.pipe(process.stderr);
          }
        );
      });

      connection.end();
    } catch (err) {
      connection.end();
      throw err;
    }
  }
  /**
   * normalize the tag
   * @private
   * @param {string} tag
   * @returns
   * @memberof Composer
   */
  private async formatTag(tag: string) {
    tag = tag.trim();
    const { cwd } = this.options;
    const npmReg = /\{\s*NPM_PACKAGE_VERSION\s*\}$/;
    if (npmReg.test(tag)) {
      const packageJsonFilePath = path.join(this.options.cwd, "package.json");
      if ((await fs.pathExists(packageJsonFilePath)) === false) {
        throw new Error(`The package.json is not exist in ${cwd}`);
      }
      const version = require(packageJsonFilePath).version || "latest";
      tag = tag.replace(npmReg, version);
    }

    return tag;
  }
}
