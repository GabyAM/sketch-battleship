import { domController } from "./dom.js";
import { gameController } from "./game.js";
import { swapBoardEvent, removeBoardEvents } from "./eventListeners.js";
import { pubsub } from "./pubsub.js";

pubsub.subscribe("turnPlayed", swapBoardEvent);
pubsub.subscribe("gameEnded", removeBoardEvents);
gameController.init();
