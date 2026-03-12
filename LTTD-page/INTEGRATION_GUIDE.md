# LTTD Metrics - Integration Guide

## Overview
This guide explains how to integrate the LTTD Metrics utility into the CDM DevOps Tooling platform.

## What You Need to Provide

### 1. React Component File
**File**: `LttdMetrics.jsx`
**Location**: Place this in their codebase at: `src/view/board/devOpsCentre/lttdMetrics/index.js`

### 2. Dependencies Required
The component uses these packages (should already be in their project):
- `react`
- `antd` (Ant Design)
- `dayjs`
- `@ant-design/icons`

### 3. Route Configuration
The route is already configured in their ToolingHub component:
```javascript
{
  title: 'Dora Metrics',
  description: 'Analyze lead time to deploy (LTTD), find outliers, and export CSV.',
  to: '/devOps/tooling/lttd-metrics',
}
```

They need to add the route in their router configuration file (usually in `src/` or `src/router/`):
```javascript
import LttdMetrics from './view/board/devOpsCentre/lttdMetrics';

// In their routes array:
{
  path: '/devOps/tooling/lttd-metrics',
  element: <LttdMetrics />
}
```

## API Endpoints Required

The component expects these API endpoints to be available:

### 1. Fetch LTTD Records
- **Endpoint**: `POST /api/lttd/records`
- **Request Body**:
```json
{
  "from_date": "2026-01",
  "to_date": "2026-03",
  "teambook_id": "449",
  "level": 2
}
```
- **Response**:
```json
{
  "status": "success",
  "records": [...],
  "no_lttd_records": [...],
  "grouped_no_lttd": [...],
  "total_before_filter": 100
}
```

### 2. Fetch Emails
- **Endpoint**: `POST /automation/lttd/api/lttd/fetch-emails`
- **Request Body**:
```json
{
  "records": [...]
}
```

### 3. Send Emails
- **Endpoint**: `POST /automation/lttd/api/lttd/send-emails`
- **Request Body**:
```json
{
  "high_lttd_records": [...],
  "no_lttd_records": [...],
  "to_email": "user@hsbc.com",
  "cc_emails": ["cc1@hsbc.com"]
}
```

## Integration Steps

### Step 1: Copy the Component
1. Take `LttdMetrics.jsx` file
2. Place it in their codebase at: `src/view/board/devOpsCentre/lttdMetrics/index.js`

### Step 2: Add Route
1. Find their router configuration file
2. Import the component
3. Add the route for `/devOps/tooling/lttd-metrics`

### Step 3: Verify API Endpoints
1. Ensure all three API endpoints are accessible
2. Test the endpoints return data in the expected format

### Step 4: Test
1. Navigate to the DevOps Tooling page
2. Click on "Dora Metrics" card
3. Should navigate to LTTD Metrics page
4. Test fetching records, exporting CSV, and sending emails

## Features Included

✅ **Date Range Selection** - Pick from/to months  
✅ **Fetch LTTD Records** - Retrieve data from API  
✅ **Data Table Display** - Sortable, paginated table with all fields  
✅ **Toggle No LTTD Records** - Show/hide records with missing LTTD  
✅ **Export to CSV** - Download records as CSV file  
✅ **Email Notifications** - Send combined email with high/missing LTTD records  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Ant Design UI** - Matches their existing platform styling  

## Styling Notes

The component uses:
- Ant Design's theme tokens for consistent styling
- Same layout pattern as other DevOps tools
- Responsive grid and table components
- Icons from `@ant-design/icons`

No additional CSS files needed - everything uses Ant Design's built-in styling.

## Support

If you encounter issues during integration:
1. Check browser console for errors
2. Verify API endpoints are returning correct data format
3. Ensure all dependencies are installed
4. Check React Router configuration

## Differences from Original HTML Version

| Feature | HTML Version | React Version |
|---------|--------------|---------------|
| UI Framework | Custom CSS | Ant Design |
| State Management | Class-based JS | React Hooks |
| Date Picker | Native HTML | Ant Design DatePicker |
| Table | Custom HTML table | Ant Design Table |
| Modals | Custom CSS modal | Ant Design Modal |
| Notifications | alert() | Ant Design message |
| Styling | External CSS files | Inline + theme tokens |

All functionality remains the same, just modernized for React!
