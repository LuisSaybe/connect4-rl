import express from 'express';
import Connect4MonteCarloTrainer from 'js/Connect4MonteCarloTrainer';
import fs from 'fs';

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/train', (_, res) => {
  res.status(200).send('training started!');
  const result = Connect4MonteCarloTrainer.getPolicy(10, Math.pow(10, 5), 0.1);
  console.log('training finished');

  fs.writeFile('output/output.json', JSON.stringify(result), 'utf8', () => {
    console.log('finished writing output.json');
  });
});


export default app;
