import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

import { api } from 'js/web/helpers';

import { Game } from 'js/common/Game';
import { Board } from 'js/common/Board';
import { Environment } from 'js/common/Environment';
import { InteractiveBoard } from 'js/web/InteractiveBoard';
import { StochasticHelper } from 'js/common/StochasticHelper';

const aiGifs = [
  '/src/asset/bear.gif',
  '/src/asset/kombat.gif',
  '/src/asset/terminator.gif',
  '/src/asset/smith.gif',
  '/src/asset/9000.gif',
  '/src/asset/superhot.gif'
];

const humanGifs = [
  '/src/asset/lee.gif',
  '/src/asset/dab.gif',
  '/src/asset/superhot.gif',
  '/src/asset/goal.gif'
];

const DEFAULT_STATE = {
  game: null,
  policy: null,
  notFound: false,
  error: false,
  gettingNextMove: false,
  winner: null,
  humanColor: Board.RED
};

export class Component extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired
  };

  state = { ...DEFAULT_STATE }

  async componentDidMount() {
    const { match: { params: { policyId } } } = this.props;
    const url = api(`/policy/${policyId}`);

    const response = await fetch(url);

    if (response.ok) {
      const { policy } = await response.json();

      this.setState({
        policy,
        game: new Game(this.state.humanColor, 4)
      });
    } else if (response.status === 404) {
      this.setState({ notFound: true });
    } else {
      this.setState({ error: true });
    }
  }

  async onColumnClick(column) {
    if (this.state.gettingNextMove || this.state.winner !== null) {
      return;
    }

    const { game } = this.state;
    const currentTurn = game.getTurn();
    game.drop(column, game.getTurn());

    const nextState = {
      game: game.clone(),
      winner: game.hasWinner() ? currentTurn : null
    };

    if (nextState.winner !== null) {
      this.setState(nextState);
      return null;
    }

    nextState.gettingNextMove = true;
    this.setState(nextState);

    const action = await this.getPolicyAction(game);
    const opponentColor = game.getTurn();
    game.drop(action, opponentColor);

    this.setState({
      game: game.clone(),
      gettingNextMove: false,
      winner: game.hasWinner() ? opponentColor : null
    });
  }

  async getPolicyAction(game) {
    const { policy } = this.state;

    const state = Environment.serializeWithAgentColor(game, game.getTurn());
    const url = api(`/policy/${policy._id}/${state}`);
    const response = await fetch(url);
    const probabilities = await response.json();
    const selections = Object.keys(probabilities);
    const distribution = selections.map(key => probabilities[key]);
    return StochasticHelper.selectFromProbabilityDistributionHelper(distribution, selections);
  }

  async onReset(policyStarts) {
    const startingColor = policyStarts ?  Board.oppositeColor(this.state.humanColor) : this.state.humanColor;
    const game = new Game(startingColor, 4);

    if (policyStarts) {
      const action = await this.getPolicyAction(game);
      game.drop(action, game.getTurn());
    }

    this.setState({
      ...DEFAULT_STATE,
      game,
      policy: this.state.policy
    });
  }

  render() {
    const { game, winner } = this.state;
    const loader = this.state.policy === null && !this.state.notFound ? <span>loading...</span> : null;
    const noutFound = this.state.notFound ? <span>not found</span> : null;
    const error = this.state.error ? <span>unable to load data</span> : null;
    const board = game === null ? null : <InteractiveBoard game={game} onColumnClick={(column) => this.onColumnClick(column)} />;

    let winnerElement;

    if (winner !== null) {
      const color = Board.RED === winner ? 'red' : 'yellow';
      const gifs = winner === this.state.humanColor? humanGifs : aiGifs;
      const src = StochasticHelper.arrayRandom(gifs);

      winnerElement = (
        <>
          <div>
            winner !
          </div>
          <div className='point-container'>
            <div className={`point ${color}`}>
            </div>
          </div>
          <div>
            <img src={src} />
          </div>
        </>
      );
    }

    return (
      <div className='interface'>
        {loader}
        {noutFound}
        {error}
        {board}
        <div className='resets'>
          <button onClick={() => this.onReset(false)}>reset</button>
          <button onClick={() => this.onReset(true)}>computer starts game</button>
        </div>
        {winnerElement}
      </div>
    );
  }
}

export const PolicyGame = withRouter(Component);
