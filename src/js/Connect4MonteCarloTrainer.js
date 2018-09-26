import MutableEpsilonPolicy from 'js/MutableEpsilonPolicy';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';
import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';

export default class Connect4MonteCarloTrainer {
  static getPolicy(matches, episodesPerMatch, epsilon) {
    let opponentPolicy = new MutableEpsilonPolicy(0, Board.ACTIONS);

    for (let index = 0; index < 10; index++) {
      console.log('match ' + index);

      const { policy } = Connect4MonteCarloTrainer.getPolicyFromCompetition(
        episodesPerMatch,
        opponentPolicy,
        epsilon
      );
      policy.setEpsilon(0);
      opponentPolicy = policy;
    }

    return { policy: opponentPolicy };
  }

  static getPolicyFromCompetition(episodesCount, opponentPolicy, epsilon) {
    const agentColor = Board.RED;
    let agentPolicy = new MutableEpsilonPolicy(epsilon, Board.ACTIONS);
    const updater = new OnPolicyFirstVisitMonteCarloControl(agentPolicy, epsilon);

    let agentWins = 0;
    let measurements = [];
    const measureEvery = Math.floor(episodesCount / 20);

    for (let index = 0; index < episodesCount; index++) {
      if (index % measureEvery === 0 && index !== 0) {
        measurements.push({
          winRate: agentWins / measureEvery,
          episode: index,
        });

        console.log(measurements[measurements.length - 1]);

        agentWins = 0;
      }

      const firstColor = index % 2 == 0 ? Board.YELLOW : Board.RED;
      const { agentWin, episode } = Connect4MonteCarloTrainer.collectEpisode(
        agentPolicy,
        opponentPolicy,
        agentColor,
        firstColor
      );

      if (agentWin) {
        agentWins++;
      }

      updater.update(episode);
    }

    return {
      policy: agentPolicy,
      measurements
    };
  }

  static collectEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
    const game = new Game(firstColor, 4);
    const episode = [];
    let previousAgentAction = null;
    let previousAgentState = null;
    let agentWin = false;
    let opponentWin = false;

    while (game.getAvailableActions().length > 0) {
      const currentTurn = game.getTurn();
      let currentPolicy = currentTurn === agentColor ? agentPolicy : opponentPolicy;
      const state = Environment.serializeWithAgentColor(game, currentTurn);
      const action = currentPolicy.getNextAction(state, game.getUnavailableActions());

      if (currentTurn === agentColor) {
        previousAgentAction = action;
        previousAgentState = state;
      }

      const [ x, y ] = game.drop(action, currentTurn);

      if (game.connects(x, y, currentTurn)) {
        let reward;

        if (currentTurn === agentColor) {
          agentWin = true;
          reward = Environment.WIN_REWARD;
        } else {
          opponentWin = true;
          reward = Environment.LOSE_REWARD;
        }

        episode.push({
          state: previousAgentState,
          action: previousAgentAction,
          reward
        });
        break;
      } else if (currentTurn === agentColor) {
        episode.push({state, action, reward: Environment.DEFAULT_REWARD});
      }
    }

    return {
      episode,
      agentWin,
      opponentWin,
    };
  }
}
