PerfMon Analyzer Tool



Author: Anchal Malwal
________________________________________
Overview: 
A simple GitHub-hosted web tool to analyze Windows Performance Monitor (PerfMon) data for CPU, Memory, Disk, and MSSQL.
________________________________________
Quick Steps
1. Capture PerfMon Data
	Open perfmon.exe
	Create Data Collector Set
	Add counters:
o	CPU:
o	Memory
o	Disk
o	SQL
	Set interval: 5–15 sec
	Start and stop capture
________________________________________
2. Convert & Mask BLG to CSV (Automated)
Run the PowerShell script below:
# Convert BLG → CSV
relog input.blg -f csv -o output.csv
# Read full file
$content = Get-Content output.csv -Raw
# Mask server + instance details
$content = $content -replace '\\\\[A-Za-z0-9._-]+\\[A-Za-z0-9$._*-]+', 'XXXXXX'
$content = $content -replace '\\\\[A-Za-z0-9._-]+', 'XXXXXX'
$content = $content -replace '\bMSSQLSERVER\b', 'XXXXXX'
$content = $content -replace '\bMSSQL\$[A-Za-z0-9_*.-]+\b', 'XXXXXX'
$content = $content -replace '\bSQLServer\b', 'XXXXXX'
# Overwrite masked file if exists
if (Test-Path "output_masked.csv") {
    Remove-Item "output_masked.csv" -Force
}
# Save masked file
Set-Content output_masked.csv $content
# Delete original CSV after success
if ((Test-Path "output_masked.csv") -and ((Get-Item "output_masked.csv").Length -gt 0)) {
    Remove-Item "output.csv" -Force
}
________________________________________
3. Open Tool
https://anchalmalwal.github.io/perfmon-analyzer/
________________________________________
4. Upload File
	Click Choose File
	Select output_masked.csv
	Tool auto-generates charts
________________________________________

Security & Data Privacy
	No sensitive information about the environment is exposed
	Server names, instance names, and identifiers are fully masked
	No server IP, hostname, or internal details are shared
	Masking is done locally on your system before upload
	Only sanitized PerfMon counter data is used in the tool
________________________________________
Key Benefits
	Sensitive data (server/instance) automatically masked
	Analysis completed in seconds
	No dependency on specialists
	Accurate (Min, Max, Avg + error handling)
	Faster troubleshooting and resolution
________________________________________
 

Summary:

BLG → CSV → Auto Mask → Upload → Instant Analysis
Secure, fast, and reliable PerfMon analysis with zero manual effort.












