"use client";

import PageTitle from "@/components/ui/page-title";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { createClient } from "@/utils/supabase/client";
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
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
    const sessionTotal = session.session_exercises.reduce(
      (acc: number, ex: any) => acc + ex.weight * ex.reps,
      0
    );
    return total + sessionTotal;
  }, 0);
};

const calculateTotalSets = (sessions: any[]) => {
  return sessions.reduce(
    (total, session) => total + session.session_exercises.length,
    0
  );
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatDuration = (start: string, end: string) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const getMonthName = (date: Date) => {
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [months, setMonths] = useState<string[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10);

  const { useMetric, isLoading: loadingPreferences } = useUnitPreference();

  const supabase = createClient();

  // Fetch sessions with improved toast notifications
  useEffect(() => {
    const fetchSessions = async () => {
      // Sonner's promise-based toast for async operations
      toast.promise(
        (async () => {
          setIsLoading(true);
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              setError("Not authenticated");
              throw new Error(
                "Authentication required to view workout history"
              );
            }

            const { data, error } = await supabase
              .from("sessions")
              .select(
                `
                *,
                workout:workouts(*),
                session_exercises(*)
              `
              )
              .eq("user_id", user.id)
              .order("started_at", { ascending: false });

            if (error) throw error;

            // Create a safe result that's guaranteed to be an array
            const safeData = data || [];

            if (safeData.length) {
              setSessions(safeData);

              // Extract unique months from sessions
              const allMonths = safeData.map((s) =>
                getMonthName(new Date(s.started_at))
              );
              const uniqueMonths = Array.from(new Set(allMonths));
              setMonths(uniqueMonths);

              // Set default selected month to most recent
              if (uniqueMonths.length > 0) {
                setSelectedMonth(uniqueMonths[0]);
              }
            } else {
              setSessions([]);
              setMonths([]);
            }

            return safeData; // Return safe array for success message
          } catch (err: any) {
            console.error("Error fetching sessions:", err);
            setError(err.message);
            throw err; // Re-throw for error toast
          } finally {
            setIsLoading(false);
          }
        })(),
        {
          loading: "Loading your workout history...",
          success: (data) => `Loaded ${data.length} workout sessions`,
          error: "Could not load your workout history",
        }
      );
    };

    fetchSessions();
  }, []);

  // Filter sessions when selectedMonth changes with toast notification
  useEffect(() => {
    if (selectedMonth && sessions.length) {
      const filtered = sessions.filter((session) => {
        const sessionMonth = getMonthName(new Date(session.started_at));
        return sessionMonth === selectedMonth;
      });
      setFilteredSessions(filtered);

      if (filtered.length > 0) {
        toast(`Viewing ${filtered.length} sessions from ${selectedMonth}`, {
          description: "Filtered view",
          icon: <Calendar className="h-4 w-4" />,
        });
      }
    } else {
      setFilteredSessions(sessions);
    }
    // Reset to first page whenever filter changes
    setCurrentPage(1);
  }, [selectedMonth, sessions]);

  // Calculate paginated sessions - add this before grouping
  const paginateSessionsByDate = () => {
    // First group all filtered sessions by date
    const groupedByDate = filteredSessions.reduce(
      (groups: any, session: any) => {
        const date = new Date(session.started_at).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(session);
        return groups;
      },
      {}
    );

    // Convert to array of [date, sessions] pairs for easier pagination
    const dateSessionPairs = Object.entries(groupedByDate);

    // Calculate pagination indexes
    const indexOfLastItem = currentPage * sessionsPerPage;
    const indexOfFirstItem = indexOfLastItem - sessionsPerPage;

    // Slice the array for current page
    const currentItems = dateSessionPairs.slice(
      indexOfFirstItem,
      indexOfLastItem
    );

    // Convert back to object
    return currentItems.reduce((acc: any, [date, sessions]) => {
      acc[date] = sessions;
      return acc;
    }, {});
  };

  // Use this function instead of directly using sessionsByDate
  const paginatedSessionsByDate = isLoading ? {} : paginateSessionsByDate();

  // Calculate total pages
  const totalPages = Math.ceil(
    Object.keys(
      filteredSessions.reduce((groups: any, session: any) => {
        const date = new Date(session.started_at).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(session);
        return groups;
      }, {})
    ).length / sessionsPerPage
  );

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
    <div className="flex flex-col pb-16">
      <PageTitle title="Workout History" />

      <div className="mt-4 mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
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

            <Card className="bg-gradient-to-br from-success/20 to-success/5 border border-success/10">
              <CardBody className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-success font-medium">This Week</p>
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

            <Card className="bg-gradient-to-br from-muted to-secondary border border-border">
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

            <Card className="bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/10">
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

      {/* Month Filter */}
      <div className="relative mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {isLoading ? (
            <div className="flex gap-2">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-lg" />
                ))}
            </div>
          ) : (
            months.map((month) => (
              <Button
                key={month}
                size="sm"
                radius="lg"
                variant={selectedMonth === month ? "solid" : "flat"}
                color={selectedMonth === month ? "primary" : "default"}
                onPress={() => setSelectedMonth(month)}
                className="min-w-[7rem] px-4"
              >
                {month}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Session Timeline with enhanced cards */}
      <div className="space-y-8 mb-16">
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
        ) : Object.keys(paginatedSessionsByDate).length === 0 ? (
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
                {selectedMonth
                  ? `You don't have any workout sessions recorded for ${selectedMonth}.`
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
            {Object.entries(paginatedSessionsByDate).map(
              ([date, dateSessions]) => (
                <div key={date} className="animate-fadeIn">
                  <div className="flex items-center mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                    <div className="h-6 w-1 bg-primary rounded-full mr-2"></div>
                    <h3 className="text-md font-medium">{formatDate(date)}</h3>
                  </div>
                  <div className="space-y-4">
                    {(dateSessions as any[]).map((session) => (
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
                                    <span>
                                      {session.session_exercises.length} sets
                                    </span>
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
                  initialPage={currentPage}
                  page={currentPage}
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
