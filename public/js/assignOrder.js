document.addEventListener("DOMContentLoaded", function () {
    // Select elements
    const assignModal = document.getElementById("assignModal");
    const driverSelect = document.getElementById("driverSelect");
    const confirmAssign = document.getElementById("confirmAssign");
    let selectedOrderId = null;

    // Add event listeners to "Assign Order" buttons
    document.querySelectorAll(".assign-btn").forEach(button => {
        button.addEventListener("click", async function () {
            selectedOrderId = this.getAttribute("data-order-id");

            // Fetch available drivers
            const response = await fetch("/fuelstation/get-available-drivers");
            const drivers = await response.json();
            
            // Populate the driver selection dropdown
            driverSelect.innerHTML = "";
            if (drivers.length === 0) {
                driverSelect.innerHTML = "<option disabled>No drivers available</option>";
            }
            console.log("Fetched drivers:", drivers);
            drivers.forEach(driver => {
                let option = document.createElement("option");
                option.value = driver._id;
                option.textContent = driver.userId ? driver.userId.name : "Unknown Driver";
                driverSelect.appendChild(option);
            });
           

            // Show modal
            assignModal.style.display = "block";
        });
    });

    // Assign order when confirm button is clicked
    confirmAssign.addEventListener("click", async function () {
        if (!selectedOrderId || !driverSelect.value) {
            alert("Please select a driver.");
            return;
        }

        const response = await fetch("/fuelstation/assign-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: selectedOrderId, driverId: driverSelect.value })
        });

        if (response.ok) {
            alert("Order assigned successfully!");
            location.reload();
        } else {
            alert("Error assigning order.");
        }

        // Close modal
        assignModal.style.display = "none";
    });

    // Close modal when clicking on the close button
    document.querySelector(".close").addEventListener("click", function () {
        assignModal.style.display = "none";
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", function (event) {
        if (event.target === assignModal) {
            assignModal.style.display = "none";
        }
    });
});
