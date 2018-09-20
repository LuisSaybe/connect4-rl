### build

```sh
docker build --rm -t connect4-rl .
```


### watch

```sh
npm run watch
```


### start server

```sh
docker run -v $(pwd):/root/connect4-rl -p 80:80 -it --rm --name connect4-rl connect4-rl
```
