import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';
import MutableEpsilonPolicy from 'js/MutableEpsilonPolicy';
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

  static getAgent(episodes, measurementCount = 20) {
    const epsilon = 0.1;
    const agent = new MutableEpsilonPolicy(epsilon, Board.ACTIONS);
    const trainer = new MutableEpsilonPolicy(epsilon, Board.ACTIONS);
    const agentColor = Board.YELLOW;
    const trainerColor = Board.RED;
    const agentUpdater = new OnPolicyFirstVisitMonteCarloControl(agent, epsilon);

    const measurements = Array.from(new Array(measurementCount)).map(() => ({ agentWins: 0, trainerWins: 0 }))
    const getMeasurementIndex = (current, total, partitions) => {
      return Math.floor(current / total * partitions);
    };

    for (let index = 0; index < episodes; index++) {
      const game = new Game(trainerColor, 4);
      const episode = [];
      let previousAgentAction = null;

      if (index % 10000 === 0) {
        console.log(index / episodes);
      }

      while (game.getAvailableActions().length > 0) {
        const trainerAction = trainer.getNextAction(
          Environment.serializeWithAgentColor(game, trainerColor),
          game.getUnavailableActions()
        );

        const [ trainerX, trainerY ] = game.drop(trainerAction, trainerColor);
        const state = Environment.serializeWithAgentColor(game, agentColor);

        if (game.connects(trainerX, trainerY, trainerColor)) {
          episode.push({state, action: previousAgentAction, reward: Environment.LOSE_REWARD});

          const measurementIndex = getMeasurementIndex(index, episodes, measurements.length);
          measurements[measurementIndex].trainerWins++;

          break;
        } else if (previousAgentAction !== null) {
          episode.push({state, action: previousAgentAction, reward: Environment.DEFAULT_REWARD});
        }

        const agentAction = agent.getNextAction(
          Environment.serializeWithAgentColor(game, agentColor),
          game.getUnavailableActions()
        );
        previousAgentAction = agentAction;

        const [ agentX, agentY ] = game.drop(agentAction, agentColor);

        if (game.connects(agentX, agentY, agentColor)) {
          const state = Environment.serializeWithAgentColor(game, agentColor);
          episode.push({state, action: agentAction, reward: Environment.WIN_REWARD});

          const measurementIndex = getMeasurementIndex(index, episodes, measurements.length);
          measurements[measurementIndex].agentWins++;

          break;
        }
      }

      agentUpdater.update(episode);
    }

    return { statistics: measurements, agent };
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
