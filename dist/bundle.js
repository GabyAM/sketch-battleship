/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/pubsub.js
const pubsub = (function () {
	const events = {};
	function subscribe(eventName, func) {
		if (!events[eventName]) {
			events[eventName] = [];
		}
		events[eventName].push(func);
	}
	function unsubscribe(eventName, func) {
		if (events[eventName]) {
			events[eventName] = events[eventName].filter((f) => f !== func);
		}
	}
	function publish(eventName, value = null) {
		if (events[eventName]) {
			events[eventName].forEach((func) => func(value));
		}
	}

	return { subscribe, unsubscribe, publish };
})();

;// CONCATENATED MODULE: ./src/utilities.js
let count = 0;
function getId() {
	count++;
	return count;
}

//since this function has to know about the ship field, it may go in game.js
function getKeyFromValue(obj, value) {
	return Object.keys(obj).find((key) => obj[key].ship === value);
}

;// CONCATENATED MODULE: ./src/dom.js



function getGridCoords(grid, event) {
	function getCoords(e) {
		const rect = grid.getBoundingClientRect();
		const cellSize = rect.width / 10;

		const currentX = e.clientX - rect.left;
		const currentY = e.clientY - rect.top;

		const row = Math.floor(currentY / cellSize);
		const col = Math.floor(currentX / cellSize);
		return { row, col };
	}
	return getCoords(event);
}

const cellSize = 25;
class DomShip {
	constructor(length, isRotated = false, id = getId()) {
		this.length = length;
		this.id = id;
		this.isRotated = isRotated;
		this.element = this.createElement(length);

		this.adjustSize();
	}

	//not really necessary
	adjustSize() {
		if (this.isRotated) {
			this.element.style.width = `${cellSize}px`;
			this.element.style.height = `${cellSize * this.length}px`;
		} else {
			this.element.style.width = `${cellSize * this.length}px`;
			this.element.style.height = `${cellSize}px`;
		}
	}

	adjustPosition(row = this.row, col = this.col) {
		if (this.isRotated) {
			this.element.style.gridArea = `${row + 1} / ${col + 1} / ${
				row + 1 + this.length
			} / ${col + 1}`;
		} else {
			this.element.style.gridArea = `${row + 1} / ${col + 1} / ${
				row + 1
			} / ${col + 1 + this.length}`;
		}
	}

	createElement() {
		const ship = document.createElement("div");
		const shipImage = document.createElement("div");
		ship.appendChild(shipImage);

		ship.className = `ship`;
		shipImage.className = `ship-image length-${this.length}`;
		//There are two different images for ships with length 3
		if (
			this.length === 3 &&
			document.querySelectorAll(".length-3").length % 2 !== 0
		) {
			shipImage.classList.add("alternative");
		}

		shipImage.style.width = `${this.length * cellSize}px`;
		shipImage.style.height = `${cellSize}px`;

		ship.dataset.length = this.length;
		ship.dataset.id = this.id;

		ship.style.position = "absolute";
		return ship;
	}

	getCells() {
		if (this.col === null || this.row === null) {
			throw new Error("The ship must be placed first!");
		}

		const shipCells = [];
		for (let i = 0; i < this.length; i++) {
			const pos = this.isRotated
				? [this.row + i, this.col]
				: [this.row, this.col + i];
			shipCells.push(pos);
		}
		return shipCells;
	}

	rotate() {
		this.isRotated = !this.isRotated;
		if (this.isRotated) {
			this.element.querySelector(".ship-image").classList.add("rotated");
		} else {
			this.element
				.querySelector(".ship-image")
				.classList.remove("rotated");
		}
		this.adjustSize();
		this.adjustPosition();
	}
}

