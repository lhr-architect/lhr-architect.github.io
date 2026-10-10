const params = new URLSearchParams(window.location.search);
const API_BASE_URL = params.get('api') || (
  !window.location.hostname || ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:8787/api'
    : window.location.pathname.startsWith('/parkugo')
      ? `${window.location.origin}/parkugo/api`
    : `${window.location.origin}/api`
);
const DEFAULT_AMAP_KEY = '72d9ca7edd3f0718bc22610435f3dd4a';
const MAP_PROVIDER = params.get('map') || 'amap';
const AMAP_KEY = params.get('amapKey') || localStorage.getItem('parkugo_amap_key') || DEFAULT_AMAP_KEY;
if (params.get('amapKey')) localStorage.setItem('parkugo_amap_key', params.get('amapKey'));
const PHOTO_TTL_MS = 120 * 1000;
const MAX_PHOTOS = 5;

const TOPICS = {
  digital: { color: '#00DCFF', label: 'CYAN' },
  fantasy: { color: '#C060FF', label: 'PURPLE' },
  wuxia: { color: '#E83A28', label: 'RED' },
  pixel: { color: '#50C83C', label: 'GREEN' },
  modern: { color: '#90AAC0', label: 'GRAY' },
};

const HEROES = [
  { id: 'hunter', label: 'HUNTER', title: 'Field Shooter', skill: 'Snapshot', delay: 'Instant', line: 'Raise the lens fast and turn the scene into combat ammo.' },
  { id: 'sniper', label: 'SNIPER', title: 'Elite Sniper', skill: 'Telephoto Lock', delay: '3.0s', line: 'Steady the frame, charge up, and land a precise hit.' },
  { id: 'wizard', label: 'MARTYR', title: 'Martyr', skill: 'Self-Immolation AOE', delay: '1.5s', line: 'Sacrifice yourself: burn 1 HP to detonate a 30m blast, dealing -1 HP to every enemy.' },
  { id: 'king', label: 'KING', title: 'King', skill: 'No Escape', delay: 'Permanent', line: 'The king commands the field — enemies within 30m have nowhere to hide.' },
  { id: 'priest', label: 'PRIEST', title: 'Support Recorder', skill: 'Charged Heal', delay: '3.0s', line: 'Steady, charge, and pull a teammate back from the brink.' },
];

const TOWER_POINTS = [
  { id: 1, code: 'BoyaTower', name: 'BOYA TOWER', zhName: 'Boya Tower', type: 'major', score: 10, radius: 50, lat: 39.992679, lng: 116.305732, x: 78, y: 38, ownerTopic: null, photoCount: 3, desc: 'A Liao-style eaved brick pagoda built in 1924 — PKU\'s most iconic landmark.' , note: 'Now this one we all know.' },
  { id: 2, code: 'ZhongPavilion', name: 'ZHONG PAVILION', zhName: 'Bell Pavilion', type: 'major', score: 10, radius: 50, lat: 39.993114, lng: 116.301888, x: 25, y: 26, ownerTopic: null, photoCount: 1, desc: 'A hexagonal pavilion housing a Qing-era bronze bell — a key rally point on the north shore of Weiming Lake.' , note: 'Can you actually ring it...' },
  { id: 3, code: 'LinhuXuan', name: 'LINHU XUAN', zhName: 'Linhu Xuan', type: 'major', score: 10, radius: 50, lat: 39.992317, lng: 116.302895, x: 45, y: 58, ownerTopic: null, photoCount: 2, desc: 'Old site of Heshen\'s Shuchun Garden — steady lakeside sightlines, great for watching the mid lane.' , note: 'I don\'t even have a dorm, so no objections here.' },
  { id: 4, code: 'LusiPavilion', name: 'LUSI PAVILION', zhName: 'Lusi Pavilion', type: 'major', score: 10, radius: 50, lat: 39.993415, lng: 116.303474, x: 55, y: 23, ownerTopic: null, photoCount: 3, desc: 'A memorial pavilion on the lake island — prominent spot, a high-value contested point.' , note: 'Who is this again?' },
  { id: 5, code: 'MountainGate', name: 'MOUNTAIN GATE', zhName: 'Mountain Gate', type: 'major', score: 10, radius: 50, lat: 39.992745, lng: 116.304290, x: 63, y: 48, ownerTopic: null, photoCount: 0, desc: 'Remnant of the Ciji Temple gate — near the lakeside path, good for short rotations.' , note: 'The duck-feeding spot.' },
  { id: 6, code: 'CYPStone', name: 'CAI YUANPEI', zhName: 'Cai Yuanpei Statue', type: 'minor', score: 5, radius: 30, lat: 39.993059, lng: 116.301267, x: 17, y: 31, ownerTopic: null, photoCount: 1, desc: 'The Cai Yuanpei statue — a cultural marker on the west of the north shore, good for defensive patrols.' , note: 'Someone\'s got this area covered.' },
  { id: 7, code: 'QianLongPoem', name: 'QIANLONG POEM', zhName: 'Qianlong Poem Stele', type: 'minor', score: 5, radius: 30, lat: 39.993019, lng: 116.301892, x: 27, y: 34, ownerTopic: null, photoCount: 2, desc: 'The Qianlong poem stele — a dense cluster of historic relics, easy to spark close-range skirmishes.' , note: 'Someone\'s got this area covered?' },
  { id: 8, code: 'FlipTailFish', name: 'FLIPTAIL FISH', zhName: 'Fliptail Stone Fish', type: 'minor', score: 5, radius: 30, lat: 39.993040, lng: 116.302215, x: 32, y: 37, ownerTopic: null, photoCount: 0, desc: 'The fliptail stone fish from the Old Summer Palace — small, but a highly recognizable point.' , note: 'Heard the name, never seen the fish.' },
  { id: 9, code: 'EdgarSnowTomb', name: 'EDGAR SNOW', zhName: 'Edgar Snow Tomb', type: 'minor', score: 5, radius: 30, lat: 39.992613, lng: 116.304306, x: 63, y: 53, ownerTopic: null, photoCount: 2, desc: 'Edgar Snow\'s tomb — near the Mountain Gate and the east path, good for linking up the major points.' , note: 'And who is this one?' },
  { id: 10, code: 'PlumTomb', name: 'PLUM STONE', zhName: 'Plum Stele', type: 'minor', score: 5, radius: 30, lat: 39.992097, lng: 116.302305, x: 33, y: 69, ownerTopic: null, photoCount: 1, desc: 'The plum stele — a quiet spot on the south shore, useful for flanking and topping up control.' , note: 'Never seen it, ha.' },
  { id: 11, code: 'Gym1', name: 'GYM 1', zhName: 'Gymnasium No. 1', type: 'minor', score: 5, radius: 30, lat: 39.994013, lng: 116.305426, x: 80, y: 13, ownerTopic: null, photoCount: 0, desc: 'Gymnasium No. 1 — an edge point on the northeast of the map, good for long-range watch.' , note: 'No delayed graduation here..' },
  { id: 12, code: 'QianLongScreen', name: 'STONE SCREEN', zhName: 'Qianlong Stone Screen', type: 'minor', score: 5, radius: 30, lat: 39.994519, lng: 116.303898, x: 61, y: 8, ownerTopic: null, photoCount: 3, desc: 'The Qianlong stone screen — a high point on the north, good as a pressure marker on the enemy.' , note: 'Professor Qianlong is back again.' },
  { id: 13, code: 'WesternBridge', name: 'WESTERN BRIDGE', zhName: 'Western Flat Bridge', type: 'minor', score: 5, radius: 30, lat: 39.993601, lng: 116.303085, x: 48, y: 20, ownerTopic: null, photoCount: 1, desc: 'The western flat bridge — links the lake island to the north shore, a rotation clash point.' , note: 'It is a very flat bridge.' },
  { id: 14, code: 'WSYTomb', name: 'WEI SHIYI', zhName: 'Wei Shiyi Tomb', type: 'minor', score: 5, radius: 30, lat: 39.991990, lng: 116.300391, x: 10, y: 73, ownerTopic: null, photoCount: 2, desc: 'Wei Shiyi\'s tomb — a hidden spot on the southwest, good for an infrequent but key capture.' , note: 'Still don\'t recognize them.' },
  { id: 15, code: 'LPW_XRDTomb', name: 'LPW XRD TOMB', zhName: 'Laipuwu & Xiarende Tomb', type: 'minor', score: 5, radius: 30, lat: 39.992448, lng: 116.303297, x: 50, y: 61, ownerTopic: null, photoCount: 1, desc: 'The tomb of Laipuwu and Xiarende — a mid-lakeside anchor, good for forming a three-point pincer.' , note: 'Why is it still not a single room?' },
];

const RESPAWN_POINTS = [
  { id: 'shifang', code: 'ShiFang', name: 'SHIFANG', zhName: 'Stone Archway', lat: 39.993439, lng: 116.303833, radius: 50 },
];

const TOWER_BUFFS = {
  major: [
    { id: 'disarm',  name: 'Disarm',  icon: '⚔', desc: 'All enemies cannot take photos for 30s',  duration: 30 },
    { id: 'eclipse', name: 'Eclipse', icon: '☀', desc: 'Reveals all enemy positions for 60s',     duration: 60 },
    { id: 'veil',    name: 'Veil',    icon: '◑', desc: 'Hides all allied positions for 90s',     duration: 90 },
  ],
  minor: [
    { id: 'ghost',  name: 'Ghost',   icon: '◈', desc: 'Takes no HP damage for 30s',                  duration: 30 },
    { id: 'malice', name: 'Malice',  icon: '◆', desc: 'Next attack deals 2 damage (within 60s)',     duration: 60 },
    { id: 'bless',  name: 'Blessing', icon: '✚', desc: 'Instantly restore 1 HP',                     duration: 0, instant: true },
  ],
};

const HERO_THEME = {
  hunter: { color: '#3D7A22', icon: '⌖', label: 'HUNTER' },
  sniper: { color: '#4A5C34', icon: '◇', label: 'SNIPER' },
  wizard: { color: '#6B42B0', icon: '✦', label: 'MARTYR' },
  king: { color: '#B8860B', icon: '♔', label: 'KING' },
  priest: { color: '#4A6688', icon: '✚', label: 'PRIEST' },
};

// 角色随模式改名：'king' 在未名湖模式显示为「侦察兵 / SCOUT」，Checkmate 模式保留「国王 / KING」
const HERO_WEIMING_OVERRIDE = {
  king: { label: 'SCOUT', title: 'Scout', icon: '◉', skill: 'Full-Field Recon', line: 'The scout opens up vision — enemies within 30m have nowhere to hide.' },
};

const CAMERA_PROFILES = {
  hunter: { type: 'standard', className: 'profile-standard', label: 'STANDARD', shutterDelay: 0, countdown: 0, crop: 'viewfinder', idleStatus: 'READY', captureStatus: 'CAPTURING' },
  sniper: { type: 'telephoto', className: 'profile-telephoto', label: 'SNIPE', shutterDelay: 3000, countdown: 3, crop: 'circleBounds', idleStatus: 'SCAN', captureStatus: 'LOCKING' },
  wizard: { type: 'panorama', className: 'profile-panorama', label: 'PANORAMA', shutterDelay: 1500, countdown: 0, crop: 'full', idleStatus: 'SWEEP', captureStatus: 'SCANNING' },
  king: { type: 'standard', className: 'profile-standard', label: 'KING VIEW', shutterDelay: 0, countdown: 0, crop: 'viewfinder', idleStatus: 'REIGN', captureStatus: 'REIGNING' },
  priest: { type: 'support', className: 'profile-support', label: 'SUPPORT', shutterDelay: 3000, countdown: 3, crop: 'viewfinder', idleStatus: 'ALIGN', captureStatus: 'SYNCING' },
};

const CAMERA_PROFILE_CLASSES = Object.values(CAMERA_PROFILES).map((profile) => profile.className);

const HERO_TONE = { hunter: 0, sniper: -0.16, wizard: 0.16, king: -0.04, priest: 0.24, scout: -0.04 };

const HERO_SPRITES = {
  hunter: [
    [0,0,1,1,1,1,0,0], [0,1,3,3,3,3,1,0], [1,1,1,1,1,1,1,1], [0,0,1,2,2,1,0,0],
    [0,0,1,2,2,1,0,0], [0,1,1,2,2,1,1,0], [0,1,3,3,3,3,1,0], [0,1,3,3,3,3,1,0],
    [1,3,4,3,3,4,3,1], [1,3,3,3,3,3,3,1], [0,1,3,3,3,3,1,0], [0,1,4,1,1,4,1,0],
    [0,1,3,0,0,3,1,0], [0,1,3,0,0,3,1,0], [0,1,4,0,0,4,1,0], [0,1,1,0,0,1,1,0],
  ],
  sniper: [
    [0,0,0,1,1,0,0,0], [0,0,1,3,3,1,0,0], [0,1,3,3,3,3,1,0], [1,1,1,1,1,1,1,0],
    [0,0,1,2,2,1,0,0], [0,0,1,2,2,1,0,0], [0,1,3,3,3,3,1,0], [1,3,3,4,4,3,3,1],
    [1,3,4,3,3,4,3,1], [1,3,3,3,3,3,3,1], [0,1,3,3,3,3,1,4], [0,1,4,1,1,4,1,4],
    [0,1,3,0,0,3,0,1], [0,1,3,0,0,3,0,0], [0,1,4,0,0,4,0,0], [0,1,1,0,0,1,0,0],
  ],
  wizard: [
    [0,0,0,1,1,0,0,0], [0,0,1,3,3,1,0,0], [0,1,3,3,3,3,1,0], [0,1,3,3,3,3,1,0],
    [1,3,3,3,3,3,3,1], [0,0,1,2,2,1,0,0], [0,0,1,2,5,1,0,0], [0,1,3,3,3,3,1,0],
    [1,3,3,5,3,3,3,1], [1,3,3,3,3,3,3,1], [1,3,4,3,3,4,3,1], [1,3,3,3,3,3,3,1],
    [1,3,3,0,0,3,3,1], [1,4,3,0,0,3,4,1], [1,3,3,0,0,3,3,1], [1,1,1,0,0,1,1,1],
  ],
  king: [
    [0,4,0,4,0,4,0,4], [0,4,4,4,4,4,4,0], [0,1,3,3,3,3,1,0], [0,1,2,1,1,2,1,0],
    [0,1,2,2,2,2,1,0], [0,0,1,3,3,1,0,0], [0,1,3,3,3,3,1,0], [1,3,3,4,4,3,3,1],
    [1,3,4,4,4,4,3,1], [1,3,3,3,3,3,3,1], [1,3,4,3,3,4,3,1], [1,3,3,3,3,3,3,1],
    [0,1,3,3,3,3,1,0], [0,1,3,0,0,3,1,0], [0,1,4,0,0,4,1,0], [0,1,1,0,0,1,1,0],
  ],
  priest: [
    [0,0,1,1,1,1,0,0], [0,1,3,3,3,3,1,0], [0,1,3,3,3,3,1,0], [0,1,3,2,2,3,1,0],
    [0,0,1,2,2,1,0,0], [0,0,1,2,2,1,0,0], [0,1,3,3,3,3,1,0], [1,3,3,5,5,3,3,1],
    [1,3,5,5,5,5,3,1], [1,3,3,5,5,3,3,1], [1,3,3,3,3,3,3,1], [0,1,4,1,1,4,1,0],
    [0,1,3,1,1,3,1,0], [0,1,3,0,0,3,1,0], [0,1,4,0,0,4,1,0], [0,1,1,0,0,1,1,0],
  ],
  // 侦察兵：鸭舌帽 + 横贯护目镜（取代国王王冠），呼应「眼睛」视野主题
  scout: [
    [0,0,1,1,1,1,0,0], [0,1,3,3,3,3,1,0], [1,1,1,1,1,1,1,1], [0,1,2,2,2,2,1,0],
    [1,5,5,5,5,5,5,1], [0,1,2,2,2,2,1,0], [0,1,3,3,3,3,1,0], [0,1,3,3,3,3,1,0],
    [1,3,4,3,3,4,3,1], [1,3,3,3,3,3,3,1], [0,1,3,3,3,3,1,0], [0,1,4,1,1,4,1,0],
    [0,1,3,0,0,3,1,0], [0,1,3,0,0,3,1,0], [0,1,4,0,0,4,1,0], [0,1,1,0,0,1,1,0],
  ],
};

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const LOGO_FONT = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  HEART: ['01010', '11111', '11111', '11111', '01110', '00100', '00000'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};

const LOGO_VARIANTS = [
  [
    { ch: 'P', color: '#000' },
    { ch: 'K', color: '#000' },
    { ch: 'U', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: 'G', color: '#000' },
    { ch: 'O', color: '#000' },
  ],
  [
    { ch: 'P', color: '#d71920' },
    { ch: 'K', color: '#d71920' },
    { ch: 'U', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: 'G', color: '#d71920' },
    { ch: 'O', color: '#d71920' },
  ],
  [
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: 'U', color: '#d71920' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
  ],
  [
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: 'HEART', color: '#d71920' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
  ],
  [
    { ch: 'P', color: '#d71920' },
    { ch: 'K', color: '#d71920' },
    { ch: 'U', color: '#d71920' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
  ],
  [
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: ' ', color: '#000' },
    { ch: 'G', color: '#000' },
    { ch: 'O', color: '#000' },
  ],
];

const logoState = { variant: 1, prevVariant: 1, tick: 0, progress: null };
const heroAnim = { frame: 0, lastHero: '', lastTopic: '' };
const roomActors = {};

const state = {
  roomId: 'test',
  playerId: '',
  topic: 'wuxia',
  hero: 'hunter',
  mode: 'weiming',
  room: null,
  landmarks: [],
  photos: [],
  combatMode: localStorage.getItem('parkugo_combat_mode') || 'kill',
  lastFireAt: 0,
  selectedTowerPoint: 0,
  selectedTowerPoiId: Number(localStorage.getItem('parkugo_selected_tower_poi') || 1),
  pendingTowerPoiId: Number(localStorage.getItem('parkugo_selected_tower_poi') || 1),
  pendingDynamicTowerId: null,
  selectedDynamicTowerId: null,
  towerInfoOpen: false,
  towerPhotoIndexes: [],
  towerCapturePct: 0,
  towerCaptured: false,
  towerUploadCounts: {},
  towerBuffs: {},
  trackLog: [],
  battleEventLog: [],
  usedPhotos: [],
  battleStartTime: 0,
  lastTrackSampleAt: 0,
  selectedPhotoIndex: -1,
  selectedFilmIndex: 0,
  selectedTargetId: '',
  selectedTargetTopic: '',
  selectedLandmarkId: '',
  selectedSlot: 1,
  location: { lat: 39.9915, lng: 116.3115, ready: false },
  locationWatchId: null,
  lastLocationUploadAt: 0,
  cameraStream: null,
  cameraBlocked: false,
  cameraFacing: 'environment',
  cameraMirror: false,
  allowCamera: true,
  allowLocation: true,
  allowSpeech: true,
  pendingCapture: null,
  pendingPhotoDescription: '',
  speech: { recognition: null, active: false, transcript: '', audioPrimed: false },
  poll: null,
  leaflet: { map: null, markers: [], loading: null },
  amap: { map: null, markers: [], visionShapes: [], reportMap: null, reportMarkers: [], miniMap: null, miniMarkers: [], miniCircle: null, histMap: null, loading: null, available: false },
};
const actionLocks = new Set();
const seenEventIds = new Set();
let hitToastTimer = null;
let stoneReviveInterval = null;
let bgMusicPlaying = false;   // 背景音乐播放状态（驱动右上角跳舞小人动/静）
const dialDrag = { active: false, startX: 0, maxPhase: 0, suppressClick: false };
const wheelDrag = { active: false, type: '', startY: 0, startIndex: 0, index: 0, moved: false, suppressClick: false };
const filmGesture = { active: false, index: -1, startX: 0, startY: 0, moved: false, longTimer: null, suppressClick: false };
const modeSwitchDrag = { active: false, startX: 0, moved: false, suppressClick: false };
const towerSliderDrag = { active: false, startY: 0, startPct: 0 };
const towerInfoDrag = { active: false, startY: 0, moved: false };
const deathState = { lastDeathKey: '', dancing: false, danceTimer: null, danceStartedAt: 0, stoneHintKey: '', stoneMessage: '', debugDead: false, debugKillerId: '' };
let sfxAudio = null;
let tickAudio = null;
let photoExpiryTimer = null;
let captureEffectTimer = null;
let tutorialState = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function saveSession() {
  localStorage.setItem('parkugo_web_session', JSON.stringify({
    roomId: state.roomId,
    playerId: state.playerId,
    topic: state.topic,
    hero: state.hero,
  }));
}

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem('parkugo_web_session') || '{}');
    Object.assign(state, {
      roomId: saved.roomId || state.roomId,
      playerId: saved.playerId || state.playerId,
      topic: saved.topic || state.topic,
      hero: saved.hero || state.hero,
    });
    state.mode = getGameMode(state.roomId);
    // 恢复上次的 mode tab 选中
    const lastMode = state.mode;
    setTimeout(() => {
      document.querySelectorAll('.mode-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === lastMode));
      const hint = document.getElementById('modeHint');
      if (hint) {
        hint.textContent = lastMode === 'checkmate'
          ? 'CHECKMATE MODE · King dynamic placement + 30-minute showdown'
          : 'WEIMING LAKE MODE · 15 fixed points + triangle siege';
      }
      // checkmate 模式恢复时去掉 mate- 前缀显示
      if (lastMode === 'checkmate') {
        const input = document.getElementById('roomInput');
        if (input && input.value.toLowerCase().startsWith('mate-')) {
          input.value = input.value.substring(5);
        }
      }
    }, 0);
  } catch (e) {}
}

function albumKey() {
  return `parkugo_web_album_${state.roomId}_${state.playerId}`;
}

function loadAlbum() {
  try {
    const photos = JSON.parse(localStorage.getItem(albumKey()) || '[]');
    state.photos = Array.isArray(photos) ? photos : [];
  } catch (e) {
    state.photos = [];
  }
}

