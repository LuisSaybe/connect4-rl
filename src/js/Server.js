import express from 'express';
import mongodb from 'mongodb';
import Connect4MonteCarloTrainer from 'js/Connect4MonteCarloTrainer';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import fs from 'fs';

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/train/:episodes', (req, res) => {
  res.status(200).send('training started!');
  const episodes = Number(req.params.episodes);
  console.log('started training with ' + episodes);
  const result = Connect4MonteCarloTrainer.getPolicy(1, episodes, 0.1);
  console.log('training finished');

  fs.writeFile('output/output.json', JSON.stringify(result), 'utf8', () => {
    console.log('finished writing output.json');
  });
});

const run = () => {
  mongodb.MongoClient.connect('mongodb://mongo:27017', (err, client) => {
    const db = client.db('connect4-js');

    const policy = new DatabaseMutableEpisolonPolicy(0.1, [0, 1, 2, 3, 4, 5, 6], '1234', db);
    console.log(policy);

    client.close();
  });
};

export default run;
