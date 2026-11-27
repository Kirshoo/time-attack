import { getPosition, getForward } from "./data_adapter.js"
import { RouteBuilder } from "./route_builder.js"
import { Checkpoint } from "./checkpoint.js"
import { Vector } from "./math.js"
import { SequentialRoute } from "./route.js"
import { RaceManager } from "./race.js"
import { DisplayManager } from "./display.js"
import { waitForElement } from "./utils.js"

function subscribe() {
	window.postMessage({ nfsu2: 'car-on' }, location.origin);
    window.postMessage({ nfsu2: 'view-on' }, location.origin);
}

function unsubscribe() {
	window.postMessage({ nfsu2: 'car-off' }, location.origin);
    window.postMessage({ nfsu2: 'view-off' }, location.origin);
}

const racer = new RaceManager();
function createOnCheckpointHandler(raceManager) {
    return (e) => {
        const checkpoint = e.detail.checkpoint;
        const car = e.detail.carState;

        console.info({
            position: checkpoint.center,
            collected_on: car.frame,
            collected_at: car.time,
            total_time: raceManager.currentTime,
        });
    };
}
const checkpointHandler = createOnCheckpointHandler(racer);
racer.events.addEventListener('checkpointCollected', checkpointHandler);

const display = new DisplayManager();
display.subscribeRaceManager(racer);

let builder = new RouteBuilder();

function setActiveRoute(newRoute) {
    if (!RaceManager.isValidRoute(newRoute)) {
        console.warn("Setting invalid route manager!");
        return false;
    }

    racer.setRoute(newRoute);
    return true;
}

window.addEventListener("message", (e) => {
	if (e.source !== window || !e.data) return;
    const m = e.data;

    if (m.nfsu2 === 'feed-ready') {
        console.info("Feed updated:", m);
        display.init(m.canvas);
    }

    if (m.nfsu2 === "car") {
        racer.update(m);
    }

    if (m.nfsu2 === "view") {
        display.update(m);
    }

    if (m.timeAttack === "export") {
        if (racer.route === null) return;
        console.info(racer.route.checkpoints);
    }

    if (m.timeAttack === "import" && m.checkpoints) {
        console.info("Loaded route with", m.checkpoints.length, "checkpoints!");

        const adapted = m.checkpoints.map(c => new Checkpoint(new Vector(...c.center), new Vector(...c.forward), c.width));

        setActiveRoute(new SequentialRoute(adapted));
    }
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Numpad5" && builder !== null) {
        console.info("Added checkpoint at", getPosition(racer.current_data));
        builder.pushCheckpoint(getPosition(racer.current_data), getForward(racer.current_data), 30);
    }

    if (e.code === "Numpad8") {
        setActiveRoute(new SequentialRoute(builder.export()));
        console.info("Created route with", builder.checkpoints.length, "checkpoints!");
        builder = new RouteBuilder();
    }

    if (e.code === "Numpad9" && racer.route !== null) {
        console.info("Route completion reset! Back at the start!");
        racer.reset();
    }

    if (e.code === "Numpad7" && racer.route !== null) {
        window.postMessage({ timeAttack: "export" }, location.origin);
    }
});

window.addEventListener("beforeunload", (e) => unsubscribe());

subscribe();