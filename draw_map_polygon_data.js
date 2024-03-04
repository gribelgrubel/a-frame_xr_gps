/* 

High-Level Ablauf:
- get hamburg api coordinates for feature (bzw lokale json dateien laden)
- array of polygon x, y coords (an realer Lat-Long position)
- umrechnen zu relativen Positionen zueinander, dann Mittelpunkt finden (und den wieder mit realer Lat-Long-Pos verknüpfen)
- +Bezeichnung des Features
- custom aframe component, um object mit vielzahliger anzahl an vertices zu zeichnen
- mit diesem dann die punkte auf karte einzeichnen, auch siehe hikar_tests

siehe auch:
https://stackoverflow.com/questions/44968918/add-polygon-in-a-frame
https://jsfiddle.net/gftruj/3brL5744/ 

https://chat.openai.com/c/ef5572aa-c83b-418c-8a17-834fac5e40dc 
To generate a polygon using the <a-entity> element with a custom A-Frame component, you'll need to write JavaScript code that defines how the component works, including how it processes input (in your case, an array of latitude and longitude values converted to local 3D coordinates) and how it constructs the polygon geometry. 

 */



// Convert Lat-Long to
function convertGeoCoordsToCartesianAndCenter(coordsArrayLongLat) {
  const R = 6371000; // Earth's radius in meters
  const referenceLat = coordsArrayLongLat[0][1];
  const referenceLon = coordsArrayLongLat[0][0];
  let cartesianCoords = [];

  let sumX = 0, sumY = 0;
  coordsArrayLongLat.forEach(coords => {
    const lon = coords[0];
    const lat = coords[1];
    let x = (lon - referenceLon) * Math.cos((lat + referenceLat) / 2) * Math.PI / 180;
    let y = (lat - referenceLat) * Math.PI / 180;
    x *= R; // Adjust for Earth's radius
    y *= R; // Adjust for Earth's radius
    sumX += x;
    sumY += y;
    cartesianCoords.push({x, y});
  });

  const centerX = sumX / coordsArrayLongLat.length;
  const centerY = sumY / coordsArrayLongLat.length;

  // Adjust points relative to the center
  const adjustedCoords = cartesianCoords.map(coord => ({
    x: coord.x - centerX,
    y: coord.y - centerY
  }));

  const centerPointLongLat = [centerX, centerY];

  // Return both the adjusted coordinates and the center point
  return {
    cartesianCoords: adjustedCoords,
    centerPoint: centerPointLongLat
  };
}
    


// Example usage
const nestedArrayLongLat = [
  [10.148099218397029, 53.52241676074994],
  [10.14806121618159, 53.522398181914966],
  [10.14802116055648, 53.52238120397994],
  [10.147979242236701, 53.52236590691296],
  [10.147935657749702, 53.52235236253623],
  [10.14791081595036, 53.522347031370764],
  [10.147885426828418, 53.522342713140596],
  [10.147859604068831, 53.52233942832787]
];



const result = convertGeoCoordsToCartesianAndCenter(nestedArrayLongLat);
console.log("Testing GeoCoord to Cartesian Coords conversion, with testarray:");
console.log(nestedArrayLongLat);
console.log('Cartesian Coordinates:', result.cartesianCoords);
console.log('Center Point:', result.centerPoint);
//cartesian coorrds end



function mapCartesianToVertices(cartesianCoordsArray, zHeight) {
  return cartesianCoordsArray.map(coord => ({
    x: coord.x,
    y: coord.y,
    z: zHeight // Use the provided z-height for all vertices
  }));
}

function placePosMarker(posLongLat) {
  const posMarker = document.createElement("a-entity");
  posMarker.setAttribute('gps-new-entity-place', {
                    latitude: posLongLat[1]+0.01,
                    longitude: posLongLat[0]+0.01
                });
                const box = document.createElement("a-box");
                box.setAttribute("scale", {
                    x: 1,
                    y: 1,
                    z: 1
                });
                box.setAttribute('material', { color: 'blue' } );
                box.setAttribute("position", {
                    x : 0,
                    y : 20,
                    z: 0
                } );
                
                posMarker.appendChild(box);
                document.querySelector("a-scene").appendChild(posMarker);
                console.log("placed posMarker at "+posLongLat);
}


function placePolygon(polygonPoints, centerPoint) {
  const polygonEntity = document.createElement("a-entity");
  const vertices = mapCartesianToVertices(polygonPoints, 0);
  console.log(vertices);
  //verticesJSON = JSON.stringify(vertices);
  //console.log(verticesJSON);
  try {
    polygonEntity.setAttribute('gps-new-entity-place', {
      latitude: centerPoint[1],
      longitude: centerPoint[0]
    });
  } catch(error) {
    console.log("Error while trying to add centerPoint:")
    console.error(error);
  }
  try {
    polygonEntity.setAttribute('custom-polygon', {
      //vertices: [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0.5, y: 1, z: 0}]
      //vertices: vertices
      vertices: vertices
    });
  } catch (error) {
    console.log("Error while trying to add polygon vertices:")
    console.error(error);
  }
  
  document.querySelector("a-scene").appendChild(polygonEntity);
  console.log("placed polygon at "+centerPoint);
}



//Testing
placePolygon(result.cartesianCoords,result.centerPoint);
placePolygon(result.cartesianCoords, [10.049541015187984,53.56545329223668]);
placePosMarker([10.049541015187984,53.56545329223668]);
