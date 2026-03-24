PerfMon Analyzer Tool

Author: Anchal Malwal

Overview

A simple GitHub-hosted web tool to analyze Windows Performance Monitor (PerfMon) data for CPU, Memory, Disk, and MSSQL.

Quick Steps
1. Capture PerfMon Data
Open perfmon.exe
Create Data Collector Set
Add counters:
CPU: Processor(_Total)% Processor Time, Processor Queue Length
Memory: Available MBytes, Pages/sec
Disk: Avg Disk sec/Read, Avg Disk sec/Write
SQL: Page Life Expectancy, Batch Requests/sec
Set interval: 5–15 sec
Start and stop capture
2. Convert BLG to CSV
relog input.blg -f csv -o output.csv
3. Open Tool

https://anchalmalwal.github.io/perfmon-analyzer/

4. Upload File
Click Choose File
Select CSV
Tool auto-generates charts
Key Benefits
Analysis in seconds
No dependency on specialists
Accurate (Min, Max, Avg + error handling)
Faster troubleshooting
Summary

Quick, simple, and reliable PerfMon analysis for faster issue identification.
