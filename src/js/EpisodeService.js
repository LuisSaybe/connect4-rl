import Board from 'js/Board';
import Game from 'js/Game';
import Environment from 'js/Environment';
import Episode from 'js/Episode';
import { EPISODE_COLLECTION } from 'js/database';

export class EpisodeService {
  constructor(db) {
    this.db = db;
  }

  async generateEpisodes(agentPolicy, opponentPolicy, episodesCount, seriesId) {
    for (let index = 0; index < episodesCount; index++) {
      const firstColor = index % 2 === 0 ? Board.YELLOW : Board.RED;
      const { agentEpisode, opponentEpisode } = await EpisodeService.getEpisode(
        agentPolicy,
        opponentPolicy,
        Board.RED,
        firstColor
      );

      agentEpisode.seriesId = seriesId;
      opponentEpisode.seriesId = seriesId;

      const agentSaveFuture = this.save(agentEpisode);
      const opponentSaveFuture = this.save(opponentEpisode);
      await agentSaveFuture;
      await opponentSaveFuture;
    }
  }

  static async getEpisode(agentPolicy, opponentPolicy, agentColor, firstColor) {
    const game = new Game(firstColor, 4);
    const opponentColor = Board.oppositeColor(agentColor);
    const agentEpisode = new Episode();
    const opponentEpisode = new Episode();
    let previousAgentAction = null;
    let previousAgentState = null;
    let previousOpponentAction = null;
    let previousOpponentState = null;

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

    agentEpisode.policyId = agentPolicy.policyId;
    opponentEpisode.policyId = opponentPolicy.policyId;
    agentEpisode.serialization = agentEpisode.serialize();
    opponentEpisode.serialization = opponentEpisode.serialize();

    return {
      agentEpisode,
      opponentEpisode
    };
  }

  save(episode) {
    return this.db.collection(EPISODE_COLLECTION).findOneAndUpdate({
      serialization: episode.serialization,
      seriesId: episode.seriesId
    }, {
      $set: {
        sars: episode.sars,
        policyId: episode.policyId,
        created: new Date()
      }
    }, {
      returnOriginal: false,
      upsert: true
    });
  }
}
