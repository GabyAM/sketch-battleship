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

	function createDomBoard(board, index) {
		function createBoardCell() {

	const ships = document.querySelectorAll(".ship");
	function handleDrag(e) {
		const length = e.target.children.length;
		const board = document.querySelector(".board");
		board.addEventListener("dragover", (e) => e.preventDefault());
		board.addEventListener("drop", (e) => {
			const targetCell = e.target;
			const { row, col } = targetCell.dataset;
			pubsub.publish("shipPlaced", { row, col, length });
		});
	}
	ships.forEach((ship) => ship.addEventListener("dragstart", handleDrag));
	setTimeout(() => {
		const shipsArea = document.querySelector(".ships-area");
		shipsArea.appendChild(new DomShip(5).element);
		shipsArea.appendChild(new DomShip(4).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(2).element);
	}, 0);

			const cell = document.createElement("div");
			cell.className = "cell";
			return cell;
		}

		const domBoard = document.createElement("div");
		domBoard.className = "board";
		domBoard.dataset.player = index + 1;

		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board.length; j++) {
				const cell = createBoardCell();
				cell.dataset.row = i;
				cell.dataset.col = j;
				domBoard.appendChild(cell);
			}
		}
		const playerArea = document.querySelectorAll(".player-area")[index];
		if (playerArea.querySelector(".board")) {
			playerArea.removeChild(playerArea.lastChild);
		}
		playerArea.appendChild(domBoard);
		pubsub.publish("boardRendered", domBoard);
	}

	function renderBoards(boardArray) {
		boardArray.forEach((board, index) => {
			createDomBoard(board, index);
		});
	}

	function styleCell({ board: boardNumber, row, col, isHit }) {
		const board = document.querySelectorAll(".board")[boardNumber];
		const cell = getCellByCoordinates(board, row, col);
		isHit ? cell.classList.add("hit") : cell.classList.add("miss");
	}
})();
