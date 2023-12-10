export const pubsub = (function () {
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
	function publish(eventName, value) {
		if (events[eventName]) {
			events[eventName].forEach((func) => func(value));
		}
	}

	return { subscribe, unsubscribe, publish };
})();