const domController = (function () {
	pubsub.subscribe("boardsUpdated", renderBoards);
	pubsub.subscribe("attackPerformed", displayTurn);
	pubsub.subscribe("clearButtonPressed", showShipsMenu);
	pubsub.subscribe("sortButtonPressed", hideShipsMenu);
	pubsub.subscribe("gameEnded", renderGameEndScreen);
	pubsub.subscribe("gameReset", resetScreen);
	pubsub.subscribe("beforeReset", resetScreen);

	function createDomBoard(length, index) {
		function createCell() {
			const cell = document.createElement("div");
			cell.className = "cell";
			return cell;
		}

		const grid = createGridLayer("board", index);
		for (let i = 0; i < length; i++) {
			for (let j = 0; j < length; j++) {
				const cell = createCell();
				grid.appendChild(cell);
			}
		}

		const boardsArea = document.querySelectorAll(".boards")[index];
		boardsArea.appendChild(grid);
		return grid;
	}

	function createGridLayer(gridClass, index) {
		const grid = document.createElement("div");
		grid.className = `grid ${gridClass}`;

		const boardsArea = document.querySelectorAll(".boards")[index];
		boardsArea.appendChild(grid);
		return grid;
	}

	function renderShips(board, ships) {
		ships.forEach((ship) => {
			const isShipRotated = ship.end[0] > ship.start[0];
			const shipInstance = new DomShip(
				ship.length,
				isShipRotated,
				Number(ship.id)
			);
			shipInstance.row = ship.start[0];
			shipInstance.col = ship.start[1];
			pubsub.publish("shipCreated", shipInstance);

			const domShip = shipInstance.element;
			domShip.style.position = "static";
			if (ship.isSunk) {
				domShip.classList.add("sunk");
			}
			if (isShipRotated) {
				const shipImage = domShip.querySelector(".ship-image");
				shipImage.classList.add("rotated");
			}

			board.appendChild(domShip);
			domShip.style.gridArea = `${ship.start[0] + 1} / ${
				ship.start[1] + 1
			} / ${ship.end[0] + 2} / ${ship.end[1] + 2}`;
		});
	}

	function createAttackElement() {
		const element = document.createElement("div");
		element.className = "attack";
		return element;
	}

	function renderAttacks(domBoard, board) {
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board.length; j++) {
				if (board[i][j] === true || board[i][j] === false) {
					const element = createAttackElement();
					domBoard.appendChild(element);
					element.style.gridArea = `${i + 1} / ${j + 1} / ${
						i + 1
					} / ${j + 1}`;
				}
			}
		}
	}

	function renderBoards(boardArray) {
		boardArray.forEach((data, index) => {
			const boardsArea = document.querySelectorAll(".boards")[index];
			boardsArea.innerHTML = "";
			createDomBoard(data.board.length, index);

			const shipsBoard = createGridLayer("ships", index);
			renderShips(shipsBoard, data.ships);

			const attacksBoard = createGridLayer("attacks", index);
			attacksBoard.dataset.player = index + 1;
			renderAttacks(attacksBoard, data.board);
		});
		pubsub.publish("boardsRendered");
	}

	function styleAttackedCell(boardNumber, row, col, isHit) {
		const board = document.querySelectorAll(".attacks.grid")[boardNumber];
		const element = createAttackElement();
		board.appendChild(element);
		element.style.gridRowStart = `${row + 1}`;
		element.style.gridColumnStart = `${col + 1}`;
		if (isHit) {
			const smokeImage = document.createElement("div");
			smokeImage.classList.add("smoke");
			element.appendChild(smokeImage);
		}
	}

	function styleSunkShip(boardNumber, id) {
		const shipsGrid = document.querySelectorAll(".ships.grid")[boardNumber];
		const ship = shipsGrid.querySelector(`.ship[data-id="${id}"]`);
		ship.classList.add("sunk");
	}

	function displayTurn({ boardNumber, row, col, isHit, id }) {
		styleAttackedCell(boardNumber, row, col, isHit);
		if (isHit && id !== undefined) {
			styleSunkShip(boardNumber, id);
		}
		pubsub.publish("turnDisplayed");
	}

	function showShipsMenu() {
		const shipsArea = document.querySelector(".ships-area");
		shipsArea.style.left = "0";

		const firstShip = new DomShip(5);
		shipsArea.appendChild(firstShip.element);
		const secondShip = new DomShip(4);
		shipsArea.appendChild(secondShip.element);
		const thirdShip = new DomShip(3);
		shipsArea.appendChild(thirdShip.element);
		const fourthShip = new DomShip(3);
		shipsArea.appendChild(fourthShip.element);
		const fifthShip = new DomShip(2);
		shipsArea.appendChild(fifthShip.element);

		shipsArea.querySelectorAll(".ship").forEach((ship, index) => {
			ship.style.top = `${(index + 2) * 50}px`;
			ship.style.left = "20px";
		});

		pubsub.publish("shipCreated", firstShip);
		pubsub.publish("shipCreated", secondShip);
		pubsub.publish("shipCreated", thirdShip);
		pubsub.publish("shipCreated", fourthShip);
		pubsub.publish("shipCreated", fifthShip);
		pubsub.publish("shipsMenuOpened");
		setShipsAreaObserver();
	}

	function hideShipsMenu() {
		const shipsArea = document.querySelector(".ships-area");
		if (shipsArea.style.left === "0px") {
			shipsArea.innerHTML = "";
			shipsArea.style.left = "-20%";
			pubsub.publish("shipsMenuClosed");
		}
	}

	function setShipsAreaObserver() {
		const callback = (mutations, observer) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type === "childList" &&
					mutation.target.childNodes.length === 0
				) {
					hideShipsMenu();
					observer.disconnect();
				}
			});
		};
		const observer = new MutationObserver(callback);
		observer.observe(document.querySelector(".ships-area"), {
			childList: true,
		});
	}

	function toggleGameVisibility() {
		const boardAreas = document.querySelectorAll(".boards");
		const buttonContainers = document.querySelectorAll(".button-container");
		const gameElements = [...boardAreas].concat([...buttonContainers]);
		if (document.querySelector(".boards").style.opacity === "0") {
			gameElements.forEach((element) => {
				element.style.visibility = "visible";
			});
			gameElements.forEach((element) => {
				element.style.opacity = "1";
			});
		} else {
			gameElements.forEach((element) => {
				element.style.opacity = "0";
			});
			setTimeout(() => {
				gameElements.forEach((element) => {
					element.style.visibility = "hidden";
				});
			}, 800);
		}
	}

	function renderGameEndScreen(winner) {
		function createEndCard(result) {
			const card = document.createElement("div");
			card.className = `${result} card hidden`;
			return card;
		}

		let winnerBoard;
		let loserBoard;
		if (winner === "1") {
			winnerBoard = document.querySelector(".player-area.player-1");
			loserBoard = document.querySelector(".player-area.player-2");
		} else {
			winnerBoard = document.querySelector(".player-area.player-2");
			loserBoard = document.querySelector(".player-area.player-1");
		}

		toggleGameVisibility();
		const winnerCard = createEndCard("winner");
		winnerBoard.appendChild(winnerCard);
		const loserCard = createEndCard("loser");
		loserBoard.appendChild(loserCard);

		//ugly code :)
		document.querySelector(".game").style.padding = "0";
		setTimeout(() => {
			winnerCard.classList.remove("hidden");
			loserCard.classList.remove("hidden");
		}, 0);
	}

	function removeGameEndScreen() {
		const firstCard = document.querySelector(".player-1 .card");
		const secondCard = document.querySelector(".player-2 .card");
		firstCard.classList.add("hidden");
		secondCard.style.opacity = "0";
		setTimeout(() => {
			document.querySelector(".player-1").removeChild(firstCard);
			document.querySelector(".player-2").removeChild(secondCard);
			document.querySelector(".game").style.paddingBottom = "5%";
		}, 800);
	}

	function resetScreen(gameEnded) {
		if (gameEnded) {
			removeGameEndScreen();
			setTimeout(() => {
				toggleGameVisibility();
			}, 800);
		} else {
			toggleGameVisibility();
			setTimeout(() => {
				toggleGameVisibility();
			}, 800);
		}
	}
})();

