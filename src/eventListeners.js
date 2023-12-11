import { pubsub } from "./pubsub.js";

export function addBoardEvent(board) {
	board.addEventListener("click", (event) => {
		const cell = event.target;
		if (cell.className === "cell") {
			pubsub.publish("cellSelected", {
				row: cell.dataset.row,
				col: cell.dataset.col,
			});
		}
	});
}
