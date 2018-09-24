import MutableEpsilonPolicy from 'js/MutableEpsilonPolicy';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';
import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';

export default class Connect4MonteCarloTrainer {
  static getPolicy(episodesCount) {
    const epsilon = 0.1;
    const agentColor = Board.RED;
    let agentPolicy = new MutableEpsilonPolicy(epsilon, Board.ACTIONS);
    let opponentPolicy = new MutableEpsilonPolicy(0, Board.ACTIONS);
    const updater = new OnPolicyFirstVisitMonteCarloControl(agentPolicy, epsilon);
    const episodes = [];

    let agentWins = 0;
    let measurements = [];
    const measureEvery = 10000;

    for (let index = 0; index < episodesCount; index++) {
      if (index % measureEvery === 0 && index !== 0) {
        measurements.push({
          winRate: agentWins / measureEvery,
          episode: index,
        });

        console.log(measurements[measurements.length - 1])

        agentWins = 0;
      }

      const firstColor = index % 2 === 0 ? Board.RED : Board.YELLOW;
      const { agentWin, episode } = Connect4MonteCarloTrainer.collectEpisode(
        agentPolicy,
        opponentPolicy,
        agentColor,
        firstColor
      );

      if (agentWin) {
        agentWins++;
      }

      episodes.push(episode);
      updater.update(episode);
    }

    return {
      policy: agentPolicy
    };
  }

  static collectEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
    const game = new Game(firstColor, 4);
    const episode = [];
    let previousAgentAction = null;
    let agentWin = false;
    let opponentWin = false;

    while (game.getAvailableActions().length > 0) {
      const currentTurn = game.getTurn();
      let currentPolicy = currentTurn === agentColor ? agentPolicy : opponentPolicy;

      const action = currentPolicy.getNextAction(
        Environment.serializeWithAgentColor(game, currentTurn),
        game.getUnavailableActions()
      );

      if (currentTurn === agentColor) {
        previousAgentAction = action;
      }

      const [ x, y ] = game.drop(action, currentTurn);
      const state = Environment.serializeWithAgentColor(game, agentColor);

      if (game.connects(x, y, currentTurn)) {
        let reward;

        if (currentTurn === agentColor) {
          agentWin = true;
          reward = Environment.WIN_REWARD;
        } else {
          opponentWin = true;
          reward = Environment.LOSE_REWARD;
        }

        episode.push({state, action: previousAgentAction, reward});
        break;
      } else if (previousAgentAction !== null && currentTurn !== agentColor) {
        episode.push({state, action: previousAgentAction, reward: Environment.DEFAULT_REWARD});
      }
    }

    return {
      episode,
      agentWin,
      opponentWin,
    };
  }
}
