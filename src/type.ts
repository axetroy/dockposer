export interface DockposerOptions {
  cwd: string;
}

export interface DockposerBuildOptions {
  dockerfile?: string;
  args?: string[];
}

export interface DockposerDeployOptions {
  server: Host;
}

export interface Host {
  name?: string; // alias name for the server
  path: string; // where is your `docker-compose.yml` in remote server
  host: string; // host address
  port: number; // SSH port
  username: string; // username for the server
  password: string; // password for the server
}

export interface CommandArguments {
  tag: string;
}

export interface CommandBuildOptions extends DockposerBuildOptions {
  cwd?: string;
}

export interface CommandDeployOptions extends DockposerDeployOptions {
  cwd?: string;
  hostfile?: string;
  name?: string;
  path?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}
