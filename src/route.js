import { Checkpoint } from "./checkpoint.js"

export class RouteManager {
	getNextCheckpoints() {
		throw new Error("Not implemented");
	}

	update(previousPosition, currentPosition) {
		throw new Error("Not implemented");
	}

	get completed() {
		throw new Error("Not implemented");
	}
}

export class SequentialRoute extends RouteManager {
	constructor(checkpoints) {
		super();
		this.checkpoints = checkpoints;
		this.currentIndex = 0;
	}

	getNextCheckpoints() {
		return this.completed ? [] : [this.checkpoints[this.currentIndex]];
	}

	update(from, to) {
		const next = getNextCheckpoints();
		if (next.length === 0) return;

		const checkpoint = next[0];

		if (checkpoint.isCrossing(from, to)) {
			this.currentIndex++;
			return [checkpoint];
		}

		return [];
	}

	get completed() {
		return this.currentIndex >= this.checkpoints.length;
	}
}

export class FreeOrderRoute extends RouteManager {
	constructor(checkpoints) {
		super();
		this.checkpoints = checkpoints;
		this.collected = new Set();
	}

	getNextCheckpoints() {
		return this.checkpoints.filter((_, index) => !this.collected.has(index));
	}

	update(from, to) {
		const collected = [];

		this.checkpoints.forEach((checkpoint, index) => {
			if (this.collected.has(index))
				return;

			if (checkpoint.isCrossing(from, to)) {
				this.collected.add(index);
				collected.push(checkpoint);
			}
		});

		return collected;
	}

	get completed() {
		return this.collected.size === this.checkpoints.length;
	}
}