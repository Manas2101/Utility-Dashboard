# SQLite Database Setup for Release Calendar

## 📚 Overview

This guide covers the complete SQLite database setup for the Release Calendar application. The database replaces the previous JSON file storage with a robust, queryable SQLite database.

---

## 🗄️ Database Schema

### **Tables**

#### 1. `releases` Table
Stores main release information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique release identifier |
| `team_name` | TEXT | Team name |
| `app_name` | TEXT | Application name |
| `release_date` | TEXT | Release date (ISO format) |
| `dry_run_date` | TEXT | Dry run date |
| `contact_person` | TEXT | Contact person name |
| `contact_email` | TEXT | Contact email |
| `additional_notes` | TEXT | Additional notes |
| `checklist` | TEXT (JSON) | Checklist data as JSON |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last update timestamp |

#### 2. `release_repositories` Table
Stores repository information for each release.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER (PK) | Auto-increment ID |
| `release_id` | TEXT (FK) | References releases.id |
| `repo_name` | TEXT | Repository name |
| `repo_url` | TEXT | Repository URL |
| `created_at` | TEXT | Creation timestamp |

### **Indexes**
- `idx_release_date` - Fast queries by release date
- `idx_team_name` - Fast queries by team name
- `idx_release_repos` - Fast repository lookups

---

## 🚀 Quick Start

### **Step 1: Initialize Database**

```bash
cd Release-page
python init_db.py
```

This creates an empty `releases.db` file with the proper schema.

### **Step 2: Migrate Existing Data (Optional)**

If you have existing data in `releases.json`:

```bash
python init_db.py --migrate
```

This will:
- Read all releases from `releases.json`
- Insert them into the database
- Create a backup file `releases.json.migrated_backup`

### **Step 3: Verify Setup**

```bash
python init_db.py --stats
```

Shows database statistics including:
- Total number of releases
- Releases grouped by team
- Recent releases

---

## 🔧 Database Management Commands

### **Initialize Empty Database**
```bash
python init_db.py --init
```

### **Migrate from JSON**
```bash
python init_db.py --migrate
```

### **Export to JSON**
```bash
python init_db.py --export
```
Creates `releases_export.json` with all database data.

### **Reset Database (⚠️ Deletes All Data)**
```bash
python init_db.py --reset
```

### **Show Statistics**
```bash
python init_db.py --stats
```

---

## 🌐 API Endpoints

The database-powered routes provide RESTful API endpoints:

### **GET /api/releases**
Get all releases
```json
Response: [
  {
    "id": "1234567890",
    "teamName": "CDMS Team",
    "appName": "My Application",
    "releaseDate": "2024-02-15",
    "dryRunDate": "2024-02-10",
    "contactPerson": "John Doe",
    "contactEmail": "john.doe@example.com",
    "additionalNotes": "Release notes",
    "checklist": {...},
    "repositories": [
      {"name": "repo1", "url": "https://github.com/..."}
    ],
    "createdAt": "2024-02-01T10:00:00",
    "updatedAt": "2024-02-01T10:00:00"
  }
]
```

### **GET /api/releases/<release_id>**
Get a single release by ID

### **POST /api/releases**
Create a new release
```json
Request Body: {
  "id": "1234567890",
  "teamName": "CDMS Team",
  "appName": "My Application",
  "releaseDate": "2024-02-15",
  ...
}
```

### **PUT /api/releases/<release_id>**
Update an existing release

### **DELETE /api/releases/<release_id>**
Delete a release

### **POST /api/releases/bulk**
Bulk save releases (for backward compatibility)

### **GET /api/releases/export**
Export all releases as JSON

### **POST /api/migrate**
Trigger migration from JSON to database

---

## 🔄 Migration Process

### **Automatic Migration**

1. Keep your existing `releases.json` file
2. Run: `python init_db.py --migrate`
3. Database is populated with all releases
4. Original JSON is backed up

### **Manual Migration**

```python
from database import ReleaseDatabase

db = ReleaseDatabase()
db.migrate_from_json('releases.json')
```

---

## 💾 Backup & Recovery

### **Create Backup**
```bash
python init_db.py --export
```
Creates `releases_export.json`

### **Restore from Backup**
```bash
# Reset database
python init_db.py --reset

# Import from backup
python init_db.py --migrate
```

### **Automatic Backups**
The API endpoint `/api/releases/backup` creates a backup on-demand.

---

## 🔍 Database File Location

- **Database File**: `Release-page/releases.db`
- **Backup Files**: `Release-page/releases_export.json`
- **Migration Backup**: `Release-page/releases.json.migrated_backup`

---

## 🛠️ Troubleshooting

### **Database Not Found**
```bash
python init_db.py --init
```

### **Migration Failed**
- Check `releases.json` is valid JSON
- Ensure all required fields are present
- Check console output for specific errors

### **Permission Errors**
Ensure write permissions in the `Release-page` directory.

### **Database Locked**
- Close any SQLite browser tools
- Restart the Flask server

---

## 📊 Performance

- **Indexed Queries**: Fast lookups by date, team, and ID
- **Connection Pooling**: Automatic via context managers
- **Transaction Safety**: All operations are atomic
- **Concurrent Access**: SQLite handles multiple readers

---

## 🔐 Security Notes

- Database file should not be committed to version control (add to `.gitignore`)
- Use environment variables for sensitive data
- Regular backups recommended
- Consider encryption for production deployments

---

## 🎯 Next Steps

1. ✅ Initialize database
2. ✅ Migrate existing data
3. ✅ Test API endpoints
4. ✅ Update frontend to use new endpoints (if needed)
5. ✅ Set up regular backups
6. ✅ Add to `.gitignore`

---

## 📝 Example Usage

### **Python Code**
```python
from database import ReleaseDatabase

db = ReleaseDatabase()

# Create a release
release_data = {
    'id': '123',
    'teamName': 'CDMS',
    'appName': 'Test App',
    'releaseDate': '2024-02-15',
    'checklist': {}
}
db.create_release(release_data)

# Get all releases
releases = db.get_all_releases()

# Update a release
db.update_release('123', updated_data)

# Delete a release
db.delete_release('123')
```

### **API Usage (curl)**
```bash
# Get all releases
curl http://localhost:8200/automation/CDMS-Releases/api/releases

# Create a release
curl -X POST http://localhost:8200/automation/CDMS-Releases/api/releases \
  -H "Content-Type: application/json" \
  -d '{"id":"123","teamName":"CDMS",...}'

# Update a release
curl -X PUT http://localhost:8200/automation/CDMS-Releases/api/releases/123 \
  -H "Content-Type: application/json" \
  -d '{"teamName":"Updated Team",...}'

# Delete a release
curl -X DELETE http://localhost:8200/automation/CDMS-Releases/api/releases/123
```

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review console logs
3. Run `python init_db.py --stats` to verify database state
4. Check `releases.db` file exists and has proper permissions
