import { waitForElement } from "./utils.js"
import { RaceManager } from "./race.js"
import { GateOverlayRender } from "./ui_overlay.js"

export const OverlayCanvasID = "checkpoint-gate-overlay";

export class DisplayManager {
	constructor() {
		this.gate_overlay_canvas = null;
		this.gate_renderer = null;

		this.is_initializing = false;

		this.events = new EventTarget();
	}

	init(reference_canvas_id) {
		if (this.gate_renderer || this.is_initializing) return;
		this.is_initializing = true;

		this.reference_id = reference_canvas_id;

		console.info("Started to wait for", this.reference_id);
		waitForElement(`#${this.reference_id}`, async canvas => {
			try {
				await this.#initializeOverlay(canvas);
				console.info("Gate Renderer Ready!");
			} catch (error) {
				console.error("Get Renderer encountered an error:", error)
			} finally {
				this.is_initializing = false;
			}
		});
	}

	async #initializeOverlay(reference_canvas) {
		if (this.gate_renderer) return;

		this.gate_overlay_canvas = this.#getOverlayCanvas(reference_canvas);
		this.gate_renderer = new GateOverlayRender(this.gate_overlay_canvas);

		await this.gate_renderer.init();
	}

	tryGetReferenceCanvas() {
		const reference = document.getElementById(this.reference_id);
		return {exists: reference !== null, reference};
	}

	#getOverlayCanvas(reference_canvas) {
		let canvas = document.getElementById(OverlayCanvasID);
		if (!canvas) {
			canvas = document.createElement("canvas");
			canvas.id = OverlayCanvasID;

			reference_canvas.parentElement.insertBefore(canvas, reference_canvas.nextSibling);
		}

		return canvas;
	}

	updateRouteOverlay(route) {
		if (!this.gate_renderer || !route) return;

		this.gate_renderer.drawGates = !route.completed;

		const checkpoints = route.getNextCheckpoints();
		if (checkpoints.length === 0) return; // No new checkpoints

		this.gate_renderer.updateCheckpoint(checkpoints[0]); // TODO: allow multiple checkpoints to be drawn
	}

	subscribeRaceManager(raceManager) {
		raceManager.events.addEventListener('routeChanged', (e) => {
			this.updateRouteOverlay(e.detail.route);
		});

		raceManager.events.addEventListener('checkpointCollected', (e) => {
			this.updateRouteOverlay(raceManager.route);
		});

		raceManager.events.addEventListener('raceFinished', (e) => {
			this.updateRouteOverlay(raceManager.route);
		});
	}

	update(frame_data) {
		if (!this.gate_renderer) return;

		this.gate_renderer.updateMatrices(frame_data.view, frame_data.proj);
		this.gate_renderer.render();

		const { exists, reference } = this.tryGetReferenceCanvas();
		if (!exists) return;
		
		this.gate_renderer.resize(reference);

		if (!this.gate_overlay_canvas || !this.gate_overlay_canvas.isConnected) {
			this.gate_overlay_canvas = this.gate_renderer.canvas;
			this.gate_overlay_canvas.id = OverlayCanvasID;
			reference.parentElement.insertBefore(this.gate_overlay_canvas, reference.nextSibling);
		}
	}
}