import { casingTypeOptions } from '../constants/bha-type-options.constant';
import {
  AppleColorsType,
  ComponentStyle,
} from '../interfaces/wellbore-desing.interface';

export const getRenderStyle = (
  type: string,
  colors: AppleColorsType
): ComponentStyle => {
  const lowerType = type.toLowerCase();

  // Casing components
  if (casingTypeOptions.includes(type)) {
    return {
      fillColor: colors.casing,
      strokeColor: colors.borderLine,
      opacity: 0.8,
      strokeWidth: 1,
    };
  }

  // Gas Lift components
  if (lowerType.includes('gas lift mandrel')) {
    return {
      fillColor: colors.systemBlue,
      strokeColor: colors.systemBlue,
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  if (lowerType.includes('gas lift') || lowerType.includes('gas separator')) {
    return {
      fillColor: colors.systemBlue,
      strokeColor: colors.systemBlue,
      opacity: 0.7,
      strokeWidth: 2,
    };
  }

  // Anchors and TACs
  if (
    lowerType.includes('anchor') ||
    lowerType.includes('catcher') ||
    lowerType.includes('tac')
  ) {
    return {
      fillColor: colors.systemRed,
      strokeColor: colors.systemRed,
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Packers
  if (lowerType.includes('packer')) {
    return {
      fillColor: colors.systemGreen,
      strokeColor: colors.systemGreen,
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Nipples (SN, XN, Profile, Pump Seating, etc.)
  if (
    lowerType.includes('nipple') ||
    lowerType.includes(' sn') ||
    lowerType.includes('xn')
  ) {
    return {
      fillColor: '#2563EB',
      strokeColor: colors.systemBlue,
      opacity: 0.9,
      strokeWidth: 2,
    };
  }

  // ESP
  if (lowerType.includes('esp')) {
    return {
      fillColor: colors.systemOrange,
      strokeColor: '#D97706',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Jet Pump
  if (lowerType.includes('jet pump')) {
    return {
      fillColor: '#7C3AED',
      strokeColor: '#5B21B6',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Perforated components
  if (lowerType.includes('perforated')) {
    return {
      fillColor: colors.bha,
      strokeColor: colors.borderLine,
      pattern: 'dotted',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Sand Screen
  if (lowerType.includes('sand screen')) {
    return {
      fillColor: '#92400E',
      strokeColor: '#78350F',
      pattern: 'mesh',
      opacity: 0.8,
      strokeWidth: 1,
    };
  }

  // Slotted components
  if (lowerType.includes('slotted')) {
    return {
      fillColor: colors.bha,
      strokeColor: colors.borderLine,
      pattern: 'dotted',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Tubing
  if (lowerType.includes('tubing') && !lowerType.includes('hanger')) {
    return {
      fillColor: 'rgba(59, 130, 246, 0.3)',
      strokeColor: colors.systemBlue,
      pattern: 'gradient',
      opacity: 0.6,
      strokeWidth: 1,
    };
  }

  // Float components
  if (lowerType.includes('float')) {
    return {
      fillColor: '#059669',
      strokeColor: '#047857',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Centralizer
  if (lowerType.includes('centralizer')) {
    return {
      fillColor: '#DC2626',
      strokeColor: '#B91C1C',
      opacity: 0.7,
      strokeWidth: 1,
    };
  }

  // Cross Over
  if (lowerType.includes('cross over')) {
    return {
      fillColor: '#7C2D12',
      strokeColor: '#92400E',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Plugs
  if (lowerType.includes('plug')) {
    return {
      fillColor: '#1F2937',
      strokeColor: '#111827',
      opacity: 0.9,
      strokeWidth: 2,
    };
  }

  // Tools
  if (lowerType.includes('tool')) {
    return {
      fillColor: '#6366F1',
      strokeColor: '#4F46E5',
      opacity: 0.8,
      strokeWidth: 2,
    };
  }

  // Default BHA component
  return {
    fillColor: colors.bha,
    strokeColor: colors.borderLine,
    opacity: 0.7,
    strokeWidth: 1,
  };
};
