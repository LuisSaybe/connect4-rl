export default class OnPolicyFirstVisitMonteCarloControl {
  constructor(policy, gamma = 0) {
    this.policy = policy;
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
    const episodeWithoutLastStep = episode.slice(0, episode.length - 1);
    const stateActionsToReturns = {};
    let episodeReturns = 0;

    for (let index = episode.length - 2; index > -1; index--) {
      const step = episode[index];
      const stepAfter = episode[index + 1];

      episodeReturns = this.gamma * episodeReturns + stepAfter.reward;

      const stepDidAppearInSeries = OnPolicyFirstVisitMonteCarloControl.stepAppearsInSeries(step, episodeWithoutLastStep);

      if (!stepDidAppearInSeries) {
        this.appendReturn(episodeReturns);

        const availableActions = Environment.getActionsAvailableInState(step.state);

        for (const action of availableActions) {
          console.log('action', action);
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
}
