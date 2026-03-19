// File upload handler
document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        parseCSV(event.target.result);
    };

    reader.readAsText(file);
});

function parseCSV(text) {

    const lines = text.split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) {
        alert("Invalid CSV file");
        return;
    }

    const headers = splitCSVLine(lines[0]);

    let data = {};
    let timestamps = [];
    let serverName = "";

    // Initialize counters + extract server name
    headers.forEach(h => {
        if (h.includes('\\')) {
            data[h] = [];

            if (!serverName) {
                const match = h.match(/^\\\\([^\\]+)/);
                if (match) serverName = match[1];
            }
        }
    });

    // Read rows
    for (let i = 1; i < lines.length; i++) {
        const row = splitCSVLine(lines[i]);

        if (row[0]) timestamps.push(row[0]);

        headers.forEach((h, index) => {
            if (data[h] && row[index]) {
                const val = parseFloat(row[index]);
                if (!isNaN(val)) {
                    data[h].push(val);
                }
            }
        });
    }

    if (timestamps.length === 0) {
        document.getElementById("output").innerHTML = "<p>No valid data found.</p>";
        return;
    }

    // Time calculations
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const duration = calculateDuration(startTime, endTime);

    displayMeta(serverName, startTime, endTime, duration);

    // Calculate counters
    let counters = [];

    for (let key in data) {
        const values = data[key];
        if (values.length === 0) continue;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        counters.push({
            name: cleanName(key),
            avg: avg,
            max: max,
            min: min
        });
    }

    displayResult(counters);
}

// Proper CSV split (handles quotes)
function splitCSVLine(line) {
    const result = [];
    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
        result.push(match[0].replace(/"/g, '').trim());
    }

    return result;
}

// Clean counter name
function cleanName(name) {
    return name
        .replace(/^\\\\.*?\\/, '')
        .replace(/"/g, '');
}

// Duration calculation
function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffMs = endDate - startDate;

    const seconds = Math.floor(diffMs / 1000);
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${mins % 60}m ${seconds % 60}s`;
}

// Display metadata
function displayMeta(server, start, end, duration) {
    document.getElementById("server").innerHTML = `<b>Server:</b> ${server || "-"}`;
    document.getElementById("start").innerHTML = `<b>Start:</b> ${start || "-"}`;
    document.getElementById("stop").innerHTML = `<b>Stop:</b> ${end || "-"}`;
    document.getElementById("duration").innerHTML = `<b>Duration:</b> ${duration || "-"}`;
}

// Analysis logic
function analyzeCounter(c) {

    if (c.name.includes("Disk sec/Read") && c.avg > 0.02)
        return "🔴 High Disk Latency";

    if (c.name.includes("Disk sec/Write") && c.avg > 0.02)
        return "🔴 High Disk Write Latency";

    if (c.name.includes("% Processor Time") && c.avg > 80)
        return "🔴 CPU Bottleneck";

    if (c.name.includes("Available MBytes") && c.avg < 2000)
        return "🟠 Low Memory";

    if (c.name.includes("Page life expectancy") && c.avg < 300)
        return "🔴 Memory Pressure";

    if (c.name.includes("Buffer cache hit ratio") && c.avg < 95)
        return "🟠 Cache Issue";

    return "🟢 Healthy";
}

// Severity scoring
function getSeverityScore(c) {
    const status = analyzeCounter(c);

    if (status.includes("🔴")) return 3;
    if (status.includes("🟠")) return 2;
    return 1;
}

// Row color
function getRowColor(status) {
    if (status.includes("🔴")) return "#ffcccc";
    if (status.includes("🟠")) return "#ffe0b3";
    return "#ccffcc";
}

// Display results with Top Issues
function displayResult(counters) {

    if (counters.length === 0) {
        document.getElementById("output").innerHTML = "<p>No valid data found.</p>";
        return;
    }

    // Sort worst first
    counters.sort((a, b) => getSeverityScore(b) - getSeverityScore(a));

    // Top 5 issues
    const topIssues = counters
        .filter(c => analyzeCounter(c) !== "🟢 Healthy")
        .slice(0, 5);

    let summaryHtml = "<h3>Top Issues</h3>";

    if (topIssues.length === 0) {
        summaryHtml += "<p>✅ No major issues detected</p>";
    } else {
        summaryHtml += "<ul>";
        topIssues.forEach(c => {
            summaryHtml += `<li><b>${c.name}</b> → ${analyzeCounter(c)}</li>`;
        });
        summaryHtml += "</ul>";
    }

    // Table
    let tableHtml = `
        <table>
        <tr>
            <th>Counter</th>
            <th>Avg</th>
            <th>Max</th>
            <th>Min</th>
            <th>Status</th>
        </tr>
    `;

    counters.forEach(c => {
        const status = analyzeCounter(c);
        const color = getRowColor(status);

        tableHtml += `
            <tr style="background-color:${color}">
                <td>${c.name}</td>
                <td>${c.avg.toFixed(3)}</td>
                <td>${c.max.toFixed(3)}</td>
                <td>${c.min.toFixed(3)}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    tableHtml += "</table>";

    document.getElementById("output").innerHTML = summaryHtml + tableHtml;
}
