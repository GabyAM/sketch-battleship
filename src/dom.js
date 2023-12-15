import { pubsub } from "./pubsub.js";

function getCellByCoordinates(board, row, col) {
	const cells = [...board.querySelectorAll(".cell")];
	return cells.find(
		(cell) => cell.dataset.row === row && cell.dataset.col === col
	);
}

function getGridCoords(event) {
	// const grid = event.target;
	const grid = document.querySelector(".grid.ships");
	const rect = grid.getBoundingClientRect();
	const cellSize = rect.width / 10;

	const clickedX = event.clientX - rect.left;
	const clickedY = event.clientY - rect.top;

	const row = Math.floor(clickedY / cellSize);
	const col = Math.floor(clickedX / cellSize);
	return { row, col };
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

	addDraggable(ship) {
		let isDown = false;
		let offsetX, offsetY;
		ship.addEventListener("mousedown", (e) => {
			isDown = true;
			ship.style.position = "absolute";
			ship.style.left = `${e.clientX - 10}px`;
			ship.style.top = `${e.clientY - 10}px`;
			const rect = ship.getBoundingClientRect();
			offsetX = e.clientX - rect.left;
			offsetY = e.clientY - rect.top;
		});
		window.addEventListener("mouseup", (e) => {
			if (isDown) {
				isDown = false;
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (isDown) {
				ship.style.left = `${e.clientX - offsetX}px`;
				ship.style.top = `${e.clientY - offsetY}px`;

			}
		});
	}
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

		const grid = document.createElement("div");
		grid.className = "grid";

		for (let i = 0; i < length; i++) {
			for (let j = 0; j < length; j++) {
				const cell = createCell();
				cell.dataset.row = i;
				cell.dataset.col = j;
				grid.appendChild(cell);
			}
		}

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
		}
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
		boardArray.forEach((data, index) => {
			const domBoard = createDomBoard(data.board.length, index);
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
