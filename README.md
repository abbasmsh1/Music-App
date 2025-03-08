# Music App

A modern web-based music application with social features, built with Flask and FastAPI.

## Features

### Core Features
- 🎵 Music playback with player controls
- 📁 Playlist management
- 🎨 Modern, responsive UI
- 🎨 Beautiful visualizations
- 🔍 Search functionality

### User Features
- 👤 User registration and authentication
- 📝 Create and manage playlists
- 🎵 Upload and manage songs
- 🔄 Drag and drop playlist organization

### Social Features
- 👥 Find and connect with other users
- 🎧 Listen Together - synchronized music sessions
- 👀 View other users' public playlists
- 🔄 Real-time session updates

### Admin Features
- 👮 Admin dashboard
- 👥 User management
- 🎵 Song management
- 🎨 Artist management
- 📊 System monitoring

## Technical Stack

### Frontend
- Flask (Web Framework)
- HTML5 & CSS3
- JavaScript (ES6+)
- WebSocket (Flask-SocketIO)
- Material Icons
- CSS Grid & Flexbox

### Backend
- FastAPI (API Server)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- WebSocket (Flask-SocketIO)
- JWT Authentication

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
# Create a .env file with:
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost/dbname
```

3. Initialize the database:
```bash
python backend/init_db.py
```

4. Start the API server:
```bash
uvicorn backend.main:app --reload --port 8000
```

5. Start the Flask server:
```bash
python frontend/app.py
```

## Dependencies

```
flask==2.0.1
flask-socketio==5.3.6
python-socketio==5.9.0
python-engineio==4.8.0
requests==2.26.0
python-dotenv==0.19.0
```

## Usage

### Regular User Features

1. **Account Management**
   - Register a new account
   - Login with credentials
   - Manage profile settings

2. **Music Management**
   - Upload songs
   - Create playlists
   - Add/remove songs from playlists
   - Organize playlists with drag and drop

3. **Social Features**
   - Browse other users
   - View public playlists
   - Start listening sessions
   - Join active sessions

4. **Playback Features**
   - Play/pause songs
   - Skip tracks
   - Adjust volume
   - View progress
   - Enable/disable shuffle and repeat

### Listen Together Feature

1. **Starting a Session**
   - Navigate to "Find Users"
   - Select a user
   - Click "Listen Together"
   - Choose a playlist
   - Start the session

2. **During a Session**
   - Host controls playback
   - All participants see current song
   - Real-time progress updates
   - Chat with session participants
   - Individual volume control

3. **Session Management**
   - Join existing sessions
   - Leave sessions
   - View participant list
   - See real-time updates

### Admin Features

1. **Accessing Admin Panel**
   - Login with admin credentials
   - Navigate to admin dashboard

2. **User Management**
   - View all users
   - Toggle user status
   - Delete users
   - Search users

3. **Content Management**
   - Manage songs
   - Manage artists
   - Handle uploads
   - Monitor system

## Development

### Project Structure
```
music_app/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── database.py
├── frontend/
│   ├── app.py
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   └── templates/
└── requirements.txt
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material Icons for the UI elements
- Flask and FastAPI communities
- Contributors and testers 