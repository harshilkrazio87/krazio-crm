export type TaskStatus = "pending" | "in_progress" | "completed" | string;
export type TaskPriority = "high" | "medium" | "low" | string;

export interface TaskColorInfo {
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  priorityBadge: string;
}

function getPriorityBadge(priority: TaskPriority): string {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "medium":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "low":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

export function getTaskColors(
  status: TaskStatus,
  priority: TaskPriority,
  dueDate?: string | null,
  isRecurringTemplate?: boolean
): TaskColorInfo {
  const isOverdue =
    !isRecurringTemplate &&
    dueDate &&
    new Date(dueDate) < new Date() &&
    status !== "completed";

  if (isOverdue) {
    return {
      cardBg: "bg-red-50 dark:bg-red-950/30",
      cardBorder: "border-l-4 border-l-red-500",
      badgeBg: "bg-red-100 dark:bg-red-900",
      badgeText: "text-red-700 dark:text-red-300",
      priorityBadge: getPriorityBadge(priority),
    };
  }

  switch (status) {
    case "completed":
      return {
        cardBg: "bg-green-50 dark:bg-green-950/30",
        cardBorder: "border-l-4 border-l-green-500",
        badgeBg: "bg-green-100 dark:bg-green-900",
        badgeText: "text-green-700 dark:text-green-300",
        priorityBadge: getPriorityBadge(priority),
      };
    case "in_progress":
      return {
        cardBg: "bg-blue-50 dark:bg-blue-950/30",
        cardBorder: "border-l-4 border-l-blue-500",
        badgeBg: "bg-blue-100 dark:bg-blue-900",
        badgeText: "text-blue-700 dark:text-blue-300",
        priorityBadge: getPriorityBadge(priority),
      };
    case "pending":
    default:
      if (priority === "high") {
        return {
          cardBg: "bg-amber-50 dark:bg-amber-950/30",
          cardBorder: "border-l-4 border-l-amber-400",
          badgeBg: "bg-amber-100 dark:bg-amber-900",
          badgeText: "text-amber-700 dark:text-amber-300",
          priorityBadge: getPriorityBadge(priority),
        };
      }
      return {
        cardBg: "bg-white dark:bg-gray-900",
        cardBorder: "border-l-4 border-l-gray-200 dark:border-l-gray-700",
        badgeBg: "bg-gray-100 dark:bg-gray-800",
        badgeText: "text-gray-600 dark:text-gray-400",
        priorityBadge: getPriorityBadge(priority),
      };
  }
}