;// CONCATENATED MODULE: ./src/eventListeners.js



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

function handleBoardEvent(playerNumber) {
	const board = document.querySelector(".player-area:last-of-type .attacks");
	if (playerNumber === 1) {
		board.addEventListener("click", handleBoardClick);
	} else {
		board.removeEventListener("click", handleBoardClick);
	}
}

function removeBoardEvents() {
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
function addShipEvents(shipInstance) {
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

function disableClearButton() {
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

function enableClearButton() {
	enableButton(clearBoardButton);
}
function enableSortButton() {
	enableButton(sortShipsButton);
}

function enableActionButtons() {
	enableSortButton();
	enableClearButton();
}

;// CONCATENATED MODULE: ./src/game.js



const HORIZONTAL_MOVES = [
	[0, 1],
	[0, -1],
];
const VERTICAL_MOVES = [
	[1, 0],
	[-1, 0],
];
const Moves = [HORIZONTAL_MOVES, VERTICAL_MOVES];
const Directions = ["horizontal", "vertical"];

class Ship {
	constructor(length) {
		this.length = length;
		this.hitsReceived = 0;
	}

	hit() {
		this.hitsReceived++;
	}

	isSunk() {
		return this.hitsReceived === this.length;
	}
}

class GameBoard {
	constructor() {
		this.initializeBoard();
	}

	initializeBoard() {
		this.board = Array(10);
		for (let i = 0; i < 10; i++) {
			this.board[i] = Array(10).fill(null);
		}
		this.ships = {};
	}

	isOutOfBounds(row, col) {
		return row < 0 || row > 9 || col < 0 || col > 9;
	}

	placeShip(cells, id) {
		//checks that is not out of bounds and that doesn't collide with any ship

		if (
			this.isOutOfBounds(
				cells[cells.length - 1][0],
				cells[cells.length - 1][1]
			) ||
			cells.some(
				(pos) =>
					(this.isShip(pos[0], pos[1]) &&
						this.board[pos[0]][pos[1]].id !== id) ||
					typeof this.getValueAt(pos[0], pos[1]) === "boolean"
			) //there can be a ship with the same id (means that it's moving) or null
		) {
			return false;
		}

		if (!Object.prototype.hasOwnProperty.call(this.ships, id)) {
			const newShip = new Ship(cells.length);
			this.ships[`${id}`] = { ship: newShip, cells };
		} else {
			const shipCells = this.ships[`${id}`].cells;
			shipCells.forEach((coords) => {
				this.board[coords[0]][coords[1]] = null;
			});
			this.ships[`${id}`].cells = cells;
		}

		cells.forEach((pos) => {
			this.board[pos[0]][pos[1]] = { isHit: false, id };
		});

		return true;
	}

	isShip(row, col) {
		if (this.isOutOfBounds(row, col)) {
			return false;
		}
		return (
			this.board[row][col] !== null &&
			typeof this.board[row][col] === "object"
		);
	}

	getShipAt(row, col) {
		if (this.isOutOfBounds(row, col)) {
			throw new Error("");
		}
		if (this.isShip(row, col)) {
			return this.ships[this.board[row][col].id].ship;
		}
	}

	//if it's a ship, return the ship if it was not attacked, in any other case return the attack result
	getValueAt(row, col) {
		if (this.isOutOfBounds(row, col)) {
			throw new Error("");
		}
		if (this.isShip(row, col)) {
			if (this.board[row][col].isHit === true) {
				return true;
			}
			return this.getShipAt(row, col);
		} else {
			return this.board[row][col];
		}
	}

	receiveHit(row, col) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.isShip(row, col)) {
			this.getValueAt(row, col).hit();
			this.board[row][col].isHit = true;
			return true;
		} else {
			this.board[row][col] = false;
		}
		return this.board[row][col];
	}

	wasAttacked(row, col) {
		try {
			return typeof this.getValueAt(row, col) !== "object";
		} catch (e) {
			return false;
		}
	}

	isShipLeft() {
		const ships = Object.values(this.ships);
		let shipLeft = false;
		let i = 0;
		while (!shipLeft && i < ships.length) {
			if (!ships[i].ship.isSunk()) {
				shipLeft = true;
			}
			i++;
		}
		return shipLeft;
	}

	placeShipsRandom() {
		this.initializeBoard();

		const moves = [
			[1, 0],
			[0, 1],
		];

		const emptyCells = [];
		for (let i = 0; i < this.board.length; i++) {
			for (let j = 0; j < this.board.length; j++) {
				emptyCells.push([i, j]);
			}
		}

		const placeShipRandom = (length) => {
			let placed = false;
			while (placed === false) {
				const randomPos =
					emptyCells[Math.floor(Math.random() * emptyCells.length)];
				let row = randomPos[0];
				let col = randomPos[1];

				const randomMove =
					moves[Math.floor(Math.random() * moves.length)];
				const cellsArray = [[row, col]];

				for (let i = 0; i < length - 1; i++) {
					row += randomMove[0];
					col += randomMove[1];
					cellsArray.push([row, col]);
				}

				if (this.placeShip(cellsArray, getId()) !== false) {
					placed = true;
					cellsArray.forEach((coords) => {
						const index = emptyCells.indexOf(coords);
						emptyCells.splice(index, 1);
					});
				}
			}
		};

		placeShipRandom(5);
		placeShipRandom(4);
		placeShipRandom(3);
		placeShipRandom(3);
		placeShipRandom(2);
	}
}

class Player {
	constructor(name, enemyGameboard) {
		this.name = name;
		this.enemyGameboard = enemyGameboard;
	}

	attack(row, col) {
		if (this.enemyGameboard.isOutOfBounds(row, col)) {
			throw new Error("");
		}
		this.enemyGameboard.receiveHit(row, col);
		return this.enemyGameboard.getValueAt(row, col);
	}
}

class AiPlayer extends Player {
	constructor(name, enemyGameboard) {
		super(name, enemyGameboard);
		this.shipFound = false;
		this.currentShip = {
			ship: null,
			pos: null,
			direction: null,
			hits: [],
		};
		this.queue = []; //in case it hit a ship while trying to sink other ship, saves it in the queue
	}

	attack(row, col) {
		const originalValue = super.attack(row, col);
		if (this.currentShip.ship && this.currentShip.ship.isSunk()) {
			this.resetCurrentShip();
		}
		return originalValue;
	}

	resetCurrentShip() {
		if (this.queue.length > 0) {
			const nextShip = this.queue.shift();
			this.currentShip.ship = nextShip.ship;
			this.currentShip.pos = nextShip.pos;
		} else {
			this.shipFound = false;
			this.currentShip.ship = null;
			this.currentShip.pos = null;
		}
		this.currentShip.direction = null;
	}

	playTurn() {
		const { row, col } = this.getNextMove();

		const cellValue = this.enemyGameboard.getValueAt(row, col);

		if (
			cellValue instanceof Ship &&
			cellValue.hitsReceived === 0 &&
			!this.shipFound
		) {
			this.shipFound = true;
			this.currentShip.pos = [row, col];
			this.currentShip.ship = cellValue;
		}
		if (this.shipFound && cellValue instanceof Ship) {
			if (cellValue !== this.currentShip.ship) {
				//this means another ship was hit
				this.queue.push({ pos: [row, col], ship: cellValue });
			}
			this.currentShip.hits.push([row, col]);

			const currentPos = this.currentShip.pos;
			for (let i = 0; i < Moves.length; i++) {
				for (let j = 0; j < Moves[i].length; j++) {
					if (
						currentPos[0] + Moves[i][j][0] === row &&
						currentPos[1] + Moves[i][j][1] === col
					) {
						this.currentShip.direction = Directions[i];
						break;
					}
				}
			}
		}

		setTimeout(() => {
			gameController.playTurn({ row, col });
		}, 1000);
	}

	getNextMove() {
		const getPossibleMoves = (pos) => {
			const calculatePossibleMoves = (
				moves,
				startingRow,
				startingCol
			) => {
				const possibleMoves = [];
				for (const move of moves) {
					let row = startingRow;
					let col = startingCol;

					while (
						row >= 0 &&
						row < 10 &&
						col >= 0 &&
						col < 10 &&
						this.enemyGameboard.isShip(row, col) &&
						this.enemyGameboard.getValueAt(row, col) === true &&
						!this.enemyGameboard.getShipAt(row, col).isSunk()
					) {
						row += move[0];
						col += move[1];
					}
					if (
						row >= 0 &&
						row < 10 &&
						col >= 0 &&
						col < 10 &&
						!this.enemyGameboard.wasAttacked(row, col)
					) {
						possibleMoves.push([row, col]);
					}
				}
				return possibleMoves;
			};
			const getMovesByDirection = (direction) => {
				if (direction === "horizontal") {
					return HORIZONTAL_MOVES;
				} else if (direction === "vertical") {
					return VERTICAL_MOVES;
				} else {
					return Moves.flat();
				}
			};
			let moves = getMovesByDirection(this.currentShip.direction);
			let possibleMoves = calculatePossibleMoves(moves, pos[0], pos[1]);
			if (possibleMoves.length === 0) {
				this.currentShip.direction =
					this.currentShip.direction === "horizontal"
						? "vertical"
						: "horizontal";
				moves = getMovesByDirection(this.currentShip.direction);
				possibleMoves = calculatePossibleMoves(moves, pos[0], pos[1]);
			}
			return possibleMoves;
		};

		let row, col;
		if (this.shipFound) {
			const moves = getPossibleMoves(this.currentShip.pos);
			const randomMove = moves[Math.floor(Math.random() * moves.length)];
			row = randomMove[0];
			col = randomMove[1];
		} else {
			row = Math.floor(Math.random() * 10);
			col = Math.floor(Math.random() * 10);

			while (
				typeof this.enemyGameboard.getValueAt(row, col) === "boolean"
			) {
				row = Math.floor(Math.random() * 10);
				col = Math.floor(Math.random() * 10);
			}
		}
		return { row, col };
	}
}

const gameController = (function () {
	let currentPlayer;
	let player1;
	let gameBoard1;
	let player2;
	let gameBoard2;
	let gameStatus = "Not started"; //"Not started" || "Started" || "Ended"

	function updateBoards() {
		pubsub.publish("boardsUpdated", [
			{ board: gameBoard1.board, ships: mapShips(gameBoard1.ships) },
			{ board: gameBoard2.board, ships: mapShips(gameBoard2.ships) },
		]);
	}

	function init() {
		gameBoard1 = new GameBoard(10);
		gameBoard2 = new GameBoard(10);
		gameBoard1.placeShipsRandom();
		gameBoard2.placeShipsRandom();

		player1 = new Player("player 1", gameBoard2);
		player2 = new AiPlayer("player 2", gameBoard1);
		gameStatus = "Not started";

		currentPlayer = player1;
		updateBoards();
	}

	function resetGame() {
		const gameEnded = gameStatus === "Ended";
		init();
		pubsub.publish("gameReset", gameEnded);
	}

	function mapShips(ships) {
		return Object.values(ships).map((ship) => {
			return {
				id: getKeyFromValue(ships, ship.ship),
				length: ship.ship.length,
				start: ship.cells[0],
				end: ship.cells[ship.cells.length - 1],
				isSunk: ship.ship.isSunk(),
			};
		});
	}

	function startGame() {
		if (
			Object.keys(gameBoard1.ships).length === 5 &&
			Object.keys(gameBoard2.ships).length === 5
		) {
			function gameStartedCallback() {
				gameStatus = "Started";
				pubsub.publish("gameStarted");
				pubsub.unsubscribe("boardsRendered", gameStartedCallback);
			}
			pubsub.subscribe("boardsRendered", gameStartedCallback);
			updateBoards();
		}
	}

	function handlePlaceShip({ cells, id, player }) {
		const result =
			player === 1
				? gameBoard1.placeShip(cells, id)
				: gameBoard2.placeShip(cells, id);
		pubsub.publish(`shipPlacedResult_${id}`, result);
	}

	function handleSortShips(player) {
		player === 1
			? gameBoard1.placeShipsRandom()
			: gameBoard2.placeShipsRandom();

		updateBoards();
	}

	function handleClearBoard(player) {
		player === 1
			? gameBoard1.initializeBoard()
			: gameBoard2.initializeBoard();
		updateBoards();
	}

	function getCurrentPlayer() {
		return currentPlayer;
	}

	function isGameOver() {
		return !gameBoard1.isShipLeft() || !gameBoard2.isShipLeft();
	}

	function getWinner() {
		if (isGameOver()) {
			return !gameBoard1.isShipLeft() ? "2" : "1";
		}
	}

	function playTurn({ row, col }) {
		const selectedCell = currentPlayer.enemyGameboard.getValueAt(row, col);
		if (typeof selectedCell === "boolean") return;
		const isHit = currentPlayer.attack(row, col);
		let shipId;

		if (selectedCell instanceof Ship && selectedCell.isSunk()) {
			const shipsObject = currentPlayer.enemyGameboard.ships;
			shipId = getKeyFromValue(shipsObject, selectedCell);
		}

		currentPlayer = currentPlayer === player1 ? player2 : player1;

		function turnDisplayedCallback() {
			pubsub.unsubscribe("turnDisplayed", turnDisplayedCallback);
			if (isGameOver()) {
				gameStatus = "Ended";
				pubsub.publish("gameEnded", getWinner());
			} else {
				pubsub.publish("turnPlayed", currentPlayer === player1 ? 1 : 2);
				if (currentPlayer instanceof AiPlayer) currentPlayer.playTurn();
			}
		}
		pubsub.subscribe("turnDisplayed", turnDisplayedCallback);
		pubsub.publish("attackPerformed", {
			boardNumber: currentPlayer === player1 ? 0 : 1,
			row,
			col,
			isHit,
			id: shipId,
		});
	}

	pubsub.subscribe("cellSelected", playTurn);
	pubsub.subscribe("shipPlaced", handlePlaceShip);
	pubsub.subscribe("sortButtonPressed", handleSortShips);
	pubsub.subscribe("clearButtonPressed", handleClearBoard);
	pubsub.subscribe("startButtonPressed", startGame);
	pubsub.subscribe("resetButtonPressed", resetGame);
	return { init, getCurrentPlayer, isGameOver, playTurn };
})();

;// CONCATENATED MODULE: ./src/index.js





gameController.init();

/******/ })()
;