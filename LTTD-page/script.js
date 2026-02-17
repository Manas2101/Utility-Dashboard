// LTTD Metrics Dashboard JavaScript

class LTTDManager {
    constructor() {
        this.currentRecords = [];
        this.noLttdRecords = [];
        this.showingNoLttd = false;
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
        const toggleNoLttdBtn = document.getElementById('toggleNoLttdBtn');

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

        toggleNoLttdBtn.addEventListener('click', () => {
            this.toggleNoLttdRecords();
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
        const teambookId = '449'; // Hardcoded
        const level = '2'; // Hardcoded

        if (!fromDate || !toDate) {
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
                this.noLttdRecords = data.no_lttd_records || [];
                this.showingNoLttd = false;
                
                // Update no LTTD count and show button if there are records
                const noLttdCount = document.getElementById('noLttdCount');
                const toggleBtn = document.getElementById('toggleNoLttdBtn');
                if (this.noLttdRecords.length > 0) {
                    noLttdCount.textContent = this.noLttdRecords.length;
                    toggleBtn.style.display = 'flex';
                    toggleBtn.classList.remove('active');
                    toggleBtn.innerHTML = `<i class="fas fa-eye"></i> Show Records with No LTTD (<span id="noLttdCount">${this.noLttdRecords.length}</span>)`;
                } else {
                    toggleBtn.style.display = 'none';
                }
                
                this.renderTable(data.records, data.total_before_filter, data.filter_applied);
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

    renderTable(records, totalBeforeFilter, filterApplied) {
        const tbody = document.getElementById('lttdTableBody');
        tbody.innerHTML = '';

        if (!records || records.length === 0) {
            const message = this.showingNoLttd ? 'No records with missing LTTD found' : 'No LTTD records found matching the filter criteria';
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                        ${message}
                        ${totalBeforeFilter && !this.showingNoLttd ? `<br><small style="margin-top: 8px; display: block;">(${totalBeforeFilter} total records fetched, 0 matched filter)</small>` : ''}
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
            
            // Use business_service field for application name
            const appName = record.business_service || '';

            row.innerHTML = `
                <td>${this.escapeHtml(monthYear)}</td>
                <td>${this.escapeHtml(record.id || record.cr_id || '')}</td>
                <td>${this.formatDate(record.start_date)}</td>
                <td colspan="2">${this.escapeHtml(appName)}</td>
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

        const countText = `${records.length} record${records.length !== 1 ? 's' : ''}`;
        const filterText = totalBeforeFilter ? ` (filtered from ${totalBeforeFilter} total)` : '';
        document.getElementById('recordCount').textContent = countText + filterText;
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
            'Application Name',
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
            const appName = record.business_service || '';

            const row = [
                monthYear,
                record.id || record.cr_id || '',
                record.start_date || '',
                appName,
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

    toggleNoLttdRecords() {
        const toggleBtn = document.getElementById('toggleNoLttdBtn');
        const totalRecords = this.currentRecords.length + this.noLttdRecords.length;
        
        if (this.showingNoLttd) {
            // Switch back to filtered records
            this.showingNoLttd = false;
            this.renderTable(this.currentRecords, totalRecords, 'Filtered Records');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = `<i class="fas fa-eye"></i> Show Records with No LTTD (<span id="noLttdCount">${this.noLttdRecords.length}</span>)`;
        } else {
            // Switch to no LTTD records
            this.showingNoLttd = true;
            this.renderTable(this.noLttdRecords, totalRecords, 'Records with No LTTD');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Records with No LTTD`;
        }
    }
}

// Initialize the LTTD Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LTTDManager();
});
