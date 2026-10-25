/**
 * FEEDBACK ENGINE (Outcome Tracker)
 * Evaluates historical recommendation outcomes and feeds closed-loop insights.
 */

export async function evaluateHistoricalOutcomes(prisma) {
  const outcomes = await prisma.recommendationOutcome.findMany({
    include: {
      recommendation: {
        include: {
          task: true,
          goal: true
        }
      }
    },
    orderBy: { recordedAt: 'desc' }
  });

  const total = outcomes.length;
  const improvedCount = outcomes.filter(o => o.outcome === 'IMPROVED').length;
  const unchangedCount = outcomes.filter(o => o.outcome === 'UNCHANGED').length;
  const worsenedCount = outcomes.filter(o => o.outcome === 'WORSENED').length;

  const successRate = total > 0 ? Math.round((improvedCount / total) * 100) : 100;

  return {
    totalEvaluated: total,
    improvedCount,
    unchangedCount,
    worsenedCount,
    successRatePct: successRate,
    recentOutcomes: outcomes.slice(0, 10)
  };
}
