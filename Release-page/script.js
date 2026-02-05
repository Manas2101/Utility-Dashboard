class ReleaseManager {

 

    constructor() {

 

        this.releases = [];

 

        this.currentDate = new Date();

 

        this.currentViewDate = new Date();

 

        this.selectedReleaseId = null;

 

        this.editingReleaseId = null; // Track if we're editing an existing release

 

        this.dataFile = 'releases.json';

 

        this.repositories = []; // Store added repositories

 

      

 

        this.serverAvailable = false; // Track server status

 

        this.init();

 

    }

 


 

    async checkServerStatus() {

 

        try {

 

            console.log('🔍 Checking server status...');

 

            const response = await fetch('/automation/CDMS-Releases/api/releases', {

 

                method: 'GET',

 

                timeout: 3000 // 3 second timeout

 

            });

 

          

 

            if (response.ok) {

 

                this.serverAvailable = true;

 

                this.updateServerStatusUI(true);

 

                console.log('✅ Server is available');

 

            } else {

 

                throw new Error('Server responded with error');

 

            }

 

        } catch (error) {

 

            this.serverAvailable = false;

 

            this.updateServerStatusUI(false);

 

            console.log('❌ Server not available:', error.message);

 

        }

 

    }

 


 

    updateServerStatusUI(isOnline) {

 

        const serverStatus = document.getElementById('serverStatus');

 

        const statusIndicator = document.getElementById('statusIndicator');

 

        const statusText = document.getElementById('statusText');

 

        const serverMode = document.getElementById('serverMode');

 

        const fallbackMode = document.getElementById('fallbackMode');

 


 

        if (isOnline) {

 

            serverStatus.className = 'server-status online';

 

            statusIndicator.textContent = '✅';

 

            statusText.textContent = 'Server Online - Auto-sync enabled';

 

            serverMode.style.display = 'block';

 

            fallbackMode.style.display = 'none';

 

        } else {

 

            serverStatus.className = 'server-status offline';

 

            statusIndicator.textContent = '❌';

 

            statusText.textContent = 'Server Offline - Manual mode';

 

            serverMode.style.display = 'none';

 

            fallbackMode.style.display = 'block';

 

        }

 

    }

 


 

    async init() {

 

        console.log('Initializing Release Manager...');

 

        await this.checkServerStatus();

 

        await this.loadReleases();

 

        this.setupEventListeners();

 

        this.renderCalendar();

 

        this.updateStats();

 

        this.renderDashboard();

 

        this.updateCurrentMonth();

 

      

 

        // Check for release warnings

 

        this.checkReleaseWarnings();

 

      

 

        // Clear booking form on initial load

 

        this.clearBookingForm();

 

      

 

        console.log('Release Manager initialized successfully');

 

      

 

        // Debug: Test form accessibility

 

        setTimeout(() => {

 

            const form = document.getElementById('releaseForm');

 

            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

 

            console.log('Form check:', {

 

                formExists: !!form,

 

                submitButtonExists: !!submitBtn,

 

                formVisible: form ? form.offsetParent !== null : false

 

            });

 

        }, 1000);

 

    }

 


 

    setupEventListeners() {

 

        // Navigation

 

        document.querySelectorAll('.nav-btn').forEach(btn => {

 

            btn.addEventListener('click', (e) => {

 

                this.switchTab(e.target.dataset.tab);

 

            });

 

        });

 


 

        // Calendar navigation

 

        document.getElementById('prevMonth').addEventListener('click', () => {

 

            this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);

 

            this.renderCalendar();

 

            this.updateCurrentMonth();

 

        });

 


 

        document.getElementById('nextMonth').addEventListener('click', () => {

 

            this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);

 

            this.renderCalendar();

 

            this.updateCurrentMonth();

 

        });

 


 

        // Form submission

 

        const form = document.getElementById('releaseForm');

 

        if (form) {

 

            console.log('Form found, adding event listener');

 

            form.addEventListener('submit', (e) => {

 

                console.log('Form submit event triggered'); // Debug log

 

                e.preventDefault();

 

                e.stopPropagation();

 

                this.submitRelease();

 

            });

 

          

 

            // Also add a direct click handler to the submit button as backup

 

            const submitButton = form.querySelector('button[type="submit"]');

 

            if (submitButton) {

 

                console.log('Submit button found, adding click handler');

 

                submitButton.addEventListener('click', (e) => {

 

                    console.log('Submit button clicked directly');

 

                    e.preventDefault();

 

                    e.stopPropagation();

 

                    this.submitRelease();

 

                });

 

            }

 

        } else {

 

            console.error('Release form not found!');

 

        }

 


 

        // Check availability

 

        const checkAvailabilityBtn = document.getElementById('checkAvailability');

 

        if (checkAvailabilityBtn) {

 

            console.log('Check availability button found, adding event listener');

 

            checkAvailabilityBtn.addEventListener('click', (e) => {

 

                console.log('Check availability button clicked');

 

                e.preventDefault();

 

                this.checkDateAvailability();

 

            });

 

        } else {

 

            console.error('Check availability button not found!');

 

        }

 


 


 

        // Release date change

 

        document.getElementById('releaseDate').addEventListener('change', () => {

 

            this.checkDateAvailability();

 

            this.validateDryRunDate();

 

        });

 


 

        // Dry run date change

 

        document.getElementById('dryRunDate').addEventListener('change', () => {

 

            this.validateDryRunDate();

 

        });

 


 

        // Show/hide workflow sections based on release type

        (function() {

            const releaseType = document.getElementById('releaseType');

            const preReleasePrepSection = document.getElementById('step-1-details');

 

            function updateWorkflowVisibility() {

                const hide = releaseType && releaseType.value === 'Data Migration';

                if (preReleasePrepSection) {

                    preReleasePrepSection.style.display = hide ? 'none' : 'block';

                }

                // Also hide/show per-repo Pre-Release phases if they exist

                document.querySelectorAll('.workflow-phase').forEach(phase => {

                    const title = phase.querySelector('.phase-title');

                    if (title && /Pre-Release Preparation/i.test(title.textContent)) {

                        phase.style.display = hide ? 'none' : 'block';

                    }

                });

            }

 

            if (releaseType) {

                releaseType.addEventListener('change', updateWorkflowVisibility);

            }

            // Run once on init

            updateWorkflowVisibility();

        })();

 

        // Add progress tracking for workflow checkboxes

        this.setupWorkflowProgress();

 

      

 

        // Setup dynamic inputs

 

        this.setupDynamicInputs();

 


 

        // Modal controls

 

        document.getElementById('closeModal').addEventListener('click', () => {

 

            this.closeModal();

 

        });

 


 

        document.getElementById('deleteRelease').addEventListener('click', () => {

 

            console.log('Delete button clicked'); // Debug log

 

            this.deleteRelease();

 

        });

 


 

        document.getElementById('editRelease').addEventListener('click', () => {

 

            console.log('Edit button clicked'); // Debug log

 

            this.editRelease();

 

        });

 


 

        // Close modal on outside click

 

        document.getElementById('releaseModal').addEventListener('click', (e) => {

 

            if (e.target.id === 'releaseModal') {

 

                this.closeModal();

 

            }

 

        });

 


 

        // Data management buttons

 

        document.getElementById('exportData').addEventListener('click', () => {

            // Trigger download of current releases.json

            this.exportData();

        });

 

        document.getElementById('importData').addEventListener('click', () => {

            // Open file picker

            document.getElementById('fileInput').click();

        });

 

        document.getElementById('fileInput').addEventListener('change', (e) => {

            if (e.target.files && e.target.files[0]) {

                this.importData(e.target.files[0]);

            }

        });

 


 

        document.getElementById('refreshData').addEventListener('click', () => {

 

            this.refreshData();

 

        });

 


 

        // Repository management event listeners

 

        document.getElementById('addRepoBtn').addEventListener('click', () => {

 

            this.addRepository();

 

        });

 


 

        document.getElementById('newRepoName').addEventListener('keypress', (e) => {

 

            if (e.key === 'Enter') {

 

                this.addRepository();

 

            }

 

        });

 

        // Documentation checkboxes event listeners

        const docCheckboxes = ['releasePageGenerated', 'crCreated', 'crQualityCheck', 'confluenceJira', 'evidencesAttached'];

        docCheckboxes.forEach(checkboxId => {

            const checkbox = document.getElementById(checkboxId);

            if (checkbox) {

                checkbox.addEventListener('change', () => {

                    this.updateWorkflowProgress();

                });

            }

        });

 


 

    }

 


 

    switchTab(tabName) {

 

        // Update navigation

 

        document.querySelectorAll('.nav-btn').forEach(btn => {

 

            btn.classList.remove('active');

 

        });

 

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

 


 

        // Update content

 

        document.querySelectorAll('.tab-content').forEach(content => {

 

            content.classList.remove('active');

 

        });

 

        document.getElementById(`${tabName}-tab`).classList.add('active');

 


 

        // Reset edit mode when switching to booking tab (unless we're coming from editRelease)

 

        if (tabName === 'booking' && !this.editingReleaseId) {

 

            let formTitle = document.querySelector('#booking-tab .tab-header h2');

 

            if (formTitle) {

 

                formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Book New Release';

 

            }

 

            let submitButton = document.querySelector('button[type="submit"]');

 

            if (submitButton) {

 

                submitButton.innerHTML = '<i class="fas fa-save"></i> Book Release';

 

            }

 

        }

 


 

        // Render content based on tab

 

        if (tabName === 'calendar') {

 

            this.renderCalendar();

 

        } else if (tabName === 'dashboard') {

 

            this.renderDashboard();

 

        } else if (tabName === 'booking') {

 

            // Clear form when switching to booking tab (unless we're editing)

 

            if (!this.editingReleaseId) {

 

                this.clearBookingForm();

 

            }

 

            // Setup breadcrumb handlers when booking tab is shown

 

            setTimeout(() => {

 

                this.setupBreadcrumbHandlers();

 

                this.showStepDetails('1');

 

                this.updateWorkflowProgress();

 

            }, 100);

 

        }

 

    }

 


 

    updateCurrentMonth() {

 

        const monthNames = [

 

            'January', 'February', 'March', 'April', 'May', 'June',

 

            'July', 'August', 'September', 'October', 'November', 'December'

 

        ];

 

        document.getElementById('currentMonth').textContent =

 

            `${monthNames[this.currentViewDate.getMonth()]} ${this.currentViewDate.getFullYear()}`;

 

    }

 


 

    renderCalendar() {

 

        const calendar = document.getElementById('calendar');

 

        calendar.innerHTML = '';

 


 

        // Add day headers

 

        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

 

        dayHeaders.forEach(day => {

 

            const header = document.createElement('div');

 

            header.className = 'calendar-header';

 

            header.textContent = day;

 

            calendar.appendChild(header);

 

        });

 


 

        // Get first day of month and number of days

 

        const firstDay = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth(), 1);

 

        const lastDay = new Date(this.currentViewDate.getFullYear(), this.currentViewDate.getMonth() + 1, 0);

 

        const startDate = new Date(firstDay);

 

        startDate.setDate(startDate.getDate() - firstDay.getDay());

 


 

        // Render 42 days (6 weeks)

 

        for (let i = 0; i < 42; i++) {

 

            const date = new Date(startDate);

 

            date.setDate(startDate.getDate() + i);

 

          

 

            const dayElement = this.createCalendarDay(date);

 

            calendar.appendChild(dayElement);

 

        }

 

    }

 


 

    createCalendarDay(date) {

 

        const dayElement = document.createElement('div');

 

        dayElement.className = 'calendar-day';

 

      

 

        const isCurrentMonth = date.getMonth() === this.currentViewDate.getMonth();

 

        const isToday = this.isSameDay(date, this.currentDate);

 

        const dayReleases = this.getReleasesForDate(date);

 

      

 

        if (!isCurrentMonth) {

 

            dayElement.classList.add('other-month');

 

        }

 

      

 

        if (isToday) {

 

            dayElement.classList.add('today');

 

        }

 


 

        if (dayReleases.length > 0) {

 

            dayElement.classList.add('booked');

 

            if (dayReleases.length > 1) {

 

                dayElement.classList.add('conflict');

 

            }

 

        }

 


 

        const dayNumber = document.createElement('div');

 

        dayNumber.className = 'calendar-day-number';

 

        dayNumber.textContent = date.getDate();

 

        dayElement.appendChild(dayNumber);

 


 

        if (dayReleases.length > 0) {

 

            const releasesInfo = document.createElement('div');

 

            releasesInfo.className = 'calendar-day-releases';

 

          

 

            dayReleases.forEach(release => {

 

                const dot = document.createElement('span');

 

                dot.className = 'release-dot';

 

                dot.title = `${release.teamName} - ${release.appName}`;

 

                releasesInfo.appendChild(dot);

 

            });

 

          

 

            dayElement.appendChild(releasesInfo);

 

        }

 


 

        dayElement.addEventListener('click', () => {

 

            if (dayReleases.length > 0) {

 

                this.showDayReleases(date, dayReleases);

 

            }

 

        });

 


 

        return dayElement;

 

    }

 


 

    getReleasesForDate(date) {

 

        return this.releases.filter(release => {

 

            const releaseDate = new Date(release.releaseDate);

 

            return this.isSameDay(releaseDate, date);

 

        });

 

    }

 


 

    isSameDay(date1, date2) {

 

        return date1.getDate() === date2.getDate() &&

 

               date1.getMonth() === date2.getMonth() &&

 

               date1.getFullYear() === date2.getFullYear();

 

    }

 


 

    showDayReleases(date, releases) {

 

        const modal = document.getElementById('releaseModal');

 

        const modalTitle = document.getElementById('modalTitle');

 

        const modalBody = document.getElementById('modalBody');

 


 

        modalTitle.textContent = `Releases on ${date.toLocaleDateString()}`;

 

      

 

        let content = '';

 

        releases.forEach(release => {

 

            content += `

 

                <div class="release-card" onclick="releaseManager.showReleaseDetails('${release.id}')">

 

                    <div class="release-header">

 

                        <div>

 

                            <div class="release-title">${release.appName}</div>

 

                            <div class="release-team">${release.teamName}</div>

 

                        </div>

 

                        <div class="release-date ${releases.length > 1 ? 'conflict' : ''}">

 

                            ${new Date(release.releaseDate).toLocaleDateString()}

 

                        </div>

 

                    </div>

 

                    <div class="release-details">

 

                        <div class="release-detail">

 

                            <i class="fas fa-user"></i>

 

                            ${release.contactPerson}

 

                        </div>

 

                        <div class="release-detail">

 

                            <i class="fas fa-envelope"></i>

 

                            ${release.contactEmail}

 

                        </div>

 

                    </div>

 

                </div>

 

            `;

 

        });

 


 

        modalBody.innerHTML = content;

 

        modal.style.display = 'block';

 

    }

 


 

    showReleaseDetails(releaseId) {

 

        console.log('showReleaseDetails called with releaseId:', releaseId);

 

      

 

        const release = this.releases.find(r => r.id === releaseId);

 

        if (!release) {

 

            console.error('Release not found for ID:', releaseId);

 

            return;

 

        }

 


 

        this.selectedReleaseId = releaseId;

 

        console.log('selectedReleaseId set to:', this.selectedReleaseId);

 

        const modal = document.getElementById('releaseModal');

 

        const modalTitle = document.getElementById('modalTitle');

 

        const modalBody = document.getElementById('modalBody');

 


 

        modalTitle.textContent = `${release.appName} - Release Details`;

 

      

 

        const checklistItems = [

 

            // Step 1: Pre-Release Preparation

 

            { key: 'pomVersionIncremented', label: 'Pom version incremented', step: 1 },

 

            { key: 'iadpContractVersionCheck', label: 'IADP contract version check', step: 1 },

 

            { key: 'releaseVersionInline', label: 'Release/* version inline → created by Release Manager', step: 1 },

 

            { key: 'apixInventoryUpdated', label: 'APIX inventory updated (if required)', step: 1 },

 

            // Step 2: Testing & Validation

 

            { key: 'signOffCertReleaseManager', label: 'Sign off on CERT (Pre-prod) - by Release Manager', step: 2 },

 

            { key: 'signOffCertTestManager', label: 'Sign off on CERT (Pre-prod) - by Test Manager', step: 2 },

 

            { key: 'purlPreparedFromCert', label: 'PURL prepared from CERT', step: 2 },

 

            { key: 'crQualityCheck', label: 'CR quality (ICE and LTTD)', step: 2 },

 

            // Step 3: Documentation & Communication

 

            { key: 'componentsReposImpacted', label: 'Components/Repos impacted', step: 3 },

 

            { key: 'releasePageGenerated', label: 'Release Page Generated', step: 3 },

 

            { key: 'crCreated', label: 'CR created', step: 3 },

 

            { key: 'confluenceJira', label: 'Confluence/JIRA Documentation', step: 3 },

 

            { key: 'evidencesAttached', label: 'All Evidences Attached to JIRA', step: 3 }

 

        ];

 


 

        let checklistHtml = '';

 

      

 

        // Group items by step

 

        const stepGroups = {

 

            1: { title: 'Pre-Release Preparation', items: [] },

 

            2: { title: 'Testing & Validation', items: [] },

 

            3: { title: 'Documentation & Communication', items: [] }

 

        };

 

      

 

        checklistItems.forEach(item => {

 

            stepGroups[item.step].items.push(item);

 

        });

 

      

 

        // Generate HTML for each step

 

        Object.keys(stepGroups).forEach(stepNum => {

 

            const step = stepGroups[stepNum];

 

            checklistHtml += `

 

                <div class="modal-step">

 

                    <h4><span class="step-number">${stepNum}</span> ${step.title}</h4>

 

                    <div class="modal-step-items">

 

            `;

 

          

 

            step.items.forEach(item => {

 

                const isCompleted = release.checklist && release.checklist[item.key];

 

                let valueHtml = '';

 

              

 

                // Show dynamic input values if they exist

 

                if (isCompleted && release.checklist) {

 

                    if (release.checklist[`${item.key}_value`]) {

 

                        valueHtml = `<div class="item-value">${release.checklist[`${item.key}_value`]}</div>`;

 

                    } else if (release.checklist[`${item.key}_values`]) {

 

                        const values = release.checklist[`${item.key}_values`];

 

                        valueHtml = `<div class="item-value">${values.join(', ')}</div>`;

 

                    } else if (release.checklist[`${item.key}_repos`]) {

 

                        const repos = release.checklist[`${item.key}_repos`];

 

                        valueHtml = `<div class="item-value">Repos: ${repos.join(', ')}</div>`;

 

                    }

 

                }

 

              

 

                checklistHtml += `

 

                    <div class="checklist-item ${isCompleted ? 'completed' : ''}">

 

                        <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>

 

                        <div class="item-content">

 

                            <div class="item-label">${item.label}</div>

 

                            ${valueHtml}

 

                        </div>

 

                    </div>

 

                `;

 

            });

 

          

 

            checklistHtml += `

 

                    </div>

 

                </div>

 

            `;

 

        });

 


 

        modalBody.innerHTML = `

 

            <div class="detail-grid">

 

                <div class="detail-item">

 

                    <div class="detail-label">Team Name:</div>

 

                    <div class="detail-value">${release.teamName}</div>

 

                </div>

 

                <div class="detail-item">

 

                    <div class="detail-label">Application:</div>

 

                    <div class="detail-value">${release.appName}</div>

 

                </div>

 

                <div class="detail-item">

 

                    <div class="detail-label">Release Date:</div>

 

                    <div class="detail-value">${new Date(release.releaseDate).toLocaleDateString()}</div>

 

                </div>

 

                <div class="detail-item">

 

                    <div class="detail-label">Dry Run Date:</div>

 

                    <div class="detail-value">${new Date(release.dryRunDate).toLocaleDateString()}</div>

 

                </div>

 

                <div class="detail-item">

 

                    <div class="detail-label">Contact Person:</div>

 

                    <div class="detail-value">${release.contactPerson}</div>

 

                </div>

 

                <div class="detail-item">

 

                    <div class="detail-label">Contact Email:</div>

 

                    <div class="detail-value">${release.contactEmail}</div>

 

                </div>

 

                ${release.additionalNotes ? `

 

                <div class="detail-item">

 

                    <div class="detail-label">Additional Notes:</div>

 

                    <div class="detail-value">${release.additionalNotes}</div>

 

                </div>

 

                ` : ''}

 

            </div>

 

            <h4 style="margin: 20px 0 10px 0;">Release Readiness Checklist:</h4>

 

            <div class="checklist-status">

 

                ${checklistHtml}

 

            </div>

 

        `;

 


 

        modal.style.display = 'block';

 

    }

 


 

    closeModal() {

 

        document.getElementById('releaseModal').style.display = 'none';

 

        this.selectedReleaseId = null;

 

    }

 


 

    deleteRelease() {

 

        console.log('deleteRelease called, selectedReleaseId:', this.selectedReleaseId);

 

      

 

        if (!this.selectedReleaseId) {

 

            alert('No release selected for deletion.');

 

            return;

 

        }

 

      

 

        const release = this.releases.find(r => r.id === this.selectedReleaseId);

 

        if (!release) {

 

            alert('Release not found.');

 

            return;

 

        }

 

      

 

        if (confirm(`Are you sure you want to delete the release for "${release.appName}" (${release.teamName})?`)) {

 

            this.releases = this.releases.filter(r => r.id !== this.selectedReleaseId);

 

            this.saveReleases();

 

            this.closeModal();

 

            this.renderCalendar();

 

            this.renderDashboard();

 

            this.updateStats();

 

            alert('Release deleted successfully!');

 

        }

 

    }

 


 

    editRelease() {

 

        console.log('editRelease called, selectedReleaseId:', this.selectedReleaseId);

 

      

 

        if (!this.selectedReleaseId) {

 

            alert('No release selected for editing.');

 

            return;

 

        }

 

      

 

        const release = this.releases.find(r => r.id === this.selectedReleaseId);

 

        if (!release) {

 

            alert('Release not found.');

 

            return;

 

        }

 

      

 

        // Set editing mode with the release ID

 

        this.editingReleaseId = this.selectedReleaseId;

 

      

 

        // Close modal and switch to booking tab

 

        this.closeModal();

 

        this.switchTab('booking');

 

      

 

        // Populate form with existing data

 

        this.populateFormForEdit(release);

 

    }

 


 

    populateFormForEdit(release) {

 

        // Update form title and button to indicate edit mode

 

        let formTitle = document.querySelector('#booking-tab .tab-header h2');

 

        if (formTitle) {

 

            formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Release';

 

        }

 

        let submitButton = document.querySelector('button[type="submit"]');

 

        if (submitButton) {

 

            submitButton.innerHTML = '<i class="fas fa-save"></i> Update Release';

 

        }

 

      

 

        // Fill basic form fields

 

        document.getElementById('teamName').value = release.teamName || '';

 

        document.getElementById('appName').value = release.appName || '';

 

        document.getElementById('releaseDate').value = release.releaseDate || '';

 

        document.getElementById('dryRunDate').value = release.dryRunDate || '';

 

        document.getElementById('contactPerson').value = release.contactPerson || '';

 

        document.getElementById('contactEmail').value = release.contactEmail || '';

 

        document.getElementById('additionalNotes').value = release.additionalNotes || '';

 

      

 

        // Populate checklist items

 

        if (release.checklist) {

 

            Object.keys(release.checklist).forEach(key => {

 

                if (key.endsWith('_value') || key.endsWith('_values') || key.endsWith('_repos')) {

 

                    return; // Skip value fields, handle them separately

 

                }

 

              

 

                const checkbox = document.getElementById(key);

 

                if (checkbox) {

 

                    checkbox.checked = release.checklist[key];

 

                  

 

                    // Trigger change event to show/hide dynamic inputs

 

                    checkbox.dispatchEvent(new Event('change'));

 

                  

 

                    // Populate dynamic input values

 

                    setTimeout(() => {

 

                        const inputContainer = document.getElementById(`${key}-input`);

 

                        if (inputContainer && checkbox.checked) {

 

                            const inputs = inputContainer.querySelectorAll('.detail-input');

 

                          

 

                            if (key === 'componentsReposImpacted' && release.checklist[`${key}_repos`]) {

 

                                // Handle multiple repo inputs

 

                                const repos = release.checklist[`${key}_repos`];

 

                                repos.forEach((repo, index) => {

 

                                    if (index === 0 && inputs[0]) {

 

                                        inputs[0].value = repo;

 

                                    } else {

 

                                        // Add additional inputs

 

                                        addRepoInput();

 

                                        const newInputs = inputContainer.querySelectorAll('.detail-input');

 

                                        if (newInputs[index]) {

 

                                            newInputs[index].value = repo;

 

                                        }

 

                                    }

 

                                });

 

                            } else if (release.checklist[`${key}_values`]) {

 

                                // Handle multiple values (like JIRA + Confluence)

 

                                const values = release.checklist[`${key}_values`];

 

                                values.forEach((value, index) => {

 

                                    if (inputs[index]) {

 

                                        inputs[index].value = value;

 

                                    }

 

                                });

 

                            } else if (release.checklist[`${key}_value`] && inputs[0]) {

 

                                // Handle single value

 

                                inputs[0].value = release.checklist[`${key}_value`];

 

                            }

 

                        }

 

                    }, 500);

 

                }

 

            });

 

        }

 

      

 

        // Update progress display

 

        setTimeout(() => {

 

            this.updateWorkflowProgress();

 

        }, 600);

 

    }

 


 

    clearBookingForm() {

 

        console.log('Clearing booking form');

 

      

 

        // Clear all form fields

 

        document.getElementById('teamName').value = '';

 

        document.getElementById('appName').value = '';

 

        document.getElementById('releaseDate').value = '';

 

        document.getElementById('dryRunDate').value = '';

 

        document.getElementById('contactPerson').value = '';

 

        document.getElementById('contactEmail').value = '';

 

        document.getElementById('additionalNotes').value = '';

 

      

 

        // Clear all checkboxes and hide dynamic inputs

 

        const allCheckboxes = [

 

            'pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated',

 

            'signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck',

 

            'componentsReposImpacted', 'releasePageGenerated', 'crCreated', 'confluenceJira', 'evidencesAttached'

 

        ];

 

      

 

        allCheckboxes.forEach(checkboxId => {

 

            const checkbox = document.getElementById(checkboxId);

 

            if (checkbox) {

 

                checkbox.checked = false;

 

              

 

                // Hide and clear dynamic inputs

 

                const inputContainer = document.getElementById(`${checkboxId}-input`);

 

                if (inputContainer) {

 

                    inputContainer.style.display = 'none';

 

                    const inputs = inputContainer.querySelectorAll('.detail-input');

 

                    inputs.forEach(input => input.value = '');

 

                  

 

                    // Reset repository inputs to single input

 

                    if (checkboxId === 'componentsReposImpacted') {

 

                        const repoInputs = document.getElementById('repoInputs');

 

                        if (repoInputs) {

 

                            repoInputs.innerHTML = `

 

                                <div class="input-row">

 

                                    <input type="text" placeholder="Enter component/repo name" class="detail-input">

 

                                    <button type="button" class="add-repo-btn" onclick="addRepoInput()">+</button>

 

                                </div>

 

                            `;

 

                        }

 

                    }

 

                }

 

            }

 

        });

 

      

 

        // Hide conflict warning

 

        document.getElementById('conflictWarning').style.display = 'none';

 

      

 

        // Reset progress display

 

        this.updateWorkflowProgress();

 

      

 

        // Reset form title to new release mode

 

        const formTitle = document.querySelector('#booking-tab .tab-header h2');

 

        if (formTitle) {

 

            formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Book New Release';

 

        }

 

      

 

        // Reset button text to "Book Release"

 

        const submitButton = document.querySelector('button[type="submit"]');

 

        if (submitButton) {

 

            submitButton.innerHTML = '<i class="fas fa-save"></i> Book Release';

 

        }

 

      

 

        // Clear editing state

 

        this.editingReleaseId = null;

 

      

 

        console.log('Booking form cleared');

 

    }

 


 

    setupWorkflowProgress() {

 

        const checkboxes = [

 

            // Step 1: Pre-Release Preparation

 

            'pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated',

 

            // Step 2: Testing & Validation

 

            'signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck',

 

            // Step 3: Documentation & Communication

 

            'componentsReposImpacted', 'releasePageGenerated', 'crCreated', 'confluenceJira', 'evidencesAttached'

 

        ];

 


 

        checkboxes.forEach(checkboxId => {

 

            const checkbox = document.getElementById(checkboxId);

 

            if (checkbox) {

 

                checkbox.addEventListener('change', () => {

 

                    this.updateWorkflowProgress();

 

                });

 

            }

 

        });

 


 

        // Add progress tracking for workflow checkboxes

 

        document.querySelectorAll('.workflow-step input[type="checkbox"]').forEach(checkbox => {

 

            checkbox.addEventListener('change', () => {

 

                this.updateWorkflowProgress();

 

            });

 

        });

 


 

        // Add breadcrumb step click handlers

 

        this.setupBreadcrumbHandlers();

 


 

        // Show first step by default

 

        setTimeout(() => {

 

            this.showStepDetails('1');

 

        }, 100);

 


 

        // Initial progress update

 

        this.updateWorkflowProgress();

 

    }

 


 

    setupBreadcrumbHandlers() {

 

        console.log('Setting up breadcrumb handlers...');

 

      

 

        // Simple direct event listeners on button elements

 

        const step1 = document.getElementById('breadcrumb-1');

 

        const step2 = document.getElementById('breadcrumb-2');

 

        const step3 = document.getElementById('breadcrumb-3');

 


 

        if (step1) {

 

            step1.onclick = () => {

 

                console.log('Step 1 clicked');

 

                this.showStepDetails('1');

 

            };

 

        }

 


 

        if (step2) {

 

            step2.onclick = () => {

 

                console.log('Step 2 clicked');

 

                this.showStepDetails('2');

 

            };

 

        }

 


 

        if (step3) {

 

            step3.onclick = () => {

 

                console.log('Step 3 clicked');

 

                this.showStepDetails('3');

 

            };

 

        }

 

        console.log('Breadcrumb handlers set up:', { step1, step2, step3 });

 

    }

 


 

    updateWorkflowProgress() {

 

        // Count repository workflow progress

 

        let totalRepoItems = 0;

 

        let completedRepoItems = 0;

 

      

 

        this.repositories.forEach(repo => {

 

            const preReleaseCompleted = Object.values(repo.preReleaseData).filter(Boolean).length;

 

            const testingCompleted = Object.values(repo.testingData).filter(Boolean).length;

 

            completedRepoItems += preReleaseCompleted + testingCompleted;

 

            totalRepoItems += 7; // 4 pre-release + 3 testing items per repo

 

        });

 

      

 

        // Count documentation progress

 

        const docCheckboxes = ['releasePageGenerated', 'crCreated', 'crQualityCheck', 'confluenceJira', 'evidencesAttached'];

 

        const completedDocItems = docCheckboxes.filter(checkboxId => {

 

            const checkbox = document.getElementById(checkboxId);

 

            return checkbox && checkbox.checked;

 

        }).length;

 

      

 

        const totalItems = totalRepoItems + docCheckboxes.length;

 

        const completedItems = completedRepoItems + completedDocItems;

 

        const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

 

      

 

        // Update overall progress

 

        const progressFill = document.getElementById('progressFill');

 

        const progressText = document.getElementById('progressText');

 

      

 

        if (progressFill) {

 

            progressFill.style.width = `${progressPercentage}%`;

 

        }

 

      

 

        if (progressText) {

 

            progressText.textContent = `${progressPercentage}% Complete`;

 

        }

 


 

        // Update step counters

 

        this.updateStepCounters(completedDocItems);

 

    }

 

    updateStepCounters(completedDocItems) {

 

        // Update repository workflows counter

 

        const step1Count = document.getElementById('step1-count');

 

        if (step1Count) {

 

            step1Count.textContent = `${this.repositories.length} repos`;

 

        }

 

        // Update documentation counter

 

        const step2Count = document.getElementById('step2-count');

 

        if (step2Count) {

 

            step2Count.textContent = `${completedDocItems}/5`;

 

        }

 

        // Update breadcrumb visual status

 

        this.updateBreadcrumbStatus(completedDocItems);

 

    }

 

    updateBreadcrumbStatus(completedDocItems) {

 

        const breadcrumb1 = document.getElementById('breadcrumb-1');

 

        const breadcrumb2 = document.getElementById('breadcrumb-2');

 

        if (breadcrumb1) {

 

            // Calculate repo completion

 

            let totalRepoProgress = 0;

 

            let repoPercentage = 0;

 

            if (this.repositories.length > 0) {

 

                this.repositories.forEach(repo => {

 

                    const preReleaseCompleted = Object.values(repo.preReleaseData).filter(Boolean).length;

 

                    const testingCompleted = Object.values(repo.testingData).filter(Boolean).length;

 

                    totalRepoProgress += (preReleaseCompleted + testingCompleted) / 7;

 

                });

 

                const avgRepoProgress = totalRepoProgress / this.repositories.length;

 

                repoPercentage = Math.round(avgRepoProgress * 100);

 

                // Update visual progress

 

                const circle1 = breadcrumb1.querySelector('.breadcrumb-circle');

 

                if (circle1) {

 

                    const degrees = (repoPercentage / 100) * 360;

 

                    const color = repoPercentage === 100 ? '#28a745' : '#ffc107';

 

                    circle1.style.setProperty('--progress-degrees', `${degrees}deg`);

 

                    circle1.style.background = `conic-gradient(${color} 0deg ${degrees}deg, rgba(255,255,255,0.05) ${degrees}deg 360deg)`;

 

                }

 

                if (avgRepoProgress === 1) {

 

                    breadcrumb1.classList.add('completed');

 

                    breadcrumb1.classList.remove('in-progress');

 

                } else if (avgRepoProgress > 0) {

 

                    breadcrumb1.classList.add('in-progress');

 

                    breadcrumb1.classList.remove('completed');

 

                } else {

 

                    breadcrumb1.classList.remove('completed', 'in-progress');

 

                }

 

            }

 

        }

 

        if (breadcrumb2) {

 

            const docPercentage = Math.round((completedDocItems / 5) * 100);

 

            const circle2 = breadcrumb2.querySelector('.breadcrumb-circle');

 

            if (circle2) {

 

                const degrees = (docPercentage / 100) * 360;

 

                const color = docPercentage === 100 ? '#28a745' : '#ffc107';

 

                circle2.style.setProperty('--progress-degrees', `${degrees}deg`);

 

                circle2.style.background = `conic-gradient(${color} 0deg ${degrees}deg, rgba(255,255,255,0.05) ${degrees}deg 360deg)`;

 

            }

 

            if (completedDocItems === 5) {

 

                breadcrumb2.classList.add('completed');

 

                breadcrumb2.classList.remove('in-progress');

 

            } else if (completedDocItems > 0) {

 

                breadcrumb2.classList.add('in-progress');

 

                breadcrumb2.classList.remove('completed');

 

            } else {

 

                breadcrumb2.classList.remove('completed', 'in-progress');

 

            }

 

        }

 

    }

 

    showStepDetails(stepNumber) {

 

        console.log('Showing step details for:', stepNumber);

 

      

 

        // Hide all step details

 

        document.querySelectorAll('.workflow-details .workflow-step').forEach(step => {

 

            step.classList.remove('active');

 

            step.style.display = 'none';

 

        });

 


 

        // Show selected step details

 

        const stepDetails = document.getElementById(`step-${stepNumber}-details`);

 

        console.log('Step details element:', stepDetails);

 

      

 

        if (stepDetails) {

 

            stepDetails.classList.add('active');

 

            stepDetails.style.display = 'block';

 

            console.log('Step details shown');

 

        } else {

 

            console.error('Step details not found for step:', stepNumber);

 

        }

 


 

        // Update breadcrumb active state

 

        document.querySelectorAll('.breadcrumb-step').forEach(step => {

 

            step.classList.remove('active');

 

            step.style.transform = '';

 

            step.style.background = '';

 

        });

 

      

 

        const activeStep = document.querySelector(`[data-step="${stepNumber}"]`);

 

        console.log('Active step element:', activeStep);

 

      

 

        if (activeStep) {

 

            activeStep.classList.add('active');

 

            activeStep.style.transform = 'translateY(-2px)';

 

            activeStep.style.background = '#f8f9fa';

 

            console.log('Active step updated');

 

        } else {

 

            console.error('Active step not found for step:', stepNumber);

 

        }

 

    }

 


 

    updateBreadcrumbProgress() {

 

        const steps = [

 

            {

 

                stepNumber: 1,

 

                checkboxes: ['pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated']

 

            },

 

            {

 

                stepNumber: 2,

 

                checkboxes: ['signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck']

 

            },

 

            {

 

                stepNumber: 3,

 

                checkboxes: ['componentsReposImpacted', 'releasePageGenerated', 'evidencesAttached']

 

            }

 

        ];

 


 

        steps.forEach(step => {

 

            const completedCount = step.checkboxes.filter(id => {

 

                const checkbox = document.getElementById(id);

 

                return checkbox && checkbox.checked;

 

            }).length;

 


 

            const totalCount = step.checkboxes.length;

 

            const stepElement = document.querySelector(`[data-step="${step.stepNumber}"]`);

 

            const countElement = document.getElementById(`step${step.stepNumber}-count`);

 

            const connectorElement = stepElement?.nextElementSibling;

 


 

            // Update count display

 

            if (countElement) {

 

                countElement.textContent = `${completedCount}/${totalCount}`;

 

            }

 


 

            // Update step status

 

            if (stepElement) {

 

                stepElement.classList.remove('completed', 'in-progress');

 

              

 

                if (completedCount === totalCount) {

 

                    stepElement.classList.add('completed');

 

                    if (connectorElement && connectorElement.classList.contains('breadcrumb-connector')) {

 

                        connectorElement.classList.add('completed');

 

                    }

 

                } else if (completedCount > 0) {

 

                    stepElement.classList.add('in-progress');

 

                }

 

            }

 

        });

 

    }

 


 

    updateStepStatus() {

 

        const steps = [

 

            {

 

                stepNumber: 1,

 

                checkboxes: ['pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated']

 

            },

 

            {

 

                stepNumber: 2,

 

                checkboxes: ['signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck']

 

            },

 

            {

 

                stepNumber: 3,

 

                checkboxes: ['componentsReposImpacted', 'releasePageGenerated', 'crCreated', 'confluenceJira', 'evidencesAttached']

 

            }

 

        ];

 


 

        steps.forEach(step => {

 

            const completedInStep = step.checkboxes.filter(checkboxId => {

 

                const checkbox = document.getElementById(checkboxId);

 

                return checkbox && checkbox.checked;

 

            }).length;

 


 

            const stepElement = document.querySelector(`.workflow-step:nth-child(${step.stepNumber})`);

 

            if (stepElement) {

 

                if (completedInStep === step.checkboxes.length) {

 

                    stepElement.style.borderLeftColor = '#28a745';

 

                    stepElement.querySelector('.step-number').style.background = '#28a745';

 

                } else if (completedInStep > 0) {

 

                    stepElement.style.borderLeftColor = '#ffc107';

 

                    stepElement.querySelector('.step-number').style.background = '#ffc107';

 

                } else {

 

                    stepElement.style.borderLeftColor = '#667eea';

 

                    stepElement.querySelector('.step-number').style.background = 'linear-gradient(135deg, #667eea, #764ba2)';

 

                }

 

            }

 

        });

 

    }

 


 

    setupDynamicInputs() {

 

        // Checkboxes that should show input fields when checked

 

        const checkboxesWithInputs = [

 

            'pomVersionIncremented',

 

            'iadpContractVersionCheck',

 

            'releaseVersionInline',

 

            'purlPreparedFromCert',

 

            'componentsReposImpacted',

 

            'releasePageGenerated',

 

            'crCreated',

 

            'confluenceJira'

 

        ];

 


 

        checkboxesWithInputs.forEach(checkboxId => {

 

            const checkbox = document.getElementById(checkboxId);

 

            const inputContainer = document.getElementById(`${checkboxId}-input`);

 

          

 

            if (checkbox && inputContainer) {

 

                checkbox.addEventListener('change', () => {

 

                    if (checkbox.checked) {

 

                        inputContainer.style.display = 'block';

 

                        // Focus on the first input in the container

 

                        const firstInput = inputContainer.querySelector('.detail-input');

 

                        if (firstInput) {

 

                            setTimeout(() => firstInput.focus(), 300);

 

                        }

 

                    } else {

 

                        inputContainer.style.display = 'none';

 

                        // Clear input values when unchecked

 

                        const inputs = inputContainer.querySelectorAll('.detail-input');

 

                        inputs.forEach(input => input.value = '');

 

                    }

 

                });

 

            }

 

        });

 

    }

 


 

    validateDryRunDate() {

 

        const releaseDateInput = document.getElementById('releaseDate');

 

        const dryRunDateInput = document.getElementById('dryRunDate');

 

      

 

        if (!releaseDateInput.value || !dryRunDateInput.value) {

 

            // Reset styling if either date is missing

 

            dryRunDateInput.style.borderColor = '';

 

            dryRunDateInput.title = '';

 

            return true; // Return true to not block submission when dates are empty

 

        }

 

      

 

        const releaseDate = new Date(releaseDateInput.value);

 

        const dryRunDate = new Date(dryRunDateInput.value);

 

        const today = new Date();

 

        today.setHours(0, 0, 0, 0);

 

      

 

        // Set time to 0 for accurate date comparison

 

        releaseDate.setHours(0, 0, 0, 0);

 

        dryRunDate.setHours(0, 0, 0, 0);

 

      

 

        console.log('Date validation:', {

 

            releaseDate: releaseDate.toDateString(),

 

            dryRunDate: dryRunDate.toDateString(),

 

            today: today.toDateString(),

 

            dryRunBeforeRelease: dryRunDate < releaseDate,

 

            pastDryRunAllowed: true

 

        });

 

      

 

        // Check if dry run date is before release date

 

        if (dryRunDate >= releaseDate) {

 

            dryRunDateInput.style.borderColor = '#dc3545';

 

            dryRunDateInput.title = 'Dry run date must be before the release date';

 

            console.log('Validation failed: Dry run date is not before release date');

 

            return false;

 

        }

 

      

 

        // Past dry run dates are acceptable (dry runs are often completed before release)

 

        // No validation needed for past dates

 

      

 

        // Valid date

 

        dryRunDateInput.style.borderColor = '#28a745';

 

        dryRunDateInput.title = 'Valid dry run date';

 

        console.log('Validation passed: Dry run date is valid');

 

        return true;

 

    }

 


 

    checkDateAvailability() {

 

        console.log('checkDateAvailability called');

 

        const releaseDateInput = document.getElementById('releaseDate');

 

        const conflictWarning = document.getElementById('conflictWarning');

 

      

 

        if (!releaseDateInput) {

 

            console.error('Release date input not found!');

 

            return;

 

        }

 

      

 

        if (!conflictWarning) {

 

            console.error('Conflict warning element not found!');

 

            return;

 

        }

 

      

 

        console.log('Release date value:', releaseDateInput.value);

 

      

 

        if (!releaseDateInput.value) {

 

            console.log('No date selected, hiding conflict warning');

 

            conflictWarning.style.display = 'none';

 

            return;

 

        }

 


 

        const selectedDate = new Date(releaseDateInput.value);

 

        const conflictingReleases = this.getReleasesForDate(selectedDate);

 

      

 

        console.log('Selected date:', selectedDate);

 

        console.log('Total releases in system:', this.releases.length);

 

        console.log('Conflicting releases found:', conflictingReleases.length);

 

      

 

        if (conflictingReleases.length > 0) {

 

            console.log('Showing conflict warning');

 

            const conflictMessage = document.getElementById('conflictMessage');

 

            const suggestedDates = document.getElementById('suggestedDates');

 

          

 

            conflictMessage.textContent = `${conflictingReleases.length} release(s) already scheduled for this date: ${conflictingReleases.map(r => `${r.teamName} (${r.appName})`).join(', ')}`;

 

          

 

            // Suggest alternative dates

 

            const alternatives = this.suggestAlternativeDates(selectedDate);

 

            suggestedDates.innerHTML = '';

 

          

 

            alternatives.forEach(date => {

 

                const dateBtn = document.createElement('button');

 

                dateBtn.className = 'suggested-date';

 

                dateBtn.textContent = date.toLocaleDateString();

 

                dateBtn.addEventListener('click', () => {

 

                    releaseDateInput.value = date.toISOString().split('T')[0];

 

                    conflictWarning.style.display = 'none';

 

                });

 

                suggestedDates.appendChild(dateBtn);

 

            });

 

          

 

            conflictWarning.style.display = 'flex';

 

        } else {

 

            console.log('No conflicts found, hiding conflict warning');

 

            conflictWarning.style.display = 'none';

 

            // Show a success message

 

            alert('✅ Date is available! No conflicts found.\n\nThis date is clear for your release.');

 

        }

 

    }

 


 

    suggestAlternativeDates(originalDate) {

 

        const alternatives = [];

 

        const checkDate = new Date(originalDate);

 

      

 

        // Check 7 days before and after

 

        for (let i = -7; i <= 7; i++) {

 

            if (i === 0) continue; // Skip the original date

 

          

 

            const testDate = new Date(originalDate);

 

            testDate.setDate(originalDate.getDate() + i);

 

          

 

            // Skip weekends

 

            if (testDate.getDay() === 0 || testDate.getDay() === 6) continue;

 

          

 

            // Skip dates in the past

 

            if (testDate < this.currentDate) continue;

 

          

 

            // Check if date is available

 

            if (this.getReleasesForDate(testDate).length === 0) {

 

                alternatives.push(testDate);

 

            }

 

          

 

            if (alternatives.length >= 5) break;

 

        }

 

      

 

        return alternatives;

 

    }

 


 

    async submitRelease() {

 

        console.log('submitRelease called'); // Debug log

 

      

 

        // Prevent double submission

 

        if (this.isSubmitting) {

 

            console.log('Already submitting, ignoring duplicate call');

 

            return;

 

        }

 

        this.isSubmitting = true;

 

      

 

        try {

 

            const checkboxes = [

 

                // Step 1: Pre-Release Preparation

 

                'pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated',

 

                // Step 2: Testing & Validation

 

                'signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck',

 

                // Step 3: Documentation & Communication

 

                'componentsReposImpacted', 'releasePageGenerated', 'crCreated', 'confluenceJira', 'evidencesAttached'

 

            ];

 

          

 

            // Validate required fields first

 

            const requiredFields = ['teamName', 'appName', 'releaseDate', 'dryRunDate', 'contactPerson', 'contactEmail'];

 

            for (let field of requiredFields) {

 

                const element = document.getElementById(field);

 

                if (!element || !element.value.trim()) {

 

                    alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);

 

                    return;

 

                }

 

            }

 

          

 

            const release = {

 

                id: this.editingReleaseId || Date.now().toString(),

 

                teamName: document.getElementById('teamName').value.trim(),

 

                appName: document.getElementById('appName').value.trim(),

 

                releaseDate: document.getElementById('releaseDate').value,

 

                dryRunDate: document.getElementById('dryRunDate').value,

 

                contactPerson: document.getElementById('contactPerson').value.trim(),

 

                contactEmail: document.getElementById('contactEmail').value.trim(),

 

                additionalNotes: document.getElementById('additionalNotes').value.trim(),

 

                checklist: {},

 

                createdAt: this.editingReleaseId ? (this.releases.find(r => r.id === this.editingReleaseId)?.createdAt || new Date().toISOString()) : new Date().toISOString()

 

            };

 


 

            // Collect checklist data and validate dynamic input values

 

            const checkboxesWithInputs = [

 

                'pomVersionIncremented',

 

                'iadpContractVersionCheck',

 

                'releaseVersionInline',

 

                'purlPreparedFromCert',

 

                'componentsReposImpacted',

 

                'releasePageGenerated',

 

                'crCreated',

 

                'confluenceJira'

 

            ];

 

          

 

            checkboxes.forEach(checkbox => {

 

                const element = document.getElementById(checkbox);

 

                release.checklist[checkbox] = element ? element.checked : false;

 

              

 

                // Validate and collect dynamic input values if checkbox is checked

 

                if (element && element.checked && checkboxesWithInputs.includes(checkbox)) {

 

                    const inputContainer = document.getElementById(`${checkbox}-input`);

 

                    if (inputContainer) {

 

                        const inputs = inputContainer.querySelectorAll('.detail-input');

 

                      

 

                        // Validate that required inputs are not empty

 

                        let hasEmptyInputs = false;

 

                        let emptyInputMessage = '';

 

                      

 

                        if (checkbox === 'componentsReposImpacted') {

 

                            // Special handling for repository inputs

 

                            const repoInputs = Array.from(inputs);

 

                            const repos = repoInputs.map(input => input.value.trim()).filter(val => val);

 

                          

 

                            if (repos.length === 0) {

 

                                hasEmptyInputs = true;

 

                                emptyInputMessage = 'Please enter at least one component/repository name.';

 

                            } else {

 

                                release.checklist[`${checkbox}_repos`] = repos;

 

                            }

 

                        } else if (checkbox === 'confluenceJira') {

 

                            // Special handling for JIRA + Confluence (both required)

 

                            const values = Array.from(inputs).map(input => input.value.trim());

 

                            if (values.some(val => !val)) {

 

                                hasEmptyInputs = true;

 

                                emptyInputMessage = 'Please fill in both JIRA ID and Confluence link.';

 

                            } else {

 

                                release.checklist[`${checkbox}_values`] = values;

 

                            }

 

                        } else if (inputs.length === 1) {

 

                            // Single input validation

 

                            const value = inputs[0].value.trim();

 

                            if (!value) {

 

                                hasEmptyInputs = true;

 

                                emptyInputMessage = `Please fill in the required field for "${checkbox.replace(/([A-Z])/g, ' $1').toLowerCase()}".`;

 

                            } else {

 

                                release.checklist[`${checkbox}_value`] = value;

 

                            }

 

                        } else if (inputs.length > 1) {

 

                            // Multiple inputs (general case)

 

                            const values = Array.from(inputs).map(input => input.value.trim()).filter(val => val);

 

                            if (values.length === 0) {

 

                                hasEmptyInputs = true;

 

                                emptyInputMessage = `Please fill in the required fields for "${checkbox.replace(/([A-Z])/g, ' $1').toLowerCase()}".`;

 

                            } else {

 

                                release.checklist[`${checkbox}_values`] = values;

 

                            }

 

                        }

 

                      

 

                        // Show error if inputs are empty

 

                        if (hasEmptyInputs) {

 

                            alert(`❌ VALIDATION ERROR\n\n${emptyInputMessage}\n\nPlease fill in the required information or uncheck the item.`);

 

                            this.isSubmitting = false; // Reset flag on validation error

 

                            return;

 

                        }

 

                    }

 

                } else if (element && element.checked) {

 

                    // For checkboxes without inputs, just mark as checked

 

                    release.checklist[checkbox] = true;

 

                }

 

            });

 


 

            // Check checklist completion but allow partial completion for planning

 

            const allChecked = checkboxes.every(checkbox => {

 

                const element = document.getElementById(checkbox);

 

                return element && element.checked;

 

            });

 

          

 

            if (!allChecked) {

 

                const completedCount = checkboxes.filter(checkbox => {

 

                    const element = document.getElementById(checkbox);

 

                    return element && element.checked;

 

                }).length;

 

              

 

                const completionPercentage = Math.round((completedCount / checkboxes.length) * 100);

 

              

 

                const planningConfirm = confirm(

 

                    `📋 RELEASE PLANNING MODE\n\n` +

 

                    `Checklist completion: ${completionPercentage}% (${completedCount}/${checkboxes.length} items)\n\n` +

 

                    `You can book this release now for planning purposes and update the checklist later.\n\n` +

 

                    `⚠️ Warning: You'll receive alerts 3 days before the release date if not 100% complete.\n\n` +

 

                    `Click OK to book as planned release, or Cancel to complete checklist first.`

 

                );

 

              

 

                if (!planningConfirm) {

 

                    this.isSubmitting = false; // Reset flag on user cancel

 

                    return;

 

                }

 

              

 

                // Mark as planned release (not ready)

 

                release.isPlanned = true;

 

                release.completionPercentage = completionPercentage;

 

            } else {

 

                // Mark as ready release

 

                release.isPlanned = false;

 

                release.completionPercentage = 100;

 

            }

 


 

            // Validate dry run date using the dedicated function

 

            if (!this.validateDryRunDate()) {

 

                alert('Please fix the dry run date. It must be before the release date.');

 

                this.isSubmitting = false; // Reset flag on validation error

 

                return;

 

            }

 


 

            // Check for conflicts and warn user, but allow booking

 

            const selectedDate = new Date(release.releaseDate);

 

            let conflictingReleases = this.getReleasesForDate(selectedDate);

 

          

 

            // If we're editing, exclude the current release from conflict check

 

            if (this.editingReleaseId) {

 

                conflictingReleases = conflictingReleases.filter(r => r.id !== this.editingReleaseId);

 

                console.log('Editing mode: filtered out current release from conflicts');

 

            }

 

          

 

            if (conflictingReleases.length > 0) {

 

                const conflictTeams = conflictingReleases.map(r => `${r.teamName} (${r.appName})`).join(', ');

 

                const actionText = this.editingReleaseId ? 'updating' : 'booking';

 

                const confirmMessage = `⚠️ DATE CONFLICT WARNING!\n\n` +

 

                    `${conflictingReleases.length} other release(s) already scheduled for ${selectedDate.toLocaleDateString()}:\n` +

 

                    `${conflictTeams}\n\n` +

 

                    `This may cause coordination issues. Do you want to proceed with ${actionText} anyway?\n\n` +

 

                    `Click OK to proceed, or Cancel to choose a different date.`;

 

              

 

                if (!confirm(confirmMessage)) {

 

                    this.isSubmitting = false; // Reset flag on user cancel

 

                    return; // User chose to cancel

 

                }

 

            }

 


 

            console.log('Processing release:', release); // Debug log

 

          

 

            // Store edit state before processing

 

            const isEditMode = !!this.editingReleaseId;

 

            const editingId = this.editingReleaseId;

 

          

 

            if (isEditMode) {

 

                // Update existing release

 

                const existingIndex = this.releases.findIndex(r => r.id === editingId);

 

                console.log('Edit mode - looking for release with ID:', editingId);

 

                console.log('Found at index:', existingIndex);

 

                console.log('Total releases before update:', this.releases.length);

 

              

 

                if (existingIndex >= 0) {

 

                    // Preserve original creation date and ID

 

                    release.id = editingId;

 

                    release.createdAt = this.releases[existingIndex].createdAt;

 

                    release.updatedAt = new Date().toISOString();

 

                    this.releases[existingIndex] = release;

 

                    console.log('Updated existing release at index', existingIndex);

 

                    console.log('Total releases after update:', this.releases.length);

 

                } else {

 

                    console.error('Release to edit not found - this should not happen!');

 

                    console.log('Available release IDs:', this.releases.map(r => r.id));

 

                    this.isSubmitting = false; // Reset flag on error

 

                    return;

 

                }

 

            } else {

 

                // Add new release

 

                this.releases.push(release);

 

                console.log('Added new release, total releases:', this.releases.length);

 

            }

 

          

 

            await this.saveReleases();

 

          

 

            // Update UI first

 

            this.renderCalendar();

 

            this.renderDashboard();

 

            this.updateStats();

 

          

 

            // Show success message with conflict info if applicable

 

            let finalConflictCheck = this.getReleasesForDate(selectedDate);

 

            let successMessage = isEditMode ? '✅ Release updated successfully!' : '✅ Release booked successfully!';

 

          

 

            // Calculate actual conflicts

 

            if (finalConflictCheck.length > 1) {

 

                successMessage += `\n\n⚠️ Note: ${finalConflictCheck.length} releases are now scheduled for ${selectedDate.toLocaleDateString()}.\nPlease coordinate with other teams to avoid conflicts.`;

 

            }

 

          

 

            alert(successMessage);

 

            console.log('Release processed successfully, total releases:', this.releases.length);

 

          

 

            // Clean up AFTER everything is done

 

            document.getElementById('releaseForm').reset();

 

            document.getElementById('conflictWarning').style.display = 'none';

 

          

 

            // Clean up edit mode state

 

            this.editingReleaseId = null;

 

            let formTitle = document.querySelector('#booking-tab .tab-header h2');

 

            if (formTitle) {

 

                formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Book New Release';

 

            }

 

          

 

            // Reset button text

 

            let submitButton = document.querySelector('button[type="submit"]');

 

            if (submitButton) {

 

                submitButton.innerHTML = '<i class="fas fa-save"></i> Book Release';

 

            }

 

          

 

            // Switch to calendar view

 

            this.switchTab('calendar');

 

          

 

        } catch (error) {

 

            console.error('Error in submitRelease:', error);

 

            alert('An error occurred while booking the release. Please check the console for details.');

 

        } finally {

 

            // Always reset the submission flag

 

            this.isSubmitting = false;

 

        }

 

    }

 


 

    async loadReleases() {

 

        try {

 

            // Try to load from server API first (most reliable)

 

            console.log('🌐 Loading releases from server API...');

 

            const response = await fetch('/automation/CDMS-Releases/api/releases');

 

          

 

            if (response.ok) {

 

                const serverReleases = await response.json();

 

                console.log(`✅ Loaded ${serverReleases.length} releases from server`);

 

                this.releases = serverReleases;

 

              

 

                // Update localStorage to match server data

 

                localStorage.setItem('releases', JSON.stringify(this.releases));

 

                return;

 

            } else {

 

                console.warn('⚠️ Server API not available, falling back to file/localStorage');

 

            }

 

        } catch (error) {

 

            console.warn('⚠️ Server API error, falling back to file/localStorage:', error.message);

 

        }

 

      

 

        // Fallback: Try localStorage and file (original method)

 

        const localStorageData = localStorage.getItem('releases');

 

        let localReleases = localStorageData ? JSON.parse(localStorageData) : [];

 

      

 

        let fileReleases = [];

 

        try {

 

            const response = await fetch(this.dataFile);

 

            if (response.ok) {

 

                const data = await response.text();

 

                fileReleases = data.trim() ? JSON.parse(data) : [];

 

                console.log('📄 Loaded releases from file:', fileReleases.length);

 

            }

 

        } catch (error) {

 

            console.log('📄 Could not load from file, using localStorage only');

 

        }

 

      

 

        // Use the data source with more releases (most up-to-date)

 

        if (localReleases.length > fileReleases.length) {

 

            console.log('💾 localStorage has more releases, using localStorage data:', localReleases.length);

 

            this.releases = localReleases;

 

        } else if (fileReleases.length > 0) {

 

            console.log('📄 File has more/equal releases, using file data:', fileReleases.length);

 

            this.releases = fileReleases;

 

            localStorage.setItem('releases', JSON.stringify(this.releases));

 

        } else if (localReleases.length > 0) {

 

            console.log('💾 Using localStorage data:', localReleases.length, 'releases');

 

            this.releases = localReleases;

 

        } else {

 

            console.log('📭 No releases found, starting with empty array');

 

            this.releases = [];

 

        }

 

    }

 


 

    async saveReleases() {

 

        try {

 

            // Always save to localStorage first (immediate backup)

 

            localStorage.setItem('releases', JSON.stringify(this.releases));

 

            console.log('💾 Releases saved to localStorage');

 

          

 

            // Try to save to server API (automatic file update)

 

            try {

 

                console.log('🌐 Saving releases to server...');

 

                const response = await fetch('/automation/CDMS-Releases/api/releases', {

 

                    method: 'POST',

 

                    headers: {

 

                        'Content-Type': 'application/json',

 

                    },

 

                    body: JSON.stringify(this.releases)

 

                });

 

              

 

                if (response.ok) {

 

                    const result = await response.json();

 

                    console.log('✅ Server save successful:', result.message);

 

                  

 

                    // Show success message for first release

 

                    if (this.releases.length === 1) {

 

                        setTimeout(() => {

 

                            alert('🎉 SUCCESS: Release saved automatically!\n\n' +

 

                                  '✅ Data saved to server and releases.json file\n' +

 

                                  '✅ All team members will see this release immediately\n' +

 

                                  '✅ No manual file replacement needed!');

 

                        }, 500);

 

                    }

 

                    return; // Success, no need for fallback

 

                } else {

 

                    const error = await response.json();

 

                    console.warn('⚠️ Server save failed:', error.error);

 

                }

 

            } catch (serverError) {

 

                console.warn('⚠️ Server API not available:', serverError.message);

 

            }

 

          

 

            // Note: Fallback download removed - server should always be available with database

 

          

 

        } catch (error) {

 

            console.error('❌ Error saving releases:', error);

 

            // Ensure localStorage is saved even if everything else fails

 

            localStorage.setItem('releases', JSON.stringify(this.releases));

 

        }

 

    }

 


 

    downloadReleasesFile() {

        const dataStr = JSON.stringify(this.releases, null, 2);

        const dataBlob = new Blob([dataStr], {type: 'application/json'});

 

        // Create download link

        const link = document.createElement('a');

        link.href = URL.createObjectURL(dataBlob);

        link.download = 'releases.json';

 

        // Auto-download for convenience

        document.body.appendChild(link);

        link.click();

        // Revoke and cleanup

        setTimeout(() => {

            URL.revokeObjectURL(link.href);

            link.remove();

        }, 1000);

 

        // Store the download link for manual use (legacy behavior)

        this.lastExportUrl = link.href;

    }

 


 

    updateStats() {

 

        const totalReleases = this.releases.length;

 

        const currentMonth = this.currentDate.getMonth();

 

        const currentYear = this.currentDate.getFullYear();

 

      

 

        const monthlyReleases = this.releases.filter(release => {

 

            const releaseDate = new Date(release.releaseDate);

 

            return releaseDate.getMonth() === currentMonth && releaseDate.getFullYear() === currentYear;

 

        }).length;

 


 

        // Count conflicts (dates with multiple releases)

 

        const dateGroups = {};

 

        this.releases.forEach(release => {

 

            const dateKey = release.releaseDate;

 

            if (!dateGroups[dateKey]) {

 

                dateGroups[dateKey] = [];

 

            }

 

            dateGroups[dateKey].push(release);

 

        });

 

      

 

        const conflicts = Object.values(dateGroups).filter(group => group.length > 1).length;

 


 

        // Calculate next 7 days releases

 

        const sevenDaysFromNow = new Date();

 

        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

 

      

 

        const upcomingWeekReleases = this.releases.filter(release => {

 

            const releaseDate = new Date(release.releaseDate);

 

            return releaseDate >= this.currentDate && releaseDate <= sevenDaysFromNow;

 

        }).length;

 


 

        document.getElementById('totalReleases').textContent = totalReleases;

 

        document.getElementById('monthlyReleases').textContent = monthlyReleases;

 

        document.getElementById('conflicts').textContent = conflicts;

 

    }

 


 

    renderDashboard() {

 

        const container = document.getElementById('upcomingReleases');

 

      

 

        // Get upcoming releases (next 30 days)

 

        const thirtyDaysFromNow = new Date();

 

        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

 

      

 

        const upcomingReleases = this.releases

 

            .filter(release => {

 

                const releaseDate = new Date(release.releaseDate);

 

                return releaseDate >= this.currentDate && releaseDate <= thirtyDaysFromNow;

 

            })

 

            .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

 


 

        if (upcomingReleases.length === 0) {

 

            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No upcoming releases in the next 30 days.</p>';

 

            return;

 

        }

 


 

        let html = '';

 

        upcomingReleases.forEach(release => {

 

            const releaseDate = new Date(release.releaseDate);

 

            const conflictingReleases = this.getReleasesForDate(releaseDate);

 

            const hasConflict = conflictingReleases.length > 1;

 

            const daysUntil = this.getDaysUntilRelease(releaseDate);

 

            const completion = release.completionPercentage || 0;

 

            const isWarning = daysUntil <= 3 && completion < 100;

 

          

 

            let cardClass = '';

 

            if (hasConflict) cardClass += 'conflict ';

 

            if (isWarning) cardClass += 'warning ';

 

            if (completion === 100) cardClass += 'ready ';

 

          

 

            html += `

 

                <div class="release-card ${cardClass}" onclick="releaseManager.showReleaseDetails('${release.id}')">

 

                    <div class="release-header">

 

                        <div>

 

                            <div class="release-title">${release.appName}</div>

 

                            <div class="release-team">${release.teamName}</div>

 

                        </div>

 

                        <div class="release-status">

 

                            <div class="release-date ${hasConflict ? 'conflict' : ''}">

 

                                ${releaseDate.toLocaleDateString()}

 

                                ${hasConflict ? ` (${conflictingReleases.length} releases)` : ''}

 

                            </div>

 

                            <div class="completion-badge ${completion === 100 ? 'complete' : (completion > 50 ? 'partial' : 'low')}">

 

                                ${completion}% Complete

 

                            </div>

 

                            ${isWarning ? '<div class="warning-badge">⚠️ Needs Attention</div>' : ''}

 

                        </div>

 

                    </div>

 

                    <div class="release-details">

 

                        <div class="release-detail-row">

 

                            <div class="release-detail">

 

                                <i class="fas fa-user"></i>

 

                                <span>${release.contactPerson}</span>

 

                            </div>

 

                            <div class="release-detail">

 

                                <i class="fas fa-clock"></i>

 

                                <span>${daysUntil} days</span>

 

                            </div>

 

                        </div>

 

                        <div class="release-detail-row">

 

                            <div class="release-detail">

 

                                <i class="fas fa-envelope"></i>

 

                                <span>${release.contactEmail}</span>

 

                            </div>

 

                        </div>

 

                        <div class="release-detail-row">

 

                            <div class="release-detail">

 

                                <i class="fas fa-calendar"></i>

 

                                <span>Dry Run: ${new Date(release.dryRunDate).toLocaleDateString()}</span>

 

                            </div>

 

                        </div>

 

                    </div>

 

                </div>

 

            `;

 

        });

 


 

        container.innerHTML = html;

 

    }

 


 

    getDaysUntilRelease(releaseDate) {

 

        const timeDiff = releaseDate.getTime() - this.currentDate.getTime();

 

        return Math.ceil(timeDiff / (1000 * 3600 * 24));

 

    }

 


 

    checkReleaseWarnings() {

 

        const today = new Date();

 

        today.setHours(0, 0, 0, 0);

 

      

 

        const threeDaysFromNow = new Date(today);

 

        threeDaysFromNow.setDate(today.getDate() + 3);

 

      

 

        const warningReleases = this.releases.filter(release => {

 

            const releaseDate = new Date(release.releaseDate);

 

            releaseDate.setHours(0, 0, 0, 0);

 

          

 

            // Check if release is within 3 days and not 100% complete

 

            return releaseDate >= today &&

 

                   releaseDate <= threeDaysFromNow &&

 

                   (release.completionPercentage < 100 || release.isPlanned);

 

        });

 


 

        if (warningReleases.length > 0) {

 

            this.showReleaseWarnings(warningReleases);

 

        }

 

    }

 


 

    showReleaseWarnings(warningReleases) {

 

        let warningMessage = '🚨 RELEASE READINESS ALERT!\n\n';

 

        warningMessage += `${warningReleases.length} upcoming release(s) need attention:\n\n`;

 

      

 

        warningReleases.forEach((release, index) => {

 

            const releaseDate = new Date(release.releaseDate);

 

            const daysUntil = this.getDaysUntilRelease(releaseDate);

 

            const completion = release.completionPercentage || 0;

 

          

 

            warningMessage += `${index + 1}. ${release.appName} (${release.teamName})\n`;

 

            warningMessage += `   📅 Release: ${releaseDate.toLocaleDateString()} (${daysUntil} days)\n`;

 

            warningMessage += `   ✅ Completion: ${completion}%\n\n`;

 

        });

 

      

 

        warningMessage += '⚠️ Please update your checklist to ensure release readiness!\n\n';

 

        warningMessage += 'Click OK to view releases in dashboard.';

 

      

 

        if (confirm(warningMessage)) {

 

            this.switchTab('dashboard');

 

        }

 

    }

 


 

    exportData() {

 

        const dataStr = JSON.stringify(this.releases, null, 2);

 

        const dataBlob = new Blob([dataStr], {type: 'application/json'});

 

      

 

        const link = document.createElement('a');

 

        link.href = URL.createObjectURL(dataBlob);

 

        link.download = `releases_${new Date().toISOString().split('T')[0]}.json`;

 

        link.click();

 

      

 

        alert(`Exported ${this.releases.length} releases to JSON file.`);

 

    }

 


 

    async importData(file) {

 

        if (!file) return;

 

      

 

        try {

 

            const text = await file.text();

 

            const importedReleases = JSON.parse(text);

 

          

 

            if (!Array.isArray(importedReleases)) {

 

                throw new Error('Invalid file format. Expected an array of releases.');

 

            }

 

          

 

            // Validate the structure of imported data

 

            const isValid = importedReleases.every(release =>

 

                release.id && release.teamName && release.appName &&

 

                release.releaseDate && release.dryRunDate

 

            );

 

          

 

            if (!isValid) {

 

                throw new Error('Invalid release data structure in the file.');

 

            }

 

          

 

            // Ask user if they want to merge or replace

 

            const merge = confirm(

 

                `Found ${importedReleases.length} releases in the file.\n\n` +

 

                `Current releases: ${this.releases.length}\n\n` +

 

                `Click OK to MERGE with existing data, or Cancel to REPLACE all data.`

 

            );

 

          

 

            if (merge) {

 

                // Merge: Add new releases, update existing ones

 

                importedReleases.forEach(importedRelease => {

 

                    const existingIndex = this.releases.findIndex(r => r.id === importedRelease.id);

 

                    if (existingIndex >= 0) {

 

                        this.releases[existingIndex] = importedRelease;

 

                    } else {

 

                        this.releases.push(importedRelease);

 

                    }

 

                });

 

            } else {

 

                // Replace all data

 

                this.releases = importedReleases;

 

            }

 

          

 

            await this.saveReleases();

 

            this.renderCalendar();

 

            this.renderDashboard();

 

            this.updateStats();

 

          

 

            alert(`Successfully imported ${importedReleases.length} releases!`);

 

          

 

        } catch (error) {

 

            console.error('Import error:', error);

 

            alert(`Error importing file: ${error.message}`);

 

        }

 

      

 

        // Clear the file input

 

        document.getElementById('fileInput').value = '';

 

    }

 


 

    async refreshData() {

 

        try {

 

            console.log('🔄 Refreshing data from server...');

 

            await this.loadReleases();

 

            this.renderCalendar();

 

            this.renderDashboard();

 

            this.updateStats();

 

          

 

            const message = this.releases.length > 0

 

                ? `✅ Data refreshed! Loaded ${this.releases.length} releases from server.`

 

                : '📭 Data refreshed! No releases found.';

 

          

 

            alert(message);

 

        } catch (error) {

 

            console.error('❌ Refresh error:', error);

 

            alert('⚠️ Error refreshing data. Check console for details.');

 

        }

 

    }

 


 

    // Repository Management Methods

 

    addRepository() {

 

        const repoInput = document.getElementById('newRepoName');

 

        const repoName = repoInput.value.trim();

 

      

 

        if (!repoName) {

 

            alert('Please enter a repository/component name');

 

            return;

 

        }

 

      

 

        if (this.repositories.some(repo => repo.name === repoName)) {

 

            alert('Repository already added');

 

            return;

 

        }

 

      

 

        const repo = {

 

            id: Date.now().toString(),

 

            name: repoName,

 

            preReleaseData: {

 

                pomVersionIncremented: false,

 

                iadpContractVersionCheck: false,

 

                releaseVersionInline: false,

 

                apixInventoryUpdated: false

 

            },

 

            testingData: {

 

                signOffCertReleaseManager: false,

 

                signOffCertTestManager: false,

 

                purlPreparedFromCert: false

 

            }

 

        };

 

      

 

        this.repositories.push(repo);

 

        repoInput.value = '';

 

        this.renderRepositoryList();

 

        this.renderRepositoryWorkflows();

 

        this.updateWorkflowProgress();

 

    }

 

  

 

    removeRepository(repoId) {

 

        this.repositories = this.repositories.filter(repo => repo.id !== repoId);

 

        this.renderRepositoryList();

 

        this.renderRepositoryWorkflows();

 

        this.updateWorkflowProgress();

 

    }

 

  

 

    renderRepositoryList() {

 

        const repoList = document.getElementById('repoList');

 

      

 

        if (this.repositories.length === 0) {

 

            repoList.innerHTML = '';

 

            return;

 

        }

 

      

 

        repoList.innerHTML = this.repositories.map(repo => `

 

            <div class="repo-item">

 

                <span class="repo-name">${repo.name}</span>

 

                <button type="button" class="remove-repo-btn" onclick="window.releaseManager.removeRepository('${repo.id}')">

 

                    <i class="fas fa-trash"></i>

 

                </button>

 

            </div>

 

        `).join('');

 

    }

 

  

 

    renderRepositoryWorkflows() {

        const repoWorkflows = document.getElementById('repoWorkflows');

      

        if (this.repositories.length === 0) {

            repoWorkflows.innerHTML = `

                <div class="no-repos-message">

                    <p>📦 Add repositories above to see their workflow steps</p>

                </div>

            `;

            return;

        }

        // Hide pre-release repo sections when Release Type is Data Migration

        const hidePreRelease = (document.getElementById('releaseType') && document.getElementById('releaseType').value === 'Data Migration');

      

        repoWorkflows.innerHTML = this.repositories.map(repo => `

            <div class="repo-workflow-section">

                <div class="repo-workflow-header">

                    <h4 class="repo-workflow-title">📦 ${repo.name}</h4>

                    <span class="repo-progress" id="repo-progress-${repo.id}">0/8 completed</span>

                </div>

 

                <div class="workflow-phases">

                    <div class="workflow-phase" ${hidePreRelease ? 'style="display:none;"' : ''}>

                        <h5 class="phase-title">🚀 Pre-Release Preparation</h5>

                        <div class="step-items">

                            <div class="checkbox-with-input">

                                <label class="checkbox-item">

                                    <input type="checkbox" id="pom-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'preReleaseData', 'pomVersionIncremented', this.checked); window.releaseManager.toggleInput('pom-${repo.id}-input', this.checked)">

                                    <span class="checkmark"></span>

                                    <span class="item-text">POM version incremented</span>

                                </label>

                                <div class="dynamic-input" id="pom-${repo.id}-input" style="display: none;">

                                    <input type="text" placeholder="Enter POM version (e.g., 1.2.3)" class="detail-input">

                                </div>

                            </div>

                            <label class="checkbox-item">

                                <input type="checkbox" id="iadp-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'preReleaseData', 'iadpContractVersionCheck', this.checked)">

                                <span class="checkmark"></span>

                                <span class="item-text">IADP contract version check</span>

                            </label>

                            <div class="checkbox-with-input">

                                <label class="checkbox-item">

                                    <input type="checkbox" id="release-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'preReleaseData', 'releaseVersionInline', this.checked); window.releaseManager.toggleInput('release-${repo.id}-input', this.checked)">

                                    <span class="checkmark"></span>

                                    <span class="item-text">Release version inline with IADP</span>

                                </label>

                                <div class="dynamic-input" id="release-${repo.id}-input" style="display: none;">

                                    <input type="text" placeholder="Enter release version" class="detail-input">

                                </div>

                            </div>

                            <label class="checkbox-item">

                                <input type="checkbox" id="apix-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'preReleaseData', 'apixInventoryUpdated', this.checked)">

                                <span class="checkmark"></span>

                                <span class="item-text">APIX inventory updated</span>

                            </label>

                        </div>

 

                    </div>

                    <div class="workflow-phase">

                        <h5 class="phase-title">🧪 Testing & Validation</h5>

                        <div class="step-items">

                            <label class="checkbox-item">

                                <input type="checkbox" id="cert-rm-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'testingData', 'signOffCertReleaseManager', this.checked)">

                                <span class="checkmark"></span>

                                <span class="item-text">Sign off CERT - Release Manager</span>

                            </label>

                            <label class="checkbox-item">

                                <input type="checkbox" id="cert-tm-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'testingData', 'signOffCertTestManager', this.checked)">

                                <span class="checkmark"></span>

                                <span class="item-text">Sign off CERT - Test Manager</span>

                            </label>

                            <div class="checkbox-with-input">

                                <label class="checkbox-item">

                                    <input type="checkbox" id="purl-${repo.id}" onchange="window.releaseManager.updateRepoData('${repo.id}', 'testingData', 'purlPreparedFromCert', this.checked); window.releaseManager.toggleInput('purl-${repo.id}-input', this.checked)">

                                    <span class="checkmark"></span>

                                    <span class="item-text">PURL prepared from CERT</span>

                                </label>

                                <div class="dynamic-input" id="purl-${repo.id}-input" style="display: none;">

                                    <input type="text" placeholder="Enter PURL details" class="detail-input">

                                </div>

                            </div>

 

                        </div>

 

                    </div>

 

                </div>

 

            </div>

 

        `).join('');

 

    }

 

    updateRepoData(repoId, section, field, value) {

 

        const repo = this.repositories.find(r => r.id === repoId);

 

        if (repo) {

 

            repo[section][field] = value;

 

            this.updateRepositoryProgress(repoId);

 

            this.updateWorkflowProgress();

 

        }

 

    }

 

  

 

    updateRepositoryProgress(repoId) {

 

        const repo = this.repositories.find(r => r.id === repoId);

 

        if (!repo) return;

 

      

 

        const preReleaseCompleted = Object.values(repo.preReleaseData).filter(Boolean).length;

 

        const testingCompleted = Object.values(repo.testingData).filter(Boolean).length;

 

        const totalCompleted = preReleaseCompleted + testingCompleted;

 

      

 

        const progressElement = document.getElementById(`repo-progress-${repoId}`);

 

        if (progressElement) {

 

            progressElement.textContent = `${totalCompleted}/7 completed`;

 

        }

 

    }

 

  

 

    toggleInput(inputId, show) {

 

        const inputElement = document.getElementById(inputId);

 

        if (inputElement) {

 

            inputElement.style.display = show ? 'block' : 'none';

 

        }

 

    }

 


 

}

 

