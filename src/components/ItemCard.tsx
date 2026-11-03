import React from 'react';
import { MapPin, Calendar, Clock, Tag, User, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { LostFoundItem } from '../types';
import { getCategoryMeta } from '../utils/categories';

interface ItemCardProps {
  item: LostFoundItem;
  onSelect: (item: LostFoundItem) => void;
  onClaim?: (item: LostFoundItem) => void;
  isOwnerOrAdmin?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onSelect,
  onClaim,
  isOwnerOrAdmin,
}) => {
  const categoryMeta = getCategoryMeta(item.category);
  const isLost = item.itemType === 'lost';

  // Status badge config
  const getStatusBadge = () => {
    switch (item.status) {
      case 'open':
        return isLost ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFE5D9] text-[#9A3412] border border-[#FFCAB0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
            Lost
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#D8F5E5] text-[#065F46] border border-[#A3E7C3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            Found & Safe
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF5C2] text-[#854D0E] border border-[#FDE68A]">
            <Clock className="w-3 h-3 text-[#B45309]" />
            Claim Pending
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E8E2F8] text-[#5B21B6] border border-[#D8CEF6]">
            <CheckCircle2 className="w-3 h-3 text-[#7C3AED]" />
            Reunited ✨
          </span>
        );
      case 'closed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            Archived
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative rounded-3xl p-4 sm:p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        isLost
          ? 'bg-gradient-to-b from-[#FFF7ED] via-[#FFF1F2] to-white border border-[#FED7AA]/60 hover:border-[#FB923C] shadow-sm hover:shadow-pastel-peach'
          : 'bg-gradient-to-b from-[#F0FDF4] via-[#F5F3FF] to-white border border-[#BBF7D0]/60 hover:border-[#4ADE80] shadow-sm hover:shadow-pastel-mint'
      } hover:-translate-y-1.5`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getStatusBadge()}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${categoryMeta.bgPastel} ${categoryMeta.textPastel} ${categoryMeta.borderPastel}`}
            >
              <span>{categoryMeta.icon}</span>
              <span>{categoryMeta.label}</span>
            </span>
          </div>

          <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#94A3B8]" />
            {item.incidentDate || 'Recent'}
          </span>
        </div>

        {/* Image Preview or Icon Placeholder */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-white/70 border border-white/80 shadow-inner flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#94A3B8] p-4 text-center">
              <span className="text-4xl mb-1">{categoryMeta.icon}</span>
              <span className="text-xs font-medium text-[#64748B]">Photo not provided</span>
            </div>
          )}

          {/* Quick Item Type Ribbon */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm ${
                isLost
                  ? 'bg-[#FFEDD5]/90 text-[#C2410C] border border-white/60'
                  : 'bg-[#DCFCE7]/90 text-[#15803D] border border-white/60'
              }`}
            >
              {isLost ? 'LOST ITEM' : 'FOUND ON CAMPUS'}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-base sm:text-lg text-[#1E293B] group-hover:text-[#6D28D9] transition-colors line-clamp-1 mb-1.5">
          {item.title}
        </h3>
        <p className="text-xs sm:text-sm text-[#475569] line-clamp-2 mb-3 leading-relaxed">
          {item.description || 'No additional notes provided.'}
        </p>

        {/* Location Info */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#475569] mb-2 bg-white/80 px-2.5 py-1.5 rounded-xl border border-[#F1F5F9] w-fit max-w-full">
          <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
          <span className="truncate">{item.location || 'Campus Grounds'}</span>
        </div>
      </div>

      {/* Card Footer / Action */}
      <div className="pt-3 border-t border-[#F1F5F9]/80 flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <User className="w-3 h-3 text-[#94A3B8]" />
          <span className="truncate max-w-[120px]">
            {item.reportedByName || (isLost ? 'Student' : 'Finder')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isLost && item.status === 'open' && onClaim && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaim(item);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D8F5E5] to-[#A3E7C3] hover:from-[#A3E7C3] hover:to-[#6EE7B7] text-[#065F46] border border-[#A3E7C3] shadow-xs transition-all hover:scale-102"
            >
              Claim Item
            </button>
          )}

          <div className="w-7 h-7 rounded-xl bg-white/90 border border-[#E2E8F0] flex items-center justify-center text-[#64748B] group-hover:text-[#6D28D9] group-hover:border-[#D8CEF6] transition-all">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
