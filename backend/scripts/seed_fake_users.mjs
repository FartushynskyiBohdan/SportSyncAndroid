import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_PATH = join(__dirname, 'photo_pool.json');
const photoPool = JSON.parse(readFileSync(POOL_PATH, 'utf8'));

// bcrypt hash of "password123" — same as existing seed_users.sql
const PASSWORD_HASH = '$2b$10$NTN2Xxp4kVGBqaJNGiz.DejHyjno6NXIZwN8WoTABgY4tqdGKktq2';

const TOTAL_USERS = 100;
const CITIES = ['Limerick', 'Dublin', 'Cork', 'Galway', 'Waterford'];

const PHOTO_COUNT_DISTRIBUTION = [
  ...Array(30).fill(1),
  ...Array(35).fill(2),
  ...Array(20).fill(3),
  ...Array(10).fill(4),
  ...Array(5).fill(5),
];

// Gender IDs: 1 Male, 2 Female, 3 Non-binary, 4 Prefer not to say
const GENDER_DISTRIBUTION = [
  ...Array(45).fill(1),
  ...Array(45).fill(2),
  ...Array(5).fill(3),
  ...Array(5).fill(4),
];

// Weighted distribution of sports-per-user: 30% one, 50% two, 20% three
const SPORTS_PER_USER = [
  ...Array(30).fill(1),
  ...Array(50).fill(2),
  ...Array(20).fill(3),
];

// Skill level weighting: bias toward Intermediate/Advanced
const SKILL_WEIGHTS = [
  ...Array(20).fill(1), // Beginner
  ...Array(40).fill(2), // Intermediate
  ...Array(30).fill(3), // Advanced
  ...Array(10).fill(4), // Professional
];

// Frequency weighting: most people train 1-4x/wk
const FREQUENCY_WEIGHTS = [
  ...Array(10).fill(1), // Rarely
  ...Array(30).fill(2), // 1-2x
  ...Array(35).fill(3), // 3-4x
  ...Array(20).fill(4), // 5+
  ...Array(5).fill(5),  // Daily
];

const BIO_TEMPLATES = [
  'Passionate about {sport} and always looking for training partners.',
  '{sport} is my happy place. Weekends you\'ll find me out there no matter the weather.',
  'Started {sport} {years} years ago and never looked back. Let\'s train together.',
  'Not just about {sport} — coffee, hikes, and good company matter too.',
  '{sport} lifer. Currently chasing a new PB and better recovery habits.',
  'Early mornings, strong coffee, and {sport}. Looking for someone with the same rhythm.',
  'Balancing full-time work with serious {sport} goals. Consistency over intensity.',
  'Into {sport}, good music, and weekend adventures. Say hi.',
  '{sport} keeps me sane. Always down for a session or a post-training pint.',
  'Recently got back into {sport} after a long break. Would love a training partner.',
  'Grew up playing {sport} and never quit. Looking for someone who gets it.',
  '{sport} enthusiast. Big believer in the process over the outcome.',
  'On a journey with {sport} — improving, learning, meeting good people along the way.',
  'Coach-in-training. {sport} is more than a hobby for me.',
  'Weekday warrior, weekend athlete. {sport} is what I look forward to most.',
];

