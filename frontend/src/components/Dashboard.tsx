import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Add,
  Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { songs, playlists, Song, Playlist } from '../services/api';
import MusicVisualizer from './MusicVisualizer';

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

function Dashboard({ setIsAuthenticated }: DashboardProps) {
  const navigate = useNavigate();
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsData, playlistsData] = await Promise.all([
          songs.getAll(),
          playlists.getAll(),
        ]);
        setSongsList(songsData);
        setUserPlaylists(playlistsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSongSelect = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handleCreatePlaylist = async () => {
    try {
      const newPlaylist = await playlists.create({ title: newPlaylistName });
      setUserPlaylists([...userPlaylists, newPlaylist]);
      setOpenDialog(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Music App</Typography>
          <IconButton onClick={handleLogout} color="inherit">
            <Logout />
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* Left Sidebar - Playlists */}
          <Grid item xs={12} md={2}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Your Playlists</Typography>
                <IconButton onClick={() => setOpenDialog(true)}>
                  <Add />
                </IconButton>
              </Box>
              <List>
                {userPlaylists.map((playlist) => (
                  <ListItem key={playlist.id} button>
                    <ListItemText primary={playlist.title} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Center - Visualizer */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'hidden' }}>
              <MusicVisualizer audioUrl={currentSong?.file_path} />
            </Paper>
          </Grid>

          {/* Right Sidebar - Songs */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" mb={2}>All Songs</Typography>
              <List>
                {songsList.map((song) => (
                  <ListItem
                    key={song.id}
                    button
                    selected={currentSong?.id === song.id}
                    onClick={() => handleSongSelect(song)}
                  >
                    <ListItemText
                      primary={song.title}
                      secondary={`Duration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Player Controls */}
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="center">
            <IconButton>
              <SkipPrevious />
            </IconButton>
            <IconButton onClick={handlePlayPause}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton>
              <SkipNext />
            </IconButton>
            <Box ml={2}>
              {currentSong ? (
                <Typography variant="subtitle1">
                  Now Playing: {currentSong.title}
                </Typography>
              ) : (
                <Typography variant="subtitle1">
                  Select a song to play
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Create Playlist Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePlaylist} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 