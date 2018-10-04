import express from 'express';
import mongodb from 'mongodb';
import Connect4MonteCarloTrainer from 'js/Connect4MonteCarloTrainer';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import DatabaseOnPolicyFirstVisitMonteCarloControl from 'js/DatabaseOnPolicyFirstVisitMonteCarloControl';

const app = express();
app.get('/', (req, res) => res.send('Hello World!'));

const getDatabase = async () => {
  return new Promise((resolve, reject) => {
    mongodb.MongoClient.connect('mongodb://mongo:27017', { useNewUrlParser: true }, async (err, client) => {
      if (err) {
        return reject(err);
      }

      const db = client.db('connect4-rl');
      const collection = db.collection(DatabaseMutableEpisolonPolicy.collectionName);
      collection.createIndex({policyId: 1, state : 1});
      collection.createIndex({policyId: 1, state : 1, action: 1}, {unique:true});

      const stateActionAverageCollection = db.collection(DatabaseOnPolicyFirstVisitMonteCarloControl.stateActionAverageCollectionName);
      stateActionAverageCollection.createIndex({controlId: 1, state : 1, action: 1}, {unique:true});
      stateActionAverageCollection.createIndex({controlId: 1, state : 1});

      resolve(db);
    });
  });
};

const run = async () => {
  const db = await getDatabase();
  const trainer = new Connect4MonteCarloTrainer(db);

  app.get('/train/:episodes', (req, res) => {
    res.status(200).send('training started!');

    const episodes = Number(req.params.episodes);
    trainer.getPolicy(1, episodes, 0.1, db)
  });

  app.listen(8080, () => console.log('app listening!'));
};

export default run;
