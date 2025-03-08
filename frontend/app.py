from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import requests
from functools import wraps
import os
from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.secret_key = os.urandom(24)  # for session management
socketio = SocketIO(app)
API_URL = 'http://localhost:8000'

# Admin credentials (in a real app, these should be in a secure config/database)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"  # In production, use a strong hashed password

# Store active listening sessions
listening_sessions = {}

# Custom filters
@app.template_filter('zfill')
def zfill_filter(value, width):
    return str(value).zfill(width)

@app.template_filter('format_date')
def format_date_filter(value, format='%Y-%m-%d'):
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return 'N/A'
    if isinstance(value, datetime):
        return value.strftime(format)
    return 'N/A'

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'token' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def get_api_headers():
    # For admin routes, use admin authentication
    if 'admin' in session:
        return {'X-Admin-Key': ADMIN_PASSWORD}  # Use admin password as API key
    # For regular user routes
    if 'token' in session:
        return {'Authorization': f'Bearer {session["token"]}'}
    return {}

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = {
            'username': request.form['username'],
            'password': request.form['password']
        }
        try:
            response = requests.post(f'{API_URL}/token', data=data)
            if response.status_code == 200:
                token_data = response.json()
                session['token'] = token_data['access_token']
                return redirect(url_for('dashboard'))
            else:
                return render_template('login.html', error='Invalid credentials')
        except requests.RequestException:
            return render_template('login.html', error='Server error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = {
            'email': request.form['email'],
            'username': request.form['username'],
            'password': request.form['password']
        }
        try:
            response = requests.post(f'{API_URL}/users/', json=data)
            if response.status_code == 200:
                return redirect(url_for('login'))
            else:
                return render_template('register.html', error='Registration failed')
        except requests.RequestException:
            return render_template('register.html', error='Server error')
    return render_template('register.html')

@app.route('/')
@login_required
def dashboard():
    headers = get_api_headers()
    try:
        songs = requests.get(f'{API_URL}/songs/', headers=headers).json()
        playlists = requests.get(f'{API_URL}/playlists/', headers=headers).json()
        return render_template('dashboard.html', songs=songs, playlists=playlists)
    except requests.RequestException:
        return render_template('dashboard.html', error='Failed to load data')

@app.route('/playlist/<int:playlist_id>')
@login_required
def playlist(playlist_id):
    headers = get_api_headers()
    try:
        playlist_data = requests.get(f'{API_URL}/playlists/{playlist_id}', headers=headers).json()
        playlists = requests.get(f'{API_URL}/playlists/', headers=headers).json()
        available_songs = requests.get(f'{API_URL}/songs/', headers=headers).json()
        return render_template('playlist.html', 
                             playlist=playlist_data, 
                             playlists=playlists,
                             available_songs=available_songs)
    except requests.RequestException as e:
        return render_template('error.html', 
                             error_code=404,
                             error_message='Playlist not found')

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    headers = get_api_headers()
    if request.method == 'POST':
        try:
            file = request.files['file']
            data = {
                'title': request.form['title'],
                'artist_id': request.form['artist_id']
            }
            files = {
                'file': (file.filename, file.stream, file.content_type)
            }
            response = requests.post(f'{API_URL}/songs/', 
                                   data=data,
                                   files=files,
                                   headers=headers)
            if response.status_code == 200:
                return redirect(url_for('dashboard'))
            else:
                flash('Failed to upload song', 'error')
        except requests.RequestException:
            flash('Server error', 'error')
    
    try:
        playlists = requests.get(f'{API_URL}/playlists/', headers=headers).json()
        artists = requests.get(f'{API_URL}/artists/', headers=headers).json()
        return render_template('upload.html', 
                             playlists=playlists,
                             artists=artists)
    except requests.RequestException:
        return render_template('error.html',
                             error_code=500,
                             error_message='Failed to load data')

@app.route('/create_playlist', methods=['POST'])
@login_required
def create_playlist():
    data = {'title': request.form['title']}
    headers = get_api_headers()
    try:
        response = requests.post(f'{API_URL}/playlists/', 
                               json=data,
                               headers=headers)
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to create playlist'}), 500

@app.route('/playlist/<int:playlist_id>/songs/<int:song_id>', methods=['POST', 'DELETE'])
@login_required
def manage_playlist_songs(playlist_id, song_id):
    headers = get_api_headers()
    try:
        if request.method == 'POST':
            response = requests.post(
                f'{API_URL}/playlists/{playlist_id}/songs/{song_id}',
                headers=headers
            )
        else:
            response = requests.delete(
                f'{API_URL}/playlists/{playlist_id}/songs/{song_id}',
                headers=headers
            )
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/logout')
def logout():
    session.pop('token', None)
    return redirect(url_for('login'))

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error='Invalid credentials')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin', None)
    return redirect(url_for('admin_login'))

@app.route('/admin')
@admin_required
def admin_dashboard():
    headers = get_api_headers()
    try:
        songs = requests.get(f'{API_URL}/songs/', headers=headers).json()
        artists = requests.get(f'{API_URL}/artists/', headers=headers).json()
        users = requests.get(f'{API_URL}/users/', headers=headers).json()
        active_tab = request.args.get('tab', 'songs')
        return render_template('admin_dashboard.html', 
                             songs=songs, 
                             artists=artists,
                             users=users,
                             active_tab=active_tab)
    except requests.RequestException as e:
        return render_template('error.html', 
                             error_code=500,
                             error_message='Failed to load data')

