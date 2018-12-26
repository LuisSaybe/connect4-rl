import express from 'express';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';

import { Board } from 'js/common/Board';
import { Environment } from 'js/common/Environment';

import {
  getDatabase,
  POLICY_ACTION_PROBABILITIES_COLLECTION,
  POLICY_COLLECTION,
  EPISODE_COLLECTION,
  SESSION_COLLECTION
} from 'js/server/database';
import { DatabaseMutableEpsilonPolicy } from 'js/server/DatabaseMutableEpsilonPolicy';
import { DatabaseOnPolicyFirstVisitMonteCarloControl } from 'js/server/DatabaseOnPolicyFirstVisitMonteCarloControl';
import { EpisodeService } from 'js/server/EpisodeService';
import { PolicyService } from 'js/server/PolicyService';

export const DEFAULT_BATCH_SIZE = 3000;
export const DEFAULT_LIMIT = 100;

const objectIdRegex = '[a-f\\d]{24}';
const stateRegex = `[${Environment.AGENT_COLOR}${Environment.ADVERSARY_COLOR}${Environment.NONE}]{${6 * 7}}`
const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  const origin = req.headers['origin'];
  const requestHeaders = req.headers['access-control-request-headers'];

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  if (requestHeaders) {
    res.header('Access-Control-Allow-Headers', requestHeaders);
  }

  next();
});

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

  app.get(`/policy/:policyId(${objectIdRegex})`, async (req, res) => {
    const policy = await db.collection(POLICY_COLLECTION)
      .findOne({ _id: new mongodb.ObjectID(req.params.policyId) });

    if (policy === null) {
      res.sendStatus(404);
      return;
    }

    const states = await db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION)
      .countDocuments({ policyId: policy._id });

    res.json({ policy, states });
  });

  app.get('/policy/:policyId/series', async (req, res) => {
    const result = await db.collection(EPISODE_COLLECTION).aggregate([
      {
        $match: {
          policyId: new mongodb.ObjectID(req.params.policyId)
        }
      },
      {
        $group: {
          _id: '$seriesId',
          created: { $max: '$created' },
          count: { $sum: 1 }
        }
      },
      { $sort: { created: -1 } },
      { $limit: DEFAULT_LIMIT }
    ], {
      allowDiskUse: true
    }).toArray();

    res.json(result);
  });

  app.get('/policy', async (_, res) => {
    const policies = await db.collection(POLICY_COLLECTION)
      .find({}, {
        sort: [ [ 'created', -1 ] ],
        limit: DEFAULT_LIMIT
      }).toArray();

    res.json(policies);
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

    const firstDatabasePolicy = new DatabaseMutableEpsilonPolicy(
      db,
      firstPolicy.epsilon,
      firstPolicy.actions,
      firstPolicy._id
    );
    const secondDatabasePolicy = new DatabaseMutableEpsilonPolicy(
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

  app.get(`/policy/:policyId/:state(${stateRegex})`, async (req, res) => {
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

    const policy = new DatabaseMutableEpsilonPolicy(
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

    const policy = new DatabaseMutableEpsilonPolicy(
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
        type: 'MONTE_CARLO_ON_POLICY_FIRST_VISIT',
        sessionId: document._id
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
          $set: {
            index,
            updated: new Date()
          }
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

    if (session === null) {
        res.sendStatus(404);
        return;
    }

    res.json(session);
  });

  app.get(`/series/:seriesId`, async (req, res) => {
    const collection = await db.collection(EPISODE_COLLECTION);
    const seriesId = new mongodb.ObjectID(req.params.seriesId);
    const count = await collection.countDocuments({ seriesId });

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
      },
      {
        $project: {
          _id: '$_id',
          win: {
            $size: {
              $filter: {
                input: '$rewards',
                as: 'reward',
                cond: { $eq: ['$$reward', Environment.WIN_REWARD] }
              }
            }
          },
          loss: {
            $size: {
              $filter: {
                input: '$rewards',
                as: 'reward',
                cond: { $eq: ['$$reward', Environment.LOSE_REWARD] }
              }
            }
          },
          default: {
            $size: {
              $filter: {
                input: '$rewards',
                as: 'reward',
                cond: { $eq: ['$$reward', Environment.DEFAULT_REWARD] }
              }
            }
          }
        }
      }
    ], {
      allowDiskUse: true
    }).toArray();

    const data = policyRewards.map(rewardCount => {
      const total = rewardCount.win + rewardCount.loss + rewardCount.default;

      return {
        winRate: rewardCount.win / total,
        lossRate: rewardCount.loss / total,
        defaultRate: rewardCount.default / total,
        ...rewardCount,
      };
    });

    res.json({
      count,
      data
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
