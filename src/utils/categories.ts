import { ItemCategory } from '../types';

export interface CategoryMeta {
  key: ItemCategory;
  label: string;
  icon: string;
  bgPastel: string;
  textPastel: string;
  borderPastel: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'electronics',
    label: 'Electronics & Laptops',
    icon: '💻',
    bgPastel: 'bg-[#DDF0FF]',
    textPastel: 'text-[#1E40AF]',
    borderPastel: 'border-[#BAE0FD]',
  },
  {
    key: 'id_cards',
    label: 'ID Cards & Badges',
    icon: '🪪',
    bgPastel: 'bg-[#FFE4EC]',
    textPastel: 'text-[#9D174D]',
    borderPastel: 'border-[#FDC2D6]',
  },
  {
    key: 'keys',
    label: 'Keys & Fobs',
    icon: '🔑',
    bgPastel: 'bg-[#FFF5C2]',
    textPastel: 'text-[#854D0E]',
    borderPastel: 'border-[#FDE68A]',
  },
  {
    key: 'books_stationery',
    label: 'Books & Stationery',
    icon: '📚',
    bgPastel: 'bg-[#E8E2F8]',
    textPastel: 'text-[#5B21B6]',
    borderPastel: 'border-[#D8CEF6]',
  },
  {
    key: 'clothing',
    label: 'Clothing & Jackets',
    icon: '🧥',
    bgPastel: 'bg-[#FFE5D9]',
    textPastel: 'text-[#9A3412]',
    borderPastel: 'border-[#FFCAB0]',
  },
  {
    key: 'bags',
    label: 'Bags & Backpacks',
    icon: '🎒',
    bgPastel: 'bg-[#D8F5E5]',
    textPastel: 'text-[#065F46]',
    borderPastel: 'border-[#A3E7C3]',
  },
  {
    key: 'water_bottles',
    label: 'Water Bottles',
    icon: '🍶',
    bgPastel: 'bg-[#DDF0FF]',
    textPastel: 'text-[#0369A1]',
    borderPastel: 'border-[#BAE0FD]',
  },
  {
    key: 'jewelry',
    label: 'Jewelry & Watches',
    icon: '💍',
    bgPastel: 'bg-[#FFE4EC]',
    textPastel: 'text-[#BE185D]',
    borderPastel: 'border-[#FDC2D6]',
  },
  {
    key: 'sports',
    label: 'Sports Equipment',
    icon: '⚽',
    bgPastel: 'bg-[#D8F5E5]',
    textPastel: 'text-[#166534]',
    borderPastel: 'border-[#A3E7C3]',
  },
  {
    key: 'other',
    label: 'Other Items',
    icon: '📦',
    bgPastel: 'bg-[#F3E8FF]',
    textPastel: 'text-[#6B21A8]',
    borderPastel: 'border-[#E9D5FF]',
  },
];

export function getCategoryMeta(key: string): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === key);
  return (
    found || {
      key: 'other',
      label: key || 'Other Item',
      icon: '📦',
      bgPastel: 'bg-[#F3E8FF]',
      textPastel: 'text-[#6B21A8]',
      borderPastel: 'border-[#E9D5FF]',
    }
  );
}
