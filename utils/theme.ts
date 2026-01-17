
import { ThemeClasses } from "../types";

export const getTheme = (colorName: string): ThemeClasses => {
  const themes: Record<string, ThemeClasses> = {
    blue: {
      name: 'blue',
      text: 'text-blue-600',
      textLight: 'text-blue-100',
      textDark: 'text-blue-800',
      bg: 'bg-blue-50',
      bgSoft: 'bg-blue-100',
      bgDark: 'bg-blue-600',
      bgDarkHover: 'hover:bg-blue-700',
      border: 'border-blue-200',
      borderDark: 'border-blue-500',
      ring: 'focus:ring-blue-500',
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-200',
      icon: 'text-blue-500'
    },
    orange: {
      name: 'orange',
      text: 'text-orange-600',
      textLight: 'text-orange-100',
      textDark: 'text-orange-800',
      bg: 'bg-orange-50',
      bgSoft: 'bg-orange-100',
      bgDark: 'bg-orange-500',
      bgDarkHover: 'hover:bg-orange-600',
      border: 'border-orange-200',
      borderDark: 'border-orange-500',
      ring: 'focus:ring-orange-500',
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-200',
      icon: 'text-orange-500'
    },
    green: {
      name: 'green',
      text: 'text-green-600',
      textLight: 'text-green-100',
      textDark: 'text-green-800',
      bg: 'bg-green-50',
      bgSoft: 'bg-green-100',
      bgDark: 'bg-green-600',
      bgDarkHover: 'hover:bg-green-700',
      border: 'border-green-200',
      borderDark: 'border-green-500',
      ring: 'focus:ring-green-500',
      gradient: 'from-green-600 to-emerald-600',
      shadow: 'shadow-green-200',
      icon: 'text-green-500'
    },
    purple: {
      name: 'purple',
      text: 'text-purple-600',
      textLight: 'text-purple-100',
      textDark: 'text-purple-800',
      bg: 'bg-purple-50',
      bgSoft: 'bg-purple-100',
      bgDark: 'bg-purple-600',
      bgDarkHover: 'hover:bg-purple-700',
      border: 'border-purple-200',
      borderDark: 'border-purple-500',
      ring: 'focus:ring-purple-500',
      gradient: 'from-purple-600 to-fuchsia-600',
      shadow: 'shadow-purple-200',
      icon: 'text-purple-500'
    },
    pink: {
      name: 'pink',
      text: 'text-pink-600',
      textLight: 'text-pink-100',
      textDark: 'text-pink-800',
      bg: 'bg-pink-50',
      bgSoft: 'bg-pink-100',
      bgDark: 'bg-pink-600',
      bgDarkHover: 'hover:bg-pink-700',
      border: 'border-pink-200',
      borderDark: 'border-pink-500',
      ring: 'focus:ring-pink-500',
      gradient: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-200',
      icon: 'text-pink-500'
    },
    teal: {
      name: 'teal',
      text: 'text-teal-600',
      textLight: 'text-teal-100',
      textDark: 'text-teal-800',
      bg: 'bg-teal-50',
      bgSoft: 'bg-teal-100',
      bgDark: 'bg-teal-600',
      bgDarkHover: 'hover:bg-teal-700',
      border: 'border-teal-200',
      borderDark: 'border-teal-500',
      ring: 'focus:ring-teal-500',
      gradient: 'from-teal-600 to-cyan-600',
      shadow: 'shadow-teal-200',
      icon: 'text-teal-500'
    }
  };

  return themes[colorName] || themes.blue;
};
