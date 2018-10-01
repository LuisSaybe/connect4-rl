import express from 'express';
import mongodb from 'mongodb';
import Connect4MonteCarloTrainer from 'js/Connect4MonteCarloTrainer';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import fs from 'fs';

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

const run = () => {
  mongodb.MongoClient.connect('mongodb://mongo:27017', { useNewUrlParser: true }, async (err, client) => {
    const db = client.db('connect4-js');
    const collection = db.collection(DatabaseMutableEpisolonPolicy.collectionName);
    collection.createIndex({policyId: 1, state : 1, action: 1}, {unique:true});

    const trainer = new Connect4MonteCarloTrainer(db);

    app.get('/train/:episodes', (req, res) => {
      res.status(200).send('training started!');

      const episodes = Number(req.params.episodes);

      trainer.getPolicy(1, episodes, 0.1, db).then((result) => {
        if (result.policy.hasOwnProperty('db')) {
          console.log('training finished');
        } else {
          fs.writeFile('output/output.json', JSON.stringify(result), 'utf8', () => {
            console.log('finished writing output.json');
          });
        }
      });
    });

    app.listen(8080, () => console.log('app listening!'));
  });
};

export default run;
