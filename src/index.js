import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const IS_BLACK = 0;
const IS_WHITE = 1;

function Square(props) {
  return (
    <div className="square" onClick={props.onClick}>
      {props.isBlack ? <div className="stone black"></div> : ''}
      {props.isWhite ? <div className="stone white"></div> : ''}
    </div>
  );
}

class Row extends React.Component {
  renderSquare(x) {
    return (
      <Square 
        isBlack={this.props.rowValues[x][0]}
        isWhite={this.props.rowValues[x][1]}
        onClick={() => this.props.onClick(x, this.props.rowIndex)}
      />
    );
  }

  render() {
    return (
      <div>
        {this.renderSquare(0)}
        {this.renderSquare(1)}
        {this.renderSquare(2)}
        {this.renderSquare(3)}
        {this.renderSquare(4)}
        {this.renderSquare(5)}
        {this.renderSquare(6)}
        {this.renderSquare(7)}
      </div>
    );
  }
}

class Board extends React.Component {
  renderRow(i) {
    return (
      <Row 
        rowIndex={i}
        rowValues={this.props.squares[i]}
        onClick={this.props.onClick}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderRow(0)}
        </div>
        <div className="board-row">
          {this.renderRow(1)}
        </div>
        <div className="board-row">
          {this.renderRow(2)}
        </div>
        <div className="board-row">
          {this.renderRow(3)}
        </div>
        <div className="board-row">
          {this.renderRow(4)}
        </div>
        <div className="board-row">
          {this.renderRow(5)}
        </div>
        <div className="board-row">
          {this.renderRow(6)}
        </div>
        <div className="board-row">
          {this.renderRow(7)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        // horizontal(x): a-h
        // vertical(y): 1-8
        // (a1, a2, ..., a8) + (b1, ...) + ... + (..., h8)
        // each value: [isBlack, isWhite]
        squares: this.createSquares(),
      }],
      stepNumber: 0,
      blackIsNext: true,
      isPlaying: false,
      isSingleMode: false,
      isCpuBlack: (Math.random() > 0.5)
    };
  }

  createSquares() {
    const squares = Array(8).fill().map(()=>Array(8).fill().map(()=>([false, false])));
    // d4: white
    squares[3][3][1] = true;
    // d5: black
    squares[3][4][0] = true;
    // e4: black
    squares[4][3][0] = true;
    // e5: white
    squares[4][4][1] = true;
    return squares;
  }

  handleClick(x, y) {
    if (!this.state.isPlaying) {
      return;
    }

    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    let squares = copy2dArray(current.squares);
    if (squares[y][x][IS_BLACK] || squares[y][x][IS_WHITE]) {
      return;
    }

    if (this.state.isSingleMode &&
      (this.state.isCpuBlack === this.state.blackIsNext)) {
        // CPU is thinking.
        return;
      }

    const selectableCells = getSelectableCells(squares, this.state.blackIsNext);
    let selectedCell = undefined;
    for (const selectableCell of selectableCells.values()) {
      if (selectableCell.select.x === x && selectableCell.select.y === y) {
        selectedCell = selectableCell;
        break;
      }
    }
    if (typeof selectedCell === 'undefined') {
      return;
    }

    this.putStone(history, squares, selectedCell);
  }

  putCpuStone() {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    let squares = copy2dArray(current.squares);

    const selectableCells = getSelectableCells(squares, this.state.blackIsNext);
    const selectedIndex = Math.floor(Math.random() * selectableCells.size);
    let selectedCell = selectableCells.get(Array.from(selectableCells.keys())[selectedIndex]);

    this.putStone(history, squares, selectedCell);
  }

  putStone(history, squares, selectedCell) {
    let x = selectedCell.select.x;
    let y = selectedCell.select.y;

    if (this.state.blackIsNext) {
      squares[y][x][IS_BLACK] = true;
      for (const target of selectedCell.targets) {
        squares[target[1]][target[0]][IS_BLACK] = true;
        squares[target[1]][target[0]][IS_WHITE] = false;
      }
    } else {
      squares[y][x][IS_WHITE] = true;
      for (const target of selectedCell.targets) {
        squares[target[1]][target[0]][IS_BLACK] = false;
        squares[target[1]][target[0]][IS_WHITE] = true;
      }
    }

    let nextPlayer = !this.state.blackIsNext;
    let isPlaying = true;
    const selectableCellsOpposite = getSelectableCells(squares, nextPlayer);
    if (selectableCellsOpposite.size === 0) {
      // skip
      nextPlayer = !nextPlayer;

      const selectableCellsMine = getSelectableCells(squares, nextPlayer);
      if (selectableCellsMine.size === 0) {
        // game end
        nextPlayer = undefined;
        isPlaying = false;
      }
    }

    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      blackIsNext: nextPlayer,
      isPlaying: isPlaying,
    });
  }

  startSingle() {
    let isCpuBlack = (Math.random() > 0.5);

    this.setState({
      history: [{
        squares: this.createSquares(),
      }],
      stepNumber: 0,
      blackIsNext: true,
      isPlaying: true,
      isSingleMode: true,
      isCpuBlack: isCpuBlack,
    })
  }

  startMulti() {
    this.setState({
      history: [{
        squares: this.createSquares(),
      }],
      stepNumber: 0,
      blackIsNext: true,
      isPlaying: true,
      isSingleMode: false,
      isCpuBlack: false,
    })
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];

    let blackStoneCount = 0;
    let whiteStoneCount = 0;
    for (const row of current.squares) {
      for (const square of row) {
        if (square[IS_BLACK]) {
          blackStoneCount++;
        } else if (square[IS_WHITE]) {
          whiteStoneCount++;
        }
      }
    }
    let blackStoneCountMessage = 'Black: ' + String(blackStoneCount);
    let whiteStoneCountMessage = 'White: ' + String(whiteStoneCount);

    let status;
    let btnStartSingle;
    let btnStartMulti;
    if (typeof this.state.blackIsNext === 'undefined') {
      if (blackStoneCount > whiteStoneCount) {
        status = 'Winner: Black';
      } else if (blackStoneCount < whiteStoneCount) {
        status = 'Winner: White';
      } else {
        status = 'Draw';
      }
    } else {
      status = 'Next player: ' + (this.state.blackIsNext ? 'Black' : 'White') + (this.state.isSingleMode ? ((this.state.isCpuBlack === this.state.blackIsNext) ? ' (CPU)' : '') : '');
    }

    if (!this.state.isPlaying) {
      btnStartSingle = (
        <button className='controller' onClick={() => this.startSingle()}>Start (Single)</button>
      );  
      btnStartMulti = (
        <button className='controller' onClick={() => this.startMulti()}>Start (Multi)</button>
      );  
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={current.squares}
            onClick={(x, y) => this.handleClick(x, y)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <div>{blackStoneCountMessage}</div>
          <div>{whiteStoneCountMessage}</div>
          <div>{btnStartSingle}</div>
          <div>{btnStartMulti}</div>
        </div>
      </div>
    );
  }

  componentDidUpdate() {
    if (this.state.isSingleMode &&
      (this.state.isCpuBlack === this.state.blackIsNext)) {
        setTimeout((() => {this.putCpuStone();}), 1000);
      }
  }
}

