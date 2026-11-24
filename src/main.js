import { getPosition, getForward } from "./data_adapter.js"
import { RouteBuilder } from "./route_builder.js"
import { Checkpoint } from "./checkpoint.js"
import { Vector } from "./math.js"
import { SequentialRoute } from "./route.js"

function subscribe() {
	window.postMessage({ nfsu2: 'car-on' }, location.origin);
}

function unsubscribe() {
	window.postMessage({ nfsu2: 'car-off' }, location.origin);
}

let previous_data = null;
let current_data = null;

function updateData(data) {
    if (current_data !== null)
        previous_data = current_data;

    current_data = data;
}

let start = null;
// eventDetails is an object containing:
// * checkpoint - Checkpoint that was collected
// * route - Route this checkpoint belongs to
// * data - Car information (see nfsu2.xyz/feeds.txt)
function onCheckpoint(eventDetails) {
    // Assumes that its only SequentialRoute type
    let first = eventDetails.route.currentIndex === 1; // 1 instead of 0, because called after the counter is incremented

    if (first) {
        first = false;
        start = eventDetails.data.time;
    }

    console.info({
        position: eventDetails.checkpoint.center,
        intersected_at: eventDetails.checkpoint.intersect(from, to),
        collected_on: eventDetails.data.frame,
        collected_at: eventDetails.data.time,
        total_time: eventDetails.data.time - start
    });
}

let builder = new RouteBuilder();
let route = null;

function updateRoute(data) {
    if (route === null)
        return;

    const from = getPosition(previous_data);
    const to = getPosition(current_data);

    const collected_checkpoints = route.update(from, to);
    collected_checkpoints.forEach(c => onCheckpoint({checkpoint: c, route, data));
}

window.addEventListener("message", (e) => {
	if (e.source !== window || !e.data) return;
    const m = e.data;

    if (m.nfsu2 === 'feed-ready') {
        console.info("Feed updated");
    }

    if (m.nfsu2 === "car") {
        updateData(m);
        updateRoute(m);
    }

    if (m.timeAttack === "export") {
        if (route === null) return;
        console.info(route.checkpoints);
    }

    if (m.timeAttack === "import" && m.checkpoints) {
        console.info("Loaded route with", m.checkpoints.length, "checkpoints!");

        const adapted = m.checkpoints.map(c => new Checkpoint(new Vector(...c.center), new Vector(...c.forward), c.width));

        route = new SequentialRoute(adapted);
    }
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Numpad5" && builder !== null) {
        console.info("Added checkpoint at", getPosition(current_data));
        builder.pushCheckpoint(getPosition(current_data), getForward(current_data), 30);
    }

    if (e.code === "Numpad8") {
        route = new SequentialRoute(builder.export());
        console.info("Created route with", builder.checkpoints.length, "checkpoints!");
        builder = new RouteBuilder();
    }

    if (e.code === "Numpad9" && route !== null) {
        console.info("Route completion reset! Back at the start!");
        route.reset();
    }

    if (e.code === "Numpad7" && route !== null) {
        window.postMessage({ timeAttack: "export" }, location.origin);
    }
});

window.addEventListener("beforeunload", (e) => unsubscribe());

subscribe();