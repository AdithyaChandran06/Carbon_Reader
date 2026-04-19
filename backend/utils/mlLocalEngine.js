function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function getSeverity(zScore) {
  const abs = Math.abs(zScore);
  if (abs >= 2.5) return "high";
  if (abs >= 1.5) return "medium";
  return "normal";
}

function categoryKey(category) {
  return category || "Unknown";
}

function monthKey(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function nextMonth(yyyyMm, monthsAhead) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + monthsAhead, 1));
  return monthKey(d);
}

function linearRegressionPredict(series, forecastPoints) {
  if (!series.length) return [];

  if (series.length === 1) {
    return Array.from({ length: forecastPoints }, (_, i) => series[0].value);
  }

  const xs = series.map((_, i) => i);
  const ys = series.map((p) => p.value);
  const xMean = mean(xs);
  const yMean = mean(ys);

  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i += 1) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  return Array.from({ length: forecastPoints }, (_, i) => {
    const x = xs.length + i;
    return Math.max(0, intercept + slope * x);
  });
}

function normalizeRecords(records = []) {
  return records.map((record) => ({
    id: String(record.id || ""),
    category: categoryKey(record.category),
    subCategory: record.subCategory || "Unknown",
    activityData: toNumber(record.activityData),
    emissionFactor: toNumber(record.emissionFactor),
    co2e: toNumber(record.co2e),
    region: record.region || "Global",
    supplier: record.supplier || "Unknown",
    unit: record.unit || "unit",
    date: safeDate(record.date),
  }));
}

function fallbackPredict(records = []) {
  const normalized = normalizeRecords(records);

  const intensityByCategory = {};
  normalized.forEach((r) => {
    if (r.co2e > 0 && r.activityData > 0) {
      if (!intensityByCategory[r.category]) intensityByCategory[r.category] = [];
      intensityByCategory[r.category].push(r.co2e / r.activityData);
    }
  });

  const categoryIntensity = Object.fromEntries(
    Object.entries(intensityByCategory).map(([k, arr]) => [k, mean(arr)])
  );

  const predictions = normalized
    .filter((r) => r.co2e <= 0)
    .map((r) => {
      const byFactor = r.activityData * r.emissionFactor;
      const byCategory = r.activityData * (categoryIntensity[r.category] || 0);
      const predictedCo2e = byFactor > 0 ? byFactor : byCategory;

      return {
        id: r.id,
        predictedCo2e: round(predictedCo2e, 4),
        confidence: byFactor > 0 ? 0.78 : 0.62,
        method: byFactor > 0 ? "factor_multiplication" : "category_intensity",
      };
    });

  return {
    predictions,
    modelInfo: {
      engine: "local",
      strategy: "factor_and_intensity",
    },
  };
}

function fallbackAnomalies(records = [], contamination = 0.1) {
  const normalized = normalizeRecords(records);
  const co2Values = normalized.map((r) => r.co2e);
  const m = mean(co2Values);
  const sd = stdDev(co2Values) || 1;

  const raw = normalized.map((r) => {
    const z = (r.co2e - m) / sd;
    return {
      id: r.id,
      category: r.category,
      subCategory: r.subCategory,
      co2e: round(r.co2e, 2),
      isAnomaly: Math.abs(z) >= 1.75,
      anomalyScore: round(-Math.abs(z), 4),
      severity: getSeverity(z),
      _z: Math.abs(z),
    };
  });

  const minExpected = Math.max(1, Math.floor(normalized.length * Math.max(0.05, Math.min(contamination, 0.4))));
  const flaggedCount = raw.filter((r) => r.isAnomaly).length;

  if (normalized.length > 3 && flaggedCount < minExpected) {
    raw
      .slice()
      .sort((a, b) => b._z - a._z)
      .slice(0, minExpected)
      .forEach((r) => {
        r.isAnomaly = true;
        if (r.severity === "normal") r.severity = "medium";
      });
  }

  const results = raw.map(({ _z, ...rest }) => rest);
  const anomalies = results.filter((r) => r.isAnomaly).length;

  return {
    results,
    summary: {
      total: results.length,
      anomalies,
      normalRecords: results.length - anomalies,
    },
  };
}

function fallbackCluster(records = [], requestedClusters = 4) {
  const normalized = normalizeRecords(records).filter((r) => r.co2e >= 0);
  if (normalized.length < 2) {
    return { clusters: [], recordClusters: [], message: "Need at least 2 records to cluster" };
  }

  const n = Math.max(2, Math.min(requestedClusters, normalized.length));
  const sorted = [...normalized].sort((a, b) => a.co2e - b.co2e);
  const binSize = Math.ceil(sorted.length / n);

  const bins = Array.from({ length: n }, () => []);
  sorted.forEach((record, idx) => {
    const clusterIdx = Math.min(n - 1, Math.floor(idx / binSize));
    bins[clusterIdx].push(record);
  });

  const labelSet = [
    "Efficient baseline",
    "Moderate contributors",
    "Material hotspots",
    "Critical emitters",
    "Emerging risk",
  ];

  const clusters = bins
    .map((group, idx) => {
      if (!group.length) return null;
      const dominantCategories = Object.entries(
        group.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([key]) => key);

      return {
        clusterId: idx,
        label: labelSet[idx] || `Segment ${idx + 1}`,
        recordCount: group.length,
        totalCo2e: round(group.reduce((sum, r) => sum + r.co2e, 0), 2),
        avgCo2e: round(mean(group.map((r) => r.co2e)), 2),
        avgEmissionFactor: round(mean(group.map((r) => r.emissionFactor)), 4),
        dominantCategories,
      };
    })
    .filter(Boolean);

  const recordClusters = clusters.flatMap((cluster) => {
    const group = bins[cluster.clusterId];
    return group.map((record) => ({ id: record.id, cluster: cluster.clusterId }));
  });

  return { clusters, recordClusters };
}

