let radioTracks = [];

document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio();
  const playBtn = document.getElementById('radio-play-btn');
  const trackTitle = document.getElementById('radio-track-title');
  const waveform = document.getElementById('radio-waveform');
  const timeDisplay = document.getElementById('radio-time');
  const volumeSlider = document.getElementById('radio-volume');

  if (!playBtn) return; // Not on a page with the player

  fetch('/radio.json')
    .then(res => {
      if (!res.ok) throw new Error(`Radio manifest failed to load: ${res.status}`);
      return res.json();
    })
    .then(tracks => {
      if (!Array.isArray(tracks) || tracks.length === 0) {
        throw new Error('Radio manifest must contain at least one track.');
      }

      radioTracks = tracks;
      initRadioPlayer({ audio, playBtn, trackTitle, waveform, timeDisplay, volumeSlider });
    })
    .catch(error => {
      console.error('Error loading radio tracks:', error);
      trackTitle.textContent = 'RADIO UNAVAILABLE';
    });
});

function initRadioPlayer({ audio, playBtn, trackTitle, waveform, timeDisplay, volumeSlider }) {
  audio.id = 'radio-audio';
  audio.style.display = 'none';
  document.body.appendChild(audio);

  let isPlaying = false;
  let currentTrackIndex = Math.floor(Math.random() * radioTracks.length);

  function loadTrack(index) {
    const track = radioTracks[index];
    audio.src = track.file;
    trackTitle.textContent = track.title;
    audio.load();
  }

  function playNextTrack() {
    currentTrackIndex = Math.floor(Math.random() * radioTracks.length);
    loadTrack(currentTrackIndex);
    audio.play().catch(e => console.log('Autoplay blocked', e));
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updatePlayerUI(playing) {
    isPlaying = playing;
    if (playing) {
      playBtn.classList.add('playing');
      playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
      waveform.classList.add('playing');
    } else {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      waveform.classList.remove('playing');
    }
  }

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.log('Playback failed', e));
    }
  });

  audio.addEventListener('play', () => updatePlayerUI(true));
  audio.addEventListener('pause', () => updatePlayerUI(false));
  audio.addEventListener('ended', () => playNextTrack());
  
  audio.addEventListener('timeupdate', () => {
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });
  
  audio.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `00:00 / ${formatTime(audio.duration)}`;
  });

  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
  });

  // Init
  audio.volume = volumeSlider.value;
  loadTrack(currentTrackIndex);
  
  // Create animated waveform bars
  for(let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    bar.style.animationDelay = `${Math.random()}s`;
    bar.style.animationDuration = `${0.5 + Math.random()}s`;
    waveform.appendChild(bar);
  }
}
