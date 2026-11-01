import React, { useState } from 'react';
import { Screen } from '../types';
import { Check } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
  onOpenConsultation: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConsultation }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#121517] text-white border-t border-[#c5a880]/20 pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        
        {/* Top Grid: Brand & Global Desks */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#c5a880]/20">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#1f2428] border border-[#c5a880]/50 flex items-center justify-center text-[#c5a880]">
                <span className="font-editorial text-sm font-semibold tracking-wider">L</span>
              </div>
              <span className="font-editorial text-xl font-medium tracking-[0.18em] text-white">
                LYKA REALTY
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#dadad8] font-light leading-relaxed max-w-sm">
              Sovereign real estate advisory and private architectural acquisitions for family offices, institutional investors, and global patrons across Dubai and prime global enclaves.
            </p>

            {/* Newsletter Dispatch Form */}
            <div className="pt-2">
              <span className="label-caps text-[#c5a880] text-[10px] block mb-2">
                Quarterly Architectural Monograph Dispatch
              </span>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-[#ffe088] font-medium">
                  <Check className="w-4 h-4" />
                  <span>Subscribed to Confidential Quarterly Research</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="patron@familyoffice.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#1f2428] rounded-[2px] border border-[#c5a880]/30 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#e9dac1] text-[#121517] text-xs font-semibold tracking-wider uppercase rounded-[2px] transition-colors whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-4">
              Portfolio Portals
            </span>
            <ul className="space-y-2 text-xs text-[#dadad8]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors text-left"
                >
                  Public Homepage — LYKA Realty
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="hover:text-white transition-colors text-left"
                >
                  Property Search & Geographical Chart
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    const el = document.getElementById('sovereign-atelier');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Sovereign Off-Market Counter
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    const el = document.getElementById('market-intelligence');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Dubai Prime Econometric Monograph
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenConsultation}
                  className="hover:text-white transition-colors text-left"
                >
                  Private Client Advisory Mandate
                </button>
              </li>
            </ul>
          </div>

          {/* Global Private Desks */}
          <div className="md:col-span-4 space-y-4">
            <span className="label-caps text-[#c5a880] text-[10px] block mb-2">
              Private Advisory Desks
            </span>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-white block">Dubai (Headquarters)</span>
                <span className="text-[#dadad8] text-[11px] block">Level 18, Gate Precinct 4, DIFC</span>
                <span className="text-[#c5a880] text-[11px] block mt-1">+971 4 828 9000</span>
              </div>
              <div>
                <span className="font-semibold text-white block">London</span>
                <span className="text-[#dadad8] text-[11px] block">24 Berkeley Square, Mayfair</span>
                <span className="text-[#c5a880] text-[11px] block mt-1">+44 20 7946 0192</span>
              </div>
              <div>
                <span className="font-semibold text-white block">Zurich</span>
                <span className="text-[#dadad8] text-[11px] block">Bahnhofstrasse 12, 8001</span>
                <span className="text-[#c5a880] text-[11px] block mt-1">+41 44 215 8820</span>
              </div>
              <div>
                <span className="font-semibold text-white block">Singapore</span>
                <span className="text-[#dadad8] text-[11px] block">Marina Bay Financial Centre Tower 2</span>
                <span className="text-[#c5a880] text-[11px] block mt-1">+65 6812 7400</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal Notice & Language Selection */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#75777a] gap-4">
          <div>
            © 2026 LYKA Realty Limited. Regulated under Dubai Real Estate Regulatory Agency (RERA ORN: 28419). All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <LanguageSwitcher variant="footer" />
            <span className="hover:text-white cursor-pointer">Privacy & Discretion</span>
            <span className="hover:text-white cursor-pointer">DIFC SPV Protocols</span>
            <span className="hover:text-white cursor-pointer">Anti-Money Laundering Compliance</span>
            <button
              onClick={() => {
                onNavigate('staff-login');
              }}
              className="text-[#c5a880]/70 hover:text-[#c5a880] text-xs font-mono tracking-wider cursor-pointer"
            >
              [ Staff & Advisory Terminal ]
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