function saveAlbum() {
  localStorage.setItem(albumKey(), JSON.stringify(state.photos.slice(-MAX_PHOTOS)));
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);
  try {
    const res = await fetch(API_BASE_URL + path, {
      method: options.method || 'GET',
      headers: { 'content-type': 'application/json' },
      body: options.data ? JSON.stringify(options.data) : undefined,
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function showScreen(name) {
  $$('.screen').forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
}

function currentScreenName() {
  const active = $('.screen.active');
  return active ? active.dataset.screen : '';
}

function tutorialKey() {
  const room = encodeURIComponent(String(state.roomId || '').trim().toLowerCase() || 'test');
  const player = encodeURIComponent(String(state.playerId || '').trim().toLowerCase() || 'player');
  return `parkugo_tutorial_${room}_${player}`;
}

function readTutorialFlags() {
  try {
    return JSON.parse(localStorage.getItem(tutorialKey()) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function writeTutorialFlag(section) {
  const flags = readTutorialFlags();
  flags[section] = true;
  localStorage.setItem(tutorialKey(), JSON.stringify(flags));
}

function clearTutorialFocus() {
  $$('.tutorial-focus').forEach((item) => item.classList.remove('tutorial-focus'));
}

function placeTutorialStep() {
  if (!tutorialState) return;
  const step = tutorialState.steps[tutorialState.index];
  const overlay = $('#tutorialOverlay');
  const card = overlay && overlay.querySelector('.tutorial-card');
  if (!overlay || !card || !step) return;
  clearTutorialFocus();
  const target = step.target ? $(step.target) : null;
  if (target) target.classList.add('tutorial-focus');
  card.dataset.placement = step.placement || 'bottom';
  $('#tutorialStep').textContent = `${tutorialState.index + 1} / ${tutorialState.steps.length}`;
  $('#tutorialTitle').textContent = step.title;
  $('#tutorialText').textContent = step.text;
  $('#tutorialNextBtn').textContent = tutorialState.index === tutorialState.steps.length - 1 ? 'DONE' : 'NEXT';
  overlay.classList.remove('hidden');
}

function endTutorial(save = true) {
  if (!tutorialState) return;
  const section = tutorialState.section;
  tutorialState = null;
  clearTutorialFocus();
  $('#tutorialOverlay')?.classList.add('hidden');
  if (save) writeTutorialFlag(section);
}

function startTutorial(section, steps) {
  if (!state.roomId || !state.playerId) return;
  if (tutorialState || !steps.length) return;
  if (readTutorialFlags()[section]) return;
  tutorialState = { section, steps, index: 0 };
  placeTutorialStep();
}

function nextTutorialStep() {
  if (!tutorialState) return;
  tutorialState.index += 1;
  if (tutorialState.index >= tutorialState.steps.length) {
    endTutorial(true);
    return;
  }
  placeTutorialStep();
}

function maybeStartHeroTutorial() {
  if (currentScreenName() !== 'hero') return;
  startTutorial('hero_v3', [
    { target: '#heroStrip', title: 'Choose Your Role', text: `HUNTER shoots instantly; SNIPER has a 3s circular lock; ${heroMeta('wizard').label} self-immolates for an AOE sacrifice; ${heroMeta('king').label} ${isCheckmateMode() ? 'places points dynamically' : 'recons vision (exposes enemies within 30m)'}; PRIEST charges 3s to heal.` },
    { target: '#topicStrip', title: 'Choose Your Team', text: 'Players on the same team are allies and share point-capture progress. A major point (★) needs 2 teammates to each upload 1 photo to take it.' },
    { target: '#lockBtn', title: 'Lock In · Enter', text: 'Once you\'re set, tap [LOCK]; when it turns to [LOCKED], tap [GO ▶] to enter the field. You cannot change roles after entering.' },
    { target: '.room-card', title: 'Wait to Start', text: 'The room card shows the team spread of everyone here. Once all are ready, any player can hit start to begin the battle.' },
  ]);
}

function maybeStartPermissionTutorial() {
  if (currentScreenName() !== 'permissions') return;
  startTutorial('permissions_v4', [
    { target: '.permission-panel', title: 'Pre-Battle Setup', text: 'Set up device permissions before the match. CAMERA is for taking photos as ammo, GPS is for positioning and the map — both recommended on. VOICE (microphone) is optional, used only when you hold the shutter to record a voice note.' },
    { target: '#setupLocationCheck', title: 'GPS Location', text: 'With GPS on, the battle map shows your position, your allies\' positions, and nearby points in real time.' },
    { target: '#permissionContinueBtn', title: 'Go to Role Select', text: 'Once set up, tap [GO] to enter the role and team selection screen.' },
  ]);
}

function maybeStartBattleTutorial() {
  if (currentScreenName() !== 'battle') return;
  startTutorial('battle_v5', [
    { target: '#filmColumn', title: 'Film Slots · Ammo', text: 'The left film column holds up to 5 photos as ammo, each valid for 2 minutes. Tap a slot to view/switch; when all 5 are full, swipe the column right to clear one before shooting again.' },
    { target: '#cameraBtn', title: 'Shutter · Photo', text: 'The big center button takes photos to refill ammo. Each role shoots differently: HUNTER fires instantly, SNIPER has a 3s circular lock, the Martyr (MARTYR) takes a 1.5s selfie, PRIEST charges for 3s. Hold the shutter to focus mechanically.' },
    { target: '#hpLamps', title: 'HP', text: 'The two lamps are your HP. Each enemy hit costs 1; when both go out you go down. Head to the Stone Archway or dance to revive.' },
    { target: '#battleModeSwitch', title: 'KILL / TOWER Mode', text: 'Switch attack modes at the bottom: KILL mode uses photos to attack enemy players; TOWER mode captures points up close. Switch anytime.', placement: 'top' },
    { target: '#scopeDial', title: 'KILL Mode · Attack Dial', text: 'The left wheel (color swatches) picks the enemy team, the right wheel picks the specific target. Load a photo, then drag the FIRE slider right to shoot. The priest can only heal allies; attacks can only target enemies. Martyr/Sniper/Priest have a 60s cooldown after firing, during which the dial greys out and the slider won\'t reach the end.', placement: 'top' },
    { target: '#towerConsole', title: 'TOWER Mode · Triangle Capture', text: 'Take a photo from a different spot around the point, fill the 3 slots in order to form a triangle around it, then drag the slider down to capture. Minor points need 1 player; major points (★) need 2 players to each submit once.', placement: 'top' },
    { target: '#allyStatus', title: 'MY TOWER · Ally Status', text: 'In KILL mode it shows ally HP; in TOWER mode it becomes MY TOWER, listing captured points and the random buffs you earned.', placement: 'top' },
    { target: '.map-pull', title: 'Global Map', text: 'Tap MAP at the top to open the live map and see all 15 points\' locations and capture status, plus ally and enemy coordinates.' },
  ]);
}

function goBack() {
  if (tutorialState) {
    endTutorial(false);
    return;
  }
  if (!$('#cameraOverlay').classList.contains('hidden')) {
    closeCamera();
    return;
  }
  if (!$('#sheet').classList.contains('hidden')) {
    closeSheet();
    return;
  }
  if (currentScreenName() === 'battle') {
    stopLocationWatch();
    stopCameraStream();
    stopPhotoExpiryTimer();
    showScreen('hero');
    renderHeroScreen();
    return;
  }
  if (currentScreenName() === 'hero') {
    showScreen('home');
    return;
  }
  if (currentScreenName() === 'permissions') {
    showScreen('home');
    return;
  }
  if (!$('#resultPanel')?.classList.contains('hidden') || !$('#historyPanel')?.classList.contains('hidden')) {
    closeResultPanels();
    return;
  }
  if (currentScreenName() === 'result') {
    showScreen('home');
    return;
  }
  if (window.history.length > 1) window.history.back();
}

function topicMeta(topic = state.topic) {
  return TOPICS[topic] || { color: '#888888', label: topic || 'UNSET' };
}

function ownTopic() {
  const me = currentPlayer();
  return me.topic || state.topic;
}

function isCheckmateMode() {
  return state.mode === 'checkmate';
}

function heroMeta(hero = state.hero) {
  const base = HERO_THEME[hero] || { color: '#888888', icon: '?', label: hero || 'UNSET' };
  const ov = (!isCheckmateMode() && HERO_WEIMING_OVERRIDE[hero]) || null;
  return ov ? { ...base, label: ov.label, icon: ov.icon || base.icon } : base;
}

// 取角色在当前模式下的展示信息（合并 HEROES 基础项 + 未名湖改名覆盖）
function heroView(heroBase) {
  if (!heroBase) return heroBase;
  const ov = (!isCheckmateMode() && HERO_WEIMING_OVERRIDE[heroBase.id]) || null;
  return ov ? { ...heroBase, ...ov } : heroBase;
}

// 像素画/调色板用的 sprite key：未名湖的 king 用「侦察兵」造型
function heroSpriteKey(hero) {
  return (hero === 'king' && !isCheckmateMode()) ? 'scout' : hero;
}

function cameraProfile(hero = (currentPlayer().hero || state.hero)) {
  const base = CAMERA_PROFILES[hero] || CAMERA_PROFILES.hunter;
  // 未名湖模式：king 即「侦察兵」，相机文案改为侦察语义
  if (hero === 'king' && !isCheckmateMode()) {
    return { ...base, label: 'RECON', idleStatus: 'SCOUT', captureStatus: 'SCOUTING' };
  }
  return base;
}

// 攻击/技能冷却（转盘 FIRE）：牺牲者/狙击手/牧师 出手后进入 60s CD；猎人/侦察兵/国王(king) 无 CD
const ATTACK_CD_MS = { wizard: 60000, sniper: 60000, priest: 60000 };
function attackCdMs(hero = (currentPlayer().hero || state.hero)) {
  return ATTACK_CD_MS[hero] || 0;
}
function attackCdRemaining() {
  const total = attackCdMs();
  if (!total) return 0;
  return Math.max(0, total - (Date.now() - Number(state.lastFireAt || 0)));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex) {
  const raw = String(hex || '#888888').replace('#', '');
  const normalized = raw.length === 3 ? raw.split('').map((ch) => ch + ch).join('') : raw.padEnd(6, '8').slice(0, 6);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function shiftColor(hex, amount) {
  const rgb = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex({
      r: rgb.r + (255 - rgb.r) * amount,
      g: rgb.g + (255 - rgb.g) * amount,
      b: rgb.b + (255 - rgb.b) * amount,
    });
  }
  const k = 1 + amount;
  return rgbToHex({ r: rgb.r * k, g: rgb.g * k, b: rgb.b * k });
}

function roleTopicColor(heroId, topicColor) {
  return shiftColor(topicColor, HERO_TONE[heroId] || 0);
}

function buildHeroPalette(heroId, topicColor) {
  const primary = roleTopicColor(heroId, topicColor || '#888888');
  return [
    'rgba(0,0,0,0)',
    shiftColor(primary, -0.74),
    '#ECD5B8',
    primary,
    shiftColor(primary, -0.32),
    shiftColor(primary, 0.72),
  ];
}

function setTopicColor() {
  const visualTopic = currentScreenName() === 'battle' ? ownTopic() : state.topic;
  document.documentElement.style.setProperty('--topic', topicMeta(visualTopic).color);
  // 战斗页按阵营套用风格化皮肤（CSS [data-team] 切换）
  const bs = document.querySelector('.battle-screen');
  if (bs) bs.dataset.team = ownTopic() || state.topic || '';
}

function formatTime(sec) {
  if (sec == null) return '∞';
  const value = Math.max(0, Number(sec || 0));
  const m = Math.floor(value / 60);
  const s = value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateClock() {
  const d = new Date();
  $('#clockText').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function prepareCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return { ctx: canvas.getContext('2d'), w, h };
}

function drawHomeArt() {
  drawLogoCanvas();
  drawDitherCanvas();
  drawDesktopIcon($('#iconMap'), drawMapIcon);
  drawDesktopIcon($('#iconTasks'), drawTasksIcon);
  drawDesktopIcon($('#iconProfile'), drawProfileIcon);
  drawDesktopIcon($('#iconTrash'), drawTrashIcon);
}

function drawLogoCanvas() {
  const prepared = prepareCanvas($('#logoCanvas'));
  if (!prepared) return;
  const { ctx, w, h } = prepared;
  ctx.clearRect(0, 0, w, h);
  const baseSlots = LOGO_VARIANTS[0];
  const cols = baseSlots.reduce((sum, slot, index) => {
    const glyph = LOGO_FONT[slot.ch] || LOGO_FONT[' '];
    return sum + glyph[0].length + (index === baseSlots.length - 1 ? 0 : 1);
  }, 0);
  const rows = 7;
  const cell = Math.floor(Math.min(w / cols, h / rows));
  const startX = Math.floor((w - cols * cell) / 2);
  const startY = Math.floor((h - rows * cell) / 2);
  const current = LOGO_VARIANTS[logoState.variant] || LOGO_VARIANTS[1];
  const previous = LOGO_VARIANTS[logoState.prevVariant] || LOGO_VARIANTS[1];
  if (typeof logoState.progress === 'number') {
    drawLogoVariant(ctx, previous, baseSlots, startX, startY, cell, logoState.progress, false);
    drawLogoVariant(ctx, current, baseSlots, startX, startY, cell, logoState.progress, true);
  } else {
    drawLogoVariant(ctx, current, baseSlots, startX, startY, cell);
  }
}

function drawLogoVariant(ctx, variant, baseSlots, startX, startY, cell, progress, reveal) {
  let cursor = startX;
  variant.forEach((slot, index) => {
    const baseGlyph = LOGO_FONT[baseSlots[index].ch] || LOGO_FONT[' '];
    const glyph = LOGO_FONT[slot.ch] || LOGO_FONT[' '];
    const slotW = baseGlyph[0].length * cell;
    ctx.fillStyle = slot.color;
    glyph.forEach((row, y) => {
      row.split('').forEach((bit, x) => {
        if (bit === '1' && shouldDrawLogoPixel(index, x, y, progress, reveal)) {
          ctx.fillRect(cursor + x * cell, startY + y * cell, cell, cell);
        }
      });
    });
    cursor += slotW + (index === variant.length - 1 ? 0 : cell);
  });
}

function shouldDrawLogoPixel(slotIndex, x, y, progress, reveal) {
  if (typeof progress !== 'number') return true;
  const noise = ((slotIndex * 11 + x * 7 + y * 13) % 17) / 16;
  const shouldReveal = noise <= progress;
  return reveal ? shouldReveal : !shouldReveal;
}

function tickLogo() {
  logoState.tick += 1;
  if (logoState.tick === 10) {
    logoState.prevVariant = logoState.variant;
    let next = Math.floor(Math.random() * LOGO_VARIANTS.length);
    if (next === logoState.variant) next = (next + 1) % LOGO_VARIANTS.length;
    logoState.variant = next;
  }
  if (logoState.tick >= 10 && logoState.tick <= 15) {
    logoState.progress = (logoState.tick - 10) / 5;
  } else {
    logoState.progress = null;
  }
  if (logoState.tick >= 16) logoState.tick = 0;
  drawLogoCanvas();
}

function drawDitherCanvas() {
  const prepared = prepareCanvas($('#ditherCanvas'));
  if (!prepared) return;
  const { ctx, w, h } = prepared;
  const img = ctx.createImageData(w, h);
  const px = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const brightness = Math.pow(1 - y / Math.max(1, h - 1), 0.55);
      const threshold = BAYER4[y % 4][x % 4] / 16;
      const v = brightness > threshold ? 255 : 0;
      const i = (y * w + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawDesktopIcon(canvas, drawFn) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, w, h } = prepared;
  drawFn(ctx, w, h);
}

function drawMapIcon(ctx, w, h) {
  const lw = Math.max(1.5, w / 28);
  const p = w * 0.14;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.strokeRect(p, p, w - 2 * p, h - 2 * p);
  ctx.beginPath();
  ctx.moveTo(w / 2, p);
  ctx.lineTo(w / 2, h - p);
  ctx.moveTo(p, h / 2);
  ctx.lineTo(w - p, h / 2);
  ctx.stroke();
  const r = w * 0.13;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - r * 0.5, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - r * 0.5, r * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}

function drawTasksIcon(ctx, w, h) {
  const lw = Math.max(1.5, w / 28);
  const p = w * 0.14;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.strokeRect(p, p, w - 2 * p, h - 2 * p);
  const rowH = (h - 2 * p) / 4;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    const y = p + rowH * (i + 0.5);
    const cb = rowH * 0.45;
    ctx.strokeRect(p + lw * 2, y - cb / 2, cb, cb);
    if (i === 0) {
      ctx.beginPath();
      ctx.moveTo(p + lw * 3, y);
      ctx.lineTo(p + lw * 2 + cb * 0.4, y + cb * 0.3);
      ctx.lineTo(p + lw * 2 + cb, y - cb * 0.3);
      ctx.stroke();
    }
    const lx = p + cb + lw * 4;
    ctx.fillRect(lx, y - lw, w - p - lx, lw * 2);
  }
}

function drawProfileIcon(ctx, w, h) {
  const lw = Math.max(1.5, w / 28);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = lw;
  const hr = w * 0.2;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.35, hr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h, w * 0.4, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

function drawTrashIcon(ctx, w, h) {
  const lw = Math.max(1.5, w / 28);
  const p = w * 0.14;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.fillRect(p, h * 0.22, w - 2 * p, lw * 1.5);
  ctx.strokeRect(w / 2 - w * 0.14, h * 0.1, w * 0.28, h * 0.12);
  const bx = p + w * 0.06;
  const bw = w - 2 * p - w * 0.12;
  const by = h * 0.28;
  const bh = h - by - p;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.beginPath();
  ctx.moveTo(w / 2 - bw * 0.18, by + bh * 0.12);
  ctx.lineTo(w / 2 - bw * 0.18, by + bh * 0.88);
  ctx.moveTo(w / 2 + bw * 0.18, by + bh * 0.12);
  ctx.lineTo(w / 2 + bw * 0.18, by + bh * 0.88);
  ctx.stroke();
}

function drawHero() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { color } = topicMeta();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,.10)';
  for (let x = 0; x < canvas.width; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  const spriteKey = heroSpriteKey(state.hero);
  const sprite = HERO_SPRITES[spriteKey] || HERO_SPRITES.hunter;
  const palette = buildHeroPalette(spriteKey, color);
  const cell = Math.floor(Math.min(canvas.width / 9.5, canvas.height / 17.5));
  const startX = Math.floor((canvas.width - 8 * cell) / 2);
  const startY = Math.floor((canvas.height - 16 * cell) / 2);
  const pulse = Math.floor(heroAnim.frame / 18) % 4 === 0;
  ctx.fillStyle = pulse ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.045)';
  ctx.fillRect(startX + cell, startY + 15 * cell + Math.floor(cell * .55), cell * 6, Math.max(2, Math.floor(cell * .18)));
  sprite.forEach((row, r) => {
    row.forEach((idx, c) => {
      if (!idx) return;
      ctx.fillStyle = pulse && (idx === 5 || idx === 4) ? shiftColor(palette[idx], idx === 5 ? 0.2 : 0.12) : palette[idx];
      ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell);
    });
  });
  if (pulse) {
    ctx.fillStyle = shiftColor(color, 0.55);
    const fx = startX;
    const fy = startY;
    if (state.hero === 'sniper') {
      ctx.fillRect(fx + cell * 7, fy + cell * 10, Math.max(2, cell), Math.max(2, Math.floor(cell * .35)));
      ctx.fillRect(fx + cell * 7, fy + cell * 11, Math.max(2, Math.floor(cell * .45)), Math.max(2, Math.floor(cell * .45)));
    } else if (state.hero === 'wizard') {
      ctx.fillRect(fx + cell * 4, fy + cell * 6, Math.max(2, Math.floor(cell * .45)), Math.max(2, Math.floor(cell * .45)));
      ctx.fillRect(fx + cell * 3, fy + cell * 8, cell * 2, Math.max(2, Math.floor(cell * .3)));
    } else if (state.hero === 'king') {
      ctx.fillRect(fx + cell * 5, fy + cell * 14, cell, Math.max(2, Math.floor(cell * .35)));
      ctx.fillRect(fx + cell * 6, fy + cell * 15, cell, Math.max(2, Math.floor(cell * .35)));
    } else if (state.hero === 'priest') {
      ctx.fillRect(fx + cell * 3, fy + cell * 7, cell * 2, Math.max(2, Math.floor(cell * .35)));
      ctx.fillRect(fx + cell * 4, fy + cell * 6, Math.max(2, Math.floor(cell * .35)), cell * 2);
    } else {
      ctx.fillRect(fx + cell * 1, fy + cell * 2, cell * 2, Math.max(2, Math.floor(cell * .35)));
      ctx.fillRect(fx + cell * 5, fy + cell * 11, cell, Math.max(2, Math.floor(cell * .35)));
    }
  }
}

function drawBattleDancer(canvas = $('#battleDancerCanvas')) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const me = currentPlayer();
  const heroId = me.hero || state.hero;
  const topicColor = topicMeta(me.topic || state.topic).color;
  const spriteKey = heroSpriteKey(heroId);
  const sprite = HERO_SPRITES[spriteKey] || HERO_SPRITES.hunter;
  const palette = buildHeroPalette(spriteKey, topicColor);
  // 音乐播放时才跳舞；停止时定格成静止站姿（死亡跳舞复活时强制动）
  const animate = bgMusicPlaying || deathState.dancing;
  const beat = animate ? Math.floor(heroAnim.frame / 10) % 4 : 0;
  const sway = animate ? (beat === 1 ? -2 : beat === 3 ? 2 : 0) : 0;
  const bob = animate ? (beat === 0 || beat === 2 ? -1 : 1) : 0;
  const cell = Math.max(3, Math.floor(Math.min(canvas.width / 15, canvas.height / 22)));
  const startX = Math.floor((canvas.width - 8 * cell) / 2) + sway;
  const startY = Math.floor((canvas.height - 16 * cell) / 2) + bob + Math.max(4, Math.floor(cell * 1.3));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = beat % 2 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)';
  ctx.fillRect(Math.floor(canvas.width * .15), Math.floor(canvas.height * .84), Math.floor(canvas.width * .7), Math.max(3, Math.floor(cell * .7)));
  sprite.forEach((row, r) => {
    row.forEach((idx, c) => {
      if (!idx) return;
      let x = startX + c * cell;
      let y = startY + r * cell;
      if (animate) {
        if (r >= 10 && c <= 2) x -= beat === 1 ? 2 : 0;
        if (r >= 10 && c >= 5) x += beat === 3 ? 2 : 0;
        if (r >= 7 && r <= 10 && (c === 0 || c === 7)) y += beat % 2 ? -2 : 1;
      }
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, cell, cell);
    });
  });
  if (animate) {
    ctx.fillStyle = shiftColor(topicColor, .55);
    if (beat === 0) ctx.fillRect(Math.floor(canvas.width * .76), Math.floor(canvas.height * .18), cell * 2, Math.max(2, Math.floor(cell * .55)));
    if (beat === 2) ctx.fillRect(Math.floor(canvas.width * .16), Math.floor(canvas.height * .22), cell * 2, Math.max(2, Math.floor(cell * .55)));
  }
}

function tickHeroAnimation() {
  requestAnimationFrame(tickHeroAnimation);
  heroAnim.frame += 1;
  if (currentScreenName() === 'battle') {
    drawBattleDancer();
    if (deathState.dancing) drawBattleDancer($('#deathDancerCanvas'));
    if (!$('#resultPanel')?.classList.contains('hidden')) drawBattleDancer($('#resultDanceCanvas'));
    return;
  }
  if (currentScreenName() !== 'hero') return;
  drawHero();
  if (heroAnim.frame % 16 === 0) {
    stepRoomActors();
    drawRoomBoard();
  }
  if (heroAnim.frame % 12 === 0) drawFeatureCanvas();
}

function drawFeatureCanvas() {
  const canvas = $('#featureCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const topicColor = topicMeta().color;
  const currentHero = HEROES.find((item) => item.id === state.hero) || HEROES[0];
  const primary = roleTopicColor(currentHero.id, topicColor);
  const cell = Math.max(2, Math.floor(Math.min(canvas.width / 120, canvas.height / 44)));
  const artW = Math.ceil(canvas.width / cell);
  const artH = Math.ceil(canvas.height / cell);
  const px = (x, y, ww, hh, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x * cell, y * cell, ww * cell, hh * cell);
  };
  const dark = shiftColor(primary, -0.72);
  const mid = shiftColor(primary, -0.22);
  const light = shiftColor(primary, 0.54);
  const glow = shiftColor(topicColor, 0.68);
  const skin = '#ECD5B8';
  const skinShade = '#C98F66';
  const t = Math.floor(Date.now() / 520) % 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#030403';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  px(0, 0, artW, artH, '#07100f');

  const skyH = Math.floor(artH * 0.39);
  const shoreY = Math.floor(artH * 0.45);
  const waterY = Math.floor(artH * 0.5);
  for (let y = 0; y < skyH; y += 1) {
    px(0, y, artW, 1, y < skyH * 0.42 ? shiftColor(topicColor, -0.84) : shiftColor(topicColor, -0.74));
  }
  px(4, 14, 18, 3, shiftColor(topicColor, -0.58));
  px(11, 11, 22, 6, shiftColor(topicColor, -0.64));
  px(30, 13, 20, 4, shiftColor(topicColor, -0.6));
  px(46, 10, 28, 7, shiftColor(topicColor, -0.68));
  px(70, 12, 21, 5, shiftColor(topicColor, -0.56));
  px(87, 9, Math.max(26, artW - 87), 8, shiftColor(topicColor, -0.7));
  px(12, 12, 7, 2, light);
  px(51, 11, 9, 2, shiftColor(topicColor, 0.35));
  px(93, 10, 7, 2, light);

  px(0, shoreY, artW, 3, '#182018');
  px(0, waterY, artW, Math.max(1, artH - waterY), shiftColor(topicColor, -0.78));
  px(0, waterY + 3, artW, 1, shiftColor(topicColor, -0.48));
  for (let y = waterY + 5; y < artH - 1; y += 4) {
    for (let x = (y * 3 + t * 2) % 18; x < artW; x += 22) {
      px(x, y, 9 + ((x + y) % 3) * 3, 1, (x + y) % 4 ? shiftColor(topicColor, -0.36) : glow);
    }
  }
  for (let x = 0; x < artW; x += 10) {
    px(x, shoreY + 2 + ((x / 10) % 2), 7, 1, x % 20 ? dark : topicColor);
  }
  for (let x = 4; x < artW - 2; x += 13) {
    const reedH = 3 + ((x + t) % 5);
    px(x, artH - 2 - reedH, 1, reedH, shiftColor(primary, -0.5));
    px(x + 1, artH - 3 - reedH, 1, reedH, dark);
  }
  px(2, artH - 5, 16, 4, '#11130d');
  px(Math.max(70, artW - 32), artH - 5, 25, 5, '#12140e');
  px(Math.max(88, artW - 16), artH - 8, 12, 4, '#171810');

  px(28, 9, 13, 3, dark);
  px(24, 12, 19, 6, primary);
  px(23, 18, 7, 9, dark);
  px(30, 17, 14, 10, skin);
  px(42, 20, 4, 3, skin);
  px(45, 22, 2, 1, skinShade);
  px(38, 19, 2, 2, '#111111');
  px(32, 26, 10, 3, skinShade);
  px(25, 29, 22, 5, primary);
  px(20, 34, 32, 9, dark);
  px(28, 32, 16, 3, mid);
  px(19, 39, 34, 5, shiftColor(primary, -0.52));

  if (currentHero.id === 'sniper') {
    px(43, 16, 21, 2, light); px(61, 15, 3, 4, light); px(21, 13, 12, 2, shiftColor(primary, -0.9));
  } else if (currentHero.id === 'wizard') {
    px(24, 5, 17, 5, primary); px(28, 1, 8, 5, light); px(18, 25, 6, 15, shiftColor(primary, 0.2)); px(60, 14, 2, 24, glow); px(58, 12, 6, 4, glow);
  } else if (currentHero.id === 'king' && isCheckmateMode()) {
    px(22, 16, 27, 3, light); px(45, 17, 5, 4, light); px(14, 29, 10, 2, glow); px(11, 33, 12, 2, glow);
  } else if (currentHero.id === 'king') {
    // 侦察兵：护目镜横带 + 两侧镜片高光（取代王冠）
    px(20, 22, 30, 4, glow); px(22, 23, 9, 2, light); px(39, 23, 9, 2, light); px(15, 30, 8, 2, light);
  } else if (currentHero.id === 'priest') {
    px(33, 8, 3, 16, glow); px(27, 13, 15, 3, glow); px(20, 29, 10, 12, '#d9e3f2'); px(53, 12, 6, 6, light);
  } else {
    px(18, 14, 8, 14, light); px(15, 29, 9, 3, light); px(52, 15, 4, 16, glow);
  }

  px(27, 40, 24, 1, shiftColor(primary, 0.22));
  px(31, 42, 16, 1, shiftColor(topicColor, 0.3));
  px(60, 35, 30, 1, shiftColor(topicColor, -0.18));
  px(67, 38, 23, 1, glow);
}

function renderHeroScreen() {
  setTopicColor();
  const currentHero = heroView(HEROES.find((item) => item.id === state.hero) || HEROES[0]);
  $('#heroRoom').textContent = `ROOM ${state.roomId}`;
  const isTest = state.roomId.toLowerCase() === 'test';
  $('#heroState').textContent = isTest
    ? 'TEST · ∞'
    : `${state.room && state.room.state === 'playing' ? 'LIVE' : 'WAIT'} · ${formatTime(state.room && state.room.remainingSec)}`;
  const me = currentPlayer();
  $('#lockBtn').textContent = isTest ? 'LOCK' : (me.selectionLocked ? 'LOCKED' : 'LOCK');
  $('#lockBtn').classList.toggle('locked', !isTest && !!me.selectionLocked);
  $('#heroName').textContent = (currentHero.label || currentHero.id).toUpperCase();
  $('#heroLabel').textContent = currentHero.label;
  $('#heroTitle').textContent = currentHero.title;
  $('#heroSkill').textContent = currentHero.skill;
  $('#heroDelay').textContent = currentHero.delay;
  $('#heroLine').textContent = currentHero.line;

  $('#heroStrip').innerHTML = HEROES.map((hero) => (
    `<button class="hero-chip ${hero.id === state.hero ? 'active' : ''}" data-hero="${hero.id}" aria-label="${hero.label}">
      <span class="hero-thumb-icon">${heroMeta(hero.id).icon}</span>
    </button>`
  )).join('');
  const heroIndex = Math.max(0, HEROES.findIndex((hero) => hero.id === state.hero));
  $('#heroSliderFill').style.width = `${((heroIndex + 1) / HEROES.length) * 100}%`;
  $('#topicStrip').innerHTML = Object.keys(TOPICS).map((key) => (
    `<button class="topic-chip ${key === state.topic ? 'active' : ''}" data-topic="${key}" style="--topic:${TOPICS[key].color}" aria-label="${TOPICS[key].label}"></button>`
  )).join('');

  renderRoomBoard();
  drawHero();
  drawFeatureCanvas();
}

function renderRoomBoard() {
  const players = (state.room && state.room.players) || [];
  $('#playerCount').textContent = String(players.length);
  const topicCounts = {};
  const teamCounts = {};
  players.forEach((player) => {
    if (player.topic) topicCounts[player.topic] = (topicCounts[player.topic] || 0) + 1;
    if (player.topic === state.topic && player.hero) teamCounts[player.hero] = (teamCounts[player.hero] || 0) + 1;
  });
  $('#topicCounts').innerHTML = Object.keys(topicCounts).map((topic) => (
    `<div class="mini-row"><i style="background:${topicMeta(topic).color}"></i><span>${topicMeta(topic).label}</span><b>${topicCounts[topic]}</b></div>`
  )).join('') || '<div class="mini-row"><span>NO TEAM</span></div>';
  $('#teamCounts').innerHTML = Object.keys(teamCounts).map((hero) => (
    `<div class="mini-row"><i class="hero-dot" style="background:${heroMeta(hero).color}">${heroMeta(hero).icon}</i><span>${heroMeta(hero).label}</span><b>${teamCounts[hero]}</b></div>`
  )).join('') || '<div class="mini-row"><span>NO HERO</span></div>';
  syncRoomActors(players);
  drawRoomBoard();
}

function syncRoomActors(players) {
  const alive = {};
  (players || []).forEach((player, index) => {
    const id = player.playerId || `player-${index}`;
    alive[id] = true;
    if (!roomActors[id]) {
      roomActors[id] = {
        x: 0.2 + ((index * 37) % 60) / 100,
        y: 0.22 + ((index * 23) % 54) / 100,
        dx: (((index * 17) % 3) - 1) * 0.012 || 0.01,
        dy: (((index * 11) % 3) - 1) * 0.01 || -0.01,
        player,
      };
    } else {
      roomActors[id].player = player;
    }
  });
  Object.keys(roomActors).forEach((id) => {
    if (!alive[id]) delete roomActors[id];
  });
}

function stepRoomActors() {
  Object.keys(roomActors).forEach((id) => {
    const actor = roomActors[id];
    actor.x += actor.dx;
    actor.y += actor.dy;
    if (actor.x < 0.12 || actor.x > 0.88) {
      actor.dx *= -1;
      actor.x = Math.max(0.12, Math.min(0.88, actor.x));
    }
    if (actor.y < 0.16 || actor.y > 0.84) {
      actor.dy *= -1;
      actor.y = Math.max(0.16, Math.min(0.84, actor.y));
    }
    if (Math.random() < 0.08) {
      actor.dx += (Math.random() - 0.5) * 0.01;
      actor.dy += (Math.random() - 0.5) * 0.01;
      actor.dx = Math.max(-0.018, Math.min(0.018, actor.dx));
      actor.dy = Math.max(-0.018, Math.min(0.018, actor.dy));
    }
  });
}

function drawRoomBoard() {
  const canvas = $('#roomBoard');
  if (!canvas || !canvas.getContext) return;
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, w, h } = prepared;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  const cw = w / dpr;
  const ch = h / dpr;
  ctx.clearRect(0, 0, cw, ch);
  const pad = 8;
  const roomX = pad;
  const roomY = pad;
  const roomW = cw - pad * 2;
  const roomH = ch - pad * 2;
  ctx.fillStyle = '#090909';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#151515';
  ctx.fillRect(roomX, roomY, roomW, roomH);
  ctx.strokeStyle = topicMeta().color;
  ctx.lineWidth = 2;
  ctx.strokeRect(roomX, roomY, roomW, roomH);
  ctx.strokeStyle = 'rgba(232,58,40,.24)';
  ctx.lineWidth = 1;
  for (let x = roomX + 18; x < roomX + roomW; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, roomY); ctx.lineTo(x, roomY + roomH); ctx.stroke();
  }
  for (let y = roomY + 18; y < roomY + roomH; y += 18) {
    ctx.beginPath(); ctx.moveTo(roomX, y); ctx.lineTo(roomX + roomW, y); ctx.stroke();
  }
  if (!Object.keys(roomActors).length && state.playerId) {
    syncRoomActors([{ playerId: state.playerId, topic: state.topic, hero: state.hero }]);
  }
  Object.keys(roomActors).forEach((id) => {
    const actor = roomActors[id];
    const player = actor.player || {};
    const isMe = id === state.playerId;
    const topic = isMe ? state.topic : player.topic;
    const hero = isMe ? state.hero : player.hero;
    const x = roomX + actor.x * roomW;
    const y = roomY + actor.y * roomH;
    const color = topicMeta(topic).color || heroMeta(hero).color || '#ffffff';
    drawRoomPerson(ctx, x, y, color, isMe, hero);
  });
  ctx.restore();
}

function drawRoomPerson(ctx, x, y, color, isMe, hero) {
  const s = isMe ? 5 : 4;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - s), Math.round(y - s), s * 2, s * 2);
  ctx.fillStyle = '#111';
  ctx.fillRect(Math.round(x - s * 1.5), Math.round(y + s), s * 3, s * 2);
  ctx.fillStyle = '#fff';
  if (hero === 'sniper') {
    ctx.fillRect(Math.round(x + s), Math.round(y), s * 3, Math.max(2, Math.floor(s / 2)));
  } else if (hero === 'wizard') {
    ctx.fillRect(Math.round(x - s * 2), Math.round(y + s), s * 4, s);
  } else if (hero === 'king') {
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - s * 2), s, s);
    ctx.fillRect(Math.round(x + s), Math.round(y + s * 2), s, s);
  } else if (hero === 'priest') {
    ctx.fillRect(Math.round(x - 1), Math.round(y - s * 2), 2, s * 3);
    ctx.fillRect(Math.round(x - s), Math.round(y - s), s * 2, 2);
  } else {
    ctx.fillRect(Math.round(x + s), Math.round(y + s), s * 2, 2);
  }
  if (isMe) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x - s * 2), Math.round(y - s * 2), s * 4, s * 5);
  }
}

function getGameMode(roomId) {
  return String(roomId || '').trim().toLowerCase().startsWith('mate-') ? 'checkmate' : 'weiming';
}

async function joinRoom(event) {
  event.preventDefault();
  const rawRoom = $('#roomInput').value.trim() || 'test';
  const selectedMode = $('#joinForm .mode-tab.active')?.dataset.mode || 'weiming';
  // Checkmate 模式自动给房间名加 mate- 前缀
  let finalRoom = rawRoom;
  if (selectedMode === 'checkmate' && !rawRoom.toLowerCase().startsWith('mate-')) {
    finalRoom = `mate-${rawRoom}`;
  }
  state.roomId = finalRoom;
  state.mode = getGameMode(finalRoom);
  state.playerId = $('#playerInput').value.trim();
  if (!state.playerId) {
    alert('Please enter a player ID');
    return;
  }
  const res = await request('/rooms/join', { method: 'POST', data: { roomId: state.roomId, playerId: state.playerId } });
  state.room = res.room;
  saveSession();
  loadAlbum();
  $('#permissionRoom').textContent = `ROOM ${state.roomId}`;
  showScreen('permissions');
  setTimeout(maybeStartPermissionTutorial, 80);
  startPolling();
}

// Mode tab 切换
document.addEventListener('click', (e) => {
  const tab = e.target.closest?.('.mode-tab');
  if (!tab) return;
  document.querySelectorAll('.mode-tab').forEach((t) => t.classList.toggle('active', t === tab));
  const mode = tab.dataset.mode;
  const hint = document.getElementById('modeHint');
  if (hint) {
    hint.textContent = mode === 'checkmate'
      ? 'CHECKMATE MODE · King dynamic placement + 30-minute showdown'
      : 'WEIMING LAKE MODE · 15 fixed points + triangle siege';
  }
});

async function continueFromPermissions() {
  state.allowCamera = $('#setupCameraCheck') ? $('#setupCameraCheck').checked : true;
  state.allowLocation = $('#setupLocationCheck') ? $('#setupLocationCheck').checked : true;
  state.allowSpeech = $('#setupSpeechCheck') ? $('#setupSpeechCheck').checked : true;
  if (state.allowCamera) await ensureViewfinderCamera();
  if (state.allowLocation) await locate();
  if (state.allowSpeech) await primeSpeechPermission();
  showScreen('hero');
  renderHeroScreen();
  setTimeout(maybeStartHeroTutorial, 80);
}

async function fetchRoom() {
  if (!state.roomId) return;
  const res = await request(`/rooms/${state.roomId}`);
  state.room = res.room;
  // Trust the server's mode so the client can never drift to the wrong layout.
  if (state.room && state.room.mode) state.mode = state.room.mode;
}

async function fetchLandmarks() {
  if (!state.roomId) return;
  const res = await request(`/rooms/${state.roomId}/landmarks`);
  state.landmarks = res.landmarks || [];
}

async function lockSelection() {
  await ensureJoined();
  const payload = { roomId: state.roomId, playerId: state.playerId, topic: state.topic, hero: state.hero };
  let res;
  try {
    res = await request('/rooms/lock-selection', { method: 'POST', data: payload });
  } catch (e) {
    if (e.message !== 'Not found' && e.message !== 'HTTP 404') throw e;
    res = await request('/rooms/select', { method: 'POST', data: payload });
  }
  state.room = res.room;
  saveSession();
  renderHeroScreen();
}

async function enterBattle() {
  await ensureJoined();
  if (state.roomId.toLowerCase() === 'test') {
    await request('/rooms/select', {
      method: 'POST',
      data: { roomId: state.roomId, playerId: state.playerId, topic: state.topic, hero: state.hero },
    });
  } else {
    await lockSelection();
  }
  const res = await request(`/rooms/${state.roomId}/start`, {
    method: 'POST',
    data: { playerId: state.playerId },
  });
  state.room = res.room;
  state.trackLog = [];
  state.battleEventLog = [];
  state.battleStartTime = Date.now();
  seenEventIds.clear();
  state.lastTrackSampleAt = 0;
  await fetchLandmarks();
  showScreen('battle');
  renderBattle();
  logBattleEvent('start', '▶', 'Battle Start');
  setTimeout(maybeStartBattleTutorial, 120);
  if (state.allowLocation) {
    locate();
    startLocationWatch();
  }
  if (ensureTestRoomLocation()) {
    uploadLocation();
    if (!state.testLocPushTimer) {
      state.testLocPushTimer = setInterval(() => {
        const roomId = String(state.roomId || '').trim().toLowerCase();
        if (roomId !== 'test' && roomId !== 'testline') {
          clearInterval(state.testLocPushTimer);
          state.testLocPushTimer = null;
          return;
        }
        uploadLocation();
      }, 5000);
    }
  }
  if (state.allowCamera) ensureViewfinderCamera({ silent: true });
  startPolling();
  startPhotoExpiryTimer();
  initMechShutter();
}

function currentPlayer() {
  return ((state.room && state.room.players) || []).find((player) => player.playerId === state.playerId) || {};
}

async function ensureJoined() {
  if (!state.roomId || !state.playerId) {
    throw new Error('Enter a player ID on the home screen and join a room first');
  }
  const players = (state.room && state.room.players) || [];
  if (players.some((player) => player.playerId === state.playerId)) return;
  const res = await request('/rooms/join', {
    method: 'POST',
    data: { roomId: state.roomId, playerId: state.playerId },
  });
  state.room = res.room;
  saveSession();
}

function buildTargets() {
  const me = currentPlayer();
  const action = defaultAction();
  const isPriest = state.hero === 'priest';
  return ((state.room && state.room.players) || [])
    .filter((player) => {
      const isSelf = player.playerId === state.playerId;
      // 牧师：可治疗自己 + 队友（死活都可救）；攻击角色：只能选活着的敌人（排除自己）
      if (isPriest) return isSelf || sameTeam(player, me);
      if (isSelf) return false;
      const alive = player.status === 'alive' && Number(player.health == null ? 2 : player.health) > 0;
      return alive && !sameTeam(player, me);
    })
    .map((player) => {
      const isSelf = player.playerId === state.playerId;
      const relation = isSelf ? 'SELF' : (sameTeam(player, me) ? 'ALLY' : 'ENEMY');
      const isDead = player.status === 'dead' || Number(player.health == null ? 2 : player.health) <= 0;
      const canAttack = !isPriest && relation === 'ENEMY' && !isDead;
      const canHeal = isPriest && (relation === 'ALLY' || relation === 'SELF');  // 死活都可救，含自己
      return {
        ...player,
        relation,
        isDead,
        selectable: action === 'attack' ? canAttack : canHeal,
        health: player.health == null ? 2 : Number(player.health),
      };
    })
    .sort((a, b) => Number(b.selectable) - Number(a.selectable) || String(a.playerId).localeCompare(String(b.playerId)));
}

function normalizeColor(color) {
  return String(color || '').trim().toLowerCase();
}

function sameTeam(player, me = currentPlayer()) {
  const myTopic = me.topic || state.topic;
  const playerTopic = player.topic;
  const myColor = normalizeColor(topicMeta(myTopic).color);
  const playerColor = normalizeColor(topicMeta(playerTopic).color);
  return !!player && player.playerId !== state.playerId && (
    (playerTopic && playerTopic === myTopic)
    || (myColor && playerColor && playerColor === myColor)
  );
}

function allyPlayers() {
  const me = currentPlayer();
  const players = (state.room && state.room.players) || [];
  return players
    .filter((player) => sameTeam(player, me))
    .map((player) => ({ ...player, health: Math.max(0, Math.min(2, Number(player.health == null ? 2 : player.health))) }))
    .sort((a, b) => Number(b.health > 0) - Number(a.health > 0) || String(a.playerId).localeCompare(String(b.playerId)));
}

function allyStatus() {
  const allies = allyPlayers();
  return allies.find((player) => player.status !== 'dead' && player.health > 0) || allies[0] || null;
}

function defaultAction() {
  if (state.hero === 'priest') return 'heal';
  if (state.hero === 'wizard') return 'aoe';
  return 'attack';
}

const WIZARD_AOE_RADIUS = 10;

// ===== Checkmate KING 放点 UI =====

const CHECKMATE_READ_MS = { major: 60000, minor: 30000 };
const CHECKMATE_CD_LABEL = { major: '5min', minor: '2.5min' };
const placementState = { tab: 'minor', finalizeTimer: null, placingPlaceId: null };

function getMyKingState() {
  if (state.mode !== 'checkmate') return null;
  const topic = state.topic;
  if (!topic) return null;
  return (state.room?.kingState || {})[topic] || null;
}

