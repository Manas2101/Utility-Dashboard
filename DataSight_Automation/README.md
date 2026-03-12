# DataSight DORA Metrics Fetcher for HSBC

Python script to fetch DORA (DevOps Research and Assessment) metrics from the HSBC DataSight platform and generate comprehensive CSV reports.

## DORA Metrics Supported

1. **Release Frequency** - Deployment frequency and production releases
2. **Lead Time to Deploy (LTTD)** - Time from code commit to production deployment
3. **Change Failure Rate (CFR)** - Percentage of changes causing incidents
4. **Mean Time to Recovery (MTTR)** - Average time to recover from incidents

## Features

- ✅ Fetch all 4 DORA metrics from HSBC DataSight platform
- ✅ Support for teambook-based queries (levels 1-5)
- ✅ Date range filtering (YYYY-MM format)
- ✅ Fetch detailed records using aggregation keys
- ✅ Generate comprehensive CSV reports with selected fields
- ✅ Export raw JSON data (optional)
- ✅ Bearer token authentication
- ✅ Error handling and status reporting

## Prerequisites

- Python 3.7 or higher
- HSBC DataSight platform access
- Valid Bearer token for authentication

## Installation

1. Navigate to the project directory:
```bash
cd /Users/kritikapandey/Desktop/DataSightauto
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure your credentials:

**Option A: Using config.json (Recommended)**
```bash
# Edit config.json with your bearer token
{
  "base_url": "https://datasight.global.hsbc",
  "bearer_token": "YOUR_BEARER_TOKEN_HERE"
}
```

**Option B: Using environment variables**
```bash
cp .env.example .env
# Edit .env with your bearer token
export DATASIGHT_BASE_URL="https://datasight.global.hsbc"
export DATASIGHT_BEARER_TOKEN="your_token_here"
```

**Option C: Pass via command line**
```bash
# Use --base-url and --token arguments
```

## Usage

### Basic Usage

Fetch DORA metrics for a specific teambook and date range:

```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids 5449 \
  --level 3
```

This will:
- Fetch all 4 DORA metrics
- Generate a CSV report: `dora_report_<timestamp>.csv`
- Display progress and status in console

### Advanced Usage

**Custom output file:**
```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids 5449 \
  --level 3 \
  --output my_custom_report.csv
```

**Fetch detailed records using aggregation keys:**
```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids 5449 \
  --level 3 \
  --fetch-details
```

**Save raw JSON data:**
```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids 5449 \
  --level 3 \
  --output report.csv \
  --json-output raw_data.json
```

**Multiple teambooks:**
```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids "5449,5450,5451" \
  --level 3
```

**Override config with command line:**
```bash
python fetch_dora_metrics.py \
  --from 2025-09 \
  --to 2025-10 \
  --teambook-ids 5449 \
  --level 3 \
  --base-url "https://datasight.global.hsbc" \
  --token "your_bearer_token"
```

### Command Line Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--from` | Yes | Start date in YYYY-MM format (e.g., 2025-09) |
| `--to` | Yes | End date in YYYY-MM format (e.g., 2025-10) |
| `--teambook-ids` | Yes | Teambook IDs (comma-separated for multiple) |
| `--level` | Yes | Teambook level (1-5) |
| `--base-url` | No | DataSight API base URL (default: from config) |
| `--token` | No | Bearer token for authentication (default: from config) |
| `--output` | No | Output CSV file path (default: auto-generated) |
| `--json-output` | No | Also save raw JSON data to this file |
| `--fetch-details` | No | Fetch detailed records using aggregation keys |
| `--config` | No | Config file path (default: config.json) |

## API Endpoints Used

The script uses the following HSBC DataSight API endpoints:

1. **Release Frequency**: `/releases/metric/release-frequency/teambook/metric`
2. **Lead Time to Deploy**: `/releases/metric/lttd/teambook/metric`
3. **Mean Time to Recovery**: `/incident/metric/mttr/by-service/teambook/metric`
4. **Change Failure Rate**: `/releases/metric/cfr/teambook/metric`
5. **Detailed LTTD Records**: `/releases/metric/lttd/teambook/records` (with aggKey)

## CSV Report Format

The generated CSV report includes:

### Report Header
- Generation timestamp
- Date range (from-to)
- Teambook IDs
- Teambook level

### Release Frequency Section
- Year-Month
- Releases count
- Software releases percentage
- PDPTPPY (calendar days and headcount basis)
- Head count and IT head count
- Pods count
- Teambook hierarchy (L1, L2, L3)

### Lead Time to Deploy (LTTD) Section
- Year-Month
- LTTD in days
- Highest LTTD
- CRs with LTTD and eligible CRs
- Percentage metrics
- Pods statistics
- Teambook hierarchy
- Aggregation key

### Mean Time to Recovery (MTTR) Section
- Year-Month
- MTTR in hours
- MTTR CHM (Change Management)
- Incidents count
- Non-incidents percentage
- Teambook hierarchy
- Aggregation key

### Change Failure Rate (CFR) Section
- Year-Month
- Change failure rate percentage
- Change causing incident percentage
- Change with business impact percentage
- Releases and failure counts
- Pods and headcount
- Teambook hierarchy
- Aggregation key

### Detailed Records Section (if --fetch-details used)
- Detailed records for each aggregation key
- All fields from the detailed API response

## Example Output

