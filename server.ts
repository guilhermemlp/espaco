import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { todayLocalDate } from './src/utils/date';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// In-memory cache for the daily meditation
let meditationCache: {
  dateKey: string;
  timestamp: number;
  data: {
    date: string;
    title: string;
    quote: string;
    source: string;
    body: string[];
    justForToday: string;
    copyright: string;
    sourceUrl: string;
  };
} | null = null;

// Endpoint to fetch and parse the daily meditation from Narcóticos Anônimos (NA Brasil)
app.get('/api/meditacao', async (req, res) => {
  try {
    const todayKey = todayLocalDate();
    const now = Date.now();

    // Cache valid for 30 minutes for the same calendar date
    if (meditationCache && meditationCache.dateKey === todayKey && (now - meditationCache.timestamp) < 30 * 60 * 1000) {
      return res.json(meditationCache.data);
    }

    const response = await fetch('https://www.na.org.br/meditacao/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EspacoApp/1.0; +https://espaco.local)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status} ao acessar na.org.br`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*tit[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Só por hoje';

    // Extract date string
    const dateMatch = html.match(/<p[^>]*class=["'][^"']*dat[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    const dateText = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract opening quote
    const quoteMatch = html.match(/<p[^>]*class=["'][^"']*ef[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    const quote = quoteMatch ? quoteMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract citation / source
    const citMatch = html.match(/<p[^>]*class=["'][^"']*cit[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    const source = citMatch ? citMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract 'Só por hoje' closing reflection
    const sphMatch = html.match(/<p[^>]*class=["'][^"']*sph[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    let justForToday = sphMatch ? sphMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (justForToday.toLowerCase().startsWith('só por hoje:')) {
      justForToday = justForToday.replace(/^só por hoje:\s*/i, '').trim();
    }

    // Extract body paragraphs (between sep and sep or between cit and sph)
    let body: string[] = [];
    const mainSectionRegex = /<p[^>]*class=["'][^"']*cit[^"']*["'][\s\S]*?<div id="sep">[\s\S]*?<\/div>([\s\S]*?)<div id="sep">/i;
    const mainMatch = html.match(mainSectionRegex);

    if (mainMatch) {
      const rawBody = mainMatch[1];
      body = rawBody
        .split(/<br\s*\/?>\s*<br\s*\/?>|\n\n+/)
        .map(p => p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
        .filter(p => p.length > 20 && !p.includes('Copyright'));
    }

    // If body splitting didn't catch enough paragraphs, fallback cleanly
    if (body.length === 0) {
      // General paragraph extractor around the page
      const altMatch = html.match(/<div class="elementor-shortcode">([\s\S]*?)<\/div>/i);
      if (altMatch) {
        const textChunk = altMatch[1]
          .replace(/<h1[\s\S]*?<\/h1>/i, '')
          .replace(/<p[^>]*class=["'](?:dat|ef|cit|sph|ct)["'][\s\S]*?<\/p>/gi, '')
          .replace(/<div id="sep">[\s\S]*?<\/div>/gi, '');
        body = textChunk
          .split(/<br\s*\/?>/)
          .map(p => p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
          .filter(p => p.length > 30);
      }
    }

    const result = {
      date: dateText || new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date()),
      title: title || 'Meditação Diária',
      quote: quote || '',
      source: source || 'Narcóticos Anônimos',
      body: body.length > 0 ? body : [
        'A recuperação nos convida a viver o momento presente com serenidade, admitindo nossas imperfeições e confiando no processo de crescimento um dia de cada vez.'
      ],
      justForToday: justForToday || 'Vou viver o dia de hoje com serenidade, lembrando que a recuperação é construída passo a passo.',
      copyright: 'Narcotics Anonymous World Services - www.na.org.br',
      sourceUrl: 'https://www.na.org.br/meditacao/',
    };

    meditationCache = {
      dateKey: todayKey,
      timestamp: now,
      data: result,
    };

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar meditação do NA:', error);
    // Graceful fallback
    res.json({
      date: new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date()),
      title: 'Só por hoje',
      quote: '“Estamos nos recuperando para viver uma vida com propósito e liberdade.”',
      source: 'Texto Básico de Narcóticos Anônimos',
      body: [
        'Na recuperação, aprendemos que não precisamos controlar tudo de uma vez. O único dia sobre o qual temos influência real é o dia de hoje.',
        'Observar nossos pensamentos com gentileza e sem julgamento nos ajuda a encontrar clareza para tomar boas escolhas, um momento por vez.'
      ],
      justForToday: 'Vou manter minha mente aberta para novas perspectivas e celebrar o dom da presença.',
      copyright: 'Narcotics Anonymous World Services - www.na.org.br',
      sourceUrl: 'https://www.na.org.br/meditacao/',
      isFallback: true,
    });
  }
});

// Dev and Prod serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
