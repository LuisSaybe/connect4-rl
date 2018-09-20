import Game from 'js/Game';
import Board from 'js/Board';

test('game ends with red win', () => {
  const game = new Game(Board.RED, 4);
  game.drop(0, Board.RED);
  game.drop(0, Board.RED);
  game.drop(0, Board.RED);
  game.drop(0, Board.RED);

  expect(game.connects(0, 0, Board.RED)).toBe(true);
});
