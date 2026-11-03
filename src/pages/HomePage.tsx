import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { LostFoundItem, PageView } from '../types';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import { ItemCard } from '../components/ItemCard';
import { CampusMapSelector } from '../components/CampusMapSelector';

interface HomePageProps {
  items: LostFoundItem[];
  onNavigate: (page: PageView) => void;
  onSelectItem: (item: LostFoundItem) => void;
  onClaimItem: (item: LostFoundItem) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  items,
  onNavigate,
  onSelectItem,
  onClaimItem,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);


  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLocation =
      !selectedLocation ||
      (item.location || '').toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const recentFound = filteredItems.filter((i) => i.itemType === 'found').slice(0, 4);
  const recentLost = filteredItems.filter((i) => i.itemType === 'lost').slice(0, 4);

  const returnedCount = items.filter((i) => i.status === 'returned').length;
  const activeCount = items.filter((i) => i.status === 'open').length;

  return (
    <div className="space-y-12 pb-16 text-left">
      {/* Hero Section: Lavender + Baby Pink Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#E8E2F8] via-[#FFE4EC] to-[#FDFBF7] p-6 sm:p-10 lg:p-12 border border-white/90 shadow-pastel-lavender">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gradient-to-bl from-[#DDD6FE]/60 to-[#FCE7F3]/40 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#FFE4EC]/70 to-[#E8E2F8]/40 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white text-xs font-bold text-[#6D28D9] mb-4 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#EC4899]" />
            <span>Campus Reclaim</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#1E293B] leading-[1.2] mb-4">
            Reclaim your lost items,{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] via-[#DB2777] to-[#F43F5E] bg-clip-text text-transparent">
              connected across campus.
            </span>
          </h1>

          {/* User Required Website Description */}
          <p className="text-sm sm:text-lg text-[#475569] mb-8 font-medium leading-relaxed max-w-2xl">
            A smart digital platform where college students can report lost items, submit found items,
            search belongings and request item recovery.
          </p>

          {/* Quick Search Box */}
          <div className="bg-white/90 p-2 sm:p-2.5 rounded-3xl shadow-xl border border-white flex flex-col sm:flex-row items-center gap-2 mb-6 backdrop-blur-md">
            <div className="flex items-center gap-3 w-full px-3 py-2 flex-1">
              <Search className="w-5 h-5 text-[#8B5CF6] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search belongings by title, description, or campus spot..."
                className="w-full bg-transparent outline-none text-sm sm:text-base font-medium text-[#1E293B] placeholder-[#94A3B8]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('browse')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#EDE9FE] to-[#DDF0FF] text-[#6D28D9] text-xs font-bold transition-all shadow-xs hover:scale-102 flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse Items</span>
              </button>
            </div>
          </div>

          {/* Real Dynamic Stats Badges */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm font-semibold text-[#475569]">
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-2xl border border-white/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
              <span>
                <strong className="text-[#1E293B]">{activeCount}</strong> Active Items
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-2xl border border-white/60">
              <CheckCircle className="w-4 h-4 text-[#7C3AED]" />
              <span>
                <strong className="text-[#1E293B]">{returnedCount}</strong> Successfully Reunited
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-2xl border border-white/60">
              <ShieldCheck className="w-4 h-4 text-[#DB2777]" />
              <span>Student Verified Recovery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Cards: Peach for Lost & Mint for Found */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lost Card */}
        <div className="group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FFE5D9] via-[#FFD6D0] to-white border border-[#FFCAB0] shadow-xs hover:shadow-pastel-peach transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] flex items-center justify-center text-2xl shadow-xs border border-white">
              🔍
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FED7AA] text-[#9A3412]">
              Lost Something?
            </span>
          </div>
          <h3 className="text-2xl font-black text-[#1E293B] mb-2">
            Report Lost Item
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] mb-6 leading-relaxed">
            Report what you lost, specifying distinguishing features and the campus location where you
            last had it. Fellow students and desk staff can match it.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#E11D48] hover:from-[#C2410C] hover:to-[#BE185D] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-[#9A3412] text-xs sm:text-sm font-bold border border-[#FFCAB0] transition-all"
            >
              Browse All Lost Items
            </button>
          </div>
        </div>

        {/* Found Card */}
        <div className="group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#D8F5E5] via-[#DDF0FF] to-white border border-[#A3E7C3] shadow-xs hover:shadow-pastel-mint transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-2xl shadow-xs border border-white">
              ✨
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#BBF7D0] text-[#065F46]">
              Found Belongings?
            </span>
          </div>
          <h3 className="text-2xl font-black text-[#1E293B] mb-2">
            Report Found Item
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] mb-6 leading-relaxed">
            Found keys, a calculator, or an ID card? Register it with a photo so the owner can verify
            ownership and reclaim it safely.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-[#065F46] text-xs sm:text-sm font-bold border border-[#A3E7C3] transition-all"
            >
              Browse Found Catalog
            </button>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#1E293B]">Item Categories</h3>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-[#7C3AED] font-semibold hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#EDE9FE] to-[#FCE7F3] text-[#6D28D9] border-[#DDD6FE] shadow-xs'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
            }`}
          >
            🌟 All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.key
                  ? `${cat.bgPastel} ${cat.textPastel} ${cat.borderPastel} shadow-xs ring-2 ring-[#8B5CF6]/20`
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-white/90'
              }`}
            >
              <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Campus Map Section */}
      <section className="p-6 sm:p-8 rounded-[2rem] bg-white border border-[#D8CEF6] shadow-xs">
        <CampusMapSelector
          items={items}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
        />
      </section>

      {/* Recently Found Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E293B]">
                Recently Found Items
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Handed in to campus desks or found in common study spaces
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#059669] hover:text-[#047857] hover:underline"
          >
            <span>Browse all items</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentFound.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentFound.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
                onClaim={onClaimItem}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] text-center text-[#64748B] text-xs">
            No items matching your filter in the found catalog.
          </div>
        )}
      </section>

      {/* Recently Lost Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E293B]">
                Recently Reported Lost
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Keep an eye out for these belongings around campus
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#EA580C] hover:text-[#C2410C] hover:underline"
          >
            <span>Browse all items</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentLost.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentLost.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] text-center text-[#64748B] text-xs">
            No matching items in the lost catalog.
          </div>
        )}
      </section>

      {/* How it Works: 3 Clean Steps */}
      <section className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-[#EDE9FE] via-[#FCE7F3] to-[#DDF0FF] border border-white shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 text-[#6D28D9]">
            Simple & Secure Process
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1E293B] mt-2 mb-2">
            How The Portal Works
          </h3>
          <p className="text-xs sm:text-sm text-[#475569]">
            Three straightforward steps to retrieve or safely turn in belongings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/90 border border-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#FFE5D9] text-[#9A3412] font-black text-lg flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="font-extrabold text-base text-[#1E293B] mb-1">
              Search or Report
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Browse our real-time feed by location and item category, or publish a report with
              photos and details within seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 border border-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#D8F5E5] text-[#065F46] font-black text-lg flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="font-extrabold text-base text-[#1E293B] mb-1">
              Verify Ownership
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              When claiming a found item, submit distinguishing proof (serial number, passcode,
              engraving, or unique scratches) reviewed by the administrator.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 border border-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8E2F8] text-[#5B21B6] font-black text-lg flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="font-extrabold text-base text-[#1E293B] mb-1">
              Pick Up at Designated Spot
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Once verified, collect your item at the designated campus drop-off spot with your student ID card.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
