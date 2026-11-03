import React from 'react';
import { LostFoundItem } from '../types';
import {
  BookOpen,
  Coffee,
  GraduationCap,
  Laptop,
  Car,
  Activity,
  Award,
  DoorOpen,
  Compass,
} from 'lucide-react';

interface CampusMapSelectorProps {
  items: LostFoundItem[];
  selectedLocation: string | null;
  onSelectLocation: (location: string | null) => void;
  variant?: 'compact' | 'full';
}

interface CampusZone {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderCol: string;
  badgeCol: string;
  description: string;
}

const CAMPUS_ZONES: CampusZone[] = [
  {
    id: 'library',
    name: 'Central Library',
    shortName: 'Library',
    icon: <BookOpen className="w-5 h-5 text-[#6D28D9]" />,
    bgGradient: 'from-[#EDE9FE] to-[#F5F3FF]',
    borderCol: 'border-[#DDD6FE]',
    badgeCol: 'bg-[#DDD6FE] text-[#5B21B6]',
    description: 'Reading halls, reference desk & stack areas',
  },
  {
    id: 'canteen',
    name: 'Campus Canteen & Food Court',
    shortName: 'Canteen',
    icon: <Coffee className="w-5 h-5 text-[#C2410C]" />,
    bgGradient: 'from-[#FFEDD5] to-[#FFF7ED]',
    borderCol: 'border-[#FED7AA]',
    badgeCol: 'bg-[#FED7AA] text-[#9A3412]',
    description: 'Dining tables, counter & coffee kiosk',
  },
  {
    id: 'classroom',
    name: 'Academic Block Classrooms',
    shortName: 'Classroom',
    icon: <GraduationCap className="w-5 h-5 text-[#0369A1]" />,
    bgGradient: 'from-[#E0F2FE] to-[#F0F9FF]',
    borderCol: 'border-[#BAE6FD]',
    badgeCol: 'bg-[#BAE6FD] text-[#075985]',
    description: 'Lecture halls, tutorial rooms & seminar halls',
  },
  {
    id: 'computer_lab',
    name: 'Computer & Engineering Labs',
    shortName: 'Computer Lab',
    icon: <Laptop className="w-5 h-5 text-[#0F766E]" />,
    bgGradient: 'from-[#CCFBF1] to-[#F0FDFA]',
    borderCol: 'border-[#99F6E4]',
    badgeCol: 'bg-[#99F6E4] text-[#115E59]',
    description: 'Workstations, server lab & IT helpdesk',
  },
  {
    id: 'parking',
    name: 'Campus Parking Area',
    shortName: 'Parking Area',
    icon: <Car className="w-5 h-5 text-[#854D0E]" />,
    bgGradient: 'from-[#FEF9C3] to-[#FEFCE8]',
    borderCol: 'border-[#FEF08A]',
    badgeCol: 'bg-[#FEF08A] text-[#713F12]',
    description: 'Two-wheeler shed & student car parking',
  },
  {
    id: 'sports',
    name: 'Sports Ground & Playground',
    shortName: 'Playground',
    icon: <Activity className="w-5 h-5 text-[#15803D]" />,
    bgGradient: 'from-[#DCFCE7] to-[#F0FDF4]',
    borderCol: 'border-[#BBF7D0]',
    badgeCol: 'bg-[#BBF7D0] text-[#166534]',
    description: 'Athletics track, court & sports locker room',
  },
  {
    id: 'auditorium',
    name: 'Main Auditorium',
    shortName: 'Auditorium',
    icon: <Award className="w-5 h-5 text-[#BE185D]" />,
    bgGradient: 'from-[#FCE7F3] to-[#FDF2F8]',
    borderCol: 'border-[#FBCFE8]',
    badgeCol: 'bg-[#FBCFE8] text-[#9D174D]',
    description: 'Convocations, cultural hall & green rooms',
  },
  {
    id: 'main_gate',
    name: 'Main Gate & Security Desk',
    shortName: 'Main Gate',
    icon: <DoorOpen className="w-5 h-5 text-[#475569]" />,
    bgGradient: 'from-[#F1F5F9] to-[#F8FAFC]',
    borderCol: 'border-[#E2E8F0]',
    badgeCol: 'bg-[#E2E8F0] text-[#334155]',
    description: 'Entry checkpoints & central visitor desk',
  },
];

export const CampusMapSelector: React.FC<CampusMapSelectorProps> = ({
  items,
  selectedLocation,
  onSelectLocation,
  variant = 'full',
}) => {
  // Count items matching zone name or shortName
  const getZoneCounts = (zone: CampusZone) => {
    const q1 = zone.name.toLowerCase();
    const q2 = zone.shortName.toLowerCase();
    const matched = items.filter((item) => {
      const loc = (item.location || '').toLowerCase();
      return loc.includes(q1) || loc.includes(q2);
    });
    const lost = matched.filter((i) => i.itemType === 'lost' && i.status === 'open').length;
    const found = matched.filter((i) => i.itemType === 'found' && i.status === 'open').length;
    return { total: matched.length, lost, found };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#DDD6FE] text-[#6D28D9]">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#1E293B]">Interactive Campus Explorer</h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Click any campus zone to view items reported lost or found in that specific location
          </p>
        </div>

        {selectedLocation && (
          <button
            onClick={() => onSelectLocation(null)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Clear Location Filter (Showing All)
          </button>
        )}
      </div>

      <div
        className={`grid gap-3.5 ${
          variant === 'compact'
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
        }`}
      >
        {CAMPUS_ZONES.map((zone) => {
          const counts = getZoneCounts(zone);
          const isSelected =
            selectedLocation?.toLowerCase() === zone.name.toLowerCase() ||
            selectedLocation?.toLowerCase() === zone.shortName.toLowerCase();

          return (
            <button
              key={zone.id}
              onClick={() => {
                if (isSelected) {
                  onSelectLocation(null);
                } else {
                  onSelectLocation(zone.shortName);
                }
              }}
              className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-[#7C3AED] shadow-md bg-white border-[#7C3AED]'
                  : `bg-gradient-to-br ${zone.bgGradient} ${zone.borderCol} hover:shadow-md hover:-translate-y-0.5`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-white shadow-2xs group-hover:scale-105 transition-transform">
                  {zone.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  {counts.lost > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE5D9] text-[#C2410C] border border-[#FED7AA]">
                      {counts.lost} Lost
                    </span>
                  )}
                  {counts.found > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8F5E5] text-[#065F46] border border-[#A7F3D0]">
                      {counts.found} Found
                    </span>
                  )}
                  {counts.total === 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-[#64748B]">
                      0 items
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#6D28D9] transition-colors">
                  {zone.shortName}
                </h4>
                <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                  {zone.description}
                </p>
              </div>

              {isSelected && (
                <div className="mt-2 text-[10px] font-bold text-[#6D28D9] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-ping" />
                  Active Filter
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
