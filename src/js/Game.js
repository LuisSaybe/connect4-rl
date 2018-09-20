import Board from 'js/Board';

export default class Game {
  constructor(turn, lengthToWin) {
    this.turn = turn;
    this.lengthToWin = lengthToWin;
    this.board = new Board();
  }

  get(x, y) {
    return this.board.get(x, y);
  }

  getAvailableActions() {
    const actions = [];

    for (let column = 0; column < this.getColumns(); column++) {
      if (this.get(this.getRows() - 1, column) === Board.NONE) {
        actions.push(column);
      }
    }

    return actions;
  }

  getUnavailableActions() {
    const actions = [];

    for (let column = 0; column < this.getColumns(); column++) {
      if (this.get(this.getRows() - 1, column) !== Board.NONE) {
        actions.push(column);
      }
    }

    return actions;
  }

  getRows() {
    return this.board.board.length;
  }

  getColumns() {
    return this.getRows() > 0 ? this.board.board[0].length: 0;
  }

  drop(column, color) {
    for (let row = 0; row < this.getRows(); row++) {
      if (this.get(row, column) === Board.NONE) {
        this.board.place(row, column, color);
        this.turn = this.turn === Board.YELLOW ? Board.RED : Board.YELLOW;
        return [row, column];
      }
    }

    return null;
  }

  getTurn() {
    return this.turn;
  }

  connects(x, y, color) {
    const directions = [
        [-1 , -1],
        [-1, 0],
        [ -1, 1 ]
    ];

    for (const direction of directions) {
      for (let vectorIndex = 0; vectorIndex < this.lengthToWin; vectorIndex++) {
        const vector = [];

        for (let vectorLength = 0; vectorLength < this.lengthToWin; vectorLength++) {
          const newX = x + direction[0] * -vectorIndex + direction[0] * vectorLength;
          const newY = y + direction[1] * -vectorIndex + direction[1] * vectorLength;
          vector.push([ newX, newY ]);
        }

        const points = vector.filter(point =>
          this.board.inBounds(point[0], point[1]) &&
          this.board.get(point[0], point[1]) === color
        );

        if (points.length === this.lengthToWin) {
          return true;
        }
      }
    }

    return false;
  }

  clone() {
    const game = new Game(this.turn, this.lengthToWin);
    game.board = this.board.clone();
    return game;
  }
}
