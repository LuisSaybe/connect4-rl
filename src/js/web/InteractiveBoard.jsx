import React from 'react';
import PropTypes from 'prop-types';
import Board from 'js/Board';

export class InteractiveBoard extends React.Component {
  static propTypes = {
    game: PropTypes.object.isRequired,
    onColumnClick: PropTypes.func.isRequired
  };

  render() {
    const { game } = this.props;
    const columns = [];

    for (let columnIndex = 0; columnIndex < game.getColumns(); columnIndex++) {
      const column = [];

      for (let rowIndex = game.getRows() - 1; rowIndex > -1; rowIndex--) {
        const color = game.get(rowIndex, columnIndex);
        let colorName = 'none';

        if (color === Board.RED) {
          colorName = 'red';
        } else if (color === Board.YELLOW) {
          colorName = 'yellow';
        }

        column.push(
          <div key={`row-${rowIndex}`} className='point-container'>
            <div className={`point ${colorName}`}>
            </div>
          </div>
        );
      }

      columns.push(
        <button className='column' onClick={() => this.props.onColumnClick(columnIndex)} key={`column-${columnIndex}`}>{column}</button>
      );
    }

    return (
      <div className='interactive-board'>
        {columns}
      </div>
    )
  }
}
