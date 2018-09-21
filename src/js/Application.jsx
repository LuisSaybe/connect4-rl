import React from 'react';
import Board from 'js/Board';
import Game from 'js/Game';
import InteractiveBoard from 'js/InteractiveBoard';
import MutableEpisonlonPolicy from 'js/MutableEpsilonPolicy';
import Environment from 'js/Environment';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';

const EPSILON = 0.1

export default class Application extends React.Component {
  episode = [];
  policy = new MutableEpisonlonPolicy(0.1, Board.ACTIONS);
  policyUpdater = new OnPolicyFirstVisitMonteCarloControl(this.policy);
  state = {
    game: new Game(Board.YELLOW, 4),
    winner: null,
  }

  onColumnClick(action) {
    if (this.state.winner !== null) {
      return;
    }

    const { game } = this.state;
    const actions = game.getAvailableActions();

    if (actions.includes(action)) {
      const myColor = game.getTurn();
      const state = Environment.serializeWithAgentColor(game);
      const [ x, y ] = game.drop(action, myColor);
      let winner = null;

      if (game.connects(x, y, myColor)) {
        winner = myColor;
        this.episode.push({state, action, reward: -1});
      } else {
        const agentColor = game.getTurn();
        const agentAction = this.policy.getNextAction(state, game.getUnavailableActions());
        const droppedPoint = game.drop(agentAction, agentColor);
        const nextState = Environment.serializeWithAgentColor(game);
        const connects = game.connects(droppedPoint[0], droppedPoint[1], agentColor);
        const reward = connects ? 1 : 0;
        if (connects) {
          winner = agentColor;
        }

        this.episode.push({
          state: Environment.serializeWithAgentColor(game),
          action: agentAction,
          reward
        });
      }

      if (winner !== null) {
        this.policyUpdater.update(this.episode);
      }

      const final = this.episode[this.episode.length - 1];

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
            <button className='rl-button' onClick={() => this.startNewEpisode()}>New E pisode</button>
          </div>
        </div>
      </div>
    );
  }
}
