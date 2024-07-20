# phsmap_rendering_engine_2
In preparation for creating a new and improved version of the PHS Interactive Map, I am experimenting with a new rendering engine for the map data as well as a new interchange format for the map data. The old engine was created in a hurry and entirely from scratch, and it worked just fine for the pilot. However, it has many limitations which I wanted to address in a future version:
* The old rendering engine only renders points, line segments, text and regions.
* Renders are inconsistent across mobile and desktop. Map objects may change in size, move around or get cut off. 
* The old rendering engine accepted map objects and spat out a static bitmap image that consisted of a backing image and map objects (nodes, text, etc.) baked on top. This leads to reductions in visual quality when zoomed into and the inability to adapt to changes in viewport, etc. That also limited the amount of data that could be stored on one map, since you could only make the backing image only so large.
* Selecting map objects, running re-renders and other operations were inefficient.
* Because we needed a backing image, map objects (i.e. text-labled nodes) depended on the backing image. If you wanted to change a backing image, you would also have to change the position of all the points. That also means that the base image/building outline cannot be switched off. 
