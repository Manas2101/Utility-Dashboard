"""
SQLite Database setup for Release Calendar
Handles database initialization, connection, and schema management
"""

import sqlite3
import json
import os
from datetime import datetime
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'releases.db')


class ReleaseDatabase:
    """Database manager for Release Calendar"""
    
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_database(self):
        """Initialize database schema"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Create releases table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS releases (
                    id TEXT PRIMARY KEY,
                    team_name TEXT NOT NULL,
                    app_name TEXT NOT NULL,
                    release_date TEXT NOT NULL,
                    dry_run_date TEXT,
                    contact_person TEXT,
                    contact_email TEXT,
                    additional_notes TEXT,
                    checklist TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            ''')
            
            # Create repositories table (for tracking repos in a release)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS release_repositories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    release_id TEXT NOT NULL,
                    repo_name TEXT NOT NULL,
                    repo_url TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
                )
            ''')
            
            # Create index for faster queries
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_release_date 
                ON releases(release_date)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_team_name 
                ON releases(team_name)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_release_repos 
                ON release_repositories(release_id)
            ''')
            
            print("✅ Database schema initialized successfully")
    
    def create_release(self, release_data):
        """Create a new release"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            now = datetime.utcnow().isoformat()
            
            cursor.execute('''
                INSERT INTO releases (
                    id, team_name, app_name, release_date, dry_run_date,
                    contact_person, contact_email, additional_notes,
                    checklist, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                release_data.get('id'),
                release_data.get('teamName'),
                release_data.get('appName'),
                release_data.get('releaseDate'),
                release_data.get('dryRunDate'),
                release_data.get('contactPerson'),
                release_data.get('contactEmail'),
                release_data.get('additionalNotes'),
                json.dumps(release_data.get('checklist', {})),
                release_data.get('createdAt', now),
                now
            ))
            
            # Insert repositories if present
            if 'repositories' in release_data:
                for repo in release_data['repositories']:
                    cursor.execute('''
                        INSERT INTO release_repositories (release_id, repo_name, repo_url, created_at)
                        VALUES (?, ?, ?, ?)
                    ''', (
                        release_data.get('id'),
                        repo.get('name'),
                        repo.get('url'),
                        now
                    ))
            
            return release_data.get('id')
    
    def get_all_releases(self):
        """Get all releases"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM releases ORDER BY release_date DESC
            ''')
            
            releases = []
            for row in cursor.fetchall():
                release = self._row_to_dict(row)
                
                # Get repositories for this release
                cursor.execute('''
                    SELECT repo_name, repo_url FROM release_repositories
                    WHERE release_id = ?
                ''', (release['id'],))
                
                repos = cursor.fetchall()
                release['repositories'] = [
                    {'name': r['repo_name'], 'url': r['repo_url']} 
                    for r in repos
                ]
                
                releases.append(release)
            
            return releases
    
    def get_release_by_id(self, release_id):
        """Get a single release by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM releases WHERE id = ?', (release_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            release = self._row_to_dict(row)
            
            # Get repositories
            cursor.execute('''
                SELECT repo_name, repo_url FROM release_repositories
                WHERE release_id = ?
            ''', (release_id,))
            
            repos = cursor.fetchall()
            release['repositories'] = [
                {'name': r['repo_name'], 'url': r['repo_url']} 
                for r in repos
            ]
            
            return release
    
    def update_release(self, release_id, release_data):
        """Update an existing release"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            now = datetime.utcnow().isoformat()
            
            cursor.execute('''
                UPDATE releases SET
                    team_name = ?,
                    app_name = ?,
                    release_date = ?,
                    dry_run_date = ?,
                    contact_person = ?,
                    contact_email = ?,
                    additional_notes = ?,
                    checklist = ?,
                    updated_at = ?
                WHERE id = ?
            ''', (
                release_data.get('teamName'),
                release_data.get('appName'),
                release_data.get('releaseDate'),
                release_data.get('dryRunDate'),
                release_data.get('contactPerson'),
                release_data.get('contactEmail'),
                release_data.get('additionalNotes'),
                json.dumps(release_data.get('checklist', {})),
                now,
                release_id
            ))
            
            # Update repositories - delete old ones and insert new ones
            cursor.execute('DELETE FROM release_repositories WHERE release_id = ?', (release_id,))
            
            if 'repositories' in release_data:
                for repo in release_data['repositories']:
                    cursor.execute('''
                        INSERT INTO release_repositories (release_id, repo_name, repo_url, created_at)
                        VALUES (?, ?, ?, ?)
                    ''', (
                        release_id,
                        repo.get('name'),
                        repo.get('url'),
                        now
                    ))
            
            return cursor.rowcount > 0
    
    def delete_release(self, release_id):
        """Delete a release"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Delete repositories first (cascade should handle this, but being explicit)
            cursor.execute('DELETE FROM release_repositories WHERE release_id = ?', (release_id,))
            
            # Delete release
            cursor.execute('DELETE FROM releases WHERE id = ?', (release_id,))
            
            return cursor.rowcount > 0
    
    def _row_to_dict(self, row):
        """Convert SQLite Row to dictionary with proper field names"""
        return {
            'id': row['id'],
            'teamName': row['team_name'],
            'appName': row['app_name'],
            'releaseDate': row['release_date'],
            'dryRunDate': row['dry_run_date'],
            'contactPerson': row['contact_person'],
            'contactEmail': row['contact_email'],
            'additionalNotes': row['additional_notes'],
            'checklist': json.loads(row['checklist']) if row['checklist'] else {},
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        }
    
    def migrate_from_json(self, json_file_path):
        """Migrate data from JSON file to database"""
        if not os.path.exists(json_file_path):
            print(f"⚠️ JSON file not found: {json_file_path}")
            return 0
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                releases = json.load(f)
            
            if not isinstance(releases, list):
                print("⚠️ Invalid JSON format - expected array")
                return 0
            
            migrated = 0
            for release in releases:
                try:
                    self.create_release(release)
                    migrated += 1
                except Exception as e:
                    print(f"⚠️ Failed to migrate release {release.get('id')}: {e}")
            
            print(f"✅ Migrated {migrated} releases from JSON to database")
            return migrated
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return 0
    
    def export_to_json(self, json_file_path):
        """Export database to JSON file (for backup)"""
        try:
            releases = self.get_all_releases()
            
            with open(json_file_path, 'w', encoding='utf-8') as f:
                json.dump(releases, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Exported {len(releases)} releases to {json_file_path}")
            return len(releases)
            
        except Exception as e:
            print(f"❌ Export failed: {e}")
            return 0


# Initialize database on module import
db = ReleaseDatabase()
