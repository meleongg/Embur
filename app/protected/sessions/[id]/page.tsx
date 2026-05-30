"use client";

import BackButton from "@/components/ui/back-button";
import PageTitle from "@/components/ui/page-title";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { displayWeight } from "@/utils/units";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { Calendar, Clock, Dumbbell, Info, Trophy } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchSessionDetail } from "@/lib/queries/sessions";
import { toast } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ViewSession() {
  const params = useParams();
  const sessionId = params.id as string;

  const { useMetric, isLoading: isLoadingUnits } = useUnitPreference();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => fetchSessionDetail(sessionId),
    enabled: Boolean(sessionId),
  });

  const session = data ?? null;
  const sessionExercises = data?.session_exercises ?? [];
  const error =
    isError && queryError instanceof Error
      ? queryError.message
      : isError
        ? "Failed to fetch session details"
        : null;

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load session details");
    }
  }, [isError]);

  // Calculate values for display
  const calculateValues = () => {
    if (!session)
      return { durationMinutes: 0, durationSeconds: 0, exerciseGroups: {} };

    // Calculate session duration
    const durationMs =
      new Date(session.ended_at).getTime() -
      new Date(session.started_at).getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    // Group exercises - use a unique key that includes exercise ID
    const exerciseGroups = sessionExercises.reduce(
      (groups: any, exercise: any) => {
        const exerciseName = exercise.exercise.name;
        const exerciseId = exercise.exercise.id;

        // Use a consistent key for grouping
        const groupKey = exerciseId;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            exerciseName,
            exerciseId,
            category: exercise.exercise.category?.name || "Uncategorized",
            sets: [],
            totalVolume: 0,
          };
        }

        const weight = exercise.weight || 0;
        const reps = exercise.reps || 0;
        const setVolume = weight * reps;

        // Add this set to the exercise group - ensure each set gets added
        groups[groupKey].totalVolume += setVolume;

        // Make sure to add each individual set record
        groups[groupKey].sets.push({
          setNumber: exercise.set_number,
          reps,
          weight,
          volume: setVolume,
          // Add unique ID to ensure we don't lose sets with same set_number
          id: exercise.id,
        });

        return groups;
      },
      {}
    );

    // Sort sets by set_number for each exercise
    Object.values(exerciseGroups).forEach((group: any) => {
      group.sets.sort((a: any, b: any) => a.setNumber - b.setNumber);
    });

    return { durationMinutes, durationSeconds, exerciseGroups };
  };

  const { durationMinutes, durationSeconds, exerciseGroups } =
    calculateValues();

  // Loading Skeletons
  if (isLoading || isLoadingUnits) {
    return (
      <div className="pb-16 animate-fadeIn">
        <div className="mb-6">
          <Skeleton className="h-9 w-48 rounded-lg mb-4" />
          <Skeleton className="h-8 w-10 rounded-lg" />
        </div>

        {/* Session Details Card Skeleton */}
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-7 w-40 rounded-lg" />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 rounded mb-2" />
                    <Skeleton className="h-5 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Skeleton className="h-4 w-48 rounded mb-2" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </CardBody>
        </Card>

        <Skeleton className="h-7 w-40 rounded-lg mb-4" />

        {/* Exercise Cards Skeletons */}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <div className="w-full flex justify-between">
                <Skeleton className="h-6 w-40 rounded mb-1" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex justify-between mb-3">
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 w-10 rounded" />
              </div>
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="flex py-2 border-b border-default-100 last:border-b-0"
                >
                  <Skeleton className="h-5 w-8 rounded mr-6" />
                  <Skeleton className="h-5 w-8 rounded mr-6" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  // Error state with improved styling
  if (error) {
    return (
      <div className="p-6">
        <PageTitle title="Session Error" />
        <Card className="border-danger shadow-md">
          <CardBody className="gap-4">
            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg flex items-center gap-2">
              <div className="bg-danger rounded-full p-2 text-white">
                <Info size={18} />
              </div>
              <p className="text-danger font-medium">{error}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-default-500 text-sm">
                The session data couldn't be loaded. Please try again later.
              </p>
              <BackButton url={`/protected/sessions`} />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Session not found state
  if (!session) {
    return (
      <div className="p-6">
        <PageTitle title="Session Not Found" />
        <Card className="border-warning shadow-md">
          <CardBody className="gap-4 py-6">
            <div className="flex flex-col items-center justify-center p-6">
              <div className="bg-warning-100 dark:bg-warning-900/20 p-4 rounded-full mb-4">
                <Info size={32} className="text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Session Not Found</h3>
              <p className="text-default-500 mb-6 text-center">
                The workout session you're looking for doesn't exist or has been
                deleted.
              </p>
              <BackButton url={`/protected/sessions`} />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-fadeIn">
      <PageTitle title={`${session.workout.name} Session`} className="mb-6" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton url="/protected/sessions" />
        </div>
      </div>

      {/* Mobile title - only visible on small screens */}
      <h2 className="text-xl font-bold mb-4 sm:hidden">
        {session.workout.name}
      </h2>

      {/* Enhanced Session Details Card */}
      <Card className="mb-8 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/15 to-primary/5 border-b border-border/50 pb-3">
          <div className="flex justify-between w-full items-center">
            <h2 className="text-lg font-bold">Session Details</h2>
            <Chip
              variant="flat"
              color="primary"
              startContent={<Trophy size={14} className="ml-1" />}
            >
              Completed
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/15 p-2.5">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-default-500">Date</div>
                <div className="font-medium">
                  {new Date(session.started_at).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/15 p-2.5">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-default-500">Duration</div>
                <div className="font-medium">
                  {durationMinutes} min {durationSeconds} sec
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2.5">
                <Dumbbell className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-sm text-default-500">Exercises</div>
                <div className="font-medium">
                  {Object.keys(exerciseGroups).length} completed
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-default-200/60 mt-2">
            <div className="flex gap-6">
              <div className="text-sm">
                <div className="text-default-500">Started</div>
                <div className="font-medium">
                  {new Date(session.started_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-default-500">Finished</div>
                <div className="font-medium">
                  {new Date(session.ended_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm text-primary">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>
                {new Date(session.started_at).toLocaleDateString() ===
                new Date().toLocaleDateString()
                  ? "Today"
                  : new Date(session.started_at).toLocaleDateString() ===
                      new Date(Date.now() - 86400000).toLocaleDateString()
                    ? "Yesterday"
                    : new Date(session.started_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <h2 className="text-xl font-bold mb-4 flex items-center">
        Exercise Results
        <span className="text-sm font-normal text-default-500 ml-2">
          ({Object.keys(exerciseGroups).length})
        </span>
      </h2>

      {/* Exercise Cards - Enhanced with animation delays */}
      <div className="space-y-5">
        {Object.values(exerciseGroups).map((group: any, index: number) => (
          <Card
            key={group.exerciseId}
            className="shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardHeader className="pb-0">
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {group.exerciseName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="hidden sm:flex"
                    >
                      {group.sets.length} sets
                    </Chip>
                    {group.totalVolume > 0 && (
                      <Chip size="sm" variant="flat" color="secondary">
                        {displayWeight(group.totalVolume, useMetric)} volume
                      </Chip>
                    )}
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/70 mr-1.5"></div>
                    <span className="text-xs text-default-500">
                      {group.category}
                    </span>
                  </div>
                  <div className="text-xs text-default-400 sm:hidden">
                    {group.sets.length} sets
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <Table
                removeWrapper
                aria-label={`Sets for ${group.exerciseName}`}
                className="mt-2"
              >
                <TableHeader>
                  <TableColumn className="text-xs font-medium text-default-600 w-16">
                    SET
                  </TableColumn>
                  <TableColumn className="text-xs font-medium text-default-600 w-16">
                    REPS
                  </TableColumn>
                  <TableColumn className="text-xs font-medium text-default-600">
                    <div className="flex items-center gap-1">
                      <span>WEIGHT</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="h-4 text-[10px] min-h-0 px-1 py-0"
                        color="primary"
                      >
                        {useMetric ? "kg" : "lbs"}
                      </Chip>
                    </div>
                  </TableColumn>
                  <TableColumn className="text-xs font-medium text-default-600 hidden sm:table-cell">
                    <div className="flex items-center gap-1">
                      <span>VOLUME</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="h-4 text-[10px] min-h-0 px-1 py-0"
                        color="primary"
                      >
                        {useMetric ? "kg" : "lbs"}
                      </Chip>
                    </div>
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {group.sets.map((set: any, index: number) => (
                    <TableRow
                      key={index}
                      className="hover:bg-default-50 dark:hover:bg-default-50/5"
                    >
                      <TableCell className="py-2">{set.setNumber}</TableCell>
                      <TableCell className="py-2">{set.reps || "-"}</TableCell>
                      {/* Updated to show only the number value without unit */}
                      <TableCell className="py-2">
                        {set.weight
                          ? displayWeight(set.weight, useMetric, false) // Use a function that handles unit conversion properly
                          : "-"}
                      </TableCell>
                      <TableCell className="py-2 hidden sm:table-cell">
                        {set.volume > 0
                          ? displayWeight(set.volume, useMetric, false)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