Square.propTypes = {
  isBlack: PropTypes.bool,
  isWhite: PropTypes.bool,
  onClick: PropTypes.func,
};

Row.propTypes = {
  rowIndex: PropTypes.number,
  rowValues: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool)),
  onClick: PropTypes.func,
};

Board.propTypes = {
  squares: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool))),
  onClick: PropTypes.func,
};

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function copy2dArray(input) {
  const output = [];
  for (const row of input) {
    output.push([...row]);
  }
  return output;
}

function getSelectableCells(squares, blackIsNext) {
  let blackSelectableCells = new Map();
  let whiteSelectableCells = new Map();

  let candidateCells = [];

  // row direction
  for (let row = 0; row < 8; row++) {
    // left to right
    candidateCells = [];
    for (let column = 0; column < 8; column++) {
      candidateCells.push({x: column, y: row});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);

    // right to left
    candidateCells = [];
    for (let column = 7; column >= 0; column--) {
      candidateCells.push({x: column, y: row});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);
  }

  // column direction
  for (let column = 0; column < 8; column++) {
    // top to bottom
    candidateCells = [];
    for (let row = 0; row < 8; row++) {
      candidateCells.push({x: column, y: row});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);

    // bottom to top
    candidateCells = [];
    for (let row = 7; row >= 0; row--) {
      candidateCells.push({x: column, y: row});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);
  }

  // top-left to bottom-right direction
  for (let offset = -5; offset <= 5; offset++) {
    let x_start = Math.max(0, offset);
    let y_start = Math.max(0, -offset);

    // top to bottom
    candidateCells = [];
    for (let step = 0; step < (8 - Math.abs(offset)); step++) {
      candidateCells.push({x: (x_start + step), y: (y_start + step)});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);

    // bottom to top
    candidateCells = [];
    for (let step = (7 - Math.abs(offset)); step >= 0; step--) {
      candidateCells.push({x: (x_start + step), y: (y_start + step)});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);
  }
  
  // top-right to bottom-left direction
  for (let offset = -5; offset <= 5; offset++) {
    let x_start = 7 + Math.min(0, offset);
    let y_start = Math.max(0, offset);

    // top to bottom
    candidateCells = [];
    for (let step = 0; step < (8 - Math.abs(offset)); step++) {
      candidateCells.push({x: (x_start - step), y: (y_start + step)});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);

    // bottom to top
    candidateCells = [];
    for (let step = (7 - Math.abs(offset)); step >= 0; step--) {
      candidateCells.push({x: (x_start - step), y: (y_start + step)});
    }
    appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells);
  }
  
  if (blackIsNext) {
    return blackSelectableCells;
  } else {
    return whiteSelectableCells;
  }
}

