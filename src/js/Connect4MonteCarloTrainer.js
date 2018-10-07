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

    const every = Math.floor(episodes.length / 50);

    for (let index = 0; index < episodes.length; index++) {
      if (index % every === 0) {
        this.onMessage(`${index} / ${episodes.length}`);
      }
      await updater.update(episodes[index].series);
    }

    this.onMessage('training done with collected ' + episodes.length + ' episodes');
    return { policy };
  }

  async getUniqueEpisodes(agentPolicy, opponentPolicy, episodesCount) {
    const futures = [];

    for (let index = 0; index < episodesCount; index++) {
      const firstColor = index % 2 === 0 ? Board.YELLOW : Board.RED;

      futures.push(
        Connect4MonteCarloTrainer.getEpisode(agentPolicy, opponentPolicy, Board.RED, firstColor)
      );
    }

    const episodes = [];

    for (const future of futures) {
      const { agentEpisode, opponentEpisode } = await future;
      episodes.push(agentEpisode, opponentEpisode);
    }

    return episodes;
  }

  static async getEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
    const game = new Game(firstColor, 4);
    const opponentColor = Board.oppositeColor(agentColor);
    let previousAgentAction = null;
    let previousAgentState = null;
    let previousOpponentAction = null;
    let previousOpponentState = null;
    const agentEpisode = new Episode();
    const opponentEpisode = new Episode();

    while (game.getAvailableActions().length > 0) {
      const currentTurn = game.getTurn();
      let currentPolicy = currentTurn === agentColor ? agentPolicy : opponentPolicy;
      const state = Environment.serializeWithAgentColor(game, currentTurn);
      const action = await currentPolicy.getNextAction(state, game.getUnavailableActions());

      if (currentTurn === agentColor) {
        previousAgentAction = action;
        previousAgentState = state;
      } else if (currentTurn === opponentColor) {
        previousOpponentAction = action;
        previousOpponentState = state;
      }

      const [ x, y ] = game.drop(action, currentTurn);

      if (game.connects(x, y, currentTurn)) {
        let agentReward;
        let opponentReward;

        if (currentTurn === agentColor) {
          agentReward = Environment.WIN_REWARD;
          opponentReward = Environment.LOSE_REWARD;
        } else {
          agentReward = Environment.LOSE_REWARD;
          opponentReward = Environment.WIN_REWARD;
        }

        agentEpisode.append(previousAgentState, previousAgentAction, agentReward);
        opponentEpisode.append(previousOpponentState, previousOpponentAction, opponentReward);
        break;
      } else if (currentTurn === agentColor) {
        agentEpisode.append(state, action, Environment.DEFAULT_REWARD);
      } else if (currentTurn === opponentColor) {
        opponentEpisode.append(state, action, Environment.DEFAULT_REWARD);
      }
    }

    return {
      agentEpisode,
      opponentEpisode
    };
  }
}
