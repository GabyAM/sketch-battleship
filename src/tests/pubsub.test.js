import { pubsub } from "../pubsub";

it("pubsub module methods test", () => {
	const testFunction = jest.fn();
	pubsub.subscribe("valueUpdated", testFunction);
	pubsub.publish("valueUpdated", "hi!");
	expect(testFunction).toHaveBeenCalledWith("hi!");
	pubsub.unsubscribe("valueUpdated", testFunction);
	pubsub.publish("valueUpdated", "bye!");
	expect(testFunction).not.toHaveBeenCalledWith("bye!");
});