function pickWeighted(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomBirthDate(minAge, maxAge) {
  const today = new Date();
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = 1 + Math.floor(Math.random() * 28);
  return new Date(birthYear, birthMonth, birthDay).toISOString().slice(0, 10);
}

function randomLastActive() {
  const daysAgo = Math.random() * 14;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

function makeBio(sportName, years) {
  const template = BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
  return template.replace('{sport}', sportName).replace('{years}', years);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  console.log('Connected to DB');

  // Resolve sport name -> sport_id
  const [sportRows] = await conn.execute('SELECT sport_id, sport_name FROM sports');
  const sportIdByName = Object.fromEntries(sportRows.map((r) => [r.sport_name, r.sport_id]));

  // Resolve city IDs for the 5 target cities (Ireland)
  const [cityRows] = await conn.execute(
    `SELECT c.city_id, c.city_name FROM cities c
     JOIN countries co ON co.country_id = c.country_id
     WHERE co.country_code = 'IE' AND c.city_name IN (?, ?, ?, ?, ?)`,
    CITIES,
  );
  const cityIdByName = Object.fromEntries(cityRows.map((r) => [r.city_name, r.city_id]));
  for (const c of CITIES) {
    if (!cityIdByName[c]) throw new Error(`Missing city: ${c}`);
  }

  const photoDistributionShuffled = shuffle(PHOTO_COUNT_DISTRIBUTION);
  const genderDistributionShuffled = shuffle(GENDER_DISTRIBUTION);

  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const email = `fake${String(i).padStart(3, '0')}@sportsync.com`;

    // Idempotence: skip if this email already exists
    const [existing] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const genderId = genderDistributionShuffled[i - 1];
    const fakerSex = genderId === 1 ? 'male' : genderId === 2 ? 'female' : (Math.random() < 0.5 ? 'male' : 'female');
    const firstName = faker.person.firstName(fakerSex);
    const lastName = faker.person.lastName();
    const birthDate = randomBirthDate(18, 42);
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    const cityName = CITIES[(i - 1) % CITIES.length]; // 20 per city
    const cityId = cityIdByName[cityName];
    const lastActive = randomLastActive();

    // Primary sport + optional extras
    const sportsForUser = pickUnique(Object.keys(photoPool), pickWeighted(SPORTS_PER_USER));
    const primarySport = sportsForUser[0];
    const primaryYears = 1 + Math.floor(Math.random() * 12);
    const bio = makeBio(primarySport, primaryYears);

    await conn.beginTransaction();
    try {
      const [userIns] = await conn.execute(
        `INSERT INTO users (email, password_hash, role, account_status, onboarding_complete, last_active)
         VALUES (?, ?, 'user', 'active', TRUE, ?)`,
        [email, PASSWORD_HASH, lastActive],
      );
      const userId = userIns.insertId;

      await conn.execute(
        `INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender_id, city_id, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, firstName, lastName, birthDate, genderId, cityId, bio],
      );

      // Photos — drawn from the gender-appropriate bucket of the primary sport pool
      const photoCount = photoDistributionShuffled[i - 1];
      const sportEntry = photoPool[primarySport];
      let availablePhotos;
      if (sportEntry && typeof sportEntry === 'object' && !Array.isArray(sportEntry)) {
        // New gendered pool: { male: [...], female: [...] }
        const bucket = genderId === 1 ? 'male' : genderId === 2 ? 'female' : null;
        if (bucket && sportEntry[bucket]?.length) {
          availablePhotos = sportEntry[bucket];
        } else {
          // Non-binary / prefer-not-to-say: merge both buckets
          availablePhotos = [...(sportEntry.male || []), ...(sportEntry.female || [])];
        }
      } else {
        // Fallback for legacy flat array pool
        availablePhotos = Array.isArray(sportEntry) ? sportEntry : [];
      }
      const userPhotos = pickUnique(availablePhotos, photoCount);
      for (let p = 0; p < userPhotos.length; p++) {
        await conn.execute(
          `INSERT INTO user_photos (user_id, photo_url, display_order) VALUES (?, ?, ?)`,
          [userId, userPhotos[p], p],
        );
      }

      // user_sports rows
      const userSportData = sportsForUser.map((name, idx) => ({
        sport_id: sportIdByName[name],
        skill_level_id: pickWeighted(SKILL_WEIGHTS),
        years_experience: idx === 0 ? primaryYears : 1 + Math.floor(Math.random() * 8),
        frequency_id: pickWeighted(FREQUENCY_WEIGHTS),
      }));
      for (const s of userSportData) {
        await conn.execute(
          `INSERT INTO user_sports (user_id, sport_id, skill_level_id, years_experience, frequency_id)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, s.sport_id, s.skill_level_id, s.years_experience, s.frequency_id],
        );
      }

      // Preferences — target opposite gender for M/F, otherwise random
      let interestedInGenderId;
      if (genderId === 1) interestedInGenderId = 2;
      else if (genderId === 2) interestedInGenderId = 1;
      else interestedInGenderId = Math.random() < 0.5 ? 1 : 2;

      const minAge = Math.max(18, age - 8);
      const maxAge = Math.min(65, age + 8);
      const maxDistanceKm = 25 + Math.floor(Math.random() * 51); // 25..75
      const goalId = 1 + Math.floor(Math.random() * 4);

      await conn.execute(
        `INSERT INTO preferences (user_id, gender_id, min_age, max_age, max_distance_km,
         goal_id, min_skill_level_id, preferred_frequency_id, min_photos, show_out_of_range)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, FALSE)`,
        [
          userId,
          interestedInGenderId,
          minAge,
          maxAge,
          maxDistanceKm,
          goalId,
          1,
          pickWeighted(FREQUENCY_WEIGHTS),
        ],
      );

      // Preference sports: the user's own sports
      for (const s of userSportData) {
        await conn.execute(
          `INSERT INTO preference_sports (user_id, sport_id) VALUES (?, ?)`,
          [userId, s.sport_id],
        );
      }

      await conn.commit();
      inserted += 1;
      if (inserted % 10 === 0) console.log(`  inserted ${inserted}/${TOTAL_USERS}`);
    } catch (err) {
      await conn.rollback();
      console.error(`Failed on ${email}: ${err.message}`);
    }
  }

  await conn.end();
  console.log(`\nDone. Inserted ${inserted} users, skipped ${skipped} (already existed).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
