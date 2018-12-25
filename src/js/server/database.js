import mongodb from 'mongodb';

export const EPISODE_COLLECTION = 'episode';
export const STATE_ACTION_AVERAGE_COLLECTION = 'state_action_average';
export const SESSION_COLLECTION = 'session';
export const POLICY_COLLECTION = 'policy';
export const POLICY_ACTION_PROBABILITIES_COLLECTION = 'policy_action_probabilities';

export const getDatabase = async () => {
  const dbName = 'connect4';
  const client = await mongodb.MongoClient.connect(`mongodb://mongo:27017/${dbName}`, { useNewUrlParser: true });
  const db = client.db(dbName);

  const sessionCollection = db.collection(SESSION_COLLECTION);
  await sessionCollection.createIndex({ created: 1 });
  await sessionCollection.createIndex({ policyId: 1 });

  const policyActionProbabilities = db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION);
  await policyActionProbabilities.createIndex({  policyId: 1, state : 1 }, { unique:true });
  await policyActionProbabilities.createIndex({ policyId: 1 });

  const stateActionAverageCollection = db.collection(STATE_ACTION_AVERAGE_COLLECTION);
  await stateActionAverageCollection.createIndex({ sessionId: 1, state : 1, action: 1 }, { unique:true });
  await stateActionAverageCollection.createIndex({ sessionId: 1 });

  const episodeCollection = db.collection(EPISODE_COLLECTION);
  await episodeCollection.createIndex({ serialization: 1, seriesId: 1 }, { unique:true });
  await episodeCollection.createIndex({ seriesId: 1 });
  await episodeCollection.createIndex({ policyId: 1 });
  await episodeCollection.createIndex({ created: 1 });

  return db;
};
