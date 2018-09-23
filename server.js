const server = require('./dist/server').default;

server.listen(8080, () => console.log(`Example app listening on port 8080!`))