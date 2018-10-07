import DatabaseMutableEpisolonPolicy from 'js/DatabaseMutableEpisolonPolicy';
import DatabaseOnPolicyFirstVisitMonteCarloControl from 'js/DatabaseOnPolicyFirstVisitMonteCarloControl';
import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';
import Episode from 'js/Episode';

export default class Connect4MonteCarloTrainer {
  constructor(db, onMessage) {
    this.db = db;
    this.onMessage = onMessage;
  }

  async train(epsilon = 0.1, episodesCount) {
    const policy = new DatabaseMutableEpisolonPolicy(
      this.db,
      epsilon,
      Board.ACTIONS
    );

    const updater = new DatabaseOnPolicyFirstVisitMonteCarloControl(this.db, policy, epsilon);

    this.onMessage('collection ' + episodesCount + ' episodes');
    const episodes = await this.getUniqueEpisodes(policy, policy, episodesCount);

    for (let index = 0; index < episodes.length; index++) {
      this.onMessage('update episode ' + index);
      await updater.update(episodes[index].series);
    }

    this.onMessage('training done with ' + episodesCount + ' episodes');

    return { policy };
  }

  async getUniqueEpisodes(agentPolicy, opponentPolicy, episodesCount) {
    const episodesVisited = new Set();
    const episodes = []
    const futures = [];

    for (let index = 0; index < episodesCount; index++) {
      const firstColor = index % 2 === 0 ? Board.YELLOW : Board.RED;

      const future = new Promise((resolve) => {
        Connect4MonteCarloTrainer.getEpisode(agentPolicy, opponentPolicy, Board.RED, firstColor).then((episode) => {
          const serialized = episode.serialize();

          if (episodesVisited.has(serialized)) {
            console.log('seen!', serialized);
          } else {
            episodesVisited.add(serialized);
            episodes.push(episode);
          }

          resolve();
        });
      });

      futures.push(future);
    }

    await Promise.all(futures);

    return episodes;
  }

  static async getEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
    const game = new Game(firstColor, 4);
    let previousAgentAction = null;
    let previousAgentState = null;
    const episode = new Episode();

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
          reward = Environment.WIN_REWARD;
        } else {
          reward = Environment.LOSE_REWARD;
        }

        episode.append(previousAgentState, previousAgentAction, reward);
        break;
      } else if (currentTurn === agentColor) {
        episode.append(state, action, Environment.DEFAULT_REWARD);
      }
    }

    return episode;
  }
}
