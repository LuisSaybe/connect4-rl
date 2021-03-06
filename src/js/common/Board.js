export class Board {
  static NONE = 0;
  static YELLOW = 1;
  static RED = 2;
  static ROWS = 6;
  static COLUMNS = 7;
  static ACTIONS = [0, 1, 2, 3, 4, 5, 6];

  constructor() {
    this.board = new Array(Board.ROWS);

    for (let x = 0; x < Board.ROWS; x++) {
      this.board[x] = new Array(Board.COLUMNS).fill(Board.NONE);
    }
  }

  getAvailableActions() {
    const actions = [];

    for (let column = 0; column < Board.COLUMNS; column++) {
      if (this.get(Board.ROWS - 1, column) === Board.NONE) {
        actions.push(column);
      }
    }

    return actions;
  }

  get(x, y) {
    return this.board[x][y];
  }

  place(x, y, color) {
    this.board[x][y] = color;
  }

  inBounds(x, y) {
    return x > -1 && x < this.board.length && y > -1 && y < this.board[x].length;
  }

  static oppositeColor(color) {
    if (color === Board.YELLOW) {
      return Board.RED
    }

    if (color === Board.RED) {
      return Board.YELLOW
    }

    return null;
  }

  clone() {
    const board = new Board();

    for (let x = 0; x < board.board.length; x++) {
      for (let y = 0; y < board.board[x].length; y++) {
        board.board[x][y] = this.board[x][y];
      }
    }

    return board;
  }
}
