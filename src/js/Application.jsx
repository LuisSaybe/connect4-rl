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
  policyUpdater = new OnPolicyFirstVisitMonteCarloControl(this.policy, 0.1);
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
      const userWins = game.connects(x, y, myColor);

      if (userWins) {
        winner = myColor;
        this.episode.push({state, action, reward: Environment.LOSE_REWARD});
      } else {
        const agentColor = game.getTurn();
        const agentAction = this.policy.getNextAction(state, game.getUnavailableActions());
        const droppedPoint = game.drop(agentAction, agentColor);
        const nextState = Environment.serializeWithAgentColor(game);
        const agentWins = game.connects(droppedPoint[0], droppedPoint[1], agentColor);
        let reward;

        if (agentWins) {
          winner = agentColor;
          reward = Environment.WIN_REWARD;
        } else {
          reward = Environment.DEFAULT_REWARD;
        }

        this.episode.push({
          state: Environment.serializeWithAgentColor(game, agentColor),
          action: agentAction,
          reward
        });
      }

      if (winner !== null) {
        this.policyUpdater.update(this.episode);
      }

      const final = this.episode[this.episode.length - 1];

      console.log(this.policy);

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

    Environment.getActionsAvailableInState('122222022222222222222222222222222222222222');

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
