import { getId, getKeyFromValue } from "./utilities.js";
import { pubsub } from "./pubsub.js";

const HORIZONTAL_MOVES = [
	[0, 1],
	[0, -1],
];
const VERTICAL_MOVES = [
	[1, 0],
	[-1, 0],
];
const Moves = [HORIZONTAL_MOVES, VERTICAL_MOVES];
const Directions = ["horizontal", "vertical"];

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
		this.initializeBoard(size);
	}

	initializeBoard(size) {
		this.board = Array(size);
		for (let i = 0; i < size; i++) {
			this.board[i] = Array(size).fill(null);
		}
		this.ships = {};
	}

	// placeShip(row, col, length, id, isRotated) {
	// 	//another option: sending all ship cells and id.
	// 	if (row > this.board.length || col > this.board.length) {
	// 		throw new Error("");
	// 	}
	// 	if (typeof this.board[row][col] !== "boolean") {
	// 		if (col + length <= this.board.length) {
	// 			//validation so it doesn't overlap the second time
	// 			if (!Object.prototype.hasOwnProperty.call(this.ships, id)) {
	// 				const newShip = new Ship(length);
	// 				this.ships[`${id}`] = { ship: newShip, cells: [] };
	// 			} else {
	// 				const shipCells = this.ships[`${id}`].cells;
	// 				shipCells.forEach((coords) => {
	// 					this.board[coords[0]][coords[1]] = null;
	// 				});
	// 				this.ships[`${id}`].cells = [];
	// 			}

	// 			for (let i = 0; i < length; i++) {
	// 				this.board[row][col + i] = id;
	// 				this.ships[`${id}`].cells.push([row, col + i]);
	// 			}
	// 		}
	// 	}
	// 	console.log(this.ships);
	// 	console.log(this.board);
	// }

	placeShip(cells, id) {
		//checks that is not out of bounds and that doesn't collide with any ship
		const isOutOfBounds =
			cells[cells.length - 1][0] > 9 || cells[cells.length - 1][1] > 9;
		if (
			isOutOfBounds ||
			cells.some(
				(pos) =>
					this.board[pos[0]][pos[1]] !== id &&
					this.board[pos[0]][pos[1]] !== null
			)
		) {
			return false; //throw new Error("");
		}

		if (!Object.prototype.hasOwnProperty.call(this.ships, id)) {
			const newShip = new Ship(cells.length);
			this.ships[`${id}`] = { ship: newShip, cells };
		} else {
			const shipCells = this.ships[`${id}`].cells;
			shipCells.forEach((coords) => {
				this.board[coords[0]][coords[1]] = null;
			});
			this.ships[`${id}`].cells = cells;
		}

		cells.forEach((pos) => {
			this.board[pos[0]][pos[1]] = id;
		});

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

	placeShipsRandom() {
		this.initializeBoard(10);

		const moves = [
			[1, 0],
			[0, 1],
		]; //later in the program, this should be the same const as in the AiPlayer class

		const emptyCells = [];
		for (let i = 0; i < this.board.length; i++) {
			for (let j = 0; j < this.board.length; j++) {
				emptyCells.push([i, j]);
			}
		}

		const placeShipRandom = (length) => {
			let placed = false;
			while (placed === false) {
				//selects random starting pos
				const randomPos =
					emptyCells[Math.floor(Math.random() * emptyCells.length)];
				let row = randomPos[0];
				let col = randomPos[1];
				//chooses random direction
				const randomMove =
					moves[Math.floor(Math.random() * moves.length)];
				const cellsArray = [[row, col]];
				//calculates the ships cells
				for (let i = 0; i < length - 1; i++) {
					row += randomMove[0];
					col += randomMove[1];
					cellsArray.push([row, col]); //only sums once...
				}
				//checks if the ship was placed
				if (this.placeShip(cellsArray, getId()) !== false) {
					placed = true;
					cellsArray.forEach((coords) => {
						const index = emptyCells.indexOf(coords);
						emptyCells.splice(index, 1);
					});
				}
			}
		};

		placeShipRandom(5);
		placeShipRandom(4);
		placeShipRandom(3);
		placeShipRandom(3);
		placeShipRandom(2);
	}
}

export class Player {
	constructor(name, enemyGameboard) {
		this.name = name;
		this.enemyGameboard = enemyGameboard;
	}

	attack(row, col) {
		this.enemyGameboard.receiveHit(row, col);
		return this.enemyGameboard.getValueAt(row, col);
	}
}

class AiPlayer extends Player {
	constructor(name, enemyGameboard) {
		super(name, enemyGameboard);
		this.shipFound = false;
		this.currentShip = { ship: null, pos: null, direction: null };

		pubsub.subscribe("AiPlayerAttacked", () => {
			if (this.currentShip.ship && this.currentShip.ship.isSunk()) {
				this.shipFound = false;
				this.currentShip = { ship: null, pos: null };
			}
		});
	}

	attack(row, col) {
		const originalValue = super.attack(row, col);
		pubsub.publish("AiPlayerAttacked");
		return originalValue;
	}

