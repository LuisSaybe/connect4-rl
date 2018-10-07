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

  getActionProbabilitiesHelper(state) {
    const collection = this.db.collection(DatabaseMutableEpisolonPolicy.collectionName);

    return new Promise((resolve, reject) => {
      collection.find({policyId : this.policyId, state }).toArray((err, document) => {
        if (err) {
          reject(err);
        } else {
          resolve(document);
        }
      });
    });
  }

  async getActionProbabilities(state) {
    let result = await this.getActionProbabilitiesHelper(state);

    if (Object.keys(result).length === 0) {
      const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);
      const actionProbabilities = {};

      this.actions.forEach((action, index) => {
        actionProbabilities[action] = probabilities[index];
      });

      await this.setProbabilities(state, actionProbabilities);
      result = actionProbabilities;
    }

    return result;
  }

  setProbabilities(state, probabilities) {
    const collection = this.db.collection(DatabaseMutableEpisolonPolicy.collectionName);

    return new Promise((resolve, reject) => {
      collection.updateOne(
        {
          policyId: this.policyId,
          state,
        },
        {
          $set: {
            policyId: this.policyId,
            state,
            action,
            probabilities
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
