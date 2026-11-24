import { RouteManager } from "./route.js"
import { getPosition } from "./data_adapter.js"

export class RaceManager {
	constructor() {
		this.currentTime = 0;
		this.route = null;

		this.previous_data = null;
		this.current_data = null;

		this.last_checkpoint = null;

		this.events = new EventTarget();
	}

	static isValidRoute(route) {
		return route instanceof RouteManager && Object.getPrototypeOf(route) !== RouteManager.prototype;
	}

	setRoute(newRoute) {
		if (!RaceManager.isValidRoute(newRoute)) {
			console.warn("Setting route of non-route manager!");
			return;
		}

		this.route = newRoute;
	}

	isRacing() {
		return this.route !== null && this.route.started && !this.route.completed;
	}

	updateData(data) {
		if (this.current_data)
			this.previous_data = this.current_data;

		this.current_data = data;
	}

	#createEvent(type, checkpoint) {
		return new CustomEvent(type, {
			detail: {
				checkpoint,
				carState: this.current_data,
			},
		});
	}

	#dispatchEvents(checkpoint, isFirst, isLast) {
		this.events.dispatchEvent(
			this.#createEvent("checkpointCollected", checkpoint)
		);
		if (isFirst) {
			this.currentTime = 0;

			this.events.dispatchEvent(
				this.#createEvent("raceStarted", checkpoint)
			);
		}
		if (isLast) {
			this.events.dispatchEvent(
				this.#createEvent("raceFinished", checkpoint)
			);
		}
	}

	updateRoute() {
		// Without previous_data nothing can be crossed (treat as staying in place)
		if (!this.route || !this.previous_data) return;

		const first = !this.route.started;

		const collected = this.route.update(
			getPosition(this.previous_data),
			getPosition(this.current_data)
		);

		if (collected.length == 0) return;
		// Collected at least one checkpoint

		collected.forEach((c, i) => {
			this.#dispatchEvents(
				c, 
				first && i === 0, 
				this.route.completed && i === collected.length - 1
			);
		});
	}

	tick(dt) {
		this.currentTime += dt;

		this.events.dispatchEvent(
			new CustomEvent("raceTick", {
				detail: {
					dt,
					currentTime: this.currentTime,
				},
			})
		);
	}

	update(frame_data) {
		this.updateData(frame_data);

		if (this.isRacing())
			this.tick(frame_data.dt);

		this.updateRoute();
	}
}