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

// Sport -> search query (tweaked to steer Pexels toward real athletic photos)
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

async function fetchSport(sport, query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${PER_PAGE}&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    throw new Error(`Pexels ${res.status} for ${sport}: ${await res.text()}`);
  }
  const data = await res.json();
  const urls = (data.photos || []).map((p) => p.src.large).filter(Boolean);
  if (urls.length === 0) {
    console.warn(`  [!] No photos for ${sport}`);
  }
  return urls;
}

async function main() {
  const pool = existsSync(OUTPUT_PATH)
    ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
    : {};

  const sports = Object.keys(SPORT_QUERIES);
  let newCount = 0;

  for (const sport of sports) {
    if (pool[sport]?.length >= 6) {
      console.log(`[skip] ${sport} (${pool[sport].length} cached)`);
      continue;
    }
    try {
      const urls = await fetchSport(sport, SPORT_QUERIES[sport]);
      pool[sport] = urls;
      newCount += 1;
      console.log(`[ok]   ${sport} -> ${urls.length} photos`);
      writeFileSync(OUTPUT_PATH, JSON.stringify(pool, null, 2));
      // Mild pacing so we stay well under 200/hr on any plan
      await new Promise((r) => setTimeout(r, 350));
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