@app.route('/admin/songs/<int:song_id>', methods=['DELETE'])
@admin_required
def delete_song(song_id):
    headers = get_api_headers()
    try:
        response = requests.delete(f'{API_URL}/songs/{song_id}', headers=headers)
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to delete song'}), 500

@app.route('/admin/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    headers = get_api_headers()
    try:
        response = requests.post(
            f'{API_URL}/users/{user_id}/toggle-status',
            headers=headers
        )
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to update user status'}), 500

@app.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    headers = get_api_headers()
    try:
        response = requests.delete(
            f'{API_URL}/users/{user_id}',
            headers=headers
        )
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to delete user'}), 500

@app.route('/admin/artists', methods=['POST'])
@admin_required
def create_artist():
    headers = get_api_headers()
    try:
        response = requests.post(
            f'{API_URL}/artists/',
            json=request.json,
            headers=headers
        )
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to create artist'}), 500

@app.route('/admin/artists/<int:artist_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required
def manage_artist(artist_id):
    headers = get_api_headers()
    try:
        if request.method == 'GET':
            response = requests.get(
                f'{API_URL}/artists/{artist_id}',
                headers=headers
            )
        elif request.method == 'PUT':
            response = requests.put(
                f'{API_URL}/artists/{artist_id}',
                json=request.json,
                headers=headers
            )
        else:  # DELETE
            response = requests.delete(
                f'{API_URL}/artists/{artist_id}',
                headers=headers
            )
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': f'Failed to {request.method.lower()} artist'}), 500

@app.route('/users')
@login_required
def users():
    headers = get_api_headers()
    try:
        users = requests.get(f'{API_URL}/users/', headers=headers).json()
        playlists = requests.get(f'{API_URL}/playlists/', headers=headers).json()
        return render_template('users.html', users=users, playlists=playlists)
    except requests.RequestException:
        return render_template('error.html', 
                             error_code=500,
                             error_message='Failed to load users')

@app.route('/listening-session/create', methods=['POST'])
@login_required
def create_listening_session():
    data = request.json
    playlist_id = data.get('playlist_id')
    target_user = data.get('target_user')
    
    if not playlist_id or not target_user:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Generate a unique session ID
    session_id = os.urandom(16).hex()
    
    # Store session information
    listening_sessions[session_id] = {
        'host_user': session.get('username'),
        'target_user': target_user,
        'playlist_id': playlist_id,
        'current_song': None,
        'is_playing': False,
        'position': 0
    }
    
    return jsonify({'session_id': session_id})

@app.route('/listening-session/<session_id>')
@login_required
def listening_session(session_id):
    if session_id not in listening_sessions:
        return render_template('error.html',
                             error_code=404,
                             error_message='Session not found')
    
    session_data = listening_sessions[session_id]
    headers = get_api_headers()
    
    try:
        playlist = requests.get(
            f'{API_URL}/playlists/{session_data["playlist_id"]}',
            headers=headers
        ).json()
        
        return render_template('listening_session.html',
                             session=session_data,
                             playlist=playlist,
                             current_song=session_data['current_song'],
                             is_host=session.get('username') == session_data['host_user'])
    except requests.RequestException:
        return render_template('error.html',
                             error_code=500,
                             error_message='Failed to load session data')

# WebSocket event handlers
@socketio.on('connect', namespace='/ws/session')
def handle_connect():
    session_id = request.args.get('session_id')
    if session_id in listening_sessions:
        join_room(session_id)
        emit('user_joined', {
            'username': session.get('username')
        }, room=session_id)

@socketio.on('disconnect', namespace='/ws/session')
def handle_disconnect():
    session_id = request.args.get('session_id')
    if session_id in listening_sessions:
        leave_room(session_id)
        emit('user_left', {
            'username': session.get('username')
        }, room=session_id)

@socketio.on('play', namespace='/ws/session')
def handle_play(data):
    session_id = data.get('session_id')
    if session_id in listening_sessions:
        session_data = listening_sessions[session_id]
        if session.get('username') == session_data['host_user']:
            session_data['is_playing'] = True
            emit('play', {
                'song_id': session_data['current_song'],
                'position': session_data['position']
            }, room=session_id)

@socketio.on('pause', namespace='/ws/session')
def handle_pause(data):
    session_id = data.get('session_id')
    if session_id in listening_sessions:
        session_data = listening_sessions[session_id]
        if session.get('username') == session_data['host_user']:
            session_data['is_playing'] = False
            emit('pause', room=session_id)

@socketio.on('seek', namespace='/ws/session')
def handle_seek(data):
    session_id = data.get('session_id')
    position = data.get('position')
    if session_id in listening_sessions:
        session_data = listening_sessions[session_id]
        if session.get('username') == session_data['host_user']:
            session_data['position'] = position
            emit('seek', {'position': position}, room=session_id)

@socketio.on('next', namespace='/ws/session')
def handle_next(data):
    session_id = data.get('session_id')
    if session_id in listening_sessions:
        session_data = listening_sessions[session_id]
        if session.get('username') == session_data['host_user']:
            emit('next', room=session_id)

@socketio.on('previous', namespace='/ws/session')
def handle_previous(data):
    session_id = data.get('session_id')
    if session_id in listening_sessions:
        session_data = listening_sessions[session_id]
        if session.get('username') == session_data['host_user']:
            emit('previous', room=session_id)

@app.errorhandler(404)
def not_found_error(error):
    return render_template('error.html',
                         error_code=404,
                         error_message='Page not found'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html',
                         error_code=500,
                         error_message='Internal server error'), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, port=3000) 