// Initialize the application when DOM is loaded

 

document.addEventListener('DOMContentLoaded', () => {

 

    window.releaseManager = new ReleaseManager();

 

});

 


 

// Global debugging functions for testing

 

window.testFormSubmission = function() {

 

    console.log('Testing form submission...');

 

    if (window.releaseManager) {

 

        window.releaseManager.submitRelease();

 

        releaseManager.submitRelease();

 

    } else {

 

        console.error('Release manager not initialized');

 

    }

 

};

 


 

window.debugFormState = function() {

 

    const form = document.getElementById('releaseForm');

 

    const requiredFields = ['teamName', 'appName', 'releaseDate', 'dryRunDate', 'contactPerson', 'contactEmail'];

 

    const checkboxes = [

 

        // Step 1: Pre-Release Preparation

 

        'pomVersionIncremented', 'iadpContractVersionCheck', 'releaseVersionInline', 'apixInventoryUpdated',

 

        // Step 2: Testing & Validation

 

        'signOffCertReleaseManager', 'signOffCertTestManager', 'purlPreparedFromCert', 'crQualityCheck',

 

        // Step 3: Documentation & Communication

 

        'componentsReposImpacted', 'releasePageGenerated', 'crCreated', 'confluenceJira', 'evidencesAttached'

 

    ];

 

  

 

    console.log('=== FORM DEBUG INFO ===');

 

    console.log('Form exists:', !!form);

 

  

 

    requiredFields.forEach(field => {

 

        const element = document.getElementById(field);

 

        console.log(`${field}:`, {

 

            exists: !!element,

 

            value: element ? element.value : 'N/A',

 

            valid: element ? element.checkValidity() : false

 

        });

 

    });

 

  

 

    checkboxes.forEach(checkbox => {

 

        const element = document.getElementById(checkbox);

 

        console.log(`${checkbox}:`, {

 

            exists: !!element,

 

            checked: element ? element.checked : false

 

        });

 

    });

 

  

 

    console.log('=== END DEBUG INFO ===');

 

};

 


 

