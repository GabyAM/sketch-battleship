import { getGridCoords } from "./dom.js";
import { pubsub } from "./pubsub.js";

function handleBoardClick(event) {
	if (event.target.classList.contains("attacks")) {
		const { row, col } = getGridCoords(event.target, event);
		pubsub.publish("cellSelected", {
			row,
			col,
		});
	}
}

export function swapBoardEvent({ boardNumber }) {
	console.log(`player ${boardNumber + 1} just attacked`);
	const board = document.querySelectorAll(".attacks")[boardNumber];
	const otherBoard =
		document.querySelectorAll(".attacks")[boardNumber === 0 ? 1 : 0];
	board.removeEventListener("click", handleBoardClick);
	otherBoard.addEventListener("click", handleBoardClick);
}

export function removeBoardEvents() {
	const boards = document.querySelectorAll(".attacks");
	boards.forEach((board) =>
		board.removeEventListener("click", handleBoardClick)
	);
}

const startGameButton = document.querySelector("#start");

function startButtonPressedCallback() {
	function gameStartCallback() {
		document
			.querySelectorAll(".ships.grid")
			.forEach((grid) => (grid.style.zIndex = "1"));
		document
			.querySelectorAll(".attacks")[1]
			.addEventListener("click", handleBoardClick);
		pubsub.unsubscribe("gameStarted", gameStartCallback);
		startGameButton.removeEventListener(
			"click",
			startButtonPressedCallback
		);
	}
	pubsub.subscribe("gameStarted", gameStartCallback);
	pubsub.publish("startButtonPressed");
}
startGameButton.addEventListener("click", startButtonPressedCallback);
