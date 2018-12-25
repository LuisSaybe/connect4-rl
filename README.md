### build image

```sh
npm -g install yarn
yarn
cd docker
docker build --rm -t connect4-rl .
```


### run from github

```sh
docker-compose down
docker-compose up
```

### watch for web changes

```sh
npm run watch-web
```

### watch for server changes

```sh
npm run watch-server
```
