import React from 'react';
import { Lock, FileCheck, KeyRound, Building2 } from 'lucide-react';

interface SovereignAtelierProps {
  onOpenConsultation: () => void;
}

export const SovereignAtelier: React.FC<SovereignAtelierProps> = ({ onOpenConsultation }) => {
  return (
    <section id="sovereign-atelier" className="py-20 bg-[#121517] text-white border-t border-[#c5a880]/20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Proposition */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#c5a880] mb-4">
              <Lock className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Sovereign Off-Market Atelier</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-6 leading-tight [text-wrap:balance]">
              The Discretionary Vault for Ultra-Prime Holdings
            </h2>

            <p className="text-[#dadad8] text-sm sm:text-base font-light leading-relaxed max-w-2xl mb-8">
              Over 65% of Dubai’s most architecturally significant transactions never appear on public aggregators or portals. LYKA operates a private counter for heads of state, sovereign funds, and generational families requiring uncompromised anonymity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#c5a880]/20">
              <div>
                <div className="flex items-center gap-2 text-[#c5a880] mb-2">
                  <FileCheck className="w-4 h-4" />
                  <span className="label-caps text-white text-[10px]">Bilateral NDA</span>
                </div>
                <p className="text-xs text-[#dadad8] font-light">
                  Strict non-disclosure agreements executed prior to address disclosure.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#c5a880] mb-2">
                  <KeyRound className="w-4 h-4" />
                  <span className="label-caps text-white text-[10px]">Private Escort</span>
                </div>
                <p className="text-xs text-[#dadad8] font-light">
                  Chauffeured, private air or marine transfer for discreet on-site viewings.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#c5a880] mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="label-caps text-white text-[10px]">Direct Title</span>
                </div>
                <p className="text-xs text-[#dadad8] font-light">
                  DIFC Foundation, SPV, and offshore entity acquisition structuring.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <button
                onClick={onOpenConsultation}
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-[0.14em] uppercase rounded-[3px] transition-all shadow-lg font-sans"
              >
                <span>Request Confidential Consultation</span>
              </button>
            </div>
          </div>

          {/* Right Column: Architectural Monograph Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[4px] p-8 border border-[#c5a880]/30 bg-[#1f2428]/90 backdrop-blur-md shadow-2xl">
              
              <div className="flex items-center justify-between pb-6 border-b border-[#c5a880]/20 mb-6">
                <div>
                  <span className="label-caps text-[10px] text-[#c5a880] block">Private Inventory Level</span>
                  <span className="font-editorial text-xl font-medium text-white">Confidential Dossier 2026</span>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase bg-[#5a1645] text-[#ffd8eb] rounded-[2px] border border-[#d4af37]/30">
                  Tier 1 Vault
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#dadad8]">Jumeirah Bay Island Off-Market Plots</span>
                  <span className="font-semibold text-white tabular-nums">2 Available</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#dadad8]">Palm Jumeirah Custom Frond Mansions</span>
                  <span className="font-semibold text-white tabular-nums">3 Available</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#dadad8]">Downtown Penthouse Shell & Core Penthouses</span>
                  <span className="font-semibold text-white tabular-nums">1 Available</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#dadad8]">Emirates Hills Diplomatic Enclaves</span>
                  <span className="font-semibold text-white tabular-nums">2 Available</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[#121517] rounded-[3px] border border-[#c5a880]/20 text-[11px] text-[#dadad8]/80 leading-relaxed font-light">
                All inquiries undergo identity verification through our compliance partners at DIFC. Digital dossiers are transmitted via single-use encrypted access tokens.
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
