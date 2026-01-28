"""Automation Utilities UI Flask app (dynamic data).

Serves the dashboard and exposes APIs to read/write utilities.

Supports per-utility JSON files under static/utilities/ and merges them

to a backward-compatible static/utilities.json on read/write.

Includes a stub to trigger a PR creation webhook for pipeline integration.

"""

import json

import os

import uuid

from datetime import datetime

from flask import Flask, render_template, send_from_directory, jsonify, request

from werkzeug.utils import secure_filename

import urllib.request

import urllib.error

import urllib.parse

# Fresh PR service (do not use any existing pr_service.py)

from services.github_pr_service import create_utility_pr

# Import Release App Blueprint from external folder

from release_connector import release_bp

 

APP_NAME = os.getenv("AUTOMATION_APP_NAME", "automation")

BASE_DIR = os.path.dirname(__file__)

STATIC_DIR = os.path.join(BASE_DIR, 'static')

UTILITIES_DIR = os.path.join(STATIC_DIR, 'utilities')

ICONS_DIR = os.path.join(STATIC_DIR, 'icons')

# Ensure icons directory exists

if not os.path.exists(ICONS_DIR):

    os.makedirs(ICONS_DIR)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}

 

app = Flask(__name__,

            static_url_path=f"/{APP_NAME}/static",

            static_folder="static",

            template_folder="templates")

 

# Register Release App Blueprint (if successfully imported)

if release_bp is not None:

    app.register_blueprint(release_bp, url_prefix=f"/{APP_NAME}/CDMS-Releases")

    print("✅ Release App integrated at /automation/CDMS-Releases")

else:

    print("⚠️ Release App not available - update path in release_connector.py")

 

@app.route("/")

@app.route(f"/{APP_NAME}")

@app.route(f"/{APP_NAME}/home.html")

def index():

    return render_template('index.html', app_name=APP_NAME)

 

@app.route(f"/{APP_NAME}/add")

def add_utility_form():

    repo_url = os.getenv('AUTON_REPO_URL', '')

    return render_template('add_utility.html', app_name=APP_NAME, repo_url=repo_url)

 

def _ensure_dirs():

    os.makedirs(UTILITIES_DIR, exist_ok=True)

 

def _normalize_item(item: dict) -> dict:

    # Map utility_tools_number -> mcp_tools_number to keep frontend compatible

    if 'utility_tools_number' in item and 'mcp_tools_number' not in item:

        item['mcp_tools_number'] = item['utility_tools_number']

    return item

 

def _read_per_utility_files() -> list:

    """Read all JSON files from static/utilities and return list of objects."""

    _ensure_dirs()

    items = []

    for name in sorted(os.listdir(UTILITIES_DIR)):

        if not name.lower().endswith('.json'):

            continue

        path = os.path.join(UTILITIES_DIR, name)

        try:

            with open(path, 'r', encoding='utf-8') as f:

                obj = json.load(f)

                if isinstance(obj, dict):

                    items.append(_normalize_item(obj))

        except Exception:

            # Skip malformed files

            continue

    return items

 

def _current_branch() -> str:

    """Return current git branch name if available, else empty string."""

    try:

        # Read from .git/HEAD for speed and no subprocess

        repo_root = os.path.abspath(os.path.join(BASE_DIR, os.pardir))

        head_path = os.path.join(repo_root, '.git', 'HEAD')

        with open(head_path, 'r', encoding='utf-8') as f:

            head = f.read().strip()

        if head.startswith('ref: '):

            ref = head.split(' ', 1)[1]

            return os.path.basename(ref)

        return ''

    except Exception:

        return ''

 

def _refresh_repo_if_on_target(target_branch: str) -> None:

    """If the server is running from the target branch, perform a lightweight pull.

    This enables near real-time updates after merges without restarting the app.

    Controlled by AUTON_REFRESH_ON_GET (default: true).

    """

    refresh_flag = os.getenv('AUTON_REFRESH_ON_GET', 'true').lower() in ('1', 'true', 'yes')

    if not refresh_flag:

        return

    try:

        current = _current_branch()

        if current and current == target_branch:

            import subprocess

            repo_root = os.path.abspath(os.path.join(BASE_DIR, os.pardir))

            # Fetch and fast-forward pull; ignore output/errors (best-effort)

            subprocess.run(['git', '--no-pager', '-C', repo_root, 'fetch', 'origin', target_branch],

                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)

            subprocess.run(['git', '--no-pager', '-C', repo_root, 'pull', '--ff-only'],

                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)

    except Exception:

        # Non-fatal; just skip refresh

        pass

 

