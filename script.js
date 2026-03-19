function parseCSV(text) {

    const rows = text.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

    const lines = text.split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) {
        alert("Invalid CSV file");
        return;
    }

    // Proper split using regex for quoted CSV
    const headers = splitCSVLine(lines[0]);

    let data = {};

    headers.forEach(h => {
        if (h.includes('\\')) {
            data[h] = [];
        }
    });

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
            name: key.replace(/^\\\\.*?\\/, '').replace(/"/g, ''),
            avg: avg,
            max: max,
            min: min
        });
    }

    displayResult(counters);
}

// ✅ Proper CSV splitter
function splitCSVLine(line) {
    const result = [];
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
        result.push(match[0].replace(/"/g, ''));
    }

    return result;
}
