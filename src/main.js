import { getPosition, getForward } from "./data_adapter.js"
import { RouteBuilder } from "./route_builder.js"
import { Checkpoint } from "./checkpoint.js"
import { Vector } from "./math.js"
import { SequentialRoute } from "./route.js"
import { createUiOverlay } from "./ui_overlay.js"
import { waitForElement } from "./utils.js"

function subscribe() {
	window.postMessage({ nfsu2: 'car-on' }, location.origin);
    window.postMessage({ nfsu2: 'view-on' }, location.origin);
}

function unsubscribe() {
	window.postMessage({ nfsu2: 'car-off' }, location.origin);
    window.postMessage({ nfsu2: 'view-off' }, location.origin);
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
        intersected_at: eventDetails.intersection,
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
    collected_checkpoints.forEach(c => onCheckpoint({checkpoint: c, route, data, intersection: c.intersect(from, to)}));
}

let overlay_renderer = null;
let overlay_initializing = false;

function update_route_active_checkpoint(route) {
    if (!route || !overlay_renderer) return;

    const checkpoints = route.getNextCheckpoints();
    if (checkpoints.length == 0) return;

    overlay_renderer.updateCheckpoint(checkpoints[0]);
}

window.addEventListener("message", (e) => {
	if (e.source !== window || !e.data) return;
    const m = e.data;

    if (m.nfsu2 === 'feed-ready') {
        console.info("Feed updated");
        waitForElement(`#${m.canvas}`, (canvas) => {
            if (overlay_renderer || overlay_initializing)
                return;

            overlay_initializing = true;

            createUiOverlay(canvas)
                .then(renderer => {
                    overlay_renderer = renderer;
                    console.info("Gate Renderer Ready!");
                })
                .finally(() => {
                    overlay_initializing = false;
                });
        });
    }

    if (m.nfsu2 === "car") {
        updateData(m);
        updateRoute(m);
        update_route_active_checkpoint(route);
    }

    if (m.nfsu2 === "view" && overlay_renderer) {
        overlay_renderer.updateMatrices(m.view, m.proj);
        overlay_renderer.render();
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