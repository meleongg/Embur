"use client";

import { useTheme } from "@/components/theme-provider";
import LogoutButton from "@/components/ui/logout-button";
import PageTitle from "@/components/ui/page-title";
import { queryKeys } from "@/lib/query-keys";
import { themeFromDarkMode } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
  useDisclosure,
} from "@nextui-org/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  Key,
  LogOut,
  Mail,
  Moon,
  Save,
  Settings,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

// Default user preferences
const DEFAULT_PREFERENCES = {
  useMetric: true,
  useDarkMode: false,
  defaultRestTimer: 60, // seconds
};

const SETTINGS_INPUT_CLASSNAMES = {
  input: "text-base",
  inputWrapper: "h-12 min-h-[3rem] px-4 shadow-sm bg-content1 dark:bg-content2",
  innerWrapper: "gap-2",
};

const SETTINGS_SELECT_CLASSNAMES = {
  label: "text-sm font-medium text-foreground",
  trigger:
    "h-12 min-h-[3rem] px-4 shadow-sm bg-content1 dark:bg-content2 border border-default-200",
  value: "text-base",
  innerWrapper: "gap-2",
  mainWrapper: "gap-4",
};

const SETTINGS_FIELD_PROPS = {
  variant: "bordered" as const,
  radius: "lg" as const,
};

const SECTION_CARD_CLASS = "shadow-sm border border-border/40";
const SECTION_HEADER_CLASS =
  "flex flex-col items-start gap-2 py-5 px-5 md:px-8";
const SECTION_BODY_CLASS = "flex flex-col gap-6 py-6 px-5 md:px-8 pt-8";
/** Keeps inputs and action buttons from stretching across wide layouts */
const SETTINGS_FORM_WIDTH = "w-full max-w-xl";
const SETTINGS_ACTION_BUTTON_CLASS = "h-11 w-full sm:w-fit font-medium px-6";

function SettingsActionRow({ children }: { children: ReactNode }) {
  return <div className="pt-4 w-full sm:w-fit">{children}</div>;
}

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-foreground leading-snug">
        {label}
      </label>
      {children}
    </div>
  );
}

function SegmentedPreference<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex w-full max-w-[15rem] rounded-xl border border-default-200 bg-content1 dark:bg-content2 p-1 gap-1",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Button
            key={String(option.value)}
            size="sm"
            variant={selected ? "solid" : "light"}
            color={selected ? "primary" : "default"}
            className={cn(
              "flex-1 h-10 min-w-0 font-medium text-sm",
              !selected && "bg-transparent text-default-600"
            )}
            onPress={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
  danger,
  icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        SECTION_CARD_CLASS,
        "transition-shadow hover:shadow-md",
        danger && "border-danger-200/80"
      )}
    >
      <CardHeader className={SECTION_HEADER_CLASS}>
        <div className={cn("flex items-center gap-2", danger && "text-danger")}>
          {icon}
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-default-500 leading-relaxed pr-1 max-w-prose">
            {description}
          </p>
        )}
      </CardHeader>
      <Divider />
      <CardBody className={SECTION_BODY_CLASS}>{children}</CardBody>
    </Card>
  );
}

function PreferenceRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-default-50/50 dark:bg-default-100/5 p-4 md:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="space-y-1.5 min-w-0 pr-2">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-default-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="shrink-0 self-start sm:self-center">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const { theme, setTheme } = useTheme();

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Fetch user data and preferences
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      setUserProfile(user);

      // Get user preferences from database
      const { data: prefsData, error: prefsError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (prefsData) {
        const useDarkMode = prefsData.use_dark_mode ?? false;
        setPreferences({
          useMetric: prefsData.use_metric,
          useDarkMode,
          defaultRestTimer: prefsData.default_rest_timer,
        });
        setTheme(themeFromDarkMode(useDarkMode));
      } else {
        // Create default preferences if none exists
        await supabase.from("user_preferences").insert({
          user_id: user.id,
          use_metric: DEFAULT_PREFERENCES.useMetric,
          use_dark_mode: DEFAULT_PREFERENCES.useDarkMode,
          default_rest_timer: DEFAULT_PREFERENCES.defaultRestTimer,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const persistPreference = async (
    updates: {
      use_metric?: boolean;
      use_dark_mode?: boolean;
      default_rest_timer?: number;
    },
    options?: { errorMessage?: string }
  ) => {
    if (!userProfile?.id) return;

    const { error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", userProfile.id);

    if (error) {
      console.error("Error saving preference:", error);
      toast.error(
        options?.errorMessage ?? "Could not save preference. Please try again."
      );
      throw error;
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.userPreferences.current(),
    });
  };

  // Update email
  const updateEmail = async () => {
    try {
      setIsSaving(true);

      if (!newEmail) {
        toast.error("Please enter a new email address");
        return;
      }

      // Loading toast that will be updated
      const toastId = toast.loading("Sending verification email...");

      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      toast.success("Verification email sent", {
        id: toastId,
        description: "Please check your inbox to complete the change",
        duration: 5000,
      });

      setNewEmail("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    try {
      setIsSaving(true);

      if (!currentPassword) {
        toast.error("Please enter your current password");
        return;
      }

      if (!newPassword) {
        toast.error("Please enter a new password");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("New passwords don't match");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      // Loading toast
      const toastId = toast.loading("Verifying your password...");

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect", { id: toastId });
        return;
      }

      // Update loading message
      toast.loading("Updating your password...", { id: toastId });

      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully", {
        id: toastId,
        icon: <Check className="h-4 w-4" />,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      if (deleteConfirm !== userProfile.email) {
        toast.error("Email confirmation doesn't match your account email");
        return;
      }

      const toastId = toast.loading("Deleting your account...");

      // Delete user data first
      await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", userProfile.id);

      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(userProfile.id);

      if (error) throw error;

      // Sign out after deletion
      await supabase.auth.signOut();

      toast.success("Account deleted successfully", {
        id: toastId,
        description: "We're sorry to see you go",
      });

      router.push("/sign-in");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account", {
        description: error.message || "Please contact support if this persists",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 pb-16 space-y-6 w-full max-w-5xl mx-auto min-w-[320px]">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />

        {/* Tab skeleton */}
        <div className="border-b border-divider w-full">
          <div className="flex gap-4 mb-2">
            <div className="h-10 w-28 bg-muted rounded animate-pulse" />
            <div className="h-10 w-28 bg-muted rounded animate-pulse opacity-60" />
          </div>
          <div className="h-0.5 w-28 bg-primary rounded-full mb-[-1px]" />
        </div>

        {/* Card skeletons */}
        <div className="space-y-6 w-full pt-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-sm overflow-hidden">
              <CardHeader className="flex flex-col items-start gap-2">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <Divider />
              <CardBody className="space-y-6 px-4 md:px-6 py-5">
                {/* Staggered animation for content */}
                <div
                  className="space-y-4"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex flex-col gap-2">
                    <div
                      className="h-4 w-28 bg-muted rounded animate-pulse"
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                    <div
                      className="h-6 w-full bg-muted rounded animate-pulse"
                      style={{ animationDelay: `${i * 75}ms` }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div
                      className="h-4 w-36 bg-muted rounded animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                    <div
                      className="h-6 w-full bg-muted rounded animate-pulse"
                      style={{ animationDelay: `${i * 125}ms` }}
                    />
                  </div>

                  <div className="flex justify-end">
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Add global styles for better animations */}
        <style jsx global>{`
          @keyframes pulseDelay {
            0%,
            100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
          .animate-pulse {
            animation: pulseDelay 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  // Enhanced Settings Page with better responsiveness
  return (
    <div className="p-4 md:p-6 pb-16 space-y-6 w-full max-w-5xl mx-auto min-w-[320px] animate-fadeIn">
      <PageTitle title="Settings" showSettingsButton={false} />

      {/* Enhanced tabs with better mobile appearance */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        aria-label="Settings"
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative overflow-x-auto scrollbar-hide px-1",
          panel: "w-full pt-4",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-4 h-11 text-default-500 data-[selected=true]:font-semibold data-[selected=true]:text-foreground",
          base: "w-full",
        }}
        className="w-full"
      >
        <Tab
          key="account"
          title={
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Account</span>
            </div>
          }
        >
          {/* Account settings content goes directly inside the Tab */}
          <div className="space-y-6 w-full py-2 md:py-3">
            <SettingsSection title="Profile Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="rounded-xl border border-border/50 bg-default-50/40 dark:bg-default-100/5 p-5 md:p-6 space-y-2">
                  <p className="text-sm text-default-500">Email address</p>
                  <p className="font-medium text-foreground break-all">
                    {userProfile?.email}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-default-50/40 dark:bg-default-100/5 p-5 md:p-6 space-y-2">
                  <p className="text-sm text-default-500">Account created</p>
                  <p className="font-medium text-foreground">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Update email"
              description="We'll send a verification link to your new address."
            >
              <div className={cn(SETTINGS_FORM_WIDTH, "flex flex-col gap-10")}>
                <SettingsField label="New email address">
                  <Input
                    {...SETTINGS_FIELD_PROPS}
                    aria-label="New email address"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    startContent={
                      <Mail size={18} className="text-default-400 shrink-0" />
                    }
                    classNames={SETTINGS_INPUT_CLASSNAMES}
                  />
                </SettingsField>
                <SettingsActionRow>
                  <Button
                    color="primary"
                    isLoading={isSaving}
                    startContent={<Save size={18} />}
                    onPress={updateEmail}
                    className={SETTINGS_ACTION_BUTTON_CLASS}
                  >
                    Update email
                  </Button>
                </SettingsActionRow>
              </div>
            </SettingsSection>

            <SettingsSection title="Change password">
              <div className={cn(SETTINGS_FORM_WIDTH, "flex flex-col gap-10")}>
                <SettingsField label="Current password">
                  <Input
                    {...SETTINGS_FIELD_PROPS}
                    aria-label="Current password"
                    placeholder="Enter your current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    startContent={
                      <Key size={18} className="text-default-400 shrink-0" />
                    }
                    classNames={SETTINGS_INPUT_CLASSNAMES}
                  />
                </SettingsField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <SettingsField label="New password">
                    <Input
                      {...SETTINGS_FIELD_PROPS}
                      aria-label="New password"
                      placeholder="Enter new password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      classNames={SETTINGS_INPUT_CLASSNAMES}
                    />
                  </SettingsField>
                  <SettingsField label="Confirm new password">
                    <Input
                      {...SETTINGS_FIELD_PROPS}
                      aria-label="Confirm new password"
                      placeholder="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      classNames={SETTINGS_INPUT_CLASSNAMES}
                    />
                  </SettingsField>
                </div>
                <SettingsActionRow>
                  <Button
                    color="primary"
                    isLoading={isSaving}
                    startContent={<Save size={18} />}
                    onPress={updatePassword}
                    className={SETTINGS_ACTION_BUTTON_CLASS}
                  >
                    Update password
                  </Button>
                </SettingsActionRow>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Sign out"
              description="End your session on this device. Your workout data stays saved in your account."
              icon={<LogOut size={18} className="text-default-500" />}
            >
              <SettingsActionRow>
                <LogoutButton
                  variant="full"
                  className={SETTINGS_ACTION_BUTTON_CLASS}
                />
              </SettingsActionRow>
            </SettingsSection>

            <SettingsSection
              title="Delete account"
              description="This action cannot be undone. All your data will be permanently deleted."
              danger
              icon={<AlertTriangle size={18} />}
            >
              <div className={cn(SETTINGS_FORM_WIDTH, "flex flex-col gap-10")}>
                <SettingsField label="Confirm by typing your email">
                  <Input
                    {...SETTINGS_FIELD_PROPS}
                    aria-label="Confirm by typing your email"
                    placeholder="Enter your email to confirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    color="danger"
                    startContent={
                      <Trash2 size={18} className="text-danger shrink-0" />
                    }
                    classNames={SETTINGS_INPUT_CLASSNAMES}
                  />
                </SettingsField>
                <SettingsActionRow>
                  <Button
                    color="danger"
                    onPress={onOpen}
                    isDisabled={deleteConfirm !== userProfile?.email}
                    className={SETTINGS_ACTION_BUTTON_CLASS}
                  >
                    Delete my account
                  </Button>
                </SettingsActionRow>
              </div>
            </SettingsSection>
          </div>
        </Tab>
        <Tab
          key="preferences"
          title={
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>Preferences</span>
            </div>
          }
        >
          {/* Preferences content goes directly inside the Tab */}
          <div className="space-y-6 w-full py-2 md:py-3">
            <SettingsSection
              title="Display"
              description="How weights and the interface appear across Embur."
            >
              <PreferenceRow
                title="Weight units"
                description="Choose between metric (kg) and imperial (lbs)."
              >
                <SegmentedPreference
                  ariaLabel="Weight units"
                  value={preferences.useMetric ? "kg" : "lbs"}
                  options={[
                    { value: "lbs", label: "lbs" },
                    { value: "kg", label: "kg" },
                  ]}
                  onChange={async (unit) => {
                    const useMetric = unit === "kg";
                    setPreferences({ ...preferences, useMetric });
                    try {
                      await persistPreference(
                        { use_metric: useMetric },
                        {
                          errorMessage:
                            "Units updated locally but failed to save",
                        }
                      );
                    } catch {
                      /* toast shown in persistPreference */
                    }
                  }}
                />
              </PreferenceRow>

              <PreferenceRow
                title="Theme"
                description="Switch between light and dark mode."
              >
                <SegmentedPreference
                  ariaLabel="Theme"
                  value={preferences.useDarkMode ? "dark" : "light"}
                  options={[
                    {
                      value: "light",
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <Sun className="h-4 w-4 shrink-0" />
                          Light
                        </span>
                      ),
                    },
                    {
                      value: "dark",
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <Moon className="h-4 w-4 shrink-0" />
                          Dark
                        </span>
                      ),
                    },
                  ]}
                  onChange={async (mode) => {
                    const useDarkMode = mode === "dark";
                    setTheme(themeFromDarkMode(useDarkMode));
                    setPreferences({
                      ...preferences,
                      useDarkMode,
                    });

                    try {
                      await persistPreference(
                        { use_dark_mode: useDarkMode },
                        {
                          errorMessage:
                            "Theme updated locally but failed to save to account",
                        }
                      );
                    } catch {
                      /* toast shown in persistPreference */
                    }
                  }}
                />
              </PreferenceRow>
            </SettingsSection>

            <SettingsSection
              title="Workout"
              description="Defaults used during live sessions and time estimates."
            >
              <div className="space-y-4">
                <div className="space-y-2 pr-1">
                  <p className="font-medium text-foreground">
                    Rest between sets
                  </p>
                  <p className="text-sm text-default-500 leading-relaxed">
                    Typical rest duration between sets. Used for more accurate
                    workout time estimates.
                  </p>
                </div>
                <SettingsField label="Rest duration">
                  <Select
                    {...SETTINGS_FIELD_PROPS}
                    aria-label="Rest duration"
                    selectedKeys={[preferences.defaultRestTimer.toString()]}
                    className="w-full"
                    onChange={async (e) => {
                      const seconds = parseInt(e.target.value, 10);
                      if (Number.isNaN(seconds)) return;

                      setPreferences({
                        ...preferences,
                        defaultRestTimer: seconds,
                      });

                      try {
                        await persistPreference(
                          { default_rest_timer: seconds },
                          {
                            errorMessage:
                              "Rest timer updated locally but failed to save",
                          }
                        );
                      } catch {
                        /* toast shown in persistPreference */
                      }
                    }}
                    startContent={
                      <Clock size={18} className="text-default-400" />
                    }
                    classNames={SETTINGS_SELECT_CLASSNAMES}
                  >
                    <SelectItem key="30" value="30">
                      30 seconds
                    </SelectItem>
                    <SelectItem key="45" value="45">
                      45 seconds
                    </SelectItem>
                    <SelectItem key="60" value="60">
                      60 seconds
                    </SelectItem>
                    <SelectItem key="90" value="90">
                      90 seconds
                    </SelectItem>
                    <SelectItem key="120" value="120">
                      2 minutes
                    </SelectItem>
                    <SelectItem key="180" value="180">
                      3 minutes
                    </SelectItem>
                  </Select>
                </SettingsField>
              </div>
            </SettingsSection>
          </div>
        </Tab>
      </Tabs>

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
