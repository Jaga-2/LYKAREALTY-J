import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Currency } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, BarChart3, ArrowUpRight, ShieldCheck, Info, Calendar } from 'lucide-react';

interface MonthlyDataPoint {
  month: string; // e.g. "Nov 25"
  fullDate: string;
  composite: number; // AED per sq.ft
  palmJumeirah: number;
  jumeirahBay: number;
  downtown: number;
  emiratesHills: number;
  volumeBillionAED: number;
}

const HISTORICAL_12_MONTH_DATA: MonthlyDataPoint[] = [
  { month: 'Nov 25', fullDate: 'November 2025', composite: 8120, palmJumeirah: 9200, jumeirahBay: 13800, downtown: 7600, emiratesHills: 6700, volumeBillionAED: 2.4 },
  { month: 'Dec 25', fullDate: 'December 2025', composite: 8250, palmJumeirah: 9380, jumeirahBay: 14100, downtown: 7750, emiratesHills: 6800, volumeBillionAED: 2.8 },
  { month: 'Jan 26', fullDate: 'January 2026', composite: 8400, palmJumeirah: 9600, jumeirahBay: 14450, downtown: 7900, emiratesHills: 6920, volumeBillionAED: 3.1 },
  { month: 'Feb 26', fullDate: 'February 2026', composite: 8590, palmJumeirah: 9850, jumeirahBay: 14900, downtown: 8050, emiratesHills: 7050, volumeBillionAED: 2.9 },
  { month: 'Mar 26', fullDate: 'March 2026', composite: 8780, palmJumeirah: 10120, jumeirahBay: 15300, downtown: 8220, emiratesHills: 7180, volumeBillionAED: 3.4 },
  { month: 'Apr 26', fullDate: 'April 2026', composite: 8940, palmJumeirah: 10350, jumeirahBay: 15750, downtown: 8380, emiratesHills: 7300, volumeBillionAED: 3.2 },
  { month: 'May 26', fullDate: 'May 2026', composite: 9110, palmJumeirah: 10600, jumeirahBay: 16200, downtown: 8540, emiratesHills: 7420, volumeBillionAED: 3.6 },
  { month: 'Jun 26', fullDate: 'June 2026', composite: 9280, palmJumeirah: 10840, jumeirahBay: 16650, downtown: 8710, emiratesHills: 7550, volumeBillionAED: 3.3 },
  { month: 'Jul 26', fullDate: 'July 2026', composite: 9420, palmJumeirah: 11050, jumeirahBay: 17100, downtown: 8850, emiratesHills: 7680, volumeBillionAED: 2.9 },
  { month: 'Aug 26', fullDate: 'August 2026', composite: 9580, palmJumeirah: 11280, jumeirahBay: 17500, downtown: 9020, emiratesHills: 7800, volumeBillionAED: 3.0 },
  { month: 'Sep 26', fullDate: 'September 2026', composite: 9730, palmJumeirah: 11500, jumeirahBay: 17900, downtown: 9180, emiratesHills: 7940, volumeBillionAED: 3.5 },
  { month: 'Oct 26', fullDate: 'October 2026', composite: 9940, palmJumeirah: 11820, jumeirahBay: 18450, downtown: 9350, emiratesHills: 8120, volumeBillionAED: 3.8 }
];

type EnclaveKey = 'composite' | 'palmJumeirah' | 'jumeirahBay' | 'downtown' | 'emiratesHills';

interface EnclaveOption {
  key: EnclaveKey;
  label: string;
  sub: string;
}

const ENCLAVE_OPTIONS: EnclaveOption[] = [
  { key: 'composite', label: 'Composite Prime Index', sub: 'Weighted Average' },
  { key: 'palmJumeirah', label: 'Palm Jumeirah', sub: 'Waterfront Villas' },
  { key: 'jumeirahBay', label: 'Jumeirah Bay Island', sub: 'Private Island Trophy' },
  { key: 'downtown', label: 'Downtown Dubai', sub: 'Sky Penthouses' },
  { key: 'emiratesHills', label: 'Emirates Hills', sub: 'Fairway Mansions' }
];

interface MarketPulseProps {
  currency: Currency;
  onOpenConsultation: () => void;
}

