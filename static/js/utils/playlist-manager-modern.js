// Modern Playlist Manager with Enhanced Features

// Enhanced playlist state
const modernPlaylistState = {
    playlists: [],
    activePlaylist: null,
    nextPlaylistId: 1,
    currentView: 'all', // 'all', 'recent', 'favorites'
    sortBy: 'name', // 'name', 'date', 'tracks'
    autoSave: true
};

// Initialize modern playlist system
function initializeModernPlaylists() {
    loadPlaylistsFromStorage();
    setupPlaylistShortcuts();
    setupDragAndDrop();
    console.log('🎵 Modern playlist system initialized');
}

// Create playlist with enhanced metadata
function createModernPlaylist(name = null) {
    const playlistName = name || prompt('Enter playlist name:', `Playlist ${modernPlaylistState.nextPlaylistId}`);
    if (!playlistName) return;
    
    const playlist = {
        id: modernPlaylistState.nextPlaylistId++,
        name: playlistName.trim(),
        tracks: [],
        created: Date.now(),
        updated: Date.now(),
        coverArt: null,
        description: '',
        tags: [],
        isFavorite: false,
        playCount: 0,
        totalDuration: 0
    };
    
    modernPlaylistState.playlists.push(playlist);
    saveModernPlaylists();
    displayModernPlaylists();
    
    showModernNotification(`Created playlist "${playlist.name}"`, 'success');
    return playlist;
}

// Add track with enhanced features
function addToModernPlaylist(track, playlistId = null) {
    let playlist;
    
    if (playlistId) {
        playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    } else {
        playlist = modernPlaylistState.activePlaylist;
        if (!playlist) {
            playlist = createModernPlaylist('Quick Playlist');
            selectModernPlaylist(playlist.id);
        }
    }
    
    if (!playlist) return;
    
    // Check for duplicates
    if (playlist.tracks.find(t => t.id === track.id)) {
        showModernNotification('Track already in playlist', 'info');
        return;
    }
    
    // Add track with metadata
    const playlistTrack = {
        ...track,
        addedAt: Date.now(),
        playCount: 0,
        position: playlist.tracks.length
    };
    
    playlist.tracks.push(playlistTrack);
    playlist.updated = Date.now();
    playlist.totalDuration += track.duration || 0;
    
    // Update cover art if first track
    if (playlist.tracks.length === 1 && track.artwork) {
        playlist.coverArt = track.artwork;
    }
    
    saveModernPlaylists();
    updateModernPlaylistUI(playlist);
    showModernNotification(`Added "${track.title}" to "${playlist.name}"`, 'success');
}

// Remove track with animation
function removeFromModernPlaylist(trackId, playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const trackIndex = playlist.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;
    
    const track = playlist.tracks[trackIndex];
    
    // Animate removal
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackElement) {
        trackElement.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            playlist.tracks.splice(trackIndex, 1);
            playlist.updated = Date.now();
            playlist.totalDuration -= track.duration || 0;
            
            // Reorder remaining tracks
            playlist.tracks.forEach((t, i) => t.position = i);
            
            saveModernPlaylists();
            updateModernPlaylistUI(playlist);
        }, 300);
    } else {
        playlist.tracks.splice(trackIndex, 1);
        saveModernPlaylists();
        updateModernPlaylistUI(playlist);
    }
    
    showModernNotification(`Removed "${track.title}"`, 'info');
}

// Reorder tracks with drag and drop
function reorderModernPlaylist(playlistId, fromIndex, toIndex) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist || fromIndex === toIndex) return;
    
    const [movedTrack] = playlist.tracks.splice(fromIndex, 1);
    playlist.tracks.splice(toIndex, 0, movedTrack);
    
    // Update positions
    playlist.tracks.forEach((track, i) => track.position = i);
    playlist.updated = Date.now();
    
    saveModernPlaylists();
    updateModernPlaylistUI(playlist);
}

// Duplicate playlist
function duplicateModernPlaylist(playlistId) {
    const original = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!original) return;
    
    const duplicate = {
        ...original,
        id: modernPlaylistState.nextPlaylistId++,
        name: `${original.name} (Copy)`,
        tracks: [...original.tracks],
        created: Date.now(),
        updated: Date.now(),
        playCount: 0
    };
    
    modernPlaylistState.playlists.push(duplicate);
    saveModernPlaylists();
    displayModernPlaylists();
    
    showModernNotification(`Duplicated playlist "${original.name}"`, 'success');
}

// Export playlist
function exportModernPlaylist(playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const exportData = {
        name: playlist.name,
        description: playlist.description,
        tracks: playlist.tracks.map(t => ({
            id: t.id,
            title: t.title,
            artist: t.user?.name || t.artist,
            duration: t.duration,
            artwork: t.artwork,
            stream_url: t.stream_url
        })),
        created: playlist.created,
        totalDuration: playlist.totalDuration,
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}_playlist.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showModernNotification('Playlist exported', 'success');
}

