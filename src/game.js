
export class Ship {
	constructor(length) {
		this.length = length;
		this.hitsReceived = 0;
	}

	hit() {
		this.hitsReceived++;
	}

	isSunk() {
		return this.hitsReceived === this.length;
	}
}
export class GameBoard {
	constructor(size) {
		this.board = Array(size);
		for (let i = 0; i < size; i++) {
			this.board[i] = Array(size).fill(null);
		}
	}

	placeShip(row, col, length) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] === null) {
			if (row + length <= this.board.length) {
				// adds the ship to each cell
				const newShip = new Ship(length);
				for (let i = 0; i < length; i++) {
					this.board[row + i][col] = newShip;
				}
			}
		}
	}

	receiveHit(row, col) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] instanceof Ship) {
			this.board[row][col].hit();
		} else {
			this.board[row][col] = false;
		}
	}

	isShipLeft() {
		return this.board.forEach((col) => {
			col.some((cell) => cell instanceof Ship);
		});
	}
}

export class Player {
	constructor(name, enemyGameboard) {
		this.name = name;
		this.enemyGameboard = enemyGameboard;
	}

	attack(row, col) {
		if (this.enemyGameboard.board[row][col] === null) {
			this.enemyGameboard.board[row][col] = false;
		} else {
			this.enemyGameboard.board[row][col] = true;
		}
		return this.enemyGameboard.board[row][col];
	}
}

export const gameController = (function () {
	let currentPlayer;
	let player1;
	let gameBoard1;
	let player2;
	let gameBoard2;

	function init() {
		gameBoard1 = new GameBoard(10);
		gameBoard2 = new GameBoard(10);
		player1 = new Player("player 1", gameBoard2);
		player2 = new Player("player 2", gameBoard1);

		// provisional population
		gameBoard1.placeShip(2, 3, 4);
		gameBoard2.placeShip(4, 2, 2);
		gameBoard1.placeShip(5, 5, 4);
		gameBoard2.placeShip(8, 6, 4);

		currentPlayer = player1;
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function isGameOver() {
		return !(gameBoard1.isShipLeft() && gameBoard2.isShipLeft());
	}
	function checkGameOver() {}

	function playTurn(row, col) {
		const isHit = currentPlayer.attack(row, col);
		currentPlayer = currentPlayer === player1 ? player2 : player1;
		// checkGameOver();
		return isHit;
	}
	return { init, getCurrentPlayer, isGameOver, playTurn };
})();
