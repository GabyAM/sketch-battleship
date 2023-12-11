import { pubsub } from "./pubsub.js";

export const domController = (function () {
	pubsub.subscribe("gameLoaded", createDomBoard);

	function createDomBoard(board) {
		function createBoardCell(value) {
			const cell = document.createElement("div");
			cell.className = "cell";
			cell.textContent = value;
			return cell;
		}

		const domBoard = document.createElement("div");
		domBoard.className = "board";

		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board.length; j++) {
				const cell = createBoardCell(board[i][j]);
				cell.dataset.row = i;
				cell.dataset.col = i;
				domBoard.appendChild(cell);
			}
		}
		document.querySelector("body").appendChild(domBoard);
		pubsub.publish("boardRendered", domBoard);
	}

})();
