import { getPosition, getForward } from "./data_adapter.js"
import { RouteBuilder } from "./route_builder.js"
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

let builder = new RouteBuilder();
let route = null;

let start = null;
function updateRoute(data) {
    if (route === null)
        return;

    const from = getPosition(previous_data);
    const to = getPosition(current_data);

    let first = route.currentIndex === 0;

    const collected_checkpoints = route.update(from, to);
    collected_checkpoints.forEach(c => {
        if (first) {
            first = false;
            start = data.time;
        }

        console.info({
            position: c.center,
            intersected_at: c.intersect(from, to),
            collected_on: data.frame,
            collected_at: data.time,
            total_time: data.time - start
        });
    });
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
});

window.addEventListener("beforeunload", (e) => unsubscribe());

subscribe();