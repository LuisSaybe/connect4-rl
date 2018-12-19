import express from 'express';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';

import Board from 'js/Board';
import {
  getDatabase,
  POLICY_ACTION_PROBABILITIES_COLLECTION,
  POLICY_COLLECTION,
  EPISODE_COLLECTION
} from 'js/database';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import { EpisodeService } from 'js/EpisodeService';
import { PolicyService } from 'js/PolicyService';

const app = express();
app.use(bodyParser.json());

const run = async () => {
  await new Promise(resolve => setTimeout(resolve, 10000));
  const db = await getDatabase();

  app.post('/policy', async (req, res) => {
    const policyService = new PolicyService(db);
    const epsilon = Number(req.body.epsilon);

    if (Number.isNaN(epsilon) || epsilon < 0 || epsilon > 1) {
      res.sendStatus(400);
    }

    const { value } = await policyService.save({
      _id: new mongodb.ObjectID(),
      actions: Board.ACTIONS,
      epsilon
    });

    res.json(value);
  });

  app.post('/policy/:policyId/play/:episodes', async (req, res) => {
    const policy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const service = new EpisodeService(db);
    const seriesId = new mongodb.ObjectID();
    const episodes = Number(req.params.episodes);
    const maximum = Math.pow(10, 8);

    if (Number.isNaN(episodes) || episodes < 0 || episodes > maximum) {
      res.sendStatus(400);
    }

    service.generateEpisodes(policy._id, seriesId, episodes);

    res.json({ seriesId });
  });

  app.get('/policy/:policyId', async (req, res) => {
    const policy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const sap = await db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION)
      .find({ policyId: policy._id })
      .count();

    const series = await db.collection(EPISODE_COLLECTION)
      .distinct('seriesId', { policyId: policy._id });

    res.json({ policy, sap, series });
  });

  app.get(`/policy/:policyId/:state`, async (req, res) => {
    const { epsilon, actions } = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const policy = new DatabaseMutableEpisolonPolicy(
      db,
      epsilon,
      actions,
      policy._id
    );
    const probabilities = await policy.getActionProbabilities(req.params.state);
    res.json(probabilities);
  });

  app.get(`/episode/:seriesId`, async (req, res) => {
    const count = await db.collection(EPISODE_COLLECTION)
      .find({ seriesId: new mongodb.ObjectID(req.params.seriesId) })
      .count();

    res.json({ count });
  });

  app.listen(8080, () => console.log('app listening!'));
};

export default run;
