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
		this.isRotated = false;
		this.element = this.createElement(length);
		this.addEvents(this.element);
		this.id = getId();
	}

	adjustSize(ship) {
		if (this.isRotated) {
			ship.style.width = "40px";
			ship.style.height = `${40 * this.length}px`;
		} else {
			ship.style.width = `${40 * this.length}px`;
			ship.style.height = "40px";
		}
	}

	adjustPosition(ship, row = this.row, col = this.col) {
		if (this.isRotated) {
			ship.style.gridArea = `${row + 1} / ${col + 1} / ${
				row + 1 + this.length
			} / ${col + 1}`;
		} else {
			ship.style.gridArea = `${row + 1} / ${col + 1} / ${row + 1} / ${
				col + 1 + this.length
			}`;
		}
	}

	createElement(length) {
		const ship = document.createElement("div");
		const shipImage = document.createElement("div");
		ship.className = "ship";
		shipImage.className = `ship-image length-${length}`;

		shipImage.style.width = `${this.length * 40}px`;
		shipImage.style.height = `40px`;

		ship.appendChild(shipImage);
		this.adjustSize(ship);
		ship.style.position = "absolute";
		return ship;
	}

	addEvents(ship) {
		const shipsGrid = document.querySelector(".grid.ships");

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
				if (ship.style.position === "static") {
					ship.style.position = "absolute";
				}
				ship.style.left = `${e.clientX - offsetX}px`;
				ship.style.top = `${e.clientY - offsetY}px`;
			}
		});

		window.addEventListener("pointerup", (e) => {
			if (isDown && isDragging) {
				const { row, col } = getGridCoords(shipsGrid, e);
				this.row = row;
				this.col = col;
				const IsOutOfBounds = this.isRotated
					? row + this.length > 10 || col > 10
					: row > 10 || col + this.length > 10;

				if (!IsOutOfBounds) {
					const shipPlacedResultCallback = (result) => {
						console.log(this.id);
						if (result) {
							if (ship.parentElement !== shipsGrid) {
								shipsGrid.appendChild(ship);
							}
							this.adjustPosition(ship, row, col);
							ship.style.position = "static";
						} else {
							if (ship.parentElement === shipsGrid) {
								ship.style.position = "static";
								this.adjustPosition(ship, prevRow, prevCol);
							} else {
								ship.style.top = prevTop;
								ship.style.left = prevLeft;
							}
						}
						pubsub.unsubscribe(
							`shipPlacedResult_${this.id}`,
							shipPlacedResultCallback
						);
					};

					pubsub.subscribe(
						`shipPlacedResult_${this.id}`,
						shipPlacedResultCallback
					);

					pubsub.publish("shipPlaced", {
						cells: this.getCells(),
						id: this.id,
					});
				}
			}
			setTimeout(() => {
				clickEnabled = true;
			}, 200);
			isDown = false;
			isDragging = false;
		});

		ship.addEventListener("click", (e) => {
			if (!isDragging && clickEnabled) {
				clickEnabled = false;
				const shipRotatedResultCallback = (result) => {
					if (result === false) {
						this.rotate(ship);
					}

					pubsub.unsubscribe(
						`shipPlacedResult_${this.id}`,
						shipRotatedResultCallback
					);
				};
				this.rotate(ship);
				pubsub.subscribe(
					`shipPlacedResult_${this.id}`,
					shipRotatedResultCallback
				);
				pubsub.publish("shipPlaced", {
					cells: this.getCells(),
					id: this.id,
				});
			}
		});
	}

	rotate(ship) {
		this.isRotated = !this.isRotated;
		if (this.isRotated) {
			ship.querySelector(".ship-image").classList.add("rotated");
		} else {
			ship.querySelector(".ship-image").classList.remove("rotated");
		}
		this.adjustSize(ship);
		this.adjustPosition(ship);
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
			const shipImage = document.createElement("div");
			shipImage.style.width = `${ship.length * 40}px`;
			shipImage.style.height = "40px";
			shipImage.className = `ship-image length-${ship.length} ${
				ship.end[0] > ship.start[0] ? "rotated" : ""
			}`;
			domShip.appendChild(shipImage);
			domShip.dataset.length = ship.length;
			domShip.dataset.id = ship.id;

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
})();
