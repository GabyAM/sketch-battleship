import { getGridCoords } from "./dom.js";
import { pubsub } from "./pubsub.js";

pubsub.subscribe("turnPlayed", handleBoardEvent);
pubsub.subscribe("gameEnded", removeBoardEvents);
pubsub.subscribe("shipCreated", addShipEvents);
pubsub.subscribe("shipsMenuOpened", disableClearButton);
pubsub.subscribe("shipsMenuClosed", enableClearButton);

function handleBoardClick(event) {
	if (event.target.classList.contains("attacks")) {
		const { row, col } = getGridCoords(event.target, event);
		pubsub.publish("cellSelected", {
			row,
			col,
		});
	}
}

export function handleBoardEvent(playerNumber) {
	const board = document.querySelector(".player-area:last-of-type .attacks");
	if (playerNumber === 1) {
		board.addEventListener("click", handleBoardClick);
	} else {
		board.removeEventListener("click", handleBoardClick);
	}
}

export function removeBoardEvents() {
	const board = document.querySelector(".player-area:last-of-type .attacks");
	board.removeEventListener("click", handleBoardClick);
}

const startGameButton = document.querySelector("#start");

function resetButtonPressedCallback() {
	startGameButton.removeEventListener("click", resetButtonPressedCallback);

	function gameResetCallback() {
		enableActionButtons();
		changeMainButtonEvent();
		pubsub.unsubscribe("gameReset", gameResetCallback);
	}
	pubsub.subscribe("gameReset", gameResetCallback);

	const playerOneShips = [...document.querySelectorAll(".player-1 .ship")];
	const playerTwoShips = [...document.querySelectorAll(".player-2 .ship")];
	const gameEnded =
		playerOneShips.every((ship) => ship.classList.contains("sunk")) ||
		playerTwoShips.every((ship) => ship.classList.contains("sunk"));

	if (gameEnded) {
		setTimeout(() => {
			pubsub.publish("resetButtonPressed");
		}, 800);
	} else {
		pubsub.publish("beforeReset", gameEnded);
		setTimeout(() => {
			pubsub.publish("resetButtonPressed");
		}, 800);
	}
}

function changeMainButtonEvent() {
	if (startGameButton.textContent === "Start Game") {
		startGameButton.removeEventListener(
			"click",
			startButtonPressedCallback
		);
		startGameButton.addEventListener("click", resetButtonPressedCallback);
		startGameButton.textContent = "Reset Game";
	} else {
		startGameButton.removeEventListener(
			"click",
			resetButtonPressedCallback
		);
		startGameButton.addEventListener("click", startButtonPressedCallback);
		startGameButton.textContent = "Start Game";
	}
}

function startButtonPressedCallback() {
	function gameStartCallback() {
		disableActionButtons();
		document
			.querySelectorAll(".ships.grid")
			.forEach((grid) => (grid.style.zIndex = "1"));
		document
			.querySelectorAll(".attacks")[1]
			.addEventListener("click", handleBoardClick);
		pubsub.unsubscribe("gameStarted", gameStartCallback);
		changeMainButtonEvent();
	}
	pubsub.subscribe("gameStarted", gameStartCallback);
	pubsub.publish("startButtonPressed");
}
startGameButton.addEventListener("click", startButtonPressedCallback);
startGameButton.addEventListener("pointerover", () => {
	startGameButton.classList.add("hovering");
});
startGameButton.addEventListener("pointerleave", () => {
	startGameButton.classList.remove("hovering");
});

