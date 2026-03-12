#!/bin/bash

# Example usage script for fetching DORA metrics from HSBC DataSight

echo "=========================================="
echo "DORA Metrics Fetcher - Example Usage"
echo "=========================================="
echo ""

# Configuration
FROM_DATE="2025-09"
TO_DATE="2025-10"
TEAMBOOK_ID="5449"
LEVEL=3

# Example 1: Basic fetch
echo "Example 1: Basic fetch with auto-generated output file"
python fetch_dora_metrics.py \
    --from "$FROM_DATE" \
    --to "$TO_DATE" \
    --teambook-ids "$TEAMBOOK_ID" \
    --level "$LEVEL"

echo ""
echo "=========================================="
echo ""

# Example 2: Custom output file
echo "Example 2: Custom output file"
python fetch_dora_metrics.py \
    --from "$FROM_DATE" \
    --to "$TO_DATE" \
    --teambook-ids "$TEAMBOOK_ID" \
    --level "$LEVEL" \
    --output "custom_report.csv"

echo ""
echo "=========================================="
echo ""

# Example 3: Fetch with detailed records
echo "Example 3: Fetch with detailed records using aggregation keys"
python fetch_dora_metrics.py \
    --from "$FROM_DATE" \
    --to "$TO_DATE" \
    --teambook-ids "$TEAMBOOK_ID" \
    --level "$LEVEL" \
    --fetch-details \
    --output "detailed_report.csv"

echo ""
echo "=========================================="
echo ""

# Example 4: Save both CSV and JSON
echo "Example 4: Save both CSV report and raw JSON data"
python fetch_dora_metrics.py \
    --from "$FROM_DATE" \
    --to "$TO_DATE" \
    --teambook-ids "$TEAMBOOK_ID" \
    --level "$LEVEL" \
    --output "report.csv" \
    --json-output "raw_data.json"

echo ""
echo "=========================================="
echo ""

# Example 5: Multiple teambooks
echo "Example 5: Fetch for multiple teambooks"
MULTIPLE_TEAMBOOKS="5449,5450,5451"
python fetch_dora_metrics.py \
    --from "$FROM_DATE" \
    --to "$TO_DATE" \
    --teambook-ids "$MULTIPLE_TEAMBOOKS" \
    --level "$LEVEL" \
    --output "multiple_teambooks_report.csv"

echo ""
echo "=========================================="
echo "All examples completed!"
echo "=========================================="
