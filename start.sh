#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker before continuing."
    exit 1
fi

if netstat -an | grep -qE ":1883\s" && netstat -an | grep -qE ":8081\s"; then
      echo "Ports 1883 and 8081 are in use. Not deploying MQTT broker."
else
      echo "Deploying MQTT broker."
      docker run -d --rm -p 1883:1883 -p 8081:8081 --name mqtt eclipse-mosquitto:2.0.18 sh -c "echo -e 'listener 8081\\nprotocol websockets' >> mosquitto-no-auth.conf && mosquitto -c mosquitto-no-auth.conf"
fi

if [ "$1" == "--build" ]; then
    echo "Building globe-viewer docker image."
    source ./build.sh
fi

docker run --rm -p 80:80 --name globe-viewer globe-viewer:1.0