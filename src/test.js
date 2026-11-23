import { Vector } from "./math.js"
import { Checkpoint } from "./checkpoint.js"

let a = new Vector(1, 0, 0);
let b = new Vector(0, 1, 0);

console.log(a.dot(b))

console.log(a.cross(b));

console.log(new Vector(3, -3, 1).cross(new Vector(4, 9, 2)));

let check1 = new Checkpoint(new Vector(0, 0, 0), new Vector(1, 0, 0), 30);
let from1 = new Vector(-0.5, 0, 0);
let to1 = new Vector(0.5, 0, 0);

console.log({
    previous: from1
        .sub(check1.center)
        .dot(check1.forward),

    current: to1
        .sub(check1.center)
        .dot(check1.forward),

    forward: check1.forward,

    denominator: Math.abs(from1.sub(check1.center).dot(check1.forward) - to1.sub(check1.center).dot(check1.forward))
});

console.log("Simple crossing:", check1.isCrossing(from1, to1));
console.log("Simple crossing 5 to left:", check1.isCrossing(from1.add(check1.right.scale(-5)), to1.add(check1.right.scale(-5))));
console.log("Simple crossing outside:", check1.isCrossing(from1.add(check1.right.scale(check1.width + 1)), to1.add(check1.right.scale(check1.width + 1))));
console.log("Crossing, not reaching:", check1.isCrossing(from1.add(check1.forward.neg()), to1.add(check1.forward.neg())));