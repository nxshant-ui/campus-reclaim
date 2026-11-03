import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  AlertCircle,
  Sparkles,
  MapPin,
  Tag,
  Check,
  Calendar,
  Crop,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { CATEGORIES } from '../utils/categories';
import { createItem } from '../firebase/items';
import { uploadItemPhoto } from '../firebase/storage';
import { ImageCropEnhanceModal } from './ImageCropEnhanceModal';
import { ItemCategory, ItemType, LostFoundItem } from '../types';

interface ReportItemModalProps {
  isOpen: boolean;
  initialType: ItemType;
  onClose: () => void;
  onSuccess: (newItemId: string) => void;
}

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  isOpen,
  initialType,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('electronics');
  const [location, setLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [description, setDescription] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Image cropping and auto-enhancement state
  const [rawImageToCrop, setRawImageToCrop] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [photoEnhanced, setPhotoEnhanced] = useState<boolean>(false);

  useEffect(() => {
    setItemType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (user || profile) {
      setContactName(user?.displayName || profile?.displayName || '');
      setContactEmail(user?.email || profile?.email || '');
      setContactPhone(profile?.phone || '');
    }
  }, [user, profile]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      setErrorMsg('');
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const rawData = readerEvent.target?.result as string;
        setRawImageToCrop(rawData);
        setIsCropModalOpen(true);
        setImageLoading(false);
      };
      reader.onerror = () => {
        setErrorMsg('Could not read image file.');
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image loading error:', err);
      setErrorMsg('Could not load image file.');
      setImageLoading(false);
    }
  };

  const handleCropApply = (enhancedDataUrl: string) => {
    setImageUrl(enhancedDataUrl);
    setPhotoEnhanced(true);
  };

  const handleLocationPreset = (preset: string) => {
    setLocation(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setErrorMsg('Please provide a title and location for the item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const reporterUid = auth.currentUser
        ? auth.currentUser.uid
        : user?.uid || 'guest_' + Date.now();
      const reporterName = contactName || user?.displayName || 'Campus Member';
      const reporterEmail = contactEmail || user?.email || 'noreply@campus.edu';
      const tempId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      // Upload enhanced photo to Firebase Storage if photo present
      let finalPhotoUrl = imageUrl;
      if (imageUrl) {
        finalPhotoUrl = await uploadItemPhoto(imageUrl, tempId);
      }

      const newItemData: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim(),
        itemType,
        category,
        location: location.trim(),
        incidentDate:
          incidentDate ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        status: 'open',
        imageUrl: finalPhotoUrl || undefined,
        contactName: reporterName,
        contactEmail: reporterEmail,
        contactPhone: contactPhone.trim() || undefined,
        reportedBy: reporterUid,
        reportedByName: reporterName,
        reportedByEmail: reporterEmail,
        securityQuestion: securityQuestion.trim() || undefined,
      };

      let id = tempId;
      if (auth.currentUser) {
        id = await createItem(newItemData, tempId);
      }
      onSuccess(id);
      onClose();
    } catch (err: unknown) {
      console.error('Submit item error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish item report.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLost = itemType === 'lost';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        ></div>

        {/* Modal Dialog */}
        <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden z-10 my-8">
          {/* Modal Header */}
          <div
            className={`p-5 sm:p-6 text-left transition-colors ${
              isLost
                ? 'bg-gradient-to-r from-[#FFE5D9] via-[#FFD6D0] to-[#FFE4EC] text-[#9A3412]'
                : 'bg-gradient-to-r from-[#D8F5E5] via-[#DDF0FF] to-[#E8E2F8] text-[#065F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isLost ? '🔍' : '✨'}</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E293B]">
                    {isLost ? 'Report a Lost Item' : 'Turn In a Found Item'}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium opacity-80">
                    {isLost
                      ? 'Broadcast to students and staff so anyone who finds it can return it safely.'
                      : 'Help a fellow student or colleague recover their belongings.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/70 hover:bg-white text-[#475569] hover:text-[#0F172A] shadow-xs transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Toggle Pills */}
            <div className="mt-4 flex items-center gap-2 bg-white/70 p-1 rounded-2xl border border-white max-w-xs">
              <button
                type="button"
                onClick={() => setItemType('lost')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  isLost
                    ? 'bg-gradient-to-r from-[#FFCAB0] to-[#FFAAA0] text-[#7C2D12] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setItemType('found')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  !isLost
                    ? 'bg-gradient-to-r from-[#A3E7C3] to-[#86EFAC] text-[#064E3B] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                I Found Something
              </button>
            </div>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-[#FFE4E6] text-[#9F1239] text-xs font-semibold flex items-center gap-2 border border-[#FECDD3]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Item Title / Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isLost
                    ? 'e.g., Space Gray MacBook Air M2 in Black Sleeve'
                    : 'e.g., Avocado Sticker AirPods Case with Earbuds'
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-sm text-[#1E293B] font-medium transition-all"
              />
            </div>

            {/* Category & Date in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-sm text-[#1E293B] font-medium transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                  Date & Time Noticed
                </label>
                <input
                  type="text"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  placeholder="e.g., Today at 10:30 AM"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-sm text-[#1E293B] font-medium transition-all"
                />
              </div>
            </div>

            {/* Location & Quick Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Campus Location *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Main Library - 2nd Floor Silent Area, Table 12"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-sm text-[#1E293B] font-medium transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-[#64748B] font-semibold">Presets:</span>
                {[
                  'Main Library',
                  'Student Union',
                  'Science Hall',
                  'Math Dept',
                  'Rec Center Gym',
                  'Dining Commons',
                  'Campus Security Desk',
                ].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocationPreset(loc)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-[#E2E8F0]/60 hover:bg-[#D8CEF6] text-[#475569] hover:text-[#6D28D9] font-medium transition-colors"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Detailed Description & Distinguishing Features
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe color, brand, stickers, scratches, wear, or any accessories attached..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-sm text-[#1E293B] font-medium transition-all"
              />
            </div>

            {/* Security Question (Crucial for verifying claimants) */}
            <div className="p-3.5 rounded-2xl bg-[#EDE9FE]/50 border border-[#DDD6FE]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-1">
                🔐 Verification Question / Secret Detail
              </label>
              <p className="text-[11px] text-[#5B21B6] mb-1.5 font-normal">
                Ask a question only the authentic owner can answer (e.g., "What wallpaper is on the lock screen?" or "What initials are written inside?").
              </p>
              <input
                type="text"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                placeholder="e.g., What keychain charm or sticker is on the back?"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DDD6FE] focus:border-[#7C3AED] outline-none text-xs text-[#1E293B] font-medium"
              />
            </div>

            {/* Canvas Cropping & Auto-Enhancement Photo Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Item Photograph
                </label>
                <span className="text-[11px] font-semibold text-[#059669] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Canvas Auto-Enhance & 4:3 Crop Enabled</span>
                </span>
              </div>

              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#CBD5E1] bg-slate-900/5 p-3 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-44 h-32 rounded-xl overflow-hidden border border-white shadow-sm shrink-0 bg-slate-100">
                    <img
                      src={imageUrl}
                      alt="Uploaded item"
                      className="w-full h-full object-cover"
                    />
                    {photoEnhanced && (
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#10B981] text-white text-[9px] font-bold shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Enhanced</span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-xs space-y-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1E293B]">Normalized 4:3 Canvas Photo</span>
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    </div>
                    <p className="text-[#64748B] text-[11px] leading-relaxed">
                      Photo has been balanced for clarity, contrast, and edge sharpness to assist campus
                      identification.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCropModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#6D28D9] border border-[#D8CEF6] text-xs font-bold shadow-2xs flex items-center gap-1 transition-all"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Re-Crop & Adjust</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setRawImageToCrop('');
                          setPhotoEnhanced(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FECDD3] text-xs font-medium transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 px-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#059669] rounded-2xl cursor-pointer bg-white/80 hover:bg-[#D8F5E5]/20 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-[#D8F5E5] text-[#065F46] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5 text-[#059669]" />
                    </div>
                    <p className="text-xs font-bold text-[#1E293B]">
                      Upload Photo with Canvas Cropping & Auto-Enhancement
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Select any photo to crop, rotate, and auto-enhance clarity before publishing
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={imageLoading}
                  />
                </label>
              )}

              {imageLoading && (
                <p className="text-xs text-[#059669] font-medium mt-1 animate-pulse">
                  Opening image in Canvas editor...
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8F0]">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#1E293B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#1E293B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contact phone"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#1E293B]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all hover:scale-102 active:scale-98 disabled:opacity-50 ${
                  isLost
                    ? 'bg-gradient-to-r from-[#EA580C] to-[#E11D48] hover:from-[#C2410C] hover:to-[#BE185D]'
                    : 'bg-gradient-to-r from-[#059669] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9]'
                }`}
              >
                {submitting
                  ? 'Publishing to Campus...'
                  : isLost
                  ? 'Publish Lost Report'
                  : 'Turn In Found Item'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Canvas Image Cropper & Auto-Enhancer Modal */}
      {isCropModalOpen && rawImageToCrop && (
        <ImageCropEnhanceModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageToCrop}
          onClose={() => setIsCropModalOpen(false)}
          onApply={handleCropApply}
        />
      )}
    </>
  );
};
