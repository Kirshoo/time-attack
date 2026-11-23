# Time Attack

An nfsu2.xyz extention that introduces an ability to create custom time attack tracks with start position, checkpoints
and finish.

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