import { pubsub } from "./pubsub.js";

let count = 0;
function getId() {
	count++;
	return count;
}

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
		this.element = this.createElement(length);
		this.addDraggable(this.element);
		this.length = length;
		this.isRotated = false;
		this.id = getId();
	}

	createElement(length) {
		const ship = document.createElement("div");
		ship.className = "ship";
		ship.style.width = `${40 * length}px`;
		ship.style.height = "40px";
		return ship;
	}

	addDraggable(ship) {
		const shipsGrid = document.querySelector(".grid.ships");

		let isDown = false;
		let offsetX, offsetY;
		ship.addEventListener("mousedown", (e) => {
			isDown = true;
			ship.style.position = "absolute";
			ship.style.left = `${e.clientX - 10}px`;
			ship.style.top = `${e.clientY - 10}px`;
			const rect = ship.getBoundingClientRect();
			offsetX = e.clientX - rect.left;
			offsetY = e.clientY - rect.top;
		});
		window.addEventListener("mouseup", (e) => {
			if (isDown) {
				isDown = false;
				const { row, col } = getGridCoords(shipsGrid, e);
				if (row <= 10 && col + this.length <= 10) {
					if (ship.parentElement !== shipsGrid) {
						shipsGrid.appendChild(ship);
					}
					ship.style.gridRowStart = `${row + 1}`;
					ship.style.gridColumn = `${col + 1} / ${
						col + 1 + this.length
					}`;

					ship.style.position = "static";
						pubsub.publish("shipPlaced", {
							row,
							col,
							length: this.length,
							id: this.id,
						});
				}
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (isDown) {
				ship.style.left = `${e.clientX - offsetX}px`;
				ship.style.top = `${e.clientY - offsetY}px`;

			}
		});
	}
}

export const domController = (function () {
	pubsub.subscribe("boardsUpdated", renderBoards);
	pubsub.subscribe("turnPlayed", styleCell);

	setTimeout(() => {
		const shipsArea = document.querySelector(".ships-area");
		shipsArea.appendChild(new DomShip(5).element);
		shipsArea.appendChild(new DomShip(4).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(3).element);
		shipsArea.appendChild(new DomShip(2).element);
	}, 0);

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
			const domShip = document.createElement("div");
			domShip.className = `ship length-${ship.length} ${
				ship.isSunk ? "sunk" : ""
			}`;
			domShip.dataset.length = ship.length;


			board.appendChild(domShip);
			domShip.style.gridRow = `${ship.start[0] + 1} / ${ship.end[0] + 2}`;
			domShip.style.gridColumn = `${ship.start[1] + 1} / ${
				ship.end[1] + 2
			}`;
		});
	}

	function createAttackElement() {
		function addAttackIcon(element) {
			const icon = document.createElement("span");
			icon.className = "material-symbols-outlined";
			icon.textContent = "close";
			element.appendChild(icon);
		}
		const element = document.createElement("div");
		element.className = "attack";
		addAttackIcon(element);
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
	}

	function styleCell({ board: boardNumber, row, col, isHit }) {
		const board = document.querySelectorAll(".board")[boardNumber];
		const cell = getCellByCoordinates(board, row, col);
		isHit ? cell.classList.add("hit") : cell.classList.add("miss");
	}
})();
