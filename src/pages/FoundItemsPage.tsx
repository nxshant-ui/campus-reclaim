import React, { useState } from 'react';
import { Search, Sparkles, Filter, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { LostFoundItem, ItemStatus } from '../types';
import { CATEGORIES } from '../utils/categories';
import { ItemCard } from '../components/ItemCard';

interface FoundItemsPageProps {
  items: LostFoundItem[];
  onSelectItem: (item: LostFoundItem) => void;
  onClaimItem: (item: LostFoundItem) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export const FoundItemsPage: React.FC<FoundItemsPageProps> = ({
  items,
  onSelectItem,
  onClaimItem,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('open');

  const foundItems = items.filter((i) => i.itemType === 'found');

  const filteredItems = foundItems.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const availableCount = foundItems.filter((i) => i.status === 'open').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Banner: Mint + Lavender Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#D8F5E5] via-[#E8E2F8] to-[#DDF0FF] p-6 sm:p-10 border border-[#A3E7C3] shadow-pastel-mint">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-[#065F46] mb-3 border border-white">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
              <span>Campus Holding & Custody Registry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">
              Found Belongings Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[#334155] font-medium mt-1 leading-relaxed">
              Belongings safely turned in by students, professors, and custodial staff. Look for your
              item below and submit proof of ownership to claim it back.
            </p>
          </div>

          <button
            onClick={() => onOpenReportModal('found')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#059669] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9] text-white text-sm font-bold shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-5 h-5" />
            <span>Turn In a Found Item</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="mt-8 pt-6 border-t border-[#A3E7C3]/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#059669] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search found belongings (e.g., AirPods, calculator, keys, jacket)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/95 border border-[#A3E7C3] text-sm text-[#1E293B] placeholder-[#065F46]/60 focus:outline-none focus:ring-2 focus:ring-[#059669]/20 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/90 p-1 rounded-2xl border border-[#A3E7C3]">
            <button
              onClick={() => setSelectedStatus('open')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'open'
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'text-[#065F46] hover:bg-[#D8F5E5]'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setSelectedStatus('claimed')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'claimed'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'text-[#065F46] hover:bg-[#D8F5E5]'
              }`}
            >
              In Review
            </button>
            <button
              onClick={() => setSelectedStatus('returned')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'returned'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#065F46] hover:bg-[#D8F5E5]'
              }`}
            >
              Reunited ✨
            </button>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === 'all'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-[#065F46] hover:bg-[#D8F5E5]'
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
              ? 'bg-[#15803D] text-white border-[#15803D] shadow-sm'
              : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
          }`}
        >
          All Items ({foundItems.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = foundItems.filter((i) => i.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.key
                  ? 'bg-[#DCFCE7] text-[#065F46] border-[#BBF7D0] ring-2 ring-[#16A34A]/30 shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
              }`}
            >
              <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </section>

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
            <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center text-3xl mx-auto">
              ✨
            </div>
            <h3 className="font-extrabold text-lg text-[#1E293B]">
              No found items matching your search
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              If someone turns in your item later, it will appear here immediately. You can also file
              a lost report so our security desk can match it.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
