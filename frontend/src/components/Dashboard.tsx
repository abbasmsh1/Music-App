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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Music App</Typography>
              <IconButton onClick={handleLogout} color="inherit">
                <Logout />
              </IconButton>
            </Box>
          </Grid>

          {/* Playlists */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
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

          {/* Songs */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
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

          {/* Player */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, position: 'fixed', bottom: 0, left: 0, right: 0 }}>
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
          </Grid>
        </Grid>
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