import StochasticHelper from 'js/StochasticHelper';

export default class MutableEpsilonlonPolicy {
  constructor(epsilon, actions) {
    this.epsilon = epsilon;
    this.policy = {};
    this.actions = actions;
  }

  getActionProbabilities(state) {
    if (!this.policy.hasOwnProperty(state)) {
      const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);
      const result = {};
      this.actions.forEach((action, index) => result[action] = probabilities[index]);
      this.policy[state] = result;
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

  setProbabilities(state, probabilities) {
    this.policy[state] = probabilities;
    return Promise.resolve();
  }
}
