export function guidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getColor(data, color_property_name) {
    if (!data.hasOwnProperty(color_property_name)) {
        return new Cesium.Color(0.0, 1.0, 0.0, 1.0) // Default to green if there is no color specified
    }
    return new Cesium.Color(parseFloat(data[color_property_name][0]), parseFloat(data[color_property_name][1]), parseFloat(data[color_property_name][2]), parseFloat(data[color_property_name][3]))
}


export function getProperty(data, propertyName, defaultValue) {
    return data.hasOwnProperty(propertyName) ? data[propertyName] : defaultValue
}