import React from 'react';
import { Quote } from 'lucide-react';

export const ClientAttributions: React.FC = () => {
  const letters = [
    {
      patron: 'Lord Alistair Sterling',
      role: 'Principal Trustee',
      entity: 'Sterling Generational Trust (Geneva & London)',
      quote: 'When deploying €45M into a private island compound on Jumeirah Bay, discretion was non-negotiable. LYKA conducted our bilateral escrow and legal closing within 14 calendar days without a single public leak.',
      mandate: 'Acquisition of Coral Waterfront Compound'
    },
    {
      patron: 'Elena Rostova',
      role: 'Chief Investment Officer',
      entity: 'Aura Capital Family Office (Zurich)',
      quote: 'LYKA’s off-market intelligence unlocked an unlisted triplex penthouse in Downtown Dubai before international marketing commenced. Their architectural due diligence saved our committee over four months of technical audits.',
      mandate: 'Private Sky Penthouse Allocation'
    },
    {
      patron: 'H.E. Tariq Al-Mansoor',
      role: 'Managing Director',
      entity: 'Gulf Continental Holdings (Riyadh)',
      quote: 'Their deep alignment with DIFC SPV structuring and escrow compliance makes LYKA the gold standard for institutional real estate procurement across the UAE.',
      mandate: 'Multi-Asset Prime Portfolio Assembly'
    }
  ];

  return (
    <section className="py-20 bg-[#f4f3f1] border-t border-[#c5a880]/20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        <div className="max-w-2xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#735c00] mb-3">
            <Quote className="w-3.5 h-3.5 text-[#735c00]" />
            <span>Patron Correspondence</span>
            <span aria-hidden="true" className="text-[#c5a880]">/</span>
            <span>Attributable Transactions</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#1f2428] tracking-tight [text-wrap:balance]">
            Trusted by Sovereign Funds & Private Family Offices
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {letters.map((letter, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-[4px] border border-[#c5a880]/25 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="label-caps text-[#c5a880] text-[9px] block mb-4">
                  {letter.mandate}
                </span>

                <blockquote className="font-editorial italic text-base sm:text-lg text-[#1f2428] leading-relaxed mb-6">
                  "{letter.quote}"
                </blockquote>
              </div>

              <div className="pt-4 border-t border-[#c5a880]/20">
                <div className="font-semibold text-sm text-[#1f2428]">{letter.patron}</div>
                <div className="text-xs text-[#75777a]">{letter.role}</div>
                <div className="text-xs text-[#c5a880] font-medium mt-0.5">{letter.entity}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
