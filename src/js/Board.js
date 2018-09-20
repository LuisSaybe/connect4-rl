export default class Board {
  static NONE = 0;
  static YELLOW = 1;
  static RED = 2;
  static ROWS = 6;
  static COLUMNS = 7;
  static ACTIONS = Array.from(new Array(Board.COLUMNS)).map((_, i) => i);

  constructor() {
    this.board = new Array(Board.ROWS);

    for (let x = 0; x < Board.ROWS; x++) {
      this.board[x] = new Array(Board.COLUMNS).fill(Board.NONE);
    }
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
