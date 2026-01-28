"""
Connector to import Release App Blueprint from external folder.
Update RELEASE_APP_PATH to point to your mentor's Release App folder.
"""
import sys
import os

# UPDATE THIS PATH to point to your mentor's Release App folder on company system
# Example: RELEASE_APP_PATH = r"C:\Users\YourName\Projects\Release-App"
# or: RELEASE_APP_PATH = "/home/yourname/projects/Release-App"
RELEASE_APP_PATH = "/path/to/your/Release-App"  # CHANGE THIS!

# Add the Release App folder to Python path
if os.path.exists(RELEASE_APP_PATH):
    sys.path.insert(0, RELEASE_APP_PATH)
    print(f"✅ Added Release App path: {RELEASE_APP_PATH}")
else:
    print(f"⚠️ WARNING: Release App path not found: {RELEASE_APP_PATH}")
    print("Please update RELEASE_APP_PATH in release_connector.py")

# Import the Blueprint (will work after path is added)
try:
    from routes import release_bp
    print("✅ Successfully imported Release App Blueprint")
except ImportError as e:
    print(f"❌ Failed to import Release App Blueprint: {e}")
    print("Make sure routes.py exists in the Release App folder")
    release_bp = None
