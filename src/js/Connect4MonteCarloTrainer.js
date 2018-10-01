import mongodb from 'mongodb';
import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';
import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';

export default class Connect4MonteCarloTrainer {
  constructor(db) {
    this.db = db;
  }

  async getPolicy(matches, episodesPerMatch, epsilon) {
    let opponentPolicy = new DatabaseMutableEpisolonPolicy(
      0,
      Board.ACTIONS,
      new mongodb.ObjectID(),
      this.db
    );

    for (let index = 0; index < matches; index++) {
      console.log('match ' + index);

      const { policy } = await this.getPolicyFromCompetition(
        episodesPerMatch,
        opponentPolicy,
        epsilon
      );

      policy.setEpsilon(0);
      opponentPolicy = policy;
    }

    return { policy: opponentPolicy };
  }

  async getPolicyFromCompetition(episodesCount, opponentPolicy, epsilon) {
    const agentColor = Board.RED;
    let agentPolicy = new DatabaseMutableEpisolonPolicy(
      epsilon,
      Board.ACTIONS,
      new mongodb.ObjectID(),
      this.db
    );
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

      const { agentWin, episode } = await Connect4MonteCarloTrainer.collectEpisode(
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

  static async collectEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
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
      const action = await currentPolicy.getNextAction(state, game.getUnavailableActions());

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
