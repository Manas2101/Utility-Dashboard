"""Fresh GitHub PR service for utilities submissions.

Commits a new per-utility JSON file into source_branch and opens a PR to target_branch.

Strict visibility: dashboard reads only merged utilities.json, so utilities appear

only after PR merge.

"""

import os

import json

import subprocess

from typing import Tuple, Dict, Optional

import tempfile

import shutil

import base64

 

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))

STATIC_DIR = os.path.join(BASE_DIR, 'static')

UTILITIES_DIR = os.path.join(STATIC_DIR, 'utilities')

 

def _run(cmd: str, cwd: str = REPO_ROOT) -> Tuple[bool, str]:

    try:

        out = subprocess.check_output(cmd, cwd=cwd, shell=True, stderr=subprocess.STDOUT)

        return True, out.decode('utf-8', errors='ignore').strip()

    except subprocess.CalledProcessError as e:

        return False, e.output.decode('utf-8', errors='ignore').strip()

    except FileNotFoundError as e:

        # git may not be installed in the container

        return False, str(e)

 

def _ensure_dirs():

    os.makedirs(UTILITIES_DIR, exist_ok=True)

 

def _slugify(title: str) -> str:

    return (title or '').strip().lower().replace(' ', '-')[:60]

 

def _write_per_utility_json(file_rel_path: str, content: dict):

    _ensure_dirs()

    abs_path = os.path.join(REPO_ROOT, file_rel_path)

    with open(abs_path, 'w', encoding='utf-8') as f:

        json.dump(content, f, indent=2)

 

# No merged regeneration; per-file JSONs are authoritative.

 

def _github_headers(token: str) -> Dict[str, str]:

    # Classic tokens with repo access supported; prefer token format unless PAT detected

    auth_header = (

        f"Bearer {token}" if token.startswith('ghp_') or token.startswith('github_pat_') else f"token {token}"

    )

    return {

        'Authorization': auth_header,

        'Accept': 'application/vnd.github.v3+json',

        'User-Agent': 'automation-utilities-dashboard',

        'X-GitHub-Api-Version': '2022-11-28',

        'Content-Type': 'application/json',

    }

 

def _parse_repo(url: str) -> Tuple[str, str, str]:

    # Returns (api_base, owner, repo)

    url = url.rstrip('/')

    parts = url.split('/')

    owner = parts[-2]

    repo = parts[-1].replace('.git', '')

    api_base = os.environ.get('GITHUB_API_BASE', 'https://alm-github.systems.uk.hsbc')

    # Normalize to API base if needed; for GHE, POST /api/v3/repos/{owner}/{repo}/pulls

    return api_base, owner, repo

 

def _http_post(url: str, headers: Dict[str, str], body: dict) -> Tuple[bool, str]:

    import urllib.request

    import urllib.error

    data = json.dumps(body).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:

        with urllib.request.urlopen(req, timeout=20) as resp:

            return True, resp.read().decode('utf-8', errors='ignore')

    except urllib.error.HTTPError as e:

        return False, e.read().decode('utf-8', errors='ignore')

    except Exception as e:

        return False, str(e)

 

def _http_get(url: str, headers: Dict[str, str]) -> Tuple[bool, str]:

    import urllib.request

    import urllib.error

    req = urllib.request.Request(url, headers=headers, method='GET')

    try:

        with urllib.request.urlopen(req, timeout=20) as resp:

            return True, resp.read().decode('utf-8', errors='ignore')

    except urllib.error.HTTPError as e:

        return False, e.read().decode('utf-8', errors='ignore')

    except Exception as e:

        return False, str(e)

 

def _http_put(url: str, headers: Dict[str, str], body: dict) -> Tuple[bool, str]:

    import urllib.request

    import urllib.error

    data = json.dumps(body).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method='PUT')

    try:

        with urllib.request.urlopen(req, timeout=20) as resp:

            return True, resp.read().decode('utf-8', errors='ignore')

    except urllib.error.HTTPError as e:

        return False, e.read().decode('utf-8', errors='ignore')

    except Exception as e:

        return False, str(e)

 

