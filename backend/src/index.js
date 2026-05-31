require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'リクエストが多すぎます。1時間後にお試しください。' },
});
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// コース提案
app.post('/api/suggest-courses', async (req, res) => {
  const { lat, lng, conditions = [], activityMode = 'walking' } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: '位置情報が必要です' });

  const conditionMap = {
    few_signals: '信号が少ない',
    flat: '高低差が少ない・平坦',
    green: '緑が多い・公園や自然がある',
    quiet: '人通りが少ない・静か',
    short: '距離が短め（3km以内）',
    medium: '距離が普通（3〜7km）',
    long: '距離が長め（7km以上）',
  };

  const conditionText = conditions.length > 0
    ? '条件: ' + conditions.map(c => conditionMap[c] || c).join('、')
    : '条件: 特になし';

  const activityText = activityMode === 'running' ? 'ランニング' : 'ウォーキング';

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `あなたは${activityText}コース専門のAIアドバイザーです。
緯度${parseFloat(lat).toFixed(3)}, 経度${parseFloat(lng).toFixed(3)}付近で${activityText}に適したコースを3つ提案してください。

${conditionText}

以下のJSONフォーマットのみで返してください：
[
  {
    "title": "コース名",
    "distance": "距離（例: 3.5km）",
    "time": "所要時間",
    "difficulty": "easy | medium | hard",
    "tags": ["タグ"],
    "tagTypes": ["park", "flat", "hill", "river", "historical", "scenic"],
    "description": "特徴（40字以内）",
    "highlights": ["見どころ1", "見どころ2"]
  }
]`
      }],
    });

    const text = message.content[0].text;
    const json = text.match(/\[[\s\S]*\]/);
    if (!json) throw new Error('invalid');
    res.json({ courses: JSON.parse(json[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'コース提案の取得に失敗しました' });
  }
});

// ルート分析
app.post('/api/analyze-route', async (req, res) => {
  const { distance, points, activityMode = 'walking' } = req.body;
  if (!distance) return res.status(400).json({ error: 'ルート情報が必要です' });

  const activityText = activityMode === 'running' ? 'ランニング' : 'ウォーキング';

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `${activityText}ルートのアドバイスをJSON形式で。距離${distance}km、${points}地点。
{ "calories": 数値, "advice": "30字以内", "intensity": "low|medium|high", "tips": ["コツ1", "コツ2"] }
前置き不要。`
      }],
    });

    const text = message.content[0].text;
    const json = text.match(/\{[\s\S]*\}/);
    if (!json) throw new Error('invalid');
    res.json(JSON.parse(json[0]));
  } catch (e) {
    res.status(500).json({ error: 'ルート解析に失敗しました' });
  }
});

// AIコーチ
app.post('/api/coach', async (req, res) => {
  const { message, context = {}, history = [] } = req.body;

  const systemPrompt = `あなたは親切で励ましてくれるウォーキング・ランニングのAIコーチです。
ユーザーの情報：
- アクティビティ: ${context.activityMode === 'running' ? 'ランニング' : 'ウォーキング'}
- 連続記録: ${context.streak || 0}日
- 最近の距離: ${context.distance || 0}km

目標設定、ペース配分、モチベーション維持、ケガ予防などについて日本語で親切にアドバイスしてください。
返答は200字以内で簡潔に。`;

  try {
    const msgs = [
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: msgs,
    });

    res.json({ reply: response.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'コーチからの返答に失敗しました' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