def _get_last_commit_message() -> str:

    """Return the last git commit subject if available; else empty string.

    Works when the app is running from a checked-out repo. In containers without git,

    falls back gracefully.

    """

    try:

        import subprocess

        repo_root = os.path.abspath(os.path.join(BASE_DIR, os.pardir))

        out = subprocess.check_output(['git', '--no-pager', '-C', repo_root, 'log', '-1', '--pretty=%s'],

                                      stderr=subprocess.STDOUT)

        msg = out.decode('utf-8', errors='ignore').strip()

        return msg

    except Exception:

        return ''

 

def _write_merged_utilities(items: list) -> None:

    """No-op: merged utilities.json is deprecated; per-file JSONs are authoritative."""

    return None

 

def _load_utilities_merged() -> list:

    """Only read per-utility files from utilities/ folder."""

    return _read_per_utility_files()

 

def _validate_new_utility(payload: dict):

    required = ['title','description','committer','server_url','source_code_url','playbook']

    missing = [f for f in required if not payload.get(f)]

    if missing:

        return False, f"Missing required field(s): {', '.join(missing)}"

    # Validate JSON in config field

    return True, ''

 

def _auto_icon_url(payload: dict) -> str:

    """Decide icon_url if missing based on type or source_language."""

    icon = (payload.get('icon_url') or '').strip()

    if icon:

        return icon

    # Heuristics

    type_val = (payload.get('type') or '').lower()

    lang_val = (payload.get('source_language') or '').lower()

    if 'ci/cd' in type_val:

        return 'static/jenkins.svg'

    if 'mcp' in type_val:

        return 'static/mcphub.png'

    if 'python' in lang_val:

        return 'static/python.svg'

    # Default placeholder

    return 'static/placeholder.svg'

 

def _generate_id(existing_ids: set, title: str) -> str:

    # Try a slug from title, fallback to UUID

    base = (title or '').strip().lower().replace(' ', '-')[:40] or str(uuid.uuid4())

    candidate = base

    i = 1

    while candidate in existing_ids:

        candidate = f"{base}-{i}"

        i += 1

    return candidate

 

def _sanitize_filename(title: str) -> str:

    """Convert utility title to a safe filename."""

    # Remove or replace unsafe characters

    safe_title = title.lower()

    safe_title = safe_title.replace(' ', '_')

    safe_title = ''.join(c for c in safe_title if c.isalnum() or c in ('_', '-'))

    # Limit length

    safe_title = safe_title[:100]

    return safe_title



def _write_per_utility_file(item: dict) -> str:

    """Persist single utility JSON file under static/utilities/<title>.json."""

    _ensure_dirs()

    # Use sanitized title as filename

    safe_title = _sanitize_filename(item.get('title', item['id']))

    filename = f"{safe_title}.json"

    path = os.path.join(UTILITIES_DIR, filename)

    with open(path, 'w', encoding='utf-8') as f:

        json.dump(item, f, indent=2)

    return filename

 

def _trigger_pr_stub(branch: str, files_changed: list, author: str):

    """Stub: record a PR trigger event; in CI this can call a webhook or git CLI."""

    from datetime import UTC

    event = {

        'action': 'create_pr',

        'target_branch': branch,

        'files_changed': files_changed,

        'author': author,

        'timestamp': datetime.now(UTC).isoformat()

    }

    # Write an event log under static for visibility (non-secret info only)

    try:

        with open(os.path.join(STATIC_DIR, 'last_pr_event.json'), 'w', encoding='utf-8') as f:

            json.dump(event, f, indent=2)

    except Exception:

        pass

 

def _send_ci_webhook(event: dict):

    """Optionally send a webhook to CI to create/update a PR.

    Controlled by env AUTON_PR_WEBHOOK_URL and AUTON_PR_WEBHOOK_TOKEN (optional).

    """

    url = os.getenv('AUTON_PR_WEBHOOK_URL')

    if not url:

        return False, 'Webhook URL not configured'

    token = os.getenv('AUTON_PR_WEBHOOK_TOKEN')

    headers = {'Content-Type': 'application/json'}

    if token:

        headers['Authorization'] = f'Bearer {token}'

    data = json.dumps(event).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:

        with urllib.request.urlopen(req, timeout=10) as resp:

            status = resp.getcode()

            return (200 <= status < 300), f'Webhook status {status}'

    except urllib.error.HTTPError as e:

        return False, f'Webhook HTTP error {e.code}: {e.read().decode(errors="ignore")}'

    except Exception as e:

        return False, f'Webhook error: {e}'

 

@app.route(f"/{APP_NAME}/api/utilities", methods=['GET','POST'])

