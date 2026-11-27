export class InputRegistry {
	constructor() {
		this.handlers = new Map();
	}

	// Registers a handler for a key
	//
	// Returns the function to cancel/remove handler
	register(key, handlerFunc) {
		if (!this.handlers.has(key)) {
			this.handlers.set(key, new Set());
		}

		const handlers = this.handlers.get(key);
		handlers.add(handlerFunc);

		return () => this.remove(key, handlerFunc);
	}

	remove(key, handlerFunc) {
		const handlers = this.handlers.get(key);
		if (!handlers) return;

		handlers.delete(handlerFunc);

		if (handlers.size === 0)
			this.handlers.delete(key);
	}

	trigger(key, event) {
		const handlers = this.handlers.get(key);
		if (!handlers) return;

		// Take a snapshot of handlers set, in case it is changed during the execution of a loop
		for (const handler in [...handlers]) {
			handler(event);
		}
	}

	// Removes all handlers for a key
	// If called without passing a key, all of the keys will be removed
	removeAll(key) {
		if (key !== undefined) {
			this.handlers.delete(key);
		} else {
			this.handlers.clear();
		}
	}
}