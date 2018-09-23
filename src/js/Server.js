import express from 'express';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';
import fs from 'fs';

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/train', (_, res) => {
  res.status(200).send('training started!');

  const episodes = Math.pow(10, 6);
  const start = new Date();
  const result = OnPolicyFirstVisitMonteCarloControl.getAgent(episodes);
  const duration = new Date() - start;
  const data = {
    ...result,
    duration,
    episodes,
  };

  fs.writeFile('output/output.json', JSON.stringify(data), 'utf8', () => {
    console.log('finished writing output.json');
  });
});


export default app;