import type { Match } from "./app-model";

export type BetMarketType = "match-result" | "correct-score" | "over-under";

export type MarketSelection = {
  marketType: BetMarketType;
  selection: "home" | "draw" | "away" | string;
  line?: number;
};

export function parseScore(score: string) {
  const match = score.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) return null;

  return {
    home: Number(match[1]),
    away: Number(match[2]),
  };
}

function roundOdds(value: number) {
  return Number(Math.max(1.01, value).toFixed(2));
}

export function getCorrectScoreOdds(match: Match, scoreline: string) {
  if (match.correctScoreOdds?.[scoreline]) {
    return match.correctScoreOdds[scoreline];
  }

  const parsed = scoreline.split("-").map((value) => Number(value.trim()));
  const total = parsed.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
  const diff = Math.abs((parsed[0] ?? 0) - (parsed[1] ?? 0));
  const base = match.homeOdds + match.drawOdds + match.awayOdds;
  const odds = base + total * 1.15 + diff * 0.85;
  return roundOdds(odds);
}

export function getOverUnderOdds(match: Match, line: number, direction: "over" | "under") {
  const lineOdds = match.overUnderOdds?.[line];
  if (lineOdds) {
    return direction === "over" ? lineOdds.over : lineOdds.under;
  }

  const base = (match.homeOdds + match.awayOdds) / 2;
  const odds =
    direction === "over"
      ? base + line * 0.6
      : base + Math.max(0.75, 4.5 - line * 0.5);
  return roundOdds(odds);
}

export function getMatchResultOdds(match: Match, selection: "home" | "draw" | "away") {
  return selection === "home"
    ? match.homeOdds
    : selection === "draw"
      ? match.drawOdds
      : match.awayOdds;
}

export function getMarketPickLabel(
  match: Match,
  offer: MarketSelection,
): { pick: string; odds: number; label: string } {
  if (offer.marketType === "match-result") {
    const odds = getMatchResultOdds(match, offer.selection as "home" | "draw" | "away");
    const pick =
      offer.selection === "home" ? match.home : offer.selection === "draw" ? "Draw" : match.away;
    return { pick, odds, label: "Match result" };
  }

  if (offer.marketType === "correct-score") {
    const odds = getCorrectScoreOdds(match, offer.selection);
    return { pick: offer.selection, odds, label: "Correct score" };
  }

  const direction = offer.selection === "over" ? "over" : "under";
  const odds = getOverUnderOdds(match, offer.line ?? 2.5, direction);
  return {
    pick: `${direction.toUpperCase()} ${offer.line?.toFixed(1) ?? "2.5"}`,
    odds,
    label: "Over/Under",
  };
}

export function getCorrectScoreOptions(match: Match) {
  return [
    "0-0",
    "1-0",
    "0-1",
    "1-1",
    "2-0",
    "0-2",
    "2-1",
    "1-2",
  ].map((scoreline) => ({
    scoreline,
    odds: getCorrectScoreOdds(match, scoreline),
  }));
}

export function getTotalsOptions(match: Match) {
  return [2.5, 3.5].map((line) => ({
    line,
    over: getOverUnderOdds(match, line, "over"),
    under: getOverUnderOdds(match, line, "under"),
  }));
}
