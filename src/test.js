import { Vector } from "./math.js"

let a = new Vector(1, 0, 0);
let b = new Vector(0, 1, 0);

console.log(a.dot(b))

console.log(a.cross(b));

console.log(new Vector(3, -3, 1).cross(new Vector(4, 9, 2)));