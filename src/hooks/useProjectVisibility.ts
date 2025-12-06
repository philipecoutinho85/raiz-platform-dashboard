import { useMemo } from 'react';

interface Project {
  id: string;
  status: string;
  raised_amount: number;
  goal: number;
  custom_goal?: number;
  created_at: string;
  deadline?: string;
  updated_at: string;
}

interface VisibilityResult {
  isFullyVisible: boolean;
  isReducedView: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  completionDate: Date | null;
  daysUntilReduction: number | null;
  daysUntilSupporterExpiry: number | null;
}

/**
 * Hook to manage project visibility based on completion status and time
 * 
 * Rules:
 * - Projects remain fully visible for 180 days after completion/failure
 * - After 180 days, public users see reduced view
 * - Supporters have full access for 24 months (730 days)
 * - Creators have unlimited access
 */
export const useProjectVisibility = (
  project: Project | null,
  isCreator: boolean,
  isSupporter: boolean
): VisibilityResult => {
  return useMemo(() => {
    if (!project) {
      return {
        isFullyVisible: false,
        isReducedView: false,
        isCompleted: false,
        isFailed: false,
        completionDate: null,
        daysUntilReduction: null,
        daysUntilSupporterExpiry: null,
      };
    }

    const effectiveGoal = project.custom_goal || project.goal;
    const isCompleted = project.status === 'approved' && project.raised_amount >= effectiveGoal;
    const isFailed = project.status === 'approved' && 
      project.deadline && 
      new Date(project.deadline) < new Date() && 
      project.raised_amount < effectiveGoal;

    // Determine completion date
    let completionDate: Date | null = null;
    if (isCompleted || isFailed) {
      // Use updated_at as approximation of completion date
      // In production, you'd want a dedicated completed_at field
      completionDate = new Date(project.updated_at);
    }

    const now = new Date();
    const PUBLIC_VISIBILITY_DAYS = 180;
    const SUPPORTER_VISIBILITY_DAYS = 730; // 24 months

    let daysSinceCompletion = 0;
    if (completionDate) {
      daysSinceCompletion = Math.floor(
        (now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate days until visibility changes
    const daysUntilReduction = completionDate 
      ? Math.max(0, PUBLIC_VISIBILITY_DAYS - daysSinceCompletion)
      : null;

    const daysUntilSupporterExpiry = completionDate
      ? Math.max(0, SUPPORTER_VISIBILITY_DAYS - daysSinceCompletion)
      : null;

    // Determine visibility
    let isFullyVisible = true;
    let isReducedView = false;

    if ((isCompleted || isFailed) && completionDate) {
      if (isCreator) {
        // Creator always has full access
        isFullyVisible = true;
        isReducedView = false;
      } else if (isSupporter) {
        // Supporter has full access for 24 months
        isFullyVisible = daysSinceCompletion <= SUPPORTER_VISIBILITY_DAYS;
        isReducedView = daysSinceCompletion > SUPPORTER_VISIBILITY_DAYS;
      } else {
        // Public user has full access for 180 days
        isFullyVisible = daysSinceCompletion <= PUBLIC_VISIBILITY_DAYS;
        isReducedView = daysSinceCompletion > PUBLIC_VISIBILITY_DAYS;
      }
    }

    return {
      isFullyVisible,
      isReducedView,
      isCompleted,
      isFailed,
      completionDate,
      daysUntilReduction,
      daysUntilSupporterExpiry,
    };
  }, [project, isCreator, isSupporter]);
};

export default useProjectVisibility;
