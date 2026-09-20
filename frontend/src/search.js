// Matches each typed word independently against the searchable text, in any order —
// mirrors the backend's word-by-word ILIKE matching in exercises.py so "chest lever"
// finds "Lever Chest Press" the same way typing it while searching the full library would.
export function matchesQuery(text, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = text.toLowerCase();
  return words.every((w) => haystack.includes(w));
}