// Import playlist
function importModernPlaylist() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            const playlist = {
                id: modernPlaylistState.nextPlaylistId++,
                name: data.name || 'Imported Playlist',
                description: data.description || '',
                tracks: data.tracks || [],
                created: Date.now(),
                updated: Date.now(),
                coverArt: data.tracks[0]?.artwork || null,
                tags: [],
                isFavorite: false,
                playCount: 0,
                totalDuration: data.totalDuration || 0
            };
            
            modernPlaylistState.playlists.push(playlist);
            saveModernPlaylists();
            displayModernPlaylists();
            
            showModernNotification(`Imported playlist "${playlist.name}"`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            showModernNotification('Failed to import playlist', 'error');
        }
    };
    
    input.click();
}

// Toggle favorite
function toggleModernPlaylistFavorite(playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    playlist.isFavorite = !playlist.isFavorite;
    playlist.updated = Date.now();
    
    saveModernPlaylists();
    displayModernPlaylists();
    
    const action = playlist.isFavorite ? 'Added to' : 'Removed from';
    showModernNotification(`${action} favorites`, 'success');
}

// Search playlists
function searchModernPlaylists(query) {
    const searchTerm = query.toLowerCase();
    
    const filtered = modernPlaylistState.playlists.filter(playlist => {
        return playlist.name.toLowerCase().includes(searchTerm) ||
               playlist.description.toLowerCase().includes(searchTerm) ||
               playlist.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
               playlist.tracks.some(track => 
                   track.title.toLowerCase().includes(searchTerm) ||
                   (track.artist || '').toLowerCase().includes(searchTerm)
               );
    });
    
    displayModernPlaylists(filtered);
}

// Sort playlists
function sortModernPlaylists(sortBy) {
    modernPlaylistState.sortBy = sortBy;
    
    const sorted = [...modernPlaylistState.playlists].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return b.updated - a.updated;
            case 'tracks':
                return b.tracks.length - a.tracks.length;
            case 'duration':
                return b.totalDuration - a.totalDuration;
            default:
                return 0;
        }
    });
    
    displayModernPlaylists(sorted);
}

// Save playlists to localStorage
function saveModernPlaylists() {
    if (!modernPlaylistState.autoSave) return;
    
    const saveData = {
        playlists: modernPlaylistState.playlists,
        nextPlaylistId: modernPlaylistState.nextPlaylistId,
        activePlaylistId: modernPlaylistState.activePlaylist?.id || null
    };
    
    localStorage.setItem('handmixed_modern_playlists', JSON.stringify(saveData));
}

// Load playlists from localStorage
function loadPlaylistsFromStorage() {
    try {
        const saved = localStorage.getItem('handmixed_modern_playlists');
        if (saved) {
            const data = JSON.parse(saved);
            modernPlaylistState.playlists = data.playlists || [];
            modernPlaylistState.nextPlaylistId = data.nextPlaylistId || 1;
            
            if (data.activePlaylistId) {
                const active = modernPlaylistState.playlists.find(p => p.id === data.activePlaylistId);
                if (active) {
                    modernPlaylistState.activePlaylist = active;
                }
            }
            
            console.log(`📋 Loaded ${modernPlaylistState.playlists.length} playlists`);
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
    }
}

// Setup keyboard shortcuts
function setupPlaylistShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    createModernPlaylist();
                    break;
                case 's':
                    e.preventDefault();
                    saveModernPlaylists();
                    showModernNotification('Playlists saved', 'success');
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('playlistSearch')?.focus();
                    break;
            }
        }
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    let draggedElement = null;
    let draggedIndex = null;
    
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('playlist-track-draggable')) {
            draggedElement = e.target;
            draggedIndex = parseInt(e.target.dataset.index);
            e.target.style.opacity = '0.5';
        }
    });
    
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('playlist-track-draggable')) {
            e.target.style.opacity = '';
        }
    });
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
        if (!draggedElement) return;
        
        const dropTarget = e.target.closest('.playlist-track-draggable');
        if (dropTarget && dropTarget !== draggedElement) {
            const dropIndex = parseInt(dropTarget.dataset.index);
            const playlistId = parseInt(dropTarget.dataset.playlistId);
            
            reorderModernPlaylist(playlistId, draggedIndex, dropIndex);
        }
        
        draggedElement = null;
        draggedIndex = null;
    });
}

// Show notification
function showModernNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `modern-notification ${type}`;
    notification.textContent = message;
    
    // Add to notification container
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModernPlaylists);
} else {
    initializeModernPlaylists();
}