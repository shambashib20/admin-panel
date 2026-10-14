/**
 * Pure word-list profanity filter — no AI, no network calls.
 *
 * Strategy:
 *  1. Normalise leet-speak (3→e, @→a, 0→o, 1→i, $→s, etc.)
 *  2. Match each bad word using a word-boundary-aware regex so "class"
 *     doesn't trip on "ass", etc.
 *  3. Return the matched terms so the UI can surface them.
 */

// ─── Word list ────────────────────────────────────────────────────────────────
// Add or remove words here. Keep them lower-case, no spaces around entries.
const PROFANITY_LIST: string[] = [
  // English
  'fuck', 'fucker', 'fucking', 'fucked', 'fucks',
  'shit', 'shits', 'shitting', 'shitty',
  'bitch', 'bitches', 'bitching',
  'asshole', 'assholes', 'ass',
  'bastard', 'bastards',
  'damn', 'damned',
  'cunt', 'cunts',
  'dick', 'dicks',
  'cock', 'cocks',
  'pussy', 'pussies',
  'whore', 'whores',
  'slut', 'sluts',
  'nigger', 'niggers', 'nigga',
  'faggot', 'faggots', 'fag',
  'retard', 'retards', 'retarded',
  'rape', 'raped', 'rapist',
  'motherfucker', 'motherfucking',
  'son of a bitch',
  // Hindi / Hinglish (romanised)
  'madarchod', 'maderchod', 'mc',
  'behenchod', 'bc',
  'chutiya', 'chutiye', 'chut',
  'gaandu', 'gandu',
  'randi', 'randwa',
  'saala', 'saali',
  'harami', 'haramzada', 'haramkhor',
  'bhosdike', 'bhosdi',
  'loda', 'lode', 'lauda',
  'jhant', 'jhantu',
  'kamina', 'kamine',
  'kutte', 'kutti',
  'bkl', 'bklol',
  'mkl',
]

// ─── Leet-speak normalisation map ────────────────────────────────────────────
const LEET_MAP: [RegExp, string][] = [
  [/[@4]/g, 'a'],
  [/3/g, 'e'],
  [/[1!|]/g, 'i'],
  [/0/g, 'o'],
  [/[$5]/g, 's'],
  [/7/g, 't'],
  [/[\/\\]/g, 'l'],
  [/[)(]/g, ''],
]

function normalise(text: string): string {
  let t = text.toLowerCase()
  for (const [pattern, replacement] of LEET_MAP) {
    t = t.replace(pattern, replacement)
  }
  // collapse repeated characters (fuuuck → fuck)
  t = t.replace(/(.)\1{2,}/g, '$1$1')
  return t
}

// Pre-compile one regex per term.  For multi-word phrases we strip \b since
// spaces already delimit them.
const COMPILED = PROFANITY_LIST.map((term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hasSpace = term.includes(' ')
  const pattern = hasSpace ? escaped : `\\b${escaped}\\b`
  return { term, re: new RegExp(pattern, 'i') }
})

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ProfanityResult {
  flagged: boolean
  /** The matched bad words (de-duped). */
  matches: string[]
}

/**
 * Check a piece of text for profanity.
 * Pass `content` (post body) and optionally `tags` joined as a string.
 */
export function checkProfanity(text: string): ProfanityResult {
  if (!text || !text.trim()) return { flagged: false, matches: [] }

  const normalised = normalise(text)
  const matches: string[] = []

  for (const { term, re } of COMPILED) {
    if (re.test(normalised)) {
      matches.push(term)
    }
  }

  return { flagged: matches.length > 0, matches }
}

/** Convenience boolean — use when you only need pass/fail. */
export function isFlagged(text: string): boolean {
  return checkProfanity(text).flagged
}

/** Check post content + tags together. */
export function isPostFlagged(content: string, tags: string[]): boolean {
  const combined = [content, ...tags].join(' ')
  return isFlagged(combined)
}
