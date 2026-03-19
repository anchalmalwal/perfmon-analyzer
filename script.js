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

// Extract timestamps
let timestamps = [];

for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i]);

    if (row[0]) {
        timestamps.push(row[0]);
    }
}

// Calculate start, stop
const startTime = timestamps[0];
const endTime = timestamps[timestamps.length - 1];

// Calculate duration
const duration = calculateDuration(startTime, endTime);

// Display metadata
displayMeta(startTime, endTime, duration);

    let data = {};

    // Initialize counters (ignore timestamp column)
    headers.forEach(h => {
        if (h.includes('\\')) {
            data[h] = [];
        }
    });

    // Process rows
    for (let i = 1; i < lines.length; i++) {
        const row = splitCSVLine(lines[i]);

        headers.forEach((h, index) => {
            if (data[h] && row[index]) {
                const val = parseFloat(row[index]);
                if (!isNaN(val)) {
                    data[h].push(val);
                }
            }
        });
    }

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

// ✅ Proper CSV line splitter (handles quotes)
function splitCSVLine(line) {
    const result = [];
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
        result.push(match[0].replace(/"/g, ''));
    }

    return result;
}

// ✅ Clean counter name
function cleanName(name) {
    return name
        .replace(/^\\\\.*?\\/, '') // remove server name
        .replace(/"/g, '');
}

// ✅ Analysis logic
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

// ✅ Display result
function displayResult(counters) {

    if (counters.length === 0) {
        document.getElementById("output").innerHTML = "<p>No valid data found.</p>";
        return;
    }

    let html = `
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

        html += `
            <tr>
                <td>${c.name}</td>
                <td>${c.avg.toFixed(3)}</td>
                <td>${c.max.toFixed(3)}</td>
                <td>${c.min.toFixed(3)}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById("output").innerHTML = html;
}
function displayMeta(start, end, duration) {
    document.querySelector("p:nth-of-type(1)").innerText = "Start: " + start;
    document.querySelector("p:nth-of-type(2)").innerText = "Stop: " + end;

    // Add duration dynamically
    let durEl = document.getElementById("duration");

    if (!durEl) {
        durEl = document.createElement("p");
        durEl.id = "duration";
        document.body.insertBefore(durEl, document.getElementById("output"));
    }

    durEl.innerText = "Duration: " + duration;
}

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
