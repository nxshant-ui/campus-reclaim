import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Sparkles,
  Filter,
  Layers,
  ArrowUpDown,
  Calendar,
  MapPin,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { LostFoundItem, ItemType, ItemStatus } from '../types';
import { CATEGORIES } from '../utils/categories';
import { ItemCard } from '../components/ItemCard';
import { CampusMapSelector } from '../components/CampusMapSelector';

interface BrowseItemsPageProps {
  items: LostFoundItem[];
  initialTypeFilter?: 'all' | 'lost' | 'found';
  onSelectItem: (item: LostFoundItem) => void;
  onClaimItem: (item: LostFoundItem) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export const BrowseItemsPage: React.FC<BrowseItemsPageProps> = ({
  items,
  initialTypeFilter = 'all',
  onSelectItem,
  onClaimItem,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>(initialTypeFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showCampusMap, setShowCampusMap] = useState(false);

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.itemType === typeFilter;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      let matchesLocation = true;
      if (selectedLocation) {
        matchesLocation = (item.location || '')
          .toLowerCase()
          .includes(selectedLocation.toLowerCase());
      }

      let matchesDate = true;
      if (dateFilter !== 'all' && item.incidentDate) {
        const itemDate = new Date(item.incidentDate).getTime();
        const now = Date.now();
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today') matchesDate = diffDays <= 1;
        else if (dateFilter === 'week') matchesDate = diffDays <= 7;
        else if (dateFilter === 'month') matchesDate = diffDays <= 30;
      }

      return matchesSearch && matchesType && matchesCategory && matchesLocation && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.incidentDate).getTime();
      const dateB = new Date(b.createdAt || b.incidentDate).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const lostCount = items.filter((i) => i.itemType === 'lost').length;
  const foundCount = items.filter((i) => i.itemType === 'found').length;

  const hasActiveFilters =
    searchTerm !== '' ||
    typeFilter !== 'all' ||
    selectedCategory !== 'all' ||
    selectedLocation !== null ||
    dateFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setSelectedLocation(null);
    setDateFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#EDE9FE] via-[#DDF0FF] to-[#FAF8F5] p-6 sm:p-10 border border-[#D8CEF6] shadow-pastel-lavender">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-[#6D28D9] mb-3 border border-white">
              <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Campus Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">
              Browse Items
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1 leading-relaxed">
              Explore all reported lost belongings and found items submitted by students and campus desks.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFE5D9] to-[#FFD6D0] hover:from-[#FFCAB0] hover:to-[#FFAAA0] text-[#9A3412] text-xs font-bold shadow-xs transition-all border border-[#FFCAB0] flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#EA580C]" />
              <span>Report Lost Item</span>
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8F5E5] to-[#A3E7C3] hover:from-[#A3E7C3] hover:to-[#6EE7B7] text-[#065F46] text-xs font-bold shadow-xs transition-all border border-[#A3E7C3] flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#059669]" />
              <span>Report Found Item</span>
            </button>
          </div>
        </div>

        {/* Search & Type Tabs */}
        <div className="mt-8 pt-6 border-t border-[#D8CEF6]/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#7C3AED] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items by name, description, or campus spot..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/95 border border-[#D8CEF6] text-sm text-[#1E293B] placeholder-[#64748B] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 font-medium"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-white/90 p-1 rounded-2xl border border-[#D8CEF6]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#EDE9FE]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'lost'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#FFE5D9]'
              }`}
            >
              Lost ({lostCount})
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'found'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#D8F5E5]'
              }`}
            >
              Found ({foundCount})
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Sort, Date, Campus Map Toggle */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#D8CEF6]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7C3AED]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#D8CEF6]">
              <Calendar className="w-3.5 h-3.5 text-[#059669]" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Past 24 Hours</option>
                <option value="week">Date: Past 7 Days</option>
                <option value="month">Date: Past 30 Days</option>
              </select>
            </div>

            {/* Campus Explorer Toggle */}
            <button
              onClick={() => setShowCampusMap(!showCampusMap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                showCampusMap || selectedLocation
                  ? 'bg-[#DDD6FE] text-[#5B21B6] border-[#C4B5FD]'
                  : 'bg-white/90 text-slate-700 border-[#D8CEF6] hover:bg-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                {selectedLocation
                  ? `Spot: ${selectedLocation}`
                  : showCampusMap
                  ? 'Hide Campus Map'
                  : 'Explore Campus Map'}
              </span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white/80 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Interactive Collapsible Campus Map */}
      {showCampusMap && (
        <section className="p-6 rounded-3xl bg-white border border-[#D8CEF6] shadow-xs animate-in fade-in duration-200">
          <CampusMapSelector
            items={items}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
          />
        </section>
      )}

      {/* Category Pills Bar */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-xs'
              : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => {
          const count = items.filter(
            (i) => (typeFilter === 'all' || i.itemType === typeFilter) && i.category === cat.key
          ).length;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.key
                  ? `${cat.bgPastel} ${cat.textPastel} ${cat.borderPastel} shadow-xs ring-2 ring-[#7C3AED]/20`
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
              }`}
            >
              <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </section>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <p>
          Showing <strong>{filteredItems.length}</strong> matching belongings
        </p>
        {selectedLocation && (
          <span className="bg-[#EDE9FE] text-[#6D28D9] px-2 py-0.5 rounded-md text-[11px] font-semibold">
            Filtered by campus spot: {selectedLocation}
          </span>
        )}
      </div>

      {/* Grid */}
      <section>
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
                onClaim={onClaimItem}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-3xl mx-auto">
              📦
            </div>
            <h3 className="font-extrabold text-lg text-[#1E293B]">No items match your search</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try choosing another category, campus spot, or resetting your search filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold shadow-xs hover:bg-[#6D28D9]"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
