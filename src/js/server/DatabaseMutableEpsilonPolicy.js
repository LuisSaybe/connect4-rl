import { StochasticHelper } from 'js/common/StochasticHelper';
import { POLICY_ACTION_PROBABILITIES_COLLECTION } from 'js/server/database';

export class DatabaseMutableEpsilonPolicy {
  constructor(db, epsilon, actions, policyId) {
    this.epsilon = epsilon;
    this.actions = actions;
    this.policyId = policyId;
    this.db = db;
  }

  getActionProbabilitiesHelper(state) {
    const collection = this.db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION);
    return collection.findOne({policyId : this.policyId, state });
  }

  async getActionProbabilities(state) {
    let result = await this.getActionProbabilitiesHelper(state);

    if (result === null) {
      const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);
      const newProbability = {};

      this.actions.forEach((action, index) => {
        newProbability[action] = probabilities[index];
      });

      const { value } = await this.setProbabilities(state, newProbability);
      result = value;
    }

    return result.probabilities;
  }

  async setProbabilities(state, probabilities) {
    const collection = this.db.collection(POLICY_ACTION_PROBABILITIES_COLLECTION);

    return await collection.findOneAndUpdate(
      {
        policyId: this.policyId,
        state,
      },
      {
        $set: {
          probabilities
        }
      },
      {
        returnOriginal: false,
        upsert: true
      }
    );
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
