export class Ship {
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
export class GameBoard {
	constructor(size) {
		this.board = Array(size);
		for (let i = 0; i < size; i++) {
			this.board[i] = Array(size).fill(null);
		}
	}

	placeShip(row, col, length) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] === null) {
			if (row + length <= this.board.length) {
				// adds the ship to each cell
				const newShip = new Ship(length);
				for (let i = 0; i < length; i++) {
					this.board[row + i][col] = newShip;
				}
			}
		}
	}

	receiveHit(row, col) {
		if (row > this.board.length || col > this.board.length) {
			throw new Error("");
		}
		if (this.board[row][col] instanceof Ship) {
			this.board[row][col].hit();
		} else {
			this.board[row][col] = false;
		}
	}

	isShipLeft() {
		return this.board.forEach((col) => {
			col.some((cell) => cell instanceof Ship);
		});
	}
}

export class Player {
	constructor(name, enemyGameboard) {
		this.name = name;
		this.enemyGameboard = enemyGameboard;
	}

	attack(row, col) {
		if (this.enemyGameboard.board[row][col] === null) {
			this.enemyGameboard.board[row][col] = false;
		} else {
			this.enemyGameboard.board[row][col] = true;
		}
		return this.enemyGameboard.board[row][col];
	}
}