function renderKingPanel() {
  const panel = $('#kingPanel');
  if (!panel) return;
  const isCheckmateKing = state.mode === 'checkmate' && state.hero === 'king';
  if (!isCheckmateKing) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const ks = getMyKingState();
  const majorQuota = ks?.majorQuota ?? 2;
  const minorQuota = ks?.minorQuota ?? 3;
  const now = Date.now();
  const cdRemainMs = Math.max(0, (ks?.nextPlaceAt || 0) - now);
  const placing = ks?.placing || null;
  const isPlacing = !!placing;
  const tab = placementState.tab;
  const quota = tab === 'major' ? majorQuota : minorQuota;
  const readSec = (CHECKMATE_READ_MS[tab] || 30000) / 1000;
  // 进行中的读条进度
  let progressHtml = '';
  if (isPlacing) {
    const total = placing.expectedAt - placing.startedAt;
    const elapsed = Math.min(total, now - placing.startedAt);
    const pct = total > 0 ? Math.round(elapsed / total * 100) : 0;
    const remainSec = Math.max(0, Math.ceil((placing.expectedAt - now) / 1000));
    progressHtml = `<div class="king-progress">
      <div class="king-progress-bar"><i style="width:${pct}%"></i></div>
      <div class="king-progress-text">${placing.type === 'major' ? 'MAJOR' : 'MINOR'} placing · ${remainSec}s</div>
    </div>`;
    // 安排自动 finalize（若还没安排）
    if (placementState.placingPlaceId !== placing.placeId) {
      placementState.placingPlaceId = placing.placeId;
      scheduleFinalize(placing.placeId, placing.expectedAt);
    }
  } else {
    placementState.placingPlaceId = null;
  }
  // CD 状态
  let cdHtml = '';
  if (cdRemainMs > 0) {
    const s = Math.ceil(cdRemainMs / 1000);
    cdHtml = `<span class="king-cd">CD ${s}s</span>`;
  }
  const btnDisabled = isPlacing || cdRemainMs > 0 || quota <= 0;
  const btnLabel = quota <= 0
    ? 'Quota Used Up'
    : (cdRemainMs > 0 ? 'Cooling Down' : (isPlacing ? 'Placing…' : `▶ Place ${tab === 'major' ? 'Major' : 'Minor'} Point (${readSec}s)`));
  panel.innerHTML = `
    <div class="king-tabs">
      <button class="king-tab ${tab === 'major' ? 'active' : ''}" data-king-tab="major" type="button">MAJOR ${majorQuota}/2</button>
      <button class="king-tab ${tab === 'minor' ? 'active' : ''}" data-king-tab="minor" type="button">MINOR ${minorQuota}/3</button>
    </div>
    <div class="king-meta">
      <span class="king-quota">Major ${majorQuota} · Minor ${minorQuota}</span>
      ${cdHtml}
    </div>
    <button class="king-place-btn ${tab === 'major' ? 'tier-major' : 'tier-minor'}" type="button" ${btnDisabled ? 'disabled' : ''} data-king-place="${tab}">${btnLabel}</button>
    ${progressHtml}
  `;
}

async function startCheckmatePlacement(type) {
  if (state.hero !== 'king') return;
  try {
    const res = await request('/checkmate/place/start', {
      method: 'POST',
      data: { roomId: state.roomId, playerId: state.playerId, type },
    });
    if (res.room) { state.room = res.room; syncTowerStateFromRoom(); }
    if (!res.ok) {
      setMapStatus(`✗ ${res.reason || 'Placement failed'}`);
      renderBattle();
      return;
    }
    playSfx('confirm', 0.8);
    setMapStatus(`▶ ${type === 'major' ? 'Major' : 'Minor'} point placing started · ${res.readMs / 1000}s`);
    renderBattle();
  } catch (e) {
    setMapStatus(`✗ ${e.message || 'Request failed'}`);
  }
}

function scheduleFinalize(placeId, expectedAt) {
  if (placementState.finalizeTimer) clearTimeout(placementState.finalizeTimer);
  const wait = Math.max(0, expectedAt - Date.now()) + 200;
  placementState.finalizeTimer = setTimeout(() => finalizeCheckmatePlacement(placeId), wait);
}

async function finalizeCheckmatePlacement(placeId) {
  const me = currentPlayer();
  const lat = (me && me.lat != null) ? me.lat : state.location?.lat;
  const lng = (me && me.lng != null) ? me.lng : state.location?.lng;
  if (lat == null || lng == null) {
    setMapStatus('✗ No location, placement voided · quota -1');
  }
  try {
    const res = await request('/checkmate/place/finalize', {
      method: 'POST',
      data: { roomId: state.roomId, playerId: state.playerId, placeId, lat, lng },
    });
    if (res.room) { state.room = res.room; syncTowerStateFromRoom(); }
    if (res.ok && res.tower) {
      playSfx('confirm', 1.1);
      logBattleEvent('capture', '◆', `Built ${res.tower.type === 'major' ? 'major' : 'minor'} point`);
      setMapStatus(`✓ ${res.tower.type === 'major' ? 'Major' : 'Minor'} point built`);
    } else {
      playSfx('error');
      const reason = res.reason || 'Placement failed';
      logBattleEvent('down', '✕', `Point voided: ${reason}`);
      setMapStatus(`✗ ${reason}${res.consumedQuota ? ' · quota -1' : ''}`);
    }
    placementState.placingPlaceId = null;
    renderBattle();
  } catch (e) {
    setMapStatus(`✗ ${e.message || 'Request failed'}`);
    placementState.placingPlaceId = null;
  }
}

function renderWizardPanel(combat) {
  const panel = $('#wizardPanel');
  if (!panel) return;
  if (state.hero !== 'wizard') {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const me = currentPlayer();
  const enemies = countEnemiesInAoe(me, WIZARD_AOE_RADIUS);
  const hp = Number(me.health == null ? 2 : me.health);
  const remainHp = Math.max(0, hp - 1);
  const fatal = remainHp <= 0;
  panel.innerHTML = `
    <div class="wz-runes" aria-hidden="true">
      <i>✝</i><i>◐</i><i>✦</i><i>◯</i><i>✝</i><i>◐</i><i>✦</i><i>◯</i>
    </div>
    <div class="wz-altar ${fatal ? 'fatal' : ''}">
      <div class="wz-sigil-ring"></div>
      <i class="wz-sigil">✝</i>
      <span class="wz-ember e1"></span>
      <span class="wz-ember e2"></span>
      <span class="wz-ember e3"></span>
    </div>
    <div class="wz-body">
      <div class="wz-label">S · A · C · R · I · F · I · C · E</div>
      <div class="wz-meta">
        <span><b>HP</b> ${hp} → ${remainHp}${fatal ? ' ✝' : ''}</span>
        <span><b>R</b> ${WIZARD_AOE_RADIUS}m</span>
        <span><b>HIT</b> ${enemies}</span>
      </div>
      <div class="wz-hint">${fatal ? '⚠ This sacrifice will down you' : 'Drag the fire pointer · trade 1 HP for area damage'}</div>
    </div>`;
  panel.classList.toggle('wz-fatal', fatal);
}

function countEnemiesInAoe(actor, radius = WIZARD_AOE_RADIUS) {
  if (!actor || actor.lat == null || actor.lng == null) return 0;
  const players = (state.room && state.room.players) || [];
  let count = 0;
  players.forEach((p) => {
    if (!p || p.playerId === state.playerId) return;
    if (p.status === 'dead') return;
    if (!p.topic || p.topic === actor.topic) return;
    if (p.lat == null || p.lng == null) return;
    if (distanceMeters(actor.lat, actor.lng, p.lat, p.lng) <= radius) count += 1;
  });
  return count;
}

function selectedAmmo() {
  const photo = state.photos[state.selectedPhotoIndex];
  if (!photo) return { available: false, text: 'NO FILM', title: 'NO PHOTO', desc: 'TAKE PHOTO' };
  const remain = PHOTO_TTL_MS - (Date.now() - Number(photo.createdAt || Date.now()));
  if (remain <= 0) return { photo, available: false, text: 'EXPIRED', title: 'PHOTO EXPIRED', desc: 'RESHOOT' };
  return { photo, available: true, text: `READY ${formatTime(Math.ceil(remain / 1000))}`, title: 'TARGET READY', desc: photo.cameraLabel || 'LIVE PHOTO' };
}

function selectFilmSlot(index) {
  const safeIndex = Math.max(0, Math.min(MAX_PHOTOS - 1, Number(index) || 0));
  state.selectedFilmIndex = safeIndex;
  state.selectedPhotoIndex = state.photos[safeIndex] ? safeIndex : -1;
  $$('#filmColumn .film.reveal-delete').forEach((slot) => slot.classList.remove('reveal-delete'));
  saveAlbum();
  renderBattle();
}

function toggleTowerPhotoSelection(index) {
  const safeIndex = Math.max(0, Math.min(MAX_PHOTOS - 1, Number(index) || 0));
  if (!state.photos[safeIndex]) return false;
  const current = Array.isArray(state.towerPhotoIndexes) ? state.towerPhotoIndexes.slice() : [];
  const existing = current.indexOf(safeIndex);
  if (existing >= 0) {
    current.splice(existing, 1);
  } else {
    if (current.length >= 3) current.shift();
    current.push(safeIndex);
  }
  state.towerPhotoIndexes = current;
  state.selectedTowerPoint = Math.max(0, Math.min(2, Math.max(0, current.length - 1)));
  renderBattle();
  return true;
}

function buildCombatState() {
  const me = currentPlayer();
  if (me.status === 'dead' || Number(me.health || 0) <= 0) return { canAct: false, title: 'PLAYER DOWN', desc: 'WAIT NEXT ROUND', button: 'LOCKED' };
  if (state.hero === 'wizard') {
    const ammo = selectedAmmo();
    if (!ammo.available) return { canAct: false, title: 'SELFIE NEEDED', desc: 'Take a front-camera photo before sacrificing', button: state.photos.length ? 'SELECT' : 'PHOTO' };
    const enemies = countEnemiesInAoe(me, WIZARD_AOE_RADIUS);
    const hp = Number(me.health == null ? 2 : me.health);
    const remainHp = Math.max(0, hp - 1);
    const photo = state.photos[state.selectedPhotoIndex];
    const isSelfie = photo && photo.facing === 'user';
    return {
      canAct: true,
      title: isSelfie ? 'SACRIFICE READY' : '⚠ NOT A SELFIE',
      desc: isSelfie
        ? (enemies > 0 ? `${enemies} enemies in range · self-immolate -1 HP` : `No enemies in range · self-immolate -1 HP (HP ${hp}→${remainHp})`)
        : 'This photo is not a front-camera selfie — dragging will fail',
      button: isSelfie ? '✝ SACRIFICE' : '⚠ INVALID PHOTO',
    };
  }
  const ammo = selectedAmmo();
  if (!ammo.available) return { canAct: false, title: ammo.title, desc: ammo.desc, button: state.photos.length ? 'SELECT' : 'PHOTO' };
  const targets = buildTargets();
  const target = targets.find((item) => item.playerId === state.selectedTargetId) || targets.find((item) => item.selectable);
  if (!target) return { canAct: false, title: state.hero === 'priest' ? 'NO ALLY TARGET' : 'NO ENEMY TARGET', desc: 'WAITING PLAYERS', button: 'NO TARGET' };
  state.selectedTargetId = target.playerId;
  if (!target.selectable) return { canAct: false, title: 'INVALID TARGET', desc: target.relation, button: 'SWITCH' };
  return { canAct: true, title: state.hero === 'priest' ? 'HEAL ALLY' : 'STRIKE ENEMY', desc: `${target.playerId} · ${target.relation} · HP ${target.health}/2`, button: state.hero === 'priest' ? 'HEAL' : 'STRIKE' };
}

function renderFilmSlots() {
  state.selectedFilmIndex = Math.max(0, Math.min(MAX_PHOTOS - 1, Number(state.selectedFilmIndex || 0)));
  if (state.photos.length && state.selectedPhotoIndex < 0) {
    state.selectedPhotoIndex = Math.min(state.selectedFilmIndex, state.photos.length - 1);
  }
  $$('#filmColumn .film').forEach((slot, index) => {
    const photo = state.photos[index];
    const expired = photo && PHOTO_TTL_MS - (Date.now() - Number(photo.createdAt || Date.now())) <= 0;
    const towerPicked = state.combatMode === 'tower' && Array.isArray(state.towerPhotoIndexes) && state.towerPhotoIndexes.includes(index);
    slot.dataset.filmIndex = String(index);
    slot.classList.toggle('active', state.combatMode === 'tower' ? towerPicked : index === state.selectedFilmIndex);
    slot.classList.toggle('tower-picked', towerPicked);
    slot.classList.toggle('empty', !photo);
    slot.classList.toggle('loaded', !!photo && !expired);
    slot.classList.toggle('spent', !!expired);
    if (photo) {
      slot.dataset.photoIndex = String(index);
      slot.style.backgroundImage = `linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.22)), url("${photo.path}")`;
    } else {
      delete slot.dataset.photoIndex;
      slot.style.backgroundImage = '';
    }
  });
  const loaded = $('#drawerLoaded');
  if (loaded) loaded.textContent = `${state.photos.length} / 5`;
  syncAmmoFlowToFilm();
}

function syncAmmoFlowToFilm() {
  const flow = $('.ammo-flow');
  if (!flow) return;
  const towerFrozen = state.combatMode === 'tower' && !!(selectedTowerPoi()?.ownerTopic);
  flow.style.opacity = towerFrozen ? '0' : '';
  if (towerFrozen) return;
  const active = $('#filmColumn .film.active');
  const device = $('.battle-device');
  if (!active || !device) return;
  const activeRect = active.getBoundingClientRect();
  const deviceRect = device.getBoundingClientRect();
  const top = Math.round(activeRect.top + activeRect.height / 2 - deviceRect.top);
  flow.style.setProperty('--flow-top', `${top}px`);
}

function renderHpLamps(me) {
  const hp = deathState.debugDead ? 0 : Math.max(0, Math.min(2, Number(me.health == null ? 2 : me.health)));
  $$('#hpLamps .hp-lamp').forEach((lamp, index) => {
    lamp.classList.toggle('on', hp > index);
    lamp.classList.toggle('off', hp > 0 && hp <= index);
    lamp.classList.toggle('warn', hp === 1 && index === 0);
    lamp.classList.toggle('dead', hp <= 0);
  });
}

function syncViewfinderProfile() {
  const viewfinderShell = $('.viewfinder');
  if (!viewfinderShell) return;
  const profile = cameraProfile();
  viewfinderShell.classList.remove(...CAMERA_PROFILE_CLASSES);
  viewfinderShell.classList.add(profile.className);
  viewfinderShell.dataset.cameraProfile = profile.type;
}

function syncCameraControls() {
  const viewfinderShell = $('.viewfinder');
  viewfinderShell?.classList.toggle('mirror-on', !!state.cameraMirror);
  syncViewfinderProfile();
  $('#flipCameraBtn')?.classList.toggle('active', state.cameraFacing === 'user');
}

function syncPermissionControls() {
  $('#permissionCameraBtn')?.classList.toggle('active', !!state.cameraStream);
  $('#permissionLocationBtn')?.classList.toggle('active', !!state.location.ready);
}

function sfxContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!sfxAudio) sfxAudio = new AudioContext();
    if (sfxAudio.state === 'suspended') sfxAudio.resume();
    return sfxAudio;
  } catch (e) {
    return null;
  }
}

function playTone(ctx, at, freq, dur, gainValue, type = 'triangle') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.012);
}

function playNoise(ctx, at, dur = 0.07, gainValue = 0.03) {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1200, at);
  gain.gain.setValueAtTime(gainValue, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(at);
}

function playSfx(kind = 'tap', strength = 1) {
  const ctx = sfxContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const g = Math.max(0.45, Math.min(1.4, strength));
  const bank = {
    tap: [[760, 0, .045, .022, 'triangle']],
    select: [[620, 0, .045, .018, 'triangle'], [920, .035, .055, .024, 'sine']],
    toggle: [[520, 0, .04, .018, 'square'], [740, .04, .05, .018, 'triangle']],
    panel: [[420, 0, .045, .018, 'triangle'], [860, .035, .08, .026, 'sine']],
    back: [[560, 0, .05, .02, 'triangle'], [360, .045, .07, .018, 'sine']],
    confirm: [[520, 0, .045, .02, 'triangle'], [760, .04, .055, .025, 'triangle'], [1080, .085, .075, .03, 'sine']],
    shutter: [[130, 0, .055, .035, 'square'], [900, .018, .045, .022, 'triangle']],
    gear: [[390 + g * 95, 0, .038, .026 + g * .008, 'square']],
    impact: [[92, 0, .11, .055, 'square'], [280, .015, .09, .032, 'sawtooth'], [720, .06, .07, .025, 'triangle']],
    error: [[220, 0, .08, .026, 'sawtooth'], [160, .06, .1, .02, 'sawtooth']],
  };
  (bank[kind] || bank.tap).forEach(([freq, offset, dur, gainValue, type]) => {
    playTone(ctx, now + offset, freq, dur, gainValue * g, type);
  });
  if (kind === 'shutter') playNoise(ctx, now + .012, .055, .026 * g);
  if (kind === 'impact') playNoise(ctx, now, .12, .038 * g);
}

function buttonSfxKind(target) {
  if (!target) return 'tap';
  if (target.dataset.action === 'back' || target.dataset.close != null || target.id === 'closeCameraBtn') return 'back';
  if (target.id === 'cameraBtn' || target.id === 'captureBtn' || target.dataset.camera != null) return 'shutter';
  if (target.id === 'lockBtn' || target.id === 'enterBattleBtn' || target.id === 'permissionContinueBtn' || target.id === 'savePhotoBtn') return 'confirm';
  if (target.id === 'combatBtn' || target.dataset.combatUse != null) return 'impact';
  if (target.dataset.panel || target.dataset.mode || target.id === 'locateBtn' || target.dataset.action === 'refresh') return 'panel';
  if (target.dataset.hero || target.dataset.topic || target.dataset.target || target.dataset.photoIndex != null || target.dataset.slot != null) return 'select';
  if (target.id === 'flipCameraBtn') return 'toggle';
  return 'tap';
}

function isCurrentPlayerDead(me = currentPlayer()) {
  return me.status === 'dead' || Number(me.health == null ? 2 : me.health) <= 0;
}

function latestDeathInfo() {
  const meId = state.playerId;
  const events = ((state.room && state.room.events) || []).slice().reverse();
  const kill = events.find((event) => event.type === 'kill' && event.targetPlayerId === meId);
  const death = events.find((event) => event.type === 'death' && event.targetPlayerId === meId);
  const event = kill || death || null;
  const killer = event && event.actorPlayerId && event.actorPlayerId !== meId ? event.actorPlayerId : 'UNKNOWN';
  return {
    key: event ? event.eventId : `${state.roomId}:${meId}:dead`,
    killer,
  };
}

function runStoneReviveCountdown(seconds) {
  return new Promise((resolve) => {
    const duration = seconds * 1000;
    const startAt = Date.now();
    const bar = $('#stoneReviveBar');
    const fill = $('#stoneReviveFill');
    const timerEl = $('#stoneReviveTimer');
    if (bar) bar.classList.remove('hidden');
    if (fill) fill.style.width = '0%';
    if (timerEl) timerEl.textContent = `${seconds}s`;
    if (stoneReviveInterval) clearInterval(stoneReviveInterval);
    stoneReviveInterval = setInterval(() => {
      const elapsed = Date.now() - startAt;
      const pct = Math.min(1, elapsed / duration);
      const remain = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      if (fill) fill.style.width = `${Math.round(pct * 100)}%`;
      if (timerEl) timerEl.textContent = `${remain}s`;
      if (pct >= 1) {
        clearInterval(stoneReviveInterval);
        stoneReviveInterval = null;
        if (bar) bar.classList.add('hidden');
        resolve();
      }
    }, 80);
  });
}

function renderDeathState(me = currentPlayer()) {
  const overlay = $('#deathOverlay');
  if (!overlay) return;
  const dead = deathState.debugDead || isCurrentPlayerDead(me);
  if (!dead) {
    overlay.classList.add('hidden');
    $('#deathPrompt')?.classList.remove('hidden');
    $('#danceRevive')?.classList.add('hidden');
    $('#stoneReviveBar')?.classList.add('hidden');
    if (stoneReviveInterval) { clearInterval(stoneReviveInterval); stoneReviveInterval = null; }
    deathState.lastDeathKey = '';
    deathState.stoneHintKey = '';
    deathState.stoneMessage = '';
    deathState.debugDead = false;
    deathState.debugKillerId = '';
    deathState.deathLogged = false;
    return;
  }
  if (!deathState.deathLogged) {
    deathState.deathLogged = true;
    const info = deathState.debugDead ? { killer: deathState.debugKillerId || '???' } : latestDeathInfo();
    logBattleEvent('down', '✕', `Knocked down by ${info.killer || '?'}`);
  }
  overlay.classList.remove('hidden');
  const info = deathState.debugDead && !isCurrentPlayerDead(me)
    ? { key: `debug-${deathState.debugKillerId}`, killer: deathState.debugKillerId || '???' }
    : latestDeathInfo();
  if (!deathState.dancing) {
    $('#deathPrompt')?.classList.remove('hidden');
    $('#danceRevive')?.classList.add('hidden');
    const killerEl = $('#deathKiller');
    if (killerEl) {
      const hasKiller = info.killer && info.killer !== 'UNKNOWN' && info.killer !== '???';
      killerEl.textContent = hasKiller ? `${info.killer} eliminated you` : '';
      killerEl.classList.toggle('hidden', !hasKiller);
    }
    $('#deathTitle').textContent = 'YOU WERE ELIMINATED';
    $('#deathText').textContent = deathState.stoneMessage
      || (deathState.stoneHintKey === info.key
        ? 'Head to the Stone Archway revive point. You revive automatically within its 30m detection radius.'
        : 'Head to the Stone Archway revive point to revive. The detection radius is 30m.');
    deathState.lastDeathKey = info.key;
  }
}

async function revivePlayer(method = 'dance') {
  const res = await request('/players/revive', {
    method: 'POST',
    data: { roomId: state.roomId, playerId: state.playerId, method },
  });
  state.room = res.room;
  renderBattle();
  return res;
}

function finishDanceRevive() {
  if (deathState.danceTimer) {
    clearInterval(deathState.danceTimer);
    deathState.danceTimer = null;
  }
  deathState.dancing = false;
  deathState.debugDead = false;
  deathState.debugKillerId = '';
  $('#danceProgress')?.style.setProperty('--dance-progress', '100%');
  revivePlayer('dance').catch((e) => {
    alert(e.message || 'Revive failed, please try again');
    renderDeathState(currentPlayer());
  });
}

function updateDanceRevive() {
  const elapsed = Date.now() - deathState.danceStartedAt;
  const duration = 60000;
  const pct = Math.max(0, Math.min(1, elapsed / duration));
  const remain = Math.max(0, Math.ceil((duration - elapsed) / 1000));
  $('#danceTimer').textContent = `${remain}s`;
  $('#danceProgress')?.style.setProperty('--dance-progress', `${Math.round(pct * 100)}%`);
  if (pct >= 1) finishDanceRevive();
}

function startDanceRevive() {
  if (deathState.dancing) return;
  deathState.dancing = true;
  deathState.danceStartedAt = Date.now();
  $('#deathOverlay')?.classList.remove('hidden');
  $('#deathPrompt')?.classList.add('hidden');
  $('#danceRevive')?.classList.remove('hidden');
  $('#danceProgress')?.style.setProperty('--dance-progress', '0%');
  playSfx('confirm', 1.1);
  if (deathState.danceTimer) clearInterval(deathState.danceTimer);
  deathState.danceTimer = setInterval(updateDanceRevive, 120);
  updateDanceRevive();
}

const SHIFANG_REVIVE = { lat: 39.993439, lng: 116.303833, radius: 30 };

