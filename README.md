# dockposer

![Node](https://img.shields.io/badge/node-%3E=7.6-blue.svg?style=flat-square)
[![DeepScan grade](https://deepscan.io/api/teams/5773/projects/7591/branches/79794/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5773&pid=7591&bid=79794)
[![npm version](https://badge.fury.io/js/dockposer.svg)](https://badge.fury.io/js/dockposer)
![Size](https://github-size-badge.herokuapp.com/axetroy/dockposer.svg)

docker-compose extra tool for easy deployment.

## Feature

- [x] Build docker image
- [x] Push docker image to registry
- [x] Deploy docker-compose to remote server
- [x] No need to install on the server side

## Requirement

Before you start using this tool, you need to make sure that you meet the conditions

1. `Docker` and `Docker composer` installed in your local/remote machine
2. remote machine only support Linux/Unix system

## Quickly start

```bash
# install in your local machine
npm install dockposer -g
```

add scripts for `package.json`

```diff
{
  ...
  "scripts": {
    ...
+   "build": "dockposer build your_tag_name:{NPM_PACKAGE_VERSION}",
+   "push": "dockposer push your_tag_name:{NPM_PACKAGE_VERSION}",
+   "deploy": "dockposer deploy your_tag_name:{NPM_PACKAGE_VERSION}"
  }
}
```

run command to easy deploy

```bash
npm run build
npm run push
npm run deploy
```

### dockposer build <tag>

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

I can simplify the above steps with `dockposer`.

```bash
npm version 1.2.0
# when found `NPM_PACKAGE_VERSION`. it will read the version field from `package.json`
dockposer build your_tag_name:{NPM_PACKAGE_VERSION}
dockposer push your_tag_name:{NPM_PACKAGE_VERSION}
```

### dockposer push <tag>

Like `Docker push`. But it supports custom variables

```bash
dockposer push your_tag_name:{NPM_PACKAGE_VERSION}
```

### dockposer deploy <tag>

deploy the image on remote server with `docker-compose`.

First we have to know which server to deploy to.

The default configuration file `dockposer.host.json` is stored in the current working directory.

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

eg. `${cwd}/dockposer.host.json`

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
dockposer deploy your_tag_name:1.2.0
```

**What did it do?**

1. read config from `dockposer.host.json`
2. connect to remote server with ssh protocol
3. run command `docker pull your_tag_name:1.2.0` in remote server
4. cd to `/home/test/my_app` and open `docker-compose.yaml`, update `your_tag_name:<old_version>` to `your_tag_name:1.2.0`.
5. run command `docker-compose down && docker-compose up -d` in remote server to restart.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

| [<img src="https://avatars1.githubusercontent.com/u/9758711?v=3" width="100px;"/><br /><sub>Axetroy</sub>](http://axetroy.github.io)<br />[💻](https://github.com/axetroy/dockposer/commits?author=axetroy) 🔌 [⚠️](https://github.com/axetroy/dockposer/commits?author=axetroy) [🐛](https://github.com/axetroy/dockposer/issues?q=author%3Aaxetroy) 🎨 |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |


<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

The [License](https://github.com/axetroy/dockposer/blob/master/LICENSE)
