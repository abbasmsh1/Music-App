from pydantic import BaseModel
from typing import List, Optional

class SongBase(BaseModel):
    title: str
    duration: int

class SongCreate(SongBase):
    artist_id: int

class Song(SongBase):
    id: int
    artist_id: int
    file_path: str

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

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    playlists: List[Playlist] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 