import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface LoginData {
    username: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
}

export interface Song {
    id: number;
    title: string;
    artist_id: number;
    duration: number;
    file_path: string;
}

export interface Artist {
    id: number;
    name: string;
    bio: string;
}

export interface Playlist {
    id: number;
    title: string;
    user_id: number;
    songs: Song[];
}

export const auth = {
    login: async (data: LoginData) => {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        const response = await api.post('/token', formData);
        return response.data;
    },
    register: async (data: RegisterData) => {
        const response = await api.post('/users/', data);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/users/me/');
        return response.data;
    },
};

export const songs = {
    getAll: async () => {
        const response = await api.get('/songs/');
        return response.data;
    },
    upload: async (formData: FormData) => {
        const response = await api.post('/songs/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export const artists = {
    getAll: async () => {
        const response = await api.get('/artists/');
        return response.data;
    },
    create: async (data: { name: string; bio: string }) => {
        const response = await api.post('/artists/', data);
        return response.data;
    },
};

export const playlists = {
    getAll: async () => {
        const response = await api.get('/playlists/');
        return response.data;
    },
    create: async (data: { title: string }) => {
        const response = await api.post('/playlists/', data);
        return response.data;
    },
    addSong: async (playlistId: number, songId: number) => {
        const response = await api.post(`/playlists/${playlistId}/songs/${songId}`);
        return response.data;
    },
}; 