	playTurn() {
		const { row, col } = this.getNextMove();

		const cellValue = this.enemyGameboard.getValueAt(row, col);
		if (cellValue instanceof Ship && cellValue.hitsReceived === 0) {
			this.shipFound = true;
			this.currentShip.pos = [row, col];
			this.currentShip.ship = cellValue;
		}
		if (this.shipFound && cellValue instanceof Ship) {
			const currentPos = this.currentShip.pos;
			for (let i = 0; i < Moves.length; i++) {
				for (let j = 0; j < Moves[i].length; j++) {
					if (
						currentPos[0] + Moves[i][j][0] === row &&
						currentPos[1] + Moves[i][j][1] === col
					) {
						this.currentShip.direction = Directions[i];
						break;
					}
				}
			}
		}

		setTimeout(() => {
			gameController.playTurn({ row, col });
		}, 1000);
	}

	getNextMove() {
		const getPossibleMoves = (pos) => {
			let moves = Moves.flat();
			if (this.currentShip.direction === "horizontal") {
				moves = HORIZONTAL_MOVES;
			} else if (this.currentShip.direction === "vertical") {
				moves = VERTICAL_MOVES;
			}
			const possibleMoves = [];
			for (const move of moves) {
				let row = pos[0];
				let col = pos[1];
				while (
					row >= 0 &&
					row < 10 &&
					col >= 0 &&
					col < 10 &&
					this.enemyGameboard.board[row][col] === true
				) {
					row += move[0];
					col += move[1];
				}
				if (
					row >= 0 &&
					row < 10 &&
					col >= 0 &&
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

		return { row, col };
	}
}

export const gameController = (function () {
	let currentPlayer;
	let player1;
	let gameBoard1;
	let player2;
	let gameBoard2;

	function updateBoards() {
		pubsub.publish("boardsUpdated", [
			{ board: gameBoard1.board, ships: mapShips(gameBoard1.ships) },
			{ board: gameBoard2.board, ships: mapShips(gameBoard2.ships) },
		]);
	}

	function init() {
		gameBoard1 = new GameBoard(10);
		gameBoard2 = new GameBoard(10);
		gameBoard1.placeShipsRandom();
		gameBoard2.placeShipsRandom();

		player1 = new Player("player 1", gameBoard2);
		player2 = new AiPlayer("player 2", gameBoard1);

		currentPlayer = player1;
		updateBoards();
	}

	function mapShips(ships) {
		return Object.values(ships).map((ship) => {
			return {
				id: getKeyFromValue(ships, ship.ship),
				length: ship.ship.length,
				start: ship.cells[0],
				end: ship.cells[ship.cells.length - 1],
				isSunk: ship.ship.isSunk(),
			};
		});
	}

	function startGame() {
		if (
			Object.keys(gameBoard1.ships).length === 5 &&
			Object.keys(gameBoard2.ships).length === 5
		) {
			function gameStartedCallback() {
				pubsub.publish("gameStarted");
				pubsub.unsubscribe("boardsRendered", gameStartedCallback);
			}
			//sends board data and when they're rendered, starts the game
			pubsub.subscribe("boardsRendered", gameStartedCallback);
			updateBoards();
		}
	}

	function handlePlaceShip({ cells, id }) {
		const result = gameBoard1.placeShip(cells, id);
		pubsub.publish(`shipPlacedResult_${id}`, result);
	}

	function handleSortShips() {
		gameBoard1.placeShipsRandom();

		updateBoards();
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function isGameOver() {
		return !gameBoard1.isShipLeft() || !gameBoard2.isShipLeft();
	}

	function playTurn({ row, col }) {
		const selectedCell = currentPlayer.enemyGameboard.getValueAt(row, col);
		if (typeof selectedCell === "boolean") return;
		const isHit = currentPlayer.attack(row, col);
		let shipId;

		if (selectedCell instanceof Ship && selectedCell.isSunk()) {
			const shipsObject = currentPlayer.enemyGameboard.ships;
			shipId = getKeyFromValue(shipsObject, selectedCell);
		}

		currentPlayer = currentPlayer === player1 ? player2 : player1;

		function turnDisplayedCallback() {
			pubsub.unsubscribe("turnDisplayed", turnDisplayedCallback);
			if (isGameOver()) {
				pubsub.publish("gameEnded");
			} else {
				pubsub.publish("turnPlayed", currentPlayer === player1 ? 1 : 2);
			}
		}
		pubsub.subscribe("turnDisplayed", turnDisplayedCallback);
		pubsub.publish("attackPerformed", {
			boardNumber: currentPlayer === player1 ? 0 : 1,
			row,
			col,
			isHit,
			id: shipId,
		});

		if (currentPlayer instanceof AiPlayer) currentPlayer.playTurn();
	}

	pubsub.subscribe("cellSelected", playTurn);
	pubsub.subscribe("shipPlaced", handlePlaceShip);
	pubsub.subscribe("sortButtonPressed", handleSortShips);
	pubsub.subscribe("startButtonPressed", startGame);
	return { init, getCurrentPlayer, isGameOver, playTurn };
})();
