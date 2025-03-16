document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn-assign").forEach(button => {
        button.addEventListener("click", async function () {
            const orderId = this.getAttribute("data-order-id");
            const driverId = prompt("Enter the Driver ID to assign:");

            if (!driverId) {
                alert("Driver ID is required!");
                return;
            }

            try {
                const response = await fetch(`/fuelstation/assign-order/${orderId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ driverId }),
                });

                const result = await response.json();
                if (response.ok) {
                    alert("Order assigned successfully!");
                    location.reload(); // Refresh page to reflect changes
                } else {
                    alert(result.message || "Failed to assign order.");
                }
            } catch (error) {
                console.error("Error assigning order:", error);
                alert("An error occurred. Try again.");
            }
        });
    });
});
