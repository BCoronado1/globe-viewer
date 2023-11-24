# GlobeViewer

GlobeViewer deploys a Cesium webserver with a client side mqtt-based API to draw elements on the screen.

# Usage
`build.sh` - Builds the docker container with the client-side javascript code.

`start.sh` - Starts the container. By default, it is accessible on a browser at `localhost`. The script will deploy a mqtt broker if ports 1883 and 8081 are not currently in use.

`start.sh --build` - Combines the two commands above.


# API

## Draw
To draw an element on the map, a json message can be published to the "draw" topic. The following describes the json structure for each of the three element types starting with the fields common to all three:

Common:
```
guid: Required
geo_type: Required
color: Optional, default=[0.0, 1.0, 0.0, 1.0] (green with 100% opacity)
```

Point:
```
lat: Required
lon: Required
point_size: Optional, default=5
```

Line:
```
points: Required (Array with geo-json values e.g. [lon1, lat1, lon2, lat2, lon3, lat3]
width: Optional, default=2
```

Polygon:
```
points: Required (Same as Line)
fill_color: Optional, default=[0.0, 1.0, 0.0, 1.0] (green with 100% opacity)
boundary_color: Optional, default=[0.0, 1.0, 0.0, 1.0] (green with 100% opacity)
```
## Erase
To erase an element, the "erase" topic can be used. "guid" should match the "guid" for any previously published "draw" topic.
```
guid: Required
```

## Examples

##### Point
```json
{
    "guid": "statue_of_liberty",
    "geo_type": "point",
    "point_size": 20,
    "lat": 40.68924959296952,
    "lon": -74.04455103734185,
    "color": [1.0, 1.0, 0.0, 1.0]
}
```

##### Line
```json
{
  "guid": "panama_canal",
  "geo_type": "line",
  "width": 10,
  "points": [-79.5551903, 8.9287305, -79.5689017, 8.9484014, -79.5731503, 8.9617549, -79.614011, 9.0130914, -79.6316733, 9.0288682, -79.6446259, 9.0394689, -79.6575404, 9.0576531, -79.6683759, 9.065389, -79.6724207, 9.0705283, -79.6792128, 9.0866862, -79.6896825, 9.1051642, -79.6968068, 9.1110974, -79.7076649, 9.1155043, -79.7252821, 9.118131, -79.7547759, 9.120715, -79.7725108, 9.1116029, -79.7818206, 9.1168569, -79.8046722, 9.1209244, -79.8211631, 9.173801, -79.8337081, 9.1770221, -79.8445215, 9.1839702, -79.8601425, 9.1821061, -79.920397, 9.2007462, -79.9259538, 9.2302719, -79.9102261, 9.2573813, -79.9213841, 9.3290834],
  "color": [1.0, 0.0, 1.0, 1.0]
}
```

##### Polygon
```json
{
  "guid": "texas",
  "geo_type": "polygon",
  "fill_color": [0.0, 0.0, 1.0, 0.25],
  "boundary_color": [1.0, 1.0, 1.0, 1.0],
  "points": [-103.0422994, 36.5006054, -103.0646129, 31.9995157, -106.6173167, 32.0012627, -106.6330288, 31.8670614, -106.4882409, 31.7514874, -106.4427124, 31.760162, -106.3613652, 31.7237328, -106.3033132, 31.6206398, -106.2789793, 31.5648412, -106.1572643, 31.439091, -105.9960575, 31.388757, -105.3456493, 30.8699908, -104.9501415, 30.6434056, -104.6864696, 30.188641, -104.5395274, 29.6888275, -104.1797252, 29.4296101, -103.6317821, 29.1577373, -103.1415172, 28.9764881, -102.6663586, 29.7520375, -102.110251, 29.8512608, -101.4001842, 29.7758799, -101.0390087, 29.4260218, -99.7878682, 27.7268438, -99.1116991, 26.5121861, -98.188423, 26.0783752, -97.1498485, 25.9588466, -97.3856057, 26.9068579, -97.2047802, 27.6794534, -96.3848951, 28.4404077, -93.9088817, 29.7651515, -93.5353466, 31.0584038, -94.0306368, 31.9768533, -94.0448375, 33.5615942, -94.3605783, 33.5412829, -94.5887315, 33.6576766, -95.1832958, 33.9395427, -96.6641889, 33.7655668, -98.2944473, 34.0270855, -100.0062938, 34.5570699, -100.0062938, 36.5059377, -103.0422994, 36.5006054]
}
```

For example, using the `mosquitto_pub` utility and with `polygon.txt` containing the polygon json example, then running the following command will publish the polygon to GlobeViewer:

`mosquitto_pub -t 'draw' -f polygon.txt`

Erasing the polygon:

`mosquitto_pub -t 'erase' -m '{"guid": "texas"}'`