function getNonShipElementFromPoint(x, y) {
	return document
		.elementsFromPoint(x, y)
		.find(
			(element) =>
				!element.classList.contains("ship") &&
				!element.classList.contains("ship-image")
		);
}
//receives instance so it can use it's functions
export function addShipEvents(shipInstance) {
	const ship = shipInstance.element;

	let isDown = false;
	let isDragging = false;
	let clickEnabled = false;
	let startX, startY;
	let offsetX, offsetY;
	let prevRow, prevCol;
	const prevTop = ship.style.top;
	const prevLeft = ship.style.left;
	ship.addEventListener("pointerdown", (e) => {
		isDown = true;
		clickEnabled = true;
		const rect = ship.getBoundingClientRect();
		startX = e.clientX;
		startY = e.clientY;
		offsetX = startX - rect.left;
		offsetY = startY - rect.top;
		const shipsGrid = document.querySelector(".ships");
		if (ship.parentElement === shipsGrid) {
			({ row: prevRow, col: prevCol } = getGridCoords(shipsGrid, e));
		}
	});

	window.addEventListener("pointermove", (e) => {
		e.preventDefault();
		if (isDown) {
			const distanceX = Math.abs(e.clientX - startX);
			const distanceY = Math.abs(e.clientY - startY);
			if (distanceX > 5 || distanceY > 5) {
				isDragging = true;
				clickEnabled = false;
			}
			ship.style.position = "absolute";
			ship.style.left = `${e.clientX - offsetX}px`;
			ship.style.top = `${e.clientY - offsetY}px`;
		}
	});

	window.addEventListener("pointerup", (e) => {
		if (isDown && isDragging) {
			const shipsGrid = document.querySelector(".ships");
			const { row, col } = getGridCoords(shipsGrid, e);
			shipInstance.row = row;
			shipInstance.col = col;
			const IsOutOfBounds = shipInstance.isRotated
				? row + shipInstance.length > 10 || col > 10
				: row > 10 || col + shipInstance.length > 10;

			const dropTarget = getNonShipElementFromPoint(e.clientX, e.clientY);
			if (dropTarget === shipsGrid && !IsOutOfBounds) {
				const shipPlacedResultCallback = (result) => {
					if (result) {
						if (ship.parentElement !== shipsGrid) {
							shipsGrid.appendChild(ship);
						}
						shipInstance.adjustPosition();
						ship.style.position = "static";
					} else {
						ship.style.position = "static";
						shipInstance.adjustPosition(prevRow, prevCol);
					}
					pubsub.unsubscribe(
						`shipPlacedResult_${shipInstance.id}`,
						shipPlacedResultCallback
					);
				};

				pubsub.subscribe(
					`shipPlacedResult_${shipInstance.id}`,
					shipPlacedResultCallback
				);
				pubsub.publish("shipPlaced", {
					cells: shipInstance.getCells(),
					id: shipInstance.id,
					player: getPlayerNumber(e),
				});
			} else {
				if (ship.parentElement === shipsGrid) {
					//this is repeated but eh
					ship.style.position = "static";
					shipInstance.adjustPosition(prevRow, prevCol);
				} else {
					ship.style.top = prevTop;
					ship.style.left = prevLeft;
				}
			}
		}
		setTimeout(() => {
			clickEnabled = true;
		}, 200);
		isDown = false;
		isDragging = false;
	});

	ship.addEventListener("click", (e) => {
		if (
			!isDragging &&
			clickEnabled &&
			ship.parentElement.classList.contains("ships")
		) {
			clickEnabled = false;
			const shipRotatedResultCallback = (result) => {
				if (result === false) {
					shipInstance.rotate();
				}

				pubsub.unsubscribe(
					`shipPlacedResult_${shipInstance.id}`,
					shipRotatedResultCallback
				);
			};
			shipInstance.rotate();
			pubsub.subscribe(
				`shipPlacedResult_${shipInstance.id}`,
				shipRotatedResultCallback
			);
			pubsub.publish("shipPlaced", {
				cells: shipInstance.getCells(),
				id: shipInstance.id,
				player: getPlayerNumber(e),
			});
		}
	});
}

function getPlayerNumber(e) {
	const playerDiv = e.target.closest(".player-area");
	return Number(playerDiv.className.slice(19));
}

function sortButtonPressedCallback(e) {
	pubsub.publish("sortButtonPressed", getPlayerNumber(e));
}

function clearButtonPressedCallback(e) {
	pubsub.publish("clearButtonPressed", getPlayerNumber(e));
}

const sortShipsButton = document.querySelector(".sort-ships");
const clearBoardButton = document.querySelector(".clear-board");
const actionButtons = document.querySelectorAll(".board-buttons-area button");

sortShipsButton.addEventListener("click", sortButtonPressedCallback);

clearBoardButton.addEventListener("click", clearButtonPressedCallback);

actionButtons.forEach((button) => {
	button.addEventListener("pointerover", () => {
		button.parentElement.classList.add("hovering");
	});
	button.addEventListener("pointerleave", () => {
		button.parentElement.classList.remove("hovering");
	});
});

function disableButton(button) {
	button.disabled = true;
	button.parentElement.classList.add("disabled");
}

function disableSortButton() {
	disableButton(sortShipsButton);
}

export function disableClearButton() {
	disableButton(clearBoardButton);
}

function disableActionButtons() {
	disableSortButton();
	disableClearButton();
}

function enableButton(button) {
	button.disabled = false;
	button.parentElement.classList.remove("disabled");
}

export function enableClearButton() {
	enableButton(clearBoardButton);
}
function enableSortButton() {
	enableButton(sortShipsButton);
}

function enableActionButtons() {
	enableSortButton();
	enableClearButton();
}
