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

  getActionProbabilities(state) {
    if (!this.policy.hasOwnProperty(state)) {
      const probabilities = StochasticHelper.getRandomProbabilityDistribution(this.actions.length);
      this.actions.forEach((action, index) => this.setProbabilities(state, action, probabilities[index]));
    }

    return this.policy[state];
  }

  getProbability(state, action) {
    return this.policy[state][action];
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
