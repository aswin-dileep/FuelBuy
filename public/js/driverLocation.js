const socket = io();

function sendLocation(vehicleId) {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Send location update to the server
            socket.emit("updateLocation", { vehicleId, latitude, longitude });

        }, (error) => {
            console.error("Error getting location:", error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

// Call this function when the driver occupies a vehicle
sendLocation("<%= vehicleId %>");
