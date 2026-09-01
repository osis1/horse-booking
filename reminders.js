// reminders.js — Telegram-напоминания о занятиях конного клуба
// Запускается GitHub Actions каждые 5 минут

const https = require('https');

const TG_TOKEN = process.env.TG_TOKEN;
const DB_URL = 'https://courage-club-46edd-default-rtdb.europe-west1.firebasedatabase.app';

function fetchJSON(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options || {}, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e){ resolve(null); } });
    });
    req.on('error', reject);
    if (options && options.body) req.write(options.body);
    req.end();
  });
}

function mskNow() {
  const n = new Date();
  return new Date(n.getTime() + (n.getTimezoneOffset() + 180) * 60000);
}

async function tg(method, payload) {
  return fetchJSON('https://api.telegram.org/bot' + TG_TOKEN + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify(payload));
}

async function main() {
  if (!TG_TOKEN) { console.log('Нет TG_TOKEN'); return; }

  // 1. Входящие сообщения бота: привязка /start КОД, проверка /status
  const up = await tg('getUpdates', { timeout: 0, allowed_updates: ['message'] });
  if (up && up.ok && Array.isArray(up.result)) {
    for (const u of up.result) {
      const m = u.message; if (!m || !m.text) continue;
      const t = m.text.trim();
      const mm = t.match(/^\/start\s+([A-Za-z0-9]{4,12})$/);
      if (mm) {
        const code = mm[1].toUpperCase();
        const set = await fetchJSON(DB_URL + '/remindSettings/' + code + '.json', {});
        if (set && set.trainer) {
          await fetchJSON(DB_URL + '/tgUsers/' + code + '.json', {
            method: 'PUT',
            body: JSON.stringify({ chatId: String(m.chat.id), trainer: set.trainer, confirmed: true, at: Date.now() })
          });
          await tg('sendMessage', { chat_id: m.chat.id, text: '✅ Привязка выполнена: ' + set.trainer + '\nТеперь вам будут приходить напоминания о занятиях.' });
          console.log('Привязан:', set.trainer, '->', m.chat.id);
        } else {
          await tg('sendMessage', { chat_id: m.chat.id, text: '⚠️ Код не найден. Сгенерируйте код в приложении (⚙️ → Мой профиль).' });
        }
      }
      if (t === '/status') {
        const users = (await fetchJSON(DB_URL + '/tgUsers.json', {})) || {};
        const mine = Object.values(users).find(x => x.chatId === String(m.chat.id));
        await tg('sendMessage', { chat_id: m.chat.id, text: mine ? '✅ Вы привязаны: ' + mine.trainer : '❌ Привязки нет. Сгенерируйте код в приложении (⚙️ → Мой профиль).' });
      }
    }
    if (up.result.length) {
      await tg('getUpdates', { offset: up.result[up.result.length - 1].update_id + 1 });
    }
  }

  // 2. Время МСК
  const now = mskNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');

  // 3. Данные из Firebase
  const [settings, users, book, sentN] = await Promise.all([
    fetchJSON(DB_URL + '/remindSettings.json', {}),
    fetchJSON(DB_URL + '/tgUsers.json', {}),
    fetchJSON(DB_URL + '/bookings.json', {}),
    fetchJSON(DB_URL + '/sentNotifs.json', {})
  ]);

  // индекс: имя тренера -> chatId
  const chatByTrainer = {};
  Object.values(users || {}).forEach(u => { if (u.confirmed) chatByTrainer[u.trainer] = u.chatId; });

  // индекс: имя тренера -> код
  const codeByTrainer = {};
  Object.entries(settings || {}).forEach(([code, s]) => { if (s.trainer) codeByTrainer[s.trainer] = code; });

  // 4. Напоминания
  let count = 0;
  for (const b of Object.values(book || {})) {
    if (!b || (b.status || 'wait') !== 'wait' || b.dateKey !== today) continue;
    const st = settings[codeByTrainer[b.trainer]] || {};
    const remindMin = st.minutes || 15;
    const diff = b.startMin - nowMin;
    if (diff < 0 || diff > remindMin) continue;
    const key = today + '_' + b.startMin + '_' + b.horse;
    if (sentN && sentN[key]) continue;
    const chatId = chatByTrainer[b.trainer];
    if (!chatId) continue;
    const sM = b.startMin, eM = b.startMin + (b.dur || 1) * 60;
    const timeStr = String(Math.floor(sM/60)).padStart(2,'0') + ':' + String(sM%60).padStart(2,'0');
    const endStr = String(Math.floor(eM/60)).padStart(2,'0') + ':' + String(eM%60).padStart(2,'0');
    let msg = '🐴 <b>' + b.horse + '</b> — занятие через ' + diff + ' мин\n' +
      '⏰ ' + timeStr + '–' + endStr + ' (' + (b.dur || 1) + ' ч)\n' +
      '👤 ' + b.trainer;
    if (b.loadLabel) msg += '\n📋 ' + b.loadLabel;
    if (b.tempoLabel) msg += ' · ' + b.tempoLabel;
    if (b.comment) msg += '\n💬 ' + b.comment;
    const r = await tg('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'HTML' });
    if (r && r.ok) {
      await fetchJSON(DB_URL + '/sentNotifs/' + key + '.json', { method: 'PUT', body: JSON.stringify(Date.now()) });
      console.log('Отправлено:', b.horse, '->', b.trainer);
      count++;
    }
  }
  console.log('МСК ' + now.toTimeString().slice(0,8) + ': напоминаний отправлено: ' + count);
}

main().catch(e => { console.error('Ошибка:', e); process.exit(1); });
