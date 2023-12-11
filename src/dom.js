import { pubsub } from "./pubsub.js";

function getCellByCoordinates(board, row, col) {
	const cells = [...board.querySelectorAll(".cell")];
	return cells.find(
		(cell) => cell.dataset.row === row && cell.dataset.col === col
	);
}

export const domController = (function () {
	pubsub.subscribe("boardsUpdated", renderBoards);
	pubsub.subscribe("turnPlayed", styleCell);

	function createDomBoard(board, index) {
		function createBoardCell() {
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
