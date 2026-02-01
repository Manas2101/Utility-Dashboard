// LTTD Metrics Dashboard JavaScript

class LTTDManager {
    constructor() {
        this.currentRecords = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
    }

    setupEventListeners() {
        const form = document.getElementById('lttdForm');
        const clearBtn = document.getElementById('clearBtn');
        const exportBtn = document.getElementById('exportBtn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.fetchLTTDRecords();
        });

        clearBtn.addEventListener('click', () => {
            this.clearForm();
        });

        exportBtn.addEventListener('click', () => {
            this.exportToCSV();
        });
    }

    setDefaultDates() {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        document.getElementById('fromDate').value = currentMonth;
        document.getElementById('toDate').value = currentMonth;
    }

    clearForm() {
        document.getElementById('lttdForm').reset();
        this.setDefaultDates();
        this.hideResults();
        this.hideError();
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('fetchBtn').disabled = true;
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('fetchBtn').disabled = false;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    showResults() {
        document.getElementById('resultsSection').style.display = 'block';
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    async fetchLTTDRecords() {
        this.hideError();
        this.hideResults();
        this.showLoading();

        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const teambookId = document.getElementById('teambookId').value.trim();
        const level = document.getElementById('level').value;

        if (!fromDate || !toDate || !teambookId || !level) {
            this.hideLoading();
            this.showError('Please fill in all required fields');
            return;
        }

        try {
            console.log('Fetching LTTD records with params:', { fromDate, toDate, teambookId, level });

            const response = await fetch('/api/lttd/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_date: fromDate,
                    to_date: toDate,
                    teambook_id: teambookId,
                    level: parseInt(level)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch LTTD records');
            }

            const data = await response.json();
            console.log('Received data:', data);

            if (data.status === 'success' && data.records) {
                this.currentRecords = data.records;
                this.renderTable(data.records);
                this.showResults();
            } else {
                throw new Error(data.error || 'No records found');
            }

        } catch (error) {
            console.error('Error fetching LTTD records:', error);
            this.showError(error.message || 'Failed to fetch LTTD records. Please check your parameters and try again.');
        } finally {
            this.hideLoading();
        }
    }

    renderTable(records) {
        const tbody = document.getElementById('lttdTableBody');
        tbody.innerHTML = '';

        if (!records || records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        No LTTD records found for the selected criteria
                    </td>
                </tr>
            `;
            document.getElementById('recordCount').textContent = '0 records';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            
            const month = record.month || '';
            const year = record.year || '';
            const monthYear = month && year ? `${month}-${year}` : '';

            row.innerHTML = `
                <td>${this.escapeHtml(monthYear)}</td>
                <td>${this.escapeHtml(record.id || record.cr_id || '')}</td>
                <td>${this.formatDate(record.start_date)}</td>
                <td>${this.escapeHtml(record.short_description || '')}</td>
                <td>${this.escapeHtml(record.requested_by || '')}</td>
                <td>${this.escapeHtml(record.assignment_group || '')}</td>
                <td>${this.escapeHtml(record.l3_business_unit || '')}</td>
                <td>${this.escapeHtml(record.l4_business_unit || '')}</td>
                <td>${this.escapeHtml(record.requested_by || '')}</td>
                <td><strong>${this.formatLTTD(record.lead_time_to_deploy_numeric_days)}</strong></td>
                <td>${this.escapeHtml(record.cr_processing_hurdle || '')}</td>
                <td>${this.renderLink(record.ice_cr_link, 'ICE CR')}</td>
                <td>${this.renderLink(record.cr_first_commit_url, 'Commit')}</td>
                <td>${this.renderLink(record.repo_link, 'Repo')}</td>
            `;
            
            tbody.appendChild(row);
        });

        document.getElementById('recordCount').textContent = `${records.length} record${records.length !== 1 ? 's' : ''}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    }

    formatLTTD(days) {
        if (days === null || days === undefined) return '';
        const numDays = parseFloat(days);
        if (isNaN(numDays)) return days;
        return numDays.toFixed(1) + ' days';
    }

    renderLink(url, text) {
        if (!url) return '';
        return `<a href="${this.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(text)}</a>`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportToCSV() {
        if (!this.currentRecords || this.currentRecords.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = [
            'Month-Year',
            'Change Reference',
            'Start Date',
            'Replica Item',
            'Applicant Group',
            'Assign Group',
            'Report Group',
            'DTT (L7 Pod)',
            'Requested By',
            'LTTD Days',
            'CR Processing Hurdle',
            'ICE CR Link',
            'CR First Commit URL',
            'Repo Link'
        ];

        let csvContent = headers.join(',') + '\n';

        this.currentRecords.forEach(record => {
            const month = record.month || '';
            const year = record.year || '';
            const monthYear = month && year ? `${month}-${year}` : '';

            const row = [
                monthYear,
                record.id || record.cr_id || '',
                record.start_date || '',
                record.short_description || '',
                record.requested_by || '',
                record.assignment_group || '',
                record.l3_business_unit || '',
                record.l4_business_unit || '',
                record.requested_by || '',
                record.lead_time_to_deploy_numeric_days || '',
                record.cr_processing_hurdle || '',
                record.ice_cr_link || '',
                record.cr_first_commit_url || '',
                record.repo_link || ''
            ];

            csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `lttd_records_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the LTTD Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LTTDManager();
});