async function chooseStoneRevive() {
  const btn = $('#reviveStoneBtn');
  const isTestRoom = String(state.roomId || '').toLowerCase() === 'test';

  // test 房间跳过定位，直接视为在范围内
  if (isTestRoom) {
    if (btn) { btn.disabled = true; btn.textContent = 'Reviving…'; }
    deathState.stoneMessage = '(Test mode) Reviving…';
    $('#deathText').textContent = deathState.stoneMessage;
    playSfx('confirm', 1.2);
    // 注意：倒计时期间保留 debugDead=true，让轮询进入死亡分支，
    // 死亡分支不会隐藏进度条；倒计时结束后再清除，然后 revivePlayer
    // 内部调用 renderBattle() 时 dead=false，overlay 正常消失。
    await runStoneReviveCountdown(15);
    deathState.debugDead = false; // 倒计时结束后再清除调试死亡标记
    await revivePlayer('stone');
    deathState.stoneMessage = '';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Locating…'; }
  deathState.stoneMessage = 'Getting your location…';
  $('#deathText').textContent = deathState.stoneMessage;

  try {
    await locate();
    const loc = state.location;
    if (!loc.ready) {
      deathState.stoneMessage = 'Could not get location. Turn on GPS and try again.';
      $('#deathText').textContent = deathState.stoneMessage;
      if (btn) { btn.disabled = false; btn.textContent = 'Relocate'; }
      playSfx('error');
      return;
    }

    const distShifang = Math.round(distanceMeters(loc.lat, loc.lng, SHIFANG_REVIVE.lat, SHIFANG_REVIVE.lng));
    const inRange = distShifang <= SHIFANG_REVIVE.radius;

    if (inRange) {
      deathState.stoneMessage = 'Reached the revive point, reviving…';
      $('#deathText').textContent = deathState.stoneMessage;
      if (btn) { btn.disabled = true; btn.textContent = 'Reviving…'; }
      playSfx('confirm', 1.2);
      // 倒计时期间不清 debugDead，保持 overlay 可见（轮询死亡分支不会动进度条）
      await runStoneReviveCountdown(15);
      deathState.debugDead = false; // 倒计时结束后再清除
      await revivePlayer('stone');
      deathState.stoneMessage = '';
    } else {
      deathState.stoneMessage = `${distShifang}m from the Stone Archway — get within 30m and tap revive again.`;
      $('#deathText').textContent = deathState.stoneMessage;
      if (btn) { btn.disabled = false; btn.textContent = 'Relocate'; }
      $('#mapToggle').checked = true;
      playSfx('error');
      vibrate(80);
    }
  } catch (e) {
    deathState.stoneMessage = 'Location or revive failed, please try again.';
    $('#deathText').textContent = deathState.stoneMessage;
    if (btn) { btn.disabled = false; btn.textContent = 'Relocate'; }
    playSfx('error');
  }
}

function debugInstantDie() {
  if (!state.room) state.room = {};
  if (!state.room.players) state.room.players = [];
  if (isTeamBuffActive(state.topic, 'ghost')) {
    logBattleEvent('heal', '◈', 'Ghost: immune to one lethal hit');
    playSfx('confirm');
    return;
  }
  const allPlayers = (state.room && state.room.players) || [];
  const enemies = allPlayers.filter((p) => p.playerId !== state.playerId && !sameTeam(p));
  const killerId = enemies.length ? enemies[Math.floor(Math.random() * enemies.length)].playerId : '???';
  let me = allPlayers.find((p) => p.playerId === state.playerId);
  if (!me) {
    me = { playerId: state.playerId, health: 0, status: 'dead', topic: state.topic, hero: state.hero };
    state.room.players.push(me);
  } else {
    me.health = 0;
    me.status = 'dead';
  }
  if (!state.room.events) state.room.events = [];
  state.room.events.push({
    eventId: `dbg-die-${Date.now()}`,
    type: 'kill',
    actorPlayerId: killerId,
    targetPlayerId: state.playerId,
    ts: Date.now(),
  });
  deathState.debugDead = true;
  deathState.debugKillerId = killerId;
  deathState.dancing = false;
  playSfx('error');
  renderBattle();
}

function resultTitleLabel(stats) {
  const { kills = 0, heals = 0, captures = 0 } = stats;
  if (kills > heals && kills > captures) return 'Field Striker';
  if (heals > kills && heals > captures) return 'Battlefield Medic';
  if (captures > kills && captures > heals) return 'Point Controller';
  if (kills + heals + captures === 0) return 'Field Soldier';
  return 'All-Round Warrior';
}

function renderResultScreen() {
  const myTopic = ownTopic();
  const allPlayers = (state.room && state.room.players) || [{ playerId: state.playerId || 'PLAYER', topic: myTopic, hero: state.hero }];
  const statsList = (state.room && state.room.playerStats) || [];
  const myStats = buildSelfStats();

  let allyTowers, enemyTowers;
  if (state.mode === 'checkmate') {
    const dt = (state.room && state.room.dynamicTowers) || [];
    allyTowers = dt.filter((t) => t.active && t.ownerTopic === myTopic).length;
    enemyTowers = dt.filter((t) => t.active && t.ownerTopic && t.ownerTopic !== myTopic).length;
  } else {
    allyTowers = TOWER_POINTS.filter((pt) => pt.ownerTopic === myTopic).length;
    enemyTowers = TOWER_POINTS.filter((pt) => pt.ownerTopic && pt.ownerTopic !== myTopic).length;
  }
  // Checkmate 用 topicScores 判胜负
  const scores = (state.room && state.room.topicScores) || {};
  const myScore = Number(scores[myTopic] || 0);
  const enemyTopScore = Math.max(0, ...Object.entries(scores)
    .filter(([t]) => t !== myTopic).map(([, v]) => Number(v) || 0));
  const victory = state.mode === 'checkmate' ? myScore >= enemyTopScore : allyTowers >= enemyTowers;
  const myTopicMeta = topicMeta(myTopic);

  const set = (id, val) => { const el = $(`#${id}`); if (el) el.textContent = val; };
  set('resVerdict', victory ? 'VICTORY' : 'DEFEAT');
  set('resVerdictSub', `${myTopicMeta.label} ${victory ? 'WINS' : 'LOSES'}`);
  set('resAllyLabel', myTopicMeta.label.toUpperCase());
  if (state.mode === 'checkmate') {
    set('resAllyScore', `${allyTowers} pts · ${Math.round(myScore)} score`);
    set('resEnemyScore', `${enemyTowers} pts · ${Math.round(enemyTopScore)} score`);
  } else {
    set('resAllyScore', allyTowers);
    set('resEnemyScore', enemyTowers);
  }
  set('resMyScore', state.mode === 'checkmate' ? Math.round(myScore) : statScore(myStats));
  set('resTitle', resultTitleLabel(myStats));
  set('resCombat', myStats.kills || 0);
  set('resSupport', myStats.heals || 0);
  set('resControl', myStats.captures || 0);

  const allies = allPlayers.filter((p) => p.playerId !== state.playerId && sameTeam(p));
  const allyScores = allies.map((p) => statScore(statsList.find((s) => s.playerId === p.playerId) || {}));
  const avgScore = allyScores.length ? Math.round(allyScores.reduce((a, b) => a + b, 0) / allyScores.length) : statScore(myStats);
  set('resTeamAvg', avgScore);

  const events = ((state.room && state.room.events) || []).slice().reverse();
  const myEvents = events.filter((e) => e.actorPlayerId === state.playerId || e.targetPlayerId === state.playerId).slice(0, 6);
  const logEl = $('#resLog');
  if (logEl) {
    logEl.innerHTML = myEvents.map((e) => {
      let icon = '⌖'; let desc = formatEventText(e); let pts = '';
      if (e.type === 'kill' && e.actorPlayerId === state.playerId) { icon = '⌖'; desc = `Knocked down ${escapeHTML(e.targetPlayerId || '?')}`; pts = '+3'; }
      else if (e.type === 'kill' && e.targetPlayerId === state.playerId) { icon = '✕'; desc = `Knocked down by ${escapeHTML(e.actorPlayerId || '?')}`; pts = '-1'; }
      else if (e.type === 'heal') { icon = '✚'; desc = `Healed ${escapeHTML(e.targetPlayerId || '?')}`; pts = '+1'; }
      else if (e.type === 'capture') { icon = '⚑'; desc = `Captured ${escapeHTML(e.targetName || 'point')}`; pts = '+2'; }
      const ts = e.ts ? new Date(e.ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
      return `<div class="res-log-row"><span class="res-log-icon">${icon}</span><span class="res-log-time">${ts}</span><span class="res-log-desc">${desc}</span><span class="res-log-pts">${pts}</span></div>`;
    }).join('') || '<div class="res-log-row"><span class="res-log-desc" style="grid-column:1/-1;opacity:.5">No combat log yet</span></div>';
  }
}

function renderHistoryPanel() {
  const myStats = buildSelfStats();
  const deathCount = (state.battleEventLog || []).filter((e) => e.type === 'down').length;
  const killCount = (state.battleEventLog || []).filter((e) => e.type === 'kill').length;
  const set = (id, val) => { const el = $(`#${id}`); if (el) el.textContent = val; };
  const usedPhotos = state.usedPhotos || [];
  set('histPhotos', usedPhotos.length);
  set('histKills', killCount);
  set('histDown', deathCount);
  set('resMemCount', `${usedPhotos.length}`);

  // photo memory — categorised by use type
  const strip = $('#resMemStrip');
  if (strip) {
    const skillPhotos = usedPhotos.filter((p) => p.useType === 'skill');
    const towerPhotos = usedPhotos.filter((p) => p.useType === 'tower');
    const catHtml = (icon, label, photos) => {
      if (!photos.length) return '';
      const cards = photos.map((p) => {
        const thumb = p.path ? `<img src="${escapeHTML(p.path)}" alt="">` : '';
        return `<article class="res-mem-card">
          <div class="res-mem-thumb">${thumb}</div>
          <div><strong>${escapeHTML(p.useTarget || '?')}</strong><small>${label}</small></div>
        </article>`;
      }).join('');
      return `<div class="res-mem-cat">
        <div class="res-mem-cat-label">${icon} ${label} <span>×${photos.length}</span></div>
        <div class="res-mem-cat-strip">${cards}</div>
      </div>`;
    };
    strip.innerHTML = catHtml('⌖', 'SKILL', skillPhotos) + catHtml('⚑', 'TOWER', towerPhotos)
      || '<div class="rht-empty">No photos used this match</div>';
  }

  // AMap track
  renderHistAmapTrack();

  // event timeline
  const timeline = $('#resHistTimeline');
  if (timeline) {
    const events = state.battleEventLog || [];
    const startT = state.battleStartTime || (events[0]?.t || Date.now());
    const fmtT = (t) => {
      const s = Math.max(0, Math.round((t - startT) / 1000));
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    timeline.innerHTML = events.length
      ? events.map((e) => `<div class="rht-row rht-${e.type}">
          <span class="rht-icon">${escapeHTML(e.icon)}</span>
          <span class="rht-desc">${escapeHTML(e.desc)}</span>
          <span class="rht-time">${fmtT(e.t)}</span>
        </div>`).join('')
      : '<div class="rht-empty">No combat log yet</div>';
  }
}


async function renderHistAmapTrack() {
  const container = $('#resHistAmap');
  if (!container) return;
  try {
    const AMap = await loadAmapScript();
    if (state.amap.histMap) { state.amap.histMap.destroy(); state.amap.histMap = null; }
    const track = state.trackLog || [];
    const mid = track.length > 0 ? track[Math.floor(track.length / 2)] : null;
    const center = mid ? wgs84ToGcj02(mid.lat, mid.lng) : [116.3033, 39.9930];
    const map = new AMap.Map('resHistAmap', {
      zoom: 16,
      center,
      mapStyle: 'amap://styles/dark',
      resizeEnable: true,
    });
    state.amap.histMap = map;
    if (track.length > 1) {
      new AMap.Polyline({
        path: track.map((p) => wgs84ToGcj02(p.lat, p.lng)),
        strokeColor: '#ffffff',
        strokeWeight: 3,
        strokeOpacity: 0.55,
        strokeStyle: 'dashed',
        strokeDasharray: [8, 5],
        map,
      });
    }
    if (track.length > 0) {
      const s = wgs84ToGcj02(track[0].lat, track[0].lng);
      const e = wgs84ToGcj02(track[track.length - 1].lat, track[track.length - 1].lng);
      new AMap.Marker({ position: s, content: '<div class="hist-map-pin ev-start">▶</div>', offset: new AMap.Pixel(-10, -10), map });
      new AMap.Marker({ position: e, content: '<div class="hist-map-pin ev-end">■</div>', offset: new AMap.Pixel(-10, -10), map });
    }
    (state.battleEventLog || []).filter((e) => e.lat && e.lng && e.type !== 'start' && e.type !== 'end').forEach((e) => {
      const pos = wgs84ToGcj02(e.lat, e.lng);
      new AMap.Marker({
        position: pos,
        content: `<div class="hist-map-pin ev-${escapeHTML(e.type)}" title="${escapeHTML(e.desc)}">${escapeHTML(e.icon)}</div>`,
        offset: new AMap.Pixel(-10, -10),
        map,
      });
    });
    state.photos.filter((p) => p.locationReady).forEach((p, i) => {
      const pos = wgs84ToGcj02(Number(p.lat), Number(p.lng));
      new AMap.Marker({
        position: pos,
        content: `<div class="hist-map-pin ev-photo">${i + 1}</div>`,
        offset: new AMap.Pixel(-10, -10),
        map,
      });
    });
  } catch (err) {
    console.warn('hist amap error', err);
  }
}

function logBattleEvent(type, icon, desc) {
  const loc = state.location?.ready ? { lat: state.location.lat, lng: state.location.lng } : {};
  state.battleEventLog = state.battleEventLog || [];
  state.battleEventLog.push({ type, icon, desc, t: Date.now(), ...loc });
}

function gpsToHistPct(lat, lng) {
  const x = Math.max(2, Math.min(97, (lng - 116.299) / 0.009 * 100));
  const y = Math.max(2, Math.min(97, (39.996 - lat) / 0.005 * 100));
  return [x, y];
}

function closeResultPanels() {
  $('#resultPanel')?.classList.add('hidden');
  $('#historyPanel')?.classList.add('hidden');
}

function simulateLHRData() {
  if (!state.topic) state.topic = 'wuxia';
  const now = Date.now();
  const start = now - 600000;
  state.battleStartTime = start;
  state.trackLog = [];
  state.battleEventLog = [];

  // 步行路线：[lat, lng, 距开始的秒数]，绕未名湖一圈约10min
  const route = [
    [39.99311, 116.30188,   0],  // 出发：钟亭附近
    [39.99302, 116.30192,  22],
    [39.99295, 116.30213,  52],
    [39.99280, 116.30247,  88],
    [39.99262, 116.30271, 122],
    [39.99235, 116.30290, 158],  // 临湖轩
    [39.99234, 116.30295, 178],
    [39.99238, 116.30318, 210],
    [39.99246, 116.30335, 244],  // 赖朴吾·夏仁德墓
    [39.99257, 116.30372, 278],
    [39.99263, 116.30427, 316],  // 斯诺墓碑
    [39.99273, 116.30436, 350],
    [39.99275, 116.30433, 368],  // 山门
    [39.99274, 116.30465, 400],
    [39.99270, 116.30520, 436],
    [39.99269, 116.30573, 472],  // 博雅塔
    [39.99270, 116.30570, 490],
    [39.99273, 116.30542, 512],  // 被击倒处，等待复活
    [39.99279, 116.30487, 534],
    [39.99290, 116.30415, 556],  // 治疗处
    [39.99301, 116.30323, 576],
    [39.99311, 116.30235, 600],  // 返回出发点
  ];

  function linterp(t) {
    for (let i = 0; i < route.length - 1; i++) {
      const [la0, lo0, t0] = route[i];
      const [la1, lo1, t1] = route[i + 1];
      if (t >= t0 && t <= t1) {
        const f = (t - t0) / (t1 - t0);
        return [la0 + (la1 - la0) * f, lo0 + (lo1 - lo0) * f];
      }
    }
    return [route[route.length - 1][0], route[route.length - 1][1]];
  }

  // 每10s采一个轨迹点，加轻微GPS抖动
  for (let s = 0; s <= 600; s += 10) {
    const [lat, lng] = linterp(s);
    const j = () => (Math.random() - 0.5) * 0.000022;
    state.trackLog.push({ lat: lat + j(), lng: lng + j(), t: start + s * 1000 });
  }

  // 战斗事件
  const ev = (type, icon, desc, s, lat, lng) =>
    state.battleEventLog.push({ type, icon, desc, t: start + s * 1000, lat, lng });

  ev('start',   '▶', 'Battle Start',                 0,   39.99311, 116.30188);
  ev('capture', '⚑', 'Captured Linhu Xuan',         162,  39.99235, 116.30290);
  ev('kill',    '⌖', 'Knocked down enemy_blue01',   218,  39.99239, 116.30312);
  ev('capture', '⚑', 'Captured Laipuwu & Xiarende Tomb', 248, 39.99246, 116.30335);
  ev('kill',    '⌖', 'Knocked down enemy_pixel01',  328,  39.99264, 116.30432);
  ev('capture', '⚑', 'Captured Mountain Gate',      372,  39.99275, 116.30433);
  ev('down',    '✕', 'Knocked down by enemy_digital01', 480, 39.99269, 116.30573);
  ev('heal',    '✚', 'Healed ally_wuxia01',         548,  39.99287, 116.30443);
  ev('kill',    '⌖', 'Knocked down enemy_modern01', 568,  39.99294, 116.30388);
  ev('end',     '■', 'Battle End',                  600,  39.99311, 116.30235);

  // 模拟消耗照片记录
  state.usedPhotos = [
    { photoId: 'sim_162', path: null, useType: 'tower', useTarget: 'Linhu Xuan',         lat: 39.99235, lng: 116.30290, locationReady: true, createdAt: start + 158000 },
    { photoId: 'sim_218', path: null, useType: 'skill', useTarget: 'enemy_blue01',   lat: 39.99239, lng: 116.30312, locationReady: true, createdAt: start + 210000 },
    { photoId: 'sim_248', path: null, useType: 'tower', useTarget: 'Laipuwu & Xiarende Tomb', lat: 39.99246, lng: 116.30335, locationReady: true, createdAt: start + 244000 },
    { photoId: 'sim_328', path: null, useType: 'skill', useTarget: 'enemy_pixel01',  lat: 39.99264, lng: 116.30432, locationReady: true, createdAt: start + 316000 },
    { photoId: 'sim_372', path: null, useType: 'tower', useTarget: 'Mountain Gate',           lat: 39.99275, lng: 116.30433, locationReady: true, createdAt: start + 368000 },
    { photoId: 'sim_568', path: null, useType: 'skill', useTarget: 'enemy_modern01', lat: 39.99294, lng: 116.30388, locationReady: true, createdAt: start + 556000 },
  ];

  // 把路过并占领的据点标记为wuxia队
  ['LinhuXuan', 'LPW_XRDTomb', 'MountainGate'].forEach((code, seedIdx) => {
    const pt = TOWER_POINTS.find((p) => p.code === code);
    if (pt && pt.ownerTopic !== 'wuxia') {
      pt.ownerTopic = 'wuxia';
      pt.captureTriangle = synthesizeTriangle(pt, seedIdx);
      state.towerBuffs = state.towerBuffs || {};
      if (!state.towerBuffs[pt.code]) assignTowerBuff(pt);
    }
  });
}

function testlinePhotoCoord() {
  const point = selectedTowerPoi() || TOWER_POINTS[0];
  const cLat = point.lat;
  const cLng = point.lng;
  const maxRadius = Math.max(5, (Number(point.radius) || 30) - 5);
  const dist = Math.sqrt(Math.random()) * maxRadius;
  const angle = Math.random() * Math.PI * 2;
  const dLat = dist / 111000;
  const dLng = dist / (111000 * Math.cos(cLat * Math.PI / 180));
  return {
    lat: cLat + Math.cos(angle) * dLat,
    lng: cLng + Math.sin(angle) * dLng,
  };
}

function synthesizeTriangle(point, seedIdx = 0) {
  const offsetMeters = 14;
  const dLat = offsetMeters / 111000;
  const dLng = offsetMeters / (111000 * Math.cos(point.lat * Math.PI / 180));
  const baseAngle = seedIdx * 47;
  return [0, 120, 240].map((deg) => {
    const rad = (deg + baseAngle) * Math.PI / 180;
    return {
      lat: point.lat + Math.cos(rad) * dLat,
      lng: point.lng + Math.sin(rad) * dLng,
    };
  });
}

function debugEndGame() {
  stopLocationWatch();
  renderResultScreen();
  $('#resultPanel')?.classList.remove('hidden');
  $('#historyPanel')?.classList.add('hidden');
}

async function debugFullRefresh() {
  await fetchRoom().catch(() => {});
  await fetchLandmarks().catch(() => {});
  await locate();
  await ensureViewfinderCamera({ silent: true });
  renderBattle();
}

function initTowerBuffs() {
  state.towerBuffs = state.towerBuffs || {};
  TOWER_POINTS.forEach((point) => {
    if (point.ownerTopic && !state.towerBuffs[point.code]) assignTowerBuff(point);
  });
}

function renderBattle() {
  syncTowerStateFromRoom();
  syncTowerBuffsFromRoom();
  initTowerBuffs();
  setTopicColor();
  loadAlbum();
  const me = currentPlayer();
  const t = topicMeta(me.topic || state.topic);
  const h = heroMeta(me.hero || state.hero);
  $('#battleRoom').textContent = `ROOM ${String(state.roomId || 'TEST').toUpperCase()}`;
  $('#battleIdentity').textContent = state.playerId || me.playerId || '';
  const icon = $('#battleHeroIcon');
  if (icon) icon.textContent = h.icon || '⌖';
  $('#remainingText').textContent = state.roomId.toLowerCase() === 'test' ? '∞' : formatTime(state.room && state.room.remainingSec);
  renderMatchHud();
  drawBattleDancer();
  $('#hpText').textContent = `${me.health == null ? 2 : me.health}/2`;
  $('#hpSub').textContent = me.status === 'dead' || Number(me.health || 0) <= 0 ? 'PLAYER DOWN' : Number(me.health || 2) === 1 ? 'LOW HEALTH' : 'VIEWFINDER MODE';
  renderHpLamps(me);
  renderAllyStatus();
  renderModeSwitch();
  const ammoCount = $('#ammoCount');
  if (ammoCount) ammoCount.textContent = String(state.photos.length);
  const ammoSub = $('#ammoSub');
  if (ammoSub) ammoSub.textContent = selectedAmmo().text;
  const myStats = buildSelfStats();
  const scoreArea = $('#scoreArea');
  if (scoreArea) scoreArea.textContent = `${Math.round(myStats.captureArea || 0)}m²`;
  $('#scoreSub').textContent = buildMyScoreLabel();
  const combat = buildCombatState();
  const combatTitle = $('#combatTitle');
  if (combatTitle) combatTitle.textContent = combat.title;
  const combatDesc = $('#combatDesc');
  if (combatDesc) combatDesc.textContent = combat.desc;
  $('#combatBtn').setAttribute('aria-label', combat.button);
  $('#combatBtn').title = combat.button;
  $('#combatBtn').disabled = combat.button === 'NO TARGET' || combat.button === 'LOCKED';
  const isCheckmateKing = state.mode === 'checkmate' && state.hero === 'king';
  $('#combatConsole')?.classList.toggle('wizard-mode', state.hero === 'wizard');
  $('#combatConsole')?.classList.toggle('king-mode', isCheckmateKing);
  renderWizardPanel(combat);
  renderKingPanel();
  renderDialState(combat);
  renderFilmSlots();
  renderTowerConsole();
  renderTargets();
  renderMap();
  syncCameraControls();
  syncPermissionControls();
  if (state.allowCamera) ensureViewfinderCamera({ silent: true });
  renderDeathState(me);
  checkHitNotification();
}

function checkHitNotification() {
  if (!state.room || !state.playerId) return;
  const myId = state.playerId;
  const events = state.room.events || [];
  events.forEach((e) => {
    if (!e.eventId) return;
    if (seenEventIds.has(e.eventId)) return;
    seenEventIds.add(e.eventId);
    // 只处理「我承受的」事件（被攻击 / 被治疗 / 被击倒）；「我出手的」反馈在 useCombat 里弹
    if (e.targetPlayerId !== myId || e.actorPlayerId === myId) return;
    const me = currentPlayer();
    const hp = me.health == null ? 2 : Number(me.health);
    const who = e.actorPlayerId || '';
    if (e.type === 'attack') {
      showCombatToast({ kind: 'damaged', icon: '⚡',
        title: who ? `${who} hit you` : 'You were attacked',
        sub: hp <= 0 ? 'HP 0/2 · DOWN' : `HP ${hp}/2 · take cover` });
      const flash = $('.flash');
      if (flash) flash.animate([{ opacity: 0, background: '#e83a28' }, { opacity: 0.55, background: '#e83a28' }, { opacity: 0, background: '#e83a28' }], { duration: 400, easing: 'ease-out' });
      vibrate([60, 20, 100]);
    } else if (e.type === 'kill') {
      showCombatToast({ kind: 'kill', icon: '✝', title: who ? `Knocked down by ${who}` : 'You were knocked down', sub: 'HP 0/2 · DOWN' });
    } else if (e.type === 'heal') {
      showCombatToast({ kind: 'healed', icon: '✚', title: who ? `${who} healed you` : 'You were healed', sub: `HP ${hp}/2` });
    } else if (e.type === 'revive') {
      showCombatToast({ kind: 'healed', icon: '✚', title: who ? `${who} revived you` : 'You revived', sub: `HP ${hp}/2` });
    }
  });
}

// 通用战斗弹窗（出手 / 承受 共用）：danger=红 heal=绿 kill=强红；点击外侧或 ~3.2s 后隐藏
function showCombatToast({ kind = 'dealt', icon = '⚡', title = '', sub = '' }) {
  const toast = $('#hitToast');
  if (!toast) return;
  const tone = (kind === 'heal' || kind === 'healed') ? 'heal' : (kind === 'kill' ? 'kill' : 'danger');
  toast.classList.remove('heal', 'kill', 'danger', 'hidden');
  toast.classList.add(tone);
  const iconEl = $('#hitToastIcon'); if (iconEl) iconEl.textContent = icon;
  const titleEl = $('#hitToastTitle'); if (titleEl) titleEl.textContent = title;
  const subEl = $('#hitToastSub'); if (subEl) subEl.textContent = sub;
  toast.classList.remove('hidden');
  clearTimeout(hitToastTimer);
  hitToastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function renderAllyStatus() {
  const name = $('#allyName');
  const hp = $('#allyHp');
  const box = $('#allyStatus');
  if (!name || !hp || !box) return;
  if (state.combatMode === 'tower') {
    const myTowers = TOWER_POINTS.filter((p) => p.ownerTopic === ownTopic()).length;
    name.textContent = 'MY POINTS';
    hp.textContent = `${myTowers} held`;
    box.style.borderColor = myTowers > 0 ? topicMeta(ownTopic()).color : '#111';
    return;
  }
  const allies = allyPlayers();
  const ally = allyStatus();
  if (!ally) {
    name.textContent = 'ALLY';
    hp.textContent = 'Solo';
    box.style.borderColor = '#111';
    return;
  }
  const health = Math.max(0, Math.min(2, Number(ally.health == null ? 2 : ally.health)));
  name.textContent = 'ALLY';
  hp.textContent = `${allies.length}`;
  box.style.borderColor = health <= 1 ? 'var(--danger)' : 'var(--battle-line)';
}

function renderModeSwitch() {
  const mode = state.combatMode === 'tower' ? 'tower' : 'kill';
  $('#battleModeSwitch')?.classList.toggle('mode-tower', mode === 'tower');
  $('#combatConsole')?.classList.toggle('hidden', mode === 'tower');
  $('#towerConsole')?.classList.toggle('hidden', mode !== 'tower');
  $('#towerInfoCard')?.classList.toggle('hidden', mode !== 'tower');  // INFO 卡仅 TOWER 模式显示（已移到 action-well）
  const reportBtn = $('#towerReportBtn');
  if (reportBtn) reportBtn.textContent = mode === 'tower' ? 'OVERVIEW' : 'REPORT';
  $$('.battle-mode-switch .mode-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  renderTowerConsole();
}

function setCombatMode(mode) {
  const nextMode = mode === 'tower' ? 'tower' : 'kill';
  if (state.combatMode === nextMode) {
    renderModeSwitch();
    return;
  }
  state.combatMode = nextMode;
  localStorage.setItem('parkugo_combat_mode', state.combatMode);
  if (nextMode !== 'tower') closeTowerReport();
  else selectTowerPoi(state.selectedTowerPoiId || 1, { silent: true });
  renderModeSwitch();
}

function setTowerCapturePct(pct) {
  state.towerCapturePct = Math.max(0, Math.min(100, Number(pct) || 0));
  if (state.towerCapturePct >= 100) state.towerCaptured = true;
  renderTowerConsole();
}

function selectedTowerPoi() {
  return TOWER_POINTS.find((point) => point.id === Number(state.selectedTowerPoiId)) || TOWER_POINTS[0];
}

function pendingTowerPoi() {
  return TOWER_POINTS.find((point) => point.id === Number(state.pendingTowerPoiId)) || selectedTowerPoi();
}

// ── Checkmate dynamic points: overview preview + destroy target ──
function allDynamicTowers() {
  return (state.room && state.room.dynamicTowers) || [];
}
function activeDynamicTowers() {
  return allDynamicTowers().filter((t) => t && t.active);
}
function dynamicTowerById(id) {
  return id ? (allDynamicTowers().find((t) => t.towerId === id) || null) : null;
}
function isEnemyTower(t) {
  return !!(t && t.active && t.ownerTopic && t.ownerTopic !== ownTopic());
}
// The point currently previewed in the overview (tap to inspect).
function pendingDynamicTower() {
  return dynamicTowerById(state.pendingDynamicTowerId);
}
// The enemy point confirmed as the destroy target (drives the TOWER console).
function selectedDynamicTower() {
  return dynamicTowerById(state.selectedDynamicTowerId);
}
function previewDynamicTower(towerId) {
  state.pendingDynamicTowerId = towerId;
  renderTowerReport();
  playSfx('select');
}

function towerPoiRelation(point) {
  if (!point || !point.ownerTopic) return 'neutral';
  return point.ownerTopic === ownTopic() ? 'ally' : 'enemy';
}

function towerPoiColor(point) {
  return point && point.ownerTopic ? topicMeta(point.ownerTopic).color : '#8d8a82';
}

function towerPoiPhotoText(point) {
  return `${Math.max(0, Math.min(3, Number(point.photoCount) || 0))}/3`;
}

function visionSourcesFor(viewerTopic) {
  const sources = [];
  if (state.mode === 'checkmate') {
    // Checkmate：只有己方动态塔提供视野，无固定塔无复活点
    const dt = (state.room && state.room.dynamicTowers) || [];
    dt.forEach((t) => {
      if (!t.active) return;
      if (t.ownerTopic !== viewerTopic) return;
      sources.push({
        kind: 'dynamic',
        point: { lat: t.lat, lng: t.lng, radius: t.radius || 30 },
        owned: true,
      });
    });
    return sources;
  }
  TOWER_POINTS.forEach((pt) => {
    if (pt.ownerTopic && pt.ownerTopic !== viewerTopic) return;
    sources.push({ kind: 'tower', point: pt, owned: !!pt.ownerTopic });
  });
  RESPAWN_POINTS.forEach((pt) => sources.push({ kind: 'respawn', point: pt, owned: false }));
  return sources;
}

const KING_VISION_RADIUS = 30;

function allyKings(viewerTopic) {
  if (!viewerTopic) return [];
  const players = (state.room && state.room.players) || [];
  return players.filter((p) => p
    && p.hero === 'king'
    && p.topic === viewerTopic
    && p.status !== 'dead'
    && p.lat != null && p.lng != null);
}

function isEnemyVisibleTo(enemyPlayer, viewerTopic) {
  if (!enemyPlayer || enemyPlayer.lat == null || enemyPlayer.lng == null) return false;
  if (!viewerTopic) return true;
  // veil: 该敌方所在阵营持有 veil → 我方对其完全不可见
  if (enemyPlayer.topic && isTeamBuffActive(enemyPlayer.topic, 'veil')) return false;
  // eclipse: 我方持有 eclipse → 无视视野圈，直接暴露所有敌方
  if (isTeamBuffActive(viewerTopic, 'eclipse')) return true;
  // 我方塔 + 复活点 视野
  const sources = visionSourcesFor(viewerTopic);
  for (const s of sources) {
    const r = Number(s.point.radius) || 30;
    if (distanceMeters(enemyPlayer.lat, enemyPlayer.lng, s.point.lat, s.point.lng) <= r) {
      return true;
    }
  }
  // 我方 KING 50m 暴露
  const kings = allyKings(viewerTopic);
  for (const k of kings) {
    if (distanceMeters(enemyPlayer.lat, enemyPlayer.lng, k.lat, k.lng) <= KING_VISION_RADIUS) {
      return true;
    }
  }
  return false;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const cross = (ox, oy, ex, ey, qx, qy) => (ex - ox) * (qy - oy) - (ey - oy) * (qx - ox);
  const d1 = cross(ax, ay, bx, by, px, py);
  const d2 = cross(bx, by, cx, cy, px, py);
  const d3 = cross(cx, cy, ax, ay, px, py);
  return (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0);
}

function checkTowerCapture(point) {
  const photos = (state.towerPhotoIndexes || []).map(idx => state.photos[idx]).filter(Boolean);
  if (photos.length < 3) return { captured: false, reason: '3 photos required', consume: photos.length > 0 };
  const positioned = photos.filter(p => p.locationReady && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)));
  if (positioned.length < 3) return { captured: false, reason: 'Photos missing location data', consume: true };

  // 以据点中心为原点，将三张照片经纬度投影到局部米平面
  const mPerLat = 111320;
  const mPerLng = 111320 * Math.cos(point.lat * Math.PI / 180);
  const toXY = (p) => [(Number(p.lng) - point.lng) * mPerLng, (Number(p.lat) - point.lat) * mPerLat];
  const [a, b, c] = positioned.map(toXY);

  // 纯包围判定：据点中心(0,0)必须严格落在三角形内部（三个叉积同号且都非零）。
  // 不设面积门槛——退化三角形（三点重合/共线）本就无法包围中心，会自然判失败。
  const cross = (ox, oy, ex, ey, qx, qy) => (ex - ox) * (qy - oy) - (ey - oy) * (qx - ox);
  const d1 = cross(a[0], a[1], b[0], b[1], 0, 0);
  const d2 = cross(b[0], b[1], c[0], c[1], 0, 0);
  const d3 = cross(c[0], c[1], a[0], a[1], 0, 0);
  const inside = (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
  if (!inside) {
    return { captured: false, reason: 'Triangle does not enclose the point center', consume: true };
  }
  return { captured: true };
}

function distanceToPointText(point) {
  const me = validCoord(state.location) || validCoord(currentPlayer());
  if (!me || !point) return `${point.radius || 30}M AREA`;
  const meters = distanceMeters(me[1], me[0], point.lat, point.lng);
  return `${Math.round(meters)}M / R${point.radius || 30}M`;
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const radius = 6371000;
  const dLat = (Number(bLat) - Number(aLat)) * Math.PI / 180;
  const dLng = (Number(bLng) - Number(aLng)) * Math.PI / 180;
  const lat1 = Number(aLat) * Math.PI / 180;
  const lat2 = Number(bLat) * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function outOfChina(lat, lng) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x, y) {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  ret += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
  ret += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
  return ret;
}

function transformLng(x, y) {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  ret += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
  ret += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
  return ret;
}

// OSM / Leaflet renders raw WGS84, so no GCJ02 offset conversion is needed.
// The name and [lng, lat] return shape are kept so the 30+ call sites stay unchanged.
function wgs84ToGcj02(lat, lng) {
  return [Number(lng), Number(lat)];
}

function towerReportCenter() {
  const lat = TOWER_POINTS.reduce((sum, point) => sum + point.lat, 0) / TOWER_POINTS.length;
  const lng = TOWER_POINTS.reduce((sum, point) => sum + point.lng, 0) / TOWER_POINTS.length;
  return wgs84ToGcj02(lat, lng);
}

function renderTowerReportPoints() {
  const wrap = $('#towerReportPoints');
  if (!wrap) return;
  if (state.mode === 'checkmate') {
    // Checkmate 模式：动态塔无 fallback xy 布局，全靠地图。这里清空。
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = TOWER_POINTS.map((point) => {
    const relation = towerPoiRelation(point);
    const color = towerPoiColor(point);
    const selected = point.id === Number(state.pendingTowerPoiId);
    const star = point.type === 'major' ? '<i class="poi-star">★</i>' : '';
    return `<button class="tower-report-point ${relation} ${selected ? 'selected' : ''}" data-tower-poi="${point.id}" style="left:${point.x}%;top:${point.y}%;--point-color:${escapeHTML(color)}" type="button" aria-label="POINT ${String(point.id).padStart(2, '0')} ${escapeHTML(point.name)}">${String(point.id).padStart(2, '0')}${star}</button>`;
  }).join('');
}

function renderTowerReport() {
  renderTowerReportPoints();
  const titleEl = $('#towerReportTitle');
  const subEl = $('#towerReportSub');
  const selected = $('#towerReportSelected');
  const selectBtn = $('#towerReportSelectBtn');

  if (state.mode === 'checkmate') {
    // Checkmate: overview of dynamic points; no Weiming fixed points.
    const towers = activeDynamicTowers();
    if (titleEl) titleEl.textContent = 'CHECKMATE OVERVIEW';
    if (subEl) subEl.textContent = `${towers.length} POINT${towers.length === 1 ? '' : 'S'} ON FIELD`;
    const t = pendingDynamicTower();
    const mine = t && t.ownerTopic === ownTopic();
    if (selected) {
      if (!t) {
        selected.textContent = towers.length ? 'Tap a point for details' : 'No points placed yet';
      } else if (!t.active) {
        selected.textContent = `${t.type === 'major' ? 'MAJOR' : 'MINOR'} · ${topicMeta(t.ownerTopic).label} · DESTROYED`;
      } else {
        selected.textContent = `${t.type === 'major' ? 'MAJOR' : 'MINOR'} · ${topicMeta(t.ownerTopic).label} · by ${t.ownerPlayerId || '—'}${mine ? ' (yours)' : ''}`;
      }
    }
    // Only an enemy, still-active point can be set as a destroy target.
    if (selectBtn) {
      if (isEnemyTower(t)) {
        selectBtn.style.display = '';
        selectBtn.textContent = 'TARGET FOR DESTROY';
      } else {
        selectBtn.style.display = 'none';
      }
    }
  } else {
    if (titleEl) titleEl.textContent = 'WEIMING LAKE OVERVIEW';
    if (subEl) subEl.textContent = '15 POINT OCCUPANCY';
    if (selectBtn) selectBtn.style.display = '';
    const point = pendingTowerPoi();
    if (selected && point) selected.textContent = `POINT ${String(point.id).padStart(2, '0')} · ${point.zhName || point.name}`;
    if (selectBtn && point) selectBtn.textContent = `SELECT POINT ${String(point.id).padStart(2, '0')}`;
  }
  if (!$('#towerReportOverlay')?.classList.contains('hidden')) renderTowerReportAmap();
}

function openTowerReport() {
  if (state.combatMode !== 'tower') {
    openCombatSheet();
    return;
  }
  if (state.mode === 'checkmate') {
    // Default-preview an enemy point (handy for destroy), else the first point on the field.
    if (!pendingDynamicTower()) {
      const towers = activeDynamicTowers();
      const enemy = towers.find(isEnemyTower);
      state.pendingDynamicTowerId = (enemy || towers[0] || {}).towerId || null;
    }
  } else {
    state.pendingTowerPoiId = state.selectedTowerPoiId || 1;
  }
  renderTowerReport();
  $('#towerReportOverlay')?.classList.remove('hidden');
  setTimeout(renderTowerReportAmap, 80);
}

function closeTowerReport() {
  $('#towerReportOverlay')?.classList.add('hidden');
}

function selectTowerPoi(id, options = {}) {
  const point = TOWER_POINTS.find((item) => item.id === Number(id)) || TOWER_POINTS[0];
  state.selectedTowerPoiId = point.id;
  state.pendingTowerPoiId = point.id;
  localStorage.setItem('parkugo_selected_tower_poi', String(point.id));
  renderTowerReport();
  renderTowerPoiInfo();
  if (!options.silent) playSfx('select');
}

function previewTowerPoi(id) {
  const point = TOWER_POINTS.find((item) => item.id === Number(id)) || selectedTowerPoi();
  state.pendingTowerPoiId = point.id;
  renderTowerReport();
  playSfx('select');
}

function confirmTowerPoi() {
  if (state.mode === 'checkmate') {
    // Set the previewed enemy point as the destroy target, then jump to the TOWER console.
    const t = pendingDynamicTower();
    if (isEnemyTower(t)) {
      state.selectedDynamicTowerId = t.towerId;
      closeTowerReport();
      setCombatMode('tower');
      playSfx('select');
      renderBattle();
    }
    return;
  }
  selectTowerPoi(state.pendingTowerPoiId || state.selectedTowerPoiId || 1);
  closeTowerReport();
}

async function renderTowerReportAmap() {
  const container = $('#towerReportAmap');
  const overlay = $('#towerReportOverlay');
  if (!container || !overlay || overlay.classList.contains('hidden')) return;
  if (!AMAP_KEY) return;
  // Checkmate 模式下不预设 TOWER_POINTS 内容
  if (state.amap.reportMap && state.mode !== 'checkmate') {
    state.amap.reportMarkers.slice(0, TOWER_POINTS.length).forEach((marker, i) => {
      const point = TOWER_POINTS[i];
      if (point && typeof marker.setContent === 'function') marker.setContent(towerReportMarkerHtml(point));
    });
  }
  try {
    const AMap = await loadAmapScript();
    // Reveal the map container BEFORE Leaflet initializes. Leaflet mis-sizes (its tiles
    // and markers fail to lay out) when it inits on a display:none element — that is what
    // hid the dynamic points and let the Weiming lake art show through underneath.
    container.closest('.tower-report-map')?.classList.add('amap-ready');
    if (!state.amap.reportMap) {
      // Checkmate default center: the player position, otherwise Weiming Lake center.
      const meCoord = (state.location.ready ? validCoord(state.location) : null) || validCoord(currentPlayer());
      const center = state.mode === 'checkmate'
        ? (meCoord ? wgs84ToGcj02(meCoord[1], meCoord[0]) : [116.305732, 39.992679])
        : towerReportCenter();
      state.amap.reportMap = new AMap.Map('towerReportAmap', {
        center,
        zoom: state.mode === 'checkmate' ? 17 : 18,
        resizeEnable: true,
        viewMode: '2D',
        mapStyle: 'amap://styles/grey',
        zoomEnable: false,
        dragEnable: false,
        doubleClickZoom: false,
        scrollWheel: false,
        touchZoom: false,
        keyboardEnable: false,
      });
    }
    const poiMarkers = syncTowerReportAmapMarkers(AMap);
    const fitOverview = () => {
      if (!state.amap.reportMap) return;
      state.amap.reportMap.resize();
      if (poiMarkers && poiMarkers.length) {
        state.amap.reportMap.setFitView(poiMarkers, true, [20, 20, 20, 20], 17);
      }
    };
    fitOverview();
    setTimeout(fitOverview, 150); // re-fit once the overlay has finished laying out
  } catch (e) {
    container.closest('.tower-report-map')?.classList.remove('amap-ready');
    renderTowerReportPoints();
  }
}

function towerReportMarkerHtml(point, mini = false) {
  const relation = towerPoiRelation(point);
  const color = towerPoiColor(point);
  const selected = point.id === Number(state.pendingTowerPoiId);
  const miniCls = mini ? ' mini' : '';
  const star = point.type === 'major' ? '<i class="poi-star">★</i>' : '';
  const centerDot = mini ? '<i class="poi-center"></i>' : '';
  const label = mini ? '' : String(point.id).padStart(2, '0');
  return `<button class="tower-report-point tower-report-marker${miniCls} ${relation} ${selected ? 'selected' : ''}" style="--point-color:${escapeHTML(color)}" type="button">${centerDot}${label}${star}</button>`;
}

function syncTowerReportAmapMarkers(AMap) {
  if (!state.amap.reportMap) return;
  state.amap.reportMarkers.forEach((marker) => marker.setMap(null));
  state.amap.reportMarkers = [];
  const pointMarkers = [];

  if (state.mode === 'checkmate') {
    // Checkmate: render dynamic points. Each is clickable to select + show info,
    // and the fit set includes every point + YOU so the whole field is framed.
    const myTopic = ownTopic();
    const towers = allDynamicTowers();
    // Drop the preview only if that point no longer exists at all.
    if (state.pendingDynamicTowerId && !towers.some((t) => t.towerId === state.pendingDynamicTowerId)) {
      state.pendingDynamicTowerId = null;
    }
    towers.forEach((t) => {
      const destroyed = !t.active;
      const mine = !destroyed && t.ownerTopic === myTopic;
      const color = destroyed ? '#8d8a82' : (t.ownerTopic ? topicMeta(t.ownerTopic).color : '#8d8a82');
      const isSel = t.towerId === state.pendingDynamicTowerId;
      // Vision circle (faint + dashed once the point is destroyed)
      state.amap.reportMarkers.push(new AMap.Circle({
        center: wgs84ToGcj02(t.lat, t.lng),
        radius: t.radius || (t.type === 'major' ? 50 : 30),
        strokeColor: color,
        strokeOpacity: destroyed ? 0.4 : (mine ? 0.9 : 0.65),
        strokeWeight: isSel ? 3 : (mine ? 2 : 1.5),
        strokeStyle: (destroyed || !mine) ? 'dashed' : 'solid',
        strokeDasharray: (destroyed || !mine) ? [6, 4] : null,
        fillColor: color,
        fillOpacity: destroyed ? 0.05 : (isSel ? 0.24 : (mine ? 0.16 : 0.08)),
        map: state.amap.reportMap,
        zIndex: 10,
      }));
      // Center marker — clickable to inspect; destroyed points show a gray ✕.
      const marker = new AMap.Marker({
        position: wgs84ToGcj02(t.lat, t.lng),
        content: `<span class="cm-overview-pin ${t.type === 'major' ? 'major' : 'minor'} ${destroyed ? 'destroyed' : (mine ? 'mine' : 'enemy')}${isSel ? ' selected' : ''}" style="background:${escapeHTML(color)}">${destroyed ? '✕' : (t.type === 'major' ? '▲' : '●')}</span>`,
        offset: new AMap.Pixel(-9, -9),
        zIndex: isSel ? 130 : (destroyed ? 70 : 90),
        map: state.amap.reportMap,
      });
      marker.on('click', () => previewDynamicTower(t.towerId));
      state.amap.reportMarkers.push(marker);
      pointMarkers.push(marker);
    });
    // The overview intentionally does NOT show player positions — a YOU/ally marker on
    // top (higher z-index) would overlap a point and swallow the tap, blocking selection.
    return pointMarkers;
  }

  TOWER_POINTS.forEach((point) => {
    const marker = new AMap.Marker({
      position: wgs84ToGcj02(point.lat, point.lng),
      content: towerReportMarkerHtml(point),
      offset: new AMap.Pixel(-13, -13),
      zIndex: point.id === Number(state.pendingTowerPoiId) ? 130 : 90,
      map: state.amap.reportMap,
    });
    marker.on('click', () => previewTowerPoi(point.id));
    state.amap.reportMarkers.push(marker);
    pointMarkers.push(marker);
  });
  // The overview intentionally does NOT show player positions — a YOU/ally marker on
  // top (higher z-index) would overlap a point and swallow the tap, blocking selection.
  state.amap.reportMap.setStatus({
    dragEnable: false,
    zoomEnable: false,
    doubleClickZoom: false,
    scrollWheel: false,
    touchZoom: false,
    keyboardEnable: false,
  });
  return pointMarkers;
}

function buildTowerInfoStatus(point) {
  if (!point.ownerTopic) {
    const phrases = ['Waiting for the right one', 'No one\'s been here', 'It\'s lonely at the top'];
    return `<span style="color:rgba(17,17,17,.38)">${phrases[Math.floor(Math.random() * phrases.length)]}</span>`;
  }
  const meta = topicMeta(point.ownerTopic);
  const c = `<span style="color:${meta.color}">${meta.label}</span>`;
  if (point.ownerTopic === ownTopic()) {
    const phrases = [
      `${c} is holding it down, solid`,
      `This is ${c} turf`,
      `${c} has put down roots here`,
      `This patch belongs to ${c}`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    const phrases = [
      `Currently held by ${c}`,
      `Clearly taken by ${c}`,
      `${c} again, huh..`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

// Checkmate: the TOWER info card describes the targeted enemy point (or DESTROYED).
function renderDynamicTowerInfo() {
  const t = selectedDynamicTower();
  const color = (t && t.ownerTopic) ? topicMeta(t.ownerTopic).color : '#8d8a82';
  $('#towerInfoCard')?.classList.toggle('info-open', !!state.towerInfoOpen);
  $('#towerInfoCard')?.style.setProperty('--point-color', color);
  $('#towerConsole')?.style.setProperty('--point-color', color);
  $('#towerMapMini')?.style.setProperty('--point-color', color);
  const handle = $('#towerInfoHandle');
  if (handle) handle.textContent = state.towerInfoOpen ? '▼ CLOSE' : 'i';
  const nameEl = $('#towerInfoName');
  const descEl = $('#towerInfoDesc');
  const noteEl = $('#towerInfoNote');
  const statusEl = $('#towerInfoStatus');
  if (!t) {
    if (nameEl) nameEl.textContent = 'NO TARGET';
    if (descEl) descEl.textContent = 'Open the overview (REPORT) and target an enemy point to destroy.';
    if (noteEl) noteEl.textContent = '';
    if (statusEl) statusEl.innerHTML = '';
  } else {
    if (nameEl) nameEl.textContent = `${t.type === 'major' ? 'MAJOR' : 'MINOR'} POINT · ${topicMeta(t.ownerTopic).label}`;
    if (descEl) descEl.textContent = `Placed by ${t.ownerPlayerId || '—'}. Surround it with 3 photos to destroy.`;
    if (noteEl) noteEl.textContent = '';
    if (statusEl) statusEl.innerHTML = !t.active
      ? '<span style="color:#8d8a82">DESTROYED</span>'
      : `<span style="color:${color}">ENEMY POINT</span>`;
  }
  renderTowerMiniAmap();
}

function renderTowerPoiInfo() {
  if (state.mode === 'checkmate') { renderDynamicTowerInfo(); return; }
  const point = selectedTowerPoi();
  if (!point) return;
  const color = towerPoiColor(point);
  $('#towerInfoCard')?.classList.toggle('info-open', !!state.towerInfoOpen);
  $('#towerInfoCard')?.style.setProperty('--point-color', color);
  $('#towerConsole')?.style.setProperty('--point-color', color);
  $('#towerMapMini')?.style.setProperty('--point-color', color);
  const handle = $('#towerInfoHandle');
  if (handle) handle.textContent = state.towerInfoOpen ? '▼ CLOSE' : 'i';
  const info = {
    towerInfoName: `POINT ${String(point.id).padStart(2, '0')} · ${point.zhName || point.name}`,
    towerInfoDesc: point.desc,
    towerInfoNote: point.note || '',
  };
  Object.entries(info).forEach(([id, text]) => {
    const el = $(`#${id}`);
    if (el) el.textContent = text;
  });
  const statusEl = $('#towerInfoStatus');
  if (statusEl) statusEl.innerHTML = buildTowerInfoStatus(point);
  renderTowerMiniAmap();
}

function toggleTowerInfo(open = !state.towerInfoOpen) {
  state.towerInfoOpen = !!open;
  renderTowerPoiInfo();
}

async function renderTowerMiniAmap() {
  const container = $('#towerMiniAmap');
  if (!container || $('#towerConsole')?.classList.contains('hidden')) return;
  const point = currentTowerTarget();
  if (!point || !AMAP_KEY) return;
  try {
    const AMap = await loadAmapScript();
    const center = wgs84ToGcj02(point.lat, point.lng);
    const radius = Number(point.radius) || 30;
    const shortEdge = Math.max(40, Math.min(container.clientWidth || 200, container.clientHeight || 92));
    const mpp = (radius * 2) / shortEdge;
    const zoomLevel = Math.log2(156543.03 * Math.cos(point.lat * Math.PI / 180) / mpp);
    if (!state.amap.miniMap) {
      state.amap.miniMap = new AMap.Map('towerMiniAmap', {
        center,
        zoom: zoomLevel,
        zooms: [3, 20],
        resizeEnable: true,
        viewMode: '2D',
        mapStyle: 'amap://styles/grey',
        zoomEnable: false,
        dragEnable: false,
        doubleClickZoom: false,
        scrollWheel: false,
        touchZoom: false,
        keyboardEnable: false,
      });
    }
    state.amap.miniMap.setCenter(center);
    state.amap.miniMap.setZoom(zoomLevel, true);
    state.amap.miniMarkers.forEach((marker) => marker.setMap(null));
    state.amap.miniMarkers = [];
    if (state.amap.miniCircle) {
      state.amap.miniCircle.setMap(null);
      state.amap.miniCircle = null;
    }
    state.amap.miniCircle = new AMap.Circle({
      center,
      radius,
      strokeColor: '#111111',
      strokeOpacity: 0.95,
      strokeWeight: 3,
      fillColor: towerPoiColor(point),
      fillOpacity: 0.16,
      map: state.amap.miniMap,
    });
    state.amap.miniMarkers.push(new AMap.Marker({
      position: center,
      content: towerReportMarkerHtml(point, true),
      offset: new AMap.Pixel(-7, -7),
      zIndex: 100,
      map: state.amap.miniMap,
    }));
    let photoPositions = [];
    let triangleColor = topicMeta(ownTopic()).color;
    let triangleSolid = false;
    if (point.ownerTopic && Array.isArray(point.captureTriangle) && point.captureTriangle.length >= 2) {
      photoPositions = point.captureTriangle.map(p => wgs84ToGcj02(p.lat, p.lng));
      triangleColor = topicMeta(point.ownerTopic).color;
      triangleSolid = point.captureTriangle.length === 3;
    } else {
      photoPositions = (state.towerPhotoIndexes || [])
        .map(idx => state.photos[idx])
        .filter(p => p && p.locationReady)
        .map(p => wgs84ToGcj02(p.lat, p.lng));
      triangleSolid = photoPositions.length === 3;
    }
    if (photoPositions.length >= 2) {
      const path = photoPositions.length === 3
        ? [...photoPositions, photoPositions[0]]
        : photoPositions;
      const polyline = new AMap.Polyline({
        path,
        strokeColor: triangleColor,
        strokeWeight: 2.5,
        strokeOpacity: 0.9,
        strokeStyle: triangleSolid ? 'solid' : 'dashed',
        map: state.amap.miniMap,
      });
      state.amap.miniMarkers.push(polyline);
    }
    photoPositions.forEach(pos => {
      state.amap.miniMarkers.push(new AMap.Marker({
        position: pos,
        content: `<i class="tower-photo-dot" style="background:${triangleColor}"></i>`,
        offset: new AMap.Pixel(-4, -4),
        zIndex: 85,
        map: state.amap.miniMap,
      }));
    });
    state.amap.miniMap.setStatus({
      dragEnable: false,
      zoomEnable: false,
      doubleClickZoom: false,
      scrollWheel: false,
      touchZoom: false,
      keyboardEnable: false,
    });
    setTimeout(() => state.amap.miniMap && state.amap.miniMap.resize(), 0);
  } catch (e) {}
}

function renderTowerConsole() {
  const consoleEl = $('#towerConsole');
  if (!consoleEl) return;
  const point = currentTowerTarget();
  const frozen = state.mode === 'checkmate'
    ? !isEnemyTower(point)            // checkmate: act only on a live enemy point
    : !!(point && point.ownerTopic);  // Weiming: owned points are locked
  consoleEl.classList.toggle('frozen', frozen);

  const pct = Math.max(0, Math.min(100, Number(state.towerCapturePct) || 0));
  const selected = frozen ? [] : (Array.isArray(state.towerPhotoIndexes) ? state.towerPhotoIndexes : [])
    .filter((index) => state.photos[index])
    .slice(0, 3);
  if (!frozen) state.towerPhotoIndexes = selected;
  $$('.tower-photo').forEach((button, index) => {
    button.disabled = frozen;
    button.classList.toggle('active', !frozen && index === Number(state.selectedTowerPoint || 0));
    const photo = frozen ? null : state.photos[selected[index]];
    button.classList.toggle('loaded', !!photo);
    button.classList.toggle('missing-location', !!photo && !photo.locationReady);
    button.style.backgroundImage = photo ? `linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.24)), url("${photo.path}")` : '';
    button.title = frozen ? 'LOCKED' : (photo
      ? (photo.locationReady ? `${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}` : 'NO GPS')
      : 'SELECT FILM');
  });
  $('#towerSlider')?.classList.toggle('hidden', frozen);
  $('#towerSliderFill')?.style.setProperty('height', `${pct}%`);
  $('#towerSliderKnob')?.style.setProperty('top', `calc(${pct}% - ${pct / 100 * 24}px)`);
  $('#towerSlider')?.classList.toggle('done', !frozen && (state.towerCaptured || pct >= 92));
  renderTowerPoiInfo();
}

function hpSignalHTML(health) {
  const hp = Math.max(0, Math.min(2, Number(health == null ? 2 : health)));
  const lamps = [0, 1].map((index) => {
    const classes = ['ally-hp-slot'];
    if (hp <= 0) classes.push('dead');
    else if (hp > index) classes.push('full');
    else classes.push('off');
    return `<i class="${classes.join(' ')}"></i>`;
  }).join('');
  return `<strong class="ally-hp-signal" aria-label="HP signal">${lamps}</strong>`;
}

function renderDialState(combat) {
  const scope = $('#scopeDial');
  const fill = $('#dialFireFill');
  const knob = $('#dialFireKnob');
  if (!scope || !fill || !knob) return;
  if (dialDrag.active) return;
  scope.classList.toggle('phase-1', !!state.photos.length);
  scope.classList.toggle('phase-2', !!combat && combat.canAct);
  scope.classList.remove('phase-3');
  fill.style.width = '0%';
  knob.style.left = '0%';
}

function vibrate(pattern) {
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(0);
    navigator.vibrate(pattern);
  } catch (e) {}
}

function hapticPhase(phase) {
  if (phase === 1) vibrate(12);
  if (phase === 2) vibrate([18, 10, 24]);
  if (phase >= 3) vibrate([90, 22, 130, 22, 180]);
}

function kickElement(el, className, hold = 180) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  if (hold) setTimeout(() => el.classList.remove(className), hold);
}

function triggerFinalImpact() {
  hapticPhase(3);
  playSfx('impact', 1.25);
  kickElement($('#dialFireKnob'), 'kick', 180);
  kickElement($('#combatConsole'), 'slam', 620);
  kickElement($('.battle-device'), 'screen-slam', 720);
}

function setDialFireProgress(pct) {
  const safePct = Math.max(0, Math.min(100, pct));
  const scope = $('#scopeDial');
  const fill = $('#dialFireFill');
  const knob = $('#dialFireKnob');
  const consoleEl = $('#combatConsole');
  if (!scope || !fill || !knob) return;
  const phase = safePct >= 92 ? 3 : safePct >= 65 ? 2 : safePct >= 30 ? 1 : 0;
  fill.style.width = `${safePct}%`;
  knob.style.left = `${safePct}%`;
  scope.classList.remove('phase-1', 'phase-2', 'phase-3');
  if (phase > 0) scope.classList.add(`phase-${phase}`);
  if (phase > dialDrag.maxPhase && consoleEl) {
    dialDrag.maxPhase = phase;
    hapticPhase(phase);
    playSfx('gear', phase);
    kickElement(knob, 'kick', 160);
    consoleEl.classList.remove('tremble');
    void consoleEl.offsetWidth;
    consoleEl.classList.add('tremble');
    setTimeout(() => consoleEl.classList.remove('tremble'), 160);
  }
}

function resetDialFireProgress() {
  dialDrag.maxPhase = 0;
  setDialFireProgress(0);
  $('#combatConsole')?.classList.remove('tremble');
}

// 攻击/技能冷却的转盘视觉：变灰 + 引导线消失 + 中央倒计时（滑块限制在 moveDialDrag 处理）
function updateDialCooldownUi() {
  const consoleEl = $('#combatConsole');
  if (!consoleEl) return;
  const remain = attackCdRemaining();
  const cooling = remain > 0;
  consoleEl.classList.toggle('cooling', cooling);
  const cd = $('#dialCd');
  if (cd) {
    cd.classList.toggle('hidden', !cooling);
    if (cooling) cd.textContent = `CD ${Math.ceil(remain / 1000)}s`;
  }
}

// 转盘左轮：当前对局中真实存在的可选阵营（攻击=敌方阵营 / 牧师=本方阵营）
function teamTopicsInPlay() {
  const order = Object.keys(TOPICS);
  const present = new Set(buildTargets().map((target) => target.topic).filter(Boolean));
  return order.filter((key) => present.has(key));
}

// 左轮当前选中的阵营：跟随 selectedTargetTopic，否则跟随已选目标的阵营，否则取第一个
function currentDialTopic() {
  const topics = teamTopicsInPlay();
  if (!topics.length) return '';
  if (state.selectedTargetTopic && topics.includes(state.selectedTargetTopic)) return state.selectedTargetTopic;
  const sel = buildTargets().find((target) => target.playerId === state.selectedTargetId);
  if (sel && topics.includes(sel.topic)) return sel.topic;
  return topics[0];
}

// 右轮目标：限定在左轮所选阵营内
function dialTargets() {
  const topic = currentDialTopic();
  const targets = buildTargets();
  return topic ? targets.filter((target) => target.topic === topic) : targets;
}

function wheelItems(type) {
  if (type === 'topic') return teamTopicsInPlay();
  return dialTargets().map((target) => target.playerId);
}

function wheelCurrentIndex(type, items = wheelItems(type)) {
  const current = type === 'topic' ? currentDialTopic() : state.selectedTargetId;
  const index = items.indexOf(current);
  return index >= 0 ? index : 0;
}

function applyWheelOffset(type, index) {
  const stack = type === 'topic' ? $('#dialTeamStack') : $('#dialTargetStack');
  if (!stack) return;
  stack.style.setProperty('--wheel-index', String(Math.max(0, index)));
}

function applyWheelOffsetFloat(type, floatIndex) {
  const stack = type === 'topic' ? $('#dialTeamStack') : $('#dialTargetStack');
  if (!stack) return;
  stack.style.setProperty('--wheel-index', floatIndex.toFixed(4));
}

function playGearTick(strength = 1) {
  playSfx('gear', strength);
}

async function finishDialFire() {
  if (!dialDrag.active) return;
  const current = parseFloat($('#dialFireFill')?.style.width || '0');
  dialDrag.active = false;
  dialDrag.suppressClick = true;
  $('#combatConsole')?.classList.remove('tremble');
  if (current >= 78 && attackCdRemaining() === 0) {
    setDialFireProgress(100);
    triggerFinalImpact();
    await useCombat({ suppressSheet: true });
    setTimeout(() => {
      resetDialFireProgress();
      dialDrag.suppressClick = false;
    }, 420);
  } else {
    resetDialFireProgress();
    setTimeout(() => {
      dialDrag.suppressClick = false;
    }, 180);
  }
}

function renderDialOptions() {
  // 左轮：对局中真实存在的阵营，以色块呈现
  const topicKeys = teamTopicsInPlay();
  const activeTopic = currentDialTopic();
  const teamStack = $('#dialTeamStack');
  if (teamStack) {
    teamStack.innerHTML = topicKeys.length ? topicKeys.map((key) => (
      `<div class="dial-option ${key === activeTopic ? 'current' : ''}" data-wheel-value="${key}" style="--topic:${topicMeta(key).color}"><i class="dial-swatch" style="background:${topicMeta(key).color}"></i></div>`
    )).join('') : '<div class="dial-option current"><i class="dial-swatch dial-swatch-empty"></i></div>';
    applyWheelOffset('topic', Math.max(0, topicKeys.indexOf(activeTopic)));
  }

  // 右轮：限定在左轮所选阵营内的目标
  const pool = dialTargets();
  const selected = pool.find((item) => item.playerId === state.selectedTargetId) || pool.find((item) => item.selectable) || pool[0];
  const targetStack = $('#dialTargetStack');
  if (targetStack) {
    targetStack.innerHTML = pool.length ? pool.map((target) => (
      `<div class="dial-option ${target.playerId === (selected && selected.playerId) ? 'current' : ''}" data-target="${target.playerId}" style="--topic:${topicMeta(target.topic).color}"><span>${target.playerId} · ${target.health}/2</span></div>`
    )).join('') : '<div class="dial-option current"><span>NO TARGET</span></div>';
    const selectedIndex = selected ? Math.max(0, pool.indexOf(selected)) : 0;
    applyWheelOffset('target', selectedIndex);
  }
}

function renderTargets() {
  const targets = buildTargets();
  renderDialOptions();
  $('#targetList').innerHTML = targets.slice(0, 1).map((target) => (
    `<button class="target-row ${target.playerId === state.selectedTargetId ? 'active' : ''} ${target.selectable ? '' : 'dim'}" data-target="${target.playerId}">
      <span><strong>${target.playerId}</strong><span>${target.relation} · ${target.health}/2</span></span>
      <b style="color:${topicMeta(target.topic).color}">${heroMeta(target.hero).label}</b>
    </button>`
  )).join('') || '<div class="event-feed">NO ACTIVE TARGETS</div>';
  renderReportTicker();
}

function escapeHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statScore(item = {}) {
  return Number(item.kills || 0) * 3 + Number(item.captures || 0) * 2 + Number(item.heals || 0) - Number(item.deaths || 0);
}

function statLine(item = {}) {
  return `K ${Number(item.kills || 0)} · C ${Number(item.captures || 0)} · H ${Number(item.heals || 0)} · D ${Number(item.deaths || 0)}`;
}

function leaderboardRows(limit = 3) {
  const stats = ((state.room && state.room.playerStats) || []).slice();
  return stats
    .sort((a, b) => statScore(b) - statScore(a) || String(a.playerId || '').localeCompare(String(b.playerId || '')))
    .slice(0, limit);
}

function renderReportTicker() {
  const feed = $('#eventFeed');
  if (!feed) return;
  const latestEvent = ((state.room && state.room.events) || []).slice(-1)[0];
  const leader = leaderboardRows(1)[0];
  const eventText = latestEvent ? formatEventText(latestEvent) : 'NO EVENTS';
  const leaderText = leader ? `TOP ${leader.playerId} ${statScore(leader)}` : 'NO STATS';
  feed.innerHTML = `<span>${escapeHTML(eventText)}</span><b>${escapeHTML(leaderText)}</b>`;
}

function displayLandmarkName(name) {
  const text = String(name || '').trim();
  const match = text.match(/^据点\s*(\d+)/);
  if (match) return `POINT ${match[1]}`;
  return text || 'POINT';
}

function formatEventText(event) {
  const text = String((event && event.text) || (event && event.type) || '');
  return text
    .replace(/进入死亡状态/g, 'DOWN')
    .replace(/复活/g, 'REVIVED')
    .replace(/击倒/g, 'KNOCKED')
    .replace(/攻击/g, 'STRIKE')
    .replace(/治疗/g, 'HEAL');
}

function renderMap() {
  // All maps render on OSM via the Leaflet shim. renderAmap() keeps the full gameplay
  // layer (vision circles, enemy visibility, capture points); ?map=leaflet uses the
  // lighter native-Leaflet path that omits the vision layer.
  if (MAP_PROVIDER === 'leaflet') {
    renderLeafletMap();
    return;
  }
  renderAmap();
}

function setMapStatus(text) {
  const panel = $('.map-panel');
  if (!panel) return;
  let status = panel.querySelector('.map-status.float');
  if (!status) {
    status = document.createElement('div');
    status.className = 'map-status float';
    panel.appendChild(status);
  }
  status.textContent = text;
  clearTimeout(setMapStatus.timer);
  setMapStatus.timer = setTimeout(() => status.remove(), 2600);
}

function renderFallbackMap(message) {
  const markers = [];
  markers.push(`<div class="map-status">${message}</div>`);
  markers.push(`<button class="map-marker me" style="left:50%;top:50%">ME</button>`);
  ((state.room && state.room.players) || []).forEach((player, index) => {
    if (player.playerId === state.playerId) return;
    const klass = player.topic === state.topic ? 'mate' : 'enemy';
    markers.push(`<button class="map-marker ${klass}" data-target="${player.playerId}" style="left:${20 + (index * 19) % 68}%;top:${24 + (index * 23) % 58}%">${player.playerId}</button>`);
  });
  state.landmarks.forEach((lm, index) => {
    markers.push(`<button class="map-marker" data-landmark="${lm.landmarkId}" style="left:${18 + (index * 29) % 64}%;top:${18 + (index * 31) % 62}%">${displayLandmarkName(lm.name)} ${lm.ownerTopic ? topicMeta(lm.ownerTopic).label : ''}</button>`);
  });
  $('#mapGrid').innerHTML = markers.join('');
}

function loadLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);
  if (state.leaflet.loading) return state.leaflet.loading;
  state.leaflet.loading = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Map failed to load'));
    document.head.appendChild(script);
  });
  return state.leaflet.loading;
}

// ── OSM / Leaflet adapter ───────────────────────────────────────────────
// The map layer was originally written against the AMap (Gaode) JS API. To switch
// the basemap to OpenStreetMap without rewriting every renderer, loadAmapScript()
// now loads Leaflet and returns a thin shim that mimics the AMap API surface we use
// (Map / Marker / Circle / Polyline / Pixel / Scale). All gameplay rendering — vision
// circles, enemy visibility, capture triangle, trajectory — keeps working unchanged.
// AMap uses [lng, lat]; Leaflet uses [lat, lng], so every coordinate is swapped here.
let __osmShim = null;
function buildOsmShim(L) {
  const toLatLng = (c) => [Number(c[1]), Number(c[0])]; // [lng,lat] -> [lat,lng]
  const dash = (style, arr) => (Array.isArray(arr) ? arr.join(' ') : (style === 'dashed' ? '6 5' : null));

  function Pixel(x, y) { this.x = Number(x) || 0; this.y = Number(y) || 0; }

  function addTiles(lmap) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(lmap);
  }

  function ShimMap(container, opts = {}) {
    const el = (typeof container === 'string') ? document.getElementById(container) : container;
    const zoomOn = opts.zoomEnable !== false;
    this._lmap = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      dragging: opts.dragEnable !== false,
      scrollWheelZoom: opts.scrollWheel !== false && zoomOn,
      doubleClickZoom: opts.doubleClickZoom !== false && zoomOn,
      touchZoom: opts.touchZoom !== false && zoomOn,
      boxZoom: zoomOn,
      keyboard: opts.keyboardEnable !== false,
    });
    const z = Number.isFinite(opts.zoom) ? opts.zoom : 16;
    this._lmap.setView(opts.center ? toLatLng(opts.center) : [39.9930, 116.3033], z);
    if (Array.isArray(opts.zooms)) { this._lmap.setMinZoom(opts.zooms[0]); this._lmap.setMaxZoom(opts.zooms[1]); }
    addTiles(this._lmap);
    setTimeout(() => { try { this._lmap.invalidateSize(); } catch (e) {} }, 0);
  }
  ShimMap.prototype.resize = function () { try { this._lmap.invalidateSize(); } catch (e) {} };
  ShimMap.prototype.setCenter = function (c) { this._lmap.setView(toLatLng(c), this._lmap.getZoom(), { animate: false }); };
  ShimMap.prototype.setZoom = function (z) { this._lmap.setZoom(z); };
  ShimMap.prototype.getZoom = function () { return this._lmap.getZoom(); };
  ShimMap.prototype.destroy = function () { try { this._lmap.remove(); } catch (e) {} };
  ShimMap.prototype.addControl = function (ctrl) { if (ctrl && ctrl.__isScale) L.control.scale({ imperial: false }).addTo(this._lmap); };
  ShimMap.prototype.setStatus = function (st = {}) {
    const m = this._lmap;
    const tog = (h, on) => { if (h) { on ? h.enable() : h.disable(); } };
    if ('dragEnable' in st) tog(m.dragging, st.dragEnable);
    if ('zoomEnable' in st) { tog(m.scrollWheelZoom, st.zoomEnable); tog(m.touchZoom, st.zoomEnable); tog(m.doubleClickZoom, st.zoomEnable); tog(m.boxZoom, st.zoomEnable); }
    if ('scrollWheel' in st) tog(m.scrollWheelZoom, st.scrollWheel);
    if ('doubleClickZoom' in st) tog(m.doubleClickZoom, st.doubleClickZoom);
    if ('touchZoom' in st) tog(m.touchZoom, st.touchZoom);
    if ('keyboardEnable' in st) tog(m.keyboard, st.keyboardEnable);
  };
  ShimMap.prototype.setFitView = function (markers, immediate, padding, maxZoom) {
    const pts = (markers || []).map((mk) => mk && mk._latlng).filter(Boolean);
    if (!pts.length) return;
    const pad = Array.isArray(padding) ? (padding[0] || 20) : 20;
    try { this._lmap.fitBounds(L.latLngBounds(pts), { padding: [pad, pad], maxZoom: maxZoom || 18 }); } catch (e) {}
  };

  const iconFor = (opts) => {
    const off = opts.offset || { x: 0, y: 0 };
    return L.divIcon({ className: '', html: opts.content || '', iconSize: null, iconAnchor: [-(off.x || 0), -(off.y || 0)] });
  };

  function ShimMarker(opts = {}) {
    this._opts = opts;
    this._latlng = toLatLng(opts.position);
    this._marker = L.marker(this._latlng, { icon: iconFor(opts), zIndexOffset: Number(opts.zIndex) || 0 });
    if (opts.map && opts.map._lmap) this._marker.addTo(opts.map._lmap);
  }
  ShimMarker.prototype.setMap = function (map) { if (map && map._lmap) this._marker.addTo(map._lmap); else this._marker.remove(); };
  ShimMarker.prototype.setContent = function (html) { this._opts.content = html; this._marker.setIcon(iconFor(this._opts)); };
  ShimMarker.prototype.on = function (ev, fn) { this._marker.on(ev, fn); return this; };

  function ShimCircle(opts = {}) {
    this._circle = L.circle(toLatLng(opts.center), {
      radius: Number(opts.radius) || 0,
      color: opts.strokeColor || '#333',
      opacity: opts.strokeOpacity != null ? opts.strokeOpacity : 0.8,
      weight: opts.strokeWeight != null ? opts.strokeWeight : 1.5,
      dashArray: dash(opts.strokeStyle, opts.strokeDasharray),
      fillColor: opts.fillColor || opts.strokeColor || '#333',
      fillOpacity: opts.fillOpacity != null ? opts.fillOpacity : 0.1,
      interactive: false,
    });
    if (opts.map && opts.map._lmap) this._circle.addTo(opts.map._lmap);
  }
  ShimCircle.prototype.setMap = function (map) { if (map && map._lmap) this._circle.addTo(map._lmap); else this._circle.remove(); };

  function ShimPolyline(opts = {}) {
    this._line = L.polyline((opts.path || []).map(toLatLng), {
      color: opts.strokeColor || '#fff',
      weight: opts.strokeWeight != null ? opts.strokeWeight : 2,
      opacity: opts.strokeOpacity != null ? opts.strokeOpacity : 0.8,
      dashArray: dash(opts.strokeStyle, opts.strokeDasharray),
      interactive: false,
    });
    if (opts.map && opts.map._lmap) this._line.addTo(opts.map._lmap);
  }
  ShimPolyline.prototype.setMap = function (map) { if (map && map._lmap) this._line.addTo(map._lmap); else this._line.remove(); };

  function ShimScale() { this.__isScale = true; }

  return { Map: ShimMap, Marker: ShimMarker, Circle: ShimCircle, Polyline: ShimPolyline, Pixel, Scale: ShimScale };
}