function appendSelectableCells(squares, blackSelectableCells, whiteSelectableCells, candidateCells) {
  let isBlackFound = false;
  let isWhiteFound = false;
  let isBlackToWhite = false;
  let isWhiteToBlack = false;
  let targetCells = [];

  for (let candidateCell of candidateCells) {
    const column = candidateCell.x;
    const row = candidateCell.y;

    if (squares[row][column][IS_BLACK]) {
      isBlackFound = true;
      if (isWhiteFound) {
        isWhiteToBlack = true;
        isWhiteFound = false;
        isBlackToWhite = false;
        targetCells = [];
      }
      if (isWhiteToBlack) {
        targetCells.push([column, row]);
      }
    } else if (squares[row][column][IS_WHITE]) {
      isWhiteFound = true;
      if (isBlackFound) {
        isBlackToWhite = true;
        isBlackFound = false;
        isWhiteToBlack = false;
        targetCells = [];
      }
      if (isBlackToWhite) {
        targetCells.push([column, row]);
      }
    } else {
      if (isBlackToWhite || isWhiteToBlack) {
        const key = String(column) + '-' + String(row);
        let mapObj = undefined;
        if (isBlackToWhite) {
          mapObj = blackSelectableCells;
        } else {
          mapObj = whiteSelectableCells;
        }
        if (mapObj.has(key)) {
          mapObj.get(key).targets.push(...targetCells);
        } else {
          mapObj.set(key, {select: candidateCell, targets: targetCells});
        }
      }
      isBlackFound = false;
      isWhiteFound = false;
      isBlackToWhite = false;
      isWhiteToBlack = false;
      targetCells = [];
    }
  }
}
