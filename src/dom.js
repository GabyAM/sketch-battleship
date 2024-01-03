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

class DomShip {
	constructor(length) {
		this.length = length;
		this.id = getId();
		this.isRotated = false;
		this.element = this.createElement(length);
		this.adjustSize();
	}

	//not really necessary
	adjustSize() {
		if (this.isRotated) {
			this.element.style.width = "40px";
			this.element.style.height = `${40 * this.length}px`;
		} else {
			this.element.style.width = `${40 * this.length}px`;
			this.element.style.height = "40px";
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
		const ship = domController.createShipElement(this.length, this.id);

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

	// setTimeout(() => {
	// 	const shipsArea = document.querySelector(".ships-area");
	// 	const firstShip = new DomShip(5);
	// 	pubsub.publish("shipCreated", firstShip);
	// 	const secondShip = new DomShip(4);
	// 	pubsub.publish("shipCreated", secondShip);
	// 	const thirdShip = new DomShip(3);
	// 	pubsub.publish("shipCreated", thirdShip);
	// 	const fourthShip = new DomShip(3);
	// 	pubsub.publish("shipCreated", fourthShip);
	// 	const fifthShip = new DomShip(2);
	// 	pubsub.publish("shipCreated", fifthShip);
	// 	shipsArea.appendChild(firstShip.element);
	// 	shipsArea.appendChild(secondShip.element);
	// 	shipsArea.appendChild(thirdShip.element);
	// 	shipsArea.appendChild(fourthShip.element);
	// 	shipsArea.appendChild(fifthShip.element);
	// 	shipsArea.querySelectorAll(".ship").forEach((ship, index) => {
	// 		ship.style.top = `${index * 50}px`;
	// 	});
	// }, 0);

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

	function createShipElement(length, id) {
		const ship = document.createElement("div");
		const shipImage = document.createElement("div");
		ship.appendChild(shipImage);

		ship.className = `ship`;
		shipImage.className = `ship-image length-${length}`;
		shipImage.style.width = `${length * 40}px`;
		shipImage.style.height = "40px";

		ship.dataset.length = length;
		ship.dataset.id = id;

		return ship;
	}

	function renderShips(board, ships) {
		ships.forEach((ship) => {
			const domShip = createShipElement(ship.length, ship.id);
			if (ship.isSunk) {
				domShip.classList.add("sunk");
			}
			if (ship.end[0] > ship.start[0]) {
				const shipImage = domShip.querySelector(".ship-image");
				shipImage.classList.add("rotated");
			}

			board.appendChild(domShip);
			domShip.style.gridRow = `${ship.start[0] + 1} / ${ship.end[0] + 2}`;
			domShip.style.gridColumn = `${ship.start[1] + 1} / ${
				ship.end[1] + 2
			}`;
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

	function styleSunkShip(boardNumber, id /*cells*/) {
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
	return { createShipElement };
})();
