import React from 'react';
import PropTypes from 'prop-types';
import Board from 'js/Board';
import Game from 'js/Game';
import InteractiveBoard from 'js/InteractiveBoard';
import Environment from 'js/Environment';
import OnPolicyFirstVisitMonteCarloControl from 'js/OnPolicyFirstVisitMonteCarloControl';

const EPSILON = 0.1

export default class Application extends React.Component {
  static propTypes = {
    policy: PropTypes.object.isRequired
  }

  previousAgentAction = null;
  episode = [];
  agentColor = Board.RED;
  state = {
    game: new Game(Board.YELLOW, 4),
    winner: null,
    redWins: 0,
    yellowWins: 0,
    episodes: 0,
  }

  constructor(props) {
    super(props);

    this.policy = props.policy;
    this.policyUpdater = new OnPolicyFirstVisitMonteCarloControl(this.policy, EPSILON);
  }

  onColumnClick(action) {
    if (this.state.winner !== null) {
      return;
    }

    const { game } = this.state;
    const actions = game.getAvailableActions();

    if (actions.includes(action)) {
      const myColor = game.getTurn();
      const state = Environment.serializeWithAgentColor(game, this.agentColor);

      const [ x, y ] = game.drop(action, myColor);
      let winner = null;
      const userWins = game.connects(x, y, myColor);

      if (userWins) {
        winner = myColor;
        this.episode.push({state, action, reward: Environment.LOSE_REWARD});
      } else {
        this.episode.push({
          state,
          action: this.previousAgentAction,
          reward: Environment.DEFAULT_REWARD
        });

        const agentColor = game.getTurn();
        const agentAction = this.policy.getNextAction(state, game.getUnavailableActions());
        this.previousAgentAction = agentAction;
        const droppedPoint = game.drop(agentAction, agentColor);
        const agentWins = game.connects(droppedPoint[0], droppedPoint[1], agentColor);

        if (agentWins) {
          winner = agentColor;

          this.episode.push({
            state: Environment.serializeWithAgentColor(game, agentColor),
            action: agentAction,
            reward: Environment.WIN_REWARD
          });
        }
      }

      if (winner !== null) {
        this.policyUpdater.update(this.episode);
      }

      const redWins = winner === Board.RED ? this.state.redWins + 1 : this.state.redWins;
      const yellowWins = winner === Board.YELLOW ? this.state.yellowWins + 1 : this.state.yellowWins;

      this.setState({
        game: game.clone(),
        winner,
        redWins,
        yellowWins,
      });
    }
  }

  startNewEpisode() {
    this.setState({
      game: new Game(Board.YELLOW, 4),
      winner: null,
      episodes: this.state.episodes + 1
    });

    this.episode = [];
  }

  render() {
    return (
      <div className='application'>
        <InteractiveBoard
          game={this.state.game}
          onColumnClick={column => this.onColumnClick(column)}
        />
        <div className='right-statistics'>
          <p>Episodes: {this.state.episodes}</p>
          <p>Red Wins: {this.state.redWins}</p>
          <p>Yellow Wins: {this.state.yellowWins}</p>
          <div>
            <button className='rl-button' onClick={() => this.startNewEpisode()}>New E pisode</button>
          </div>
        </div>
      </div>
    );
  }
}
