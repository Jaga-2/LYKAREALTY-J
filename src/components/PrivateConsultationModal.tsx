import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

import { crmService } from '../services/crmService';

interface PrivateConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledPropertyTitle?: string;
}

export const PrivateConsultationModal: React.FC<PrivateConsultationModalProps> = ({
  isOpen,
  onClose,
  prefilledPropertyTitle
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetTier, setBudgetTier] = useState('AED 100M – 250M ($27M – $68M)');
  const [preferredEnclave, setPreferredEnclave] = useState('Palm Jumeirah & Jumeirah Bay');
  const [advisoryScope, setAdvisoryScope] = useState('Private Off-Market Acquisition Mandate');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await crmService.createEnquiry({
        propertyId: prefilledPropertyTitle ? 'res-inquiry' : 'res-general',
        propertyTitle: prefilledPropertyTitle || `${preferredEnclave} — ${advisoryScope}`,
        customerName: clientName,
        email,
        phone,
        preferredCallbackTime: 'Afternoon GST',
        budgetTier,
        advisoryScope,
        message: `Client requested consultation regarding ${preferredEnclave}. Budget Tier: ${budgetTier}. Mandate: ${advisoryScope}.`,
        status: 'Received'
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed submitting consultation enquiry:', err);
      // Still show confirmation in UI
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#faf9f7] rounded-[4px] border border-[#c5a880]/50 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-[#1f2428] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a880]/30">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#c5a880]" />
            <span className="label-caps text-[#c5a880] text-[10px]">Sovereign Advisory Counter</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#dadad8] hover:text-white rounded-[2px] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#5a1645] border border-[#d4af37] text-[#ffd8eb] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Advisory Protocol Initialized
              </h3>
              <p className="text-sm text-[#44474a] font-light max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-[#1f2428]">{clientName}</span>. Your discrete consultation mandate has been assigned to our Managing Partner at DIFC Gate Precinct.
              </p>
              <div className="p-4 bg-white rounded-[3px] border border-[#c5a880]/20 text-xs text-[#75777a] max-w-md mx-auto">
                Direct phone verification will be initiated on <span className="text-[#1f2428] font-medium">{phone}</span> following identity clearance.
              </div>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#1f2428] text-[#c5a880] text-xs font-semibold tracking-wider uppercase rounded-[2px]"
                >
                  Close & Return
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-[#1f2428] mb-2 [text-wrap:balance]">
                  Private Client & Sovereign Family Office Advisory
                </h3>
                <p className="text-xs sm:text-sm text-[#44474a] font-light leading-relaxed">
                  {prefilledPropertyTitle
                    ? `Initiating private acquisition inquiry regarding: ${prefilledPropertyTitle}.`
                    : 'Bespoke mandate consultation for off-market residential acquisitions, SPV holding formations, and private banking escrow.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                      Patron Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elena Rostova"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-[2px] border border-[#c5a880]/30 text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="advisory@patron.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-[2px] border border-[#c5a880]/30 text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                      Phone Number / Signal *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+971 50 ... / +1 212 ..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-[2px] border border-[#c5a880]/30 text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                      Capital Allocation Tier
                    </label>
                    <select
                      value={budgetTier}
                      onChange={(e) => setBudgetTier(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-[2px] border border-[#c5a880]/30 text-[#1f2428] focus:outline-none"
                    >
                      <option value="AED 50M – 100M ($14M – $27M)">AED 50M – 100M ($14M – $27M)</option>
                      <option value="AED 100M – 250M ($27M – $68M)">AED 100M – 250M ($27M – $68M)</option>
                      <option value="AED 250M+ ($68M+) Sovereign Tier">AED 250M+ ($68M+) Sovereign Tier</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block label-caps text-[10px] text-[#75777a] mb-1">
                    Advisory Mandate Scope
                  </label>
                  <select
                    value={advisoryScope}
                    onChange={(e) => setAdvisoryScope(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-[2px] border border-[#c5a880]/30 text-[#1f2428] focus:outline-none"
                  >
                    <option value="Private Off-Market Acquisition Mandate">Private Off-Market Acquisition Mandate</option>
                    <option value="Bespoke Architect & Land Procurement">Bespoke Architect & Land Procurement</option>
                    <option value="DIFC Foundation & SPV Asset Structuring">DIFC Foundation & SPV Asset Structuring</option>
                    <option value="Private Portfolio Disposition">Private Portfolio Disposition</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#c5a880]/20">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-xs font-semibold tracking-[0.14em] uppercase rounded-[3px] border border-[#c5a880]/40 transition-colors shadow-md"
                  >
                    Transmit Sovereign Consultation Request
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
