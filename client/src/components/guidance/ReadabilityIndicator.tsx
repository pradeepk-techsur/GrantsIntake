import { useState, useEffect, useRef } from 'react';

interface ReadabilityIndicatorProps {
  text: string;
}

/**
 * Counts syllables in a word using a simple heuristic.
 * Counts vowel groups as syllable nuclei, with adjustments for common patterns.
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Remove silent 'e' at end
  word = word.replace(/e$/, '');

  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

/**
 * Computes Flesch-Kincaid Grade Level.
 * FK = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 *
 * Returns null if text is too short to compute meaningful grade.
 */
function computeFleschKincaidGrade(text: string): number | null {
  const cleaned = text.trim();
  if (!cleaned) return null;

  // Count sentences (split on . ! ? with trailing spaces or end of string)
  const sentences = cleaned.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Count words
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  if (wordCount < 3) return null;

  // Count syllables
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;

  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Advisory readability badge showing Flesch-Kincaid grade level.
 * Updates as the user types (debounced 300ms).
 * Does NOT block save or publication — purely advisory.
 * WCAG: labeled as advisory indicator.
 */
export function ReadabilityIndicator({ text }: ReadabilityIndicatorProps) {
  const [grade, setGrade] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setGrade(computeFleschKincaidGrade(text));
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text]);

  if (grade === null) {
    return null;
  }

  // Determine color coding (advisory only)
  let tagClass = 'gf-badge gf-badge--neutral';
  let label: string;

  if (grade <= 8) {
    label = `Grade ${grade} ✓`;
  } else if (grade <= 12) {
    label = `Grade ${grade} (plain language recommended)`;
  } else {
    label = `Grade ${grade} (simplify for broader audience)`;
  }

  return (
    <div
      style={{ marginTop: '0.5rem' }}
      aria-label="Advisory reading level indicator"
      data-testid="readability-indicator"
    >
      <span className={tagClass} aria-live="polite">
        Reading Level: {label}
      </span>
      <span className="gf-hint" style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
        (advisory only)
      </span>
    </div>
  );
}
