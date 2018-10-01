import StochasticHelper from 'js/StochasticHelper';

export default class DatabaseMutableEpisolonPolicy {
  static collectionName = 'policy';

  constructor(epsilon, actions, policyId, db) {
    this.epsilon = epsilon;
    this.actions = actions;
    this.policyId = policyId;
    this.db = db;
  }

  setEpsilon(epsilon) {
    this.epsilon = epsilon;
  }

  async getActionProbabilities(state) {
    const collection = this.db.collection(DatabaseMutableEpisolonPolicy.collectionName);
    const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);

    const futures = this.actions.map((action, index) => {
      return this.setProbability(state, action, probabilities[index]);
    });

    await Promise.all(futures);

    return new Promise((resolve, reject) => {
      collection.find({policyId : this.policyId, state }).toArray((err, documents) => {
        if (err) {
          reject(err);
        } else {
          const actionToProbabilities = {};

          for (const document of documents) {
            actionToProbabilities[document.action] = document.probability;
          }

          resolve(actionToProbabilities);
        }
      });
    });
  }

  setProbability(state, action, probability) {
    const collection = this.db.collection(DatabaseMutableEpisolonPolicy.collectionName);

    return new Promise((resolve, reject) => {
      collection.updateOne(
        {
          policyId: this.policyId,
          state,
          action
        },
        {
          $set: {
            probability
          }
        },
        {
          upsert: true
        }, function(err, r) {
          if (err) {
            reject(err);
          } else {
            resolve(r);
          }
        }
      );
    });
  }

  async getNextAction(state, unavailableActions) {
    const random = Math.random() < this.epsilon;

    if (random) {
      const selection = this.actions.filter(action => !unavailableActions.includes(action));
      return StochasticHelper.arrayRandom(selection);
    }

    const probabilities = await this.getActionProbabilities(state);

    const actions = Object.keys(probabilities).map(Number);
    const probabilitiesAsArray = actions.map(action => probabilities[action]);
    const result = StochasticHelper.selectFromProbabilityDistribution(
      probabilitiesAsArray,
      actions,
      unavailableActions
    );

    return result;
  }
}
