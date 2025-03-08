from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SongBase(BaseModel):
    title: str
    duration: Optional[int] = 0
    file_path: Optional[str] = None

class SongCreate(SongBase):
    artist_id: int

class Song(SongBase):
    id: int
    artist_id: int
    artist: Optional['Artist'] = None

    class Config:
        from_attributes = True

class ArtistBase(BaseModel):
    name: str
    bio: Optional[str] = None

class ArtistCreate(ArtistBase):
    pass

class Artist(ArtistBase):
    id: int
    songs: List[Song] = []

    class Config:
        from_attributes = True

class PlaylistBase(BaseModel):
    title: str

class PlaylistCreate(PlaylistBase):
    pass

class Playlist(PlaylistBase):
    id: int
    user_id: int
    songs: List[Song] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str
    username: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    playlists: List[Playlist] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Avoid circular imports
Artist.update_forward_refs(Song=Song) 