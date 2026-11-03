import { LostFoundItem, MatchSuggestion } from '../types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'it', 'in', 'on', 'at',
  'to', 'for', 'of', 'with', 'by', 'from', 'my', 'your', 'i', 'me', 'lost', 'found', 'please',
  'help', 'item', 'has', 'have', 'had', 'been', 'near', 'around', 'somewhere', 'this', 'that'
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function computeItemSimilarity(itemA: LostFoundItem, itemB: LostFoundItem): { score: number; reasons: string[] } {
  // Opposites match best (e.g., lost vs found)
  if (itemA.id === itemB.id) {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Category match (Weight: up to 35%)
  if (itemA.category && itemB.category && itemA.category.toLowerCase() === itemB.category.toLowerCase()) {
    score += 35;
    reasons.push(`Matching category: ${itemA.category.replace(/_/g, ' ')}`);
  }

  // 2. Location match / overlap (Weight: up to 25%)
  if (itemA.location && itemB.location) {
    const locA = itemA.location.toLowerCase();
    const locB = itemB.location.toLowerCase();

    if (locA === locB) {
      score += 25;
      reasons.push(`Exact campus location: "${itemA.location}"`);
    } else {
      const locKeywordsA = extractKeywords(locA);
      const locKeywordsB = extractKeywords(locB);
      const commonLoc = locKeywordsA.filter((k) => locKeywordsB.includes(k));
      if (commonLoc.length > 0) {
        score += 18;
        reasons.push(`Nearby location overlap (${commonLoc.join(', ')})`);
      }
    }
  }

  // 3. Keyword / Title & Description Overlap (Weight: up to 30%)
  const tokensA = new Set([
    ...extractKeywords(itemA.title),
    ...extractKeywords(itemA.description),
  ]);
  const tokensB = new Set([
    ...extractKeywords(itemB.title),
    ...extractKeywords(itemB.description),
  ]);

  const matchedKeywords: string[] = [];
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      matchedKeywords.push(token);
    }
  });

  if (matchedKeywords.length > 0) {
    const tokenScore = Math.min(30, matchedKeywords.length * 10);
    score += tokenScore;
    reasons.push(`Shared keywords: ${matchedKeywords.slice(0, 4).join(', ')}`);
  }

  // 4. Date Proximity (Weight: up to 10%)
  if (itemA.incidentDate && itemB.incidentDate) {
    try {
      const dateA = new Date(itemA.incidentDate).getTime();
      const dateB = new Date(itemB.incidentDate).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1) {
          score += 10;
          reasons.push('Reported within 24 hours of each other');
        } else if (diffDays <= 4) {
          score += 7;
          reasons.push(`Reported within ${Math.ceil(diffDays)} days of each other`);
        } else if (diffDays <= 8) {
          score += 4;
          reasons.push('Reported within about a week');
        }
      }
    } catch {
      // ignore invalid dates
    }
  }

  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  return { score: normalizedScore, reasons };
}

/**
 * Finds all potential matching items for a given item among a list of items.
 * Lost items match against Found items, and vice versa.
 */
export function findSimilarItems(
  targetItem: LostFoundItem,
  allItems: LostFoundItem[],
  threshold = 40
): MatchSuggestion[] {
  const oppositeType = targetItem.itemType === 'lost' ? 'found' : 'lost';

  const candidates = allItems.filter(
    (item) =>
      item.id !== targetItem.id &&
      item.itemType === oppositeType &&
      item.status !== 'returned' &&
      item.status !== 'closed'
  );

  const suggestions: MatchSuggestion[] = [];

  for (const candidate of candidates) {
    const { score, reasons } = computeItemSimilarity(targetItem, candidate);
    if (score >= threshold) {
      suggestions.push({
        targetItem,
        candidateItem: candidate,
        score,
        reasons,
      });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
