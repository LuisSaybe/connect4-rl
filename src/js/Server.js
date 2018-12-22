import express from 'express';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';

import Board from 'js/Board';
import {
  getDatabase,
  POLICY_ACTION_PROBABILITIES_COLLECTION,
  POLICY_COLLECTION,
  EPISODE_COLLECTION,
  SESSION_COLLECTION
} from 'js/database';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import { DatabaseOnPolicyFirstVisitMonteCarloControl } from 'js/DatabaseOnPolicyFirstVisitMonteCarloControl';
import { EpisodeService } from 'js/EpisodeService';
import { PolicyService } from 'js/PolicyService';
import Environment from 'js/Environment';

export const DEFAULT_BATCH_SIZE = 3000;

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
      return;
    }

    const { value } = await policyService.save({
      _id: new mongodb.ObjectID(),
      actions: Board.ACTIONS,
      epsilon
    });

    res.json(value);
  });

  app.post('/policy/:policyId', async (req, res) => {
    const policy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const $set = {};

    if (req.body.hasOwnProperty('epsilon')) {
      const epsilon = Number(req.body.epsilon);

      if (!Number.isNaN(epsilon) && epsilon >= 0 && epsilon <= 1) {
        $set.epsilon = epsilon;
      }
    }

    const { value } = await db.collection(POLICY_COLLECTION).findOneAndUpdate({
      _id: policy._id
    }, {
      $set
    }, {
      returnOriginal: false
    });

    res.json(value);
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

  app.post('/policy/:policyId/clone', async (req, res) => {
    const policy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const service = new PolicyService(db);
    const newPolicy = await service.clone(policy._id);
    res.json(newPolicy);
  });

  app.post('/episode/:policyId1/:policyId2/:count', async (req, res) => {
    const firstPolicy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId1) });

    const secondPolicy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId2) });

    if (firstPolicy === null || secondPolicy === null) {
      res.sendStatus(404);
      return;
    }

    const firstDatabasePolicy = new DatabaseMutableEpisolonPolicy(
      db,
      firstPolicy.epsilon,
      firstPolicy.actions,
      firstPolicy._id
    );
    const secondDatabasePolicy = new DatabaseMutableEpisolonPolicy(
      db,
      secondPolicy.epsilon,
      secondPolicy.actions,
      secondPolicy._id
    );

    const service = new EpisodeService(db);
    const seriesId = new mongodb.ObjectID();

    const count = Number(req.params.count);
    service.generateEpisodes(firstDatabasePolicy, secondDatabasePolicy, count, seriesId);

    res.json({
      seriesId
    });
  });

  app.get(`/policy/:policyId/:state`, async (req, res) => {
    const { _id, epsilon, actions } = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const valid = RegExp(`[${Board.NONE}${Board.YELLOW}${Board.RED}]+`).test(req.params.state);

    if (!valid) {
      res.sendStatus(404);
      return;
    }

    const policy = new DatabaseMutableEpisolonPolicy(
      db,
      epsilon,
      actions,
      _id
    );
    const probabilities = await policy.getActionProbabilities(req.params.state);
    res.json(probabilities);
  });

  app.post('/policy/:policyId/update/:seriesId', async (req, res) => {
    const document = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (document === null) {
      res.sendStatus(404);
      return;
    }

    const policy = new DatabaseMutableEpisolonPolicy(
      db,
      document.epsilon,
      document.actions,
      document._id
    );

    const cursor = await db.collection(EPISODE_COLLECTION)
      .find({
        seriesId: new mongodb.ObjectID(req.params.seriesId),
      }, {
        batchSize: DEFAULT_BATCH_SIZE
      });
    const count = await cursor.count();

    if (count === 0) {
      res.status(400).json({ error: 'series_count_0' });
      return
    }

    const gamma = 1;
    const sessionId = new mongodb.ObjectID();
    const monteCarloControl = new DatabaseOnPolicyFirstVisitMonteCarloControl(
      db,
      policy,
      gamma,
      sessionId
    );

    await db.collection(SESSION_COLLECTION)
      .insertOne({
        _id: sessionId,
        count,
        start: new Date(),
        type: 'MONTE_CARLO_ON_POLICY_FIRST_VISIT'
      });

    res.json({ sessionId });

    let index = 0;
    const every = Math.floor(count / 100);

    for (let episode = await cursor.next(); episode != null; episode = await cursor.next(), index++) {
      await monteCarloControl.update(episode.sars);

      if (index % every === 0) {
        db.collection(SESSION_COLLECTION).updateOne({
          _id: sessionId
        }, {
          $set: { index }
        });
      }
    }

    db.collection(SESSION_COLLECTION).updateOne({
      _id: sessionId
    }, {
      $set: {
        end: new Date()
      }
    });
  });

  app.get(`/session/:id`, async (req, res) => {
    const session = await db.collection(SESSION_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.id) });

    res.json(session);
  });

  app.get(`/series/:seriesId`, async (req, res) => {
    const collection = await db.collection(EPISODE_COLLECTION);
    const seriesId = new mongodb.ObjectID(req.params.seriesId);
    const count = await collection.find({ seriesId }).count();

    const policyRewards = await collection.aggregate([
      { $match: { seriesId } },
      {
        $project: {
          policyId: '$policyId',
          sar: {
            $arrayElemAt: [ '$sars', -1 ]
          }
        }
      },
      {
        $group: {
          _id: '$policyId',
          rewards: { $push : '$sar.reward' }
        }
      }
    ], {
      allowDiskUse: true
    }).toArray();

    const statistics = policyRewards.map(({ rewards, _id }) => {
      const wins = rewards.filter(reward => reward === Environment.WIN_REWARD).length;
      const losses = rewards.filter(reward => reward === Environment.LOSE_REWARD).length;
      const ties = rewards.filter(reward => reward === Environment.DEFAULT_REWARD).length;

      return {
        policyId: _id,
        wins,
        winRate: wins / rewards.length,
        losses,
        lossRate: losses / rewards.length,
        ties,
        tieRate: ties / rewards.length
      };
    });

    res.json({
      count,
      statistics
    });
  });

  app.get('/episode/:id', async (req, res) => {
    const document = await db.collection(EPISODE_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.id) });

    if (document === null) {
      res.sendStatus(404);
      return;
    }

    res.json(document);
  });

  app.listen(8080, () => console.log('server started port 8080!'));
};

export default run;
