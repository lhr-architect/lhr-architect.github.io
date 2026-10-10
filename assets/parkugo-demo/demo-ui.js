// Park U Go · 离线演示辅助层（在 app.js 之后加载）
// 1. TOWER 模式拍照：照片坐标自动落在目标据点周围的三角顶点上（模拟"绕点走一圈拍三张"）
// 2. 石坊复活：模拟走到石坊复活点
// 3. 右下角 DEMO 菜单：立即倒地 / 立即结算 / 重置演示数据
(function () {
  'use strict';
  const demo = window.ParkUGoDemo;
  if (!demo) return;

  // ----- 1. TOWER 模式照片定位 -----
  const vertex = { key: '', next: 0 };
  const originalSaveCapturedPhoto = saveCapturedPhoto;
  saveCapturedPhoto = function demoSaveCapturedPhoto(options) {
    const target = state.combatMode === 'tower' ? currentTowerTarget() : null;
    if (!target || !state.pendingCapture || target.lat == null || target.lng == null) {
      return originalSaveCapturedPhoto(options);
    }
    const lat = Number(target.lat);
    const lng = Number(target.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return originalSaveCapturedPhoto(options);
    const key = String(target.code || target.towerId || `${lat},${lng}`);
    if (vertex.key !== key) { vertex.key = key; vertex.next = 0; }
    const angle = (vertex.next % 3) * 120 + 20;
    vertex.next += 1;
    const dist = Math.max(8, (Number(target.radius) || 30) * 0.5);
    const rad = angle * Math.PI / 180;
    const saved = state.location;
    state.location = {
      lat: lat + (dist / 111000) * Math.cos(rad),
      lng: lng + (dist / (111000 * Math.cos(lat * Math.PI / 180))) * Math.sin(rad),
      accuracy: 5,
      ready: true,
    };
    try {
      return originalSaveCapturedPhoto(options);
    } finally {
      state.location = saved;
    }
  };

  // ----- 2. 石坊复活：先"走到"石坊 -----
  const originalChooseStoneRevive = chooseStoneRevive;
  chooseStoneRevive = async function demoChooseStoneRevive() {
    demo.setPosition(SHIFANG_REVIVE.lat, SHIFANG_REVIVE.lng);
    try {
      return await originalChooseStoneRevive();
    } finally {
      demo.resetPosition();
      state.location = { lat: demo.home.lat, lng: demo.home.lng, accuracy: 5, ready: true };
      uploadLocation();
    }
  };

  // ----- 3. DEMO 菜单 -----
  const style = document.createElement('style');
  style.textContent = `
    .demo-badge{position:fixed;right:10px;bottom:10px;z-index:99999;font:700 11px/1 ui-monospace,Menlo,monospace;
      letter-spacing:.08em;background:#111;color:#f4f1e8;border:2px solid #f4f1e8;padding:6px 8px;cursor:pointer;opacity:.72}
    .demo-badge:hover{opacity:1}
    .demo-panel{position:fixed;right:10px;bottom:44px;z-index:99999;width:min(260px,calc(100vw - 20px));background:#f4f1e8;color:#111;
      border:2px solid #111;box-shadow:4px 4px 0 #111;font:12px/1.45 ui-monospace,Menlo,monospace;padding:10px}
    .demo-panel[hidden]{display:none}
    .demo-panel b{display:block;margin-bottom:4px}
    .demo-panel p{margin:0 0 8px;opacity:.75}
    .demo-panel button{display:block;width:100%;margin-top:6px;padding:7px;border:2px solid #111;background:#fff;color:#111;
      font:700 12px ui-monospace,Menlo,monospace;cursor:pointer;text-align:left}
    .demo-panel button:disabled{opacity:.35;cursor:not-allowed}
    .demo-panel button.danger{background:#e83a28;color:#fff}
  `;
  document.head.appendChild(style);

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'demo-badge';
  badge.textContent = 'DEMO';
  badge.title = '离线演示模式';

  const panel = document.createElement('div');
  panel.className = 'demo-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <b>离线演示模式</b>
    <p>无需服务器：后端、定位、机器人均在浏览器内模拟。位置固定在未名湖南岸。</p>
    <button type="button" data-demo="die">✕ 让我立即倒地（演示复活）</button>
    <button type="button" data-demo="end">■ 立即结算本局（演示结算页）</button>
    <button type="button" data-demo="reset" class="danger">↺ 重置全部演示数据</button>
  `;

  const onBattle = () => currentScreenName() === 'battle';
  function syncPanel() {
    panel.querySelector('[data-demo="die"]').disabled = !onBattle();
    panel.querySelector('[data-demo="end"]').disabled = !onBattle();
  }

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    syncPanel();
  });
  panel.addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.target.closest('button[data-demo]');
    if (!btn || btn.disabled) return;
    const action = btn.dataset.demo;
    panel.hidden = true;
    if (action === 'die') {
      if (demo.knockDown(state.roomId, state.playerId)) {
        await fetchRoom().catch(() => {});
        renderBattle();
      }
    } else if (action === 'end') {
      debugEndGame();
    } else if (action === 'reset') {
      if (!confirm('清空所有演示房间、照片和本地进度，回到首页？')) return;
      demo.resetAll();
      Object.keys(localStorage).filter((k) => k.startsWith('parkugo_')).forEach((k) => {
        try { localStorage.removeItem(k); } catch (err) {}
      });
      location.reload();
    }
  });
  document.addEventListener('click', () => { panel.hidden = true; });

  document.body.appendChild(panel);
  document.body.appendChild(badge);
})();
