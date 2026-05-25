import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import crypto from 'crypto';

// Constants
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'data.db');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// Default password: password123 (Please change in production)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('password123', 10);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function initDB() {
  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('single', 'multiple')),
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON array
      correct_answers TEXT NOT NULL, -- JSON array of indices
      explanation TEXT,
      error_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      weight REAL DEFAULT 1.0,
      is_marked BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}

const db = initDB();

function getSetting(key: string, defaultValue: string = '') {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? (row as any).value : defaultValue;
}

function setSetting(key: string, value: string) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
  stmt.run(key, value, value);
}

// Ensure default AI settings
if (!getSetting('ai_provider')) {
  setSetting('ai_provider', 'gemini');
  setSetting('ai_model', 'gemini-3.5-flash');
  setSetting('ai_api_key', process.env.GEMINI_API_KEY || '');
  setSetting('ai_base_url', '');
}

// Middleware to verify JWT
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  
  app.use(express.json());

  // ----- API Routes -----

  // Settings API
  app.get("/api/settings/ai", authenticateToken, (req, res) => {
    res.json({
      provider: getSetting('ai_provider'),
      model: getSetting('ai_model'),
      hasApiKey: !!getSetting('ai_api_key'),
      baseUrl: getSetting('ai_base_url')
    });
  });

  app.put("/api/settings/ai", authenticateToken, (req, res) => {
    const { provider, model, apiKey, baseUrl } = req.body;
    if (provider) setSetting('ai_provider', provider);
    if (model) setSetting('ai_model', model);
    if (apiKey !== undefined && apiKey.trim() !== '') setSetting('ai_api_key', apiKey.trim());
    if (baseUrl !== undefined) setSetting('ai_base_url', baseUrl);
    res.json({ success: true });
  });

  app.post("/api/settings/ai/test", authenticateToken, async (req, res) => {
    try {
      const { provider, model, apiKey, baseUrl } = req.body;
      const testApiKey = apiKey || getSetting('ai_api_key');
      const testProvider = provider || getSetting('ai_provider');
      const testModel = model || getSetting('ai_model');
      const testBaseUrl = baseUrl || getSetting('ai_base_url');

      if (!testApiKey) {
        return res.status(400).json({ error: "Missing API Key" });
      }

      if (testProvider === 'gemini') {
        const aiClient = new GoogleGenAI({ apiKey: testApiKey });
        const response = await aiClient.models.generateContent({
          model: testModel || "gemini-3.5-flash",
          contents: "Say 'OK' if you receive this.",
        });
        res.json({ success: true, message: response.text });
      } else {
        const url = testBaseUrl || "https://api.openai.com/v1/chat/completions";
        const fetchResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${testApiKey}`
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: "user", content: "Say 'OK' if you receive this." }],
            max_tokens: 10
          })
        });
        
        if (!fetchResponse.ok) {
          const errBody = await fetchResponse.text();
          throw new Error(`(${fetchResponse.status}) ${errBody}`);
        }
        res.json({ success: true, message: "OK" });
      }
    } catch (e: any) {
      console.error("AI test error:", e);
      let msg = e.message || "Failed to connect to AI provider";
      if (msg === "fetch failed" || msg.includes("Failed to fetch")) {
        msg = "无法连接到该API地址，请检查网络或确认 URL 是否正确。注意：后端无法直接访问您本地设备上的地址 (如 localhost)。";
      }
      res.status(500).json({ error: msg });
    }
  });

  // Login
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const currentUsername = getSetting('admin_username') || ADMIN_USERNAME;
    const currentPasswordHash = getSetting('admin_password_hash') || ADMIN_PASSWORD_HASH;

    if (username === currentUsername && bcrypt.compareSync(password, currentPasswordHash)) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Update Credentials
  app.put("/api/credentials", authenticateToken, (req, res) => {
    const { username, password } = req.body;
    if (username) {
      setSetting('admin_username', username);
    }
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      setSetting('admin_password_hash', hash);
    }
    res.json({ success: true });
  });

  // Check auth
  app.get("/api/me", authenticateToken, (req, res) => {
    res.json({ username: (req as any).user.username });
  });

  // Get all questions
  app.get("/api/questions", authenticateToken, (req, res) => {
    const stmt = db.prepare('SELECT * FROM questions ORDER BY created_at DESC');
    const questions = stmt.all().map((q: any) => ({
      ...q,
      options: JSON.parse(q.options),
      correct_answers: JSON.parse(q.correct_answers),
      is_marked: Boolean(q.is_marked)
    }));
    res.json(questions);
  });

  // Add question
  app.post("/api/questions", authenticateToken, (req, res) => {
    const { type, question, options, correct_answers, explanation } = req.body;
    const stmt = db.prepare(`
      INSERT INTO questions (type, question, options, correct_answers, explanation, weight)
      VALUES (?, ?, ?, ?, ?, 1.2)
    `);
    const result = stmt.run(type, question, JSON.stringify(options), JSON.stringify(correct_answers), explanation || '');
    res.json({ id: result.lastInsertRowid });
  });

  // Add questions back
  app.post("/api/questions/batch", authenticateToken, (req, res) => {
    const { questions } = req.body;
    const insert = db.prepare(`
      INSERT INTO questions (type, question, options, correct_answers, explanation, weight)
      VALUES (?, ?, ?, ?, ?, 1.2)
    `);
    
    const insertMany = db.transaction((qs) => {
      for (const q of qs) {
        insert.run(q.type, q.question, JSON.stringify(q.options), JSON.stringify(q.correctAnswers), q.explanation || '');
      }
    });

    insertMany(questions);
    res.json({ success: true, count: questions.length });
  });

  // Update question
  app.put("/api/questions/:id", authenticateToken, (req, res) => {
    const data = req.body;
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any;
    if (!existing) return res.status(404).json({ error: "Not found" });

    const type = data.type !== undefined ? data.type : existing.type;
    const question = data.question !== undefined ? data.question : existing.question;
    const options = data.options !== undefined ? JSON.stringify(data.options) : existing.options;
    const correct_answers = data.correct_answers !== undefined ? JSON.stringify(data.correct_answers) : existing.correct_answers;
    const explanation = data.explanation !== undefined ? data.explanation : existing.explanation;
    const is_marked = data.is_marked !== undefined ? (data.is_marked ? 1 : 0) : existing.is_marked;

    const stmt = db.prepare(`
      UPDATE questions 
      SET type = ?, question = ?, options = ?, correct_answers = ?, explanation = ?, is_marked = ?
      WHERE id = ?
    `);
    stmt.run(type, question, options, correct_answers, explanation, is_marked, id);
    res.json({ success: true });
  });

  // Delete question
  app.delete("/api/questions/:id", authenticateToken, (req, res) => {
    const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Record practice result
  app.post("/api/questions/:id/result", authenticateToken, (req, res) => {
    const { isCorrect } = req.body;
    const id = req.params.id;
    
    // Simple spaced repetition weight adjustment
    // Start at 1.0. Wrong increases weight heavily, correct reduces weight.
    const stmt = db.prepare('SELECT error_count, correct_count, weight FROM questions WHERE id = ?');
    const q: any = stmt.get(id);
    if (!q) return res.status(404).json({ error: "Not found" });

    let newWeight = q.weight;
    let newErrorCount = q.error_count;
    let newCorrectCount = q.correct_count;

    if (isCorrect) {
      newCorrectCount++;
      newWeight = Math.max(0.1, newWeight * 0.5); // Halve weight if correct
    } else {
      newErrorCount++;
      newWeight = Math.min(10.0, newWeight * 2.5); // Boost weight if wrong
    }

    const updateStmt = db.prepare(`
      UPDATE questions
      SET error_count = ?, correct_count = ?, weight = ?
      WHERE id = ?
    `);
    updateStmt.run(newErrorCount, newCorrectCount, newWeight, id);
    res.json({ success: true, weight: newWeight });
  });

  // Get practice questions
  app.get("/api/practice", authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    // We fetch all available, then do weighted random sampling in JS
    const stmt = db.prepare('SELECT * FROM questions');
    const allQuestions = stmt.all().map((q: any) => ({
      ...q,
      options: JSON.parse(q.options),
      correct_answers: JSON.parse(q.correct_answers),
      is_marked: Boolean(q.is_marked)
    }));

    if (allQuestions.length === 0) {
       res.json([]);
       return;
    }

    // Weighted random selection
    const selected = [];
    const pool = [...allQuestions];

    for (let i = 0; i < limit && pool.length > 0; i++) {
       let totalWeight = pool.reduce((sum, q) => sum + q.weight, 0);
       let random = Math.random() * totalWeight;
       let currentIndex = 0;
       
       for (let j = 0; j < pool.length; j++) {
          random -= pool[j].weight;
          if (random <= 0) {
            currentIndex = j;
            break;
          }
       }
       selected.push(pool[currentIndex]);
       pool.splice(currentIndex, 1);
    }

    res.json(selected);
  });

  // AI Parse text into questions
  app.post("/api/ai/parse", authenticateToken, async (req, res) => {
     try {
        const { text } = req.body;
        if (!text) return res.status(400).json({error: "No text provided"});

        const provider = getSetting('ai_provider');
        const model = getSetting('ai_model');
        const apiKey = getSetting('ai_api_key');
        const baseUrl = getSetting('ai_base_url');

        if (!apiKey) {
          return res.status(400).json({ error: "API Key not set. Please configure AI settings." });
        }

        const systemInstruction = "You are a professional educational assistant. Your task is to extract multiple-choice questions (single or multiple correct answers) from the provided raw text. Carefully analyze the text and generate a structured JSON array of questions. Ensure accurate extraction of options, correct answers (as indices starting from 0), and any available explanation. If explanation is missing, provide a brief insightful one if you can infer it, otherwise leave empty.";
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "'single' or 'multiple'" },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswers: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Zero-based indices of the correct options" },
                explanation: { type: Type.STRING }
              },
              required: ["type", "question", "options", "correctAnswers"]
            }
        };

        if (provider === 'gemini') {
          const aiClient = new GoogleGenAI({ apiKey });
          const response = await aiClient.models.generateContent({
             model: model || "gemini-3.5-flash",
             contents: text,
             config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema
             }
          });

          const jsonStr = response.text || "[]";
          const questions = JSON.parse(jsonStr);
          res.json({ questions });
        } else {
          // OpenAI compatible endpoint
          const url = baseUrl || "https://api.openai.com/v1/chat/completions";
          
          const fetchResponse = await fetch(url, {
             method: "POST",
             headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
             },
             body: JSON.stringify({
                model: model,
                messages: [
                   { 
                     role: "system", 
                     content: systemInstruction + `\n\nOutput strictly valid JSON. The output MUST be a JSON object containing a "questions" array. Each question object must have exactly these keys: \n- "type": string (must be exactly "single" or "multiple")\n- "question": string\n- "options": array of strings\n- "correctAnswers": array of integers (zero-based indices of the correct options)\n- "explanation": string.\nExample:\n{\n  "questions": [\n    {\n      "type": "single",\n      "question": "1+1=?",\n      "options": ["1", "2", "3"],\n      "correctAnswers": [1],\n      "explanation": "1+1 is 2"\n    }\n  ]\n}` 
                   },
                   { role: "user", content: text }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
             })
          });
          
          if (!fetchResponse.ok) {
             const errBody = await fetchResponse.text();
             throw new Error(`AI Provider Error (${fetchResponse.status}): ` + errBody);
          }
          const data = await fetchResponse.json();
          const content = data.choices[0].message.content;
          
          // Clean up potential markdown formatting (e.g. ```json \n ... \n```)
          const cleanContent = content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
          
          const parsed = JSON.parse(cleanContent);
          // Some models might return the array directly if they ignore instructions, or wrap it in { questions: [] }
          res.json({ questions: parsed.questions || (Array.isArray(parsed) ? parsed : []) });
        }
     } catch (error: any) {
        console.error("AI Parse Error:", error);
        let msg = error.message || "Failed to connect to AI provider";
        if (msg === "fetch failed" || msg.includes("Failed to fetch")) {
          msg = "无法连接到该API地址，请检查网络或确认 URL 是否正确。注意：后端无法直接访问您本地设备上的地址 (如 localhost)。";
        }
        res.status(500).json({ error: msg });
     }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
