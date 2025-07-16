// Modern Playlist UI Functions

// Display playlists in sidebar
function displayModernPlaylists(playlists = null) {
    const container = document.getElementById('playlistContent');
    if (!container) return;
    
    const playlistsToShow = playlists || modernPlaylistState.playlists;
    
    if (playlistsToShow.length === 0) {
        container.innerHTML = `
            <div class="music-empty-modern">
                <div class="music-empty-icon">📋</div>
                <div class="music-empty-text">No playlists yet</div>
                <div class="music-empty-subtext">Create your first playlist</div>
                <button class="modern-btn primary" onclick="createModernPlaylist()">
                    Create Playlist
                </button>
            </div>
        `;
        return;
    }
    
    const html = playlistsToShow.map(playlist => {
        const isActive = modernPlaylistState.activePlaylist?.id === playlist.id;
        const duration = formatDuration(playlist.totalDuration);
        
        return `
            <div class="playlist-item-modern ${isActive ? 'active' : ''}" data-playlist-id="${playlist.id}">
                <div class="playlist-cover">
                    ${playlist.coverArt ? 
                        `<img src="${playlist.coverArt}" alt="${playlist.name}">` :
                        `<div class="playlist-cover-placeholder">🎵</div>`
                    }
                    <div class="playlist-play-overlay" onclick="selectModernPlaylist(${playlist.id})">
                        <span>▶</span>
                    </div>
                </div>
                
                <div class="playlist-info">
                    <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                    <div class="playlist-meta">
                        <span>${playlist.tracks.length} tracks</span>
                        <span>•</span>
                        <span>${duration}</span>
                    </div>
                </div>
                
                <div class="playlist-actions">
                    <button class="playlist-action-icon ${playlist.isFavorite ? 'active' : ''}" 
                            onclick="toggleModernPlaylistFavorite(${playlist.id})"
                            title="Favorite">
                        ${playlist.isFavorite ? '❤️' : '🤍'}
                    </button>
                    <div class="playlist-dropdown">
                        <button class="playlist-action-icon" onclick="togglePlaylistMenu(${playlist.id})">⋮</button>
                        <div class="playlist-dropdown-menu" id="playlistMenu${playlist.id}">
                            <div class="playlist-menu-item" onclick="editModernPlaylist(${playlist.id})">
                                ✏️ Edit
                            </div>
                            <div class="playlist-menu-item" onclick="duplicateModernPlaylist(${playlist.id})">
                                📋 Duplicate
                            </div>
                            <div class="playlist-menu-item" onclick="exportModernPlaylist(${playlist.id})">
                                📤 Export
                            </div>
                            <div class="playlist-menu-item danger" onclick="deleteModernPlaylist(${playlist.id})">
                                🗑️ Delete
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Update playlist UI after changes
function updateModernPlaylistUI(playlist) {
    if (!playlist) return;
    
    // Update sidebar if visible
    const sidebarItem = document.querySelector(`[data-playlist-id="${playlist.id}"]`);
    if (sidebarItem) {
        displayModernPlaylists();
    }
    
    // Update active playlist view if selected
    if (modernPlaylistState.activePlaylist?.id === playlist.id) {
        displayModernPlaylistTracks(playlist);
    }
}

// Display playlist tracks
function displayModernPlaylistTracks(playlist) {
    const container = document.getElementById('musicContent');
    if (!container) return;
    
    if (playlist.tracks.length === 0) {
        container.innerHTML = `
            <div class="music-empty-modern">
                <div class="music-empty-icon">🎵</div>
                <div class="music-empty-text">This playlist is empty</div>
                <div class="music-empty-subtext">Add some tracks to get started</div>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="playlist-header-content">
            <h2>${escapeHtml(playlist.name)}</h2>
            <p>${playlist.tracks.length} tracks • ${formatDuration(playlist.totalDuration)}</p>
        </div>
        
        <div class="playlist-tracks-modern">
            ${playlist.tracks.map((track, index) => `
                <div class="playlist-track-modern playlist-track-draggable" 
                     data-track-id="${track.id}"
                     data-playlist-id="${playlist.id}"
                     data-index="${index}"
                     draggable="true">
                    
                    <div class="track-number">${index + 1}</div>
                    
                    <div class="track-artwork-small">
                        ${track.artwork ? 
                            `<img src="${track.artwork._480x480 || track.artwork}" alt="${track.title}">` :
                            `<div class="track-artwork-placeholder">🎵</div>`
                        }
                    </div>
                    
                    <div class="track-info-playlist">
                        <div class="track-name">${escapeHtml(track.title)}</div>
                        <div class="track-artist">${escapeHtml(track.user?.name || track.artist || 'Unknown')}</div>
                    </div>
                    
                    <div class="track-duration">${formatTime(track.duration)}</div>
                    
                    <div class="track-actions">
                        <button class="track-action-btn" onclick="loadTrackToDeck(${index})" title="Load to deck">
                            📀
                        </button>
                        <button class="track-action-btn" onclick="removeFromModernPlaylist('${track.id}', ${playlist.id})" title="Remove">
                            ❌
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Update current tracks for deck loading
    appState.currentTracks = playlist.tracks;
}

// Select playlist
function selectModernPlaylist(playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    modernPlaylistState.activePlaylist = playlist;
    playlist.playCount++;
    
    displayModernPlaylists();
    displayModernPlaylistTracks(playlist);
    
    showModernNotification(`Selected "${playlist.name}"`, 'success');
}

// Edit playlist
function editModernPlaylist(playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const newName = prompt('Edit playlist name:', playlist.name);
    if (newName && newName !== playlist.name) {
        playlist.name = newName.trim();
        playlist.updated = Date.now();
        
        saveModernPlaylists();
        displayModernPlaylists();
        
        showModernNotification('Playlist renamed', 'success');
    }
}

// Delete playlist
function deleteModernPlaylist(playlistId) {
    const playlist = modernPlaylistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    if (confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) {
        const index = modernPlaylistState.playlists.findIndex(p => p.id === playlistId);
        modernPlaylistState.playlists.splice(index, 1);
        
        if (modernPlaylistState.activePlaylist?.id === playlistId) {
            modernPlaylistState.activePlaylist = null;
            document.getElementById('musicContent').innerHTML = `
                <div class="music-empty-modern">
                    <div class="music-empty-icon">🎵</div>
                    <div class="music-empty-text">Select a playlist</div>
                </div>
            `;
        }
        
        saveModernPlaylists();
        displayModernPlaylists();
        
        showModernNotification(`Deleted "${playlist.name}"`, 'info');
    }
}

// Toggle playlist menu
function togglePlaylistMenu(playlistId) {
    const menu = document.getElementById(`playlistMenu${playlistId}`);
    if (!menu) return;
    
    // Close all other menus
    document.querySelectorAll('.playlist-dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    
    menu.classList.toggle('active');
    
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!e.target.closest('.playlist-dropdown')) {
                menu.classList.remove('active');
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 10);
}

// Helper functions
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(seconds) {
    if (!seconds) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS for playlist UI
const playlistStyles = document.createElement('style');
playlistStyles.textContent = `
    /* Playlist Items */
    .playlist-item-modern {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .playlist-item-modern:hover {
        background: rgba(0, 0, 0, 0.4);
    }
    
    .playlist-item-modern.active {
        background: rgba(0, 212, 255, 0.1);
        border: 1px solid var(--primary-blue);
    }
    
    .playlist-cover {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
    }
    
    .playlist-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .playlist-cover-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .playlist-play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity var(--transition-fast);
    }
    
    .playlist-item-modern:hover .playlist-play-overlay {
        opacity: 1;
    }
    
    .playlist-info {
        flex: 1;
        min-width: 0;
    }
    
    .playlist-name {
        font-weight: 500;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .playlist-meta {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .playlist-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity var(--transition-fast);
    }
    
    .playlist-item-modern:hover .playlist-actions {
        opacity: 1;
    }
    
    .playlist-action-icon {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all var(--transition-fast);
    }
    
    .playlist-action-icon:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .playlist-dropdown {
        position: relative;
    }
    
    .playlist-dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-active);
        border-radius: 8px;
        padding: 8px;
        min-width: 150px;
        box-shadow: var(--shadow-large);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all var(--transition-fast);
        z-index: 1000;
    }
    
    .playlist-dropdown-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .playlist-menu-item {
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .playlist-menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .playlist-menu-item.danger {
        color: var(--status-error);
    }
    
    /* Playlist Tracks */
    .playlist-tracks-modern {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .playlist-track-modern {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        transition: all var(--transition-fast);
    }
    
    .playlist-track-modern:hover {
        background: rgba(0, 0, 0, 0.4);
    }
    
    .playlist-track-draggable {
        cursor: move;
    }
    
    .playlist-track-draggable.dragging {
        opacity: 0.5;
    }
    
    .track-number {
        width: 24px;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
    }
    
    .track-artwork-small {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
    }
    
    .track-artwork-small img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .track-info-playlist {
        flex: 1;
        min-width: 0;
    }
    
    .track-duration {
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-family: 'Roboto Mono', monospace;
    }
    
    .track-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity var(--transition-fast);
    }
    
    .playlist-track-modern:hover .track-actions {
        opacity: 1;
    }
    
    .track-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all var(--transition-fast);
    }
    
    .track-action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    /* Animations */
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
    
    /* Notifications */
    .modern-notification {
        background: var(--bg-card);
        border: 1px solid var(--border-active);
        border-radius: 8px;
        padding: 12px 20px;
        color: var(--text-primary);
        font-size: 0.9rem;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        min-width: 250px;
        box-shadow: var(--shadow-medium);
    }
    
    .modern-notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .modern-notification.success {
        border-color: var(--status-active);
        background: rgba(0, 255, 136, 0.1);
    }
    
    .modern-notification.error {
        border-color: var(--status-error);
        background: rgba(255, 51, 102, 0.1);
    }
    
    .modern-notification.info {
        border-color: var(--primary-blue);
        background: rgba(0, 212, 255, 0.1);
    }
`;

document.head.appendChild(playlistStyles);