import React from 'react';
import Board from 'js/Board';
import Game from 'js/Game';
import InteractiveBoard from 'js/InteractiveBoard';
import MutableEpisonlonPolicy from 'js/MutableEpsilonPolicy';
import Environment from 'js/Environment';

const EPSILON = 0.1

export default class Application extends React.Component {
  policy = new MutableEpisonlonPolicy(0.1, Board.ACTIONS);

  state = {
    game: new Game(Board.YELLOW, 4),
    winner: null,
  }

  onColumnClick(column) {
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
        const environment = new Environment(game, agentColor);
        const state = environment.serializeWithAgentColor();
        const unavailableActions = environment.getUnavailableActions();
        const agentAction = this.policy.getNextAction(state, unavailableActions);
        const [ agentX, agentY ] = game.drop(agentAction, agentColor);

        if (game.connects(agentX, agentY, agentColor)) {
          winner = agentColor;
        }
      }

      this.setState({
        game: game.clone(),
        winner,
      });
    }
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
        </div>
      </div>
    );
  }
}
