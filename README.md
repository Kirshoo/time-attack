# Time Attack

An nfsu2.xyz extention that introduces an ability to create custom time attack tracks with start position, checkpoints
and finish.

## Usage

Most of the feedback is only available via browser console.

### Controls

|Name|Keybind|Description|
|:---:|:---:|:---|
|Save Route|Numpad8|Saves all the recorded checkpoints into a route, which can be played through.|
|Add Checkpoint|Numpad5|Records checkpoint on the car's current position and its orientation.|
|Export Route|Numpad7|Outputs checkpoint list of the current route into the console, you will have to copy the object if you want to use it later.|
|Reset Route|Numpad9|Resets the progress of the route, setting first checkpoint as active.|

### Sharing and importing routes

You can export your route using `Export Route` keybind (see **Controls** section). To load someone else's route,
copy the object and paste it along with this command:
```
window.postMessage({timeAttack:"import", checkpoints:/* paste the object here */}, location.origin);
```
It will set the imported route as your current and discard the previous route.

## Building

Run the following commands:
```bash
# Install dependencies
npm install

# Bundle all of the src javascript into single .js file
# Should also create build/ directory
# if not, run this command:
# mkdir build
npx esbuild src/main.js --bundle --outfile=build/script.js

# Copy over the manifest.json
cp src/manifest.json build/manifest.json
```

### Tests

Run the following commands:
```bash
# Install dependencies
npm install

# Bundle all of the src javascript into single .js file
# Should also create build/ directory
# if not, run this command:
# mkdir build
npx esbuild src/test.js --bundle --outfile=build/test.js

# Run the test with node
node build/test.js
```

## Technical Details

### Checkpoints

#### Defining Checkpoints
Using `car-feed` from it is possible to extract car's position and orientation. The combination of both of these allows
to define checkpoints as a line in a world:
```
Car position -> Checkpoint Center
Car forward -> Checkpoint forward
```
To create a proper line, width definition of the checkpoint, will have to be input by hand.
(Ideally there would be an overlay that shows the checkpoint ends.)

#### Start and Finish
First checkpoint will be defined as the start of the time trial and the last is the finish line. 

#### Crossing Checkpoint
As described on [wikipedia](https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_line_equations)
we can calculate where exactly two lines intersection. In our case the two lines are:
- Between two sides of a checkpoint
- Between car previous position and car current position

If these two lines intersect within the width of the checkpoint, then we can count checkpoint as collected.