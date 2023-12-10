import { GameBoard, Player, Ship, gameController } from "../game.js";
it("Ship class methods test", () => {
	const ship = new Ship(4);
	expect(ship.isSunk()).toBe(false);
	ship.hit();
	expect(ship.hitsReceived).toBe(1);
	ship.hit();
	ship.hit();
	ship.hit();
	expect(ship.hitsReceived).toBe(4);
	expect(ship.isSunk()).toBe(true);
});

it("Gameboard class methods test", () => {
	const gameboard = new GameBoard(10);
	const totalCells = gameboard.board.length * gameboard.board[0].length;
	expect(totalCells).toBe(100);

	gameboard.placeShip(0, 0, 4);
	expect(gameboard.board[0][0].length).toBe(4);

	expect(gameboard.board[0][0].hitsReceived).toBe(0);
	gameboard.receiveHit(0, 0);
	expect(gameboard.board[0][0].hitsReceived).toBe(1);

	gameboard.receiveHit(2, 2);
	expect(gameboard.board[2][2]).toBe(false);

	expect(() => gameboard.receiveHit(11, 11)).toThrow("");
});

it("Player class methods test", () => {
	const gameboard = new GameBoard(10);
	gameboard.placeShip(0, 0, 3);
	const player = new Player("player", gameboard);
	expect(player.attack(0, 0)).toBe(true);
	expect(player.attack(0, 1)).toBe(false);
});

it("Game controller module methods test", () => {
	gameController.init();
	expect(gameController.getCurrentPlayer().name).toBe("player 1");
	expect(gameController.playTurn(5, 2)).toBe(true);
	expect(gameController.getCurrentPlayer().name).toBe("player 2");
	expect(gameController.playTurn(9, 9)).toBe(false);
});
