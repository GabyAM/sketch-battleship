import { domController } from "./dom.js";
import { gameController } from "./game.js";
import {
	handleBoardEvent,
	removeBoardEvents,
} from "./eventListeners.js";
import { pubsub } from "./pubsub.js";

pubsub.subscribe("turnPlayed", handleBoardEvent);
pubsub.subscribe("gameEnded", removeBoardEvents);
gameController.init();
