import express from 'express';
import mongodb from 'mongodb';
import Board from 'js/Board';
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
      collection.createIndex({policyId: 1, state : 1}, {unique:true});

      const stateActionAverageCollection = db.collection(DatabaseOnPolicyFirstVisitMonteCarloControl.stateActionAverageCollectionName);
      stateActionAverageCollection.createIndex({controlId: 1, state : 1, action: 1}, {unique:true});

      resolve(db);
    });
  });
};

const run = async () => {
  const db = await getDatabase();
  const trainer = new Connect4MonteCarloTrainer(db, (message) => {
    console.log(new Date());
    console.log(message);
  });

  app.get('/train/:episodes', async (req, res) => {
    res.status(200).send('training started!');

    const { policy } = await trainer.train(0.1, Number(req.params.episodes));
    console.log('policy', policy);
  });

  app.get(`/policy/:policyId/:state`, async (req, res) => {
    const policy = new DatabaseMutableEpisolonPolicy(
      db,
      0,
      Board.ACTIONS,
      new mongodb.ObjectId(req.params.policyId)
    );
    const probabilities = await policy.getActionProbabilities(req.params.state);
    res.json(probabilities);
  });

  app.listen(8080, () => console.log('app listening!'));
};

export default run;
