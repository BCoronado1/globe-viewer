import {getColor, getProperty, guidv4} from "./util.js"
import {getClient, publishPointData, publishPointDraw} from "./mqtt.js"

const viewer = new Cesium.Viewer("cesiumContainer");
const entityMapping = new Map();
const client = getClient(location.hostname, 8081, "globe-viewer", onMessageArrived)
const toolbar = viewer._toolbar;

const addPointButton = document.createElement("button");
addPointButton.type = "button";
addPointButton.className = "cesium-button"
addPointButton.textContent = "Add Point"
toolbar.prepend(addPointButton);

document.addEventListener("keydown", handleDelete);


function getOrCreateEntity(entityID) {
    if (entityMapping.has(entityID)) {
        return entityMapping.get(entityID);
    }
    return viewer.entities.add({id: entityID});
}

function deleteEntity(entity) {
    if (entity == null) {
        return;
    }
    console.log("Deleting entity " + entity.id);
    entityMapping.delete(entity.id);
    viewer.entities.remove(entity);
}

function onMessageArrived(msg) {
    const data = JSON.parse(msg.payloadString);
    if (msg.destinationName === "draw") {
        console.log("Received draw message. geo_type: " + data.geo_type + " guid: " + data.guid);
        if (data.geo_type === "point") {
            handlePoint(data);
        } else if (data.geo_type === "line") {
            handleLine(data);
        } else if (data.geo_type === "polygon") {
            handlePolygon(data);
        }
    } else if (msg.destinationName === "erase") {
        console.log("Received erase message. guid: " + data.guid);
        const entity = entityMapping.get(data.guid);
        deleteEntity(entity);
    }
}

function handlePoint(data) {
    const color = getColor(data, "color");
    const pointSize = getProperty(data, "point_size", 5);
    const point = getOrCreateEntity(data.guid);
    point.position = Cesium.Cartesian3.fromDegrees(data.lon, data.lat);
    point.point = {pixelSize: pointSize, color: color};
    const cartographic = Cesium.Cartographic.fromCartesian(point.position._value);
    const longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
    const latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
    entityMapping.set(data.guid, point);
    console.log("Point " + point.id + " placed at " + latitudeString + "|" + longitudeString);
}

function handleLine(data) {
    const color = getColor(data, "color");
    const width = getProperty(data, "width", 2);
    const line = getOrCreateEntity(data.guid);
    line.polyline = {
        positions: Cesium.Cartesian3.fromDegreesArray(data.points),
        width: width,
        material: color,
        clampToGround: true,
    };
    entityMapping.set(data.guid, line);
    console.log("Added line with guid: " + data.guid)
}

function handlePolygon(data) {
    const fillColor = getColor(data, "fill_color");
    const boundaryColor = getColor(data, "boundary_color");
    const polygon = getOrCreateEntity(data.guid);
    polygon.polygon = {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(data.points),
        height: 0,
        material: fillColor,
        outline: true,
        outlineColor: boundaryColor
    };
    entityMapping.set(data.guid, polygon);
    console.log("Added polygon with guid: " + data.guid)
}


addPointButton.onclick = function () {
    let isListening = true;
    const coordinateLabel = viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: "14px monospace",
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    let latitudeString = "";
    let longitudeString = "";
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        if (!isListening) {
            return;
        }
        const cartesian = viewer.camera.pickEllipsoid(
            movement.endPosition,
            viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
            latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
            coordinateLabel.position = cartesian;
            coordinateLabel.label.show = true;
            coordinateLabel.label.text = "Lat: " + latitudeString + "\n" + "Lon: " + longitudeString;
        } else {
            coordinateLabel.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
        if (!isListening) {
            return;
        }
        var pointID = guidv4()
        publishPointData(client, pointID, latitudeString, longitudeString);
        publishPointDraw(client, pointID, latitudeString, longitudeString);
        viewer.entities.remove(coordinateLabel);
        isListening = false;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
};


const pickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
var dragging;
pickHandler.setInputAction(function (click) {
    const pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject)) {
        const entity = entityMapping.get(pickedObject.id._id);
        if (entity.point === undefined) {
            return;
        }
        console.log(pickedObject);
        dragging = pickedObject;
        viewer.scene.screenSpaceCameraController.enableRotate = false;
    }
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

pickHandler.setInputAction(function () {
    if (Cesium.defined(dragging)) {
        const guid = dragging.id._id;
        const entity = entityMapping.get(guid);
        if (entity.point === undefined) {
            return;
        }
        const cartographic = Cesium.Cartographic.fromCartesian(entity.position._value);
        const pointID = guidv4();
        const longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
        const latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
        publishPointData(client, pointID, latitudeString, longitudeString);
        dragging = undefined;
        viewer.scene.screenSpaceCameraController.enableRotate = true;
    }
}, Cesium.ScreenSpaceEventType.LEFT_UP);

pickHandler.setInputAction(function (movement) {
    const mousePosition = viewer.camera.pickEllipsoid(movement.endPosition);
    if (!Cesium.defined(mousePosition) || !dragging) {
        return;
    }
    const cartographic = Cesium.Cartographic.fromCartesian(mousePosition);
    const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
    const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
    const guid = dragging.id._id;
    const entity = entityMapping.get(guid);
    entity.position = Cesium.Cartesian3.fromDegrees(longitudeString, latitudeString);
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


function handleDelete(event) {
    if (event.key === "Backspace" || event.key === "Delete") {
        const selectedEntity = viewer.selectedEntity;
        deleteEntity(selectedEntity);
    }
}