import { getPosition, getForward } from "./data_adapter.js"
import { RouteBuilder } from "./route_builder.js"
import { Checkpoint } from "./checkpoint.js"
import { Vector } from "./math.js"
import { SequentialRoute } from "./route.js"
import { RaceManager } from "./race.js"
import { DisplayManager } from "./display.js"
import { InputManager } from "./input_manager.js"

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

const inputs = new InputManager();
const addCheckpointRemove = inputs.register("Numpad5", (e) => {
    if (!builder) return;

    console.info("Added checkpoint at", getPosition(racer.current_data));
    builder.pushCheckpoint(getPosition(racer.current_data), getForward(racer.current_data), 30);
});
const routeSaveRemove = inputs.register("Numpad8", (e) => {
    if (!builder) return;

    if (!setActiveRoute(new SequentialRoute(builder.export())))
        return;
    console.info("Created route with", builder.checkpoints.length, "checkpoints!");
    builder = new RouteBuilder();
});
const routeResetRemove = inputs.register("Numpad9", (e) => {
    console.info("Route completion reset! Back at the start!");
    racer.reset();
});
const routeExportRemove = inputs.register("Numpad7", (e) => {
    window.postMessage({ timeAttack: "export" }, location.origin);
});

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
        const adapted = m.checkpoints.map(c => new Checkpoint(new Vector(...c.center), new Vector(...c.forward), c.width));

        if (!setActiveRoute(new SequentialRoute(adapted)))
            return;

        console.info("Loaded route with", m.checkpoints.length, "checkpoints!");
    }
});

window.addEventListener("keydown", (e) => inputs.trigger(e.code, e));

window.addEventListener("beforeunload", (e) => unsubscribe());

subscribe();