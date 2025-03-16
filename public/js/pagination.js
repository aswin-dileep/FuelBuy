document.addEventListener("DOMContentLoaded", function () {
    let currentPage = 1;
    const rowsPerPage = 5;
    const table = document.getElementById("ordersTable");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.getElementsByTagName("tr"));
    const pageNumberDisplay = document.getElementById("pageNumber");
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");

    function showPage(page) {
        let start = (page - 1) * rowsPerPage;
        let end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display = index >= start && index < end ? "" : "none";
        });

        pageNumberDisplay.innerText = page;
        prevButton.disabled = page === 1;
        nextButton.disabled = end >= rows.length;
    }

    prevButton.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    });

    nextButton.addEventListener("click", function () {
        if (currentPage * rowsPerPage < rows.length) {
            currentPage++;
            showPage(currentPage);
        }
    });

    showPage(currentPage);
});
