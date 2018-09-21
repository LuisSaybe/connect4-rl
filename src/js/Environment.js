import Game from 'js/Game';
import Board from 'js/Board';

export default class Environment {
  static AGENT_COLOR = 0;
  static ADVERSARY_COLOR = 1;
  static NONE = 2;

  static getActionsAvailableInState(state) {
    let stateIndex = 0;

    const board = new Board();
    const agentColor = Board.YELLOW;

    for (let row = 0; row < Board.ROWS; row++) {
      for (let column = 0; column < Board.COLUMNS; column++) {
        const color = state[stateIndex];
        let derivedColor;

        if (color === Environment.AGENT_COLOR) {
          derivedColor = Board.YELLOW;
        } else if (color === Environment.NONE) {
          derivedColor = Board.NONE;
        } else {
          derivedColor = Environment.ADVERSARY_COLOR;
        }

        board.place(row, column, derivedColor);
        stateIndex++;
      }
    }

    return board.getAvailableActions();
  }

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
