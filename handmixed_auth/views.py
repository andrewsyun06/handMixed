# handmixed_auth/views.py - Updated to include BPM data from Audius
import json
import logging
import requests

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)

def home(request):
    """Main landing page - show login if not authenticated"""
    if not request.user.is_authenticated:
        return render(request, 'handmixed_auth/login.html')
    return render(request, 'handmixed_auth/studio_fullscreen.html')

def login_view(request):
    """Simple demo login"""
    try:
        user, created = User.objects.get_or_create(
            username='demo_dj',
            defaults={
                'email': 'demo@handmixed.com',
                'first_name': 'Demo DJ'
            }
        )
        login(request, user)
        return redirect('home')
    except Exception as e:
        logger.error(f"Login error: {e}")
        return render(request, 'handmixed_auth/error.html', {'error': 'Login failed'})

def logout_view(request):
    """Logout view"""
    logout(request)
    return redirect('home')

def error_view(request):
    """Error page"""
    return render(request, 'handmixed_auth/error.html')

# Audius API Configuration
AUDIUS_API_BASE = 'https://discoveryprovider.audius.co'

def extract_bpm_from_track(track):
    """Extract BPM from Audius track metadata"""
    # Try different possible BPM field names in Audius API
    bpm = None
    
    # Check common BPM field names
    bpm_fields = ['bpm', 'tempo', 'beats_per_minute', 'track_bpm']
    
    for field in bpm_fields:
        if field in track and track[field]:
            try:
                bpm = float(track[field])
                if 60 <= bpm <= 200:  # Reasonable BPM range
                    break
            except (ValueError, TypeError):
                continue
    
    # If no BPM found in direct fields, check nested metadata
    if not bpm:
        # Check in track metadata
        metadata = track.get('metadata', {})
        if isinstance(metadata, dict):
            for field in bpm_fields:
                if field in metadata and metadata[field]:
                    try:
                        bpm = float(metadata[field])
                        if 60 <= bpm <= 200:
                            break
                    except (ValueError, TypeError):
                        continue
    
    # If still no BPM, check in track_segments or analysis
    if not bpm:
        # Some APIs store BPM in analysis data
        analysis = track.get('analysis', {}) or track.get('audio_features', {})
        if isinstance(analysis, dict):
            tempo = analysis.get('tempo') or analysis.get('bpm')
            if tempo:
                try:
                    bpm = float(tempo)
                    if not (60 <= bpm <= 200):
                        bpm = None
                except (ValueError, TypeError):
                    pass
    
    return int(bpm) if bpm else None

