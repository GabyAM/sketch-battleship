let count = 0;
export function getId() {
	count++;
	return count;
}

//since this function has to know about the ship field, it may go in game.js
export function getKeyFromValue(obj, value) {
	return Object.keys(obj).find((key) => obj[key].ship === value);
}
