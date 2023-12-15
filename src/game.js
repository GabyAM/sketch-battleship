import { pubsub } from "./pubsub.js";

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
		this.ships = [];
	}

	placeShip(row, col, length, id) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] === null) {
			if (col + length <= this.board.length) {
				const newShip = new Ship(length);
				const shipArray = [];
				//first, deletes the previous position of the ship
				for (let i = 0; i < this.board.length; i++) {
					for (let j = 0; j < this.board.length; j++) {
						if (this.board[i][j] === id) {
							this.board[i][j] = null;
						}
					}
				}

				for (let i = 0; i < length; i++) {
					this.board[row][col + i] = id;
					shipArray.push([row, col + i]);
				}

				this.ships.push(shipArray);
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
		gameBoard1.placeShip(3, 3, 4);
		pubsub.publish("boardsUpdated", [gameBoard1.board, gameBoard2.board]);

		currentPlayer = player1;
	}

	function handlePlaceShip({ row, col, length, id }) {
		console.log(
			`handlePlaceShip: row: ${row}, col: ${col}, length: ${length}`
		);
		gameBoard1.placeShip(Number(row), Number(col), length, id);
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function isGameOver() {
		return !(gameBoard1.isShipLeft() && gameBoard2.isShipLeft());
	}
	function checkGameOver() {}

	// subscribe to dom 'targetCell' function
	function playTurn({ row, col }) {
		const isHit = currentPlayer.attack(row, col);
		currentPlayer = currentPlayer === player1 ? player2 : player1;
		// checkGameOver();
		pubsub.publish("turnPlayed", {
			board: currentPlayer === player1 ? 1 : 0,
			row,
			col,
			isHit,
		});
		return isHit;
	}

	pubsub.subscribe("cellSelected", playTurn);
	pubsub.subscribe("shipPlaced", handlePlaceShip);
	return { init, getCurrentPlayer, isGameOver, playTurn };
})();
