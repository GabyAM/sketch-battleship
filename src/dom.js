import { pubsub } from "./pubsub.js";

function getCellByCoordinates(board, row, col) {
	const cells = [...board.querySelectorAll(".cell")];
	return cells.find(
		(cell) => cell.dataset.row === row && cell.dataset.col === col
	);
}

class DomShip {
	constructor(length) {
		this.element = this.createElement(length);
		this.addDraggable(this.element);
		this.length = length;
		this.isRotated = false;
	}

	createElement(length) {
		const ship = document.createElement("div");
		ship.className = "ship";
		ship.style.width = `${40 * length}px`;
		ship.style.height = "40px";
		return ship;
	}

export const domController = (function () {
	pubsub.subscribe("boardsUpdated", renderBoards);
	pubsub.subscribe("turnPlayed", styleCell);

	setTimeout(() => {
		const shipsArea = document.querySelector(".ships-area");
		shipsArea.appendChild(new DomShip(5).element);
		shipsArea.appendChild(new DomShip(4).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(2).element);
	}, 0);

	function createGrid(length) {
		function createCell() {
			const cell = document.createElement("div");
			cell.className = "cell";
			return cell;
		}

		const domBoard = document.createElement("div");
		domBoard.className = "board";
		const grid = document.createElement("div");
		grid.className = "grid";

			for (let j = 0; j < board.length; j++) {
		for (let i = 0; i < length; i++) {
			for (let j = 0; j < length; j++) {
				const cell = createCell();
				cell.dataset.row = i;
				cell.dataset.col = j;
				domBoard.appendChild(cell);
			}
		}
		const playerArea = document.querySelectorAll(".player-area")[index];
		if (playerArea.querySelector(".board")) {

		return grid;
	}

	function createDomBoard(length, index) {
		const domBoard = createGrid(length);
		domBoard.classList.add("board");
		domBoard.dataset.player = index + 1;

		const boardsArea = document.querySelectorAll(".boards")[index];
		if (boardsArea.querySelector(".board")) {
			boardsArea.removeChild(boardsArea.querySelector(".grid.board"));
		}
		boardsArea.appendChild(domBoard);
		return domBoard;
	}
	function createShipsBoard(index) {
		const shipsBoard = document.createElement("div");
		shipsBoard.className = "grid ships";

		const boardsArea = document.querySelectorAll(".boards")[index];
		if (boardsArea.querySelector(".ships")) {
			boardsArea.removeChild(boardsArea.querySelector(".ships"));
		boardsArea.appendChild(shipsBoard);
		return shipsBoard;
	}

	function renderShips(board, ships) {
		ships.forEach((ship) => {
			const domShip = document.createElement("div");
			domShip.className = "ship";
			domShip.dataset.length = ship.length;

			domShip.style.width = `calc(var(--cell-size) * ${ship.length})`;
			domShip.style.height = `var(--cell-size)`;

			domShip.style.backgroundColor = `rgba(0,0,0,0.3)`;
			board.appendChild(domShip);
			domShip.style.gridRow = `${ship[0][0] + 1}/${
				ship[0][1] + 1 + ship.length
			}`;
			domShip.style.gridColumnStart = `${ship[0][1] + 1}`;
		});
	}

	function renderBoards(boardArray) {
		boardArray.forEach((board, index) => {
			createDomBoard(board, index);
			pubsub.publish("boardRendered", domBoard);

			const shipsBoard = createShipsBoard(index);
			renderShips(shipsBoard, data.ships);
		});
	}

	function styleCell({ board: boardNumber, row, col, isHit }) {
		const board = document.querySelectorAll(".board")[boardNumber];
		const cell = getCellByCoordinates(board, row, col);
		isHit ? cell.classList.add("hit") : cell.classList.add("miss");
	}
})();
