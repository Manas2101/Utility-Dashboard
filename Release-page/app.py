from flask import Flask, send_from_directory, send_file, jsonify, request

import os

import json

 

app = Flask(__name__)

 

# Get the directory where this script is located

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INDEX_HTML = 'index.html'

RELEASES_FILE = os.path.join(BASE_DIR, 'releases.json')

 

@app.route('/CDMS-Releases/')

def health_check():

    """Health check endpoint for AppRunner - serves the main HTML"""

    print("🔍 Health check called by AppRunner")

    return send_file(os.path.join(BASE_DIR, INDEX_HTML))

 

@app.route('/CDMS-Releases/status')

def app_status():

    """Status endpoint to verify app is running"""

    return jsonify({

        "status": "healthy",

        "app": "CDMS-Releases",

        "message": "Release Manager Portal is running"

    })

 

@app.route('/api/releases', methods=['GET'])

def get_releases():

    """Get all releases from releases.json"""

    try:

        if os.path.exists(RELEASES_FILE):

            with open(RELEASES_FILE, 'r', encoding='utf-8') as f:

                releases = json.load(f)

            print(f"📖 Loaded {len(releases)} releases from file")

            return jsonify(releases)

        else:

            print("📄 No releases.json file found, returning empty array")

            return jsonify([])

    except Exception as e:

        print(f"❌ Error reading releases: {e}")

        return jsonify({"error": "Failed to read releases"}), 500

 

@app.route('/api/releases', methods=['POST'])

def save_releases():

    """Save releases data to releases.json"""

    try:

        releases_data = request.get_json()

       

        if not isinstance(releases_data, list):

            return jsonify({"error": "Invalid data format. Expected array of releases."}), 400

       

        # Backup existing file

        if os.path.exists(RELEASES_FILE):

            backup_file = RELEASES_FILE + '.backup'

            with open(RELEASES_FILE, 'r', encoding='utf-8') as src:

                with open(backup_file, 'w', encoding='utf-8') as dst:

                    dst.write(src.read())

            print(f"💾 Created backup: {backup_file}")

       

        # Write new data

        with open(RELEASES_FILE, 'w', encoding='utf-8') as f:

            json.dump(releases_data, f, indent=2, ensure_ascii=False)

       

        print(f"✅ Saved {len(releases_data)} releases to file")

        return jsonify({

            "success": True,

            "message": f"Successfully saved {len(releases_data)} releases",

            "count": len(releases_data)

        })

       

    except Exception as e:

        print(f"❌ Error saving releases: {e}")

        return jsonify({"error": f"Failed to save releases: {str(e)}"}), 500

 

@app.route('/api/releases/backup', methods=['GET'])

def get_backup():

    """Get the backup releases file"""

    try:

        backup_file = RELEASES_FILE + '.backup'

        if os.path.exists(backup_file):

            with open(backup_file, 'r', encoding='utf-8') as f:

                backup_data = json.load(f)

            return jsonify(backup_data)

        else:

            return jsonify({"error": "No backup file found"}), 404

    except Exception as e:

        print(f"❌ Error reading backup: {e}")

        return jsonify({"error": "Failed to read backup"}), 500

 

@app.route('/')

def root():

    """Root endpoint - also serves the main HTML"""

    return send_file(os.path.join(BASE_DIR, INDEX_HTML))

 

@app.route('/<path:filename>')

def serve_static(filename):

    """Serve static files (CSS, JS, etc.)"""

    try:

        return send_from_directory(BASE_DIR, filename)

    except FileNotFoundError:

        # If file not found, serve the main HTML (for SPA behavior)

        return send_file(os.path.join(BASE_DIR, INDEX_HTML))

 

if __name__ == '__main__':

    # For local development

    print("🚀 Starting CDMS-Releases server...")

    print("📍 Health check endpoint: http://localhost:5000/CDMS-Releases/")

    print("📍 Status endpoint: http://localhost:5000/CDMS-Releases/status")

    print("📍 Main app: http://localhost:5000/")

    app.run(host='0.0.0.0', port=5000, debug=True)