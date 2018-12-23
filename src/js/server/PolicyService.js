import { POLICY_COLLECTION, POLICY_ACTION_PROBABILITIES_COLLECTION } from 'js/server/database';
import { DEFAULT_BATCH_SIZE } from 'js/server';

export class PolicyService {
  constructor(db) {
    this.db = db;
  }

  save(policy) {
    return this.db.collection(POLICY_COLLECTION).findOneAndUpdate(
        {
          _id: policy._id
        },
        {
          $set: {
            epsilon: policy.epsilon,
            actions: policy.actions,
            created: new Date()
          }
        },
        {
          returnOriginal: false,
          upsert: true
        }
    );
  }

  async clone(_id) {
    const policy = await this.db.collection(POLICY_COLLECTION).findOne({ _id });
    const { insertedId } = await this.db.collection(POLICY_COLLECTION)
      .insertOne({
        epsilon: policy.epsilon,
        actions: policy.actions,
        created: new Date()
      });

    const copyStateActionsProbabilities = async () => {
      const collection = this.db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION);
      const cursor = collection.find({
        policyId: _id
      }, {
        batchSize: DEFAULT_BATCH_SIZE
      });

      const options = { ordered: false };
      let documents = [];

      for (let document = await cursor.next(); document !== null; document = await cursor.next()) {
        document.policyId = insertedId;
        delete document._id;

        documents.push(document);

        if (documents.length === DEFAULT_BATCH_SIZE) {
          await collection.insertMany(documents, options);
          documents = [];
        }
      }

      await collection.insertMany(documents, options);
    };

    setTimeout(copyStateActionsProbabilities);

    return this.db.collection(POLICY_COLLECTION).findOne({ _id: insertedId });
  }
}
