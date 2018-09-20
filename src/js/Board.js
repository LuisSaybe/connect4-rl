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

  serialize() {
    const result = new Array(this.board.length ** 2);

    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        result[x * this.board[X].length + y] = this.board[x][y];
      }
    }

    return result.join('');
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

  static deserialize(string) {
    const board = new Board();

    for (let x = 0; x < Board.ROWS; x++) {
      for (let y = 0; y < Board.COLUMNS; y++) {
        board.place(x, y, Number(string[x * Board.COLUMNS + y]));
      }
    }

    return board;
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
