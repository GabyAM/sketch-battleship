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

/* gameBoard

	board itself: a 10x10 matrix of null if there's no ship, or a reference to the ship if it's one
	placeShip: should check if there's space for the ship according to the ship length

*/
export class GameBoard {
	constructor(size) {
		this.board = Array(size);
		for (let i = 0; i < size; i++) {
			this.board[i] = Array(size).fill(null);
		}
		this.ships = {};
	}

	placeShip(row, col, length, id) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] === null) {
			if (col + length <= this.board.length) {
				const newShip = new Ship(length);
				if (!Object.prototype.hasOwnProperty.call(this.ships, id)) {
					this.ships[`${id}`] = { ship: newShip, start: [row, col] };
				} else {
					const shipCells = this.ships[`${id}`].cells;
					shipCells.forEach((coords) => {
						this.board[coords[0]][coords[1]] = null;
					});
				}
				for (let i = 0; i < length; i++) {
					this.board[row][col + i] = id;
				}
			}
		}
	getValueAt(row, col) {
		if (this.board[row][col]) {
			return this.ships[this.board[row][col]].ship;
		} else {
			return this.board[row][col];
		}
	}

	receiveHit(row, col) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] && typeof this.board[row][col] !== "boolean") {
			this.getValueAt(row, col).hit();
			this.board[row][col] = true;
		} else {
			this.board[row][col] = false;
		}
	}

	isShipLeft() {
		const ships = Object.values(this.ships);
		let shipLeft = false;
		let i = 0;
		while (!shipLeft && i < ships.length) {
			if (!ships[i].ship.isSunk()) {
				shipLeft = true;
			}
			i++;
		}
		return shipLeft;
	}
}

export class Player {
	//if it's computer-controlled, select a random cell every turn.
	//unless the previous move was a hit and that ship is still not sunk,
	//in that case, select an adjacent cell
	constructor(name, enemyGameboard) {
		this.name = name;
		this.enemyGameboard = enemyGameboard;
	}

	attack(row, col) {
		this.enemyGameboard.receiveHit(row, col);
	}
}

class AiPlayer extends Player {
	constructor(name, enemyGameboard) {
		super(name, enemyGameboard);
		this.shipFound = false; //when the ship being attacked is sunk, this should reset to false
		this.currentShip = { ship: null, pos: null };
	}

	attack() {
		const getPossibleMoves = (pos) => {
			const moves = [
				//[1, 0],
				//[-1, 0],
				[0, 1],
				[0, -1],
			];
			const possibleMoves = [];
			for (const move of moves) {
				let row = pos[0];
				let col = pos[1];
				while (this.enemyGameboard.board[row][col] === true) {
					row += move[0];
					col += move[1];
				}
				if (
					row < 10 &&
					col < 10 &&
					typeof this.enemyGameboard.board[row][col] !== "boolean" //null or ship id
				) {
					possibleMoves.push([row, col]);
				}
			}
			return possibleMoves;
		};

		let row, col;
		if (this.shipFound) {
			const moves = getPossibleMoves(this.currentShip.pos);
			const randomMove = moves[Math.floor(Math.random() * moves.length)];
			row = randomMove[0];
			col = randomMove[1];
		} else {
			row = Math.floor(Math.random() * 10);
			col = Math.floor(Math.random() * 10);

			while (typeof this.enemyGameboard.board[row][col] === "boolean") {
				row = Math.floor(Math.random() * 10);
				col = Math.floor(Math.random() * 10);
			}
		}

		const cellValue = this.enemyGameboard.getValueAt(row, col);
		if (cellValue instanceof Ship && cellValue.hitsReceived === 0) {
			this.shipFound = true;
			this.currentShip.pos = [row, col];
			this.currentShip.ship = cellValue;
		}

		this.enemyGameboard.receiveHit(row, col);

		if (this.currentShip.ship && this.currentShip.ship.isSunk()) {
			this.shipFound = false;
			this.currentShip = { ship: null, pos: null };
		}
		setTimeout(() => {
			gameController.playTurn({ row, col });
		}, 1000);
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

		currentPlayer = player1;

		gameBoard2.placeShip(2, 2, 3, 1);
		gameBoard2.placeShip(3, 3, 4, 2);

		pubsub.publish("boardsUpdated", [
			{ board: gameBoard1.board, ships: mapShips(gameBoard1.ships) },
			{ board: gameBoard2.board, ships: mapShips(gameBoard2.ships) },
		]);
	}

	function mapShips(ships) {
		return Object.values(ships).map((shipData) => {
			return {
				length: shipData.ship.length,
				start: shipData.start,
			};
		});
	}

	function startGame() {
		pubsub.publish("boardsUpdated", [
			{ board: gameBoard1.board, ships: mapShips(gameBoard1.ships) },
			{ board: gameBoard2.board, ships: mapShips(gameBoard2.ships) },
		]);
	}

	function handlePlaceShip({ row, col, length, id }) {
		gameBoard1.placeShip(Number(row), Number(col), length, id);
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function isGameOver() {
		return !gameBoard1.isShipLeft() || !gameBoard2.isShipLeft();
	}
	function checkGameOver() {}

	function playTurn({ row, col }) {
		currentPlayer.attack(row, col);
		currentPlayer = currentPlayer === player1 ? player2 : player1;
		// checkGameOver();

		pubsub.publish("turnPlayed", {
			board: currentPlayer === player1 ? 1 : 0,
			board: currentPlayer === player1 ? 0 : 1,
			row,
			col,
		});
		if (isGameOver()) {
			pubsub.publish("gameEnded", null);
	}

	pubsub.subscribe("cellSelected", playTurn);
	pubsub.subscribe("shipPlaced", handlePlaceShip);
	pubsub.subscribe("startButtonPressed", startGame);
	return { init, getCurrentPlayer, isGameOver, playTurn };
})();
