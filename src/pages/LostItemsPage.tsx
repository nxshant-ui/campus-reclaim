import React, { useState } from 'react';
import { Search, PlusCircle, Filter, AlertTriangle, Calendar, MapPin, Tag } from 'lucide-react';
import { LostFoundItem, ItemStatus } from '../types';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import { ItemCard } from '../components/ItemCard';

interface LostItemsPageProps {
  items: LostFoundItem[];
  onSelectItem: (item: LostFoundItem) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export const LostItemsPage: React.FC<LostItemsPageProps> = ({
  items,
  onSelectItem,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('open');

  const lostItems = items.filter((i) => i.itemType === 'lost');

  const filteredItems = lostItems.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openCount = lostItems.filter((i) => i.status === 'open').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Banner: Peach + Coral Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#FFE5D9] via-[#FFD6D0] to-[#FFE4EC] p-6 sm:p-10 border border-[#FFCAB0] shadow-pastel-peach">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-[#9A3412] mb-3 border border-white">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse"></span>
              <span>Missing Belongings Registry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">
              Lost Items Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[#7C2D12] font-medium mt-1 leading-relaxed">
              Browse items reported missing across campus halls, lecture rooms, and recreation facilities.
              If you spotted or picked up any of these items, please contact the student or turn it in.
            </p>
          </div>

          <button
            onClick={() => onOpenReportModal('lost')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#E11D48] hover:from-[#C2410C] hover:to-[#BE185D] text-white text-sm font-bold shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report a Lost Item</span>
          </button>
        </div>

        {/* Search & Filters Inside Header */}
        <div className="mt-8 pt-6 border-t border-[#FFCAB0]/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#9A3412] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lost items (e.g., MacBook, hydro flask, keys, wallet)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/95 border border-[#FFCAB0] text-sm text-[#1E293B] placeholder-[#9A3412]/60 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white/90 p-1 rounded-2xl border border-[#FFCAB0]">
            <button
              onClick={() => setSelectedStatus('open')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'open'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#7C2D12] hover:bg-[#FFE5D9]'
              }`}
            >
              Still Missing ({openCount})
            </button>
            <button
              onClick={() => setSelectedStatus('returned')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'returned'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#7C2D12] hover:bg-[#FFE5D9]'
              }`}
            >
              Reunited ✨
            </button>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'all'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-[#7C2D12] hover:bg-[#FFE5D9]'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-sm'
              : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
          }`}
        >
          All Items ({lostItems.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = lostItems.filter((i) => i.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.key
                  ? 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA] ring-2 ring-[#EA580C]/30 shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
              }`}
            >
              <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </section>

      {/* Items Grid */}
      <section>
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#FFE5D9] text-[#EA580C] flex items-center justify-center text-3xl mx-auto">
              🔍
            </div>
            <h3 className="font-extrabold text-lg text-[#1E293B]">
              No lost items found matching your criteria
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try adjusting your search terms or category filters. If you lost something, report it now!
            </p>
            <button
              onClick={() => onOpenReportModal('lost')}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-[#EA580C] text-white text-xs font-bold shadow-sm"
            >
              Publish a Lost Item Report
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
