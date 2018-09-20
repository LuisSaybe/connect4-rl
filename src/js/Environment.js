import Game from 'js/Game';
import Board from 'js/Board';

export default class Environment {
  static AGENT_COLOR = 0;
  static ADVERSARY_COLOR = 1;
  static NONE = 2;

  constructor(game, agentColor) {
    this.game = game;
    this.agentColor = agentColor;
  }

  getUnavailableActions() {
    return this.game.getUnavailableActions();
  }

  getNextStateReward(action, color) {
    const [x, y] = this.game.drop(action, color);

    if (this.game.connects(x, y, color)) {
      return this.agentColor === color ? 1 : -1;
    }

    return 0;
  }

  serializeWithAgentColor() {
    let result = [];

    for (let x = 0; x < this.game.getRows(); x++) {
      for (let y = 0; y < this.game.getColumns(); y++) {
        const color = this.game.get(x, y);
        let serialization = Environment.NONE;

        if (color === this.agentColor) {
          serialization = Environment.AGENT_COLOR;
        } else if (color === Board.NONE) {
          serialization = Environment.NONE;
        } else {
          serialization = Environment.ADVERSARY_COLOR;
        }

        result.push(serialization);
      }
    }

    return result.join('');
  }
}