@csrf_exempt
@require_http_methods(["GET"])
def get_trending_tracks(request):
    """Get trending tracks from Audius with BPM data"""
    try:
        limit = min(int(request.GET.get('limit', 50)), 100)
        offset = int(request.GET.get('offset', 0))
        time_range = request.GET.get('time', 'week')
        
        url = f"{AUDIUS_API_BASE}/v1/tracks/trending"
        params = {'limit': limit, 'offset': offset, 'time': time_range}
        
        # Log the request for debugging
        logger.info(f"🔥 Fetching trending tracks from Audius: {url}")
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Audius API error: {response.status_code} - {response.text}")
            return JsonResponse({'error': f'Audius API error: {response.status_code}'}, status=500)
        
        data = response.json()
        tracks = data.get('data', [])
        
        # Log raw track data for debugging (first track only)
        if tracks:
            logger.info(f"📊 Sample track data keys: {list(tracks[0].keys())}")
            logger.info(f"📊 Sample track data: {json.dumps(tracks[0], indent=2)[:500]}...")
        
        # Get filter parameters
        bpm_filter = request.GET.get('bpm_filter', 'false').lower() == 'true'
        target_bpm = int(request.GET.get('target_bpm', 120))
        bpm_tolerance = int(request.GET.get('bpm_tolerance', 5))
        genre_filter = request.GET.get('genre_filter', 'all').lower()
        
        processed_tracks = []
        dj_genres = ['electronic', 'house', 'techno', 'dance', 'edm', 'progressive', 'trance', 'deep house', 'tech house']
        
        for track in tracks:
            if not track or not track.get('id'):
                continue
            
            # Extract BPM from track metadata
            bpm = extract_bpm_from_track(track)
            genre = track.get('genre', '').lower()
            
            # Log BPM extraction for debugging
            if bpm:
                logger.info(f"🎵 Found BPM {bpm} for track: {track.get('title')}")
            else:
                logger.warning(f"⚠️ No BPM found for track: {track.get('title')}")
                # Set a reasonable default based on genre
                if 'house' in genre or 'techno' in genre:
                    bpm = 128
                elif 'hip hop' in genre or 'rap' in genre:
                    bpm = 95
                elif 'drum' in genre and 'bass' in genre:
                    bpm = 174
                elif 'dubstep' in genre:
                    bpm = 140
                else:
                    bpm = 120  # Default BPM
                
                logger.info(f"🎯 Using default BPM {bpm} based on genre: {genre}")
            
            # Filter by BPM if requested
            if bpm_filter:
                # Check if BPM is within tolerance of target
                if not (target_bpm - bpm_tolerance <= bpm <= target_bpm + bpm_tolerance):
                    continue
            
            # Filter by genre if specified
            if genre_filter != 'all':
                # Apply genre-specific filtering
                if genre_filter == 'dj':
                    # DJ filter includes multiple electronic genres
                    is_dj_friendly = any(dj_genre in genre for dj_genre in dj_genres)
                    if not is_dj_friendly and 'remix' not in track.get('title', '').lower():
                        continue
                elif genre_filter == 'house':
                    if 'house' not in genre:
                        continue
                elif genre_filter == 'dubstep':
                    if 'dubstep' not in genre and 'dub' not in genre:
                        continue
                elif genre_filter == 'trap':
                    if 'trap' not in genre:
                        continue
                elif genre_filter == 'drum & bass':
                    if not any(term in genre for term in ['drum', 'bass', 'dnb', 'd&b']):
                        continue
                elif genre_filter == 'edm':
                    if not any(term in genre for term in ['edm', 'electronic', 'dance']):
                        continue
                else:
                    # Generic genre filter
                    if genre_filter not in genre:
                        continue
                
            processed_track = {
                'id': track['id'],
                'title': track.get('title', 'Unknown Title'),
                'artist': track.get('user', {}).get('name', 'Unknown Artist'),
                'duration': track.get('duration', 0),
                'artwork': None,
                'genre': track.get('genre'),
                'play_count': track.get('play_count', 0),
                'bpm': bpm,  # Include BPM data
                'stream_url': f"{AUDIUS_API_BASE}/v1/tracks/{track['id']}/stream"
            }
            
            # Handle artwork safely
            artwork = track.get('artwork')
            if artwork and isinstance(artwork, dict):
                processed_track['artwork'] = artwork.get('480x480') or artwork.get('150x150')
            
            processed_tracks.append(processed_track)
        
        logger.info(f"✅ Processed {len(processed_tracks)} trending tracks with BPM data")
        
        return JsonResponse({
            'tracks': processed_tracks,
            'total': len(processed_tracks)
        })
        
    except Exception as e:
        logger.error(f"❌ Error fetching trending tracks: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_genre_playlists(request):
    """Get playlists by genre and extract tracks"""
    try:
        genre = request.GET.get('genre', 'electronic').lower()
        limit = min(int(request.GET.get('limit', 10)), 20)
        
        # Genre to search query mapping
        genre_queries = {
            'house': 'house music',
            'dubstep': 'dubstep',
            'trap': 'trap music',
            'drum & bass': 'drum and bass',
            'edm': 'EDM',
            'techno': 'techno',
            'trance': 'trance music',
            'dj': 'DJ mix'
        }
        
        search_query = genre_queries.get(genre, genre)
        
        # Search for playlists by genre
        url = f"{AUDIUS_API_BASE}/v1/playlists/search"
        params = {'query': search_query, 'limit': limit}
        
        logger.info(f"🎵 Searching playlists for genre: {genre} with query: {search_query}")
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Playlist search error: {response.status_code}")
            return JsonResponse({'error': f'Playlist search error: {response.status_code}'}, status=500)
        
        playlists = response.json().get('data', [])
        
        # Collect all tracks from playlists
        all_tracks = []
        track_ids = set()  # Avoid duplicates
        
        for playlist in playlists[:5]:  # Limit to first 5 playlists
            playlist_id = playlist.get('id')
            if not playlist_id:
                continue
                
            # Get playlist tracks
            track_url = f"{AUDIUS_API_BASE}/v1/playlists/{playlist_id}/tracks"
            track_response = requests.get(track_url, timeout=15)
            
            if track_response.status_code == 200:
                tracks = track_response.json().get('data', [])
                
                for track in tracks:
                    if track and track.get('id') and track['id'] not in track_ids:
                        track_ids.add(track['id'])
                        
                        # Extract BPM
                        bpm = extract_bpm_from_track(track)
                        if not bpm:
                            # Estimate based on genre
                            if 'house' in genre or 'techno' in genre:
                                bpm = 128
                            elif 'trap' in genre:
                                bpm = 140
                            elif 'drum' in genre:
                                bpm = 174
                            elif 'dubstep' in genre:
                                bpm = 140
                            else:
                                bpm = 120
                        
                        processed_track = {
                            'id': track['id'],
                            'title': track.get('title', 'Unknown Title'),
                            'artist': track.get('user', {}).get('name', 'Unknown Artist'),
                            'duration': track.get('duration', 0),
                            'artwork': None,
                            'genre': track.get('genre', genre),
                            'bpm': bpm,
                            'stream_url': f"{AUDIUS_API_BASE}/v1/tracks/{track['id']}/stream"
                        }
                        
                        # Handle artwork
                        artwork = track.get('artwork')
                        if artwork and isinstance(artwork, dict):
                            processed_track['artwork'] = artwork.get('480x480') or artwork.get('150x150')
                        
                        all_tracks.append(processed_track)
        
        # Get BPM filter parameters
        bpm_filter = request.GET.get('bpm_filter', 'false').lower() == 'true'
        target_bpm = int(request.GET.get('target_bpm', 120))
        bpm_tolerance = int(request.GET.get('bpm_tolerance', 5))
        
        # Filter by BPM if requested
        if bpm_filter:
            all_tracks = [t for t in all_tracks if target_bpm - bpm_tolerance <= t['bpm'] <= target_bpm + bpm_tolerance]
        
        logger.info(f"✅ Found {len(all_tracks)} tracks from {genre} playlists")
        
        return JsonResponse({
            'tracks': all_tracks,
            'genre': genre,
            'total': len(all_tracks)
        })
        
    except Exception as e:
        logger.error(f"❌ Error fetching genre playlists: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def search_tracks(request):
    """Search tracks on Audius with BPM data"""
    try:
        query = request.GET.get('q', '').strip()
        if not query:
            return JsonResponse({'error': 'Search query required'}, status=400)
        
        limit = min(int(request.GET.get('limit', 25)), 100)
        
        url = f"{AUDIUS_API_BASE}/v1/tracks/search"
        params = {'query': query, 'limit': limit}
        
        # Log the request for debugging
        logger.info(f"🔍 Searching Audius for: '{query}' - {url}")
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Audius search API error: {response.status_code} - {response.text}")
            return JsonResponse({'error': f'Search error: {response.status_code}'}, status=500)
        
        data = response.json()
        tracks = data.get('data', [])
        
        # Log search results for debugging
        logger.info(f"📊 Found {len(tracks)} tracks for query: '{query}'")
        if tracks:
            logger.info(f"📊 Sample search result keys: {list(tracks[0].keys())}")
        
        # Get filter parameters
        bpm_filter = request.GET.get('bpm_filter', 'false').lower() == 'true'
        target_bpm = int(request.GET.get('target_bpm', 120))
        bpm_tolerance = int(request.GET.get('bpm_tolerance', 5))
        genre_filter = request.GET.get('genre_filter', 'all').lower()
        
        processed_tracks = []
        dj_genres = ['electronic', 'house', 'techno', 'dance', 'edm', 'progressive', 'trance', 'deep house', 'tech house']
        
        for track in tracks:
            if not track or not track.get('id'):
                continue
            
            # Extract BPM from track metadata
            bpm = extract_bpm_from_track(track)
            genre = track.get('genre', '').lower()
            
            # Log BPM extraction for debugging
            if bpm:
                logger.info(f"🎵 Found BPM {bpm} for search result: {track.get('title')}")
            else:
                logger.warning(f"⚠️ No BPM found for search result: {track.get('title')}")
                # Set a reasonable default based on genre
                if 'house' in genre or 'techno' in genre:
                    bpm = 128
                elif 'hip hop' in genre or 'rap' in genre:
                    bpm = 95
                elif 'drum' in genre and 'bass' in genre:
                    bpm = 174
                elif 'dubstep' in genre:
                    bpm = 140
                else:
                    bpm = 120  # Default BPM
                
                logger.info(f"🎯 Using default BPM {bpm} based on genre: {genre}")
                
            # Filter by BPM if requested
            if bpm_filter:
                # Check if BPM is within tolerance of target
                if not (target_bpm - bpm_tolerance <= bpm <= target_bpm + bpm_tolerance):
                    continue
            
            # Filter by genre if specified
            if genre_filter != 'all':
                # Apply genre-specific filtering
                if genre_filter == 'dj':
                    # DJ filter includes multiple electronic genres
                    is_dj_friendly = any(dj_genre in genre for dj_genre in dj_genres)
                    if not is_dj_friendly and 'remix' not in track.get('title', '').lower():
                        continue
                elif genre_filter == 'house':
                    if 'house' not in genre:
                        continue
                elif genre_filter == 'dubstep':
                    if 'dubstep' not in genre and 'dub' not in genre:
                        continue
                elif genre_filter == 'trap':
                    if 'trap' not in genre:
                        continue
                elif genre_filter == 'drum & bass':
                    if not any(term in genre for term in ['drum', 'bass', 'dnb', 'd&b']):
                        continue
                elif genre_filter == 'edm':
                    if not any(term in genre for term in ['edm', 'electronic', 'dance']):
                        continue
                else:
                    # Generic genre filter
                    if genre_filter not in genre:
                        continue
                
            processed_track = {
                'id': track['id'],
                'title': track.get('title', 'Unknown Title'),
                'artist': track.get('user', {}).get('name', 'Unknown Artist'),
                'duration': track.get('duration', 0),
                'artwork': None,
                'genre': track.get('genre'),
                'bpm': bpm,  # Include BPM data
                'stream_url': f"{AUDIUS_API_BASE}/v1/tracks/{track['id']}/stream"
            }
            
            # Handle artwork safely
            artwork = track.get('artwork')
            if artwork and isinstance(artwork, dict):
                processed_track['artwork'] = artwork.get('480x480') or artwork.get('150x150')
            
            processed_tracks.append(processed_track)
        
        logger.info(f"✅ Processed {len(processed_tracks)} search results with BPM data")
        
        return JsonResponse({
            'tracks': processed_tracks,
            'query': query,
            'total': len(processed_tracks)
        })
        
    except Exception as e:
        logger.error(f"❌ Search error: {e}")
        return JsonResponse({'error': str(e)}, status=500)