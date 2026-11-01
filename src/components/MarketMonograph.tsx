import React from 'react';
import { TrendingUp, FileText, ArrowUpRight } from 'lucide-react';

export const MarketMonograph: React.FC = () => {
  const tableData = [
    {
      enclave: 'Palm Jumeirah Waterfront',
      avgPricePerSqFt: 'AED 8,900 – 14,500',
      yoyAppreciation: '+21.4%',
      avgDaysToClose: '24 Days',
      grossYield: '7.4%',
      dominantBuyer: 'European Family Offices'
    },
    {
      enclave: 'Jumeirah Bay Island',
      avgPricePerSqFt: 'AED 12,500 – 18,200',
      yoyAppreciation: '+29.8%',
      avgDaysToClose: '18 Days',
      grossYield: '6.8%',
      dominantBuyer: 'Bespoke Private Clients'
    },
    {
      enclave: 'Downtown Dubai Triplex Penthouses',
      avgPricePerSqFt: 'AED 7,800 – 11,200',
      yoyAppreciation: '+18.2%',
      avgDaysToClose: '31 Days',
      grossYield: '8.6%',
      dominantBuyer: 'Global Tech & Capital Founders'
    },
    {
      enclave: 'Emirates Hills Fairway Plots',
      avgPricePerSqFt: 'AED 6,400 – 9,800',
      yoyAppreciation: '+15.7%',
      avgDaysToClose: '42 Days',
      grossYield: '6.2%',
      dominantBuyer: 'Generational Patrons'
    }
  ];

  return (
    <section id="market-intelligence" className="py-20 bg-[#faf9f7] border-t border-[#c5a880]/20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#735c00] mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#735c00]" />
            <span>Market Intelligence</span>
            <span aria-hidden="true" className="text-[#c5a880]">/</span>
            <span>Q3 2026 Sovereign Index</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1f2428] tracking-tight [text-wrap:balance]">
            Ultra-Prime Capital Dynamics & Enclave Metrics
          </h2>
          
          <p className="text-sm sm:text-base text-[#44474a] font-light leading-relaxed mt-4">
            Independent econometric research compiled from verified Dubai Land Department (DLD) transactions exceeding AED 50M.
          </p>
        </div>

        {/* Tabular Quantitative Data Table */}
        <div className="bg-white rounded-[4px] border border-[#c5a880]/25 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1f2428] text-white">
                <tr>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    Prime Enclave
                  </th>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    Price / Sq.Ft (AED)
                  </th>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    12-Mo. Capital Shift
                  </th>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    Avg. Velocity
                  </th>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    Gross Yield
                  </th>
                  <th className="py-4 px-6 label-caps text-[#c5a880] tracking-wider font-semibold">
                    Primary Capital Inflow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c5a880]/15 text-[#1a1c1b]">
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-[#faf9f7] transition-colors">
                    <td className="py-4 px-6 font-medium text-[#1f2428] whitespace-nowrap">
                      {row.enclave}
                    </td>
                    <td className="py-4 px-6 font-mono tabular-nums text-[#44474a] whitespace-nowrap">
                      {row.avgPricePerSqFt}
                    </td>
                    <td className="py-4 px-6 font-mono tabular-nums text-[#735c00] font-semibold whitespace-nowrap">
                      {row.yoyAppreciation}
                    </td>
                    <td className="py-4 px-6 font-mono tabular-nums text-[#44474a] whitespace-nowrap">
                      {row.avgDaysToClose}
                    </td>
                    <td className="py-4 px-6 font-mono tabular-nums text-[#1f2428] font-semibold whitespace-nowrap">
                      {row.grossYield}
                    </td>
                    <td className="py-4 px-6 text-[#75777a] whitespace-nowrap">
                      {row.dominantBuyer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#f4f3f1] border-t border-[#c5a880]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#75777a]">
            <span>Data validated by LYKA Private Wealth Analytics in partnership with DIFC Regulatory Research.</span>
            <div className="flex items-center gap-1.5 text-[#1f2428] font-semibold hover:text-[#735c00] cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Download Full 48-Page Annual Research Dossier (PDF)</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
