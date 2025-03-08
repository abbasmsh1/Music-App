from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import requests
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # for session management
API_URL = 'http://localhost:8000'

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'token' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_api_headers():
    return {'Authorization': f'Bearer {session["token"]}'}

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
    app.run(debug=True, port=3000) 