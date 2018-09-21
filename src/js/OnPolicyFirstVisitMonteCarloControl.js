import Environment from 'js/Environment';
import StochasticHelper from 'js/StochasticHelper';

export default class OnPolicyFirstVisitMonteCarloControl {
  constructor(policy, epsilon, gamma = 0) {
    this.policy = policy;
    this.epsilon = epsilon;
    this.gamma = gamma;
    this.returns = {};
  }

  static stepAppearsInSeries(step, series) {
    for (const { state, action, reward } of series) {
      if (step.state === state && step.action === step.action) {
        return true;
      }
    }

    return false;
  }

  update(episode) {
    const stateActionsToReturns = {};
    let episodeReturns = 0;

    for (let index = episode.length - 2; index > -1; index--) {
      const step = episode[index];
      const stepAfter = episode[index + 1];

      episodeReturns = this.gamma * episodeReturns + stepAfter.reward;

      const previousSARs = episode.slice(0, index);
      const stepDidAppearInSeries = OnPolicyFirstVisitMonteCarloControl.stepAppearsInSeries(step, previousSARs);

      if (!stepDidAppearInSeries) {
        this.appendReturn(episodeReturns);

        const availableActions = Environment.getActionsAvailableInState(step.state);
        const actionReturns = availableActions.map(action => {
        const returns = this.getReturns(step.state, action);

          if (returns.length === 0) {
            returns.push(Math.random());
          }

          const average = StochasticHelper.average(returns);
          return { average, action };
        });

        actionReturns.sort((a, b) => a.average - b.average)
        const bestAction = actionReturns[actionReturns.length - 1].action;

        for (const action of Environment.getActions()) {
          let probability;

          if (availableActions.includes(action)) {
            const denominator = this.epsilon / availableActions.length;

            if (bestAction === action) {
              probability = 1 - this.epsilon + denominator;
            } else {
              probability = denominator;
            }
          } else {
            probability = 0;
          }

          this.policy.setProbabilities(step.state, action, probability);
        }
      }
    }
  }

  appendReturn(state, action, return_instance) {
    if (!this.returns.hasOwnProperty(state)) {
      this.returns[state] = {};
    }

    const stateMap = this.returns[state];

    if (!stateMap.hasOwnProperty(action)) {
      stateMap[action] = [];
    }

    stateMap[action].push(return_instance);
  }

  getReturns(state, action) {
    if (!this.returns.hasOwnProperty(state)) {
      this.returns[state] = {};
    }

    const stateMap = this.returns[state];

    if (!stateMap.hasOwnProperty(action)) {
      stateMap[action] = [];
    }

    const returns = stateMap[action];

    if (returns.length === 0) {
      returns.push(Math.random());
    }

    return returns;
  }
}
