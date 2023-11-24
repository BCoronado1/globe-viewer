import {guidv4} from "./util.js"

export function getClient(host, port, clientID, onMessageArrived) {
    const client = new Paho.MQTT.Client(host, port, clientID);
    client.onMessageArrived = onMessageArrived;

    function onConnect() {
        console.log("Connected!");
        const subscriptions = new Set(["draw", "erase"]);
        subscriptions.forEach(key => {
            client.subscribe(key);
            console.log("Subscribed to " + key);
        });
        const messageMap = new Map();
        messageMap.set("message_type", "draw_all");
        messageMap.set("guid", guidv4());
        const payloadString = JSON.stringify(Object.fromEntries(messageMap));
        const message = new Paho.MQTT.Message(payloadString);
        message.destinationName = "draw_all";
        client.send(message);
    }

    client.onConnectionLost = onConnectionLost;
    client.connect({onSuccess: onConnect});
    return client;
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}


export function publishPointData(client, pointID, latitudeString, longitudeString) {
    const messageMap = new Map();
    messageMap.set("message_type", "point");
    messageMap.set("guid", pointID);
    messageMap.set("lat", latitudeString);
    messageMap.set("lon", longitudeString);
    const payloadString = JSON.stringify(Object.fromEntries(messageMap));
    const message = new Paho.MQTT.Message(payloadString);
    message.destinationName = "point";
    client.send(message);
}

export function publishPointDraw(client, pointID, latitudeString, longitudeString, size, color) {
    if (size == null) {
        size = 5;
    }
    if (color == null) {
        color = [1.0, 1.0, 0.0, 1.0]
    }
    const messageMap = new Map();
    messageMap.set("message_type", "draw");
    messageMap.set("guid", pointID);
    messageMap.set("point_size", size);
    messageMap.set("lat", latitudeString);
    messageMap.set("lon", longitudeString);
    messageMap.set("geo_type", "point");
    messageMap.set("color", color);
    const payloadString = JSON.stringify(Object.fromEntries(messageMap));
    const message = new Paho.MQTT.Message(payloadString);
    message.destinationName = "draw";
    client.send(message);
}