export const MarketPulse: React.FC<MarketPulseProps> = ({ onOpenConsultation }) => {
  const { t, language } = useLanguage();
  const { currency, rates, currentConfig } = useCurrency();
  const [selectedEnclave, setSelectedEnclave] = useState<EnclaveKey>('composite');
  const [hoveredData, setHoveredData] = useState<MonthlyDataPoint | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fxRate = rates[currency] || 1;
  const currencySymbol = currency === 'AED' ? 'AED' : currentConfig.symbol;

  // Convert price from AED to active currency
  const formatValue = (valAED: number) => {
    const converted = Math.round(valAED * fxRate);
    if (currency === 'AED') {
      return `AED ${converted.toLocaleString()}`;
    }
    if (currency === 'CHF') {
      return `CHF ${converted.toLocaleString()}`;
    }
    return `${currencySymbol}${converted.toLocaleString()}`;
  };

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 360;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');

    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'marketPulseGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#c5a880')
      .attr('stop-opacity', 0.35);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#c5a880')
      .attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(HISTORICAL_12_MONTH_DATA.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.1);

    const values = HISTORICAL_12_MONTH_DATA.map((d) => (d[selectedEnclave] as number) * fxRate);
    const minY = d3.min(values) || 0;
    const maxY = d3.max(values) || 10000;
    const yDomainBuffer = (maxY - minY) * 0.15;

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, minY - yDomainBuffer), maxY + yDomainBuffer])
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(212, 175, 55, 0.12)')
      .attr('stroke-dasharray', '3,3');

    g.select('.grid .domain').remove();

    // Area Generator
    const area = d3
      .area<MonthlyDataPoint>()
      .x((d) => xScale(d.month) || 0)
      .y0(innerHeight)
      .y1((d) => yScale((d[selectedEnclave] as number) * fxRate))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const line = d3
      .line<MonthlyDataPoint>()
      .x((d) => xScale(d.month) || 0)
      .y((d) => yScale((d[selectedEnclave] as number) * fxRate))
      .curve(d3.curveMonotoneX);

    // Append Area Path
    g.append('path')
      .datum(HISTORICAL_12_MONTH_DATA)
      .attr('fill', 'url(#marketPulseGradient)')
      .attr('d', area);

    // Append Line Path with smooth stroke
    g.append('path')
      .datum(HISTORICAL_12_MONTH_DATA)
      .attr('fill', 'none')
      .attr('stroke', '#c5a880')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(12);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((d) => `${currencySymbol}${Math.round(Number(d)).toLocaleString()}`);

    // X Axis group
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain').attr('stroke', 'rgba(212, 175, 55, 0.25)');
    xAxisG
      .selectAll('text')
      .attr('fill', '#868b90')
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '500');

    // Y Axis group
    const yAxisG = g.append('g').call(yAxis);
    yAxisG.select('.domain').remove();
    yAxisG
      .selectAll('text')
      .attr('fill', '#868b90')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('class', 'tabular-nums');

    // Data Point Dots
    g.selectAll('.dot')
      .data(HISTORICAL_12_MONTH_DATA)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => xScale(d.month) || 0)
      .attr('cy', (d) => yScale((d[selectedEnclave] as number) * fxRate))
      .attr('r', 3.5)
      .attr('fill', '#1f2428')
      .attr('stroke', '#c5a880')
      .attr('stroke-width', 1.75);

    // Interactive Hover Overlay
    const bisect = d3.bisector<MonthlyDataPoint, string>((d) => d.month).center;

    const focusLine = g
      .append('line')
      .attr('stroke', 'rgba(212, 175, 55, 0.45)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    const focusCircle = g
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#5a1645')
      .attr('stroke', '#fed65b')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', function (event) {
        const [pointerX] = d3.pointer(event);
        const eachBand = innerWidth / (HISTORICAL_12_MONTH_DATA.length - 1);
        const index = Math.round(pointerX / eachBand);
        const boundedIndex = Math.max(0, Math.min(HISTORICAL_12_MONTH_DATA.length - 1, index));
        const d = HISTORICAL_12_MONTH_DATA[boundedIndex];

        if (d) {
          const cx = xScale(d.month) || 0;
          const cy = yScale((d[selectedEnclave] as number) * fxRate);

          focusLine
            .attr('x1', cx)
            .attr('x2', cx)
            .style('opacity', 1);

          focusCircle
            .attr('cx', cx)
            .attr('cy', cy)
            .style('opacity', 1);

          setHoveredData(d);
        }
      })
      .on('mouseleave', function () {
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
        setHoveredData(null);
      });

  }, [selectedEnclave, fxRate, currency]);

  // Metrics summary
  const startPoint = HISTORICAL_12_MONTH_DATA[0];
  const latestPoint = HISTORICAL_12_MONTH_DATA[HISTORICAL_12_MONTH_DATA.length - 1];
  const startVal = startPoint[selectedEnclave] as number;
  const latestVal = latestPoint[selectedEnclave] as number;
  const growthPercent = (((latestVal - startVal) / startVal) * 100).toFixed(1);

  // Active display point
  const currentDisplay = hoveredData || latestPoint;
  const displayVal = currentDisplay[selectedEnclave] as number;

  return (
    <section id="market-pulse" className="py-20 bg-[#121517] text-white border-t border-[#c5a880]/20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#c5a880] mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{language === 'ar' ? 'سجلات دائرة الأراضي المعتمدة' : 'DLD Verified Intelligence'}</span>
              <span aria-hidden="true" className="text-[#c5a880]/50">/</span>
              <span>{t.marketPulse.tag}</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-tight [text-wrap:balance]">
              {t.marketPulse.title}
            </h2>

            <p className="text-sm sm:text-base text-[#dadad8] font-light leading-relaxed mt-4">
              {t.marketPulse.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-[#1f2428] rounded-[3px] border border-[#c5a880]/30 text-xs text-[#dadad8] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{t.marketPulse.period}</span>
            </div>

            <button
              onClick={onOpenConsultation}
              className="px-4 py-2 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-wider uppercase rounded-[3px] transition-colors whitespace-nowrap shadow-md cursor-pointer"
            >
              {t.marketPulse.requestBriefing}
            </button>
          </div>
        </div>

        {/* 4 Metric Key Indicator Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-[#1f2428]/90 p-5 rounded-[4px] border border-[#c5a880]/30 shadow-md">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-1">
              {t.marketPulse.activeValue} ({currentDisplay.month})
            </span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-white tabular-nums">
              {formatValue(displayVal)}
              <span className="text-xs font-normal text-[#868b90] ml-1">/ {language === 'ar' ? 'قدم²' : 'sq.ft'}</span>
            </div>
            <p className="text-[11px] text-[#dadad8]/70 mt-1">
              {hoveredData ? (language === 'ar' ? `فُحص بتاريخ ${hoveredData.fullDate}` : `Inspected on ${hoveredData.fullDate}`) : (language === 'ar' ? 'مؤشر أحدث المعاملات المعتمدة' : 'Latest verified transaction index')}
            </p>
          </div>

          <div className="bg-[#1f2428]/90 p-5 rounded-[4px] border border-[#c5a880]/30 shadow-md">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-1">
              {t.marketPulse.capitalGrowth}
            </span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#fed65b] tabular-nums flex items-center gap-1">
              <span>+{growthPercent}%</span>
              <ArrowUpRight className="w-5 h-5 text-[#fed65b]" />
            </div>
            <p className="text-[11px] text-[#dadad8]/70 mt-1">
              {t.marketPulse.capitalGrowthSub}
            </p>
          </div>

          <div className="bg-[#1f2428]/90 p-5 rounded-[4px] border border-[#c5a880]/30 shadow-md">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-1">
              {t.marketPulse.transactedCapital}
            </span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-white tabular-nums">
              {currency === 'AED'
                ? (language === 'ar' ? `${currentDisplay.volumeBillionAED.toFixed(1)} مليار درهم` : `AED ${currentDisplay.volumeBillionAED.toFixed(1)}B`)
                : `${currencySymbol}${(currentDisplay.volumeBillionAED * fxRate).toFixed(1)}B`}
            </div>
            <p className="text-[11px] text-[#dadad8]/70 mt-1">
              {t.marketPulse.transactedCapitalSub}
            </p>
          </div>

          <div className="bg-[#1f2428]/90 p-5 rounded-[4px] border border-[#c5a880]/30 shadow-md">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-1">
              {t.marketPulse.institutionalRatio}
            </span>
            <div className="font-editorial text-2xl lg:text-3xl font-semibold text-[#ffd8eb] tabular-nums">
              {language === 'ar' ? '٧٤٫٢٪' : '74.2%'}
            </div>
            <p className="text-[11px] text-[#dadad8]/70 mt-1">
              {t.marketPulse.institutionalRatioSub}
            </p>
          </div>

        </div>

        {/* Interactive D3 Chart Card */}
        <div className="bg-[#181d21] rounded-[4px] border border-[#c5a880]/35 p-6 sm:p-8 shadow-2xl">
          
          {/* Chart Header & Enclave Filter Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#c5a880]/20 mb-6">
            <div>
              <span className="label-caps text-[#c5a880] text-[10px] block">
                {t.marketPulse.selectIndex}
              </span>
              <h3 className="font-editorial text-xl font-medium text-white mt-0.5">
                {language === 'ar'
                  ? (selectedEnclave === 'composite' ? 'مؤشر السوق الموحد الفاخر' : selectedEnclave === 'palmJumeirah' ? 'نخلة جميرا' : selectedEnclave === 'jumeirahBay' ? 'جزيرة جميرا باي' : selectedEnclave === 'downtown' ? 'وسط مدينة دبي' : 'تلال الإمارات')
                  : ENCLAVE_OPTIONS.find((e) => e.key === selectedEnclave)?.label} — {formatValue(latestVal)} / {language === 'ar' ? 'قدم²' : 'sq.ft'}
              </h3>
            </div>

            {/* Enclave Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#121517] p-1 rounded-[3px] border border-[#c5a880]/30">
              {ENCLAVE_OPTIONS.map((enclave) => {
                const label = language === 'ar'
                  ? (enclave.key === 'composite' ? 'المؤشر الموحد' : enclave.key === 'palmJumeirah' ? 'نخلة جميرا' : enclave.key === 'jumeirahBay' ? 'جميرا باي' : enclave.key === 'downtown' ? 'وسط دبي' : 'تلال الإمارات')
                  : enclave.label;

                return (
                  <button
                    key={enclave.key}
                    onClick={() => setSelectedEnclave(enclave.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] transition-all cursor-pointer whitespace-nowrap ${
                      selectedEnclave === enclave.key
                        ? 'bg-[#c5a880] text-[#121517] shadow-sm'
                        : 'text-[#dadad8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* D3 SVG Chart Container */}
          <div ref={containerRef} className="w-full relative">
            <svg ref={svgRef} className="w-full overflow-visible" />

            {/* Hover Tooltip Overlay Box */}
            {hoveredData && (
              <div className="absolute top-2 right-4 rtl:right-auto rtl:left-4 bg-[#1f2428]/95 backdrop-blur-md border border-[#c5a880]/60 p-3 rounded-[3px] text-white shadow-xl pointer-events-none text-xs space-y-1">
                <div className="text-[10px] label-caps text-[#c5a880]">
                  {hoveredData.fullDate}
                </div>
                <div className="font-editorial text-base font-semibold text-white tabular-nums">
                  {formatValue(hoveredData[selectedEnclave] as number)} / {language === 'ar' ? 'قدم²' : 'sq.ft'}
                </div>
                <div className="text-[11px] text-[#dadad8] flex items-center justify-between gap-4">
                  <span>{language === 'ar' ? 'حجم السيولة الشهرية:' : 'Monthly Volume:'}</span>
                  <span className="font-mono tabular-nums text-[#ffe088]">
                    {currency === 'AED'
                      ? (language === 'ar' ? `${hoveredData.volumeBillionAED} مليار درهم` : `AED ${hoveredData.volumeBillionAED}B`)
                      : `${currencySymbol}${(hoveredData.volumeBillionAED * fxRate).toFixed(1)}B`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chart Sub-Footer */}
          <div className="mt-6 pt-4 border-t border-[#c5a880]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#75777a]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#c5a880]" />
              <span>{t.marketPulse.dldGrounding}</span>
            </div>
            <div className="text-[11px] font-light text-[#dadad8]/80">
              {t.marketPulse.hoverHint}
            </div>
          </div>

        </div>

        {/* Investor Outlook & Econometric Commentary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#181d21] rounded-[4px] border border-[#c5a880]/20">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-2">
              Supply Scarcity Dynamic
            </span>
            <h4 className="font-editorial text-lg font-medium text-white mb-2">
              Finite Waterfront Frontage
            </h4>
            <p className="text-xs text-[#dadad8] font-light leading-relaxed">
              Palm Jumeirah and Jumeirah Bay Island have reached 96% site saturation. Structural supply limits are accelerating premium valuations for custom turnkey estates.
            </p>
          </div>

          <div className="p-6 bg-[#181d21] rounded-[4px] border border-[#c5a880]/20">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-2">
              Fiscal Neutrality
            </span>
            <h4 className="font-editorial text-lg font-medium text-white mb-2">
              Global Sovereign Relocation
            </h4>
            <p className="text-xs text-[#dadad8] font-light leading-relaxed">
              0% personal capital gains, zero inheritance levies, and 10-year Golden Visa mandates continue to channel family office treasury allocations directly into Dubai residential deeds.
            </p>
          </div>

          <div className="p-6 bg-[#181d21] rounded-[4px] border border-[#c5a880]/20">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-2">
              Forecast 2027
            </span>
            <h4 className="font-editorial text-lg font-medium text-white mb-2">
              Projected +14–18% Trajectory
            </h4>
            <p className="text-xs text-[#dadad8] font-light leading-relaxed">
              Econometric regression models anticipate continued double-digit appreciation for trophy waterfront villas and triplex penthouses through Q4 2027.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
