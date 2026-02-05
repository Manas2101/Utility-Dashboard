#!/usr/bin/env python3
"""
Database initialization and migration script for Release Calendar

Usage:
    python init_db.py              # Initialize empty database
    python init_db.py --migrate    # Migrate from releases.json
    python init_db.py --export     # Export database to JSON
    python init_db.py --reset      # Reset database (WARNING: deletes all data)
"""

import os
import sys
import argparse
from database import ReleaseDatabase

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'releases.json')
DB_FILE = os.path.join(BASE_DIR, 'releases.db')


def init_database():
    """Initialize a fresh database"""
    print("🔧 Initializing database...")
    db = ReleaseDatabase()
    print("✅ Database initialized successfully!")
    print(f"📍 Database location: {DB_FILE}")
    return db


def migrate_from_json():
    """Migrate data from JSON to database"""
    print("🔄 Starting migration from JSON to SQLite...")
    
    if not os.path.exists(JSON_FILE):
        print(f"❌ JSON file not found: {JSON_FILE}")
        print("💡 Create a releases.json file or skip migration")
        return
    
    db = ReleaseDatabase()
    count = db.migrate_from_json(JSON_FILE)
    
    if count > 0:
        print(f"✅ Successfully migrated {count} releases!")
        
        # Create backup of JSON file
        backup_file = JSON_FILE + '.migrated_backup'
        import shutil
        shutil.copy2(JSON_FILE, backup_file)
        print(f"💾 Created backup: {backup_file}")
    else:
        print("⚠️ No releases migrated")


def export_to_json():
    """Export database to JSON"""
    print("📤 Exporting database to JSON...")
    
    db = ReleaseDatabase()
    export_file = os.path.join(BASE_DIR, 'releases_export.json')
    count = db.export_to_json(export_file)
    
    if count > 0:
        print(f"✅ Exported {count} releases to {export_file}")
    else:
        print("⚠️ No releases to export")


def reset_database():
    """Reset database (delete and recreate)"""
    print("⚠️  WARNING: This will delete all data in the database!")
    confirm = input("Type 'YES' to confirm: ")
    
    if confirm != 'YES':
        print("❌ Reset cancelled")
        return
    
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print("🗑️  Deleted existing database")
    
    db = ReleaseDatabase()
    print("✅ Database reset complete!")


def show_stats():
    """Show database statistics"""
    if not os.path.exists(DB_FILE):
        print("❌ Database not found. Run with --init first.")
        return
    
    db = ReleaseDatabase()
    releases = db.get_all_releases()
    
    print("\n" + "="*50)
    print("📊 DATABASE STATISTICS")
    print("="*50)
    print(f"Total Releases: {len(releases)}")
    
    if releases:
        # Group by team
        teams = {}
        for release in releases:
            team = release.get('teamName', 'Unknown')
            teams[team] = teams.get(team, 0) + 1
        
        print(f"\nReleases by Team:")
        for team, count in sorted(teams.items()):
            print(f"  - {team}: {count}")
        
        # Recent releases
        print(f"\nMost Recent Releases:")
        for release in releases[:5]:
            print(f"  - {release['appName']} ({release['releaseDate']})")
    
    print("="*50 + "\n")


def main():
    parser = argparse.ArgumentParser(description='Release Calendar Database Manager')
    parser.add_argument('--init', action='store_true', help='Initialize database')
    parser.add_argument('--migrate', action='store_true', help='Migrate from releases.json')
    parser.add_argument('--export', action='store_true', help='Export database to JSON')
    parser.add_argument('--reset', action='store_true', help='Reset database (deletes all data)')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')
    
    args = parser.parse_args()
    
    # If no arguments, show help
    if len(sys.argv) == 1:
        print("🗄️  Release Calendar Database Manager\n")
        init_database()
        show_stats()
        return
    
    if args.reset:
        reset_database()
    elif args.init:
        init_database()
    elif args.migrate:
        migrate_from_json()
    elif args.export:
        export_to_json()
    elif args.stats:
        show_stats()


if __name__ == '__main__':
    main()
