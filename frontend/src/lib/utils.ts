import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertDateToString(date: Date, format: string): string {
  const padZero = (num: number) => (num < 10 ? '0' + num : num.toString());

  const replacements: { [key: string]: string } = {
    yyyy: date.getFullYear().toString(),
    MM: padZero(date.getMonth() + 1),
    dd: padZero(date.getDate()),
    HH: padZero(date.getHours()),
    mm: padZero(date.getMinutes()),
    ss: padZero(date.getSeconds()),
    EEEE: date.toLocaleDateString('en-US', { weekday: 'long' }),
    MMMM: date.toLocaleDateString('en-US', { month: 'long' }),
    'do': date.getDate().toString() + getOrdinalSuffix(date.getDate()),
  };

  return format.replace(/yyyy|MM|dd|HH|mm|ss|EEEE|MMMM|do/g, match => replacements[match]);
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'; // special case for 11th to 13th
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
