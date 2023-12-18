import { getGridCoords } from "./dom.js";
import { pubsub } from "./pubsub.js";

function handleBoardClick(event) {
	const { row, col } = getGridCoords(event.target, event);
	pubsub.publish("cellSelected", {
		row,
		col,
	});
}

export function swapBoardEvent({ board: boardIndex }) {
	const board = document.querySelectorAll(".attacks")[boardIndex];
	const otherBoard =
		document.querySelectorAll(".attacks")[boardIndex === 0 ? 1 : 0];
	board.removeEventListener("click", handleBoardClick);
	otherBoard.addEventListener("click", handleBoardClick);
}

export function removeBoardEvents() {
	const boards = document.querySelectorAll(".attacks");
	boards.forEach((board) =>
		board.removeEventListener("click", handleBoardClick)
	);
}

