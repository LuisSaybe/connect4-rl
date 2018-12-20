import { POLICY_COLLECTION } from 'js/database';

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
}
