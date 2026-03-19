document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        parsePerfmon(event.target.result);
    };

    reader.readAsText(file);
});

function parsePerfmon(text) {
    const lines = text.split('\n');

    let metadata = {};
    let counters = [];
    let tableStart = false;

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith("Capture Start Time"))
            metadata.start = line.split(':')[1]?.trim();

        if (line.startsWith("Capture Stop Time"))
            metadata.stop = line.split(':')[1]?.trim();

        if (line.startsWith("Server Name"))
            metadata.server = line.split(':')[1]?.trim();

        if (line.includes("Counter Name")) {
            tableStart = true;
            return;
        }

        if (line.startsWith("---") || line === "") return;

        if (tableStart) {
            const parts = line.split(/\s{2,}/);

            if (parts.length >= 4) {
                counters.push({
                    name: parts[0],
                    avg: parseFloat(parts[1]),
                    max: parseFloat(parts[2]),
                    min: parseFloat(parts[3])
                });
            }
        }
    });

    displayResult(metadata, counters);
}

function analyzeCounter(c) {
    if (c.name.includes("Avg. Disk sec/Read") && c.avg > 0.02)
        return "⚠ High Disk Latency";

    if (c.name.includes("% Processor Time") && c.avg > 80)
        return "⚠ CPU High";

    if (c.name.includes("Available MBytes") && c.avg < 2000)
        return "⚠ Low Memory";

    if (c.name.includes("Page life expectancy") && c.avg < 300)
        return "⚠ Memory Pressure";

    return "OK";
}

function displayResult(meta, counters) {
    let html = `
        <h3>Server: ${meta.server || ""}</h3>
        <p>Start: ${meta.start || ""}</p>
        <p>Stop: ${meta.stop || ""}</p>

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
                <td>${c.avg}</td>
                <td>${c.max}</td>
                <td>${c.min}</td>
                <td>${status}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById("output").innerHTML = html;
}