def get_or_create_utilities():

    if request.method == 'GET':

        # Return the merged list of utilities

        try:

            # Best-effort repo refresh to surface merged changes without restart

            target_branch = os.getenv('AUTON_TARGET_BRANCH', 'CDMS-6962')

            _refresh_repo_if_on_target(target_branch)

            data = _load_utilities_merged()

            data = [_normalize_item(d) for d in data]

            return jsonify(data), 200

        except Exception as e:

            return jsonify({'error': str(e)}), 500

    # POST: create a new utility entry

    try:

        new_util = request.get_json(force=True)

        if not isinstance(new_util, dict):

            return jsonify({'error': 'Invalid payload'}), 400

        ok, err = _validate_new_utility(new_util)

        if not ok:

            return jsonify({'error': err}), 400

        new_util['icon_url'] = _auto_icon_url(new_util)

        existing = _load_utilities_merged()

        existing_ids = {str(u.get('id')) for u in existing if u.get('id')}

        new_id = new_util.get('id') or _generate_id(existing_ids, new_util.get('title', ''))

        while new_id in existing_ids:

            new_id = f"{new_id}-{uuid.uuid4().hex[:6]}"

        new_util['id'] = new_id

        if 'utility_tools_number' not in new_util and 'mcp_tools_number' in new_util:

            new_util['utility_tools_number'] = new_util['mcp_tools_number']

    except Exception as e:

        import traceback

        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

 

    # Defer writing to local dashboard; changes via PR service only

    source_branch = os.getenv('AUTON_SOURCE_BRANCH', 'utility-test')

    target_branch = os.getenv('AUTON_TARGET_BRANCH', 'CDMS-6962')

    author = str(new_util.get('committer') or 'unknown')

    files_changed = [f"automation_ui/static/utilities/{new_id}.json"]

    _trigger_pr_stub(target_branch, files_changed, author)

 

    # Derive commit message for PR title: prefer last commit; fallback to utility title

    commit_title = f"CDMS-6962:{new_util.get('title') or new_id}"

 

    # Create PR using fresh GitHub PR logic

    try:

        pr_result = create_utility_pr(new_util=new_util,

                                      new_id=new_id,

                                      file_rel_path=files_changed[0],

                                      source_branch=source_branch,

                                      target_branch=target_branch,

                                      commit_message=commit_title)

    except Exception as e:

        pr_result = {'ok': False, 'error': str(e)}

 

    # Persist a diagnostic snapshot of PR steps to static for quick inspection

    try:

        diag = {

            'status': 'pr_attempt',

            'id': new_id,

            'file': files_changed[0],

            'source_branch': source_branch,

            'target_branch': target_branch,

            'timestamp': datetime.utcnow().isoformat() + 'Z',

            'pr_result': pr_result

        }

        with open(os.path.join(STATIC_DIR, 'last_pr_event.json'), 'w', encoding='utf-8') as f:

            json.dump(diag, f, indent=2)

    except Exception:

        pass

 

    # Optional webhook for CI orchestration

    repo_url = os.getenv('AUTON_REPO_URL', 'https://alm-github.systems.uk.hsbc/GDT-CDMS/automation_utilities')

    pr_event = {

        'action': 'create_pr',

        'target_branch': target_branch,

        'source_branch': source_branch,

        'repository': repo_url,

        'files_changed': files_changed,

        'commit_message': commit_title,

        'author': author,

        'utility': new_util

    }

    webhook_ok, webhook_msg = _send_ci_webhook(pr_event)

 

    # Shape the response to include PR steps and any errors for UI/diagnostics

    return jsonify({'status': 'submitted-for-review',

                    'id': new_id,

                    'file': files_changed[0],

                    'source_branch': source_branch,

                    'target_branch': target_branch,

                    'files_changed': files_changed,

                    'repository': repo_url,

                    'commit_message': commit_title,

                    'pr': {

                        'ok': pr_result.get('ok', False),

                        'error': pr_result.get('error'),

                        'steps': pr_result.get('steps', []),

                        'pr': pr_result.get('pr'),

                        'pr_raw': pr_result.get('pr_raw')

                    },

                    'webhook': {'ok': webhook_ok, 'message': webhook_msg}}), 201

 

# Icon upload endpoint removed

 

@app.route(f"/{APP_NAME}/api/pr/trigger", methods=['POST'])

def trigger_pr():

    """Optional endpoint to be called by UI or CI to trigger PR creation.

    This is a stub that records the intent. Wire this to your pipeline.

    """

    payload = request.get_json(force=True) or {}

    branch = payload.get('branch') or os.getenv('AUTOMATION_PR_BRANCH', 'DataP_automation_utility_dashboard')

    files = payload.get('files_changed') or []

    author = payload.get('author') or 'unknown'

    _trigger_pr_stub(branch, files, author)

    return jsonify({'status': 'queued', 'branch': branch, 'files_changed': files}), 202

 

