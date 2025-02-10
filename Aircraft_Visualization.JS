<!DOCTYPE html>
<html>
<head>
    <title>Aircraft Visualization</title>
    <script src="https://openjscad.org/js/csg.js"></script>
    <script src="https://openjscad.org/js/formats.js"></script>
    <script src="https://openjscad.org/js/openjscad.js"></script>
    <script src="https://openjscad.org/js/lightgl.js"></script>
    <script src="https://openjscad.org/js/sylvester.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <style>
        #viewer {
            width: 800px;
            height: 600px;
        }
    </style>
</head>
<body>
    <div id="viewer"></div>
    <button onclick="exportSTL()">Export as STL</button>
    <button onclick="exportSTEP()">Export as STEP</button>
     <button onclick="exportDXF()">Export as DXF</button>
    <script>
    const { OpenJsCad, OpenJsCadViewer } = require('@jscad/core');
    const { convertToBlob } = require('@jscad/core');
    const { stlSerializer, stpSerializer, dxfSerializer } = require('@jscad/io');
    let gProcessor;

    async function main() {
      try {
        const response = await fetch("aircraft_points.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // --- Data Validation ---
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array.");
        }
        for (const pt of data) {
          if (!pt.id || typeof pt.id !== 'string') {
            throw new Error("Each point must have a string 'id'.");
          }
          if (typeof pt.x !== 'number' || typeof pt.y !== 'number' || typeof pt.z !== 'number') {
            throw new Error(`Point ${pt.id} has invalid coordinates.`);
          }
          // Add more validation as needed (e.g., coordinate ranges)
        }
        // Check uniqueness
        const ids = data.map(point => point.id)
        if(ids.length !== new Set(ids).size) {
            throw new Error(`Point Ids are not unique`);
        }
        // --- End Data Validation ---
        const points = data;
        const connections = [
           ["C11", "C21"],
           ["C21", "C31"],
        ];
        let geometry = points.map(pt => translate([pt.x, pt.y, pt.z], sphere({r:0.05})));

        const lookupPoint = (id) => {
            const point = points.find(p => p.id === id);
            if (!point) {
                console.error(`Point with ID "${id}" not found.`);
                return null; // Or throw an error, depending on your error handling strategy
            }
            return [point.x, point.y, point.z];
        };

        const lines = connections.map( connection => {
            const p1 = lookupPoint(connection[0], points);
            const p2 = lookupPoint(connection[1], points);
            return hull(translate(p1, sphere({r: 0.05})), translate(p2, sphere({r: 0.05})));
        });

        return union(geometry, lines);


      } catch (error) {
        console.error("Error loading or processing data:", error);
        // Display an error message to the user, e.g., in a div on the page
        document.getElementById('viewer').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        return []; // Return an empty array to avoid further errors
      }
    }
    async function exportSTL() {
        const geometry = await main(); // Get your geometry
        const blob = convertToBlob({
            serializers: {stl: stlSerializer}
        }, geometry);

        saveAs(blob, 'aircraft.stl'); // Use a library like FileSaver.js
    }
    async function exportSTEP() {
            const geometry = await main(); // Get your geometry
            const blob = convertToBlob({
              serializers: {step: stpSerializer}
            }, geometry);
            saveAs(blob, 'aircraft.step'); // Use a library like FileSaver.js
        }
    async function exportDXF() {
        const geometry = await main(); // Get your geometry
        const blob = convertToBlob({
          serializers: {dxf: dxfSerializer}
        }, geometry);
        saveAs(blob, 'aircraft.dxf'); // Use a library like FileSaver.js
    }

    window.onload = function() {
        gProcessor = new OpenJsCad.Processor(document.getElementById('viewer'));
        main().then(geometry => {
              gProcessor.setGeometries(geometry);
          });
    };

    </script>
</body>
</html>
