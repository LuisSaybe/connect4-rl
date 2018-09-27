import StochasticHelper from 'js/StochasticHelper';

export default class DatabaseMutableEpisolonPolicy {
  static collectionName = 'policy';

  constructor(epsilon, actions, id, db) {
    this.epsilon = epsilon;
    this.actions = actions;
    this.id = id;
    this.db = db;
  }

  setEpsilon(epsilon) {
    this.epsilon = epsilon;
  }

  getActionProbabilities(state, action) {
    const collection = db.collection(DatabaseMutableEpisolonPolicy.collectionName);

    return new Promise((resolve, reject) => {
      collection.find({_ id : this.id, state }).toArray((err, documents) => {
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
    const collection = db.collection(DatabaseMutableEpisolonPolicy.collectionName);

    return new Promise((resolve, reject) => {
      collection.updateOne(
        {
          _id: this.id
        },
        {
          $set: {
            state,
            action,
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

  getNextAction(state, unavailableActions) {
    const random = Math.random() < this.epsilon;

    if (random) {
      const selection = this.actions.filter(action => !unavailableActions.includes(action));
      return StochasticHelper.arrayRandom(selection);
    }

    const probabilities = this.getActionProbabilities(state);
    const actions = Object.keys(probabilities).map(action => Number(action));
    const probabilitiesAsArray = actions.map(action => probabilities[action]);
    const result = StochasticHelper.selectFromProbabilityDistribution(
      probabilitiesAsArray,
      actions,
      unavailableActions
    );

    return result;
  }

  setProbabilities(state, action, probability) {
    if (!this.policy.hasOwnProperty(state)) {
      this.policy[state] = {};
    }

    this.policy[state][action] = probability;
  }
}
