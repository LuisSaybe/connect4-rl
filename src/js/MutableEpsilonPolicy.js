import StochasticHelper from 'js/StochasticHelper';

export default class MutableEpsilonlonPolicy {
  constructor(epsilon, actions) {
    this.epsilon = epsilon;
    this.policy = {};
    this.actions = actions;
  }

  setEpsilon(epsilon) {
    this.epsilon = epsilon;
  }

  async getActionProbability(state) {
    if (!this.policy.hasOwnProperty(state)) {
      const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);
      const futures = this.actions.map((action, index) => this.setProbability(state, action, probabilities[index]));
      await Promise.all(futures);
    }

    return Promise.resolve(this.policy[state]);
  }

  async getNextAction(state, unavailableActions) {
    const random = Math.random() < this.epsilon;

    let result;

    if (random) {
      const selection = this.actions.filter(action => !unavailableActions.includes(action));
      result = StochasticHelper.arrayRandom(selection);
    } else {
      const probabilities = await this.getActionProbability(state);

      const actions = Object.keys(probabilities).map(Number);
      const probabilitiesAsArray = actions.map(action => probabilities[action]);
      result = StochasticHelper.selectFromProbabilityDistribution(
        probabilitiesAsArray,
        actions,
        unavailableActions
      );
    }

    return result;
  }

  setProbability(state, action, probability) {
    if (!this.policy.hasOwnProperty(state)) {
      this.policy[state] = {};
    }

    this.policy[state][action] = probability;
    return Promise.resolve();
  }
}
