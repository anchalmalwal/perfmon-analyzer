// ================================
// PerfMon Analyzer - Full Script
// ================================

// Attach file handler
document.getElementById('fileInput').addEventListener('change', handleFile);

// -------------------------------
// Sanitize Data (MASK SERVER + PATH)
// -------------------------------
function sanitizePerfmonData(csvText) {
    return csvText
        .replace(/\\\\[^\\]+\\/g, "") // remove \\SERVERNAME\
        .replace(/[A-Z]:\\[^,\n]*/g, "PATH_MASKED"); // mask file paths
}

// -------------------------------
// File Upload Handler
// -------------------------------
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        let rawData = e.target.result;

        // ✅ Clean data
        let cleanData = sanitizePerfmonData(rawData);

        processCSV(cleanData);
    };

    reader.readAsText(file);
}

// -------------------------------
// CSV Processing
// -------------------------------
function processCSV(data) {
    const lines = data.split("\n").filter(l => l.trim() !== "");

    if (lines.length < 2) {
        alert("Invalid CSV file");
        return;
    }

    const headers = lines[0].split(",");

    let timeIndex = 0;
    let cpuIndex = findColumn(headers, "% Processor Time");
    let memIndex = findColumn(headers, "Available MBytes");
    let diskReadIndex = findColumn(headers, "Avg. Disk sec/Read");
    let diskWriteIndex = findColumn(headers, "Avg. Disk sec/Write");
    let pleIndex = findColumn(headers, "Page life expectancy");

    let tableHTML = "<table><tr>";

    headers.forEach(h => {
        tableHTML += `<th>${cleanHeader(h)}</th>`;
    });

    tableHTML += "</tr>";

    let times = [];
    let cpuData = [];
    let memData = [];
    let diskData = [];
    let pleData = [];

    for (let i = 1; i < lines.length; i++) {
        let cols = lines[i].split(",");

        tableHTML += "<tr>";

        cols.forEach(c => {
            tableHTML += `<td>${c}</td>`;
        });

        tableHTML += "</tr>";

        // Collect chart data
        if (cols.length > cpuIndex) {
            times.push(cols[timeIndex]);
            cpuData.push(parseFloat(cols[cpuIndex]) || 0);
            memData.push(parseFloat(cols[memIndex]) || 0);
            diskData.push(parseFloat(cols[diskReadIndex]) || 0);
            pleData.push(parseFloat(cols[pleIndex]) || 0);
        }
    }

    tableHTML += "</table>";

    document.getElementById("output").innerHTML = tableHTML;

    // Capture details
    document.getElementById("start").innerText = "Start: " + times[0];
    document.getElementById("stop").innerText = "Stop: " + times[times.length - 1];
    document.getElementById("duration").innerText = "Duration: " + times.length + " samples";
    document.getElementById("server").innerText = "Server: MASKED";

    // Draw charts
    drawCharts(times, cpuData, memData, diskData, pleData);
}

// -------------------------------
// Find Column Index
// -------------------------------
function findColumn(headers, keyword) {
    return headers.findIndex(h => h.toLowerCase().includes(keyword.toLowerCase()));
}

// -------------------------------
// Clean Header Names
// -------------------------------
function cleanHeader(header) {
    return header
        .replace(/\\\\[^\\]+\\/g, "")
        .replace(/"/g, "");
}

// -------------------------------
// Draw Charts
// -------------------------------
function drawCharts(times, cpu, mem, disk, ple) {

    const chartDiv = document.getElementById("charts");
    chartDiv.innerHTML = `
        <canvas id="cpuChart"></canvas>
        <canvas id="memChart"></canvas>
        <canvas id="diskChart"></canvas>
        <canvas id="pleChart"></canvas>
    `;

    createChart("cpuChart", "CPU %", times, cpu);
    createChart("memChart", "Memory Available MB", times, mem);
    createChart("diskChart", "Disk Read Latency", times, disk);
    createChart("pleChart", "Page Life Expectancy", times, ple);
}

// -------------------------------
// Create Chart
// -------------------------------
function createChart(canvasId, label, labels, data) {
    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: false
                }
            }
        }
    });
}

// -------------------------------
// Export PDF
// -------------------------------
function exportPDF() {
    const element = document.body;

    html2pdf()
        .from(element)
        .save("PerfMon_Report.pdf");
}
