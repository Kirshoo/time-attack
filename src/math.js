export class Vector extends Array {
	static get [Symbol.species]() {
        return Array;
    }

	neg() {
		return this.map((e) => -e);
	}

	add(other) {
		return this.map((e, i) => e + other[i]);
	}

	sub(other) {
		return this.map((e, i) => e - other[i]);
	}

	dot(other) {
		return this.reduce((sum, e, i) => sum + e * other[i], 0);
	}

	cross(other) {
		let intermediate = this.map((e, i) => e * other[(i + 1) % 3] - this[(i + 1) % 3] * other[i])
		return new Vector(intermediate[1], intermediate[2], intermediate[0]);
	}

	magnitude() {
		return Math.sqrt(this.dot(this));
	}

	normalize() {
		const mag = this.magnitude();
		return mag === 0 ? new Vector(...this) : new Vector(...this.map(e => e / mag));
	}

	scale(scalar) {
		return this.map(e => e * scalar);
	}
}