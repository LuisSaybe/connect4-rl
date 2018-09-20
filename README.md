### build image

```sh
npm -g install yarn
yarn
cd docker
docker build --rm -t connect4-rl .
```


### mount volume and start nginx

```sh
docker run -it -p 80:80 --rm -v $(pwd):/root/connect4-rl --name connect4-rl connect4-rl
```

### watch for changes

```sh
npm run watch
```

### run from github

```sh
docker run -it -p 80:80  --rm --name connect4-rl connect4-rl
```
