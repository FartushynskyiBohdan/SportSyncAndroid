// min 8 characters, 1 uppercase, 1 lowercase, 1 number 
// (no symbol required)

function getStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const BAR_COLORS = ['', 'bg-rose-500', 'bg-orange-500', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-400'];
const TEXT_COLORS = ['', 'text-rose-400', 'text-orange-400', 'text-yellow-300', 'text-green-400', 'text-emerald-400'];

export function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? BAR_COLORS[strength] : 'bg-white/15'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs pl-1 ${TEXT_COLORS[strength]}`}>{LABELS[strength]}</p>
    </div>
  );
}
