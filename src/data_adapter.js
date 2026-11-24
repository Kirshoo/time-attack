import { Vector } from "./math.js"

export function getPosition(data) {
	return new Vector(...data.pos);
}

export function getForward(data) {
	return new Vector(Math.cos(data.yaw), Math.sin(data.yaw), 0);
}