function fallbackForecast(records = [], monthsAhead = 6, category = null) {
  const normalized = normalizeRecords(records).filter((r) => r.date instanceof Date);
  const filtered = category ? normalized.filter((r) => r.category === category) : normalized;

  const monthlyMap = filtered.reduce((acc, r) => {
    const key = monthKey(r.date);
    acc[key] = (acc[key] || 0) + r.co2e;
    return acc;
  }, {});

  const monthlySeries = Object.entries(monthlyMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([period, value]) => ({ period, value }));

  if (monthlySeries.length < 2) {
    return {
      historical: monthlySeries.map((p) => ({ period: p.period, co2e: round(p.value, 2) })),
      forecast: [],
      category: category || "All",
      monthsAhead,
      message: "Not enough historical monthly data (need >= 2 months)",
    };
  }

  const predictions = linearRegressionPredict(monthlySeries, monthsAhead);
  const avgResidual = stdDev(monthlySeries.map((p) => p.value)) * 0.25;
  const lastPeriod = monthlySeries[monthlySeries.length - 1].period;

  const forecast = predictions.map((value, i) => ({
    period: nextMonth(lastPeriod, i + 1),
    predictedCo2e: round(value, 2),
    lower: round(Math.max(0, value - avgResidual), 2),
    upper: round(value + avgResidual, 2),
  }));

  return {
    historical: monthlySeries.map((p) => ({ period: p.period, co2e: round(p.value, 2) })),
    forecast,
    category: category || "All",
    monthsAhead,
  };
}

function fallbackRecommendations(records = []) {
  const normalized = normalizeRecords(records);
  if (!normalized.length) {
    return { recommendations: [], totalPotentialReduction: 0 };
  }

  const byCategory = normalized.reduce((acc, r) => {
    const key = r.category;
    if (!acc[key]) acc[key] = { totalCo2e: 0, avgFactor: [], count: 0 };
    acc[key].totalCo2e += r.co2e;
    acc[key].avgFactor.push(r.emissionFactor);
    acc[key].count += 1;
    return acc;
  }, {});

  const sorted = Object.entries(byCategory)
    .map(([category, data]) => ({
      category,
      totalCo2e: data.totalCo2e,
      avgFactor: mean(data.avgFactor),
      count: data.count,
    }))
    .sort((a, b) => b.totalCo2e - a.totalCo2e);

  const recs = sorted.slice(0, 3).map((entry, index) => {
    const pct = index === 0 ? 18 : index === 1 ? 12 : 8;
    const potentialReduction = entry.totalCo2e * (pct / 100);
    const priority = index === 0 ? "High" : index === 1 ? "Medium" : "Low";

    return {
      rank: index + 1,
      title: `Optimize ${entry.category.toLowerCase()} emissions workflow`,
      description: `${entry.category} contributes ${round(entry.totalCo2e, 1)} tCO2e. Prioritize supplier and process optimization for this stream.`,
      type: entry.category.toLowerCase(),
      currentEmissions: round(entry.totalCo2e, 2),
      potentialReduction: round(potentialReduction, 2),
      percentageSavings: pct,
      costImpact: round(-5000 * (index + 1), 0),
      implementationDifficulty: index === 0 ? "Medium" : "Low",
      priority,
      mlConfidence: round(Math.max(0.62, 0.86 - index * 0.1), 2),
    };
  });

  return {
    recommendations: recs,
    totalPotentialReduction: round(recs.reduce((sum, r) => sum + r.potentialReduction, 0), 2),
  };
}

function fallbackConfidence(records = []) {
  const normalized = normalizeRecords(records);
  const results = normalized.map((r) => {
    let score = 0;
    if (r.activityData > 0) score += 25;
    if (r.emissionFactor > 0) score += 25;
    if (r.co2e > 0) score += 25;
    if (r.region && r.region !== "Unknown") score += 10;
    if (r.supplier && r.supplier !== "Unknown") score += 10;
    if (r.date) score += 5;

    const confidenceRating = score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";

    return {
      id: r.id,
      confidenceScore: score,
      confidenceRating,
    };
  });

  return { results };
}

module.exports = {
  fallbackPredict,
  fallbackAnomalies,
  fallbackCluster,
  fallbackForecast,
  fallbackRecommendations,
  fallbackConfidence,
};
