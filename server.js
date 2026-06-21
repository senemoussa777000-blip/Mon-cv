// ============================================
// DARK IA WEB - Serveur Backend (Node.js/Express)
// Gère les appels à l'API Gemini en toute sécurité
// La clé API ne quitte JAMAIS le serveur
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!GEMINI_API_KEY) {
  console.error('❌ ERREUR : GEMINI_API_KEY manquante dans le fichier .env');
  console.error('   Copie .env.example vers .env et ajoute ta clé.');
  process.exit(1);
}

// ----- Middlewares -----
app.use(cors());
app.use(express.json({ limit: '15mb' })); // limite pour les images en base64
app.use(express.static(path.join(__dirname, 'public')));

// ----- Config upload (multer) -----
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|txt/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Type de fichier non autorisé'));
  }
});

// ============================================
// ROUTE : Upload de fichier/image
// Renvoie le fichier encodé en base64 + son type MIME
// pour qu'il soit injecté dans le prompt Gemini
// ============================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // On nettoie le fichier temporaire après lecture
    fs.unlink(filePath, () => {});

    res.json({
      success: true,
      fileName: req.file.originalname,
      mimeType,
      base64Data
    });
  } catch (err) {
    console.error('Erreur upload :', err.message);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier.' });
  }
});

// ============================================
// ROUTE : Chat avec Gemini
// Reçoit l'historique de conversation + message (+ fichier optionnel)
// Appelle l'API Gemini côté serveur (clé jamais exposée au client)
// ============================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, fileData } = req.body;

    if (!message && !fileData) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    // Construction des "parts" du message (texte + fichier éventuel)
    const userParts = [];
    if (message) userParts.push({ text: message });
    if (fileData && fileData.base64Data && fileData.mimeType) {
      userParts.push({
        inline_data: {
          mime_type: fileData.mimeType,
          data: fileData.base64Data
        }
      });
    }

    // Historique converti au format attendu par Gemini
    const contents = Array.isArray(history)
      ? history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }))
      : [];

    contents.push({ role: 'user', parts: userParts });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur API Gemini :', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Erreur lors de l\'appel à Gemini.'
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Désolé, je n\'ai pas pu générer de réponse.';

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Erreur serveur /api/chat :', err.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ----- Route de santé (utile pour vérifier que le serveur tourne) -----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL });
});

// ----- Démarrage du serveur -----
app.listen(PORT, () => {
  console.log(`🌑 DARK IA WEB lancé sur http://localhost:${PORT}`);
  console.log(`   Modèle Gemini utilisé : ${GEMINI_MODEL}`);
});
