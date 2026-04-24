import {
  ArrowRight,
  Bolt,
  Dumbbell,
  Filter,
  Heart,
  MapPin,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const athletePhotos = {
  discover:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  matchA:
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  matchB:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  profile:
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
};

function PhoneFrame({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="group relative mx-auto w-full max-w-[320px] rounded-[2.2rem] border border-white/10 bg-[#0d1620] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-8 top-3 h-7 rounded-b-[1rem] bg-[#05080b]" />
      <div className="relative overflow-hidden rounded-[1.7rem] border border-white/8 bg-[#f3efe4]">
        <div className="flex items-center justify-between border-b border-[#d7d1c1] bg-[#efe8d8]/80 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#44505d]">
          <span>{label}</span>
          <span>{title}</span>
        </div>
        <div className="min-h-[580px] bg-[#f3efe4]">{children}</div>
      </div>
    </article>
  );
}

function Chip({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'accent' | 'dark' }) {
  const toneClass =
    tone === 'accent'
      ? 'bg-[#12293d] text-[#7ff0aa] border-[#1d465f]'
      : tone === 'dark'
      ? 'bg-[#13202c] text-[#f3efe4] border-[#213446]'
      : 'bg-white/70 text-[#24313d] border-[#d6cfbd]';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d6cfbd] bg-white/70 p-4 shadow-[0_10px_30px_rgba(18,28,38,0.08)]">
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#31404d]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function PrototypeRedesign() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#081018] text-[#f6f1e7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#1ec28b]/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-[#ff7b57]/18 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-[#2a7fff]/16 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-6 py-14 md:px-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-[#284153] bg-[#10202c]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#8dd8c1]">
              High-fidelity redesign board
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.04em] text-[#f6f1e7] md:text-7xl">
              SportSync needs a cleaner story, not more bugs.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c1c8cf]">
              This route is a standalone redesign concept built for coursework submission. It ignores the broken flows,
              removes backend dependency, and focuses on a mobile-first visual system you can screenshot, record, or
              rebuild in Figma fast.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/prototype-mobile-demo"
                className="inline-flex items-center gap-2 rounded-full bg-[#ff7b57] px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Open interactive demo
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#prototype-board"
                className="inline-flex items-center gap-2 rounded-full bg-[#f6f1e7] px-6 py-3 text-sm font-bold text-[#081018] transition-transform hover:-translate-y-0.5"
              >
                Jump to board
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/design-system"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-[#f6f1e7] transition-colors hover:bg-white/10"
              >
                Compare with old system
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <Sparkles className="h-5 w-5 text-[#ff8e66]" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#8fa4b4]">Visual direction</p>
                <p className="mt-2 text-base leading-7 text-[#e7e0d3]">Warm neutrals, deep sport-night surfaces, and sharper hierarchy.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <Bolt className="h-5 w-5 text-[#89f3b4]" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#8fa4b4]">User flow</p>
                <p className="mt-2 text-base leading-7 text-[#e7e0d3]">Onboarding, discover, match, message, and profile in one simple path.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <Shield className="h-5 w-5 text-[#8ec0ff]" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#8fa4b4]">Submission value</p>
                <p className="mt-2 text-base leading-7 text-[#e7e0d3]">Good enough to present as the redesign even if the app itself stays unstable.</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8fa4b4]">Submission rescue plan</p>
            <div className="mt-5 space-y-4 text-[#f3ede2]">
              <div className="rounded-[1.3rem] border border-white/8 bg-[#0f1b25]/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8dd8c1]">Primary deliverable</p>
                <p className="mt-2 text-base leading-7">Use this board as the blueprint for a Figma navigation demo instead of trying to repair the whole app.</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-[#0f1b25]/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffb18d]">What to say in critique</p>
                <p className="mt-2 text-base leading-7">The first iteration over-scoped implementation, so the final outcome prioritised a cleaner mobile UX and clearer information architecture.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-[#091219] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8fa4b4]">Palette</p>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  ['#081018', 'Ink'],
                  ['#10202C', 'Night'],
                  ['#F3EFE4', 'Canvas'],
                  ['#FF7B57', 'Drive'],
                  ['#1EC28B', 'Active'],
                  ['#2A7FFF', 'Trust'],
                  ['#213446', 'Steel'],
                  ['#DBCFAE', 'Warm'],
                ].map(([color, label]) => (
                  <div key={label} className="space-y-2">
                    <div className="h-12 rounded-2xl border border-white/10" style={{ backgroundColor: color }} />
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#aab5bf]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="prototype-board" className="mt-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8fa4b4]">Prototype board</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#f6f1e7]">Six screens you can turn into the submission.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#b9c3cb]">
              These screens are intentionally static and self-contained. That makes them faster to screenshot, easier to rebuild
              in Figma, and much safer than debugging the live application under deadline.
            </p>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-3">
            <PhoneFrame label="01" title="Welcome">
              <div className="bg-[radial-gradient(circle_at_top,_#24435a,_#0f1a24_58%,_#091018)] px-6 pb-8 pt-6 text-white">
                <div className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/75">
                  athlete-first matching
                </div>
                <h3 className="mt-6 text-[2.1rem] font-black tracking-[-0.05em]">Train hard. Date smarter.</h3>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  A lighter, faster onboarding entry that feels like a real mobile product instead of a web form squeezed into a phone.
                </p>
                <div className="mt-8 rounded-[1.6rem] bg-white/10 p-4 backdrop-blur">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-[#f8f2e8] px-4 py-3 text-sm text-[#32414c]">runner@sportsync.app</div>
                    <div className="rounded-2xl border border-white/10 bg-[#f8f2e8] px-4 py-3 text-sm text-[#7d7b74]">Password</div>
                  </div>
                  <button className="mt-4 w-full rounded-full bg-[#ff7b57] px-4 py-3 text-sm font-bold text-white">
                    Continue
                  </button>
                  <button className="mt-3 w-full rounded-full border border-white/16 px-4 py-3 text-sm font-semibold text-white/85">
                    Create account
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-3 text-xs text-white/65">
                  <Shield className="h-4 w-4 text-[#8ec0ff]" />
                  Safety tools, moderation, and account controls built in
                </div>
              </div>
            </PhoneFrame>

            <PhoneFrame label="02" title="Onboarding">
              <div className="px-5 py-5 text-[#1d2b37]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#63707c]">Step 2 of 5</p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">Define your athlete baseline</h3>
                  </div>
                  <div className="rounded-full bg-[#10202c] px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#8df1bb]">
                    40%
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dfd8c8]">
                  <div className="h-full w-2/5 rounded-full bg-[#1ec28b]" />
                </div>

                <div className="mt-5 space-y-4">
                  <SectionCard title="Primary sport">
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="accent">Running</Chip>
                      <Chip>Cycling</Chip>
                      <Chip>Hyrox</Chip>
                      <Chip>Climbing</Chip>
                    </div>
                  </SectionCard>
                  <SectionCard title="Training frequency">
                    <div className="flex flex-wrap gap-2">
                      <Chip>1-2x week</Chip>
                      <Chip tone="accent">3-4x week</Chip>
                      <Chip>Daily</Chip>
                    </div>
                  </SectionCard>
                  <SectionCard title="What you want in matches">
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="accent">Shared sport</Chip>
                      <Chip tone="accent">Lifestyle fit</Chip>
                      <Chip>Competition level</Chip>
                    </div>
                  </SectionCard>
                </div>

                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#10202c] px-4 py-3 text-sm font-bold text-[#f3efe4]">
                  Save and continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </PhoneFrame>

            <PhoneFrame label="03" title="Discover">
              <div className="bg-[#0e1720] px-4 pb-5 pt-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#83a6b9]">SportSync</p>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Discover</h3>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white/85">
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#152332] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                  <div className="relative h-[23rem]">
                    <ImageWithFallback src={athletePhotos.discover} alt="Athlete discover card" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#091018] via-transparent to-transparent" />
                    <div className="absolute inset-x-4 top-4 flex gap-2">
                      <Chip tone="dark">5 km away</Chip>
                      <Chip tone="dark">4x week</Chip>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-3xl font-black tracking-[-0.05em]">Lina, 26</p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-white/72">
                        <MapPin className="h-4 w-4" />
                        Manchester - half marathon prep
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Chip tone="dark">Running</Chip>
                        <Chip tone="dark">Strength</Chip>
                        <Chip tone="dark">Serious dating</Chip>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 px-5 py-4">
                    <button className="grid h-14 w-14 place-items-center rounded-full border border-[#284153] bg-[#14222f] text-[#c7d0d7]">
                      <Star className="h-5 w-5" />
                    </button>
                    <button className="grid h-16 w-16 place-items-center rounded-full bg-[#ff7b57] text-white shadow-[0_14px_30px_rgba(255,123,87,0.35)]">
                      <Heart className="h-7 w-7 fill-current" />
                    </button>
                    <button className="grid h-14 w-14 place-items-center rounded-full border border-[#284153] bg-[#14222f] text-[#8df1bb]">
                      <Bolt className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </PhoneFrame>

            <PhoneFrame label="04" title="Matches">
              <div className="px-5 py-5 text-[#1d2b37]">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#63707c]">Mutual likes</p>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">Matches</h3>
                  </div>
                  <div className="rounded-full bg-[#10202c] px-3 py-2 text-xs font-bold text-[#8df1bb]">12 active</div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      name: 'Mia',
                      city: 'Leeds',
                      photo: athletePhotos.matchA,
                      sports: 'Running, pilates',
                    },
                    {
                      name: 'Jordan',
                      city: 'Bristol',
                      photo: athletePhotos.matchB,
                      sports: 'Cycling, gym',
                    },
                    {
                      name: 'Noah',
                      city: 'London',
                      photo: athletePhotos.discover,
                      sports: 'Cross-training, football',
                    },
                  ].map((match) => (
                    <div key={match.name} className="flex items-center gap-3 rounded-[1.5rem] border border-[#d6cfbd] bg-white/70 p-3">
                      <ImageWithFallback src={match.photo} alt={match.name} className="h-14 w-14 rounded-[1rem] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#13202c]">{match.name}</p>
                        <p className="mt-0.5 text-xs text-[#5f6e79]">{match.city}</p>
                        <p className="mt-1 truncate text-xs text-[#32414c]">{match.sports}</p>
                      </div>
                      <button className="rounded-full bg-[#10202c] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#f3efe4]">
                        Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </PhoneFrame>

            <PhoneFrame label="05" title="Messages">
              <div className="flex h-full flex-col bg-[#f7f1e8]">
                <div className="border-b border-[#d7d1c1] bg-[#13202c] px-5 py-4 text-white">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8fd1ff]">Conversation</p>
                  <div className="mt-2 flex items-center gap-3">
                    <ImageWithFallback src={athletePhotos.matchA} alt="Mia" className="h-12 w-12 rounded-[1rem] object-cover" />
                    <div>
                      <p className="font-bold">Mia</p>
                      <p className="text-xs text-white/65">Runner, 10 km prep</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 px-4 py-5 text-sm">
                  <div className="max-w-[80%] rounded-[1.3rem] rounded-bl-md bg-white px-4 py-3 text-[#21303d] shadow-sm">
                    You are doing Hyrox too? That already makes this app feel more useful than Tinder.
                  </div>
                  <div className="ml-auto max-w-[78%] rounded-[1.3rem] rounded-br-md bg-[#10202c] px-4 py-3 text-white">
                    Exactly the point. Shared pace and shared routine are hard to explain in normal dating apps.
                  </div>
                  <div className="max-w-[74%] rounded-[1.3rem] rounded-bl-md bg-white px-4 py-3 text-[#21303d] shadow-sm">
                    Want to compare training schedules this week?
                  </div>
                </div>

                <div className="border-t border-[#d7d1c1] bg-white/80 px-4 py-4">
                  <div className="flex items-center gap-3 rounded-full border border-[#d4cdbc] bg-[#f7f1e8] px-4 py-3">
                    <MessageSquare className="h-4 w-4 text-[#6b7783]" />
                    <span className="flex-1 text-sm text-[#6b7783]">Send a message...</span>
                    <button className="rounded-full bg-[#ff7b57] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </PhoneFrame>

            <PhoneFrame label="06" title="Profile">
              <div className="bg-[#f3efe4] text-[#1d2b37]">
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback src={athletePhotos.profile} alt="Profile hero" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a24]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-3xl font-black tracking-[-0.05em] text-white">Chris, 27</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Chip tone="dark">Cycling</Chip>
                      <Chip tone="dark">Gym</Chip>
                      <Chip tone="dark">Long-term</Chip>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <SectionCard title="About">
                    <p className="text-sm leading-7 text-[#34424e]">
                      Early rides, strength sessions after work, and race weekends when the calendar allows. Looking for
                      someone who genuinely enjoys active routine, not just the aesthetic of it.
                    </p>
                  </SectionCard>

                  <SectionCard title="Compatibility">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-[#10202c] px-3 py-4 text-white">
                        <p className="text-xl font-black">92%</p>
                        <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/65">sport fit</p>
                      </div>
                      <div className="rounded-2xl bg-[#10202c] px-3 py-4 text-white">
                        <p className="text-xl font-black">4x</p>
                        <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/65">weekly</p>
                      </div>
                      <div className="rounded-2xl bg-[#10202c] px-3 py-4 text-white">
                        <p className="text-xl font-black">8 km</p>
                        <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/65">distance</p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Account and safety">
                    <div className="flex items-center justify-between rounded-[1.1rem] bg-[#f6f1e7] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-[#2a7fff]" />
                        <span className="text-sm font-semibold text-[#23313d]">Blocked users and reports</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#4f5f6d]" />
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-[1.1rem] bg-[#f6f1e7] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#1ec28b]" />
                        <span className="text-sm font-semibold text-[#23313d]">Discovery preferences</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#4f5f6d]" />
                    </div>
                  </SectionCard>
                </div>
              </div>
            </PhoneFrame>
          </div>
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8fa4b4]">Why this helps</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#f6f1e7]">You can now present a redesign instead of defending technical debt.</h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[#c5ccd2]">
              <p>The board gives you a coherent visual language, a focused mobile information architecture, and a believable prototype path.</p>
              <p>It also supports a stronger narrative in the written proposal: the first build over-expanded, so the final submission prioritised UX clarity and high-fidelity mobile design.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Keep the scope',
                copy: 'Treat auth, onboarding, discover, messages, and profile as the core. Everything else is supporting detail.',
                icon: Dumbbell,
                tone: 'text-[#8df1bb]',
              },
              {
                title: 'Use screenshots',
                copy: 'Take clean captures of these frames or rebuild them quickly in Figma for the actual coursework submission.',
                icon: Sparkles,
                tone: 'text-[#ffb18d]',
              },
              {
                title: 'Write the pivot',
                copy: 'Frame the redesign as an intentional refinement after the first implementation became too complex and unstable.',
                icon: Shield,
                tone: 'text-[#8ec0ff]',
              },
            ].map(({ title, copy, icon: Icon, tone }) => (
              <div key={title} className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5">
                <Icon className={`h-5 w-5 ${tone}`} />
                <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#f6f1e7]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#c5ccd2]">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
