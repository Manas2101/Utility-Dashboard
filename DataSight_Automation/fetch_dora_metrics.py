import requests
import json
import argparse
import csv
from datetime import datetime
from typing import Dict, List, Optional
import os
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class DataSightDORAFetcher:
    """
    Fetches DORA metrics from HSBC DataSight platform.
    Supports: Release Frequency, Lead Time for Changes (LTTD), Change Failure Rate (CFR), Mean Time to Recovery (MTTR)
    """
    
    def __init__(self, base_url: str, bearer_token: str):
        """
        Initialize the DataSight DORA metrics fetcher.
        
        Args:
            base_url: Base URL for DataSight API (e.g., https://datasight.global.hsbc)
            bearer_token: Bearer token for authorization
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {bearer_token}',
            'Content-Type': 'application/json'
        }
    
    def fetch_release_frequency(self, from_date: str, to_date: str, teambook_ids: str, 
                                teambook_level: int, page: int = 1, size: int = 50) -> Dict:
        """
        Fetch Release Frequency metric.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            page: Page number
            size: Page size
            
        Returns:
            API response as dictionary
        """
        endpoint = f"{self.base_url}/releases/metric/release-frequency/teambook/metric"
        params = {
            'from': from_date,
            'to': to_date,
            'teambookIds': teambook_ids,
            'teambookLevel': teambook_level,
            'page': page,
            'size': size
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, verify=False)
            response.raise_for_status()
            result = response.json()
            return {
                'metric': 'Release Frequency',
                'status': 'success',
                'data': result
            }
        except requests.exceptions.RequestException as e:
            return {
                'metric': 'Release Frequency',
                'status': 'error',
                'error': str(e),
                'data': None
            }
    
    def fetch_lttd(self, from_date: str, to_date: str, teambook_ids: str, 
                   teambook_level: int, page: int = 1, size: int = 50) -> Dict:
        """
        Fetch Lead Time to Deploy (LTTD) metric.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            page: Page number
            size: Page size
            
        Returns:
            API response as dictionary
        """
        endpoint = f"{self.base_url}/releases/metric/lttd/teambook/metric"
        params = {
            'from': from_date,
            'to': to_date,
            'teambookIds': teambook_ids,
            'teambookLevel': teambook_level,
            'page': page,
            'size': size
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, verify=False)
            response.raise_for_status()
            result = response.json()
            return {
                'metric': 'Lead Time to Deploy (LTTD)',
                'status': 'success',
                'data': result
            }
        except requests.exceptions.RequestException as e:
            return {
                'metric': 'Lead Time to Deploy (LTTD)',
                'status': 'error',
                'error': str(e),
                'data': None
            }
    
    def fetch_mttr(self, from_date: str, to_date: str, teambook_ids: str, 
                   teambook_level: int, page: int = 1, size: int = 50) -> Dict:
        """
        Fetch Mean Time to Recovery (MTTR) metric.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            page: Page number
            size: Page size
            
        Returns:
            API response as dictionary
        """
        endpoint = f"{self.base_url}/incident/metric/mttr/by-service/teambook/metric"
        params = {
            'from': from_date,
            'to': to_date,
            'teambookIds': teambook_ids,
            'teambookLevel': teambook_level,
            'page': page,
            'size': size
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, verify=False)
            response.raise_for_status()
            result = response.json()
            return {
                'metric': 'Mean Time to Recovery (MTTR)',
                'status': 'success',
                'data': result
            }
        except requests.exceptions.RequestException as e:
            return {
                'metric': 'Mean Time to Recovery (MTTR)',
                'status': 'error',
                'error': str(e),
                'data': None
            }
    
    def fetch_cfr(self, from_date: str, to_date: str, teambook_ids: str, 
                  teambook_level: int, page: int = 1, size: int = 50) -> Dict:
        """
        Fetch Change Failure Rate (CFR) metric.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            page: Page number
            size: Page size
            
        Returns:
            API response as dictionary
        """
        endpoint = f"{self.base_url}/releases/metric/cfr/teambook/metric"
        params = {
            'from': from_date,
            'to': to_date,
            'teambookIds': teambook_ids,
            'teambookLevel': teambook_level,
            'page': page,
            'size': size
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, verify=False)
            response.raise_for_status()
            result = response.json()
            return {
                'metric': 'Change Failure Rate (CFR)',
                'status': 'success',
                'data': result
            }
        except requests.exceptions.RequestException as e:
            return {
                'metric': 'Change Failure Rate (CFR)',
                'status': 'error',
                'error': str(e),
                'data': None
            }
    
    def fetch_lttd_records(self, agg_key: str, page: int = 1, size: int = 50) -> Dict:
        """
        Fetch detailed LTTD records using aggregation key.
        
        Args:
            agg_key: Aggregation key from metric response
            page: Page number
            size: Page size
            
        Returns:
            API response as dictionary
        """
        endpoint = f"{self.base_url}/releases/metric/lttd/teambook/records"
        params = {
            'aggKey': agg_key,
            'page': page,
            'size': size
        }
        
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, verify=False)
            response.raise_for_status()
            return {
                'status': 'success',
                'data': response.json()
            }
        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'error': str(e),
                'data': None
            }
    
    def fetch_filtered_lttd_records(self, from_date: str, to_date: str, teambook_ids: str, 
                                    teambook_level: int, min_lttd_days: int = 15) -> List[Dict]:
        """
        Fetch LTTD records filtered by lttd_eligible=true and LTTD days > threshold.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            min_lttd_days: Minimum LTTD days threshold (default: 15)
            
        Returns:
            List of filtered LTTD records with additional fields
        """
        print(f"\nFetching LTTD records where lttd_eligible=true and LTTD > {min_lttd_days} days...")
        
        lttd_metrics = self.fetch_lttd(from_date, to_date, teambook_ids, teambook_level)
        
        if lttd_metrics['status'] != 'success' or not lttd_metrics.get('data'):
            print("Failed to fetch LTTD metrics")
            return []
        
        filtered_records = []
        lttd_data = lttd_metrics['data'].get('data', [])
        
        for metric_record in lttd_data:
            agg_key = metric_record.get('aggKey')
            if not agg_key:
                continue
            
            print(f"  Processing aggKey: {agg_key}")
            details_response = self.fetch_lttd_records(agg_key, size=100)
            
            if details_response['status'] != 'success' or not details_response.get('data'):
                continue
            
            records = details_response['data'].get('data', [])
            
            for record in records:
                lttd_eligible = record.get('lttd_eligible', False)
                lttd_days = record.get('lead_time_to_deploy_numeric_days')
                if lttd_days is None:
                    lttd_days = record.get('lead_time_to_deploy_days')
                
                if lttd_days is None:
                    lttd_days = 0
                
                try:
                    lttd_days = float(lttd_days)
                except (ValueError, TypeError):
                    lttd_days = 0
                
                if lttd_eligible and lttd_days > min_lttd_days:
                    filtered_records.append(record)
                    print(f"    ✓ Matched: ID={record.get('id', 'N/A')}, LTTD={lttd_days} days")
        
        print(f"  Found {len(filtered_records)} records matching criteria")
        return filtered_records
    
    def _enrich_lttd_record(self, record: Dict) -> Dict:
        """
        Enrich LTTD record with commits URL and source code diff URL.
        
        Args:
            record: Original LTTD record
            
        Returns:
            Enriched record with additional URL fields
        """
        enriched = record.copy()
        
        cr_id = record.get('cr_id', '')
        repo_link = record.get('repo_link', '')
        commit_id = record.get('commit_id', '')
        
        if repo_link and commit_id:
            if 'github' in repo_link.lower():
                enriched['commits_url'] = f"{repo_link}/commit/{commit_id}"
                enriched['source_code_diff_url'] = f"{repo_link}/commit/{commit_id}.diff"
            elif 'gitlab' in repo_link.lower():
                enriched['commits_url'] = f"{repo_link}/-/commit/{commit_id}"
                enriched['source_code_diff_url'] = f"{repo_link}/-/commit/{commit_id}.diff"
            elif 'bitbucket' in repo_link.lower():
                enriched['commits_url'] = f"{repo_link}/commits/{commit_id}"
                enriched['source_code_diff_url'] = f"{repo_link}/diff/{commit_id}"
            else:
                enriched['commits_url'] = f"{repo_link}/commit/{commit_id}" if commit_id else ''
                enriched['source_code_diff_url'] = f"{repo_link}/diff/{commit_id}" if commit_id else ''
        else:
            enriched['commits_url'] = ''
            enriched['source_code_diff_url'] = ''
        
        return enriched
    
    def fetch_all_metrics(self, from_date: str, to_date: str, teambook_ids: str, 
                         teambook_level: int, fetch_details: bool = False) -> Dict:
        """
        Fetch all DORA metrics.
        
        Args:
            from_date: Start date (format: YYYY-MM)
            to_date: End date (format: YYYY-MM)
            teambook_ids: Teambook IDs (comma-separated)
            teambook_level: Teambook level (1-5)
            fetch_details: Whether to fetch detailed records using agg keys
            
        Returns:
            Dictionary containing all metrics
        """
        print(f"\n{'='*80}")
        print(f"Fetching DORA Metrics from DataSight")
        print(f"{'='*80}")
        print(f"Period: {from_date} to {to_date}")
        print(f"Teambook IDs: {teambook_ids}")
        print(f"Teambook Level: {teambook_level}")
        print(f"{'='*80}\n")
        
        results = {
            'parameters': {
                'from_date': from_date,
                'to_date': to_date,
                'teambook_ids': teambook_ids,
                'teambook_level': teambook_level,
                'timestamp': datetime.now().isoformat()
            },
            'metrics': {}
        }
        
        print("1. Fetching Release Frequency...")
        release_freq = self.fetch_release_frequency(from_date, to_date, teambook_ids, teambook_level)
        results['metrics']['release_frequency'] = release_freq
        print(f"   Status: {release_freq['status']}")
        if release_freq['status'] == 'success' and release_freq['data']:
            print(f"   Records: {release_freq['data'].get('count', 0)}")
        
        print("\n2. Fetching Lead Time to Deploy (LTTD)...")
        lttd = self.fetch_lttd(from_date, to_date, teambook_ids, teambook_level)
        results['metrics']['lttd'] = lttd
        print(f"   Status: {lttd['status']}")
        if lttd['status'] == 'success' and lttd['data']:
            print(f"   Records: {lttd['data'].get('count', 0)}")
        
        print("\n3. Fetching Mean Time to Recovery (MTTR)...")
        mttr = self.fetch_mttr(from_date, to_date, teambook_ids, teambook_level)
        results['metrics']['mttr'] = mttr
        print(f"   Status: {mttr['status']}")
        if mttr['status'] == 'success' and mttr['data']:
            print(f"   Records: {mttr['data'].get('count', 0)}")
        
        print("\n4. Fetching Change Failure Rate (CFR)...")
        cfr = self.fetch_cfr(from_date, to_date, teambook_ids, teambook_level)
        results['metrics']['cfr'] = cfr
        print(f"   Status: {cfr['status']}")
        if cfr['status'] == 'success' and cfr['data']:
            print(f"   Records: {cfr['data'].get('count', 0)}")
        
        if fetch_details:
            print("\n5. Fetching detailed records using aggregation keys...")
            results['detailed_records'] = {}
            
            if lttd['status'] == 'success' and lttd['data'] and lttd['data'].get('data'):
                for idx, record in enumerate(lttd['data']['data']):
                    agg_key = record.get('aggKey')
                    if agg_key:
                        print(f"   Fetching details for aggKey: {agg_key}")
                        details = self.fetch_lttd_records(agg_key)
                        results['detailed_records'][agg_key] = details
        
        print(f"\n{'='*80}")
        print("All metrics fetched successfully!")
        print(f"{'='*80}\n")
        
        return results
    
    def generate_csv_report(self, data: Dict, output_file: str):
        """
        Generate a comprehensive CSV report from DORA metrics data.
        
        Args:
            data: Dictionary containing all metrics data
            output_file: Output CSV file path
        """
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['DORA METRICS REPORT'])
            writer.writerow(['Generated:', data['parameters']['timestamp']])
            writer.writerow(['Period:', f"{data['parameters']['from_date']} to {data['parameters']['to_date']}"])
            writer.writerow(['Teambook IDs:', data['parameters']['teambook_ids']])
            writer.writerow(['Teambook Level:', data['parameters']['teambook_level']])
            writer.writerow([])
            
            metrics = data['metrics']
            
            writer.writerow(['='*20 + ' RELEASE FREQUENCY ' + '='*20])
            writer.writerow([])
            if metrics['release_frequency']['status'] == 'success' and metrics['release_frequency']['data']:
                rf_data = metrics['release_frequency']['data'].get('data', [])
                if rf_data:
                    writer.writerow(['Year-Month', 'Releases', 'Software Releases %', 'PDPTPPY (Calendar)', 
                                   'PDPTPPY (Headcount)', 'Head Count', 'IT Head Count', 'Pods Count',
                                   'L1 Teambook', 'L2 Teambook', 'L3 Teambook'])
                    for record in rf_data:
                        writer.writerow([
                            record.get('yearMonth', ''),
                            record.get('releases', ''),
                            record.get('percent_software_releases', ''),
                            record.get('pdptppy_calendar_days', ''),
                            record.get('pdptppy_full_headcount_basis', ''),
                            record.get('head_count', ''),
                            record.get('it_head_count', ''),
                            record.get('pods_count', ''),
                            record.get('l1_teambook', ''),
                            record.get('l2_teambook', ''),
                            record.get('l3_teambook', '')
                        ])
            else:
                writer.writerow(['Error:', metrics['release_frequency'].get('error', 'No data')])
            writer.writerow([])
            
            writer.writerow(['='*20 + ' LEAD TIME TO DEPLOY (LTTD) ' + '='*20])
            writer.writerow([])
            if metrics['lttd']['status'] == 'success' and metrics['lttd']['data']:
                lttd_data = metrics['lttd']['data'].get('data', [])
                if lttd_data:
                    writer.writerow(['Year-Month', 'LTTD (days)', 'Highest LTTD', 'CRs with LTTD', 
                                   'Eligible CRs', 'CRs with LTTD %', 'Pods with CRs', 'Pods with LTTD',
                                   'Pods with LTTD < Week', 'Pods with LTTD < Week %',
                                   'L1 Teambook', 'L2 Teambook', 'L3 Teambook', 'Agg Key'])
                    for record in lttd_data:
                        writer.writerow([
                            record.get('yearMonth', ''),
                            record.get('lttd', ''),
                            record.get('highest_lttd', ''),
                            record.get('crs_with_lttd', ''),
                            record.get('eligible_crs', ''),
                            record.get('percent_crs_with_lttd', ''),
                            record.get('pods_with_crs', ''),
                            record.get('pods_with_lttd', ''),
                            record.get('pods_with_lttd_less_than_week', ''),
                            record.get('percent_pods_with_lttd_less_than_week', ''),
                            record.get('l1_teambook', ''),
                            record.get('l2_teambook', ''),
                            record.get('l3_teambook', ''),
                            record.get('aggKey', '')
                        ])
            else:
                writer.writerow(['Error:', metrics['lttd'].get('error', 'No data')])
            writer.writerow([])
            
            writer.writerow(['='*20 + ' MEAN TIME TO RECOVERY (MTTR) ' + '='*20])
            writer.writerow([])
            if metrics['mttr']['status'] == 'success' and metrics['mttr']['data']:
                mttr_data = metrics['mttr']['data'].get('data', [])
                if mttr_data:
                    writer.writerow(['Year-Month', 'MTTR (hours)', 'MTTR CHM (hours)', 'Incidents Count', 
                                   'Incidents Count CHM', 'Non-Incidents %',
                                   'L1 Teambook', 'L2 Teambook', 'L3 Teambook', 'Agg Key'])
                    for record in mttr_data:
                        writer.writerow([
                            record.get('yearMonth', ''),
                            record.get('mttr', ''),
                            record.get('mttr_chm', ''),
                            record.get('incidents_count', ''),
                            record.get('incidents_count_chm', ''),
                            record.get('non_incidents_percent', ''),
                            record.get('l1_teambook', ''),
                            record.get('l2_teambook', ''),
                            record.get('l3_teambook', ''),
                            record.get('aggKey', '')
                        ])
            else:
                writer.writerow(['Error:', metrics['mttr'].get('error', 'No data')])
            writer.writerow([])
            
            writer.writerow(['='*20 + ' CHANGE FAILURE RATE (CFR) ' + '='*20])
            writer.writerow([])
            if metrics['cfr']['status'] == 'success' and metrics['cfr']['data']:
                cfr_data = metrics['cfr']['data'].get('data', [])
                if cfr_data:
                    writer.writerow(['Year-Month', 'Change Failure Rate %', 'Change Causing Incident %', 
                                   'Change with Business Impact %', 'Releases', 'Change Failed',
                                   'Change Causing Incident', 'Change with Business Impact',
                                   'Pods Count', 'Pod IT HC',
                                   'L1 Teambook', 'L2 Teambook', 'L3 Teambook', 'Agg Key'])
                    for record in cfr_data:
                        writer.writerow([
                            record.get('yearMonth', ''),
                            record.get('change_failure_rate', ''),
                            record.get('percent_change_causing_incident', ''),
                            record.get('percent_change_with_business_impact', ''),
                            record.get('releases', ''),
                            record.get('change_failed', ''),
                            record.get('change_causing_incident', ''),
                            record.get('change_with_business_impact', ''),
                            record.get('num_of_pods_current_month', ''),
                            record.get('pod_it_hc_current_month', ''),
                            record.get('l1_teambook', ''),
                            record.get('l2_teambook', ''),
                            record.get('l3_teambook', ''),
                            record.get('aggKey', '')
                        ])
            else:
                writer.writerow(['Error:', metrics['cfr'].get('error', 'No data')])
            writer.writerow([])
            
            if 'detailed_records' in data and data['detailed_records']:
                writer.writerow(['='*20 + ' DETAILED LTTD RECORDS ' + '='*20])
                writer.writerow([])
                for agg_key, details in data['detailed_records'].items():
                    writer.writerow([f'Aggregation Key: {agg_key}'])
                    if details['status'] == 'success' and details['data']:
                        detail_data = details['data'].get('data', [])
                        if detail_data:
                            if detail_data:
                                first_record = detail_data[0]
                                headers = list(first_record.keys())
                                writer.writerow(headers)
                                for record in detail_data:
                                    writer.writerow([record.get(h, '') for h in headers])
                    writer.writerow([])
        
        print(f"CSV report generated: {output_file}")
    
    def save_to_json(self, data: Dict, output_file: str):
        """Save results to JSON file."""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"JSON data saved: {output_file}")
    
    def generate_filtered_lttd_csv(self, records: List[Dict], output_file: str):
        """
        Generate CSV report for filtered LTTD records (lttd_eligible=true, LTTD > 15 days).
        
        Args:
            records: List of filtered LTTD records
            output_file: Output CSV file path
        """
        if not records:
            print("No records to export")
            return
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(['HIGH LTTD RECORDS REPORT - LTTD > 15 Days (Eligible Only)'])
            writer.writerow(['Generated:', datetime.now().isoformat()])
            writer.writerow(['Total Records:', len(records)])
            writer.writerow([])
            
            headers = [
                'Month-Year',
                'Change Reference',
                'Start Date',
                'Replica Item',
                'Applicant Group',
                'Assign Group',
                'Report Group',
                'DTT (17 Pod)',
                'Requested By',
                'LTTD Days (Inc. Weekends-numeric)',
                'CR Processing Hurdle',
                'ICE CR Link',
                'CR First Commit URL',
                'Commits URL Call',
                'Source Code Diff URL',
                'CR First Commit Time',
                'Actual End Date Time',
                'Repo Link'
            ]
            writer.writerow(headers)
            
            for idx, record in enumerate(records, start=1):
                month = record.get('month', '')
                year = record.get('year', '')
                month_year = f"{month}-{year}" if month and year else ''
                
                writer.writerow([
                    month_year,
                    record.get('id', ''),
                    record.get('start_date', ''),
                    record.get('short_description', ''),
                    record.get('requested_by', ''),
                    record.get('assignment_group', ''),
                    record.get('l3_business_unit', ''),
                    record.get('l4_business_unit', ''),
                    record.get('requested_by', ''),
                    record.get('lead_time_to_deploy_numeric_days', ''),
                    record.get('cr_processing_hurdle', ''),
                    record.get('ice_cr_link', ''),
                    record.get('cr_first_commit_url', ''),
                    record.get('commits_url_call', ''),
                    record.get('source_code_diff_URL', ''),
                    record.get('cr_first_commit_time', ''),
                    record.get('actual_end_date_time', ''),
                    record.get('repo_link', '')
                ])
        
        print(f"\nFiltered LTTD CSV report generated: {output_file}")
        print(f"Total records exported: {len(records)}")


def main():
    print("="*80)
    print("DORA Metrics Fetcher - Interactive Mode")
    print("="*80)
    print()
    
    config_file = 'config.json'
    base_url = None
    bearer_token = None
    
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                base_url = config.get('base_url')
                bearer_token = config.get('bearer_token')
                print(f"✓ Loaded configuration from {config_file}")
        except Exception as e:
            print(f"⚠ Warning: Could not read config file: {e}")
    
    if not base_url:
        base_url = os.getenv('DATASIGHT_BASE_URL')
    if not bearer_token:
        bearer_token = os.getenv('DATASIGHT_BEARER_TOKEN')
    
    if not base_url:
        base_url = input("\nEnter DataSight API base URL (e.g., https://datasight.global.hsbc): ").strip()
    else:
        print(f"✓ Using base URL from config: {base_url}")
    
    if not bearer_token:
        bearer_token = input("Enter Bearer token for authentication: ").strip()
    else:
        print(f"✓ Using bearer token from config")
    
    if not base_url or not bearer_token:
        print("\n❌ Error: base_url and bearer_token are required!")
        return
    
    print("\n" + "-"*80)
    print("Enter DORA Metrics Parameters")
    print("-"*80)
    
    from_date = input("\nStart date (YYYY-MM format, e.g., 2025-09): ").strip()
    to_date = input("End date (YYYY-MM format, e.g., 2025-10): ").strip()
    teambook_ids = input("Teambook IDs (comma-separated, e.g., 5449 or 5449,5450): ").strip()
    
    while True:
        try:
            teambook_level = int(input("Teambook level (1-5): ").strip())
            if 1 <= teambook_level <= 5:
                break
            else:
                print("Please enter a number between 1 and 5")
        except ValueError:
            print("Please enter a valid number")
    
    print("\n" + "-"*80)
    print("Select Report Type")
    print("-"*80)
    print("1. Full DORA Metrics Report (all metrics)")
    print("2. Filtered LTTD Report (lttd_eligible=true, LTTD > 15 days)")
    
    report_type = input("\nSelect report type (1 or 2): ").strip()
    
    fetcher = DataSightDORAFetcher(base_url, bearer_token)
    
    if report_type == '2':
        min_lttd = input("Minimum LTTD days threshold (default: 15): ").strip()
        min_lttd_days = int(min_lttd) if min_lttd else 15
        
        output_file = input("Output CSV file path (press Enter for auto-generated name): ").strip()
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"lttd_filtered_report_{timestamp}.csv"
        
        print("\n" + "="*80)
        print("Summary of Parameters")
        print("="*80)
        print(f"Report Type: Filtered LTTD Records")
        print(f"Period: {from_date} to {to_date}")
        print(f"Teambook IDs: {teambook_ids}")
        print(f"Teambook Level: {teambook_level}")
        print(f"LTTD Threshold: > {min_lttd_days} days")
        print(f"Filter: lttd_eligible = true")
        print(f"Output CSV: {output_file}")
        print("="*80)
        
        confirm = input("\nProceed with fetching? (y/n): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("Operation cancelled.")
            return
        
        filtered_records = fetcher.fetch_filtered_lttd_records(
            from_date=from_date,
            to_date=to_date,
            teambook_ids=teambook_ids,
            teambook_level=teambook_level,
            min_lttd_days=min_lttd_days
        )
        
        fetcher.generate_filtered_lttd_csv(filtered_records, output_file)
        
    else:
        fetch_details_input = input("\nFetch detailed records using aggregation keys? (y/n, default: n): ").strip().lower()
        fetch_details = fetch_details_input in ['y', 'yes']
        
        output_file = input("Output CSV file path (press Enter for auto-generated name): ").strip()
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"dora_report_{timestamp}.csv"
        
        json_output = input("Also save raw JSON data? Enter filename or press Enter to skip: ").strip()
        
        print("\n" + "="*80)
        print("Summary of Parameters")
        print("="*80)
        print(f"Report Type: Full DORA Metrics")
        print(f"Period: {from_date} to {to_date}")
        print(f"Teambook IDs: {teambook_ids}")
        print(f"Teambook Level: {teambook_level}")
        print(f"Fetch Details: {fetch_details}")
        print(f"Output CSV: {output_file}")
        if json_output:
            print(f"Output JSON: {json_output}")
        print("="*80)
        
        confirm = input("\nProceed with fetching? (y/n): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("Operation cancelled.")
            return
        
        results = fetcher.fetch_all_metrics(
            from_date=from_date,
            to_date=to_date,
            teambook_ids=teambook_ids,
            teambook_level=teambook_level,
            fetch_details=fetch_details
        )
        
        fetcher.generate_csv_report(results, output_file)
        
        if json_output:
            fetcher.save_to_json(results, json_output)


if __name__ == '__main__':
    main()