// Returns the OSM/Leaflet shim (named loadAmapScript for call-site compatibility).
function loadAmapScript() {
  if (__osmShim) return Promise.resolve(__osmShim);
  return loadLeafletAssets().then((L) => {
    __osmShim = buildOsmShim(L);
    return __osmShim;
  });
}

function validCoord(item) {
  const lat = Number(item && item.lat);
  const lng = Number(item && item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
}

function mapCenter() {
  const me = validCoord(state.location) || validCoord(currentPlayer());
  if (me) return me;
  const player = ((state.room && state.room.players) || []).map(validCoord).find(Boolean);
  if (player) return player;
  const landmark = state.landmarks.map(validCoord).find(Boolean);
  return landmark || [116.3115, 39.9915];
}

// 我的位置（GCJ02，与地图标记同坐标系）；用于「以我为中心」
function mapCenterGcj() {
  const base = mapCenter();
  return wgs84ToGcj02(base[1], base[0]);
}

// 主动回到我的位置（点开地图 / 点定位按钮时触发；轮询不会调用，避免打断拖动）
function centerMapOnMe() {
  if (!state.amap.map) return;
  state.amap.map.setCenter(mapCenterGcj());
  state.amap.map.setZoom(16);
  setTimeout(() => state.amap.map && state.amap.map.resize(), 0);
}

function toLeafletLatLng(coord) {
  return [coord[1], coord[0]];
}

function markerHtml(label, className) {
  return `<div class="map-game-marker ${className || ''}">${label}</div>`;
}

// 大地图玩家标记：阵营色圆点 + 角色图标（取人物选择界面的 heroMeta 图标），不再显示全名
function playerMarkerHtml(player, className) {
  const color = topicMeta(player.topic || state.topic).color;
  const icon = heroMeta(player.hero || state.hero).icon;
  return `<div class="map-pin-dot ${className || ''}" style="--pin:${color}">${icon}</div>`;
}

async function renderLeafletMap() {
  const container = $('#mapGrid');
  if (!container) return;
  if (!state.leaflet.map) {
    container.innerHTML = '<div class="map-status">Loading map…</div>';
  }
  try {
    const L = await loadLeafletAssets();
    const center = toLeafletLatLng(mapCenter());
    if (!state.leaflet.map) {
      container.innerHTML = '';
      state.leaflet.map = L.map('mapGrid', {
        attributionControl: true,
        zoomControl: false,
      }).setView(center, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(state.leaflet.map);
      L.control.zoom({ position: 'topright' }).addTo(state.leaflet.map);
    } else {
      state.leaflet.map.setView(center, state.leaflet.map.getZoom(), { animate: false });
    }
    syncLeafletMarkers(L);
    setTimeout(() => state.leaflet.map && state.leaflet.map.invalidateSize(), 0);
  } catch (e) {
    renderFallbackMap(e.message || 'Map unavailable');
  }
}

function makeLeafletIcon(L, label, klass) {
  return L.divIcon({
    className: '',
    html: markerHtml(label, klass),
    iconAnchor: [13, 13],
  });
}

function syncLeafletMarkers(L) {
  if (!state.leaflet.map) return;
  state.leaflet.markers.forEach((marker) => marker.remove());
  state.leaflet.markers = [];

  const me = currentPlayer();
  const mePos = validCoord(state.location) || validCoord(me);
  if (mePos) {
    state.leaflet.markers.push(L.marker(toLeafletLatLng(mePos), {
      icon: makeLeafletIcon(L, 'ME', 'me'),
      zIndexOffset: 120,
    }).addTo(state.leaflet.map));
  }

  ((state.room && state.room.players) || []).forEach((player) => {
    if (player.playerId === state.playerId) return;
    const pos = validCoord(player);
    if (!pos) return;
    const klass = player.topic === state.topic ? 'mate' : 'enemy';
    const marker = L.marker(toLeafletLatLng(pos), {
      icon: makeLeafletIcon(L, player.playerId, klass),
      zIndexOffset: klass === 'enemy' ? 90 : 80,
    }).addTo(state.leaflet.map);
    marker.on('click', () => {
      state.selectedTargetId = player.playerId;
      renderBattle();
    });
    state.leaflet.markers.push(marker);
  });

  state.landmarks.forEach((lm) => {
    const pos = validCoord(lm);
    if (!pos) return;
    const marker = L.marker(toLeafletLatLng(pos), {
      icon: makeLeafletIcon(L, displayLandmarkName(lm.name), 'landmark'),
      zIndexOffset: 100,
    }).addTo(state.leaflet.map);
    marker.on('click', () => {
      state.selectedLandmarkId = lm.landmarkId;
      openCombatSheet();
    });
    state.leaflet.markers.push(marker);
  });
}

async function renderAmap() {
  const container = $('#mapGrid');
  if (!container) return;
  if (!state.amap.map) {
    container.innerHTML = '<div class="map-status">Loading map…</div>';
  }
  try {
    const AMap = await loadAmapScript();
    if (!state.amap.map) {
      container.innerHTML = '';
      state.amap.map = new AMap.Map('mapGrid', {
        center: mapCenterGcj(),
        zoom: 16,
        resizeEnable: true,
        viewMode: '2D',
        mapStyle: 'amap://styles/dark',
      });
      state.amap.map.addControl(new AMap.Scale());
    }
    state.amap.available = true;
    // 注意：不在每次渲染时 setCenter——只更新标记位置，相机由用户掌控（点开/点定位才回到我）
    syncAmapMarkers(AMap);
  } catch (e) {
    state.amap.available = false;
    renderFallbackMap(e.message || 'Map unavailable');
  }
}

function drawVisionLayer(AMap, viewerTopic) {
  if (!state.amap.map) return;
  (state.amap.visionShapes || []).forEach((s) => s.setMap(null));
  state.amap.visionShapes = [];
  const myColor = viewerTopic ? topicMeta(viewerTopic).color : '#8d8a82';

  // Checkmate 模式分支：渲染动态塔（不画固定塔/复活点）
  if (state.mode === 'checkmate') {
    const dt = (state.room && state.room.dynamicTowers) || [];
    dt.forEach((t) => {
      if (!t.active) return;
      const mine = t.ownerTopic === viewerTopic;
      const ownerColor = t.ownerTopic ? topicMeta(t.ownerTopic).color : '#8d8a82';
      state.amap.visionShapes.push(new AMap.Circle({
        center: wgs84ToGcj02(t.lat, t.lng),
        radius: t.radius || (t.type === 'major' ? 50 : 30),
        strokeColor: ownerColor,
        strokeOpacity: mine ? 0.9 : 0.6,
        strokeWeight: mine ? 2 : 1.5,
        strokeStyle: mine ? 'solid' : 'dashed',
        strokeDasharray: mine ? null : [6, 4],
        fillColor: ownerColor,
        fillOpacity: mine ? 0.14 : 0.06,
        map: state.amap.map,
        zIndex: 10,
      }));
      state.amap.visionShapes.push(new AMap.Marker({
        position: wgs84ToGcj02(t.lat, t.lng),
        content: `<i class="vision-pin ${mine ? 'mine' : 'enemy'} ${t.type === 'major' ? 'major' : 'minor'}">${t.type === 'major' ? '▲' : '●'}</i>`,
        offset: new AMap.Pixel(-5, -5),
        zIndex: 30,
        map: state.amap.map,
      }));
    });
    // KING 30m 视野（与未名湖一致）
    allyKings(viewerTopic).forEach((king) => {
      const color = topicMeta(king.topic).color;
      const circle = new AMap.Circle({
        center: wgs84ToGcj02(king.lat, king.lng),
        radius: KING_VISION_RADIUS,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 1,
        strokeStyle: 'dashed',
        strokeDasharray: [4, 3],
        fillColor: color,
        fillOpacity: 0.04,
        bubble: false,
        zIndex: 50,
      });
      circle.setMap(state.amap.map);
      state.amap.visionShapes.push(circle);
    });
    // 敌方 KING 正在读条 → 在他位置画橙色脉冲（让我方知道去打断）
    const kingState = state.room?.kingState || {};
    Object.keys(kingState).forEach((topic) => {
      if (topic === viewerTopic) return;
      const ks = kingState[topic];
      if (!ks.placing) return;
      const kingId = ks.playerId;
      const king = (state.room?.players || []).find((p) => p.playerId === kingId);
      if (!king || king.lat == null || king.lng == null) return;
      const pulse = new AMap.Circle({
        center: wgs84ToGcj02(king.lat, king.lng),
        radius: 8,
        strokeColor: '#ff7a3a',
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: '#ff5040',
        fillOpacity: 0.35,
        zIndex: 55,
      });
      pulse.setMap(state.amap.map);
      state.amap.visionShapes.push(pulse);
      state.amap.visionShapes.push(new AMap.Marker({
        position: wgs84ToGcj02(king.lat, king.lng),
        content: `<i class="vision-pin enemy-king-placing">⚠</i>`,
        offset: new AMap.Pixel(-8, -8),
        zIndex: 60,
        map: state.amap.map,
      }));
    });
    window.__debugVision = () => ({
      mode: state.mode,
      map: !!state.amap.map,
      viewerTopic,
      dynamicTowers: dt.length,
      activeTowers: dt.filter((x) => x.active).length,
      visionShapes: state.amap.visionShapes.length,
    });
    return;
  }

  TOWER_POINTS.forEach((pt) => {
    const owned = !!pt.ownerTopic;
    const mine = owned && pt.ownerTopic === viewerTopic;
    const enemyOwned = owned && !mine;
    const fillColor = enemyOwned ? '#1a1a1a' : (mine ? myColor : '#8d8a82');
    const fillOpacity = enemyOwned ? 0.18 : (mine ? 0.16 : 0.10);
    const strokeColor = enemyOwned ? '#333' : (mine ? myColor : '#666');
    const strokeStyle = enemyOwned ? 'dashed' : 'solid';
    state.amap.visionShapes.push(new AMap.Circle({
      center: wgs84ToGcj02(pt.lat, pt.lng),
      radius: pt.radius || 30,
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 1.5,
      strokeStyle,
      fillColor,
      fillOpacity,
      map: state.amap.map,
      zIndex: 10,
    }));
    state.amap.visionShapes.push(new AMap.Marker({
      position: wgs84ToGcj02(pt.lat, pt.lng),
      content: `<i class="vision-pin ${enemyOwned ? 'enemy' : (mine ? 'mine' : 'public')} ${pt.type === 'major' ? 'major' : 'minor'}"></i>`,
      offset: new AMap.Pixel(-4, -4),
      zIndex: 30,
      map: state.amap.map,
    }));
  });
  RESPAWN_POINTS.forEach((pt) => {
    state.amap.visionShapes.push(new AMap.Circle({
      center: wgs84ToGcj02(pt.lat, pt.lng),
      radius: pt.radius || 50,
      strokeColor: '#00cc88',
      strokeOpacity: 0.85,
      strokeWeight: 1.5,
      fillColor: '#00cc88',
      fillOpacity: 0.14,
      map: state.amap.map,
      zIndex: 12,
    }));
    state.amap.visionShapes.push(new AMap.Marker({
      position: wgs84ToGcj02(pt.lat, pt.lng),
      content: `<i class="vision-pin respawn">⟳</i>`,
      offset: new AMap.Pixel(-7, -7),
      zIndex: 32,
      map: state.amap.map,
    }));
  });
  // KING vision halos (己方阵营所有存活国王)
  allyKings(viewerTopic).forEach((king) => {
    const color = topicMeta(king.topic).color;
    const center = wgs84ToGcj02(king.lat, king.lng);
    // AMap.Circle 在 fillOpacity=0 时部分场景不渲染，加微弱 fill 兜底
    const circle = new AMap.Circle({
      center,
      radius: KING_VISION_RADIUS,
      strokeColor: color,
      strokeOpacity: 0.9,
      strokeWeight: 1,
      strokeStyle: 'dashed',
      strokeDasharray: [4, 3],
      fillColor: color,
      fillOpacity: 0.04,
      bubble: false,
      zIndex: 50,
    });
    circle.setMap(state.amap.map);
    state.amap.visionShapes.push(circle);
  });
  // 调试入口：window.__debugVision() 可在控制台手动检查
  window.__debugVision = () => ({
    map: !!state.amap.map,
    viewerTopic,
    allyKingsCount: allyKings(viewerTopic).length,
    visionShapes: state.amap.visionShapes.length,
    roomPlayers: (state.room?.players || []).length,
  });
}

function syncAmapMarkers(AMap) {
  if (!state.amap.map) return;
  state.amap.markers.forEach((marker) => marker.setMap(null));
  state.amap.markers = [];

  const viewerTopic = state.topic;
  drawVisionLayer(AMap, viewerTopic);

  const me = currentPlayer();
  const meRaw = validCoord(state.location) || validCoord(me);
  if (meRaw) {
    // Phase 6: WGS84 → GCJ02 转换，与塔/复活点圈使用同一坐标系
    const mePos = wgs84ToGcj02(meRaw[1], meRaw[0]);
    state.amap.markers.push(new AMap.Marker({
      position: mePos,
      content: playerMarkerHtml(me, 'me'),
      offset: new AMap.Pixel(-13, -13),
      zIndex: 120,
      map: state.amap.map,
    }));
  }

  ((state.room && state.room.players) || []).forEach((player) => {
    if (player.playerId === state.playerId) return;
    const posRaw = validCoord(player);
    if (!posRaw) return;
    const isAlly = player.topic === viewerTopic;
    if (!isAlly && !isEnemyVisibleTo(player, viewerTopic)) return;
    const klass = isAlly ? 'mate' : 'enemy';
    const pos = wgs84ToGcj02(posRaw[1], posRaw[0]);
    state.amap.markers.push(new AMap.Marker({
      position: pos,
      content: playerMarkerHtml(player, klass),
      offset: new AMap.Pixel(-13, -13),
      zIndex: klass === 'enemy' ? 90 : 80,
      map: state.amap.map,
    }));
  });

  state.landmarks.forEach((lm) => {
    const pos = validCoord(lm);
    if (!pos) return;
    state.amap.markers.push(new AMap.Marker({
      position: pos,
      content: markerHtml(displayLandmarkName(lm.name), 'landmark'),
      offset: new AMap.Pixel(-18, -18),
      zIndex: 100,
      map: state.amap.map,
    }));
  });
}

function buildSelfStats() {
  const stats = (state.room && state.room.playerStats) || [];
  return stats.find((item) => item.playerId === state.playerId) || { kills: 0, deaths: 0, heals: 0, captures: 0, captureArea: 0 };
}

function eventRows(limit = 6) {
  return ((state.room && state.room.events) || []).slice(-limit).reverse();
}

// 顶栏中部比分：取本局实际参战阵营，按分数降序展示前 2 名（默认 0）
function renderMatchHud() {
  const el = $('#matchScore');
  if (!el) return;
  const scores = (state.room && state.room.topicScores) || {};
  const topics = [...new Set(((state.room && state.room.players) || []).map((p) => p.topic).filter(Boolean))];
  const ranked = topics
    .map((t) => ({ t, v: Math.round(Number(scores[t] || 0)) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2);
  el.innerHTML = ranked.map((r) =>
    `<span class="ms-team" style="--c:${topicMeta(r.t).color}"><i></i>${r.v}</span>`
  ).join('<b>:</b>');
}

function buildMyScoreLabel() {
  const scores = (state.room && state.room.topicScores) || {};
  const score = scores[state.topic];
  return score == null ? 'NO SCORE' : `${topicMeta().label} ${Math.round(score)}m²`;
}

async function locate() {
  if (!navigator.geolocation) {
    alert('This browser does not support location');
    return false;
  }
  setMapStatus('Reading current location...');
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
    });
    state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, ready: true };
    setMapStatus('Located');
    await uploadLocation();
    if ($('[data-screen="battle"]').classList.contains('active')) startLocationWatch();
    renderBattle();
    centerMapOnMe();   // 主动点定位按钮 → 回到我的位置
    return true;
  } catch (e) {
    state.location.ready = false;
    const message = e && e.code === 1 ? 'Location permission denied' : 'Location failed, please try again';
    setMapStatus(message);
    alert(message);
    return false;
  }
}

