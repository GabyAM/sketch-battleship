import { pubsub } from "./pubsub.js";
import { getId } from "./utilities.js";

export function getGridCoords(grid, event) {
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

export const domController = (function () {
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
					element.style.gridRowStart = `${i + 1}`;
					element.style.gridColumnStart = `${j + 1}`;
				}
			}
		}
	}

	function renderBoards(boardArray) {
		boardArray.forEach((data, index) => {
			const boardsArea = document.querySelectorAll(".boards")[index];
			boardsArea.innerHTML = "";
			const domBoard = createDomBoard(data.board.length, index);

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
