# Volume Visualization
With this Three.js application you can visualize all sorts of volumetric data from MRI or CT scans.
The visualisation is done using a technique called first-hit rendering and blinn-phong shading to accurately visualize the measured medical data.  
The editor allows to visualize this data in realtime, filtering out different layers (bones, skin, ...), coloring them to make them more visible, and saving.
In addition to the editor allows a full 360 degree orbital camera as well as zooming to get a more detailed look at the data.

## How to Use

Load one of the provided volume files through the GUI.
Rotate the orbit camera around the bounding box using the left mouse button. Zoom using the scroll wheel.

The interactive editor allows to add and remove different iso-surface layers.
You change the intensity (opacity) as well as the density (iso-value) of the current layer
in the visualization by dragging the pin in the diagram around. You can also change the color of the current layer
by clicking on the color picker and choosing whatever color you like. Once content with your selections
you can save the current layer by clicking on the "save layer" button. This persists your layer.
You can start adding a new layer using the same procedure as mentioned above.
It is also possible to delete the most recent layer by clicking on the Delete layer button.
This deletes the last layer you persisted.


**Human Head:** (skull: white, full opaque; skin: yellow, semi transparent)
<br>
![image](https://github.com/user-attachments/assets/f5d36e54-a026-4316-bafa-3a0b54c7b552)


**Beetle:**
<br>
![image](https://github.com/user-attachments/assets/5e050a84-2a60-4fdf-bd24-3a5dbd2fb054)