```
DORA METRICS REPORT
Generated: 2026-01-14T21:56:00
Period: 2025-09 to 2025-10
Teambook IDs: 5449
Teambook Level: 3

==================== RELEASE FREQUENCY ====================

Year-Month,Releases,Software Releases %,PDPTPPY (Calendar),...
202510,73,85.9,31,...
202509,99,88.4,30,...

==================== LEAD TIME TO DEPLOY (LTTD) ====================

Year-Month,LTTD (days),Highest LTTD,CRs with LTTD,...
202510,2.3,393.1,48,...
202509,3.3,545.3,72,...

...
```

## Using as a Python Module

Import and use in your own scripts:

```python
from fetch_dora_metrics import DataSightDORAFetcher

# Initialize
fetcher = DataSightDORAFetcher(
    base_url="https://datasight.global.hsbc",
    bearer_token="your_bearer_token"
)

# Fetch all metrics
results = fetcher.fetch_all_metrics(
    from_date="2025-09",
    to_date="2025-10",
    teambook_ids="5449",
    teambook_level=3,
    fetch_details=True
)

# Generate CSV report
fetcher.generate_csv_report(results, "my_report.csv")

# Save JSON
fetcher.save_to_json(results, "raw_data.json")

# Or fetch individual metrics
release_freq = fetcher.fetch_release_frequency("2025-09", "2025-10", "5449", 3)
lttd = fetcher.fetch_lttd("2025-09", "2025-10", "5449", 3)
mttr = fetcher.fetch_mttr("2025-09", "2025-10", "5449", 3)
cfr = fetcher.fetch_cfr("2025-09", "2025-10", "5449", 3)

# Fetch detailed records using aggregation key
details = fetcher.fetch_lttd_records(agg_key="-2484391008828586652")
```

## Error Handling

The script handles errors gracefully:
- Network errors and timeouts
- API authentication failures (401)
- Invalid parameters (400)
- API endpoint not found (404)
- Rate limiting

Each metric is fetched independently, so if one fails, others will still be attempted.

## Security Best Practices

1. **Never commit bearer tokens** to version control
2. Use `.env` file or environment variables for sensitive data
3. Add `config.json` to `.gitignore` if it contains credentials
4. Rotate bearer tokens regularly
5. Use read-only tokens when possible
6. Keep bearer tokens secure and don't share them

## Troubleshooting

**Issue: "base_url and bearer_token are required!"**
- Ensure you've configured credentials via config.json, .env, or command line
- Check that config.json exists and is valid JSON

**Issue: API returns 401 Unauthorized**
- Verify your bearer token is correct and not expired
- Check if the token has necessary permissions for DataSight APIs
- Try regenerating the bearer token

**Issue: API returns 404 Not Found**
- Verify the base URL is correct: `https://datasight.global.hsbc`
- Check network connectivity to HSBC internal network
- Ensure you're on HSBC VPN if required

**Issue: Empty data in response**
- Verify the teambook IDs exist
- Check the date range is valid (YYYY-MM format)
- Ensure the teambook level matches your data

**Issue: Connection timeout**
- Check network connectivity
- Verify HSBC DataSight platform is accessible
- Try increasing timeout in the script if needed

## Date Format

The script uses **YYYY-MM** format for dates:
- ✅ Correct: `2025-09`, `2025-10`, `2024-01`
- ❌ Incorrect: `2025-9`, `09-2025`, `2025/09`

## Teambook Levels

The DataSight platform uses hierarchical teambook levels:
- **Level 1**: L1 Teambook (e.g., "CTO Data Technology")
- **Level 2**: L2 Teambook (e.g., "Data Assets&Provisioning Tech")
- **Level 3**: L3 Teambook (e.g., "Customer Data Mastering Services")
- **Level 4**: L4 Teambook
- **Level 5**: L5 Teambook

## Batch Processing Example

Create a shell script to fetch metrics for multiple teambooks:

```bash
#!/bin/bash

TEAMBOOKS=("5449" "5450" "5451")
FROM_DATE="2025-09"
TO_DATE="2025-10"
LEVEL=3

for teambook in "${TEAMBOOKS[@]}"; do
    echo "Fetching metrics for teambook: $teambook"
    python fetch_dora_metrics.py \
        --from "$FROM_DATE" \
        --to "$TO_DATE" \
        --teambook-ids "$teambook" \
        --level "$LEVEL" \
        --output "report_${teambook}.csv"
done
```

## Data Fields Reference

### Release Frequency Fields
- `releases`: Total number of releases
- `percent_software_releases`: Percentage of software releases
- `pdptppy_calendar_days`: Production deployments per team per year (calendar basis)
- `pdptppy_full_headcount_basis`: Production deployments per team per year (headcount basis)
- `head_count`: Total headcount
- `it_head_count`: IT headcount
- `pods_count`: Number of pods

### LTTD Fields
- `lttd`: Lead time to deploy in days
- `highest_lttd`: Highest LTTD value
- `crs_with_lttd`: Change requests with LTTD data
- `eligible_crs`: Total eligible change requests
- `percent_crs_with_lttd`: Percentage of CRs with LTTD
- `pods_with_lttd_less_than_week`: Pods with LTTD < 7 days

### MTTR Fields
- `mttr`: Mean time to recovery in hours
- `mttr_chm`: MTTR for change management incidents
- `incidents_count`: Total incidents
- `incidents_count_chm`: Change management incidents
- `non_incidents_percent`: Percentage of non-incidents

### CFR Fields
- `change_failure_rate`: Overall change failure rate percentage
- `percent_change_causing_incident`: Changes causing incidents
- `percent_change_with_business_impact`: Changes with business impact
- `change_failed`: Number of failed changes
- `change_causing_incident`: Changes that caused incidents

## License

Internal HSBC use only.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your bearer token and permissions
3. Contact HSBC DataSight platform support
4. Check DataSight API documentation
