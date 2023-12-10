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
