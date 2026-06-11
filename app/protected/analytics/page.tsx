"use client";

import PageTitle from "@/components/ui/page-title";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { displayWeight, displayVolume, kgToLbs, roundTo } from "@/utils/units";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
} from "@nextui-org/react";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Dumbbell,
  Info,
  Search,
  TrendingUp,
  Trophy,
  Weight,
} from "lucide-react";
import { EMBUR_INPUT_SURFACE } from "@/lib/nextui-classnames";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchAnalyticsSummary,
  fetchExerciseProgress,
  fetchVolumeLeaderboard,
} from "@/lib/queries/analytics";
import { toast } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import { getChartColors } from "@/lib/chart-colors";
import {
  buildExerciseChartData,
  getProgressChartXAxisSettings,
} from "@/lib/chart-data";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const EMPTY_LIST: never[] = [];

function buildVolumeChartData(sessionsData: any[]) {
  const volumeByExercise = sessionsData.reduce(
    (acc: { [key: string]: number }, session) => {
      const exerciseName = Array.isArray(session.exercise)
        ? session.exercise[0]?.name
        : session.exercise?.name;
      const volume = session.reps * session.weight;

      if (!exerciseName) return acc;

      if (!acc[exerciseName]) {
        acc[exerciseName] = 0;
      }
      acc[exerciseName] += volume;
      return acc;
    },
    {}
  );

  return Object.entries(volumeByExercise)
    .map(([name, volume]) => ({
      name,
      volume,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}

function getExerciseCategoryName(exercise: {
  category?: { name?: string } | { name?: string }[] | null;
}) {
  if (Array.isArray(exercise.category)) {
    return exercise.category[0]?.name ?? "";
  }
  return exercise.category?.name ?? "";
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const { useMetric } = useUnitPreference();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [activeTab, setActiveTab] = useState("progress");
  const [searchTerm, setSearchTerm] = useState("");
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const isCompactChart = useMediaQuery("(max-width: 767px)");
  const isNarrowChart = useMediaQuery("(max-width: 639px)");

  const {
    data: summary,
    isLoading,
    isError: summaryError,
  } = useQuery({
    queryKey: queryKeys.analytics.summary(),
    queryFn: fetchAnalyticsSummary,
  });

  const exercises = summary?.exercises ?? EMPTY_LIST;
  const personalRecords = summary?.personalRecords ?? EMPTY_LIST;
  const normalizedExerciseSearch = exerciseSearchTerm.trim().toLowerCase();

  const filteredExercises = useMemo(() => {
    if (!normalizedExerciseSearch) {
      return EMPTY_LIST;
    }

    return exercises.filter((exercise: any) => {
      const categoryName = getExerciseCategoryName(exercise);
      return (
        exercise.name.toLowerCase().includes(normalizedExerciseSearch) ||
        categoryName.toLowerCase().includes(normalizedExerciseSearch)
      );
    });
  }, [exercises, normalizedExerciseSearch]);

  const getSelectedExerciseName = () => {
    if (!selectedExercise) return "";
    const exercise = exercises.find((ex) => ex.id === selectedExercise);
    return exercise ? exercise.name : "";
  };

  const progressEnabled = Boolean(selectedExercise) && activeTab === "progress";

  const {
    data: progressRows,
    isFetching: isChartLoading,
    isError: progressError,
  } = useQuery({
    queryKey: queryKeys.analytics.exerciseProgress(
      selectedExercise ?? "",
      selectedTimeframe
    ),
    queryFn: () => fetchExerciseProgress(selectedExercise!, selectedTimeframe),
    enabled: progressEnabled,
  });

  const { data: volumeRows } = useQuery({
    queryKey: queryKeys.analytics.volumeLeaderboard(),
    queryFn: () => fetchVolumeLeaderboard(),
    enabled: activeTab === "volume",
  });

  useEffect(() => {
    if (summaryError) {
      toast.error("Failed to load analytics data");
    }
  }, [summaryError]);

  useEffect(() => {
    if (progressError) {
      toast.error("Failed to load exercise progress");
    }
  }, [progressError]);

  const progressChart = useMemo(() => {
    if (
      !selectedExercise ||
      activeTab !== "progress" ||
      !progressRows?.length
    ) {
      return {
        points: EMPTY_LIST,
        bucket: "day" as const,
        bucketLabel: "",
      };
    }

    return buildExerciseChartData(
      selectedExercise,
      progressRows,
      selectedTimeframe,
      useMetric
    );
  }, [selectedExercise, activeTab, progressRows, selectedTimeframe, useMetric]);

  const exerciseData = progressChart.points;
  const progressXAxis = getProgressChartXAxisSettings(
    exerciseData.length,
    isCompactChart
  );

  const volumeData = useMemo(() => {
    if (activeTab !== "volume" || !volumeRows?.length) {
      return EMPTY_LIST;
    }

    return buildVolumeChartData(volumeRows);
  }, [activeTab, volumeRows]);

  const handleExerciseSearchChange = (value: string) => {
    setExerciseSearchTerm(value);
    setIsExerciseDropdownOpen(true);

    if (!selectedExercise) return;

    const selectedName =
      exercises.find((ex) => ex.id === selectedExercise)?.name ?? "";
    if (value.trim().toLowerCase() !== selectedName.toLowerCase()) {
      setSelectedExercise(null);
    }
  };

  const handleExerciseChange = (value: string) => {
    setSelectedExercise(value);
  };

  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  const handleTabChange = (key: React.Key) => {
    setActiveTab(key as string);
  };

  // Filter personal records based on search
  const filteredRecords = personalRecords.filter((record) => {
    const exerciseName = record.name ?? "";
    return exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    // Enhanced container with better width constraints
    <div className="w-full p-4 space-y-6 animate-fadeIn">
      <PageTitle title="Fitness Analytics" className="mb-6" />

      {/* Enhanced Tabs with improved mobile appearance */}
      <div className="relative">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          color="primary"
          variant="underlined"
          className="mb-6 w-full"
          classNames={{
            tabList:
              "gap-2 w-full relative overflow-x-auto pb-0 px-0 scrollbar-hide",
            panel: "w-full pt-3",
            cursor: "w-full",
            tab: "max-w-fit px-3 h-10 data-[selected=true]:font-medium",
            base: "w-full",
          }}
          aria-label="Analytics views"
        >
          <Tab
            key="progress"
            title={
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Progress</span>
              </div>
            }
          />
          <Tab
            key="records"
            title={
              <div className="flex items-center gap-2">
                <Trophy size={16} />
                <span>Records</span>
              </div>
            }
          />
          <Tab
            key="volume"
            title={
              <div className="flex items-center gap-2">
                <BarChart3 size={16} />
                <span>Volume</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {isLoading ? (
        // Improved loading skeleton
        <div className="space-y-8">
          {/* Improved skeleton animation */}
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-12 w-full md:w-1/2 rounded-lg animate-pulse" />
            <Skeleton className="h-12 w-full md:w-1/2 rounded-lg animate-pulse" />
          </div>

          {/* More realistic chart skeleton */}
          <Card className="shadow-sm">
            <CardHeader className="pb-0 pt-4 flex-col items-start">
              <Skeleton className="h-6 w-48 rounded mb-2 animate-pulse" />
              <Skeleton className="h-4 w-72 rounded animate-pulse" />
            </CardHeader>
            <Divider className="my-2" />
            <CardBody className="h-80">
              <Skeleton
                className="h-full w-full rounded-lg"
                disableAnimation={false}
              />
            </CardBody>
          </Card>
        </div>
      ) : (
        <>
          {/* Progress Charts View - Enhanced for better mobile experience */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              {/* Add search input above dropdowns */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search input for exercises */}
                <div className="md:w-1/2 space-y-2">
                  <label
                    className="block text-small font-medium pb-1.5"
                    id="exercise-search-label"
                  >
                    Select Exercise
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search and select an exercise..."
                      value={exerciseSearchTerm}
                      onChange={(e) =>
                        handleExerciseSearchChange(e.target.value)
                      }
                      startContent={
                        <Search size={16} className="text-default-400" />
                      }
                      isClearable={exerciseSearchTerm.length > 0}
                      onClear={() => {
                        setExerciseSearchTerm("");
                        setSelectedExercise(null);
                        setIsExerciseDropdownOpen(true);
                      }}
                      aria-labelledby="exercise-search-label"
                      aria-expanded={isExerciseDropdownOpen}
                      aria-haspopup="listbox"
                      aria-autocomplete="list"
                      classNames={{
                        inputWrapper: `h-12 ${EMBUR_INPUT_SURFACE}`,
                      }}
                      onFocus={() => setIsExerciseDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setIsExerciseDropdownOpen(false), 200);
                      }}
                    />

                    {isExerciseDropdownOpen && !normalizedExerciseSearch && (
                      <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-lg shadow-lg p-4 text-center">
                        <p className="text-default-500 text-sm">
                          Type to search your exercise library
                        </p>
                      </div>
                    )}

                    {isExerciseDropdownOpen &&
                      normalizedExerciseSearch &&
                      filteredExercises.length > 0 && (
                        <div
                          className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          role="listbox"
                          aria-label="Exercise search results"
                        >
                          <ul className="py-1">
                            {filteredExercises.map((exercise) => (
                              <li
                                key={exercise.id}
                                role="option"
                                aria-selected={selectedExercise === exercise.id}
                                className="px-3 py-2 hover:bg-default-100 cursor-pointer flex items-center justify-between"
                                onMouseDown={() => {
                                  handleExerciseChange(exercise.id);
                                  setExerciseSearchTerm(exercise.name);
                                  setIsExerciseDropdownOpen(false);
                                }}
                              >
                                <div className="flex items-center">
                                  <Dumbbell
                                    size={14}
                                    className="mr-2 text-default-500"
                                  />
                                  <span>{exercise.name}</span>
                                </div>
                                {getExerciseCategoryName(exercise) && (
                                  <span className="text-xs text-default-400">
                                    {getExerciseCategoryName(exercise)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {isExerciseDropdownOpen &&
                      normalizedExerciseSearch &&
                      filteredExercises.length === 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-lg shadow-lg p-4 text-center">
                          <p className="text-default-500">
                            No exercises match &ldquo;
                            {exerciseSearchTerm.trim()}
                            &rdquo;
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Timeframe selector - add a label to match the exercise selector */}
                <div className="md:w-1/2 space-y-2">
                  <label
                    className="block text-small font-medium pb-1.5"
                    id="timeframe-select-label"
                  >
                    Timeframe
                  </label>
                  <Select
                    selectedKeys={[selectedTimeframe]}
                    onChange={(e) => handleTimeframeChange(e.target.value)}
                    isDisabled={isChartLoading || !selectedExercise}
                    aria-labelledby="timeframe-select-label" // Add this
                    classNames={{
                      trigger: "h-12",
                      value: "text-base",
                    }}
                    placeholder="Select timeframe"
                  >
                    <SelectItem key="week" value="week" textValue="Last 7 Days">
                      Last 7 Days
                    </SelectItem>
                    <SelectItem
                      key="month"
                      value="month"
                      textValue="Last 30 Days"
                    >
                      Last 30 Days
                    </SelectItem>
                    <SelectItem
                      key="3months"
                      value="3months"
                      textValue="Last 3 Months"
                    >
                      Last 3 Months
                    </SelectItem>
                    <SelectItem key="year" value="year" textValue="Last Year">
                      Last Year
                    </SelectItem>
                    <SelectItem key="all" value="all" textValue="All Time">
                      All Time
                    </SelectItem>
                  </Select>
                </div>
              </div>

              {/* Rest of your progress tab content remains unchanged */}
              {selectedExercise ? (
                isChartLoading ? (
                  // Better skeleton loading indication
                  <div className="space-y-8">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-0 pt-4 flex-col items-start">
                        <Skeleton className="h-6 w-48 rounded mb-2" />
                        <Skeleton className="h-4 w-72 rounded" />
                      </CardHeader>
                      <Divider className="my-2" />
                      <CardBody className="h-[400px] md:h-80 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <Spinner size="lg" className="mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Loading chart data...
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                ) : exerciseData.length > 0 ? (
                  // Improved charts with better responsiveness
                  <div className="space-y-8">
                    {/* Weight Progress Chart - Enhanced for better visibility on mobile */}
                    <Card className="shadow-sm hover:shadow transition-shadow">
                      <CardHeader className="pb-0 pt-4 flex-col items-start">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="text-lg font-bold">Weight Progress</p>
                            <p className="text-small text-primary font-medium">
                              {getSelectedExerciseName()}
                            </p>
                          </div>
                          <Tooltip content="Shows your maximum weight lifted for this exercise over time">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              aria-label="Weight progress information" // Add this
                            >
                              <Info size={16} className="text-default-400" />
                            </Button>
                          </Tooltip>
                        </div>
                        <p className="text-small text-default-500">
                          Maximum weight used per workout session
                          {progressChart.bucket !== "day" && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {progressChart.bucketLabel}
                            </span>
                          )}
                        </p>
                      </CardHeader>
                      <Divider className="my-2" />
                      <CardBody className="h-[400px] md:h-80 overflow-hidden">
                        {/* Optimize chart for mobile with fewer x-axis ticks */}
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={exerciseData}
                            margin={{
                              left: 10,
                              right: 10,
                              bottom: progressXAxis.bottom,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="formattedDate"
                              tick={progressXAxis.tick}
                              interval={progressXAxis.interval}
                              angle={progressXAxis.angle}
                              textAnchor={progressXAxis.textAnchor}
                              height={progressXAxis.height}
                              tickMargin={8}
                              axisLine={false}
                            />
                            <YAxis
                              label={{
                                value: useMetric ? "kg" : "lbs",
                                angle: -90,
                                position: "insideLeft",
                                dx: -10,
                                fontSize: 12,
                              }}
                              tickFormatter={(value) => `${value}`}
                              axisLine={false}
                              dx={-5}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              formatter={(value) => [
                                `${roundTo(Number(value), 1)} ${useMetric ? "kg" : "lbs"}`,
                                "Max Weight",
                              ]}
                              labelFormatter={(_, items) => {
                                const point = items?.[0]?.payload as
                                  | { tooltipLabel?: string }
                                  | undefined;
                                return point?.tooltipLabel ?? "";
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="maxWeight"
                              name="Max Weight"
                              stroke={chartColors.primary}
                              strokeWidth={3}
                              dot={
                                exerciseData.length <= 16
                                  ? { r: 5, strokeWidth: 2 }
                                  : false
                              }
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>

                    {/* Volume Progress Chart - Similar enhancements */}
                    <Card className="shadow-sm hover:shadow transition-shadow">
                      <CardHeader className="pb-0 pt-4 flex-col items-start">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="text-lg font-bold">Volume Progress</p>
                            <p className="text-small text-primary font-medium">
                              {getSelectedExerciseName()}
                            </p>
                          </div>
                          <Tooltip content="Shows your total workout volume (weight × reps) over time">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              aria-label="Volume progress information" // Add this
                            >
                              <Info size={16} className="text-default-400" />
                            </Button>
                          </Tooltip>
                        </div>
                        <p className="text-small text-default-500">
                          Total workout volume per session
                          {progressChart.bucket !== "day" && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {progressChart.bucketLabel}
                            </span>
                          )}
                        </p>
                      </CardHeader>
                      <Divider className="my-2" />
                      <CardBody className="h-[400px] md:h-80 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={exerciseData}
                            margin={{
                              left: 10,
                              right: 10,
                              bottom: progressXAxis.bottom,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="formattedDate"
                              tick={progressXAxis.tick}
                              interval={progressXAxis.interval}
                              angle={progressXAxis.angle}
                              textAnchor={progressXAxis.textAnchor}
                              height={progressXAxis.height}
                              tickMargin={8}
                              axisLine={false}
                            />
                            <YAxis
                              label={{
                                value: useMetric ? "kg" : "lbs",
                                angle: -90,
                                position: "insideLeft",
                                dx: -10,
                                fontSize: 12,
                              }}
                              tickFormatter={(value) => `${value}`}
                              axisLine={false}
                              dx={-5}
                              tickLine={false}
                            />
                            <RechartsTooltip
                              formatter={(value) => [
                                displayVolume(Number(value), useMetric, true),
                                "Total Volume",
                              ]}
                              labelFormatter={(_, items) => {
                                const point = items?.[0]?.payload as
                                  | { tooltipLabel?: string }
                                  | undefined;
                                return point?.tooltipLabel ?? "";
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="totalVolume"
                              name="Volume"
                              stroke={chartColors.success}
                              strokeWidth={3}
                              dot={
                                exerciseData.length <= 16
                                  ? { r: 5, strokeWidth: 2 }
                                  : false
                              }
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>
                  </div>
                ) : (
                  // Enhanced empty state for better UX
                  <Card className="shadow-sm">
                    <CardBody className="py-12 px-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Dumbbell size={32} className="text-default-400" />
                        </div>
                        <p className="text-xl font-semibold">
                          No data available
                        </p>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                          You haven't logged any sessions for this exercise yet.
                          Complete a workout with this exercise to see your
                          progress.
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )
              ) : (
                // Enhanced select exercise prompt
                <Card className="shadow-sm">
                  <CardBody className="py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp size={32} className="text-primary/70" />
                      </div>
                      <p className="text-xl font-semibold">
                        Select an exercise
                      </p>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Choose an exercise from the dropdown above to view your
                        progress charts and performance metrics.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* Personal Records View - Enhanced card design */}
          {activeTab === "records" && (
            <div className="space-y-6">
              {/* Enhanced search with better mobile appearance */}
              <Input
                placeholder="Search exercises..."
                startContent={
                  <Search
                    size={18}
                    className="text-default-400 flex-shrink-0"
                  />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/2"
                size="lg"
                aria-label="Search exercises in records" // Add this
                classNames={{
                  inputWrapper: `h-12 ${EMBUR_INPUT_SURFACE}`,
                }}
              />

              {filteredRecords.length > 0 ? (
                // Enhanced card grid with better spacing and visual improvements
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRecords.map((record, index) => (
                    <Card
                      key={record.id}
                      className="shadow-sm hover:shadow transition-all duration-300"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <CardBody className="p-4">
                        {/* Enhanced record header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg line-clamp-1">
                              {record.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-default-500 text-xs">
                              <Calendar size={12} />
                              <span>{formatDate(record.date)}</span>
                            </div>
                          </div>
                          <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="flex-shrink-0"
                          >
                            PR
                          </Chip>
                        </div>

                        {/* Enhanced stats display */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-muted to-secondary rounded-xl border border-border/50">
                            <span className="text-xs text-muted-foreground mb-1">
                              Max Weight
                            </span>
                            <span className="font-bold text-sm md:text-base">
                              {displayWeight(record.max_weight, useMetric)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-muted to-secondary rounded-xl border border-border/50">
                            <span className="text-xs text-muted-foreground mb-1">
                              Max Reps
                            </span>
                            <span className="font-bold text-base">
                              {record.max_reps}
                            </span>
                          </div>
                          <div className="flex flex-col items-center p-3 bg-gradient-to-br from-muted to-secondary rounded-xl border border-border/50">
                            <span className="text-xs text-muted-foreground mb-1">
                              Max Volume
                            </span>
                            <span className="font-bold text-sm md:text-base">
                              {displayWeight(
                                record.max_volume,
                                useMetric,
                                true,
                                0
                              )}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                      <CardFooter className="pt-0">
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          className="w-full"
                          onPress={() => {
                            // First, find the exercise name
                            const selectedExerciseName =
                              exercises.find((ex) => ex.id === record.id)
                                ?.name || record.name;

                            // Update both the ID and search term to stay in sync
                            setSelectedExercise(record.id);
                            setExerciseSearchTerm(selectedExerciseName);
                            setActiveTab("progress");
                            setIsExerciseDropdownOpen(false);
                          }}
                          aria-label={`View progress for ${record.name}`}
                          endContent={<ChevronRight size={14} />}
                        >
                          View Progress
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : searchTerm ? (
                // Enhanced search results empty state
                <Card>
                  <CardBody className="py-10 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={28} className="text-default-400" />
                      </div>
                      <p className="text-xl font-semibold">No records found</p>
                      <p className="text-muted-foreground mt-2">
                        No exercises match "{searchTerm}"
                      </p>
                      <Button
                        color="primary"
                        variant="light"
                        className="mt-4"
                        onPress={() => setSearchTerm("")}
                      >
                        Clear search
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                // Enhanced empty state for no records
                <Card>
                  <CardBody className="py-12 px-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy size={28} className="text-warning" />
                      </div>
                      <p className="text-xl font-semibold">No records yet</p>
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Complete workout sessions to start tracking your
                        personal records. Each time you lift a new maximum
                        weight, it will appear here.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* Volume Analysis View - Enhanced for mobile */}
          {activeTab === "volume" && (
            <div>
              <Card className="shadow-sm hover:shadow transition-shadow">
                <CardHeader className="pb-0 pt-4 flex-col items-start">
                  <div className="flex items-center justify-between w-full">
                    <p className="text-lg font-bold">
                      Top 10 Exercises by Volume
                    </p>
                    <Tooltip content="Shows your exercises ranked by total volume lifted (weight × reps)">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        aria-label="Volume analysis information" // Add this
                      >
                        <Info size={16} className="text-default-400" />
                      </Button>
                    </Tooltip>
                  </div>
                  <p className="text-small text-default-500">
                    Total volume lifted across all sessions
                  </p>
                </CardHeader>
                <Divider className="my-2" />
                <CardBody className="h-[500px] md:h-96">
                  {volumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={volumeData}
                        layout="vertical"
                        margin={{
                          left: 20,
                          right: 30,
                          bottom: 5,
                          top: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) =>
                            `${Math.round(useMetric ? value : kgToLbs(value)).toLocaleString()}`
                          }
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={isNarrowChart ? 100 : 150}
                          tick={{
                            fontSize: isNarrowChart ? 10 : 12,
                          }}
                          tickFormatter={(value) =>
                            isNarrowChart && value.length > 12
                              ? `${value.substring(0, 10)}...`
                              : value
                          }
                        />
                        <RechartsTooltip
                          formatter={(value) => [
                            displayVolume(Number(value), useMetric),
                            "Volume",
                          ]}
                          labelFormatter={(name) => `Exercise: ${name}`}
                          cursor={{ fill: "rgba(136, 132, 216, 0.1)" }}
                        />
                        <Bar
                          dataKey="volume"
                          name={`Volume (${useMetric ? "kg" : "lbs"})`}
                          fill={chartColors.primary}
                          radius={[0, 4, 4, 0]}
                          barSize={isNarrowChart ? 15 : 20}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    // Enhanced empty state for volume
                    <div className="flex justify-center items-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 size={32} className="text-default-400" />
                        </div>
                        <p className="text-xl font-semibold">
                          No volume data available
                        </p>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                          Complete workout sessions to see your volume analysis.
                          This will help you track your overall training load
                          over time.
                        </p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Add global styles for animations and mobile optimizations */}
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