function startLocationWatch() {
  if (!navigator.geolocation || state.locationWatchId != null) return;
  state.locationWatchId = navigator.geolocation.watchPosition((pos) => {
    state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, ready: true };
    if ($('[data-screen="battle"]').classList.contains('active')) renderBattle();
    const now = Date.now();
    if (now - (state.lastTrackSampleAt || 0) > 10000) {
      state.lastTrackSampleAt = now;
      state.trackLog = state.trackLog || [];
      state.trackLog.push({ lat: pos.coords.latitude, lng: pos.coords.longitude, t: now });
    }
    if (now - state.lastLocationUploadAt > 2500) {
      state.lastLocationUploadAt = now;
      uploadLocation();
    }
  }, () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 });
}

function stopLocationWatch() {
  if (!navigator.geolocation || state.locationWatchId == null) return;
  navigator.geolocation.clearWatch(state.locationWatchId);
  state.locationWatchId = null;
}

function ensureTestRoomLocation() {
  const roomId = String(state.roomId || '').trim().toLowerCase();
  if (roomId !== 'test' && roomId !== 'testline') return false;
  if (state.location && state.location.ready) return false;
  state.location = { lat: 39.992679, lng: 116.305732, accuracy: 5, ready: true };
  return true;
}

async function uploadLocation() {
  ensureTestRoomLocation();
  if (!state.location.ready) return;
  try {
    const res = await request('/players/location', {
      method: 'POST',
      data: { roomId: state.roomId, playerId: state.playerId, lat: state.location.lat, lng: state.location.lng },
    });
    state.room = res.room;
    renderBattle();
  } catch (e) {}
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1] || '';
}

function attachCameraStream() {
  const viewfinder = $('#viewfinderVideo');
  const overlay = $('#cameraVideo');
  if (viewfinder && state.cameraStream && viewfinder.srcObject !== state.cameraStream) {
    viewfinder.srcObject = state.cameraStream;
    viewfinder.play().catch(() => {});
  }
  if (overlay && state.cameraStream && overlay.srcObject !== state.cameraStream) {
    overlay.srcObject = state.cameraStream;
    overlay.play().catch(() => {});
  }
  $('.viewfinder')?.classList.toggle('camera-live', !!state.cameraStream);
  syncCameraControls();
}

async function ensureViewfinderCamera(options = {}) {
  if (document.hidden) return false;   // 息屏/切后台时不启动相机（省电；回前台再开）
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (!options.silent) alert('This browser does not support the camera API');
    return false;
  }
  if (state.cameraBlocked && options.silent) return false;
  if (!options.silent) state.cameraBlocked = false;
  if (state.cameraStream) {
    attachCameraStream();
    return true;
  }
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: state.cameraFacing } }, audio: false });
    state.cameraBlocked = false;
    attachCameraStream();
    return true;
  } catch (e) {
    state.cameraBlocked = true;
    $('.viewfinder')?.classList.remove('camera-live');
    if (!options.silent) alert(e && e.message ? e.message : 'Camera failed to start');
    return false;
  }
}

async function restartViewfinderCamera() {
  if (state.cameraStream) state.cameraStream.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  state.cameraBlocked = false;
  return ensureViewfinderCamera();
}

async function flipCamera() {
  state.cameraFacing = state.cameraFacing === 'environment' ? 'user' : 'environment';
  await restartViewfinderCamera();
}

async function openCamera() {
  if (!(await ensureViewfinderCamera())) return;
  $('#cameraOverlay').classList.remove('hidden');
  $('#savePhotoBtn').classList.add('hidden');
  $('#captureBtn').classList.remove('hidden');
  $('#cameraStatus').textContent = 'READY';
  state.pendingCapture = null;
  attachCameraStream();
}

function stopCameraStream() {
  if (state.cameraStream) state.cameraStream.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  const viewfinder = $('#viewfinderVideo');
  const overlay = $('#cameraVideo');
  if (viewfinder) viewfinder.srcObject = null;
  if (overlay) overlay.srcObject = null;
  $('.viewfinder')?.classList.remove('camera-live');
}

function closeCamera() {
  $('#cameraOverlay').classList.add('hidden');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function vibrateAfterCapture(cameraType) {
  if (cameraType === 'support') {
    setTimeout(() => vibrate([90, 18, 120]), 60);
    return;
  }
  if (cameraType === 'panorama') {
    setTimeout(() => vibrate([35, 14, 45]), 80);
    return;
  }
  if (cameraType === 'highiso') {
    setTimeout(() => vibrate(12), 40);
    setTimeout(() => vibrate(12), 120);
    return;
  }
  setTimeout(() => vibrate(12), 80);
}

function viewfinderSourceRect(video, profile) {
  const videoW = video.videoWidth || 900;
  const videoH = video.videoHeight || 1200;
  if (profile.crop === 'full') {
    return { sx: 0, sy: 0, sw: videoW, sh: videoH, outW: videoW, outH: videoH };
  }

  const shell = $('.viewfinder');
  const frameW = Math.max(1, shell ? shell.clientWidth : videoW);
  const frameH = Math.max(1, shell ? shell.clientHeight : videoH);
  const frameAspect = frameW / frameH;
  const videoAspect = videoW / videoH;
  let sx = 0;
  let sy = 0;
  let sw = videoW;
  let sh = videoH;

  if (videoAspect > frameAspect) {
    sw = videoH * frameAspect;
    sx = (videoW - sw) / 2;
  } else {
    sh = videoW / frameAspect;
    sy = (videoH - sh) / 2;
  }

  if (profile.crop === 'circleBounds') {
    const side = Math.min(sw, sh) * 0.72;
    sx += (sw - side) / 2;
    sy += (sh * 0.45) - (side / 2);
    sw = side;
    sh = side;
  }

  return {
    sx: Math.max(0, sx),
    sy: Math.max(0, sy),
    sw: Math.max(1, Math.min(videoW - sx, sw)),
    sh: Math.max(1, Math.min(videoH - sy, sh)),
    outW: Math.max(1, Math.round(sw)),
    outH: Math.max(1, Math.round(sh)),
  };
}

async function runCaptureEffect(profile) {
  const viewfinderShell = $('.viewfinder');
  const countdown = $('#captureCountdown');
  const charge = $('#chargeBar');
  clearTimeout(captureEffectTimer);
  viewfinderShell?.classList.add('capturing');
  vibrate(10);

  if (charge) {
    charge.classList.toggle('hidden', !profile.countdown);
    const bar = charge.querySelector('i');
    if (bar) {
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = profile.countdown ? `chargeShrink ${profile.shutterDelay}ms linear forwards` : '';
    }
  }

  if (countdown && profile.countdown) {
    countdown.classList.remove('hidden');
    const step = Math.max(300, Math.floor(profile.shutterDelay / profile.countdown));
    for (let value = profile.countdown; value > 0; value -= 1) {
      countdown.textContent = String(value);
      countdown.style.animation = 'none';
      void countdown.offsetWidth;
      countdown.style.animation = 'cdAppear 950ms ease-out forwards';
      vibrate(10);
      await wait(step);
    }
  } else if (profile.shutterDelay) {
    await wait(profile.shutterDelay);
  } else {
    await wait(40);
  }

  if (countdown) {
    countdown.textContent = '';
    countdown.classList.add('hidden');
  }
  if (charge) charge.classList.add('hidden');
  vibrateAfterCapture(profile.type);
  captureEffectTimer = setTimeout(() => viewfinderShell?.classList.remove('capturing'), 260);
}

function captureFrameFromVideo(video, profile = cameraProfile()) {
  const canvas = $('#captureCanvas');
  if (!video || !canvas) return '';
  const rect = viewfinderSourceRect(video, profile);
  canvas.width = rect.outW;
  canvas.height = rect.outH;
  const ctx = canvas.getContext('2d');
  if (state.cameraMirror) {
    ctx.save();
    ctx.translate(rect.outW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, rect.outW, rect.outH);
    ctx.restore();
  } else {
    ctx.drawImage(video, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, rect.outW, rect.outH);
  }
  return canvas.toDataURL('image/jpeg', 0.78);
}

function speechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

async function primeSpeechPermission() {
  state.speech.audioPrimed = false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    state.speech.audioPrimed = true;
    return true;
  } catch (e) {
    state.allowSpeech = false;
    const check = $('#setupSpeechCheck');
    if (check) check.checked = false;
    return false;
  }
}

function startPhotoSpeech() {
  if (!state.allowSpeech) return false;
  const SpeechRecognition = speechRecognitionCtor();
  state.pendingPhotoDescription = '';
  state.speech.transcript = '';
  if (!SpeechRecognition) return false;
  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript || '';
      }
      state.speech.transcript = text.trim();
    };
    recognition.onend = () => { state.speech.active = false; };
    state.speech.recognition = recognition;
    state.speech.active = true;
    recognition.start();
    return true;
  } catch (e) {
    state.speech.active = false;
    state.speech.recognition = null;
    return false;
  }
}

function stopPhotoSpeech() {
  const text = String(state.speech.transcript || '').trim();
  state.pendingPhotoDescription = text;
  try {
    if (state.speech.recognition && state.speech.active) state.speech.recognition.stop();
  } catch (e) {}
  state.speech.active = false;
  return text;
}

function captureFrame() {
  if (state.photos.length >= MAX_PHOTOS) {
    playSfx('error');
    const status = $('#cameraStatus');
    if (status) status.textContent = 'Film slots full · swipe right to clear';
    return;
  }
  const profile = cameraProfile();
  state.pendingCapture = captureFrameFromVideo($('#cameraVideo'), profile);
  if (!state.pendingCapture) return;
  $('#cameraStatus').textContent = 'CAPTURED';
  $('#captureBtn').classList.add('hidden');
  $('#savePhotoBtn').classList.remove('hidden');
}

