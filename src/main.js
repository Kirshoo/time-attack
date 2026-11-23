function subscribe() {
	window.postMessage({ nfsu2: 'car-on' }, location.origin);
}

function unsubscribe() {
	window.postMessage({ nfsu2: 'car-off' }, location.origin);
}

window.addListener("message", (e) => {
	if (e.source !== window || !e.data) return;
    const m = e.data;

    if (m.nfsu2 === 'feed-ready') {
        log("Feed updated");
    }

    if (m.nfsu2 === "car") {
        handle_car(m);
    }
});

window.addListener("beforeunload", (e) => unsubscribe());

subscribe();