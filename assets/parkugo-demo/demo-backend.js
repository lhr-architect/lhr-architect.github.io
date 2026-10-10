// Park U Go · 离线演示后端
// 在浏览器内模拟 backend/server.py：拦截 app.js 对 /api/* 的 fetch，返回与真实后端同构的 JSON。
// 另外提供：演示机器人、模拟 GPS（固定在未名湖）、摄像头不可用时的合成取景画面。
// 必须在 app.js 之前加载。
(function () {
  'use strict';

  // ===== 常量（与 server.py 保持一致）=====
  const MATCH_DURATION_SEC = 1800;
  const PHOTO_TTL_SEC = 120;
  const TOPICS = ['digital', 'fantasy', 'wuxia', 'pixel', 'modern'];
  const HEROES = ['hunter', 'sniper', 'wizard', 'king', 'priest'];
  const TOPIC_LABEL = { digital: 'CYAN', fantasy: 'PURPLE', wuxia: 'RED', pixel: 'GREEN', modern: 'GRAY' };

  const TOWER_POINTS_META = {
    BoyaTower:      { name: '博雅塔',          type: 'major', score: 10, radius: 50, lat: 39.992679, lng: 116.305732 },
    ZhongPavilion:  { name: '钟亭',            type: 'major', score: 10, radius: 50, lat: 39.993114, lng: 116.301888 },
    LinhuXuan:      { name: '临湖轩',          type: 'major', score: 10, radius: 50, lat: 39.992317, lng: 116.302895 },
    LusiPavilion:   { name: '鲁斯亭',          type: 'major', score: 10, radius: 50, lat: 39.993415, lng: 116.303474 },
    MountainGate:   { name: '山门',            type: 'major', score: 10, radius: 50, lat: 39.992745, lng: 116.304290 },
    CYPStone:       { name: '蔡元培像',        type: 'minor', score: 5,  radius: 30, lat: 39.993059, lng: 116.301267 },
    QianLongPoem:   { name: '乾隆诗碑',        type: 'minor', score: 5,  radius: 30, lat: 39.993019, lng: 116.301892 },
    FlipTailFish:   { name: '翻尾石鱼',        type: 'minor', score: 5,  radius: 30, lat: 39.993040, lng: 116.302215 },
    EdgarSnowTomb:  { name: '斯诺墓碑',        type: 'minor', score: 5,  radius: 30, lat: 39.992613, lng: 116.304306 },
    PlumTomb:       { name: '梅石碑',          type: 'minor', score: 5,  radius: 30, lat: 39.992097, lng: 116.302305 },
    Gym1:           { name: '第一体育馆',      type: 'minor', score: 5,  radius: 30, lat: 39.994013, lng: 116.305426 },
    QianLongScreen: { name: '乾隆石屏风',      type: 'minor', score: 5,  radius: 30, lat: 39.994519, lng: 116.303898 },
    WesternBridge:  { name: '西式平桥',        type: 'minor', score: 5,  radius: 30, lat: 39.993601, lng: 116.303085 },
    WSYTomb:        { name: '魏士毅墓',        type: 'minor', score: 5,  radius: 30, lat: 39.991990, lng: 116.300391 },
    LPW_XRDTomb:    { name: '赖朴吾·夏仁德墓', type: 'minor', score: 5,  radius: 30, lat: 39.992448, lng: 116.303297 },
  };

  const TOWER_BUFFS_META = {
    major: [
      { id: 'disarm',  name: '缴械',     icon: '⚔', duration: 30, instant: false },
      { id: 'eclipse', name: '日食',     icon: '☀', duration: 60, instant: false },
      { id: 'veil',    name: '遮天蔽日', icon: '◑', duration: 90, instant: false },
    ],
    minor: [
      { id: 'ghost',  name: '遁形', icon: '◈', duration: 30, instant: false },
      { id: 'malice', name: '恶意', icon: '◆', duration: 60, instant: false },
      { id: 'bless',  name: '祝福', icon: '✚', duration: 0,  instant: true },
    ],
  };

  const CM = {
    MAJOR_QUOTA: 2, MINOR_QUOTA: 3,
    MAJOR_READ_MS: 60000, MINOR_READ_MS: 30000,
    MAJOR_CD_MS: 300000, MINOR_CD_MS: 150000,
    MAJOR_RADIUS: 50, MINOR_RADIUS: 30,
    MAJOR_SCORE: 20, MINOR_SCORE: 10, KILL_SCORE: 5,
    MATCH_SEC: 1800, ACCEL: 10,
  };

  // ===== 演示专用 =====
  // 模拟玩家位置：未名湖南岸，靠近赖朴吾·夏仁德墓 / 临湖轩
  const DEMO_HOME = { lat: 39.992700, lng: 116.303300 };
  const BOT_RESPAWN_MS = 30000;
  const STORAGE_KEY = 'parkugo_demo_state_v1';

  // ===== 状态 =====
  function emptyState() { return { rooms: {}, photos: {} }; }
  let STATE = emptyState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.rooms) STATE = { rooms: saved.rooms, photos: saved.photos || {} };
  } catch (e) {}

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch (e) {}
  }

  const nowMs = () => Date.now();
  const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const normalizeId = (v, fallback) => { const t = String(v == null ? '' : v).trim(); return t || fallback; };
  const roomIdOf = (r) => (r && typeof r === 'object' ? r.roomId : r);
  const isTestRoom = (r) => String(roomIdOf(r) || '').trim().toLowerCase() === 'test';
  const isTestDeathRoom = (r) => String(roomIdOf(r) || '').trim().toLowerCase() === 'testdeath';
  const isCheckmateRoom = (r) => String(roomIdOf(r) || '').trim().toLowerCase().startsWith('mate-');
  const isAcceleratedRoom = (r) => String(roomIdOf(r) || '').trim().toLowerCase().includes('fast');
  const getRoomMode = (r) => (isCheckmateRoom(r) ? 'checkmate' : 'weiming');
  const round2 = (x) => Math.round(x * 100) / 100;

  class ApiError extends Error {
    constructor(status, message, details) { super(message); this.status = status; this.details = details; }
  }

  function distanceMeters(aLat, aLng, bLat, bLng) {
    const R = 6371000;
    const dLat = (bLat - aLat) * Math.PI / 180;
    const dLng = (bLng - aLng) * Math.PI / 180;
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const v = s1 * s1 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * s2 * s2;
    return 2 * R * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
  }

  function offsetMeters(base, meters, angleDeg) {
    const a = angleDeg * Math.PI / 180;
    return {
      lat: base.lat + (meters / 111000) * Math.cos(a),
      lng: base.lng + (meters / (111000 * Math.cos(base.lat * Math.PI / 180))) * Math.sin(a),
    };
  }

  function towerPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const cross = (ox, oy, ex, ey, qx, qy) => (ex - ox) * (qy - oy) - (ey - oy) * (qx - ox);
    const d1 = cross(ax, ay, bx, by, px, py);
    const d2 = cross(bx, by, cx, cy, px, py);
    const d3 = cross(cx, cy, ax, ay, px, py);
    return (d1 > 0 && d2 > 0 && d3 > 0) || (d1 < 0 && d2 < 0 && d3 < 0);
  }

  // ===== Buff =====
  function assignRandomBuff(room, meta, code, actor) {
    const pool = TOWER_BUFFS_META[meta.type] || TOWER_BUFFS_META.minor;
    const buff = pool[Math.floor(Math.random() * pool.length)];
    room.towerBuffs = room.towerBuffs || {};
    room.towerBuffs[code] = { buffId: buff.id, assignedAt: nowMs(), duration: buff.duration, instant: buff.instant, consumed: false };
    if (buff.instant && buff.id === 'bless') {
      const before = Number(actor.health ?? 2);
      if (before < 2) {
        actor.health = Math.min(2, before + 1);
        if (actor.status === 'dead' && actor.health > 0) actor.status = 'alive';
      }
      room.towerBuffs[code].consumed = true;
    }
    return buff;
  }

  function buffEntryActive(entry) {
    if (!entry || entry.consumed || entry.instant) return false;
    if (!entry.duration) return true;
    return (nowMs() - Number(entry.assignedAt || 0)) / 1000 < Number(entry.duration);
  }

  function isTeamBuffActive(room, topic, buffId) {
    if (!topic) return false;
    const points = room.towerPoints || {};
    return Object.entries(room.towerBuffs || {}).some(([code, entry]) =>
      entry.buffId === buffId && buffEntryActive(entry) && points[code] && points[code].ownerTopic === topic);
  }

  function consumeTeamBuff(room, topic, buffId) {
    if (!topic) return false;
    const points = room.towerPoints || {};
    for (const [code, entry] of Object.entries(room.towerBuffs || {})) {
      if (entry.buffId !== buffId || !buffEntryActive(entry)) continue;
      if (points[code] && points[code].ownerTopic === topic) { entry.consumed = true; return true; }
    }
    return false;
  }

  function anyEnemyTeamHolding(room, myTopic, buffId) {
    if (!myTopic) return false;
    const enemyTopics = new Set();
    Object.values(room.towerPoints || {}).forEach((pt) => {
      if (pt.ownerTopic && pt.ownerTopic !== myTopic) enemyTopics.add(pt.ownerTopic);
    });
    return Array.from(enemyTopics).some((t) => isTeamBuffActive(room, t, buffId));
  }

  // ===== 塔 / Checkmate =====
  function getRoomTowerPoints(room) {
    if (isCheckmateRoom(room)) return {};
    room.towerPoints = room.towerPoints || {};
    Object.keys(TOWER_POINTS_META).forEach((code) => {
      if (!room.towerPoints[code]) {
        room.towerPoints[code] = { code, ownerTopic: null, captureTriangle: null, capturedAt: null, capturedBy: null };
      }
    });
    return room.towerPoints;
  }

  function cmTiming(room) {
    const div = isAcceleratedRoom(room) ? CM.ACCEL : 1;
    return {
      major_read: Math.floor(CM.MAJOR_READ_MS / div),
      minor_read: Math.floor(CM.MINOR_READ_MS / div),
      major_cd: Math.floor(CM.MAJOR_CD_MS / div),
      minor_cd: Math.floor(CM.MINOR_CD_MS / div),
      match_sec: Math.floor(CM.MATCH_SEC / div),
    };
  }

  function getRoomDynamicTowers(room) {
    if (!isCheckmateRoom(room)) return [];
    room.dynamicTowers = room.dynamicTowers || [];
    return room.dynamicTowers;
  }

  function getRoomKingState(room) {
    if (!isCheckmateRoom(room)) return {};
    room.kingState = room.kingState || {};
    return room.kingState;
  }

  function ensureKingStateForTopic(room, topic) {
    if (!topic) return null;
    const ks = getRoomKingState(room);
    if (!ks[topic]) {
      ks[topic] = { playerId: null, majorQuota: CM.MAJOR_QUOTA, minorQuota: CM.MINOR_QUOTA, nextPlaceAt: 0, placing: null };
    }
    return ks[topic];
  }

  function refreshKingHolder(room) {
    if (!isCheckmateRoom(room)) return;
    const ks = getRoomKingState(room);
    const topicToKing = {};
    Object.entries(room.players || {}).forEach(([pid, p]) => {
      if (p.hero === 'king' && p.topic && p.status !== 'dead' && !(p.topic in topicToKing)) topicToKing[p.topic] = pid;
    });
    Object.entries(topicToKing).forEach(([topic, pid]) => {
      ensureKingStateForTopic(room, topic);
      ks[topic].playerId = pid;
    });
    Object.keys(ks).forEach((topic) => { if (!(topic in topicToKing)) ks[topic].playerId = null; });
  }

  function maybeFailKingPlacing(room, deadPlayerId, reason = 'king_dead') {
    if (!isCheckmateRoom(room)) return;
    Object.values(getRoomKingState(room)).forEach((ks) => {
      if (ks.playerId !== deadPlayerId || !ks.placing) return;
      const ptype = ks.placing.type;
      const quotaKey = ptype === 'major' ? 'majorQuota' : 'minorQuota';
      ks[quotaKey] = Math.max(0, Number(ks[quotaKey] || 0) - 1);
      const t = cmTiming(room);
      ks.nextPlaceAt = nowMs() + (ptype === 'major' ? t.major_cd : t.minor_cd);
      ks.placing = null;
      addEvent(room, 'place_fail', deadPlayerId, null, 0, `${deadPlayerId} 国王倒地，${ptype}据点放置作废`, { reason, towerType: ptype });
    });
  }

  // ===== 演示机器人 =====
  // 每个阵营 2 个机器人：#1 距演示位置 6m（落在 MARTYR 10m 自焚范围内），#2 在 25–60m 外。
  function botId(topic, n) { return `${TOPIC_LABEL[topic]}-0${n}`; }

  function ensureDemoBots(room) {
    room.players = room.players || {};
    TOPICS.forEach((topic, ti) => {
      [1, 2].forEach((n) => {
        const pid = botId(topic, n);
        if (room.players[pid]) return;
        const dist = n === 1 ? 6 : 25 + ti * 8;
        const angle = ti * 72 + (n === 1 ? 20 : 55);
        const pos = offsetMeters(DEMO_HOME, dist, angle);
        room.players[pid] = {
          playerId: pid,
          roomId: room.roomId,
          topic,
          hero: HEROES[(ti + n * 2) % HEROES.length],
          selectionLocked: true,
          health: 2,
          status: 'alive',
          lat: pos.lat,
          lng: pos.lng,
          joinedAt: nowMs(),
          lastActiveAt: nowMs(),
          isBot: true,
        };
      });
    });
  }

  function tickBots(room) {
    const now = nowMs();
    Object.values(room.players || {}).forEach((p) => {
      if (!p.isBot) return;
      if (p.status === 'dead') {
        if (!p.deadSince) p.deadSince = now;
        else if (now - p.deadSince > BOT_RESPAWN_MS) {
          p.health = 2;
          p.status = 'alive';
          p.deadSince = null;
          addEvent(room, 'revive', p.playerId, null, 2, `${p.playerId} 复活`, { method: 'dance' });
        }
      } else {
        p.deadSince = null;
      }
    });
  }

  // 玩家选定阵营后布置一次演示场景：受伤的队友、敌方已占据点 / 敌方动态据点、初始比分。
  function seedDemoScene(room, player) {
    if (room.demoSeeded || !player.topic) return;
    room.demoSeeded = true;
    const myTopic = player.topic;
    const enemies = TOPICS.filter((t) => t !== myTopic);
    const ally1 = room.players[botId(myTopic, 1)];
    const ally2 = room.players[botId(myTopic, 2)];
    if (ally1) ally1.health = 1;
    if (ally2 && player.hero === 'priest') { ally2.health = 0; ally2.status = 'dead'; ally2.deadSince = nowMs() + 10 * 60000; }
    room.topicScores = room.topicScores || {};
    TOPICS.forEach((t) => { room.topicScores[t] = room.topicScores[t] || 0; });

    if (isCheckmateRoom(room)) {
      const plan = [
        { topic: enemies[0], type: 'major', dist: 45, angle: 10 },
        { topic: enemies[1], type: 'minor', dist: 32, angle: 120 },
        { topic: enemies[2], type: 'minor', dist: 55, angle: 230 },
      ];
      plan.forEach((item, i) => {
        const pos = offsetMeters(DEMO_HOME, item.dist, item.angle);
        const ks = ensureKingStateForTopic(room, item.topic);
        const quotaKey = item.type === 'major' ? 'majorQuota' : 'minorQuota';
        ks[quotaKey] = Math.max(0, ks[quotaKey] - 1);
        getRoomDynamicTowers(room).push({
          towerId: `dt_demo_${i}_${hex(2)}`,
          type: item.type,
          ownerTopic: item.topic,
          ownerPlayerId: botId(item.topic, 1),
          lat: pos.lat,
          lng: pos.lng,
          radius: item.type === 'major' ? CM.MAJOR_RADIUS : CM.MINOR_RADIUS,
          createdAt: nowMs() - 60000,
          active: true,
        });
        room.topicScores[item.topic] += item.type === 'major' ? CM.MAJOR_SCORE : CM.MINOR_SCORE;
      });
    } else {
      const tp = getRoomTowerPoints(room);
      room.towerBuffs = room.towerBuffs || {};
      [['BoyaTower', enemies[0]], ['ZhongPavilion', enemies[1]], ['Gym1', enemies[2]], ['WSYTomb', enemies[0]]].forEach(([code, topic]) => {
        const meta = TOWER_POINTS_META[code];
        tp[code].ownerTopic = topic;
        tp[code].captureTriangle = [0, 120, 240].map((deg) => offsetMeters(meta, meta.radius * 0.5, deg + 15));
        tp[code].capturedAt = nowMs() - 600000;
        tp[code].capturedBy = botId(topic, 2);
        room.topicScores[topic] += meta.score;
        // 已占据点必须带 buff 记录，否则前端 initTowerBuffs() 会每次渲染本地随机分配（可能抽到缴械，挡住拍照）。
        // 这里给一个早已过期的 buff：据点有归属，但没有正在生效的效果。
        const buff = meta.type === 'major' ? TOWER_BUFFS_META.major[1] : TOWER_BUFFS_META.minor[1];
        room.towerBuffs[code] = { buffId: buff.id, assignedAt: nowMs() - 600000, duration: buff.duration, instant: false, consumed: false };
      });
    }
  }

  // ===== 房间 =====
  function getRoom(roomIdRaw) {
    const roomId = normalizeId(roomIdRaw, '1001');
    if (!STATE.rooms[roomId]) {
      STATE.rooms[roomId] = {
        roomId,
        state: 'waiting',
        createdAt: nowMs(),
        startedAt: null,
        durationSec: isAcceleratedRoom(roomId) ? Math.floor(MATCH_DURATION_SEC / CM.ACCEL) : MATCH_DURATION_SEC,
        players: {},
        topicScores: {},
        landmarks: {},
        landmarkStates: {},
        events: [],
      };
    }
    const room = STATE.rooms[roomId];
    room.events = room.events || [];
    if (isCheckmateRoom(room)) {
      room.dynamicTowers = room.dynamicTowers || [];
      room.kingState = room.kingState || {};
      room.durationSec = cmTiming(room).match_sec;
      delete room.towerPoints;
      delete room.towerBuffs;
    }
    if (isTestRoom(room) || isTestDeathRoom(room)) {
      room.noTimeLimit = true;
      room.durationSec = null;
      if (room.state === 'finished') room.state = 'waiting';
    }
    ensureDemoBots(room);
    tickBots(room);
    updateRoomClock(room);
    return room;
  }

  function updateRoomClock(room) {
    applyTestDeathRoom(room);
    if (isTestRoom(room) || isTestDeathRoom(room) || room.noTimeLimit) return;
    if (room.state !== 'playing' || !room.startedAt) return;
    const elapsed = Math.floor((nowMs() - room.startedAt) / 1000);
    if (elapsed >= (room.durationSec || MATCH_DURATION_SEC)) room.state = 'finished';
  }

  function applyTestDeathRoom(room) {
    if (!isTestDeathRoom(room) || room.state !== 'playing' || !room.startedAt) return;
    if (nowMs() - Number(room.startedAt) < 5000) return;
    Object.entries(room.players || {}).forEach(([pid, p]) => {
      if (p.isBot || p.testDeathApplied || p.status === 'dead') return;
      p.health = 0;
      p.status = 'dead';
      p.testDeathApplied = true;
      const killerId = room.players['RED-01'] ? 'RED-01' : 'TEST-BOT';
      addEvent(room, 'kill', killerId, pid, 1, `${killerId} 击倒 ${pid}`, { testDeath: true });
      addEvent(room, 'death', killerId, pid, 0, `${pid} 进入死亡状态`, { testDeath: true });
    });
  }

  function buildPlayerStats(room) {
    const stats = {};
    const blank = (pid, topic) => ({ playerId: pid, topic: topic || null, kills: 0, deaths: 0, heals: 0, captures: 0, captureArea: 0 });
    Object.entries(room.players || {}).forEach(([pid, p]) => { stats[pid] = blank(pid, p.topic); });
    const ensure = (pid) => { if (!pid) return null; if (!stats[pid]) stats[pid] = blank(pid); return stats[pid]; };
    (room.events || []).forEach((e) => {
      const actor = ensure(e.actorPlayerId);
      if (e.type === 'kill' && actor) actor.kills += 1;
      else if (e.type === 'death') { const t = ensure(e.targetPlayerId); if (t) t.deaths += 1; }
      else if (e.type === 'heal' && actor) actor.heals += 1;
      else if (e.type === 'capture' && actor) { actor.captures += 1; actor.captureArea = round2(actor.captureArea + Number(e.value || 0)); }
    });
    return Object.values(stats).sort((a, b) => (b.kills - a.kills) || (b.captures - a.captures) || String(a.playerId).localeCompare(String(b.playerId)));
  }

  function buildResult(room) {
    const ranking = Object.entries(room.topicScores || {}).map(([topic, score]) => ({ topic, score }));
    ranking.sort((a, b) => (b.score - a.score) || a.topic.localeCompare(b.topic));
    return { ranking, winnerTopic: ranking.length ? ranking[0].topic : null, playerStats: buildPlayerStats(room) };
  }

  function normalizePlayer(p) {
    if (p.health == null) p.health = 2;
    if (p.status == null) p.status = p.health > 0 ? 'alive' : 'dead';
    if (p.lat === undefined) p.lat = null;
    if (p.lng === undefined) p.lng = null;
    if (p.selectionLocked == null) p.selectionLocked = false;
    return p;
  }

  function roomDto(room) {
    updateRoomClock(room);
    if (isCheckmateRoom(room)) refreshKingHolder(room);
    const players = Object.values(room.players || {}).map(normalizePlayer);
    const topicCounts = {};
    players.forEach((p) => { if (p.topic) topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1; });
    let remaining;
    if (isTestRoom(room) || room.noTimeLimit) remaining = null;
    else if (room.state === 'playing') remaining = Math.max(0, (room.durationSec || MATCH_DURATION_SEC) - Math.floor((nowMs() - room.startedAt) / 1000));
    else remaining = room.durationSec || MATCH_DURATION_SEC;
    const dto = {
      roomId: room.roomId,
      mode: getRoomMode(room),
      state: room.state,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      durationSec: room.durationSec === undefined ? MATCH_DURATION_SEC : room.durationSec,
      remainingSec: remaining,
      noTimeLimit: !!(isTestRoom(room) || room.noTimeLimit),
      players,
      topicCounts,
      topicScores: room.topicScores || {},
      events: (room.events || []).slice(-20),
      playerStats: buildPlayerStats(room),
      result: buildResult(room),
      towerPoints: getRoomTowerPoints(room),
      towerBuffs: room.towerBuffs || {},
    };
    if (isCheckmateRoom(room)) {
      dto.dynamicTowers = getRoomDynamicTowers(room);
      dto.kingState = getRoomKingState(room);
    }
    // 深拷贝：前端会就地修改 room 对象，不能与模拟后端共享引用
    return JSON.parse(JSON.stringify(dto));
  }

  function addEvent(room, type, actorId, targetId = null, value = null, text = '', details = null) {
    const event = {
      eventId: `evt_${nowMs()}_${hex(2)}`,
      roomId: room.roomId,
      type,
      actorPlayerId: actorId,
      targetPlayerId: targetId,
      value,
      text,
      createdAt: nowMs(),
      ...(details || {}),
    };
    room.events = (room.events || []).concat(event).slice(-100);
    return event;
  }

  function requirePlayer(room, playerId, msg = 'Player is not in room') {
    const p = (room.players || {})[playerId];
    if (!p) throw new ApiError(404, msg);
    return p;
  }

  // ===== GET =====
  function handleGet(path, query) {
    if (path === '/health') return { ok: true, serverTime: nowMs(), publicBaseUrl: 'demo://offline', devAllowOutOfRange: true };
    if (path === '/topics') return { ok: true, topics: TOPICS };
    if (path === '/heroes') return { ok: true, heroes: HEROES };
    if (path === '/landmarks') return { ok: true, landmarks: [] };
    let m = path.match(/^\/rooms\/([^/]+)$/);
    if (m) { const room = getRoom(decodeURIComponent(m[1])); saveState(); return { ok: true, room: roomDto(room) }; }
    m = path.match(/^\/rooms\/([^/]+)\/landmarks$/);
    if (m) return { ok: true, landmarks: [] };
    m = path.match(/^\/rooms\/([^/]+)\/result$/);
    if (m) { const room = getRoom(decodeURIComponent(m[1])); return { ok: true, room: roomDto(room), result: buildResult(room) }; }
    if (path === '/photos') {
      const roomQ = (query.get('roomId') || '').trim();
      const playerQ = (query.get('playerId') || '').trim();
      let items = Object.values(STATE.photos);
      if (roomQ) items = items.filter((p) => p.roomId === roomQ);
      if (playerQ) items = items.filter((p) => p.playerId === playerQ);
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return { ok: true, count: items.length, photos: items };
    }
    throw new ApiError(404, 'Not found');
  }

  // ===== POST =====
  function handlePost(path, body) {
    if (path === '/rooms/join') {
      const roomId = normalizeId(body.roomId, '1001');
      const playerId = normalizeId(body.playerId, `player_${Math.floor(nowMs() / 1000)}`);
      const room = getRoom(roomId);
      const prev = room.players[playerId] || {};
      const freshTestDeath = isTestDeathRoom(room) && !room.players[playerId];
      const player = {
        playerId,
        roomId,
        topic: prev.topic || null,
        hero: prev.hero || null,
        selectionLocked: prev.selectionLocked || false,
        health: freshTestDeath ? 2 : (prev.health ?? 2),
        status: freshTestDeath ? 'alive' : (prev.status || 'alive'),
        lat: body.lat ?? prev.lat ?? null,
        lng: body.lng ?? prev.lng ?? null,
        joinedAt: prev.joinedAt || nowMs(),
        lastActiveAt: nowMs(),
      };
      if (freshTestDeath) player.testDeathApplied = false;
      room.players[playerId] = player;
      if (isCheckmateRoom(room) && room.state === 'waiting') {
        room.state = 'playing';
        room.startedAt = nowMs();
      }
      saveState();
      return { ok: true, room: roomDto(room), player: JSON.parse(JSON.stringify(player)) };
    }

    if (path === '/players/location') {
      const room = getRoom(body.roomId);
      const playerId = normalizeId(body.playerId, '');
      const player = requirePlayer(room, playerId);
      player.lat = Number(body.lat);
      player.lng = Number(body.lng);
      player.lastActiveAt = nowMs();
      saveState();
      return { ok: true, player: normalizePlayer(player), room: roomDto(room) };
    }

    if (path === '/players/revive') {
      const room = getRoom(body.roomId);
      const playerId = normalizeId(body.playerId, '');
      const player = requirePlayer(room, playerId);
      player.health = 2;
      player.status = 'alive';
      player.lastActiveAt = nowMs();
      addEvent(room, 'revive', playerId, null, 2, `${playerId} 复活`, { method: normalizeId(body.method, 'dance') });
      saveState();
      return { ok: true, player: normalizePlayer(player), room: roomDto(room) };
    }

    if (path === '/rooms/select' || path === '/rooms/lock-selection') {
      const lock = path === '/rooms/lock-selection';
      const room = getRoom(body.roomId);
      const playerId = normalizeId(body.playerId, '');
      const player = requirePlayer(room, playerId);
      const { topic, hero } = body;
      if (lock && player.selectionLocked) return { ok: true, room: roomDto(room), player: normalizePlayer(player) };
      if (!TOPICS.includes(topic)) throw new ApiError(400, 'Invalid topic');
      if (!HEROES.includes(hero)) throw new ApiError(400, 'Invalid hero');
      if (!lock && player.selectionLocked && (player.topic !== topic || player.hero !== hero)) throw new ApiError(403, 'Selection is locked');
      player.topic = topic;
      player.hero = hero;
      if (lock) player.selectionLocked = true;
      player.lastActiveAt = nowMs();
      room.topicScores[topic] = room.topicScores[topic] || 0;
      saveState();
      return { ok: true, room: roomDto(room), player: normalizePlayer(player) };
    }

    let m = path.match(/^\/rooms\/([^/]+)\/start$/);
    if (m) {
      const room = getRoom(decodeURIComponent(m[1]));
      const playerId = normalizeId(body.playerId, '');
      const testRoom = isTestRoom(room) || isTestDeathRoom(room);
      let player = null;
      if (playerId) {
        player = requirePlayer(room, playerId);
        if (!testRoom && !player.selectionLocked) throw new ApiError(400, 'Selection must be locked before entering');
      }
      if (!testRoom && room.state === 'finished') throw new ApiError(400, 'Room already finished');
      if (room.state !== 'playing') {
        room.state = 'playing';
        room.startedAt = nowMs();
        if (testRoom) {
          room.noTimeLimit = true;
          room.durationSec = null;
          if (isTestDeathRoom(room)) {
            Object.values(room.players).forEach((p) => {
              if (!p.isBot) { p.health = 2; p.status = 'alive'; p.testDeathApplied = false; }
            });
          }
        } else {
          room.durationSec = Number(body.durationSec || room.durationSec || MATCH_DURATION_SEC);
        }
      }
      if (player) seedDemoScene(room, player);
      saveState();
      return { ok: true, room: roomDto(room) };
    }

    if (path === '/photos/upload') {
      const room = getRoom(body.roomId);
      const playerId = normalizeId(body.playerId, '');
      const player = requirePlayer(room, playerId);
      if (anyEnemyTeamHolding(room, player.topic, 'disarm')) throw new ApiError(403, '被敌方缴械中，无法拍照');
      const raw = String(body.imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
      if (!raw) throw new ApiError(400, 'imageBase64 is required');
      const photoId = `photo_${nowMs()}_${hex(3)}`;
      // 演示版不保存图片本体（只保留元数据），避免 localStorage 爆容量
      const photo = {
        photoId,
        roomId: room.roomId,
        playerId,
        topic: player.topic,
        imageUrl: '',
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        accuracy: body.accuracy ?? null,
        description: String(body.description || '').trim(),
        hero: String(body.hero || ''),
        cameraLabel: String(body.cameraLabel || ''),
        createdAt: nowMs(),
        submittedTo: null,
        used: false,
        usedFor: null,
      };
      STATE.photos[photoId] = photo;
      saveState();
      return { ok: true, photo: { ...photo } };
    }

    if (path === '/combat/use-photo') return usePhotoInteraction(body);
    if (path === '/tower/capture') return towerCapture(body);
    if (path === '/checkmate/place/start') return checkmatePlaceStart(body);
    if (path === '/checkmate/place/finalize') return checkmatePlaceFinalize(body);
    if (path === '/checkmate/destroy') return checkmateDestroy(body);
    throw new ApiError(404, 'Not found');
  }

  function validCoords(coords) {
    if (!Array.isArray(coords)) return [];
    return coords.filter((c) => Array.isArray(c) && c.length === 2 && c[0] != null && c[1] != null);
  }

  function towerCapture(body) {
    const room = getRoom(body.roomId);
    if (room.state === 'finished') throw new ApiError(400, 'Match is finished');
    const playerId = normalizeId(body.playerId, '');
    const player = requirePlayer(room, playerId, 'Player not in room');
    const topic = player.topic;
    if (!topic) throw new ApiError(400, 'Player has no topic');
    const code = normalizeId(body.towerCode, '');
    const meta = TOWER_POINTS_META[code];
    if (!meta) throw new ApiError(404, `Tower not found: ${code}`);
    const coords = body.photoCoords || [];
    if (!Array.isArray(coords) || coords.length < 3) return { ok: false, reason: '需要 3 张带定位的照片', consumed: true, room: roomDto(room) };
    const valid = validCoords(coords);
    if (valid.length < 3) return { ok: false, reason: '照片缺少定位信息', consumed: true, room: roomDto(room) };
    const inside = towerPointInTriangle(meta.lng, meta.lat, valid[0][1], valid[0][0], valid[1][1], valid[1][0], valid[2][1], valid[2][0]);
    if (!inside) return { ok: false, reason: '三角未包围据点中心', consumed: true, room: roomDto(room) };
    const tp = getRoomTowerPoints(room);
    const prevOwner = tp[code].ownerTopic;
    tp[code].ownerTopic = topic;
    tp[code].captureTriangle = valid.map((v) => ({ lat: v[0], lng: v[1] }));
    tp[code].capturedAt = nowMs();
    tp[code].capturedBy = playerId;
    const scores = room.topicScores;
    const scoreValue = Number(meta.score || 5);
    if (prevOwner && prevOwner !== topic) scores[prevOwner] = round2(Math.max(0, Number(scores[prevOwner] || 0) - scoreValue));
    scores[topic] = round2(Number(scores[topic] || 0) + scoreValue);
    addEvent(room, 'capture', playerId, code, scoreValue, `${playerId} 占领 ${meta.name}`, {
      towerCode: code, towerName: meta.name, previousOwnerTopic: prevOwner, scoreValue,
    });
    const buff = assignRandomBuff(room, meta, code, player);
    saveState();
    return {
      ok: true, captured: true, towerCode: code, ownerTopic: topic, scoreDelta: scoreValue,
      buff: { id: buff.id, name: buff.name, icon: buff.icon, instant: buff.instant, duration: buff.duration },
      room: roomDto(room),
    };
  }

  function checkmateDestroy(body) {
    const room = getRoom(body.roomId);
    if (!isCheckmateRoom(room)) throw new ApiError(400, 'Not a checkmate room');
    if (room.state === 'finished') throw new ApiError(400, 'Match is finished');
    const playerId = normalizeId(body.playerId, '');
    const player = requirePlayer(room, playerId, 'Player not in room');
    if (player.status === 'dead') throw new ApiError(400, 'Dead player cannot destroy');
    const topic = player.topic;
    if (!topic) throw new ApiError(400, 'Player has no topic');
    const towerId = normalizeId(body.towerId, '');
    const tower = getRoomDynamicTowers(room).find((t) => t.towerId === towerId);
    if (!tower) throw new ApiError(404, 'Tower not found');
    if (!tower.active) return { ok: false, reason: '塔已被摧毁', room: roomDto(room) };
    if (tower.ownerTopic === topic) throw new ApiError(400, 'Cannot destroy own tower');
    const coords = body.photoCoords || [];
    if (!Array.isArray(coords) || coords.length < 3) return { ok: false, reason: '需要 3 张带定位的照片', consumed: true, room: roomDto(room) };
    const valid = validCoords(coords);
    if (valid.length < 3) return { ok: false, reason: '照片缺少定位信息', consumed: true, room: roomDto(room) };
    const inside = towerPointInTriangle(Number(tower.lng), Number(tower.lat),
      Number(valid[0][1]), Number(valid[0][0]), Number(valid[1][1]), Number(valid[1][0]), Number(valid[2][1]), Number(valid[2][0]));
    if (!inside) return { ok: false, reason: '三角未包围据点中心', consumed: true, room: roomDto(room) };
    tower.active = false;
    tower.destroyedAt = nowMs();
    tower.destroyedBy = playerId;
    tower.destroyedByTopic = topic;
    const owner = tower.ownerTopic;
    const towerScore = tower.type === 'major' ? CM.MAJOR_SCORE : CM.MINOR_SCORE;
    if (owner) room.topicScores[owner] = round2(Math.max(0, Number(room.topicScores[owner] || 0) - towerScore));
    addEvent(room, 'destroy', playerId, null, towerScore, `${playerId} 摧毁${tower.type}据点 (-${towerScore} 对方)`, {
      towerId, towerType: tower.type, ownerTopic: owner, scoreValue: towerScore,
    });
    saveState();
    return { ok: true, destroyed: true, towerId, room: roomDto(room) };
  }

  function checkmatePlaceStart(body) {
    const room = getRoom(body.roomId);
    if (!isCheckmateRoom(room)) throw new ApiError(400, 'Not a checkmate room');
    if (room.state === 'finished') throw new ApiError(400, 'Match is finished');
    const playerId = normalizeId(body.playerId, '');
    const player = requirePlayer(room, playerId, 'Player not in room');
    if (player.hero !== 'king') throw new ApiError(403, 'Only KING can place towers');
    if (player.status === 'dead' || Number(player.health ?? 2) <= 0) throw new ApiError(400, 'KING is down');
    const topic = player.topic;
    if (!topic) throw new ApiError(400, 'KING has no topic');
    const ptype = normalizeId(body.type, '');
    if (ptype !== 'major' && ptype !== 'minor') throw new ApiError(400, 'type must be major or minor');
    const ks = ensureKingStateForTopic(room, topic);
    const quotaKey = ptype === 'major' ? 'majorQuota' : 'minorQuota';
    if (Number(ks[quotaKey] || 0) <= 0) return { ok: false, reason: `${ptype} 配额已用完`, room: roomDto(room) };
    const now = nowMs();
    if (now < Number(ks.nextPlaceAt || 0)) {
      const remain = Math.floor((Number(ks.nextPlaceAt) - now) / 1000);
      return { ok: false, reason: `放置冷却中，剩余 ${remain}s`, remainSec: remain, room: roomDto(room) };
    }
    if (ks.placing) return { ok: false, reason: '已有正在进行的放置流程', placing: ks.placing, room: roomDto(room) };
    const t = cmTiming(room);
    const readMs = ptype === 'major' ? t.major_read : t.minor_read;
    const placeId = `place_${now}_${hex(2)}`;
    ks.playerId = playerId;
    ks.placing = { placeId, type: ptype, startedAt: now, expectedAt: now + readMs };
    saveState();
    return { ok: true, placeId, type: ptype, startedAt: now, expectedAt: now + readMs, readMs, room: roomDto(room) };
  }

  function checkmatePlaceFinalize(body) {
    const room = getRoom(body.roomId);
    if (!isCheckmateRoom(room)) throw new ApiError(400, 'Not a checkmate room');
    const playerId = normalizeId(body.playerId, '');
    const player = requirePlayer(room, playerId, 'Player not in room');
    const topic = player.topic;
    if (!topic) throw new ApiError(400, 'KING has no topic');
    const ks = ensureKingStateForTopic(room, topic);
    const placing = ks.placing;
    if (!placing) throw new ApiError(400, 'No placement in progress');
    if (placing.placeId !== normalizeId(body.placeId, '')) throw new ApiError(400, 'placeId mismatch');
    const ptype = placing.type;
    const now = nowMs();
    if (now < Number(placing.expectedAt || 0)) return { ok: false, reason: '读条尚未完成，请等待', room: roomDto(room) };
    const quotaKey = ptype === 'major' ? 'majorQuota' : 'minorQuota';
    ks[quotaKey] = Math.max(0, Number(ks[quotaKey] || 0) - 1);
    const t = cmTiming(room);
    ks.nextPlaceAt = now + (ptype === 'major' ? t.major_cd : t.minor_cd);
    if (player.status === 'dead' || Number(player.health ?? 2) <= 0) {
      ks.placing = null;
      addEvent(room, 'place_fail', playerId, null, 0, `${playerId} 国王倒地，${ptype}据点放置作废`, { reason: 'king_dead', towerType: ptype });
      saveState();
      return { ok: false, reason: '国王已倒地，配额扣减', consumedQuota: true, room: roomDto(room) };
    }
    if (body.lat == null || body.lng == null) {
      ks.placing = null;
      saveState();
      return { ok: false, reason: '未提供位置，配额扣减', consumedQuota: true, room: roomDto(room) };
    }
    const towerId = `dt_${now}_${hex(2)}`;
    const tower = {
      towerId, type: ptype, ownerTopic: topic, ownerPlayerId: playerId,
      lat: Number(body.lat), lng: Number(body.lng),
      radius: ptype === 'major' ? CM.MAJOR_RADIUS : CM.MINOR_RADIUS,
      createdAt: now, active: true,
    };
    getRoomDynamicTowers(room).push(tower);
    ks.placing = null;
    const scoreValue = ptype === 'major' ? CM.MAJOR_SCORE : CM.MINOR_SCORE;
    room.topicScores[topic] = round2(Number(room.topicScores[topic] || 0) + scoreValue);
    addEvent(room, 'place', playerId, null, scoreValue, `${playerId} 落成${ptype}据点 (+${scoreValue})`, {
      towerId, towerType: ptype, lat: tower.lat, lng: tower.lng, scoreValue,
    });
    saveState();
    return { ok: true, tower: { ...tower }, room: roomDto(room) };
  }

  function handleWizardAoe(room, actor, actorId, body) {
    if (actor.hero !== 'wizard') throw new ApiError(400, 'Only wizard can sacrifice');
    if (!actor.topic) throw new ApiError(400, 'Actor must select topic');
    let photo = body.photoId ? STATE.photos[body.photoId] : null;
    if (photo) {
      if (photo.roomId !== room.roomId || photo.playerId !== actorId) photo = null;
      else if (photo.used || photo.submittedTo) photo = null;
      else if ((nowMs() - Number(photo.createdAt || nowMs())) / 1000 > PHOTO_TTL_SEC) photo = null;
    }
    const radius = Number(body.aoeRadius || 10);
    const hits = [];
    if (actor.lat != null && actor.lng != null) {
      Object.entries(room.players).forEach(([pid, p]) => {
        if (pid === actorId || p.status !== 'alive' || p.topic === actor.topic || p.lat == null || p.lng == null) return;
        if (distanceMeters(Number(actor.lat), Number(actor.lng), Number(p.lat), Number(p.lng)) <= radius) {
          p.health = Math.max(0, Number(p.health ?? 2) - 1);
          const killed = p.health <= 0;
          if (killed) p.status = 'dead';
          hits.push({ playerId: pid, killed });
        }
      });
    }
    actor.health = Math.max(0, Number(actor.health ?? 2) - 1);
    const actorKilled = actor.health <= 0;
    if (actorKilled) actor.status = 'dead';
    let photoId = null;
    if (photo) { photo.used = true; photo.usedFor = 'aoe'; photo.usedAt = nowMs(); photoId = photo.photoId; }
    actor.lastActiveAt = nowMs();
    addEvent(room, 'aoe', actorId, null, hits.length, `${actorId} 牺牲自焚，命中 ${hits.length} 名敌方`, {
      photoId, radius, targets: hits.map((h) => h.playerId),
    });
    hits.forEach((h) => {
      if (!h.killed) return;
      addEvent(room, 'kill', actorId, h.playerId, 1, `${actorId} 击倒 ${h.playerId}`, { photoId });
      addEvent(room, 'death', actorId, h.playerId, 0, `${h.playerId} 进入死亡状态`, { photoId });
      maybeFailKingPlacing(room, h.playerId);
      const pts = isCheckmateRoom(room) ? CM.KILL_SCORE : 1;
      room.topicScores[actor.topic] = round2(Number(room.topicScores[actor.topic] || 0) + pts);
    });
    if (actorKilled) {
      addEvent(room, 'death', actorId, actorId, 0, `${actorId} 自焚牺牲`, { photoId });
      maybeFailKingPlacing(room, actorId);
    }
    saveState();
    return { ok: true, aoe: true, targetsHit: hits, actorHealth: actor.health, actorKilled, room: roomDto(room) };
  }

  function usePhotoInteraction(body) {
    const room = getRoom(body.roomId);
    if (room.state === 'finished') throw new ApiError(400, 'Match is finished');
    const actorId = normalizeId(body.actorPlayerId, '');
    const action = normalizeId(body.action, '');
    const actor = room.players[actorId];
    if (!actor) throw new ApiError(404, 'Actor is not in room');
    normalizePlayer(actor);
    if (actor.status !== 'alive') throw new ApiError(400, 'Actor is not alive');
    if (!['attack', 'heal', 'aoe'].includes(action)) throw new ApiError(400, 'action must be attack, heal, or aoe');
    if (action === 'aoe') return handleWizardAoe(room, actor, actorId, body);

    const targetId = normalizeId(body.targetPlayerId, '');
    const target = room.players[targetId];
    if (!target) throw new ApiError(404, 'Target is not in room');
    normalizePlayer(target);
    if (action === 'attack' && target.status !== 'alive') throw new ApiError(400, 'Target is not alive');
    if (action === 'heal' && actor.hero !== 'priest') throw new ApiError(400, 'Only priest can heal');
    if (action === 'attack' && actor.hero === 'priest') throw new ApiError(400, 'Priest cannot attack');
    if (actorId === targetId && action !== 'heal') throw new ApiError(400, 'Cannot target self');
    if (!actor.topic || !target.topic) throw new ApiError(400, 'Both players must select topic');
    if (action === 'attack' && actor.topic === target.topic) throw new ApiError(400, 'Attack target must be an enemy');
    if (action === 'heal' && actor.topic !== target.topic) throw new ApiError(400, 'Heal target must be a teammate');

    const photo = STATE.photos[body.photoId];
    if (!photo) throw new ApiError(404, 'Photo not found');
    if (photo.roomId !== room.roomId || photo.playerId !== actorId) throw new ApiError(403, 'Photo does not belong to actor and room');
    if (photo.used || photo.submittedTo) throw new ApiError(400, 'Photo already used');
    const ageSec = (nowMs() - Number(photo.createdAt || nowMs())) / 1000;
    if (ageSec > PHOTO_TTL_SEC) throw new ApiError(400, 'Photo expired', { ageSec: Math.round(ageSec), ttlSec: PHOTO_TTL_SEC });

    let value = 0;
    if (action === 'attack') {
      if (isTeamBuffActive(room, target.topic, 'ghost')) {
        value = 0;
        addEvent(room, 'block', actorId, targetId, 0, `${targetId} 遁形免伤`, { buffId: 'ghost' });
      } else {
        let base = (actor.hero === 'sniper' ? 2 : 1) + Math.max(0, Number(body.damageBonus || 0));
        if (isTeamBuffActive(room, actor.topic, 'malice')) {
          base *= 2;
          consumeTeamBuff(room, actor.topic, 'malice');
          addEvent(room, 'buff', actorId, targetId, base, `${actorId} 触发恶意 ×2`, { buffId: 'malice' });
        }
        value = base;
      }
      target.health = Math.max(0, Number(target.health ?? 2) - value);
      if (target.health <= 0) target.status = 'dead';
    } else {
      value = 1;
      const wasDead = target.status === 'dead' || Number(target.health ?? 2) <= 0;
      target.health = Math.min(2, Number(target.health ?? 2) + value);
      target.status = 'alive';
      if (target.isBot) target.deadSince = null;
      if (wasDead && target.health > 0) {
        addEvent(room, 'revive', actorId, targetId, target.health, `${targetId} 被 ${actorId} 治疗复活`, { method: 'priest_heal', newHealth: target.health });
      }
    }
    photo.used = true;
    photo.usedFor = action;
    photo.usedAt = nowMs();
    photo.targetPlayerId = targetId;
    actor.lastActiveAt = nowMs();
    const event = addEvent(room, action, actorId, targetId, value, `${actorId} ${action === 'attack' ? '攻击' : '治疗'} ${targetId}`, {
      photoId: photo.photoId, distanceMeters: null,
    });
    if (action === 'attack' && target.status === 'dead') {
      addEvent(room, 'kill', actorId, targetId, 1, `${actorId} 击倒 ${targetId}`, { photoId: photo.photoId, distanceMeters: null });
      addEvent(room, 'death', actorId, targetId, 0, `${targetId} 进入死亡状态`, { photoId: photo.photoId, distanceMeters: null });
      maybeFailKingPlacing(room, targetId);
      const pts = isCheckmateRoom(room) ? CM.KILL_SCORE : 1;
      room.topicScores[actor.topic] = round2(Number(room.topicScores[actor.topic] || 0) + pts);
    }
    saveState();
    return {
      ok: true, action, distanceMeters: null, value,
      target: JSON.parse(JSON.stringify(normalizePlayer(target))),
      event: { ...event },
      room: roomDto(room),
    };
  }

  // ===== fetch 拦截 =====
  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  const jsonResponse = (status, payload) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

  window.fetch = async function demoFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const idx = url.indexOf('/api/');
    if (idx < 0) {
      if (!realFetch) throw new TypeError('fetch unavailable');
      return realFetch(input, init);
    }
    const parsed = new URL(url.slice(idx + 4), 'http://demo.local');
    const method = String(init.method || 'GET').toUpperCase();
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 60)); // 模拟网络延迟
    try {
      if (method === 'OPTIONS') return jsonResponse(200, { ok: true });
      const payload = method === 'POST'
        ? handlePost(parsed.pathname, init.body ? JSON.parse(init.body) : {})
        : handleGet(parsed.pathname, parsed.searchParams);
      return jsonResponse(200, payload);
    } catch (err) {
      if (err instanceof ApiError) return jsonResponse(err.status, { ok: false, error: err.message, details: err.details });
      console.error('[demo-backend]', err);
      return jsonResponse(500, { ok: false, error: 'Internal server error' });
    }
  };

  // ===== 模拟 GPS =====
  const demoPosition = { lat: DEMO_HOME.lat, lng: DEMO_HOME.lng, accuracy: 5 };
  const watchers = new Map();
  let watchSeq = 0;
  const makePosition = () => ({
    coords: {
      latitude: demoPosition.lat, longitude: demoPosition.lng, accuracy: demoPosition.accuracy,
      altitude: null, altitudeAccuracy: null, heading: null, speed: null,
    },
    timestamp: Date.now(),
  });
  const fakeGeolocation = {
    getCurrentPosition(success) { setTimeout(() => success(makePosition()), 120); },
    watchPosition(success) {
      const id = ++watchSeq;
      watchers.set(id, success);
      setTimeout(() => { if (watchers.has(id)) success(makePosition()); }, 120);
      return id;
    },
    clearWatch(id) { watchers.delete(id); },
  };
  try {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, get: () => fakeGeolocation });
  } catch (e) {}

  function setPosition(lat, lng) {
    demoPosition.lat = lat;
    demoPosition.lng = lng;
    watchers.forEach((cb) => { try { cb(makePosition()); } catch (e) {} });
  }

  // ===== 摄像头：真实摄像头不可用时，改用合成取景画面 =====
  const synth = { canvas: null, timer: null, facing: 'environment', t0: Date.now() };

  function drawSynthFrame() {
    const c = synth.canvas;
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    const t = (Date.now() - synth.t0) / 1000;
    if (synth.facing === 'user') {
      ctx.fillStyle = '#2b2f3a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f1c9a5';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.45 + Math.sin(t * 2) * 4, h * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(w / 2 - 40, h * 0.40, 18, 10);
      ctx.fillRect(w / 2 + 22, h * 0.40, 18, 10);
      ctx.fillRect(w / 2 - 25, h * 0.55, 50, 6);
      ctx.fillStyle = '#e83a28';
      ctx.fillRect(w / 2 - h * 0.3, h * 0.78, h * 0.6, h * 0.22);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      sky.addColorStop(0, '#8ec5e8');
      sky.addColorStop(1, '#dcefff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.55);
      ctx.fillStyle = '#4f7f5a';
      ctx.fillRect(0, h * 0.5, w, h * 0.08);
      const lake = ctx.createLinearGradient(0, h * 0.58, 0, h);
      lake.addColorStop(0, '#3d6f8f');
      lake.addColorStop(1, '#1f3f55');
      ctx.fillStyle = lake;
      ctx.fillRect(0, h * 0.58, w, h * 0.42);
      // 博雅塔剪影（随时间轻微平移，模拟手持取景）
      const x = w * 0.68 + Math.sin(t * 0.7) * 12;
      ctx.fillStyle = '#5b4a3f';
      for (let i = 0; i < 13; i++) {
        const tw = 46 - i * 2.4;
        ctx.fillRect(x - tw / 2, h * 0.52 - (i + 1) * 17, tw, 13);
      }
      ctx.fillRect(x - 2, h * 0.52 - 13 * 17 - 16, 4, 16);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      for (let i = 0; i < 6; i++) ctx.fillRect((i * 97 + t * 30) % w, h * (0.66 + i * 0.05), 60, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`DEMO CAMERA · ${synth.facing === 'user' ? 'FRONT' : 'BACK'} · ${new Date().toLocaleTimeString()}`, 12, 23);
  }

  function synthStream(constraints) {
    const fm = constraints && constraints.video && constraints.video.facingMode;
    synth.facing = (fm && (fm.ideal || fm.exact || fm)) === 'user' ? 'user' : 'environment';
    if (!synth.canvas) {
      synth.canvas = document.createElement('canvas');
      synth.canvas.width = 640;
      synth.canvas.height = 480;
    }
    drawSynthFrame();
    if (!synth.timer) synth.timer = setInterval(drawSynthFrame, 1000 / 15);
    if (typeof synth.canvas.captureStream !== 'function') throw new Error('Camera unavailable');
    return synth.canvas.captureStream(15);
  }

  if (!navigator.mediaDevices) {
    try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {} }); } catch (e) {}
  }
  if (navigator.mediaDevices) {
    const realGUM = navigator.mediaDevices.getUserMedia ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) : null;
    let preferSynth = !realGUM;
    navigator.mediaDevices.getUserMedia = async function demoGetUserMedia(constraints) {
      if (!preferSynth && realGUM) {
        try {
          return await realGUM(constraints);
        } catch (e) {
          preferSynth = true; // 真实摄像头不可用（无权限 / file:// / 无设备）→ 之后一律用合成画面
        }
      }
      return synthStream(constraints);
    };
  }

  // ===== 对外接口（供 demo-ui.js 使用）=====
  window.ParkUGoDemo = {
    home: { ...DEMO_HOME },
    position: demoPosition,
    setPosition,
    resetPosition() { setPosition(DEMO_HOME.lat, DEMO_HOME.lng); },
    knockDown(roomId, playerId) {
      const room = STATE.rooms[roomId];
      const me = room && room.players[playerId];
      if (!me) return false;
      const killer = Object.values(room.players).find((p) => p.isBot && p.topic !== me.topic && p.status === 'alive');
      const killerId = killer ? killer.playerId : 'UNKNOWN';
      me.health = 0;
      me.status = 'dead';
      addEvent(room, 'kill', killerId, playerId, 1, `${killerId} 击倒 ${playerId}`);
      addEvent(room, 'death', killerId, playerId, 0, `${playerId} 进入死亡状态`);
      maybeFailKingPlacing(room, playerId);
      if (killer) room.topicScores[killer.topic] = round2(Number(room.topicScores[killer.topic] || 0) + (isCheckmateRoom(room) ? CM.KILL_SCORE : 1));
      saveState();
      return true;
    },
    resetAll() {
      STATE = emptyState();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },
  };
})();
