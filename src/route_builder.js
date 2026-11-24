import { Checkpoint } from "./checkpoint.js"

export class RouteBuilder {
	constructor() {
		this.checkpoints = [];
	}

	pushCheckpoint(position, forward, width) {
		this.checkpoints.push(new Checkpoint(position, forward, width));
	}

	popCheckpoint() {
		this.checkpoints.pop();
	}

	export() {
		return this.checkpoints;
	}
}