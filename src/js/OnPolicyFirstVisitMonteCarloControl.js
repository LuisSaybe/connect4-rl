import Environment from 'js/Environment';
import Average from 'js/Average';

export default class OnPolicyFirstVisitMonteCarloControl {
  constructor(policy, epsilon, gamma = 1) {
    this.policy = policy;
    this.epsilon = epsilon;
    this.gamma = gamma;
    this.returns = {};
  }

  update(episode) {
    let episodeReturns = 0;

    for (let index = episode.length - 2; index > -1; index--) {
      const step = episode[index];
      const stepAfter = episode[index + 1];

      episodeReturns = this.gamma * episodeReturns + stepAfter.reward;

      const previousSARs = episode.slice(0, index);
      const stepDidAppearInSeries = OnPolicyFirstVisitMonteCarloControl.stepAppearsInSeries(step, previousSARs);

      if (!stepDidAppearInSeries) {
        this.appendAverageReturn(step.state, step.action, episodeReturns);

        const availableActions = Environment.getActionsAvailableInState(step.state);
        const actionReturns = availableActions
          .map(action => {
            const average = this.getAverageReturn(step.state, action);
            return { average: average.average, action };
          })
          .sort((a, b) => a.average - b.average);

        const { action: bestAction } = actionReturns[actionReturns.length - 1];

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

  appendAverageReturn(state, action, returnInstance) {
    if (!this.returns.hasOwnProperty(state)) {
      this.returns[state] = {};
    }

    const stateMap = this.returns[state];

    if (!stateMap.hasOwnProperty(action)) {
      stateMap[action] = new Average();
    }

    stateMap[action].append(returnInstance);
  }

  getAverageReturn(state, action) {
    if (!this.returns.hasOwnProperty(state)) {
      this.returns[state] = {};
    }

    const stateMap = this.returns[state];

    if (!stateMap.hasOwnProperty(action)) {
      stateMap[action] = new Average();
    }

    return stateMap[action];
  }

  static stepAppearsInSeries(step, series) {
    for (const { state, action } of series) {
      if (step.state === state && step.action === action) {
        return true;
      }
    }

    return false;
  }
}
