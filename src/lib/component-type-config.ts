/**
 * Configuration for claim component types
 * Defines colors, icons, and labels for verifiable facts, opinions, predictions, etc.
 */

import {
  CheckCircle2,
  MessageCircle,
  Clock,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { ClaimComponentType } from '@/types/verity';

export interface ComponentTypeConfig {
  label: string;
  shortLabel: string; // For compact badges
  color: string; // Tailwind text color
  bgColor: string; // Background for highlighting
  borderColor: string; // Border color for badges
  icon: LucideIcon;
  description: string;
}

export const componentTypeConfig: Record<ClaimComponentType, ComponentTypeConfig> = {
  verifiable_fact: {
    label: 'Checkable Claim',
    shortLabel: 'Claim',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100/60 dark:bg-teal-900/40',
    borderColor: 'border-teal-300 dark:border-teal-700',
    icon: CheckCircle2,
    description: 'This can be checked against evidence',
  },
  value_judgment: {
    label: 'Value Judgment',
    shortLabel: 'Opinion',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100/60 dark:bg-purple-900/40',
    borderColor: 'border-purple-300 dark:border-purple-700',
    icon: MessageCircle,
    description: 'This is subjective and cannot be objectively verified',
  },
  prediction: {
    label: 'Prediction',
    shortLabel: 'Prediction',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100/60 dark:bg-amber-900/40',
    borderColor: 'border-amber-300 dark:border-amber-700',
    icon: Clock,
    description: 'This is about the future and cannot be verified yet',
  },
  presupposition: {
    label: 'Assumption',
    shortLabel: 'Assumed',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100/60 dark:bg-slate-800/40',
    borderColor: 'border-slate-300 dark:border-slate-600',
    icon: Layers,
    description: 'This is assumed background context',
  },
};

/**
 * Get config for a component type with fallback
 */
export function getComponentTypeConfig(type: ClaimComponentType): ComponentTypeConfig {
  return componentTypeConfig[type] || componentTypeConfig.verifiable_fact;
}

/**
 * Get abbreviated letter for a component type (for inline superscripts)
 */
export function getComponentTypeLetter(type: ClaimComponentType): string {
  switch (type) {
    case 'verifiable_fact':
      return 'C'; // Claim (checkable)
    case 'value_judgment':
      return 'O'; // Opinion
    case 'prediction':
      return 'P'; // Prediction
    case 'presupposition':
      return 'A'; // Assumed
    default:
      return '?';
  }
}
