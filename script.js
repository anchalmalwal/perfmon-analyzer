// File upload
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
    if (lines.length < 2) return;

    const headers = splitCSVLine(lines[0]);

    let data = {};
    let timestamps = [];
    let serverName = "";

    headers.forEach(h => {
        if (h.includes('\\')) {
            data[h] = [];

            if (!serverName) {
                const match = h.match(/^\\\\([^\\]+)/);
                if (match) serverName = match[1];
            }
        }
    });

    for (let i = 1; i < lines.length; i++) {
        const row = splitCSVLine(lines[i]);

        if (row[0]) timestamps.push(row[0]);

        headers.forEach((h, index) => {
            if (data[h] && row[index]) {
                const val = parseFloat(row[index]);
                if (!isNaN(val)) data[h].push(val);
            }
        });
    }

    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const duration = calculateDuration(startTime, endTime);

    displayMeta(serverName, startTime, endTime, duration);

    let counters = [];

    for (let key in data) {
        const values = data[key];
        if (values.length === 0) continue;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        counters.push({
            name: cleanName(key),
            avg,
            max,
            min,
            series: values   // 🔥 needed for graph
        });
    }

    displayResult(counters, timestamps);
}

// CSV parser
function splitCSVLine(line) {
    const result = [];
    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
        result.push(match[0].replace(/"/g, '').trim());
    }

    return result;
}

// Clean name
function cleanName(name) {
    return name.replace(/^\\\\.*?\\/, '').replace(/"/g, '');
}

// Duration
function calculateDuration(start, end) {
    const diff = new Date(end) - new Date(start);

    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
}

// Metadata
function displayMeta(server, start, end, duration) {
    document.getElementById("server").innerHTML = `<b>Server:</b> ${server || "-"}`;
    document.getElementById("start").innerHTML = `<b>Start:</b> ${start}`;
    document.getElementById("stop").innerHTML = `<b>Stop:</b> ${end}`;
    document.getElementById("duration").innerHTML = `<b>Duration:</b> ${duration}`;
}

// Analysis
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

    return "🟢 Healthy";
}

// Severity
function getSeverityScore(c) {
    const s = analyzeCounter(c);
    if (s.includes("🔴")) return 3;
    if (s.includes("🟠")) return 2;
    return 1;
}

// Row color
function getRowColor(status) {
    if (status.includes("🔴")) return "#ffcccc";
    if (status.includes("🟠")) return "#ffe0b3";
    return "#ccffcc";
}

// Display result
function displayResult(counters, timestamps) {

    counters.sort((a, b) => getSeverityScore(b) - getSeverityScore(a));

    const topIssues = counters.filter(c => analyzeCounter(c) !== "🟢 Healthy").slice(0, 5);

    let html = "<h3>Top Issues</h3>";

    if (topIssues.length === 0) {
        html += "<p>✅ No major issues</p>";
    } else {
        html += "<ul>";
        topIssues.forEach(c => {
            html += `<li>${c.name} → ${analyzeCounter(c)}</li>`;
        });
        html += "</ul>";
    }

    html += `
    <table>
    <tr>
        <th>Counter</th>
        <th>Avg</th>
        <th>Max</th>
        <th>Min</th>
        <th>Status</th>
    </tr>`;

    counters.forEach(c => {
        const status = analyzeCounter(c);
        const color = getRowColor(status);

        html += `
        <tr style="background:${color}">
            <td>${c.name}</td>
            <td>${c.avg.toFixed(3)}</td>
            <td>${c.max.toFixed(3)}</td>
            <td>${c.min.toFixed(3)}</td>
            <td>${status}</td>
        </tr>`;
    });

    html += "</table>";

    document.getElementById("output").innerHTML = html;

    renderCharts(counters, timestamps);
}

// 🔥 LINE GRAPH (time-series)
function renderCharts(counters, timestamps) {

    const container = document.getElementById("charts");
    container.innerHTML = "<h3>Problematic Counters (Line Graph)</h3>";

    const red = counters.filter(c => analyzeCounter(c).includes("🔴"));

    if (red.length === 0) {
        container.innerHTML += "<p>No critical issues</p>";
        return;
    }

    red.forEach((c, i) => {

        const canvas = document.createElement("canvas");
        canvas.style.maxWidth = "900px";
        canvas.style.marginBottom = "40px";

        container.appendChild(canvas);

        const ctx = canvas.getContext("2d");

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: c.name,
                    data: c.series,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    });
}

// PDF export
function exportPDF() {
    html2pdf().from(document.body).save('PerfMon_Report.pdf');
}
