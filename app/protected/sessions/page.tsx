"use client";

import PageTitle from "@/components/ui/page-title";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { kgToLbs } from "@/utils/units";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Pagination,
  Skeleton,
} from "@nextui-org/react";
import {
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
} from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchSessionsList } from "@/lib/queries/sessions";
import { toast } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const EMPTY_SESSIONS: never[] = [];
const SESSIONS_PER_PAGE = 10;

// Helper functions for stats calculations
const calculateWorkoutsThisWeek = (sessions: any[]) => {
  if (!sessions.length) return 0;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.started_at);
    return sessionDate >= startOfWeek;
  }).length;
};

const calculateTotalWeight = (sessions: any[]) => {
  return sessions.reduce((total, session) => {
    return total + (session.total_volume ?? 0);
  }, 0);
};

const calculateTotalSets = (sessions: any[]) => {
  return sessions.reduce(
    (total, session) => total + (session.total_sets ?? 0),
    0
  );
};

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
};

const formatDuration = (start: string, end: string) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const getSessionYear = (startedAt: string): number | null => {
  const date = new Date(startedAt);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

export default function SessionsPage() {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: fetchSessionsList,
  });
  const sessions = data ?? EMPTY_SESSIONS;

  const [selectedYear, setSelectedYear] = useState<number | "all" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { useMetric, isLoading: loadingPreferences } = useUnitPreference();

  const years = useMemo(() => {
    const sessionYears = sessions
      .map((session) => getSessionYear(session.started_at))
      .filter((year): year is number => year !== null);

    return Array.from(new Set(sessionYears)).sort((a, b) => b - a);
  }, [sessions]);

  useEffect(() => {
    if (years.length === 0) {
      if (selectedYear !== null) setSelectedYear(null);
      return;
    }
    if (
      selectedYear === null ||
      (selectedYear !== "all" && !years.includes(selectedYear))
    ) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const filteredSessions = useMemo(() => {
    if (selectedYear === null || selectedYear === "all") return sessions;
    return sessions.filter(
      (session) => getSessionYear(session.started_at) === selectedYear
    );
  }, [sessions, selectedYear]);

  useEffect(() => {
    if (isError) {
      toast.error(
        queryError instanceof Error
          ? queryError.message
          : "Could not load your workout history"
      );
    }
  }, [isError, queryError]);

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Could not load your workout history"
    : null;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / SESSIONS_PER_PAGE)
  );
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedSessions = useMemo(
    () =>
      filteredSessions.slice(
        (page - 1) * SESSIONS_PER_PAGE,
        page * SESSIONS_PER_PAGE
      ),
    [filteredSessions, page]
  );

  const paginatedSessionsByDate = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; date: Date; sessions: any[] }
    >();

    paginatedSessions.forEach((session) => {
      const date = new Date(session.started_at);
      const key = Number.isNaN(date.getTime())
        ? `invalid-${session.id}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const group = groups.get(key);

      if (group) {
        group.sessions.push(session);
      } else {
        groups.set(key, { key, date, sessions: [session] });
      }
    });

    return Array.from(groups.values());
  }, [paginatedSessions]);

  const displayTotalWeight = (totalKg: number): number | string => {
    if (loadingPreferences) return "-";

    if (useMetric) {
      return Math.floor(totalKg);
    } else {
      return Math.floor(kgToLbs(totalKg));
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <PageTitle title="Session History" />
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col overflow-x-hidden pb-16">
      <PageTitle title="Workout History" />

      <div className="mt-4 mb-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="min-w-0 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
              <CardBody className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-primary font-medium">
                      Total Sessions
                    </p>
                    <h3 className="text-3xl font-bold mt-1 font-mono tabular-nums">
                      {sessions.length}
                    </h3>
                  </div>
                  <div className="bg-primary/15 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="min-w-0 bg-gradient-to-br from-success/20 to-success/5 border border-success/10">
              <CardBody className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-success font-medium">
                      This Week
                    </p>
                    <h3 className="text-3xl font-bold mt-1 font-mono tabular-nums">
                      {calculateWorkoutsThisWeek(sessions)}
                    </h3>
                  </div>
                  <div className="bg-success/15 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="min-w-0 bg-gradient-to-br from-muted to-secondary border border-border">
              <CardBody className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Sets Completed
                    </p>
                    <h3 className="text-3xl font-bold mt-1 font-mono tabular-nums">
                      {calculateTotalSets(sessions)}
                    </h3>
                  </div>
                  <div className="bg-foreground/5 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-foreground" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="min-w-0 bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/10">
              <CardBody className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-warning font-medium">
                      Total Volume
                    </p>
                    <h3 className="text-3xl font-bold mt-1 font-mono tabular-nums">
                      {displayTotalWeight(calculateTotalWeight(sessions))}
                      <span className="text-sm ml-1 font-normal font-sans">
                        {useMetric ? "kg" : "lbs"}
                      </span>
                    </h3>
                  </div>
                  <div className="bg-warning/15 p-2 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Year filters keep a long history discoverable without a chip per month. */}
      <div className="mb-6 min-w-0">
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {isLoading ? (
            <>
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-lg shrink-0" />
                ))}
            </>
          ) : years.length > 0 ? (
            <>
              <Button
                size="sm"
                radius="lg"
                variant={selectedYear === "all" ? "solid" : "flat"}
                color={selectedYear === "all" ? "primary" : "default"}
                onPress={() => {
                  setSelectedYear("all");
                  setCurrentPage(1);
                }}
                className="shrink-0 min-w-[7rem] px-4"
              >
                All years
              </Button>
              {years.map((year) => (
                <Button
                  key={year}
                  size="sm"
                  radius="lg"
                  variant={selectedYear === year ? "solid" : "flat"}
                  color={selectedYear === year ? "primary" : "default"}
                  onPress={() => {
                    setSelectedYear(year);
                    setCurrentPage(1);
                  }}
                  className="shrink-0 min-w-[7rem] px-4"
                >
                  {year}
                </Button>
              ))}
            </>
          ) : null}
        </div>
      </div>

      {/* Session timeline */}
      <div className="min-w-0 space-y-8 mb-16">
        {isLoading ? (
          <>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-32 rounded" />
                  <Skeleton className="h-[120px] rounded-xl" />
                </div>
              ))}
          </>
        ) : paginatedSessionsByDate.length === 0 ? (
          // Enhanced empty state
          <Card className="py-12 px-6">
            <CardBody className="items-center justify-center text-center">
              <div className="bg-default-100 rounded-full p-6 mb-4">
                <Calendar
                  className="h-12 w-12 text-default-400"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
              <p className="text-default-500 max-w-md mx-auto mb-6">
                {selectedYear && selectedYear !== "all"
                  ? `You don't have any workout sessions recorded for ${selectedYear}.`
                  : "You haven't recorded any workout sessions yet."}
              </p>
              <Button
                as={Link}
                href="/protected/workouts"
                color="primary"
                variant="flat"
                size="lg"
              >
                Start a New Workout
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {paginatedSessionsByDate.map(
              ({ key, date, sessions: dateSessions }) => (
                <div key={key} className="animate-fadeIn">
                  <div className="flex items-center mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                    <div className="h-6 w-1 bg-primary rounded-full mr-2"></div>
                    <h3 className="text-md font-medium">{formatDate(date)}</h3>
                  </div>
                  <div className="space-y-4">
                    {dateSessions.map((session) => (
                      <Card
                        key={session.id}
                        isPressable
                        as={Link}
                        href={`/protected/sessions/${session.id}`}
                        className="shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <CardBody className="p-0">
                          <div className="p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                              <div>
                                <h3 className="text-lg font-bold mb-1">
                                  {session.workout.name}
                                </h3>
                                <div className="flex items-center flex-wrap gap-3 text-sm text-default-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                      {formatDuration(
                                        session.started_at,
                                        session.ended_at
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Dumbbell className="h-3.5 w-3.5" />
                                    <span>{session.total_sets ?? 0} sets</span>
                                  </div>
                                </div>
                              </div>
                              <Chip
                                size="sm"
                                color="primary"
                                variant="flat"
                                className="self-start"
                                startContent={
                                  <Clock className="h-3 w-3 mr-1" />
                                }
                              >
                                {new Date(
                                  session.started_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Chip>
                            </div>
                          </div>
                          <Divider />
                          <div className="px-4 py-2 flex justify-between items-center bg-default-50/50 dark:bg-default-50/5">
                            <span className="text-sm font-medium text-primary">
                              View Details
                            </span>
                            <ChevronRight className="h-4 w-4 text-default-400" />
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Improved Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 mb-4">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={(page) => {
                    setCurrentPage(page);
                    // Scroll back to top when changing pages
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  color="primary"
                  showControls
                  size="lg"
                  classNames={{
                    cursor: "shadow-md",
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