window.testCheckAvailability = function() {

 

    console.log('Testing check availability...');

 

    if (releaseManager) {

 

        releaseManager.checkDateAvailability();

 

    } else {

 

        console.error('Release manager not initialized');

 

    }

 

};

 


 

// Global function for adding repository inputs

 

window.addRepoInput = function() {

 

    const repoInputs = document.getElementById('repoInputs');

 

    if (!repoInputs) return;

 

  

 

    const inputRow = document.createElement('div');

 

    inputRow.className = 'input-row';

 

    inputRow.innerHTML = `

 

        <input type="text" placeholder="Enter component/repo name" class="detail-input">

 

        <button type="button" class="remove-repo-btn" onclick="removeRepoInput(this)">−</button>

 

    `;

 

  

 

    repoInputs.appendChild(inputRow);

 

  

 

    // Focus on the new input

 

    const newInput = inputRow.querySelector('.detail-input');

 

    if (newInput) {

 

        newInput.focus();

 

    }

 

};

 


 

// Global function for removing repository inputs

 

window.removeRepoInput = function(button) {

 

    const inputRow = button.parentElement;

 

    const repoInputs = document.getElementById('repoInputs');

 

  

 

    // Don't remove if it's the only input

 

    if (repoInputs && repoInputs.children.length > 1) {

 

        inputRow.remove();

 

    }

 

};