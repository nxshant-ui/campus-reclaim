import React from 'react';
import { Compass, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { PageView } from '../types';
import { CampusConfig } from '../firebase/settings';

interface FooterProps {
  onNavigate: (page: PageView) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  config: CampusConfig;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenReportModal, config }) => {
  return (
    <footer className="mt-20 border-t border-[#E8E2F8] bg-gradient-to-b from-[#FAF8F5] to-[#F3E8FF]/20 pt-12 pb-10 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#E2E8F0]">
          {/* Col 1: Brand & Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8E2F8] via-[#FFE4EC] to-[#DDF0FF] p-2 flex items-center justify-center border border-white">
                <Compass className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <span className="font-extrabold text-lg text-[#1E293B]">
                Campus Reclaim
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              A smart digital platform where college students can report lost items, submit found items, search belongings and request item recovery.
            </p>
          </div>

          {/* Col 2: Simple Navigation */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[#1E293B]">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-[#64748B]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#7C3AED] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#059669] transition-colors"
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenReportModal('lost')}
                  className="hover:text-[#EA580C] transition-colors"
                >
                  Report Lost Item
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenReportModal('found')}
                  className="hover:text-[#16A34A] transition-colors"
                >
                  Report Found Item
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('browse')}
                  className="hover:text-[#6D28D9] transition-colors"
                >
                  Browse Items
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('claims')}
                  className="hover:text-[#DB2777] transition-colors"
                >
                  My Claims
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#4338CA] transition-colors"
                >
                  Admin Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Configurable Campus Drop-Off Spots */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[#1E293B]">
              Campus Drop-Off Spots
            </h4>
            <ul className="space-y-1.5 text-[#64748B]">
              {config.dropOffSpots && config.dropOffSpots.length > 0 ? (
                config.dropOffSpots.map((spot, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                    <span>{spot}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400">Configure drop-off spots in Admin Dashboard</li>
              )}
            </ul>
          </div>

          {/* Col 4: Configurable Campus Contact */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[#1E293B]">
              Campus Contact & Hours
            </h4>
            <div className="space-y-1.5 text-[#64748B]">
              <p className="font-semibold text-[#1E293B]">{config.officeName}</p>
              {config.locationInfo && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                  <span>{config.locationInfo}</span>
                </p>
              )}
              {config.contactEmail && (
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>{config.contactEmail}</span>
                </p>
              )}
              {config.contactPhone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>{config.contactPhone}</span>
                </p>
              )}
              {config.officeHours && (
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>{config.officeHours}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Required Footer Title */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-3">
          <p>© {new Date().getFullYear()} Campus Reclaim</p>
          <p>A smart digital platform for college students</p>
        </div>
      </div>
    </footer>
  );
};