def create_utility_pr(new_util: dict, new_id: str, file_rel_path: str, source_branch: str, target_branch: str, commit_message: Optional[str] = None) -> dict:

    """Commit new utility JSON into source_branch and open PR to target_branch.

    Requires SERVICE_GITHUB_TOKEN or GITHUB_TOKEN and AUTON_REPO_URL env.

    """

    result = {'ok': True, 'steps': []}

 

    def step(msg: str, ok: bool, out: str = ''):

        result['steps'].append({'step': msg, 'ok': ok, 'out': out})

        if not ok:

            result['ok'] = False

 

    repo_url = os.getenv('AUTON_REPO_URL', '')

    token = os.environ.get('SERVICE_GITHUB_TOKEN') or os.environ.get('GITHUB_TOKEN') or ''

    if not repo_url:

        return {'ok': False, 'error': 'AUTON_REPO_URL not configured'}

    if not token:

        return {'ok': False, 'error': 'SERVICE_GITHUB_TOKEN/GITHUB_TOKEN not configured'}

 

    # Detect whether we have a usable local git repo (.git present and git works)

    git_dir_present = os.path.isdir(os.path.join(REPO_ROOT, '.git'))

    ok_git, out_git = _run('git status') if git_dir_present else (False, 'no .git directory')

    step('git status (probe)', ok_git, out_git)

 

    use_git_flow = ok_git and git_dir_present

 

    if use_git_flow:

        # Fetch latest refs

        ok, out = _run('git fetch origin --prune')

        step('git fetch', ok, out)

        if not ok:

            use_git_flow = False

    else:

        step('git disabled', False, 'falling back to API-only flow')

 

    # Create a unique branch name per utility

    unique_branch = f"{source_branch}-{new_id}"

 

    api_base, owner, repo = _parse_repo(repo_url)

    headers = _github_headers(token)

    # Use provided commit_message for both commit and PR title when available; fallback to default

    commit_msg = commit_message or f"chore: add utility {new_util.get('title','')} ({new_id})"

 

    if use_git_flow:

        # Use a temporary worktree to avoid switching the server's current branch

        temp_dir = tempfile.mkdtemp(prefix='util-worktree-')

        worktree_added = False

        try:

            # Ensure base branch exists locally; if not, try to track remote

            ok_base, out_base = _run(f'git rev-parse --verify {source_branch}')

            if not ok_base:

                _run(f'git fetch origin {source_branch}')

                ok_track, out_track = _run(f'git branch --track {source_branch} origin/{source_branch}')

                step('create local tracking branch', ok_track, out_track)

 

            # Create unique branch from base

            ok_branch, out_branch = _run(f'git branch -f {unique_branch} {source_branch}')

            step('create unique source branch', ok_branch, out_branch)

            if not ok_branch:

                shutil.rmtree(temp_dir, ignore_errors=True)

                return result

 

            ok_wt, out_wt = _run(f'git worktree add "{temp_dir}" {unique_branch}')

            step('git worktree add', ok_wt, out_wt)

            if not ok_wt:

                shutil.rmtree(temp_dir, ignore_errors=True)

                return result

            worktree_added = True

 

            # Paths relative to worktree root

            wt_file_abs = os.path.join(temp_dir, file_rel_path)

            os.makedirs(os.path.dirname(wt_file_abs), exist_ok=True)

 

            # Write per-utility JSON in worktree

            try:

                with open(wt_file_abs, 'w', encoding='utf-8') as f:

                    json.dump(new_util, f, indent=2)

                step('write per-utility json', True, wt_file_abs)

            except Exception as e:

                step('write per-utility json', False, str(e))

                return result

 

            # Stage and commit in worktree

            ok_add, out_add = _run(f'git -C "{temp_dir}" add "{file_rel_path}"')

            step('git add (worktree)', ok_add, out_add)

            if not ok_add:

                return result

 

            ok_commit, out_commit = _run(

                f'git -C "{temp_dir}" diff --cached --quiet || git -C "{temp_dir}" -c user.name="automation" -c user.email="automation@example" commit -m "{commit_msg}"'

            )

            step('git commit (worktree)', ok_commit, out_commit)

            if not ok_commit:

                return result

 

            # Push unique source branch from worktree

            ok_push, out_push = _run(f'git -C "{temp_dir}" push -u origin {unique_branch}')

            step('git push (worktree)', ok_push, out_push)

            if not ok_push:

                # Handle non-fast-forward by attempting fetch and force-with-lease

                if 'non-fast-forward' in (out_push or '') or 'failed to push some refs' in (out_push or ''):

                    _run(f'git -C "{temp_dir}" fetch origin {unique_branch}')

                    ok_force, out_force = _run(f'git -C "{temp_dir}" push --force-with-lease -u origin {unique_branch}')

                    step('git push --force-with-lease (worktree)', ok_force, out_force)

                    if not ok_force:

                        # If force push disallowed by server policy, create a new branch name and push that

                        if 'force-pushing' in (out_force or '') or 'pre-receive hook declined' in (out_force or ''):

                            import time

                            new_branch = f"{unique_branch}-{int(time.time())}"

                            ok_new, out_new = _run(f'git -C "{temp_dir}" branch -f {new_branch}')

                            step('create alternate branch name', ok_new, out_new)

                            if not ok_new:

                                return result

                            ok_set, out_set = _run(f'git -C "{temp_dir}" checkout {new_branch}')

                            step('switch worktree to alternate branch', ok_set, out_set)

                            if not ok_set:

                                return result

                            ok_push2, out_push2 = _run(f'git -C "{temp_dir}" push -u origin {new_branch}')

                            step('git push (alternate branch)', ok_push2, out_push2)

                            if not ok_push2:

                                return result

                            # Update head branch reference for PR creation

                            unique_branch = new_branch

                        else:

                            return result

                else:

                    return result

        finally:

            if worktree_added:

                _run(f'git worktree remove "{temp_dir}" --force')

            shutil.rmtree(temp_dir, ignore_errors=True)

 

        # Do NOT write to or commit in the app's local working copy.

        # Visibility must only change after PR merge into target_branch.

        step('skip local write/commit', True, 'no changes to running repo')

    else:

        # API-only flow: create branch from target, commit file via contents API, then open PR

        # 1) Get target branch ref

        refs_base = f"{api_base}/api/v3" if 'api/v3' not in api_base else api_base

        ref_url = f"{refs_base}/repos/{owner}/{repo}/git/ref/heads/{target_branch}"

        ok_ref, out_ref = _http_get(ref_url, headers)

        step('get base ref', ok_ref, out_ref)

        if not ok_ref:

            return result

        try:

            ref_data = json.loads(out_ref)

            base_sha = ref_data.get('object', {}).get('sha') or ref_data.get('sha')

        except Exception:

            base_sha = None

        if not base_sha:

            step('parse base ref sha', False, out_ref)

            return result

 

        # 2) Create new branch ref

        create_ref_url = f"{refs_base}/repos/{owner}/{repo}/git/refs"

        ok_cr, out_cr = _http_post(create_ref_url, headers, {

            'ref': f'refs/heads/{unique_branch}',

            'sha': base_sha

        })

        step('create branch ref', ok_cr, out_cr)

        if not ok_cr and 'Reference already exists' not in out_cr:

            return result

 

        # 3) Check if file exists to get SHA (required for updates)

        contents_url = f"{refs_base}/repos/{owner}/{repo}/contents/{file_rel_path}"

        file_sha = None

        ok_get, out_get = _http_get(f"{contents_url}?ref={unique_branch}", headers)

        if ok_get:

            try:

                existing_file = json.loads(out_get)

                file_sha = existing_file.get('sha')

                step('get existing file sha', True, f"sha: {file_sha}")

            except Exception:

                step('get existing file sha', False, 'file may not exist yet')

        else:

            step('get existing file sha', False, 'file does not exist, will create new')

        

        # 4) Commit file via contents API

        encoded = base64.b64encode(json.dumps(new_util, indent=2).encode('utf-8')).decode('utf-8')

        commit_body = {

            'message': commit_msg,

            'content': encoded,

            'branch': unique_branch,

            'committer': {'name': 'automation', 'email': 'automation@example'}

        }

        

        # Include SHA if file exists (required for updates)

        if file_sha:

            commit_body['sha'] = file_sha

        

        ok_put, out_put = _http_put(contents_url, headers, commit_body)

        step('commit file (contents API)', ok_put, out_put)

        if not ok_put:

            return result

 

    # Create PR to target_branch

    pr_title = commit_msg

    pr_body = 'Automated submission from Utilities Dashboard. Please review and merge.'

 

    # GHE v3 API path

    # Support GitHub.com as well as GHE; build API path accordingly

    pr_base = f"{api_base}/api/v3" if 'api/v3' not in api_base else api_base

    pr_url = f"{pr_base}/repos/{owner}/{repo}/pulls"

    body = {

        'title': pr_title,

        'head': unique_branch,

        'base': target_branch,

        'body': pr_body,

        'maintainer_can_modify': True,

        'draft': False

    }

    ok, out = _http_post(pr_url, headers, body)

    step('create PR', ok, out)

    if not ok:

        return result

 

    # Attach PR metadata if available

    try:

        data = json.loads(out)

        result['pr'] = {

            'url': data.get('html_url') or data.get('url'),

            'number': data.get('number'),

            'head': data.get('head', {}).get('ref'),

            'base': data.get('base', {}).get('ref')

        }

    except Exception:

        result['pr_raw'] = out

 

    return result

