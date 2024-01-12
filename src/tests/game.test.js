import { GameBoard, Player, Ship, gameController } from "../game.js";
describe("Ship class methods test", () => {
	let ship;
	beforeEach(() => {
		ship = new Ship(4);
	});
	it("hit method works", () => {
		expect(ship.hitsReceived).toBe(0);
		ship.hit();
		expect(ship.hitsReceived).toBe(1);
	});
	it("isSunk method works", () => {
		for (let i = 0; i < 3; i++) {
			ship.hit();
			expect(ship.isSunk()).toBe(false);
		}
		ship.hit();
		expect(ship.isSunk()).toBe(true);
	});
});

function checkIfIsOnlyShip(board, shipCells) {
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			if (shipCells.some((pos) => pos[0] === i && pos[1] === j)) {
				if (
					!(board[i][j] !== null && typeof board[i][j] === "object")
				) {
					return false;
				}
			} else {
				if (board[i][j] !== null) {
					return false;
				}
			}
		}
	}
	return true;
}

const shipCells = [
	[0, 0],
	[0, 1],
	[0, 2],
	[0, 3],
];

const otherShipCells = [
	[2, 2],
	[3, 2],
	[4, 2],
	[5, 2],
];
describe("Gameboard class methods test", () => {
	let gameboard;

	beforeEach(() => {
		gameboard = new GameBoard();
	});

	it("placeShip method places a new ship correctly", () => {
		gameboard.placeShip(shipCells, 1);

		expect(checkIfIsOnlyShip(gameboard.board, shipCells)).toBe(true);
	});
	it("placeShip method updates a ship position corectly", () => {
		gameboard.placeShip(shipCells, 1);
		gameboard.placeShip(otherShipCells, 1);
		expect(checkIfIsOnlyShip(gameboard.board, otherShipCells)).toBe(true);
	});
	it("placeShip method doesn't place a ship that overlaps other", () => {
		expect(gameboard.placeShip(shipCells, 1)).toBe(true);
		const overlappingShipCells = [[0, 0], [1, 0][(2, 0)]];
		expect(gameboard.placeShip(overlappingShipCells, 2)).toBe(false);
		expect(checkIfIsOnlyShip(gameboard.board, shipCells)).toBe(true);
	});
	it("placeShip method throws an error when placing a ship out of bounds", () => {
		const outOfBoundsCells = [
			[9, 9],
			[10, 9],
			[11, 9],
		];
		expect(gameboard.placeShip(outOfBoundsCells, 1)).toBe(false);
	});

	it("isShip method works", () => {
		expect(gameboard.isShip(0, 0)).toBe(false);
		gameboard.placeShip(shipCells, 1);
		expect(gameboard.isShip(0, 0)).toBe(true);
		expect(gameboard.isShip(1, 0)).toBe(false);
	});
	it("isShip returns false when asked for position out of bounds", () => {
		expect(gameboard.isShip(12, 12)).toBe(false);
	});

	it("getShipAt method works", () => {
		gameboard.placeShip(shipCells, 1);
		const shipPlaced = gameboard.getShipAt(0, 0);
		expect(shipPlaced instanceof Ship && shipPlaced.length === 4).toBe(
			true
		);
		expect(gameboard.getShipAt(2, 2)).toBe(undefined);
	});
	it("getShipAt throws an error when position is out of bounds", () => {
		expect(() => {
			gameboard.getShipAt(11, 11);
		}).toThrow("");
	});

	it("getValueAt method works", () => {
		expect(gameboard.getValueAt(0, 0)).toBe(null);
		gameboard.placeShip(shipCells, 1);
		const shipPlaced = gameboard.getValueAt(0, 0);
		expect(shipPlaced instanceof Ship && shipPlaced.length === 4).toBe(
			true
		);
		//simulates an attack received since receiveAttack can't be tested without this method
		gameboard.board[0][0].isHit = true;
		gameboard.board[2][0] = false;

		expect(gameboard.getValueAt(0, 0)).toBe(true);
		expect(gameboard.getValueAt(1, 0)).toBe(null);
		expect(gameboard.getValueAt(2, 0)).toBe(false);
	});
	it("getValueAt throws an error when position is out of bounds", () => {
		expect(() => {
			gameboard.getValueAt(11, 11);
		}).toThrow("");
	});

	it("receiveHit method works", () => {
		gameboard.placeShip(shipCells, 1);
		//checks the values in the board afterwards
		expect(gameboard.receiveHit(0, 0)).toBe(true);
		expect(gameboard.getValueAt(0, 0)).toBe(true);

		expect(gameboard.receiveHit(1, 0)).toBe(false);
		expect(gameboard.getValueAt(1, 0)).toBe(false);
	});
	it("receiveHit method throws an error when position is out of bounds", () => {
		expect(() => {
			gameboard.receiveHit(11, 12);
		}).toThrow("");
	});

	it("wasAttacked method works", () => {
		expect(gameboard.wasAttacked(0, 0)).toBe(false);
		gameboard.receiveHit(0, 0);
		expect(gameboard.wasAttacked(0, 0)).toBe(true);

		expect(gameboard.wasAttacked(2, 2)).toBe(false);
		gameboard.placeShip(otherShipCells);
		gameboard.receiveHit(2, 2);
		expect(gameboard.wasAttacked(2, 2)).toBe(true);
	});
	it("wasAttacked returns false when position is out of bounds", () => {
		expect(gameboard.wasAttacked(11, 12)).toBe(false);
	});

	it("isShipLeft method works", () => {
		expect(gameboard.isShipLeft()).toBe(false);
		gameboard.placeShip(shipCells, 1);
		expect(gameboard.isShipLeft()).toBe(true);
		shipCells.forEach((pos) => {
			gameboard.receiveHit(pos[0], pos[1]);
		});
		expect(gameboard.isShipLeft()).toBe(false);
	});
});

describe("Player method test", () => {
	let gameboard;
	let player;
	beforeEach(() => {
		gameboard = new GameBoard();
		player = new Player("player", gameboard);
	});
	it("attack method works", () => {
		gameboard.placeShip(shipCells, 1);
		expect(player.attack(0, 0)).toBe(true);
		expect(player.attack(1, 0)).toBe(false);

		expect(gameboard.getValueAt(0, 0)).toBe(true);
		expect(gameboard.getValueAt(1, 0)).toBe(false);
	});
	it("attack method throws an error when position is out of bounds", () => {
		expect(() => {
			player.attack(12, 13);
		}).toThrow("");
	});
});
