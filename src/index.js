import { domController } from "./dom.js";
import { gameController } from "./game.js";
import { addBoardEvent } from "./eventListeners.js";
import { pubsub } from "./pubsub.js";

pubsub.subscribe("boardRendered", addBoardEvent);
gameController.init();
