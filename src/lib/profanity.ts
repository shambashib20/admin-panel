/**
 * Profanity filter — powered by leo-profanity (English word list)
 * plus an extended Hindi / Hinglish word list.
 *
 * Strategy:
 *  1. Pull leo-profanity's maintained English list at module load.
 *  2. Merge with our Hindi/Hinglish list.
 *  3. Normalise leet-speak so "f@ck", "sh1t", etc. are caught.
 *  4. Use word-boundary regex to avoid false positives ("class" ≠ "ass").
 *  5. Return matched terms so the admin UI can show exactly what was flagged.
 *
 * Sync this file with astrobook-backend/src/core/utils/profanity.ts whenever you edit it.
 */

// leo-profanity ships no types — minimal inline shim.
// @ts-expect-error — no type declarations for leo-profanity
import leoProfanity from 'leo-profanity'
const getEnglishWords = (): string[] => (leoProfanity as { list: () => string[] }).list()

// ─── Hindi / Hinglish word list ───────────────────────────────────────────────

const HINDI_WORDS: string[] = [
  // ── Tier-1: most common abuses ──────────────────────────────────────────────
  'madarchod', 'maderchod', 'madarjaat', 'madarlod', 'maa ka bhosda',
  'maa ki aankh', 'teri maa', 'teri maa ki', 'maa ki aankh',
  'behenchod', 'behnchod', 'bhenchod', 'benchod', 'bencho', 'bhen ke laude',
  'chutiya', 'chutiye', 'chut', 'choot', 'chootiya',
  'gaandu', 'gandu', 'gaand', 'gand',
  'bhosdike', 'bhosdi', 'bhosadike', 'bhosdiwale', 'bhosad',
  'loda', 'lauda', 'lund', 'lavda', 'lodi', 'lun',
  'randi', 'raand', 'randwe', 'randi ka bacha', 'randi ki aulad',
  'harami', 'haramzada', 'haramkhor', 'haramjada', 'haramjadi', 'haramkhor',

  // ── Tier-2: strong abuses ────────────────────────────────────────────────────
  'bhadwa', 'bhadwi', 'bhadwe',
  'chakka', 'chhakka',
  'hijra',
  'jhant', 'jhantu', 'jhantoo',
  'kamina', 'kamine', 'kamini',
  'bakchod', 'bakchodi', 'bakchodiya', 'bakchodon',
  'chodu', 'chod', 'chodna', 'chodoge', 'chodega',
  'besharam',
  'kutte', 'kutti', 'kutiya', 'kutta ki aulad', 'kuttiya',
  'saala', 'saali', 'saale', 'sala', 'sali',
  'tatti', 'tattu',
  'ullu', 'ullu ka pattha', 'ullupan',
  'kameena', 'kameeni',

  // ── Tier-3: chat abbreviations ───────────────────────────────────────────────
  'mc', 'bc', 'bkl', 'bklol', 'mkl', 'mklc', 'lmc', 'mmc',

  // ── Tier-4: additional slang / regional ─────────────────────────────────────
  'raand',
  'lounda', 'laundebaaz', 'laundiya',
  'goo',
  'gadha',
  'suar', 'suwar',
  'nalayak',
  'nikamma',
  'kanjri', 'kanjri ka',
  'maa chod', 'behen chod', 'baap chod',
  'land', 'landwa',
  'phuddu', 'fuddu',
  'jhandu',
  'chaman', 'chaman choot',
  'lafanga',
  'badmash',
  'ghatiya',
  'bhand',
  'pendu',
  'lawda',
  'madarc',
  'behenc',
  'bhosdk',
]

// ─── Leet-speak normalisation ─────────────────────────────────────────────────

const LEET_MAP: Array<[RegExp, string]> = [
  [/[@4]/g, 'a'],
  [/3/g, 'e'],
  [/[1!|]/g, 'i'],
  [/0/g, 'o'],
  [/[$5]/g, 's'],
  [/7/g, 't'],
  [/[/\\]/g, 'l'],
  [/[)(]/g, ''],
]

function normalise(text: string): string {
  let t = text.toLowerCase()
  for (const [pattern, replacement] of LEET_MAP) {
    t = t.replace(pattern, replacement)
  }
  t = t.replace(/(.)\1{2,}/g, '$1$1')
  return t
}

// ─── Build combined word list ─────────────────────────────────────────────────

const ALL_WORDS = [...new Set([...getEnglishWords(), ...HINDI_WORDS])]

const COMPILED = ALL_WORDS.map((term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = term.includes(' ') ? escaped : `\\b${escaped}\\b`
  return { term, re: new RegExp(pattern, 'i') }
})

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ProfanityResult {
  flagged: boolean
  /** De-duped list of matched bad words — shown in the admin UI. */
  matches: string[]
}

export function checkProfanity(text: string): ProfanityResult {
  if (!text?.trim()) return { flagged: false, matches: [] }

  const normalised = normalise(text)
  const matches: string[] = []

  for (const { term, re } of COMPILED) {
    if (re.test(normalised)) matches.push(term)
  }

  return { flagged: matches.length > 0, matches }
}
