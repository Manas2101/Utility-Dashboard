"""
Database-powered routes for Release Calendar
Replaces JSON file storage with SQLite database
"""

from flask import Blueprint, send_from_directory, send_file, jsonify, request
import os
import json
from database import db

# Create Blueprint
release_bp = Blueprint('release', __name__,
                       template_folder='.',
                       static_folder='.')

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_HTML = 'index.html'
RELEASES_FILE = os.path.join(BASE_DIR, 'releases.json')

@release_bp.route('/')
def health_check():
    """Health check endpoint - serves the main HTML"""
    print("🔍 Release page accessed")
    return send_file(os.path.join(BASE_DIR, INDEX_HTML))

@release_bp.route('/status')
def app_status():
    """Status endpoint to verify app is running"""
    return jsonify({
        "status": "healthy",
        "app": "CDMS-Releases",
        "message": "Release Manager Portal is running",
        "database": "SQLite"
    })

@release_bp.route('/api/releases', methods=['GET'])
def get_releases():
    """Get all releases from database"""
    try:
        releases = db.get_all_releases()
        print(f"📖 Loaded {len(releases)} releases from database")
        return jsonify(releases)
    except Exception as e:
        print(f"❌ Error reading releases: {e}")
        return jsonify({"error": f"Failed to read releases: {str(e)}"}), 500

@release_bp.route('/api/releases/<release_id>', methods=['GET'])
def get_release(release_id):
    """Get a single release by ID"""
    try:
        release = db.get_release_by_id(release_id)
        if release:
            return jsonify(release)
        else:
            return jsonify({"error": "Release not found"}), 404
    except Exception as e:
        print(f"❌ Error reading release: {e}")
        return jsonify({"error": f"Failed to read release: {str(e)}"}), 500

@release_bp.route('/api/releases', methods=['POST'])
def create_release():
    """Create a new release in database"""
    try:
        release_data = request.get_json()
        
        if not isinstance(release_data, dict):
            return jsonify({"error": "Invalid data format. Expected release object."}), 400
        
        # Validate required fields
        required_fields = ['id', 'teamName', 'appName', 'releaseDate']
        missing_fields = [field for field in required_fields if not release_data.get(field)]
        
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Create release
        release_id = db.create_release(release_data)
        
        print(f"✅ Created release: {release_id}")
        return jsonify({
            "success": True,
            "message": "Release created successfully",
            "id": release_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating release: {e}")
        return jsonify({"error": f"Failed to create release: {str(e)}"}), 500

@release_bp.route('/api/releases/<release_id>', methods=['PUT'])
def update_release(release_id):
    """Update an existing release"""
    try:
        release_data = request.get_json()
        
        if not isinstance(release_data, dict):
            return jsonify({"error": "Invalid data format. Expected release object."}), 400
        
        # Update release
        success = db.update_release(release_id, release_data)
        
        if success:
            print(f"✅ Updated release: {release_id}")
            return jsonify({
                "success": True,
                "message": "Release updated successfully",
                "id": release_id
            })
        else:
            return jsonify({"error": "Release not found"}), 404
        
    except Exception as e:
        print(f"❌ Error updating release: {e}")
        return jsonify({"error": f"Failed to update release: {str(e)}"}), 500

@release_bp.route('/api/releases/<release_id>', methods=['DELETE'])
def delete_release(release_id):
    """Delete a release"""
    try:
        success = db.delete_release(release_id)
        
        if success:
            print(f"✅ Deleted release: {release_id}")
            return jsonify({
                "success": True,
                "message": "Release deleted successfully"
            })
        else:
            return jsonify({"error": "Release not found"}), 404
        
    except Exception as e:
        print(f"❌ Error deleting release: {e}")
        return jsonify({"error": f"Failed to delete release: {str(e)}"}), 500

@release_bp.route('/api/releases/bulk', methods=['POST'])
def save_releases_bulk():
    """Bulk save releases (for backward compatibility with JSON-based frontend)"""
    try:
        releases_data = request.get_json()
        
        if not isinstance(releases_data, list):
            return jsonify({"error": "Invalid data format. Expected array of releases."}), 400
        
        # Clear existing releases and insert new ones
        # This is a destructive operation - use with caution
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM release_repositories')
            cursor.execute('DELETE FROM releases')
        
        # Insert all releases
        created_count = 0
        for release in releases_data:
            try:
                db.create_release(release)
                created_count += 1
            except Exception as e:
                print(f"⚠️ Failed to create release {release.get('id')}: {e}")
        
        print(f"✅ Bulk saved {created_count} releases to database")
        return jsonify({
            "success": True,
            "message": f"Successfully saved {created_count} releases",
            "count": created_count
        })
        
    except Exception as e:
        print(f"❌ Error bulk saving releases: {e}")
        return jsonify({"error": f"Failed to save releases: {str(e)}"}), 500

@release_bp.route('/api/releases/export', methods=['GET'])
def export_releases():
    """Export all releases to JSON format"""
    try:
        releases = db.get_all_releases()
        return jsonify({
            "success": True,
            "data": releases,
            "count": len(releases)
        })
    except Exception as e:
        print(f"❌ Error exporting releases: {e}")
        return jsonify({"error": f"Failed to export releases: {str(e)}"}), 500

@release_bp.route('/api/releases/backup', methods=['GET'])
def get_backup():
    """Get backup by exporting current database to JSON"""
    try:
        # Export current database state
        backup_file = RELEASES_FILE + '.backup'
        count = db.export_to_json(backup_file)
        
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        return jsonify(backup_data)
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        return jsonify({"error": "Failed to create backup"}), 500

@release_bp.route('/api/migrate', methods=['POST'])
def migrate_from_json():
    """Migrate data from JSON file to database"""
    try:
        count = db.migrate_from_json(RELEASES_FILE)
        return jsonify({
            "success": True,
            "message": f"Migrated {count} releases from JSON to database",
            "count": count
        })
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return jsonify({"error": f"Migration failed: {str(e)}"}), 500

@release_bp.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    try:
        return send_from_directory(BASE_DIR, filename)
    except FileNotFoundError:
        # If file not found, serve the main HTML (for SPA behavior)
        return send_file(os.path.join(BASE_DIR, INDEX_HTML))