async function captureViewfinderPhoto(options = {}) {
  if (state.photos.length >= MAX_PHOTOS) {
    playSfx('error');
    setMapStatus('✗ Film slots full, clear one first · swipe right to clear');
    return;
  }
  if (isAnyEnemyTeamDisarming(state.topic)) {
    playSfx('error');
    setMapStatus('⚔ Disarmed by the enemy — cannot take photos');
    return;
  }
  const ready = await ensureViewfinderCamera();
  if (!ready) {
    playSfx('error');
    return;
  }
  const profile = cameraProfile();
  await runCaptureEffect(profile);
  const video = $('#viewfinderVideo') || $('#cameraVideo');
  const capture = captureFrameFromVideo(video, profile);
  if (!capture) return;
  state.pendingCapture = capture;
  saveCapturedPhoto({ keepCamera: true, profile, description: options.description });
  const flash = $('.flash');
  if (flash) {
    flash.animate([{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
  }
}

function saveCapturedPhoto(options = {}) {
  if (!state.pendingCapture) return;
  const profile = options.profile || cameraProfile();
  // 所有房间统一使用真实 GPS 定位（已移除 testline 圈内随机假坐标）
  let photoLat, photoLng, locationReady, photoAccuracy;
  locationReady = !!state.location.ready && Number.isFinite(Number(state.location.lat)) && Number.isFinite(Number(state.location.lng));
  photoLat = locationReady ? Number(state.location.lat) : null;
  photoLng = locationReady ? Number(state.location.lng) : null;
  photoAccuracy = locationReady && Number.isFinite(Number(state.location.accuracy)) ? Number(state.location.accuracy) : null;
  const description = String(options.description ?? state.pendingPhotoDescription ?? '').trim();
  const photo = {
    photoId: `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    path: state.pendingCapture,
    lat: photoLat,
    lng: photoLng,
    locationReady,
    accuracy: photoAccuracy,
    createdAt: Date.now(),
    hero: currentPlayer().hero || state.hero,
    cameraType: profile.type,
    cameraLabel: profile.label,
    facing: state.cameraFacing || 'environment',
    description,
  };
  state.photos = state.photos.concat(photo).slice(-MAX_PHOTOS);
  state.selectedPhotoIndex = state.photos.length - 1;
  state.selectedFilmIndex = state.selectedPhotoIndex;
  state.pendingPhotoDescription = '';
  saveAlbum();
  $('#cameraOverlay').classList.add('hidden');
  renderBattle();
}

async function uploadPhoto(photo) {
  const res = await request('/photos/upload', {
    method: 'POST',
    timeout: 30000,
    data: {
      roomId: state.roomId,
      playerId: state.playerId,
      imageBase64: dataUrlToBase64(photo.path),
      lat: photo.lat,
      lng: photo.lng,
      description: photo.description || '',   // 语音转文字 / 描述
      hero: photo.hero || '',
      cameraLabel: photo.cameraLabel || '',
      accuracy: photo.accuracy,
    },
  });
  return res.photo;
}

async function useCombat({ suppressSheet = false } = {}) {
  const cd = attackCdRemaining();
  if (cd > 0) {
    playSfx('error');
    setMapStatus(`⏳ Skill cooling down ${Math.ceil(cd / 1000)}s`);
    return;
  }
  const combat = buildCombatState();
  if (!combat.canAct) {
    if (!suppressSheet) {
      if (!state.photos.length || selectedAmmo().text === 'EXPIRED') await captureViewfinderPhoto();
      else openAlbumSheet();
    }
    return;
  }
  const action = defaultAction();
  const photo = state.photos[state.selectedPhotoIndex];
  if (!photo) return;
  // wizard：必须是前置自拍，否则失败 + 消耗
  if (action === 'aoe' && photo.facing !== 'user') {
    state.usedPhotos = (state.usedPhotos || []).concat({ ...photo, useType: 'skill', useTarget: 'Sacrifice failed (not a selfie)' });
    removeLocalPhoto(photo.photoId);
    playSfx('error');
    openSheet(`<div class="sheet-head"><div class="sheet-title">SACRIFICE FAILED</div><button data-close>CLOSE</button></div>
      <div class="capture-result-sheet">
        <span class="capture-fail">Who are you trying to sacrifice?</span>
        <small style="display:block;margin-top:8px;opacity:.72;font-weight:700">You must upload a photo of yourself (front camera)</small>
        <small style="display:block;margin-top:4px;opacity:.55">1 photo used</small>
      </div>`, 'capture-result');
    renderBattle();
    return;
  }
  let uploaded = null;
  try {
    uploaded = await uploadPhoto(photo);
  } catch (e) {
    if (action !== 'aoe') {
      setMapStatus('✗ Photo upload failed');
      return;
    }
    uploaded = null;
  }
  const maliceActive = action === 'attack' && isTeamBuffActive(state.topic, 'malice');
  const payload = {
    roomId: state.roomId,
    actorPlayerId: state.playerId,
    action,
  };
  if (uploaded && uploaded.photoId) payload.photoId = uploaded.photoId;
  if (action === 'aoe') {
    payload.aoeRadius = WIZARD_AOE_RADIUS;
  } else {
    payload.targetPlayerId = state.selectedTargetId;
    payload.damageBonus = maliceActive ? 1 : 0;
  }
  let res;
  try {
    res = await request('/combat/use-photo', { method: 'POST', data: payload });
  } catch (err) {
    const msg = (err && (err.message || err.error)) || 'Request failed';
    setMapStatus(`✗ ${action === 'aoe' ? 'Sacrifice' : 'Attack'} failed: ${msg}`);
    playSfx('error');
    return;
  }
  // 出手成功 → 触发攻击/技能冷却（按角色，仅 牺牲者/狙击手/牧师）
  state.lastFireAt = Date.now();
  updateDialCooldownUi();
  // 出手反馈弹窗（aoe 另有「献祭完成」弹窗，这里只处理 attack / heal）
  if (action === 'attack') {
    const t = res.target || {};
    const killed = t.status === 'dead' || Number(t.health) <= 0;
    const who = state.selectedTargetId || 'enemy';
    showCombatToast(killed
      ? { kind: 'kill', icon: '⌖', title: `Knocked down ${who}`, sub: 'Enemy is down' }
      : { kind: 'dealt', icon: '⌖', title: `Hit ${who}`, sub: `Dealt ${res.value || 1} damage` });
  } else if (action === 'heal') {
    const t = res.target || {};
    showCombatToast({ kind: 'heal', icon: '✚', title: `Healed ${state.selectedTargetId || 'ally'}`, sub: `+${res.value || 1} HP · HP ${t.health != null ? t.health : 2}/2` });
  }
  if (action === 'aoe') {
    const hits = (res && res.targetsHit) || [];
    logBattleEvent('kill', '✦', `Sacrifice: hit ${hits.length} enemies, self-immolate -1 HP`);
    if (res && res.actorKilled) logBattleEvent('kill', '✝', `Self-immolated, went down`);
    const hitsHtml = hits.length === 0
      ? '<small style="display:block;margin-top:8px;opacity:.55;font-weight:700">No enemies within 10m</small>'
      : `<ul class="aoe-hits-list">${hits.map((h) =>
          `<li><span>${escapeHTML(h.playerId)}</span>${h.killed ? '<em class="aoe-killed">DOWN</em>' : '<em class="aoe-hit">-1 HP</em>'}</li>`
        ).join('')}</ul>`;
    const selfLine = res && res.actorKilled
      ? '<span class="capture-fail">✝ Self-immolated, down</span>'
      : '<span class="capture-ok">✝ Self-immolate -1 HP</span>';
    playSfx('confirm', 1.1);
    openSheet(`<div class="sheet-head"><div class="sheet-title">SACRIFICE COMPLETE</div><button data-close>CLOSE</button></div>
      <div class="capture-result-sheet" style="text-align:left">
        ${selfLine}
        <div class="aoe-hits-title">Hit ${hits.length} enemies</div>
        ${hitsHtml}
      </div>`, 'capture-result');
  } else if (maliceActive) {
    consumeTeamBuff(state.topic, 'malice');
    logBattleEvent('kill', '◆', `Malice: this attack ×2`);
  }
  const useTarget = action === 'aoe' ? `Self-immolate (${(res?.targetsHit || []).length} enemies)` : (state.selectedTargetId || '?');
  state.usedPhotos = (state.usedPhotos || []).concat({ ...photo, useType: 'skill', useTarget });
  removeLocalPhoto(photo.photoId);
  state.room = res.room;
  const roomEvents = (res.room && res.room.events) || [];
  const recent = roomEvents.slice(-5);
  recent.forEach((e) => {
    if (e.type === 'kill' && e.actorPlayerId === state.playerId) logBattleEvent('kill', '⌖', `Knocked down ${e.targetPlayerId || '?'}`);
    if (e.type === 'heal' && e.actorPlayerId === state.playerId) logBattleEvent('heal', '✚', `Healed ${e.targetPlayerId || '?'}`);
  });
  renderBattle();
}

function removeLocalPhoto(photoId) {
  state.photos = state.photos.filter((photo) => photo.photoId !== photoId);
  state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, state.photos.length - 1);
  state.selectedFilmIndex = Math.max(0, Math.min(state.selectedFilmIndex, MAX_PHOTOS - 1));
  if (state.selectedPhotoIndex < 0 && state.photos.length) state.selectedPhotoIndex = 0;
  saveAlbum();
}

function pruneExpiredPhotos() {
  const before = state.photos.length;
  state.photos = state.photos.filter(
    (photo) => PHOTO_TTL_MS - (Date.now() - Number(photo.createdAt || Date.now())) > 0,
  );
  if (state.photos.length < before) {
    state.selectedPhotoIndex = Math.min(state.selectedPhotoIndex, state.photos.length - 1);
    state.selectedFilmIndex = Math.max(0, Math.min(state.selectedFilmIndex, MAX_PHOTOS - 1));
    saveAlbum();
    renderFilmSlots();
    renderBattle();
  }
}

function startPhotoExpiryTimer() {
  stopPhotoExpiryTimer();
  photoExpiryTimer = setInterval(pruneExpiredPhotos, 4000);
}

function stopPhotoExpiryTimer() {
  if (photoExpiryTimer) {
    clearInterval(photoExpiryTimer);
    photoExpiryTimer = null;
  }
}

// ── Mechanical Shutter ─────────────────────────────────────────────────────

const MECH_MIN_ANGLE = -150;
const MECH_MAX_ANGLE = -30;
const MECH_RADIUS = 58;

const mechState = {
  isDown: false,
  isArmed: false,
  isDragging: false,
  holdTimer: null,
  pointerId: null,
  angle: MECH_MIN_ANGLE,
  zoom: 1,
  suppressCapture: false,
  lastTick: 10,
  lastGearAngle: MECH_MIN_ANGLE,
  initialized: false,
};

function mechAngleFromClient(clientX, clientY) {
  const el = $('#mechShutter');
  if (!el) return mechState.angle;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const a = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
  return Math.max(MECH_MIN_ANGLE, Math.min(MECH_MAX_ANGLE, a));
}

function mechPointerHit(clientX, clientY) {
  const pointer = $('#mechPointer');
  if (!pointer || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
  const rect = pointer.getBoundingClientRect();
  const pad = 28;
  return (
    clientX >= rect.left - pad &&
    clientX <= rect.right + pad &&
    clientY >= rect.top - pad &&
    clientY <= rect.bottom + pad
  );
}

function syncMechPointerReady(clientX, clientY) {
  const el = $('#mechShutter');
  if (!el || !mechState.isArmed) return false;
  const ready = mechPointerHit(clientX, clientY);
  el.classList.toggle('pointer-ready', ready);
  return ready;
}

function mechUpdate() {
  const t = (mechState.angle - MECH_MIN_ANGLE) / (MECH_MAX_ANGLE - MECH_MIN_ANGLE);
  mechState.zoom = 1 + t * 2;
  const rad = mechState.angle * Math.PI / 180;
  const px = Math.cos(rad) * MECH_RADIUS - 8;
  const py = Math.sin(rad) * MECH_RADIUS - 20;

  const el = $('#mechShutter');
  if (el) {
    el.style.setProperty('--mech-ptr-x', `${px}px`);
    el.style.setProperty('--mech-ptr-y', `${py}px`);
    el.style.setProperty('--mech-ptr-rot', `${mechState.angle + 90}deg`);
    el.style.setProperty('--mech-gear-rot', `${t * 170}deg`);
  }

  const pill = $('#mechZoomPill');
  if (pill) pill.textContent = `${mechState.zoom.toFixed(1)}×`;

  const step = Math.round(mechState.zoom * 10);
  if (mechState.isArmed && step !== mechState.lastTick) {
    mechState.lastTick = step;
    mechPlayTick();
  }

  const GEAR_STEP = 5;
  if (mechState.isArmed && Math.abs(mechState.angle - mechState.lastGearAngle) >= GEAR_STEP) {
    mechState.lastGearAngle = Math.round(mechState.angle / GEAR_STEP) * GEAR_STEP;
    mechPlayGearClick();
  }

  applyMechZoom(mechState.zoom);
}

function applyMechZoom(zoom) {
  const vf = $('.viewfinder');
  if (vf) vf.style.setProperty('--vf-zoom', zoom.toFixed(3));
  try {
    const track = state.cameraStream?.getVideoTracks?.()[0];
    if (track) {
      const caps = track.getCapabilities?.();
      if (caps?.zoom) {
        const hw = caps.zoom.min + (zoom - 1) / 2 * (caps.zoom.max - caps.zoom.min);
        track.applyConstraints({ advanced: [{ zoom: clamp(hw, caps.zoom.min, caps.zoom.max) }] });
      }
    }
  } catch (e) {}
}

function mechArm() {
  if (!mechState.isDown || mechState.isArmed) return;
  mechState.isArmed = true;
  mechState.isDragging = true;
  $('#mechShutter')?.classList.add('armed', 'dragging');
  $('#mechShutter')?.classList.remove('pointer-ready');
  mechPlayUnlock();
  mechUpdate();
}

function mechDisarm() {
  mechState.isArmed = false;
  mechState.isDragging = false;
  mechState.pointerId = null;
  $('#mechShutter')?.classList.remove('armed', 'pressed', 'dragging', 'pointer-ready');
}

function mechOnPointerDown(e) {
  if (mechState.isDown) return;
  e.preventDefault();
  mechState.isDown = true;
  mechState.pointerId = e.pointerId;
  mechState.suppressCapture = false;
  startPhotoSpeech();
  $('#mechShutter')?.classList.add('pressed');
  mechState.holdTimer = window.setTimeout(mechArm, 360);
}

function mechOnPointerMove(e) {
  if (!mechState.isDown || !mechState.isArmed) return;
  mechState.isDragging = true;
  $('#mechShutter')?.classList.add('dragging');
  mechState.angle = mechAngleFromClient(e.clientX, e.clientY);
  mechUpdate();
  syncMechPointerReady(e.clientX, e.clientY);
}

function mechOnPointerUp(e) {
  if (!mechState.isDown || (e && e.pointerId !== mechState.pointerId)) return;
  clearTimeout(mechState.holdTimer);
  const wasArmed = mechState.isArmed;
  const releaseOnPointer = wasArmed && e && syncMechPointerReady(e.clientX, e.clientY);
  mechState.isDown = false;
  const description = stopPhotoSpeech();
  if (!wasArmed) {
    mechState.suppressCapture = true;
    captureViewfinderPhoto({ description }).finally(() => {
      setTimeout(() => { mechState.suppressCapture = false; }, 200);
    });
    mechPlayShutter();
    $('#mechShutter')?.classList.remove('pressed');
  } else if (releaseOnPointer) {
    mechState.suppressCapture = true;
    mechDisarm();
    captureViewfinderPhoto({ description }).finally(() => {
      setTimeout(() => { mechState.suppressCapture = false; }, 200);
    });
    mechPlayShutter();
  } else {
    mechDisarm();
  }
}

function mechOnPointerCancel(e) {
  if (e && e.pointerId !== mechState.pointerId) return;
  clearTimeout(mechState.holdTimer);
  mechState.isDown = false;
  mechState.pointerId = null;
  stopPhotoSpeech();
  mechDisarm();
}

function mechPlayUnlock() {
  try {
    const ctx = tickAudio || (tickAudio = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') ctx.resume();
    [[120, 0, 'sawtooth', .045, .07], [210, 42, 'square', .025, .035]].forEach(([freq, delay, type, dur, gain]) => {
      setTimeout(() => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        g.gain.setValueAtTime(.0001, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain, ctx.currentTime + .004);
        g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + dur + .02);
      }, delay);
    });
    if ('vibrate' in navigator) navigator.vibrate(18);
  } catch (e) {}
}

function mechPlayGearClick() {
  try {
    const ctx = tickAudio || (tickAudio = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const pitch = 480 + mechState.zoom * 80;
    [
      [pitch, 0, .022, 'square'],
      [pitch * 1.85, .006, .012, 'triangle'],
    ].forEach(([freq, delay, gainValue, type]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const at = now + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.58, at + 0.012);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(gainValue, at + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
      osc.connect(g).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.024);
    });
  } catch (e) {}
}

function mechPlayTick() {
  try {
    const ctx = tickAudio || (tickAudio = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'square'; osc.frequency.value = 280;
    g.gain.setValueAtTime(.0001, now);
    g.gain.linearRampToValueAtTime(.02, now + .004);
    g.gain.exponentialRampToValueAtTime(.0001, now + .018);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + .04);
    if ('vibrate' in navigator) navigator.vibrate(4);
  } catch (e) {}
}

function mechPlayShutter() {
  try {
    const ctx = tickAudio || (tickAudio = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') ctx.resume();
    [[95, 0, 'square', .035, .075], [430, 35, 'triangle', .038, .055], [150, 76, 'sawtooth', .03, .04]].forEach(([freq, delay, type, dur, gain]) => {
      setTimeout(() => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        g.gain.setValueAtTime(.0001, ctx.currentTime);
        g.gain.linearRampToValueAtTime(gain, ctx.currentTime + .004);
        g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + dur + .02);
      }, delay);
    });
    if ('vibrate' in navigator) navigator.vibrate([16, 22, 16]);
  } catch (e) {}
}

function initMechShutter() {
  if (mechState.initialized) return;
  const btn = $('#cameraBtn');
  if (!btn) return;
  mechState.initialized = true;

  btn.addEventListener('pointerdown', mechOnPointerDown);
  btn.addEventListener('click', (e) => { e.stopImmediatePropagation(); e.preventDefault(); });

  window.addEventListener('pointermove', (e) => {
    if (!mechState.isDown || !mechState.isArmed) return;
    if (e.pointerId !== mechState.pointerId) return;
    mechState.isDragging = true;
    $('#mechShutter')?.classList.add('dragging');
    mechState.angle = mechAngleFromClient(e.clientX, e.clientY);
    mechUpdate();
    syncMechPointerReady(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', mechOnPointerUp);
  window.addEventListener('pointercancel', mechOnPointerCancel);

  mechUpdate();
}

function openAlbumSheet() {
  const items = state.photos.map((photo, index) => {
    const remain = PHOTO_TTL_MS - (Date.now() - Number(photo.createdAt || Date.now()));
    return `<button class="album-item ${index === state.selectedPhotoIndex ? 'active' : ''}" data-photo-index="${index}">
      <img src="${photo.path}" alt="photo ${index + 1}">
      <div class="album-meta"><span>No.${index + 1}</span><span>${remain > 0 ? formatTime(Math.ceil(remain / 1000)) : 'EXPIRED'}</span></div>
    </button>`;
  }).join('');
  openSheet(`<div class="sheet-head"><div class="sheet-title">FILM ALBUM ${state.photos.length}/5</div><button data-close>CLOSE</button></div>
    <div class="album-grid">${items || '<div>NO PHOTO</div>'}</div>
    <div class="sheet-button-row"><button class="small-action" data-camera>PHOTO</button><button class="small-action active" data-close>DONE</button></div>`);
}

function openFilmPreview(index) {
  const photo = state.photos[index];
  if (!photo) return;
  const remain = PHOTO_TTL_MS - (Date.now() - Number(photo.createdAt || Date.now()));
  const status = remain > 0 ? formatTime(Math.ceil(remain / 1000)) : 'EXPIRED';
  const hero = heroMeta(photo.hero || state.hero);
  openSheet(`<div class="sheet-head"><div class="sheet-title">FILM ${String(index + 1).padStart(2, '0')}</div><button data-close>CLOSE</button></div>
    <div class="film-preview">
      <img src="${photo.path}" alt="film preview">
      <div class="film-preview-grid">
        <div><span>STATUS</span><b>${escapeHTML(status)}</b></div>
        <div><span>CAMERA</span><b>${escapeHTML(photo.cameraLabel || 'LIVE')}</b></div>
        <div><span>ROLE</span><b>${escapeHTML(hero.label)}</b></div>
        <div><span>TIME</span><b>${escapeHTML(new Date(photo.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</b></div>
        <div class="wide"><span>GPS</span><b>${photo.locationReady ? `${Number(photo.lat).toFixed(5)}, ${Number(photo.lng).toFixed(5)}${photo.accuracy ? ` · ±${Math.round(photo.accuracy)}m` : ''}` : 'NO GPS'}</b></div>
        <div class="wide"><span>DESC</span><b>${escapeHTML(photo.description || 'EMPTY')}</b></div>
      </div>
      <div class="sheet-button-row"><button class="small-action danger" data-delete-photo="${escapeHTML(photo.photoId)}">DELETE</button><button class="small-action active" data-close>DONE</button></div>
    </div>`, 'film-preview-sheet');
}

function openCombatSheet() {
  const events = eventRows().map((event, index) => (
    `<div class="report-row report-event"><i>${String(index + 1).padStart(2, '0')}</i><span>${escapeHTML(formatEventText(event))}</span><b>LIVE</b></div>`
  )).join('');
  const rows = leaderboardRows(8).map((item, index) => (
    `<div class="report-row report-score"><i>${String(index + 1).padStart(2, '0')}</i><span>${escapeHTML(item.playerId || 'PLAYER')}</span><b>${escapeHTML(statLine(item))}</b></div>`
  )).join('');
  openSheet(`<div class="sheet-head"><div class="sheet-title">REPORT</div><button data-close>CLOSE</button></div>
    <div class="report-sheet">
      <section class="report-panel">
        <div class="report-section-title"><span>BROADCAST</span><b>EVENT LOG</b></div>
        <div class="report-list">${events || '<div class="report-row report-event"><i>--</i><span>No events yet</span><b>WAIT</b></div>'}</div>
      </section>
      <section class="report-panel">
        <div class="report-section-title"><span>LEADERBOARD</span><b>K/C/H/D</b></div>
        <div class="report-list">${rows || '<div class="report-row report-score"><i>--</i><span>No data yet</span><b>WAIT</b></div>'}</div>
      </section>
    </div>`);
}

function openHelpSheet() {
  openSheet(`
<div class="sheet-head">
  <div class="sheet-title">PARK U GO</div>
  <button data-close>CLOSE</button>
</div>
<div class="help-sheet">

  <div class="help-intro">
    <p>A live field-battle game at Peking University's Weiming Lake. Teams move around the real map, take photos with the camera as ammo, and win by capturing points and knocking down opponents.</p>
  </div>

  <div class="help-section-title">▶ Basic Flow</div>
  <div class="help-steps">
    <div class="help-step"><span class="help-step-num">01</span><div><strong>Join a Room</strong><p>Enter a Room ID and player ID to join a match.</p></div></div>
    <div class="help-step"><span class="help-step-num">02</span><div><strong>Pick Team & Role</strong><p>Choose one of 5 teams, then pick a role to set your camera traits. Lock in and wait for everyone to be ready.</p></div></div>
    <div class="help-step"><span class="help-step-num">03</span><div><strong>Head Out, Shoot</strong><p>Go to the Weiming Lake area and press the shutter to take photos, up to 5 rounds of ammo.</p></div></div>
    <div class="help-step"><span class="help-step-num">04</span><div><strong>Capture Points / Attack Opponents</strong><p>Switch to TOWER mode to capture the 15 points on the map; switch to KILL mode to attack enemy players with photos.</p></div></div>
    <div class="help-step"><span class="help-step-num">05</span><div><strong>Results</strong><p>When time is up, team scores are tallied from captured area and kills — the highest score wins.</p></div></div>
  </div>

  <div class="help-section-title">⌖ Roles · Camera Traits</div>
  <div class="help-roles">
    <div class="help-role"><strong>HUNTER</strong><span>Instant shot, standard viewfinder. All-rounder, great for beginners.</span></div>
    <div class="help-role"><strong>SNIPER</strong><span>3s lock, circular scope. Needs a long charge.</span></div>
    <div class="help-role"><strong>${heroMeta('wizard').label}</strong><span>Martyr: self-immolate 1 HP to deal 1 damage to every enemy within 30m.</span></div>
    <div class="help-role"><strong>${heroMeta('king').label}</strong><span>${isCheckmateMode() ? 'King: places points dynamically to command the field.' : 'Scout: passively reveals all enemies within 30m, with a vision circle on the map.'}</span></div>
    <div class="help-role"><strong>PRIEST</strong><span>3s charge to shoot healing ammo that restores ally HP.</span></div>
  </div>

  <div class="help-section-title">⌖ KILL Mode · Attacking</div>
  <div class="help-combat">
    <div class="help-combat-row"><strong>① Pick Target</strong><span>Scroll the left wheel of the bottom dial to pick the enemy team, the right wheel to pick the specific target player.</span></div>
    <div class="help-combat-row"><strong>② Load</strong><span>Make sure the left film slot has a photo (ammo); a highlighted slot means it's loaded.</span></div>
    <div class="help-combat-row"><strong>③ Fire</strong><span>Drag the FIRE slider on the dial to the right, through team→target→fire stages to the end, consuming 1 photo to launch the attack.</span></div>
    <div class="help-combat-row"><strong>Heal</strong><span>The PRIEST can switch the target to an ally and drag the slider to heal, restoring 1 HP.</span></div>
  </div>

  <div class="help-section-title">⚑ TOWER Mode · Capturing</div>
  <div class="help-points">
    <div class="help-point-row"><span class="help-badge buff">① Shoot</span><span>Take 3 photos from different angles and spots around the point, building them up in your film slots.</span></div>
    <div class="help-point-row"><span class="help-badge buff">② Connect</span><span>Switch to TOWER mode, tap the 3 slots on the console, and load 3 photos in order to form a triangle around it.</span></div>
    <div class="help-point-row"><span class="help-badge buff">③ Capture</span><span>Once the slots are filled, drag the slider down to capture.</span></div>
    <div class="help-point-row"><span class="help-badge major">★ Major Point</span><span>5 total, 10 points each. Needs 2 teammates to each submit once. After the 1st submits it shows "50% progress" until a teammate arrives to finish.</span></div>
    <div class="help-point-row"><span class="help-badge minor">Minor Point</span><span>10 total, 5 points each. 1 submission captures it.</span></div>
    <div class="help-point-row"><span class="help-badge buff">BUFF</span><span>Capturing grants a random buff. Major points: Disarm / Eclipse / Veil; minor points: Ghost / Malice / Blessing.</span></div>
  </div>

  <div class="help-section-title">✕ Down & Revive</div>
  <div class="help-combat">
    <div class="help-combat-row"><strong>Down</strong><span>When attacks drop your HP to zero you go down and cannot act.</span></div>
    <div class="help-combat-row"><strong>Revive</strong><span>Get within 20m of the Stone Archway (revive point) to revive automatically; or dance in place for 15s to revive yourself.</span></div>
  </div>

  <div class="help-section-title">◈ Teams</div>
  <div class="help-topics">
    <span class="help-topic" style="color:#00DCFF">CYAN</span>
    <span class="help-topic" style="color:#C060FF">PURPLE</span>
    <span class="help-topic" style="color:#E83A28">RED</span>
    <span class="help-topic" style="color:#50C83C">GREEN</span>
    <span class="help-topic" style="color:#90AAC0">GRAY</span>
  </div>
  <p class="help-tip">Players on the same team share point-capture progress; capturing a major point together needs two players from the same team.</p>

  <div class="help-section-title">✉ Contact</div>
  <p class="help-tip">Questions or feedback? Email <a href="mailto:771997200@qq.com" style="color:inherit;text-decoration:underline">771997200@qq.com</a></p>

</div>`, 'help-sheet-wrap');
}

async function saveScreenshot(selector, baseName) {
  const el = document.querySelector(selector);
  if (!el) { setMapStatus('Target not found'); return; }
  if (typeof window.html2canvas !== 'function') {
    setMapStatus('Screenshot library not loaded, please try again');
    return;
  }
  setMapStatus('Capturing screenshot…');
  try {
    const canvas = await window.html2canvas(el, {
      backgroundColor: '#eceae3',
      useCORS: true,
      scale: 2,
      logging: false,
    });
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) { setMapStatus('Screenshot failed'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setMapStatus('✓ Downloaded');
  } catch (e) {
    setMapStatus(`✗ Screenshot failed: ${e.message || 'unknown'}`);
  }
}

function syncTowerStateFromRoom() {
  // 从 state.room.towerPoints 同步塔归属到 TOWER_POINTS 数组（本地镜像）
  const remote = state.room && state.room.towerPoints;
  if (!remote) return;
  TOWER_POINTS.forEach((pt) => {
    const r = remote[pt.code];
    if (!r) return;
    pt.ownerTopic = r.ownerTopic || null;
    pt.captureTriangle = r.captureTriangle || null;
  });
}

function syncTowerBuffsFromRoom() {
  // 从 state.room.towerBuffs 镜像到 state.towerBuffs（服务器是真理之源）
  const remote = state.room && state.room.towerBuffs;
  if (!remote) return;
  state.towerBuffs = { ...remote };
}

async function captureTowerViaApi(point) {
  // 收集 3 张照片的 lat/lng（前端已校验过 facing / GPS）
  const photos = (state.towerPhotoIndexes || [])
    .map((idx) => state.photos[idx])
    .filter((p) => p && p.locationReady);
  const photoCoords = photos.map((p) => [p.lat, p.lng]);
  try {
    const res = await request('/tower/capture', {
      method: 'POST',
      data: {
        roomId: state.roomId,
        playerId: state.playerId,
        towerCode: point.code,
        photoCoords,
      },
    });
    if (res && res.room) {
      state.room = res.room;
      syncTowerStateFromRoom();
    }
    return res || { ok: false, reason: 'No response' };
  } catch (err) {
    return { ok: false, reason: err && (err.message || err.error) || 'Request failed' };
  }
}

// Unified TOWER-mode target: a Weiming fixed POI, or (checkmate) the selected enemy point.
function currentTowerTarget() {
  return state.mode === 'checkmate' ? selectedDynamicTower() : selectedTowerPoi();
}

// Checkmate: destroy an enemy dynamic point with 3 photos (same triangle rule as Weiming capture).
async function destroyTowerViaApi(tower) {
  const photos = (state.towerPhotoIndexes || [])
    .map((idx) => state.photos[idx])
    .filter((p) => p && p.locationReady);
  const photoCoords = photos.map((p) => [p.lat, p.lng]);
  try {
    const res = await request('/checkmate/destroy', {
      method: 'POST',
      data: { roomId: state.roomId, playerId: state.playerId, towerId: tower.towerId, photoCoords },
    });
    if (res && res.room) state.room = res.room;
    return res || { ok: false, reason: 'No response' };
  } catch (err) {
    return { ok: false, reason: (err && (err.message || err.error)) || 'Request failed' };
  }
}

async function attemptCheckmateDestroy() {
  const target = selectedDynamicTower();
  if (!isEnemyTower(target)) {
    state.towerCapturePct = 0;
    state.towerCaptured = false;
    playSfx('back');
    setMapStatus('✗ Target an enemy point first');
    return;
  }
  const result = checkTowerCapture(target);
  const consumedPhotos = (state.towerPhotoIndexes || []).map((idx) => state.photos[idx]).filter(Boolean);
  if (!result.captured) {
    // Triangle does not enclose the point — same fail handling as Weiming.
    if (result.consume) {
      consumedPhotos.forEach((p) => {
        state.usedPhotos = (state.usedPhotos || []).concat({ ...p, useType: 'tower', useTarget: 'destroy failed' });
        removeLocalPhoto(p.photoId);
      });
      state.towerPhotoIndexes = [];
    }
    state.towerCapturePct = 0;
    state.towerCaptured = false;
    playSfx('error');
    const consumeLine = (result.consume && consumedPhotos.length)
      ? `<small style="display:block;margin-top:6px;opacity:.72;font-weight:700">${consumedPhotos.length} photos used</small>`
      : '';
    openSheet(`<div class="sheet-head"><div class="sheet-title">DESTROY FAILED</div><button data-close>CLOSE</button></div>
      <div class="capture-result-sheet"><span class="capture-fail">${result.reason}</span>${consumeLine}</div>`, 'capture-result');
    return;
  }
  // Triangle ok → let the server be the source of truth.
  const apiRes = await destroyTowerViaApi(target);
  consumedPhotos.forEach((p) => {
    state.usedPhotos = (state.usedPhotos || []).concat({
      ...p, useType: 'tower',
      useTarget: (apiRes && apiRes.ok && apiRes.destroyed) ? 'destroyed enemy point' : 'destroy failed',
    });
    removeLocalPhoto(p.photoId);
  });
  state.towerPhotoIndexes = [];
  state.towerCapturePct = 0;
  state.towerCaptured = false;
  if (apiRes && apiRes.ok && apiRes.destroyed) {
    state.selectedDynamicTowerId = null; // target is gone
    playSfx('confirm', 1.2);
    logBattleEvent('capture', '✕', `Destroyed ${target.type === 'major' ? 'major' : 'minor'} point`);
    openSheet(`<div class="sheet-head"><div class="sheet-title">POINT DESTROYED</div><button data-close>CLOSE</button></div>
      <div class="capture-result-sheet"><span class="capture-ok">✕ Enemy ${target.type === 'major' ? 'major' : 'minor'} point destroyed</span></div>`, 'capture-result');
  } else {
    playSfx('error');
    openSheet(`<div class="sheet-head"><div class="sheet-title">DESTROY FAILED</div><button data-close>CLOSE</button></div>
      <div class="capture-result-sheet"><span class="capture-fail">${(apiRes && apiRes.reason) || 'Rejected by server'}</span></div>`, 'capture-result');
  }
}

function assignTowerBuff(point) {
  const pool = TOWER_BUFFS[point.type] || TOWER_BUFFS.minor;
  const buff = pool[Math.floor(Math.random() * pool.length)];
  state.towerBuffs = state.towerBuffs || {};
  state.towerBuffs[point.code] = {
    buffId: buff.id,
    assignedAt: Date.now(),
    duration: buff.duration,
    instant: !!buff.instant,
    consumed: false,
  };
  if (buff.instant) applyInstantBuff(point, buff);
}

function findBuffMeta(buffId) {
  for (const tier of ['major', 'minor']) {
    const found = TOWER_BUFFS[tier].find((b) => b.id === buffId);
    if (found) return found;
  }
  return null;
}

function buffEntryActive(entry) {
  if (!entry) return false;
  if (entry.consumed) return false;
  if (entry.instant) return false;
  if (entry.duration === 0) return true;
  return (Date.now() - entry.assignedAt) / 1000 < entry.duration;
}

function isTeamBuffActive(topic, buffId) {
  if (!topic) return false;
  return TOWER_POINTS.some((pt) => {
    if (pt.ownerTopic !== topic) return false;
    const entry = (state.towerBuffs || {})[pt.code];
    return entry && entry.buffId === buffId && buffEntryActive(entry);
  });
}

function isAnyEnemyTeamHolding(myTopic, buffId) {
  if (!myTopic) return false;
  const topics = new Set();
  TOWER_POINTS.forEach((pt) => {
    if (pt.ownerTopic && pt.ownerTopic !== myTopic) topics.add(pt.ownerTopic);
  });
  for (const topic of topics) {
    if (isTeamBuffActive(topic, buffId)) return true;
  }
  return false;
}

function isAnyEnemyTeamDisarming(myTopic) {
  return isAnyEnemyTeamHolding(myTopic, 'disarm');
}

function consumeTeamBuff(topic, buffId) {
  if (!topic) return false;
  for (const pt of TOWER_POINTS) {
    if (pt.ownerTopic !== topic) continue;
    const entry = (state.towerBuffs || {})[pt.code];
    if (entry && entry.buffId === buffId && buffEntryActive(entry)) {
      entry.consumed = true;
      return true;
    }
  }
  return false;
}

function applyInstantBuff(point, buff) {
  if (buff.id === 'bless') {
    const me = currentPlayer();
    if (me) {
      const before = Number(me.health == null ? 2 : me.health);
      if (before < 2) {
        me.health = Math.min(2, before + 1);
        if (me.status === 'dead' && me.health > 0) me.status = 'alive';
        logBattleEvent('heal', '✚', `Blessing +1 HP`);
      }
    }
    state.towerBuffs[point.code].consumed = true;
  }
}

function openMyTowerSheet() {
  const myTopic = ownTopic();
  const myPoints = TOWER_POINTS.filter((p) => p.ownerTopic === myTopic);
  const now = Date.now();
  const activeItems = [];
  const expiredItems = [];
  myPoints.forEach((point) => {
    const pool = TOWER_BUFFS[point.type] || TOWER_BUFFS.minor;
    const entry = (state.towerBuffs || {})[point.code];
    const buff = entry ? pool.find((b) => b.id === entry.buffId) : null;
    let isExpired = false;
    let timeLabel = '';
    if (buff && entry) {
      if (entry.instant || buff.instant) {
        isExpired = true;
        timeLabel = 'APPLIED';
      } else if (entry.consumed) {
        isExpired = true;
        timeLabel = 'USED';
      } else if (buff.duration > 0) {
        const remaining = Math.max(0, buff.duration - (now - entry.assignedAt) / 1000);
        isExpired = remaining <= 0;
        timeLabel = isExpired ? 'EXPIRED' : `${Math.ceil(remaining)}s`;
      } else {
        timeLabel = '∞';
      }
    }
    const item = { point, buff, isExpired, timeLabel };
    if (isExpired) expiredItems.push(item); else activeItems.push(item);
  });
  const renderItem = ({ point, buff, isExpired, timeLabel }) => {
    const color = topicMeta(myTopic).color;
    const starBadge = point.type === 'major' ? '<i class="my-tower-star">★</i>' : '';
    const buffBtn = buff
      ? `<button class="mt-buff-btn${isExpired ? ' expired' : ''}" type="button"
           data-buff-detail="${escapeHTML(buff.name)}|${escapeHTML(buff.desc)}|${escapeHTML(timeLabel)}">
           <span class="mt-buff-icon">${escapeHTML(buff.icon)}</span>
           <span class="mt-buff-timer">${escapeHTML(timeLabel)}</span>
         </button>`
      : `<div class="mt-buff-btn empty">—</div>`;
    return `<div class="my-tower-row${isExpired ? ' expired' : ''}">
      <div class="mt-pt-id" style="--point-color:${escapeHTML(color)}">${String(point.id).padStart(2, '0')}${starBadge}</div>
      <div class="mt-pt-info"><b>${escapeHTML(point.zhName || point.name)}</b><em>${point.type === 'major' ? 'MAJOR' : 'MINOR'}</em></div>
      ${buffBtn}
    </div>`;
  };
  const rows = [...activeItems, ...expiredItems].map(renderItem).join('')
    || '<div class="ally-empty">No captured points yet</div>';
  openSheet(`<div class="sheet-head"><div class="sheet-title">MY TOWER</div><button data-close>CLOSE</button></div>
    <div class="ally-sheet">
      <section class="report-panel ally-panel">
        <div class="report-section-title">
          <span>OCCUPIED</span>
          <b>${myPoints.length} / ${TOWER_POINTS.length}</b>
        </div>
        <div class="ally-list">${rows}</div>
      </section>
    </div>`, 'my-tower-sheet ally-status-sheet');
}

function openAllySheet() {
  const allies = allyPlayers();
  const meTopic = ownTopic();
  const team = topicMeta(meTopic);
  const rows = allies.map((ally) => {
    const hero = heroMeta(ally.hero || 'hunter');
    const topic = topicMeta(ally.topic || meTopic);
    const health = Math.max(0, Math.min(2, Number(ally.health == null ? 2 : ally.health)));
    const down = ally.status === 'dead' || health <= 0;
    return `<div class="ally-row${down ? ' down' : ''}">
      <i class="ally-dot" style="background:${escapeHTML(topic.color)}">${escapeHTML(hero.icon || '?')}</i>
      <span><b>${escapeHTML(ally.playerId || 'Ally')}</b><em>${escapeHTML(hero.label)} / ${escapeHTML(topic.label)}</em></span>
      ${hpSignalHTML(health)}
    </div>`;
  }).join('');
  openSheet(`<div class="sheet-head"><div class="sheet-title">ALLY STATUS</div><button data-close>CLOSE</button></div>
    <div class="ally-sheet">
      <section class="report-panel ally-panel">
        <div class="report-section-title"><span>MY TEAM</span><b style="background:${escapeHTML(team.color)};color:#111">${escapeHTML(team.label)}</b></div>
        <div class="ally-rule">Players on your team are allies and share point-capture progress.</div>
        <div class="ally-list">${rows || '<div class="ally-empty">No allies online yet</div>'}</div>
      </section>
    </div>`, 'ally-status-sheet');
}

function openSheet(html, className = '') {
  $('#sheet').innerHTML = html;
  $('#sheet').className = `sheet ${className}`.trim();
  $('#sheet').classList.remove('hidden');
}

function closeSheet() {
  $('#sheet').classList.add('hidden');
  $('#sheet').className = 'sheet hidden';
}

// 点击弹窗/面板以外区域时自动隐藏：底部弹窗（我的据点/队友/通报/相册）、取景器上方下拉地图、据点 info 卡片。
// （全览地图自带背景遮罩，点击遮罩已可关闭，无需在此处理。）
function maybeCloseOverlaysOnOutsideClick(target) {
  if (!$('#sheet').classList.contains('hidden') && !target.closest('#sheet')) {
    closeSheet();
  }
  const mapToggle = $('#mapToggle');
  // target !== mapToggle：点 MAP 标签会向 checkbox 派发一次合成 click（target 即 checkbox），
  // 不能把这次当成「外侧点击」否则地图刚打开就被立刻关掉。
  if (mapToggle && mapToggle.checked && target !== mapToggle
      && !target.closest('.drop-map') && !target.closest('.map-pull')) {
    mapToggle.checked = false;
  }
  if (state.towerInfoOpen && !target.closest('.tower-info-card')) {
    toggleTowerInfo(false);
  }
  const toast = $('#hitToast');
  if (toast && !toast.classList.contains('hidden') && !target.closest('#hitToast')) {
    toast.classList.add('hidden');
    clearTimeout(hitToastTimer);
  }
}

function startPolling() {
  if (state.poll) clearInterval(state.poll);
  state.poll = setInterval(async () => {
    try {
      if (!state.roomId || !state.playerId) return;
      await fetchRoom();
      if ($('[data-screen="battle"]').classList.contains('active')) {
        await fetchLandmarks();
        renderBattle();
        // Keep the points overview live (new/destroyed points) while it is open.
        if (!$('#towerReportOverlay')?.classList.contains('hidden')) renderTowerReport();
        // Phase 5.3：检测对局结束自动弹结算
        if (state.room && state.room.state === 'finished' && $('#resultPanel')?.classList.contains('hidden')) {
          renderResultScreen();
        }
      } else {
        renderHeroScreen();
      }
    } catch (e) {}
  }, 3500);
}

async function handleButtonAction(target) {
  if (target.dataset.kingTab) {
    placementState.tab = target.dataset.kingTab;
    renderBattle();
    return;
  }
  if (target.dataset.kingPlace) {
    await startCheckmatePlacement(target.dataset.kingPlace);
    return;
  }
  if (target.dataset.action === 'dbg-die') { debugInstantDie(); return; }
  if (target.dataset.action === 'dbg-end') { debugEndGame(); return; }
  if (target.dataset.action === 'dbg-refresh') { await debugFullRefresh(); return; }
  if (target.dataset.action === 'result-home') { closeResultPanels(); showScreen('home'); return; }
  if (target.dataset.action === 'result-history') { renderHistoryPanel(); $('#resultPanel')?.classList.add('hidden'); $('#historyPanel')?.classList.remove('hidden'); return; }
  if (target.dataset.action === 'result-back') { $('#historyPanel')?.classList.add('hidden'); $('#resultPanel')?.classList.remove('hidden'); return; }
  if (target.dataset.action === 'result-history-save') { await saveScreenshot('#historyPanel', 'parkugo-history'); return; }
  if (target.dataset.action === 'result-save') { await saveScreenshot('#resultPanel', 'parkugo-result'); return; }
  if (deathState.dancing) return;
  const lockKey = target.id || Object.keys(target.dataset).sort().map((key) => `${key}:${target.dataset[key]}`).join('|') || target.textContent;
  if (actionLocks.has(lockKey)) return;
  actionLocks.add(lockKey);
  try {
    if (target.dataset.deathAction === 'dance') startDanceRevive();
    if (target.dataset.deathAction === 'stone') await chooseStoneRevive();
    if (target.dataset.action === 'back') goBack();
    if (target.dataset.action === 'help') openHelpSheet();
    if (target.dataset.action === 'music-toggle') { toggleBgMusic(); return; }
    if (target.dataset.action === 'refresh') {
      await fetchRoom();
      await fetchLandmarks();
      renderBattle();
    }
    if (target.dataset.hero) {
      state.hero = target.dataset.hero;
      saveSession();
      renderHeroScreen();
    }
    if (target.dataset.topic) {
      state.topic = target.dataset.topic;
      saveSession();
      renderHeroScreen();
    }
    if (target.id === 'lockBtn') await lockSelection();
    if (target.id === 'permissionContinueBtn') await continueFromPermissions();
    if (target.id === 'enterBattleBtn') await enterBattle();
    if (target.id === 'cameraBtn') await captureViewfinderPhoto();
    if (target.id === 'flipCameraBtn') await flipCamera();
    if (target.dataset.camera) await captureViewfinderPhoto();
    if (target.id === 'closeCameraBtn') closeCamera();
    if (target.id === 'captureBtn') captureFrame();
    if (target.id === 'savePhotoBtn') saveCapturedPhoto();
    if (target.id === 'locateBtn') await locate();
    if (target.id === 'combatBtn') await useCombat();
    if (target.id === 'towerReportBtn' && state.combatMode === 'tower') {
      openTowerReport();
      return;
    }
    if (target.id === 'towerInfoHandle') {
      if (towerInfoDrag.moved) {
        towerInfoDrag.moved = false;
        return;
      }
      toggleTowerInfo();
      return;
    }
    if (target.dataset.towerPoi != null) {
      previewTowerPoi(target.dataset.towerPoi);
      return;
    }
    if (target.dataset.towerConfirm != null) {
      confirmTowerPoi();
      return;
    }
    if (target.dataset.mode) {
      setCombatMode(target.dataset.mode);
    }
    if (target.dataset.towerPoint != null) {
      state.selectedTowerPoint = Math.max(0, Math.min(2, Number(target.dataset.towerPoint) || 0));
      renderTowerConsole();
    }
    if (target.dataset.panel === 'album' && !target.classList.contains('film')) openAlbumSheet();
    if (target.dataset.panel === 'combat') {
      if (state.combatMode === 'tower') openTowerReport();
      else openCombatSheet();
    }
    if (target.dataset.panel === 'allies' || target.id === 'allyStatus') {
      if (state.combatMode === 'tower') openMyTowerSheet(); else openAllySheet();
    }
    if (target.dataset.target) {
      state.selectedTargetId = target.dataset.target;
      renderBattle();
      if (!$('#sheet').classList.contains('hidden')) openCombatSheet();
    }
    if (target.dataset.photoIndex != null) {
      state.selectedPhotoIndex = Number(target.dataset.photoIndex);
      state.selectedFilmIndex = state.selectedPhotoIndex;
      saveAlbum();
      renderBattle();
    }
    if (target.dataset.deletePhoto) {
      removeLocalPhoto(target.dataset.deletePhoto);
      closeSheet();
      renderBattle();
    }
    if (target.dataset.slot) {
      state.selectedSlot = Number(target.dataset.slot);
      openCombatSheet();
    }
    if (target.dataset.combatUse != null) await useCombat();
    if (target.dataset.buffDetail) {
      const [name, desc, time] = target.dataset.buffDetail.split('|');
      openSheet(`<div class="sheet-head"><div class="sheet-title">${escapeHTML(name)}</div><button data-close>CLOSE</button></div>
        <div class="capture-result-sheet" style="text-align:left;gap:8px;padding:12px">
          <p style="font-size:12px;font-weight:700;line-height:1.5;color:#111">${escapeHTML(desc)}</p>
          <p style="font-size:10px;font-weight:900;letter-spacing:.06em;color:rgba(17,17,17,.45)">Time left: ${escapeHTML(time)}</p>
        </div>`, 'capture-result');
      return;
    }
    if (target.dataset.close != null) closeSheet();
  } catch (e) {
    playSfx('error');
    alert(e.name === 'AbortError' ? 'Request timed out' : e.message);
  } finally {
    actionLocks.delete(lockKey);
  }
}

document.addEventListener('click', async (event) => {
  if (event.target.closest('#tutorialNextBtn')) {
    playSfx('tap');
    nextTutorialStep();
    return;
  }
  if (event.target.closest('#tutorialSkipBtn')) {
    playSfx('back');
    endTutorial(true);
    return;
  }
  if (tutorialState && event.target.closest('#tutorialOverlay')) return;
  if (deathState.dancing) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (event.target.closest('[data-tower-report-close]')) {
    playSfx('back');
    closeTowerReport();
    return;
  }
  // 点击弹窗/地图以外区域 → 自动隐藏（再继续后续按钮逻辑，便于直接切换到另一个面板）
  maybeCloseOverlaysOnOutsideClick(event.target);
  const deleteFilm = revealedFilmDeleteAtPoint(event);
  if (deleteFilm) {
    const photo = state.photos[Number(deleteFilm.dataset.filmIndex)];
    if (photo) {
      playSfx('back');
      removeLocalPhoto(photo.photoId);
      renderBattle();
    }
    return;
  }
  const target = event.target.closest('button, .dial-option[data-target]');
  if (!target) return;
  if (target.id === 'combatBtn' && dialDrag.suppressClick) return;
  if (target.closest?.('.dial-col') && wheelDrag.suppressClick) return;
  if (target.classList.contains('film')) {
    if (filmGesture.suppressClick) {
      filmGesture.suppressClick = false;
      return;
    }
    const index = Number(target.dataset.filmIndex);
    const rect = target.getBoundingClientRect();
    if (target.classList.contains('reveal-delete') && event.clientX > rect.right) {
      const photo = state.photos[index];
      if (photo) {
        playSfx('back');
        removeLocalPhoto(photo.photoId);
        renderBattle();
      }
      target.classList.remove('reveal-delete');
      return;
    }
    playSfx('select');
    if (state.combatMode === 'tower') {
      if (!toggleTowerPhotoSelection(index)) playSfx('error');
      return;
    }
    selectFilmSlot(index);
    return;
  }
  if (target.dataset.mode && modeSwitchDrag.suppressClick) {
    modeSwitchDrag.suppressClick = false;
    return;
  }
  playSfx(buttonSfxKind(target));
  await handleButtonAction(target);
});

document.addEventListener('dblclick', (event) => {
  event.preventDefault();
}, { passive: false });

function startDialDrag(event, hit) {
  dialDrag.active = true;
  dialDrag.startX = event.clientX;
  dialDrag.maxPhase = 0;
  hit?.setPointerCapture?.(event.pointerId);
  resetDialFireProgress();
  event.preventDefault?.();
}

function moveDialDrag(event) {
  if (!dialDrag.active) return;
  const scope = $('#scopeDial');
  if (!scope) return;
  const rect = scope.getBoundingClientRect();
  const dx = event.clientX - dialDrag.startX;
  let pct = Math.round((dx / rect.width) * 132);
  // 冷却中：滑块最多拉到中间（50%）就停住，无法到达击发阈值
  if (attackCdRemaining() > 0) pct = Math.min(pct, 50);
  setDialFireProgress(pct);
  event.preventDefault?.();
}

document.addEventListener('pointerdown', (event) => {
  if (deathState.dancing) {
    event.preventDefault();
    return;
  }
  const infoHandle = event.target.closest?.('#towerInfoHandle');
  if (infoHandle) {
    towerInfoDrag.active = true;
    towerInfoDrag.startY = event.clientY;
    towerInfoDrag.moved = false;
    infoHandle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    return;
  }
  const hit = event.target.closest?.('#combatBtn.dial-hit');
  if (!hit) return;
  startDialDrag(event, hit);
});

document.addEventListener('pointermove', (event) => {
  if (towerInfoDrag.active && Math.abs(event.clientY - towerInfoDrag.startY) > 8) {
    towerInfoDrag.moved = true;
    event.preventDefault();
    return;
  }
  moveDialDrag(event);
});

document.addEventListener('pointerup', async (event) => {
  if (deathState.dancing) return;
  if (towerInfoDrag.active) {
    const dy = event.clientY - towerInfoDrag.startY;
    if (towerInfoDrag.moved) toggleTowerInfo(dy < 0);
    towerInfoDrag.active = false;
    return;
  }
  await finishDialFire();
});

document.addEventListener('pointercancel', async () => {
  towerInfoDrag.active = false;
  towerInfoDrag.moved = false;
  await finishDialFire();
});

document.addEventListener('mousedown', (event) => {
  const hit = event.target.closest?.('#combatBtn.dial-hit');
  if (!hit || dialDrag.active) return;
  startDialDrag(event, hit);
});

document.addEventListener('mousemove', (event) => {
  moveDialDrag(event);
});

document.addEventListener('mouseup', async () => {
  await finishDialFire();
});

document.addEventListener('touchstart', (event) => {
  const hit = event.target.closest?.('#combatBtn.dial-hit');
  if (!hit || dialDrag.active) return;
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  startDialDrag({ clientX: touch.clientX, preventDefault: () => event.preventDefault() }, hit);
}, { passive: false });

document.addEventListener('touchmove', (event) => {
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  moveDialDrag({ clientX: touch.clientX, preventDefault: () => event.preventDefault() });
}, { passive: false });

document.addEventListener('touchend', async () => {
  await finishDialFire();
});

function startWheelDrag(event, col) {
  const type = col.dataset.wheel;
  const items = wheelItems(type);
  if (!type || items.length < 2) return;
  wheelDrag.active = true;
  wheelDrag.type = type;
  wheelDrag.startY = event.clientY;
  wheelDrag.startIndex = wheelCurrentIndex(type, items);
  wheelDrag.index = wheelDrag.startIndex;
  wheelDrag.moved = false;
  col.setPointerCapture?.(event.pointerId);
  col.classList.add('dragging');
  event.preventDefault?.();
}

function moveWheelDrag(event) {
  if (!wheelDrag.active) return;
  const items = wheelItems(wheelDrag.type);
  if (!items.length) return;
  const rawDelta = wheelDrag.startY - event.clientY;
  const step = 29;

  // continuous float index — follows pointer exactly, no snapping
  const floatIndex = Math.max(0, Math.min(items.length - 1, wheelDrag.startIndex + rawDelta / step));
  applyWheelOffsetFloat(wheelDrag.type, floatIndex);

  // discrete index only for state tracking
  const nextIndex = Math.max(0, Math.min(items.length - 1, wheelDrag.startIndex + Math.round(rawDelta / step)));
  if (nextIndex !== wheelDrag.index) {
    wheelDrag.index = nextIndex;
    wheelDrag.moved = true;
    playGearTick(0.8);
  }

  event.preventDefault?.();
}

function finishWheelDrag() {
  if (!wheelDrag.active) return;
  const type = wheelDrag.type;
  const items = wheelItems(type);
  const value = items[wheelDrag.index];
  wheelDrag.active = false;
  $$('.dial-col.dragging').forEach((col) => col.classList.remove('dragging'));
  if (value) {
    if (type === 'target' && value !== state.selectedTargetId) {
      state.selectedTargetId = value;
    } else if (type === 'topic' && value !== state.selectedTargetTopic) {
      state.selectedTargetTopic = value;
      // 切换阵营后，目标自动跳到该阵营第一个可选目标
      const first = dialTargets()[0];
      if (first) state.selectedTargetId = first.playerId;
    }
    renderBattle();
  }
  if (wheelDrag.moved) {
    wheelDrag.suppressClick = true;
    setTimeout(() => {
      wheelDrag.suppressClick = false;
    }, 180);
  }
}

document.addEventListener('pointerdown', (event) => {
  const col = event.target.closest?.('.dial-col[data-wheel]');
  if (!col) return;
  playSfx('select', 0.7);
  startWheelDrag(event, col);
});

document.addEventListener('pointermove', (event) => {
  moveWheelDrag(event);
});

document.addEventListener('pointerup', () => {
  finishWheelDrag();
});

document.addEventListener('pointercancel', () => {
  finishWheelDrag();
});

function clearFilmLongPress() {
  if (filmGesture.longTimer) clearTimeout(filmGesture.longTimer);
  filmGesture.longTimer = null;
}

function startFilmGesture(event, slot) {
  const index = Number(slot.dataset.filmIndex);
  if (!Number.isFinite(index)) return;
  filmGesture.active = true;
  filmGesture.index = index;
  filmGesture.startX = event.clientX;
  filmGesture.startY = event.clientY;
  filmGesture.moved = false;
  filmGesture.suppressClick = false;
  slot.setPointerCapture?.(event.pointerId);
  clearFilmLongPress();
  filmGesture.longTimer = setTimeout(() => {
    if (!filmGesture.active || filmGesture.moved) return;
    filmGesture.suppressClick = true;
    playSfx('panel');
    openFilmPreview(index);
  }, 560);
}

function moveFilmGesture(event) {
  if (!filmGesture.active) return;
  const slot = $(`#filmColumn .film[data-film-index="${filmGesture.index}"]`);
  if (!slot) return;
  if (!state.photos[filmGesture.index]) return;
  const dx = event.clientX - filmGesture.startX;
  const dy = event.clientY - filmGesture.startY;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    filmGesture.moved = true;
    clearFilmLongPress();
  }
  if (dx > 24 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    slot.classList.add('reveal-delete');
    filmGesture.suppressClick = true;
    event.preventDefault?.();
  }
  if (dx < -16) slot.classList.remove('reveal-delete');
}

function finishFilmGesture() {
  clearFilmLongPress();
  filmGesture.active = false;
}

function revealedFilmDeleteAtPoint(event) {
  return $$('#filmColumn .film.reveal-delete').find((slot) => {
    const rect = slot.getBoundingClientRect();
    const inX = event.clientX >= rect.right && event.clientX <= rect.right + 38;
    const inY = event.clientY >= rect.top + 8 && event.clientY <= rect.bottom - 8;
    return inX && inY;
  });
}

document.addEventListener('pointerdown', (event) => {
  const towerSlider = event.target.closest?.('#towerSlider');
  if (towerSlider) {
    towerSliderDrag.active = true;
    towerSliderDrag.startY = event.clientY;
    towerSliderDrag.startPct = Number(state.towerCapturePct || 0);
    towerSlider.setPointerCapture?.(event.pointerId);
    towerSlider.classList.add('dragging');
    event.preventDefault?.();
    return;
  }
  const modeSwitch = event.target.closest?.('.battle-mode-switch');
  if (modeSwitch) {
    modeSwitchDrag.active = true;
    modeSwitchDrag.startX = event.clientX;
    modeSwitchDrag.moved = false;
    modeSwitch.setPointerCapture?.(event.pointerId);
    modeSwitch.classList.add('dragging');
    return;
  }
  const slot = event.target.closest?.('#filmColumn .film');
  if (!slot) return;
  startFilmGesture(event, slot);
});

document.addEventListener('pointermove', (event) => {
  if (towerSliderDrag.active) {
    const slider = $('#towerSlider');
    const rect = slider?.getBoundingClientRect();
    if (rect && rect.height) {
      const dy = event.clientY - towerSliderDrag.startY;
      setTowerCapturePct(towerSliderDrag.startPct + (dy / rect.height) * 100);
    }
    event.preventDefault?.();
    return;
  }
  if (modeSwitchDrag.active) {
    if (Math.abs(event.clientX - modeSwitchDrag.startX) > 8) modeSwitchDrag.moved = true;
    event.preventDefault?.();
    return;
  }
  moveFilmGesture(event);
});

document.addEventListener('pointerup', async (event) => {
  if (towerSliderDrag.active) {
    towerSliderDrag.active = false;
    $('#towerSlider')?.classList.remove('dragging');
    if (Number(state.towerCapturePct || 0) >= 92) {
      if (state.mode === 'checkmate') {
        await attemptCheckmateDestroy();
        renderTowerConsole();
        return;
      }
      const point = selectedTowerPoi();
      if (point && !point.ownerTopic) {
        const result = checkTowerCapture(point);
        if (result.captured) {
          // 调后端 API 让服务器作为权威源
          const apiRes = await captureTowerViaApi(point);
          // 消耗照片（不管成功失败都消耗，符合前端原设计）
          const consumedPhotos = (state.towerPhotoIndexes || [])
            .map((idx) => state.photos[idx])
            .filter(Boolean);
          consumedPhotos.forEach((p) => {
            state.usedPhotos = (state.usedPhotos || []).concat({
              ...p,
              useType: 'tower',
              useTarget: (apiRes && apiRes.ok && apiRes.captured)
                ? (point.zhName || point.name)
                : `${point.zhName || point.name} (capture failed)`,
            });
            removeLocalPhoto(p.photoId);
          });
          state.towerPhotoIndexes = [];

          if (apiRes && apiRes.ok && apiRes.captured) {
            // 后端确认占领（pt.ownerTopic 和 buff 都已经在 captureTowerViaApi 内同步）
            const buffName = apiRes.buff?.name ? `[${apiRes.buff.icon} ${apiRes.buff.name}]` : '';
            logBattleEvent('capture', '⚑', `Captured ${point.zhName || point.name} (+${apiRes.scoreDelta || 0}) ${buffName}`);
            state.towerCapturePct = 100;
            state.towerCaptured = true;
            playSfx('confirm', 1.2);
            openSheet(`<div class="sheet-head"><div class="sheet-title">CAPTURE SUCCESS</div><button data-close>CLOSE</button></div>
              <div class="capture-result-sheet"><span class="capture-ok">♜ ${point.zhName || point.name} captured</span><small style="display:block;margin-top:6px;opacity:.7;font-weight:700">+${apiRes.scoreDelta || 0} score</small></div>`, 'capture-result');
            renderTowerReportPoints();
          } else {
            // 后端拒绝（罕见——前端 check 通过但后端不认，例如浮点边界）
            state.towerCapturePct = 0;
            state.towerCaptured = false;
            playSfx('error');
            openSheet(`<div class="sheet-head"><div class="sheet-title">CAPTURE FAILED</div><button data-close>CLOSE</button></div>
              <div class="capture-result-sheet"><span class="capture-fail">${(apiRes && apiRes.reason) || 'Rejected by server'}</span><small style="display:block;margin-top:6px;opacity:.55">${consumedPhotos.length} photos used</small></div>`, 'capture-result');
          }
        } else {
          let lostCount = 0;
          if (result.consume) {
            const failedPhotos = (state.towerPhotoIndexes || [])
              .map((idx) => state.photos[idx])
              .filter(Boolean);
            lostCount = failedPhotos.length;
            failedPhotos.forEach((p) => {
              state.usedPhotos = (state.usedPhotos || []).concat({
                ...p,
                useType: 'tower',
                useTarget: `${point.zhName || point.name} (capture failed)`,
              });
              removeLocalPhoto(p.photoId);
            });
            state.towerPhotoIndexes = [];
          }
          state.towerCapturePct = 0;
          state.towerCaptured = false;
          playSfx('error');
          const consumeLine = lostCount > 0
            ? `<small style="display:block;margin-top:6px;opacity:.72;font-weight:700">${lostCount} photos used</small>`
            : '';
          openSheet(`<div class="sheet-head"><div class="sheet-title">CAPTURE FAILED</div><button data-close>CLOSE</button></div>
            <div class="capture-result-sheet"><span class="capture-fail">${result.reason}</span>${consumeLine}</div>`, 'capture-result');
        }
      } else {
        state.towerCapturePct = 0;
        state.towerCaptured = false;
        playSfx('back');
      }
    } else {
      state.towerCapturePct = 0;
      state.towerCaptured = false;
      playSfx('back');
    }
    renderTowerConsole();
    return;
  }
  if (modeSwitchDrag.active) {
    const modeSwitch = $('#battleModeSwitch');
    modeSwitchDrag.active = false;
    modeSwitch?.classList.remove('dragging');
    if (modeSwitchDrag.moved && modeSwitch) {
      const rect = modeSwitch.getBoundingClientRect();
      const nextMode = event.clientX < rect.left + rect.width / 2 ? 'kill' : 'tower';
      playSfx('panel');
      setCombatMode(nextMode);
      modeSwitchDrag.suppressClick = true;
      setTimeout(() => { modeSwitchDrag.suppressClick = false; }, 180);
    }
    return;
  }
  finishFilmGesture();
});

document.addEventListener('pointercancel', () => {
  if (towerSliderDrag.active) {
    towerSliderDrag.active = false;
    $('#towerSlider')?.classList.remove('dragging');
    renderTowerConsole();
    return;
  }
  if (modeSwitchDrag.active) {
    modeSwitchDrag.active = false;
    $('#battleModeSwitch')?.classList.remove('dragging');
    return;
  }
  finishFilmGesture();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('input[type="checkbox"]:not(#mapToggle)')) playSfx('toggle');
});

$('#mapToggle')?.addEventListener('change', () => playSfx('panel'));

$('#joinForm').addEventListener('submit', joinRoom);
$('#heroForm').addEventListener('submit', (event) => event.preventDefault());
window.ParkUGoWeb = {
  lockSelection: () => handleButtonAction($('#lockBtn')),
  enterBattle: () => handleButtonAction($('#enterBattleBtn')),
  useCombat: () => handleButtonAction($('#combatBtn')),
  locate: () => handleButtonAction($('#locateBtn')),
  openCamera: () => handleButtonAction($('#cameraBtn')),
  closeCamera,
  captureFrame,
  saveCapturedPhoto,
};

function setupStageExplainer() {
  if (params.get('stage') !== 'explain') return;
  const demoRoom = 'room-test';
  const demoPlayer = 'player';
  const now = Date.now();

  function routeForScene(scene = {}) {
    const title = String(scene.title || '');
    if (title === 'FIELD PERMISSIONS') return { screen: 'permissions' };
    if (['CHOOSE YOUR ROLE', 'ROOM FORMATION', 'LOCK IN'].includes(title)) return { screen: 'hero' };
    if (['PKU GO', 'ENTER ROOM', 'GAME MEANING'].includes(title)) return { screen: 'home' };
    if (title === 'OVERVIEW') return { screen: 'battle', mode: 'tower', overlay: 'overview' };
    if (title === 'POINT MONITOR') return { screen: 'battle', mode: 'tower', overlay: 'info' };
    if (title === 'PLAYER DOWN') return { screen: 'battle', mode: 'kill', overlay: 'death' };
    if (title === 'BATTLE RESULT') return { screen: 'battle', mode: 'tower', overlay: 'result' };
    if (title === 'REVIEW HISTORY') return { screen: 'battle', mode: 'tower', overlay: 'history' };
    if (['TOWER MODE', 'TOWER SCORING'].includes(title)) return { screen: 'battle', mode: 'tower' };
    return { screen: 'battle', mode: 'kill' };
  }

  function seedStageState() {
    state.roomId = demoRoom;
    state.playerId = demoPlayer;
    state.topic = 'wuxia';
    state.hero = 'hunter';
    state.allowCamera = false;
    state.allowLocation = false;
    state.allowSpeech = false;
    state.cameraBlocked = true;
    state.location = { lat: 39.992679, lng: 116.305732, accuracy: 8, ready: true };
    state.room = {
      roomId: demoRoom,
      state: 'playing',
      noTimeLimit: true,
      remainingSec: null,
      players: [
        { playerId: demoPlayer, topic: 'wuxia', hero: 'hunter', health: 2, status: 'alive', lat: 39.992679, lng: 116.305732, selectionLocked: true },
        { playerId: 'ally_01', topic: 'wuxia', hero: 'priest', health: 1, status: 'alive', lat: 39.992448, lng: 116.303297, selectionLocked: true },
        { playerId: 'enemy_01', topic: 'digital', hero: 'sniper', health: 2, status: 'alive', lat: 39.993114, lng: 116.301888, selectionLocked: true },
      ],
      topicScores: { wuxia: 3, digital: 2 },
      events: [
        { eventId: 'stage-1', type: 'capture', actorPlayerId: demoPlayer, targetPlayerId: 'BoyaTower', text: 'player captured Boya Tower', ts: now - 80000 },
        { eventId: 'stage-2', type: 'kill', actorPlayerId: 'enemy_01', targetPlayerId: demoPlayer, text: 'enemy_01 knocked down player', ts: now - 25000 },
      ],
      playerStats: [
        { playerId: demoPlayer, topic: 'wuxia', kills: 1, deaths: 0, heals: 0, captures: 2, captureArea: 12 },
        { playerId: 'enemy_01', topic: 'digital', kills: 1, deaths: 0, heals: 0, captures: 1, captureArea: 8 },
      ],
    };
    state.photos = [
      { photoId: 'stage-photo-1', path: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22120%22%3E%3Crect width=%22160%22 height=%22120%22 fill=%22%23111%22/%3E%3Crect x=%2220%22 y=%2220%22 width=%22120%22 height=%2280%22 fill=%22%23e83a28%22/%3E%3C/svg%3E', lat: 39.992679, lng: 116.305732, locationReady: true, accuracy: 8, createdAt: now, hero: 'hunter', cameraType: 'standard', cameraLabel: 'STANDARD', description: 'Demo photo' },
      { photoId: 'stage-photo-2', path: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22120%22%3E%3Crect width=%22160%22 height=%22120%22 fill=%22%23e4e1da%22/%3E%3Ccircle cx=%2280%22 cy=%2260%22 r=%2238%22 fill=%22%23111%22/%3E%3C/svg%3E', lat: 39.992448, lng: 116.303297, locationReady: true, accuracy: 12, createdAt: now, hero: 'sniper', cameraType: 'telephoto', cameraLabel: 'SNIPE', description: 'Point record' },
      { photoId: 'stage-photo-3', path: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22120%22%3E%3Crect width=%22160%22 height=%22120%22 fill=%22%23f4f1e8%22/%3E%3Cpath d=%22M20 90 L80 25 L140 90 Z%22 fill=%22%23111%22/%3E%3Ccircle cx=%2280%22 cy=%2270%22 r=%2218%22 fill=%22%23e83a28%22/%3E%3C/svg%3E', lat: 39.993019, lng: 116.301892, locationReady: true, accuracy: 10, createdAt: now, hero: 'wizard', cameraType: 'panorama', cameraLabel: 'PANORAMA', description: 'Capture support' },
    ];
    state.selectedPhotoIndex = 0;
    state.selectedFilmIndex = 0;
  }

  function setStageScene(scene = {}) {
    const route = scene.route || routeForScene(scene);
    seedStageState();
    deathState.debugDead = false;
    deathState.dancing = false;
    $('#deathOverlay')?.classList.add('hidden');
    $('#resultPanel')?.classList.add('hidden');
    $('#historyPanel')?.classList.add('hidden');
    closeTowerReport();

    if (route.screen === 'permissions') {
      showScreen('permissions');
      $('#permissionRoom').textContent = `ROOM ${demoRoom}`;
      return;
    }
    if (route.screen === 'hero') {
      showScreen('hero');
      renderHeroScreen();
      return;
    }
    if (route.screen === 'home') {
      showScreen('home');
      $('#roomInput').value = demoRoom;
      $('#playerInput').value = demoPlayer;
      drawHomeArt();
      return;
    }

    showScreen('battle');
    state.combatMode = route.mode === 'tower' ? 'tower' : 'kill';
    state.towerInfoOpen = route.overlay === 'info';
    if (state.combatMode === 'tower' && (scene.title === 'TOWER MODE' || scene.title === 'TOWER SCORING')) {
      state.selectedTowerPoiId = 2;
      state.pendingTowerPoiId = 2;
      state.towerPhotoIndexes = [0, 1, 2];
      state.selectedTowerPoint = 0;
      state.towerCaptured = false;
      state.towerCapturePct = scene.title === 'TOWER SCORING' ? 42 : 0;
    }
    renderBattle();

    if (route.overlay === 'overview') openTowerReport();
    if (route.overlay === 'info') toggleTowerInfo(true);
    if (route.overlay === 'death') {
      deathState.debugDead = true;
      deathState.debugKillerId = 'enemy_01';
      renderDeathState(currentPlayer());
    }
    if (route.overlay === 'result') {
      renderResultScreen();
      $('#resultPanel')?.classList.remove('hidden');
    }
    if (route.overlay === 'history') {
      renderHistoryPanel();
      $('#historyPanel')?.classList.remove('hidden');
    }
  }

  function stageSceneFromLocation() {
    const searchScene = params.get('scene');
    const hash = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const title = searchScene || hash.get('scene');
    if (!title) return null;
    const scene = { title };
    const routeText = params.get('route') || hash.get('route');
    if (routeText) {
      try {
        scene.route = JSON.parse(routeText);
      } catch (e) {}
    }
    return scene;
  }

  window.ParkUGoStage = { setScene: setStageScene };
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'parkugo-stage-scene') setStageScene(event.data.scene);
  });
  window.addEventListener('hashchange', () => {
    const scene = stageSceneFromLocation();
    if (scene) setStageScene(scene);
  });
  seedStageState();
  $('#roomInput').value = demoRoom;
  $('#playerInput').value = demoPlayer;
  const initialScene = stageSceneFromLocation();
  if (initialScene) setStageScene(initialScene);
}

loadSession();
setupStageExplainer();
setTopicColor();
updateClock();
requestAnimationFrame(drawHomeArt);
requestAnimationFrame(tickHeroAnimation);

// 背景音乐：默认尝试播放（浏览器拦截则等首次交互自动开始）；点击右上角跳舞小人切换 播放/静止
// 背景音乐控制（跳舞小人 + 首页/选角右上角的 ♪ 按钮共用）
let bgMusicUserPaused = false;
function syncMusicUi() {
  $$('.music-toggle').forEach((b) => {
    b.textContent = bgMusicPlaying ? '♫' : '♪';
    b.classList.toggle('playing', bgMusicPlaying);
  });
}
function playBgMusic() {
  const a = $('#bgMusic'); if (!a) return;
  bgMusicPlaying = true;
  a.play().catch(() => { bgMusicPlaying = false; syncMusicUi(); });
  syncMusicUi();
}
function pauseBgMusic() {
  const a = $('#bgMusic'); if (!a) return;
  bgMusicPlaying = false; a.pause(); syncMusicUi();
}
function toggleBgMusic() {
  if (bgMusicPlaying) { bgMusicUserPaused = true; pauseBgMusic(); }
  else { bgMusicUserPaused = false; playBgMusic(); }
}
(function initBgMusic() {
  const audio = $('#bgMusic');
  if (!audio) return;
  audio.volume = 0.15;   // 相对系统音量的系数（iOS 会忽略此属性，仅硬件音量键生效）
  audio.addEventListener('play', () => { bgMusicPlaying = true; syncMusicUi(); });
  audio.addEventListener('pause', () => { bgMusicPlaying = false; syncMusicUi(); });
  playBgMusic();   // 默认播放
  // 浏览器拦截自动播放时，用户首次交互后再启动（除非用户已主动静止）
  window.addEventListener('pointerdown', () => { if (!bgMusicUserPaused && !bgMusicPlaying) playBgMusic(); });
  // 点击跳舞小人 = 切换音乐（同时小人动/静）
  $('#battleDancerCanvas')?.addEventListener('click', toggleBgMusic);
  syncMusicUi();
})();
window.addEventListener('resize', () => {
  drawHomeArt();
  syncAmmoFlowToFilm();
});
// 全览地图：上滑也能隐藏（原来只能点 × / 背景关闭）。用捕获阶段监听，确保高德地图内部也能拿到手势。
(function initTowerReportSwipe() {
  const overlay = $('#towerReportOverlay');
  if (!overlay) return;
  const sw = { active: false, startY: 0, startX: 0, moved: false };
  overlay.addEventListener('pointerdown', (e) => {
    sw.active = true;
    sw.startY = e.clientY;
    sw.startX = e.clientX;
    sw.moved = false;
  }, true);
  overlay.addEventListener('pointermove', (e) => {
    if (sw.active && Math.abs(e.clientY - sw.startY) > 8) sw.moved = true;
  }, true);
  const finish = (e) => {
    if (!sw.active) return;
    const dy = (e.clientY ?? sw.startY) - sw.startY;
    const dx = (e.clientX ?? sw.startX) - sw.startX;
    sw.active = false;
    // 明显的向上滑动（位移 > 45px 且竖向为主）→ 关闭
    if (sw.moved && dy < -45 && Math.abs(dy) > Math.abs(dx)) {
      playSfx('back');
      closeTowerReport();
    }
  };
  overlay.addEventListener('pointerup', finish, true);
  overlay.addEventListener('pointercancel', () => { sw.active = false; }, true);
})();
// 取景器低功耗待机：3s 无操作 → IDLE，再 1s → STANDBY 机械闭合；任意操作 → WAKE → ACTIVE。
// 只在战斗页生效，纯视觉层（不改动相机/快门/活跃 HUD 逻辑）。
(function initViewfinderPower() {
  const vf = document.querySelector('.viewfinder');
  const standby = document.getElementById('vfStandby');
  if (!vf || !standby) return;

  let power = 'active';
  let idleT = null, standbyT = null, wakeT = null;

  const setPower = (s) => { power = s; vf.dataset.power = s; };
  const onBattle = () => currentScreenName() === 'battle';
  const clearSleep = () => { clearTimeout(idleT); clearTimeout(standbyT); };

  function scheduleSleep() {
    clearSleep();
    if (!onBattle()) return;
    idleT = setTimeout(() => {
      if (!onBattle()) return;
      setPower('idle');
      standbyT = setTimeout(() => { if (onBattle()) setPower('standby'); }, 1000);
    }, 3000);
  }

  function goActive() { setPower('active'); scheduleSleep(); }

  function wake() {
    if (power === 'wake') return;
    clearSleep();
    setPower('wake');
    clearTimeout(wakeT);
    wakeT = setTimeout(goActive, 540);
  }

  function onActivity() {
    if (!onBattle()) { clearSleep(); if (power !== 'active') setPower('active'); return; }
    if (power === 'standby' || power === 'wake') { wake(); return; }
    if (power === 'idle') setPower('active');
    scheduleSleep();
  }

  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach((ev) => {
    window.addEventListener(ev, onActivity, { passive: true });
  });

  // STANDBY 时挡板拦截点击 → 唤醒并吞掉本次点击，避免误触发战斗操作
  standby.addEventListener('pointerdown', (e) => {
    if (power === 'standby' || power === 'wake') { e.stopPropagation(); e.preventDefault(); wake(); }
  });

  // 进入/离开战斗页时分别开始/复位待机计时
  const battleScreen = document.querySelector('.screen[data-screen="battle"]');
  if (battleScreen) {
    new MutationObserver(() => {
      if (battleScreen.classList.contains('active')) scheduleSleep();
      else { clearSleep(); clearTimeout(wakeT); setPower('active'); }
    }).observe(battleScreen, { attributes: true, attributeFilter: ['class'] });
  }

  setPower('active');
  if (onBattle()) scheduleSleep();
})();
// 点开下拉地图时，默认以我的位置为中心（之后拖动不再被打断）
$('#mapToggle')?.addEventListener('change', (e) => {
  if (e.target.checked) centerMapOnMe();
});

// 息屏 / 切后台 → 释放相机省电；回到前台且在战斗页 → 自动重开
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopCameraStream();
  } else if (currentScreenName() === 'battle' && state.allowCamera) {
    ensureViewfinderCamera({ silent: true });
  }
});

setInterval(updateClock, 10000);
setInterval(tickLogo, 120);
setInterval(updateDialCooldownUi, 500);
$('#roomInput').value = state.roomId;
$('#playerInput').value = state.playerId;
if (state.playerId) loadAlbum();
