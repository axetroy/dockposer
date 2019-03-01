import * as path from "path";
import * as exec from "execa";
import * as fs from "fs-extra";
import { Client as SSH } from "ssh2";
import chalk from "chalk";

interface Options {
  cwd: string;
}

interface BuildOptions {
  tag: string;
  dockerfile?: string;
  args?: string[];
}

interface PushOptions {
  tag: string;
}

interface DeployOptions {
  tag: string;
  server: Host;
  dir?: string; // the dir should upload to server/path
}

export interface Host {
  path: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

class Composer {
  constructor(public options: Options) {}
  /**
   * Build image
   * @param {BuildOptions} options
   * @memberof Composer
   */
  public async build(options: BuildOptions) {
    const { cwd } = this.options;
    const dockerfile = options.dockerfile;
    const tag = await this.formatTag(options.tag);
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
      "--no-cache",
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
   * @param {PushOptions} options
   * @memberof Composer
   */
  public async push(options: PushOptions) {
    const { cwd } = this.options;
    const tag = await this.formatTag(options.tag);

    const command = ["docker", "push", tag, cwd];

    await exec(command.shift(), command, { cwd, stdio: "inherit" });
  }
  /**
   * deploy image to
   * @param {DeployOptions} options
   * @memberof Composer
   */
  public async deploy(options: DeployOptions) {
    const { server } = options;
    const tag = await this.formatTag(options.tag);

    const connection = new SSH();

    console.log(
      chalk.yellow(`Connect to ${chalk.green(server.host + ":" + server.port)}`)
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
        const imageVersion = tag.match(/:(.*)$/)[1];
        const inputFile = `${server.path}/docker-compose.yml`;
        const input = `cat ${inputFile}`;
        // custom name
        const filter =
          "sed -E 's/(photon\\/t-mall-web:)([0-9.A-Za-z]+)/\\" +
          `1${imageVersion}/g'`;
        const outputFile = `${server.path}/docker-compose-1.yml`;
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

export default Composer;
