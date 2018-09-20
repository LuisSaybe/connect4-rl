import Game from 'js/Game';
import Board from 'js/Board';

export default class Environment {
  static AGENT_COLOR = 0;
  static ADVERSARY_COLOR = 1;
  static NONE = 2;

  static serializeWithAgentColor(game, agentColor) {
    let result = [];

    for (let x = 0; x < game.getRows(); x++) {
      for (let y = 0; y < game.getColumns(); y++) {
        const color = game.get(x, y);
        let serialization = Environment.NONE;

        if (color === agentColor) {
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
