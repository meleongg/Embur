import { kgToLbs } from "@/utils/units";

export type ChartBucket = "day" | "week" | "month";

export type ExerciseChartPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  formattedDate: string;
  tooltipLabel: string;
};

export type ExerciseChartResult = {
  points: ExerciseChartPoint[];
  bucket: ChartBucket;
  bucketLabel: string;
};

type SessionRow = {
  exercise_id: string;
  reps: number;
  weight: number;
  session?: { started_at?: string } | { started_at?: string }[] | null;
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getBucketKey(dateStr: string, bucket: ChartBucket): string {
  const date = new Date(`${dateStr}T00:00:00`);

  if (bucket === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  }

  if (bucket === "week") {
    return startOfWeek(date).toISOString().split("T")[0];
  }

  return dateStr;
}

export function chooseChartBucket(
  sessionDayCount: number,
  timeframe: string
): ChartBucket {
  if (timeframe === "week" || sessionDayCount <= 14) {
    return "day";
  }

  if (timeframe === "month" && sessionDayCount <= 31) {
    return "day";
  }

  if (sessionDayCount <= 45 || timeframe === "3months") {
    return "week";
  }

  if (sessionDayCount <= 90 || timeframe === "year") {
    return "week";
  }

  return "month";
}

function formatAxisLabel(dateStr: string, bucket: ChartBucket): string {
  const date = new Date(`${dateStr}T00:00:00`);

  if (bucket === "month") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipLabel(dateStr: string, bucket: ChartBucket): string {
  const date = new Date(`${dateStr}T00:00:00`);

  if (bucket === "month") {
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  if (bucket === "week") {
    return `Week of ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const BUCKET_DESCRIPTIONS: Record<ChartBucket, string> = {
  day: "Each point is a workout day",
  week: "Grouped by week for readability",
  month: "Grouped by month for readability",
};

export function buildExerciseChartData(
  exerciseId: string,
  sessionsData: SessionRow[],
  timeframe: string,
  useMetric: boolean
): ExerciseChartResult {
  const exerciseSessions = sessionsData.filter(
    (s) => s.exercise_id === exerciseId
  );

  const groupedByDate: Record<string, SessionRow[]> = {};
  exerciseSessions.forEach((session) => {
    const startedAt = Array.isArray(session.session)
      ? session.session[0]?.started_at
      : session.session?.started_at;
    if (!startedAt) return;

    const date = new Date(startedAt).toISOString().split("T")[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(session);
  });

  let filteredDates = Object.keys(groupedByDate);
  if (timeframe !== "all") {
    const now = new Date();
    const cutoff = new Date();

    if (timeframe === "week") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeframe === "month") {
      cutoff.setMonth(now.getMonth() - 1);
    } else if (timeframe === "3months") {
      cutoff.setMonth(now.getMonth() - 3);
    } else if (timeframe === "year") {
      cutoff.setFullYear(now.getFullYear() - 1);
    }

    filteredDates = filteredDates.filter((date) => new Date(date) >= cutoff);
  }

  const bucket = chooseChartBucket(filteredDates.length, timeframe);
  const bucketedSessions: Record<string, SessionRow[]> = {};

  filteredDates.forEach((date) => {
    const key = getBucketKey(date, bucket);
    if (!bucketedSessions[key]) {
      bucketedSessions[key] = [];
    }
    bucketedSessions[key].push(...groupedByDate[date]);
  });

  const points = Object.keys(bucketedSessions)
    .map((date) => {
      const sessions = bucketedSessions[date];
      const maxWeightKg = Math.max(...sessions.map((s) => s.weight));
      const totalVolumeKg = sessions.reduce(
        (sum, s) => sum + s.reps * s.weight,
        0
      );

      return {
        date,
        maxWeight: useMetric ? maxWeightKg : kgToLbs(maxWeightKg),
        totalVolume: useMetric ? totalVolumeKg : kgToLbs(totalVolumeKg),
        formattedDate: formatAxisLabel(date, bucket),
        tooltipLabel: formatTooltipLabel(date, bucket),
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    points,
    bucket,
    bucketLabel: BUCKET_DESCRIPTIONS[bucket],
  };
}

export function getProgressChartXAxisSettings(
  dataLength: number,
  isCompact: boolean
) {
  const targetTicks = isCompact ? 4 : 7;
  let interval: number | "preserveStartEnd" = 0;
  let angle = 0;
  let bottom = 12;

  if (dataLength > targetTicks) {
    interval = Math.max(0, Math.floor(dataLength / targetTicks) - 1);
  }

  if (dataLength > 10) {
    angle = isCompact ? -45 : -35;
    bottom = isCompact ? 52 : 40;
  }

  if (dataLength > 24) {
    angle = -45;
    bottom = 56;
    interval =
      interval === 0
        ? Math.max(0, Math.floor(dataLength / (isCompact ? 4 : 6)) - 1)
        : interval;
  }

  return {
    interval,
    angle,
    height: bottom + 8,
    tick: { fontSize: isCompact ? 9 : 10 },
    textAnchor: (angle ? "end" : "middle") as "end" | "middle",
    bottom,
  };
}