@app.route(f"/{APP_NAME}/static/<path:filename>")

def static_proxy(filename):

    return send_from_directory(app.static_folder, filename)

 

def _load_utilities():

    # Legacy helper kept for details view; now delegates to merged loader

    return _load_utilities_merged()

 

@app.route(f"/{APP_NAME}/api/utilities/<utility_id>", methods=['PUT'])

def update_utility(utility_id: str):

    """Update an existing utility and create a PR with the changes."""

    try:

        update_data = request.get_json(force=True)

        if not isinstance(update_data, dict):

            return jsonify({'error': 'Invalid payload'}), 400

        # Validate required fields

        ok, err = _validate_new_utility(update_data)

        if not ok:

            return jsonify({'error': err}), 400

        # Ensure the ID matches

        update_data['id'] = utility_id

        # Auto-set icon if missing

        update_data['icon_url'] = _auto_icon_url(update_data)

        # Prepare for PR creation

        source_branch = os.getenv('AUTON_SOURCE_BRANCH', 'utility-test')

        target_branch = os.getenv('AUTON_TARGET_BRANCH', 'CDMS-6962')

        author = str(update_data.get('committer') or 'unknown')

        files_changed = [f"automation_ui/static/utilities/{utility_id}.json"]

        # Commit message for update

        commit_title = f"CDMS-6962:EDIT:{update_data.get('title') or utility_id}"

        # Create PR using GitHub PR service

        try:

            pr_result = create_utility_pr(new_util=update_data,

                                          new_id=utility_id,

                                          file_rel_path=files_changed[0],

                                          source_branch=source_branch,

                                          target_branch=target_branch,

                                          commit_message=commit_title)

        except Exception as e:

            pr_result = {'ok': False, 'error': str(e)}

        # Save diagnostic info

        try:

            diag = {

                'status': 'pr_update_attempt',

                'id': utility_id,

                'file': files_changed[0],

                'source_branch': source_branch,

                'target_branch': target_branch,

                'timestamp': datetime.utcnow().isoformat() + 'Z',

                'pr_result': pr_result

            }

            with open(os.path.join(STATIC_DIR, 'last_pr_event.json'), 'w', encoding='utf-8') as f:

                json.dump(diag, f, indent=2)

        except Exception:

            pass

        repo_url = os.getenv('AUTON_REPO_URL', 'https://alm-github.systems.uk.hsbc/GDT-CDMS/automation_utilities')

        return jsonify({'status': 'updated',

                        'id': utility_id,

                        'file': files_changed[0],

                        'source_branch': source_branch,

                        'target_branch': target_branch,

                        'repository': repo_url,

                        'commit_message': commit_title,

                        'pr': {

                            'ok': pr_result.get('ok', False),

                            'error': pr_result.get('error'),

                            'steps': pr_result.get('steps', []),

                            'pr': pr_result.get('pr'),

                            'pr_raw': pr_result.get('pr_raw')

                        }}), 200

    except Exception as e:

        import traceback

        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

 

@app.route(f"/{APP_NAME}/utility/<utility_id>")

def utility_details(utility_id: str):

    data = _load_utilities()

    util = None

    for item in data:

        if str(item.get('id')) == utility_id or item.get('title') == utility_id:

            util = item

            break

    return render_template('utility_details.html', utility=util, app_name=APP_NAME)



def allowed_file(filename):

    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.route(f"/{APP_NAME}/api/upload-icon", methods=['POST'])

def upload_icon():

    """Handle icon image upload and return the URL."""

    if 'icon' not in request.files:

        return jsonify({'error': 'No file provided'}), 400

    

    file = request.files['icon']

    

    if file.filename == '':

        return jsonify({'error': 'No file selected'}), 400

    

    if not allowed_file(file.filename):

        return jsonify({'error': 'Invalid file type. Only PNG, JPG, and SVG are allowed.'}), 400

    

    try:

        # Generate unique filename

        filename = secure_filename(file.filename)

        name, ext = os.path.splitext(filename)

        unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"

        

        # Save file

        filepath = os.path.join(ICONS_DIR, unique_filename)

        file.save(filepath)

        

        # Return URL relative to static directory

        icon_url = f"static/icons/{unique_filename}"

        

        return jsonify({

            'success': True,

            'url': icon_url,

            'filename': unique_filename

        }), 200

    

    except Exception as e:

        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

 

if __name__ == '__main__':

    port = int(os.getenv('PORT', 8200))

    app.run(host='0.0.0.0', port=port, debug=True)