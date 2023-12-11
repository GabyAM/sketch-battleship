import { pubsub } from "./pubsub.js";

function getCellByCoordinates(board, row, col) {
	const cells = [...board.querySelectorAll(".cell")];
	return cells.find(
		(cell) => cell.dataset.row === row && cell.dataset.col === col
	);
}

export const domController = (function () {
	pubsub.subscribe("gameLoaded", createDomBoard);
	pubsub.subscribe("turnPlayed", styleCell);

	function createDomBoard(board) {
		function createBoardCell() {
			const cell = document.createElement("div");
			cell.className = "cell";
			return cell;
		}

		const domBoard = document.createElement("div");
		domBoard.className = "board";

		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board.length; j++) {
				const cell = createBoardCell();
				cell.dataset.row = i;
				cell.dataset.col = j;
				domBoard.appendChild(cell);
			}
		}
		document.querySelector("body").appendChild(domBoard);
		pubsub.publish("boardRendered", domBoard);
	}

	function styleCell({ board: boardNumber, row, col, isHit }) {
		const board = document.querySelectorAll(".board")[boardNumber];
		const cell = getCellByCoordinates(board, row, col);
		isHit ? cell.classList.add("hit") : cell.classList.add("miss");
	}
})();
