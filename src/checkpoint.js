import { Vector } from "./math.js"

export class Checkpoint {
	// Assumes that passed values are vectors, except for width
	constructor(position, forward, width) {
		this.center = position;
		this.forward = forward;
		this.up = new Vector(0, 0, 1);
		this.right = this.forward.cross(this.up);
		this.width = width;
	}

	intersect(from, to) {
		const distance_previous = from.sub(this.center).dot(this.forward);
		const distance_current = to.sub(this.center).dot(this.forward);

		// Not crossing in forward direction
		if (distance_previous >= 0 || distance_current < 0) {
			console.log("Crossing in wrong direction or not crossing at all.")
			return null;
		}

		const denominator = distance_previous - distance_current;
		if (Math.abs(denominator) < 1e-8) {
			console.log("Denominator is almost 0!")
			return null;
		}

		const t = distance_previous / denominator;
		return from.add(to.sub(from).scale(t));
	}

	isWithin(point) {
		const lateral_distance_from_center = point.sub(this.center).dot(this.right);

		return Math.abs(lateral_distance_from_center) <= this.width / 2;
	}

	isCrossing(from, to) {
		const intersection = this.intersect(from, to);

		console.log(intersection);

		return intersection != null && this.isWithin(intersection);
	}
}