import React from 'react';
import Board from 'js/Board';
import Game from 'js/Game';
import InteractiveBoard from 'js/InteractiveBoard';
import MutableEpisonlonPolicy from 'js/MutableEpsilonPolicy';
import Environment from 'js/Environment';

const EPSILON = 0.1

export default class Application extends React.Component {
  episode = [];
  policy = new MutableEpisonlonPolicy(0.1, Board.ACTIONS);
  state = {
    game: new Game(Board.YELLOW, 4),
    winner: null,
  }

  onColumnClick(column) {
    if (this.state.winner !== null) {
      return;
    }

    const { game } = this.state;
    const actions = game.getAvailableActions();

    if (actions.includes(column)) {
      const myColor = game.getTurn();
      const [ x, y ] = game.drop(column, myColor);
      let winner = null;

      if (game.connects(x, y, myColor)) {
        winner = myColor;
      } else {
        const agentColor = game.getTurn();
        const state = Environment.serializeWithAgentColor(game);
        const action = this.policy.getNextAction(state, game.getUnavailableActions());
        const droppedPoint = game.drop(action, agentColor);
        const nextState = Environment.serializeWithAgentColor(game);
        const connects = game.connects(droppedPoint[0], droppedPoint[1], agentColor);
        const reward = connects ? 1 : 0;
        if (connects) {
          winner = agentColor;
        }

        console.log('state, action, nextState, reward', state, action, nextState, reward);

        this.episode.push(state, action, nextState, reward);
      }

      this.setState({
        game: game.clone(),
        winner,
      });
    }
  }

  startNewEpisode() {
    this.setState({
      game: new Game(Board.YELLOW, 4),
      winner: null,
    });

    this.episode = [];
  }

  render() {
    let winText = '';

    if (this.state.winner === Board.YELLOW) {
      winText = 'Yellow wins';
    } else if (this.state.winner === Board.RED) {
      winText = 'Red wins';
    }

    return (
      <div className='application'>
        <InteractiveBoard
          game={this.state.game}
          onColumnClick={column => this.onColumnClick(column)}
        />
        <div className='right-statistics'>
          {winText}
          <div>
            <button className='rl-button' onClick={() => this.startNewEpisode()}>New Episode</button>
          </div>
        </div>
      </div>
    );
  }
}
