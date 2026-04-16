import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, 'photo_pool.json');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) {
  console.error('Missing PEXELS_API_KEY in backend/.env');
  process.exit(1);
}

// Sport -> base search query. Gender prefix is prepended automatically.
const SPORT_QUERIES = {
  Football:        'soccer player',
  Basketball:      'basketball player',
  Rugby:           'rugby player',
  Volleyball:      'volleyball player',
  Hockey:          'ice hockey player',
  Boxing:          'boxing training',
  MMA:             'mma fighter',
  CrossFit:        'crossfit workout',
  Swimming:        'swimmer pool',
  Surfing:         'surfer wave',
  Rowing:          'rowing boat',
  Running:         'running athlete',
  'Trail Running': 'trail runner mountain',
  Cycling:         'cyclist road bike',
  Triathlon:       'triathlon athlete',
  Skiing:          'skier snow',
  Tennis:          'tennis player',
  Golf:            'golfer swing',
  Gymnastics:      'gymnast',
  Yoga:            'yoga pose',
  'Rock Climbing': 'rock climber',
  Hiking:          'hiker mountain',
};

const PER_PAGE = 10;

async function fetchPhotos(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    throw new Error(`Pexels ${res.status} for "${query}": ${await res.text()}`);
  }
  const data = await res.json();
  return (data.photos || []).map((p) => p.src.large).filter(Boolean);
}

async function main() {
  const pool = existsSync(OUTPUT_PATH)
    ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
    : {};

  const sports = Object.keys(SPORT_QUERIES);
  let newCount = 0;

  for (const sport of sports) {
    const existing = pool[sport];
    const alreadyDone =
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing) &&
      existing.male?.length >= 6 &&
      existing.female?.length >= 6;

    if (alreadyDone) {
      console.log(`[skip] ${sport} (${existing.male.length}m / ${existing.female.length}f cached)`);
      continue;
    }

    const base = SPORT_QUERIES[sport];
    try {
      const [maleUrls, femaleUrls] = await Promise.all([
        fetchPhotos(`male ${base}`),
        fetchPhotos(`female ${base}`),
      ]);

      pool[sport] = { male: maleUrls, female: femaleUrls };
      newCount += 1;
      console.log(`[ok]   ${sport} -> ${maleUrls.length}m / ${femaleUrls.length}f photos`);
      writeFileSync(OUTPUT_PATH, JSON.stringify(pool, null, 2));

      // Mild pacing — two requests were just fired, give Pexels a moment
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[fail] ${sport}: ${err.message}`);
    }
  }

  console.log(`\nDone. Fetched ${newCount} new sport(s). Pool saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
