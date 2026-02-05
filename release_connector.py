"""
Connector to import Release App Blueprint.
Now uses local Release-page folder with SQLite database support.
"""
import sys
import os

# Path to local Release-page folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RELEASE_APP_PATH = os.path.join(BASE_DIR, 'Release-page')

# Add the Release App folder to Python path
if os.path.exists(RELEASE_APP_PATH):
    sys.path.insert(0, RELEASE_APP_PATH)
    print(f"✅ Added Release App path: {RELEASE_APP_PATH}")
else:
    print(f"⚠️ WARNING: Release App path not found: {RELEASE_APP_PATH}")

# Import the Blueprint with database support
try:
    # Try to import database-powered routes first
    from routes_db import release_bp
    print("✅ Successfully imported Release App Blueprint (SQLite Database)")
except ImportError:
    try:
        # Fallback to JSON-based routes
        from routes import release_bp
        print("✅ Successfully imported Release App Blueprint (JSON-based)")
    except ImportError as e:
        print(f"❌ Failed to import Release App Blueprint: {e}")
        print("Make sure routes_db.py or routes.py exists in the Release-page folder")
        release_bp = None
