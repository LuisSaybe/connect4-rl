import Game from 'js/Game';
import Board from 'js/Board';

export default class Environment {
  static AGENT_COLOR = 0;
  static ADVERSARY_COLOR = 1;
  static NONE = 2;
  static LOSE_REWARD = -1;
  static WIN_REWARD = 1;
  static DEFAULT_REWARD = 0;

  static getActions() {
    return Array.from(new Array(Board.COLUMNS)).map((_, i) => i);
  }

  static getActionsAvailableInState(state) {
    let stateIndex = 0;

    const board = new Board();
    const agentColor = Board.YELLOW;

    for (let index = 0; index < state.length; index++) {
      let color;
      const environmentColor = Number(state[index]);

      if (environmentColor === Environment.AGENT_COLOR) {
        color = Board.YELLOW;
      } else if (environmentColor === Environment.ADVERSARY_COLOR) {
        color = Board.RED;
      } else if (environmentColor === Environment.NONE) {
        color = Board.NONE;
      }

      board.place(Math.floor(index / Board.COLUMNS), index % Board.COLUMNS, color);
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
