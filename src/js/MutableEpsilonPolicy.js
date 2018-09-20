import Environment from 'js/Environment';
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
      this.actions.forEach((action, index) => this.setProbabilities(state, action, probabilities[index]));
    }

    return this.policy[state];
  }

  getNextAction(state, unavailableActions) {
    const random = Math.random() < this.epsilon;

    if (random) {
      const unavailableActionsAsSet = new Set();
      unavailableActions.forEach(action => unavailableActionsAsSet.add(action));
      const selection = this.actions.filter(action => !unavailableActionsAsSet.has(action));
      return StochasticHelper.arrayRandom(selection);
    }

    const probabilities = this.getActionProbabilities(state);
    const probabilitiesAsArray = Object.keys(probabilities)
      .map(action => probabilities[action]);

    return StochasticHelper.selectFromProbabilityDistribution(
      probabilitiesAsArray,
      this.actions,
      unavailableActions
    );
  }

  setProbabilities(state, action, probability) {
    if (!this.policy.hasOwnProperty(state)) {
      this.policy[state] = {};
    }

    this.policy[state][action] = probability;
  }
}
