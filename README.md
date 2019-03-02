# dockercomposer

![Node](https://img.shields.io/badge/node-%3E=7.6-blue.svg?style=flat-square)
[![npm version](https://badge.fury.io/js/dockercomposer.svg)](https://badge.fury.io/js/dockercomposer)
![Size](https://github-size-badge.herokuapp.com/axetroy/dockercomposer.svg)

docker-compose extra tool for easy deployment.

## Usage

```bash
npm install @axetroy/dockercomposer -g

dockercomposer --help

   composer 0.1.0 - docker-compose extra tool for easy deployment

   USAGE

     composer <command> [options]

   COMMANDS

     build <tag>         Build an image
     push <tag>          Push image to registry
     deploy <tag>        Deploy image to remote host
     help <command>      Display help for a specific command

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
```

## Feature

- [x] Build docker image
- [x] Push docker image to registry
- [x] Deploy docker-compose to remote server
- [x] No need to install on the server side

## Requirement

Before you start using this tool, you need to make sure that you meet the conditions

1. `Docker` and `Docker composer` installed in your local/remote machine
2. remote machine only support Linux/Unix system

## Getting start

This tool has only 3 steps

```bash
# install in your local machine
npm install @axetroy/dockercomposer -g
```

add scripts for `package.json`

```diff
{
  ...
  "scripts": {
    ...
+   "build": "dockercomposer build your_tag_name:{NPM_PACKAGE_VERSION}",
+   "push": "dockercomposer push your_tag_name:{NPM_PACKAGE_VERSION}",
+   "deploy": "dockercomposer deploy your_tag_name:{NPM_PACKAGE_VERSION}"
  }
}
```

the workflow to easy deploy

```bash
npm run build
npm run push
npm run deploy
```

### dockercomposer build <tag>

Like `Docker build`. But it supports custom variables

For example, in an Npm project, we usually need to migrate the version like this, and then package the Docker image.

```bash
## Client Side ##

# migrate npm version to 1.2.0
npm version 1.2.0
# build image for version 1.2.0
docker build --tag your_tag_name:1.2.0 # Here, we need to specify the version to be 1.2.0
# push image to registry
docker push your_tag_name:1.2.0 # specify the version again

## Server Side ##

# pull docker image
docker pull your_tag_name:1.2.0

# open docker-compose.yml and update your_tag_name:<old_version> to your_tag_name:1.2.0.
vi docker-compose.yml

# restart serve
docker-compose down && docker-compose up -d
```

I can simplify the above steps with `dockercomposer`.

```bash
npm version 1.2.0
# when found `NPM_PACKAGE_VERSION`. it will read the version field from `package.json`
dockercomposer build your_tag_name:{NPM_PACKAGE_VERSION}
dockercomposer push your_tag_name:{NPM_PACKAGE_VERSION}
```

### dockercomposer push <tag>

Like `Docker push`. But it supports custom variables

```bash
dockercomposer push your_tag_name:{NPM_PACKAGE_VERSION}
```

### dockercomposer deploy <tag>

deploy the image on remote server with `docker-compose`.

First we have to know which server to deploy to.

The default configuration file `dockercomposer.host.json` is stored in the current working directory.

It has the following fields

```typescript
export interface Host {
  name?: string; // alias name for the server
  path: string; // where is your `docker-compose.yml` in remote server
  host: string; // host address
  port: number; // SSH port
  username: string; // username for the server
  password: string; // password for the server
}
```

eg. `${cwd}/dockercomposer.host.json`

```json
{
  "name": "test server",
  "path": "/home/test/my_app",
  "host": "192.168.0.1",
  "port": 22,
  "username": "root",
  "password": "root"
}
```

Then we run the deployment command. Let's see how it work.

```bash
dockercomposer deploy your_tag_name:1.2.0
```

**What did it do?**

1. read config from `dockercomposer.host.json`
2. connect to remote server with ssh protocol
3. run command `docker pull your_tag_name:1.2.0` in remote server
4. cd to `/home/test/my_app` and open `docker-compose.yaml`, update `your_tag_name:<old_version>` to `your_tag_name:1.2.0`.
5. run command `docker-compose down && docker-compose up -d` in remote server to restart.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

| [<img src="https://avatars1.githubusercontent.com/u/9758711?v=3" width="100px;"/><br /><sub>Axetroy</sub>](http://axetroy.github.io)<br />[💻](https://github.com/axetroy/dockercomposer/commits?author=axetroy) 🔌 [⚠️](https://github.com/axetroy/dockercomposer/commits?author=axetroy) [🐛](https://github.com/axetroy/dockercomposer/issues?q=author%3Aaxetroy) 🎨 |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |


<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

The [License](https://github.com/axetroy/dockercomposer/blob/master/LICENSE)
