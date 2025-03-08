from flask import Flask, render_template, request, jsonify, redirect, url_for, session
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
    headers = {'Authorization': f'Bearer {session["token"]}'}
    try:
        songs = requests.get(f'{API_URL}/songs/', headers=headers).json()
        playlists = requests.get(f'{API_URL}/playlists/', headers=headers).json()
        return render_template('dashboard.html', songs=songs, playlists=playlists)
    except requests.RequestException:
        return render_template('dashboard.html', error='Failed to load data')

@app.route('/create_playlist', methods=['POST'])
@login_required
def create_playlist():
    data = {'title': request.form['title']}
    headers = {'Authorization': f'Bearer {session["token"]}'}
    try:
        response = requests.post(f'{API_URL}/playlists/', json=data, headers=headers)
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({'error': 'Failed to create playlist'}), 500

@app.route('/logout')
def logout():
    session.pop('token', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, port=3000) 