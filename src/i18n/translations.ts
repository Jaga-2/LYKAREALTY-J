import { Language } from '../types';

export interface Translations {
  nav: {
    brand: string;
    brandTag: string;
    home: string;
    residences: string;
    privateCollection: string;
    marketPulse: string;
    intelligence: string;
    advisory: string;
    searchPortfolio: string;
    privateBriefing: string;
    compare: string;
    shortlist: string;
  };
  hero: {
    editorialTag: string;
    monographTag: string;
    titlePart1: string;
    titlePart2: string;
    subtitle: string;
    enclaveLabel: string;
    allEnclaves: string;
    typologyLabel: string;
    allTypologies: string;
    tierLabel: string;
    allTiers: string;
    tierUnder100m: string;
    tier100to200m: string;
    tierOver200m: string;
    discoverBtn: string;
    metricValuation: string;
    metricValuationSub: string;
    metricDiscretion: string;
    metricDiscretionSub: string;
    metricVelocity: string;
    metricVelocitySub: string;
    metricFreehold: string;
    metricFreeholdSub: string;
  };
  collection: {
    tag: string;
    title: string;
    viewAll: string;
    askingValuation: string;
    dossierBtn: string;
    suites: string;
    architect: string;
    estYield: string;
    handover: string;
    launchSearchBtn: string;
    available: string;
    offMarket: string;
    penthouse: string;
  };
  marketPulse: {
    tag: string;
    period: string;
    title: string;
    subtitle: string;
    requestBriefing: string;
    activeValue: string;
    capitalGrowth: string;
    capitalGrowthSub: string;
    transactedCapital: string;
    transactedCapitalSub: string;
    institutionalRatio: string;
    institutionalRatioSub: string;
    selectIndex: string;
    dldGrounding: string;
    hoverHint: string;
  };
  search: {
    returnHome: string;
    portfolioTag: string;
    title: string;
    searchPlaceholder: string;
    allEnclaves: string;
    sortValuationHigh: string;
    sortValuationLow: string;
    sortAreaLargest: string;
    sortHandover: string;
    filterBtn: string;
    clearAll: string;
    activeFiltersLabel: string;
    showingResults: string;
    ofVerified: string;
    layoutLabel: string;
    gridView: string;
    mapView: string;
    mapModeActive: string;
    noResultsTitle: string;
    noResultsDesc: string;
    resetFilters: string;
    inquireCounter: string;
    viewDossier: string;
    inquireBtn: string;
  };
  modal: {
    monographTag: string;
    saved: string;
    save: string;
    virtualTourBtn: string;
    returnPhotosBtn: string;
    virtualTourActive: string;
    unrealEngineTag: string;
    panLeft: string;
    panRight: string;
    resetPan: string;
    confidentialValuation: string;
    netYield: string;
    specsTitle: string;
    livingArea: string;
    plotArea: string;
    bedrooms: string;
    ceilingHeight: string;
    architect: string;
    handover: string;
    horizon: string;
    yearBuilt: string;
    narrativeTitle: string;
    amenitiesTitle: string;
    requestDossierTitle: string;
    requestDossierDesc: string;
    principalName: string;
    emailAddress: string;
    phoneSignal: string;
    patronRep: string;
    ndaCheckbox: string;
    submitBriefing: string;
    tokenDispatchedTitle: string;
    anotherRequestBtn: string;
  };
  comparison: {
    matrixTag: string;
    title: string;
    accentuateDiff: string;
    slotAvailable: string;
    exportPdf: string;
    exportSuccess: string;
    closeBtn: string;
    requestJointBtn: string;
    largestInterior: string;
    askingValuation: string;
    livingArea: string;
    plotArea: string;
    enclaveLocation: string;
    bedroomsBaths: string;
    valuationRate: string;
    projectedYield: string;
    primaryHorizon: string;
    masterArchitect: string;
    handoverReadiness: string;
    acquisitionStatus: string;
    signatureAmenities: string;
    privateMandate: string;
    requestBriefing: string;
  };
  shortlist: {
    tag: string;
    title: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreBtn: string;
    compareSideBySide: string;
    selectUpTo3: string;
    select3Preset: string;
    launchTable: string;
    aggregateValue: string;
    compareBtn: string;
    requestJointBtn: string;
    complianceNote: string;
  };
}

export const TRANSLATIONS: Partial<Record<Language, Translations>> = {
  en: {
    nav: {
      brand: 'LYKA REALTY',
      brandTag: 'HAUTE REAL ESTATE',
      home: 'Editorial Home',
      residences: 'Residences Portfolio',
      privateCollection: 'Private Collection',
      marketPulse: 'Market Pulse',
      intelligence: 'Intelligence',
      advisory: 'Private Advisory',
      searchPortfolio: 'Search Portfolio',
      privateBriefing: 'Private Briefing',
      compare: 'Compare',
      shortlist: 'Shortlist'
    },
    hero: {
      editorialTag: 'The Sovereign Dubai Collection',
      monographTag: 'Editorial Monograph 2026/2027',
      titlePart1: 'Architectural Grandeur.',
      titlePart2: 'Sovereign Discretion.',
      subtitle: 'Curating high-value residential acquisitions across Palm Jumeirah, Jumeirah Bay Island, and Downtown Dubai. Private broker briefings for global patrons and family offices.',
      enclaveLabel: 'Enclave',
      allEnclaves: 'All Prime Enclaves',
      typologyLabel: 'Typology',
      allTypologies: 'All Typologies',
      tierLabel: 'Acquisition Tier',
      allTiers: 'Any Capital Tier',
      tierUnder100m: 'Under AED 100M',
      tier100to200m: 'AED 100M – 200M',
      tierOver200m: 'Ultra-Trophy (AED 200M+)',
      discoverBtn: 'Discover',
      metricValuation: 'Curated Portfolio Value',
      metricValuationSub: 'Exclusively prime Dubai real estate',
      metricDiscretion: 'Off-Market Discretion',
      metricDiscretionSub: 'Zero public portal syndication',
      metricVelocity: 'Acquisition Velocity',
      metricVelocitySub: 'Average private patron match',
      metricFreehold: 'Foreign Patron Access',
      metricFreeholdSub: 'Freehold title & Golden Visa facilitation'
    },
    collection: {
      tag: 'Curated Prime Acquisitions',
      title: 'Flagship Residences & Private Estates',
      viewAll: 'View All 18 Residences',
      askingValuation: 'Asking Valuation',
      dossierBtn: 'Dossier',
      suites: 'Suites',
      architect: 'Architect',
      estYield: 'Est. Yield',
      handover: 'Handover',
      launchSearchBtn: 'Launch Complete Property Search',
      available: 'Available Acquisition',
      offMarket: 'Off-Market Confidential',
      penthouse: 'Penthouse Collection'
    },
    marketPulse: {
      tag: '12-Month Econometric Pulse',
      period: 'Rolling 12-Month Period (2025–2026)',
      title: 'Market Pulse: Dubai Ultra-Prime Valuation Trajectory',
      subtitle: 'Real-time interactive D3 regression modeling price appreciation per square foot across premier residential enclaves from November 2025 through October 2026.',
      requestBriefing: 'Request Investor Briefing',
      activeValue: 'Active Value',
      capitalGrowth: '12-Month Capital Growth',
      capitalGrowthSub: 'Outperforming prime global benchmarks',
      transactedCapital: 'Monthly Capital Transacted',
      transactedCapitalSub: 'Escrow liquidity in verified contracts',
      institutionalRatio: 'Institutional Retinue Ratio',
      institutionalRatioSub: 'Sovereign and single-family office buyers',
      selectIndex: 'Select Architectural Enclave Index',
      dldGrounding: 'Grounded in Dubai Land Department (DLD) open registry transaction records.',
      hoverHint: 'Interactive D3 line plot · Hover along trajectory for localized data points'
    },
    search: {
      returnHome: 'Return to Public Homepage',
      portfolioTag: 'The Sovereign Dubai Portfolio',
      title: 'Curated Prime Acquisitions',
      searchPlaceholder: 'Search by enclave, architect, waterfront, pool, or keywords...',
      allEnclaves: 'All Prime Enclaves',
      sortValuationHigh: 'Valuation: High to Low',
      sortValuationLow: 'Valuation: Low to High',
      sortAreaLargest: 'Area: Largest First',
      sortHandover: 'Handover Readiness',
      filterBtn: 'Filters',
      clearAll: 'Clear All',
      activeFiltersLabel: 'Active Filters:',
      showingResults: 'Showing',
      ofVerified: 'Verified Architectural Acquisitions',
      layoutLabel: 'Layout:',
      gridView: 'Grid View',
      mapView: 'Map View',
      mapModeActive: 'Map Mode Active',
      noResultsTitle: 'No Matching Architectural Acquisitions Found',
      noResultsDesc: 'We could not locate any public or off-market listings matching your precise query criteria. Our private advisory team may have confidential unlisted assets matching your parameters.',
      resetFilters: 'Reset All Filters',
      inquireCounter: 'Inquire Off-Market Counter',
      viewDossier: 'View Dossier',
      inquireBtn: 'Inquire'
    },
    modal: {
      monographTag: 'Architectural Monograph',
      saved: 'Saved',
      save: 'Save',
      virtualTourBtn: 'Virtual Tour 3D',
      returnPhotosBtn: 'Return to Photos',
      virtualTourActive: '3D Virtual Tour Walkthrough',
      unrealEngineTag: 'Unreal Engine 5 Real-Time Architectural Render',
      panLeft: '◀ Pan Left',
      panRight: 'Pan Right ▶',
      resetPan: 'Reset (0°)',
      confidentialValuation: 'Confidential Valuation',
      netYield: 'Est. Net Yield',
      specsTitle: 'Architectural Specifications',
      livingArea: 'Internal Living Area',
      plotArea: 'Private Plot Area',
      bedrooms: 'Bedrooms & Suites',
      ceilingHeight: 'Ceiling Volumes',
      architect: 'Master Architect',
      handover: 'Handover Readiness',
      horizon: 'Primary Horizon',
      yearBuilt: 'Year Commissioned',
      narrativeTitle: 'Curator’s Architectural Narrative',
      amenitiesTitle: 'Signature Estate Amenities',
      requestDossierTitle: 'Request Confidential Dossier & Private Viewing',
      requestDossierDesc: 'Full floorplans, financial pro-formas, and title deeds are reserved for verified patrons.',
      principalName: 'Principal Full Name *',
      emailAddress: 'Direct Email Address *',
      phoneSignal: 'Secure Phone / Signal *',
      patronRep: 'Patron Representation',
      ndaCheckbox: 'Execute bilateral standard DIFC NDA prior to sharing property floor plans and cadastral coordinates.',
      submitBriefing: 'Transmit Briefing Request',
      tokenDispatchedTitle: 'Dossier Access Token Dispatched',
      anotherRequestBtn: 'Submit Another Request'
    },
    comparison: {
      matrixTag: 'Architectural Comparative Matrix',
      title: 'Side-by-Side Property Comparison',
      accentuateDiff: 'Accentuate Metric Differentials',
      slotAvailable: 'Slot Available',
      exportPdf: 'Export PDF',
      exportSuccess: 'Dossier Exported!',
      closeBtn: 'Close Comparison',
      requestJointBtn: 'Request Joint Dossier',
      largestInterior: 'Largest Interior',
      askingValuation: 'Asking Valuation',
      livingArea: 'Living Area',
      plotArea: 'Plot Area',
      enclaveLocation: 'Enclave & Location',
      bedroomsBaths: 'Bedrooms & Baths',
      valuationRate: 'Valuation Rate',
      projectedYield: 'Projected Net Yield',
      primaryHorizon: 'Primary Panorama',
      masterArchitect: 'Master Architect',
      handoverReadiness: 'Handover Readiness',
      acquisitionStatus: 'Acquisition Status',
      signatureAmenities: 'Signature Amenities',
      privateMandate: 'Private Mandate',
      requestBriefing: 'Request Briefing'
    },
    shortlist: {
      tag: 'Patron Portfolio Shortlist',
      title: 'Saved Residences',
      emptyTitle: 'No Residences Bookmarked',
      emptyDesc: 'Click the bookmark icon on any property card to assemble a private comparative dossier.',
      exploreBtn: 'Explore Residences',
      compareSideBySide: 'Compare Side-by-Side',
      selectUpTo3: 'Select up to 3 for comparison',
      select3Preset: 'Select 3',
      launchTable: 'Launch Table',
      aggregateValue: 'Shortlist Aggregate Value',
      compareBtn: 'Compare Selected Side-by-Side',
      requestJointBtn: 'Request Joint Comparative Dossier',
      complianceNote: 'Compiled privately with DIFC compliance and title deed verification.'
    }
  },
  ar: {
    nav: {
      brand: 'لايكا العقارية',
      brandTag: 'العقارات الفاخرة',
      home: 'الرئيسية التحريرية',
      residences: 'محفظة المقتنيات',
      privateCollection: 'المقتنيات الحصرية',
      marketPulse: 'نبض السوق',
      intelligence: 'التقارير الاقتصادية',
      advisory: 'الاستشارات السيادية',
      searchPortfolio: 'بحث المحفظة',
      privateBriefing: 'إحاطة خاصة',
      compare: 'المقارنة',
      shortlist: 'المفضلة'
    },
    hero: {
      editorialTag: 'المجموعة السيادية الخاصة في دبي',
      monographTag: 'دراسة معمارية توثيقية ٢٠٢٦/٢٠٢٧',
      titlePart1: 'عظمة معمارية خالدة.',
      titlePart2: 'سرية سيادية مطلقة.',
      subtitle: 'تنظيم استحواذات سكنية فائقة القيمة والندرة في نخلة جميرا، جزيرة جميرا باي، ووسط مدينة دبي. إحاطات وساطة سرية للمكاتب العائلية ورواد الأعمال العالميين.',
      enclaveLabel: 'المنطقة',
      allEnclaves: 'كافة المناطق الفاخرة',
      typologyLabel: 'النمط المعماري',
      allTypologies: 'كافة الأنماط المعمارية',
      tierLabel: 'نطاق الاستحواذ',
      allTiers: 'كافة الفئات الرأسمالية',
      tierUnder100m: 'أقل من ١٠٠ مليون درهم',
      tier100to200m: '١٠٠ – ٢٠٠ مليون درهم',
      tierOver200m: 'الأصول النادرة (٢٠٠+ مليون)',
      discoverBtn: 'استكشاف',
      metricValuation: 'قيمة المحفظة المعمارية',
      metricValuationSub: 'حصرياً في أرقى وجهات دبي العقارية',
      metricDiscretion: 'سرية الصفقات الخاصة',
      metricDiscretionSub: 'دون أي نشر في البوابات العامة',
      metricVelocity: 'سرعة إنجاز الاستحواذ',
      metricVelocitySub: 'معدل قياسي لمطابقة المستثمرين',
      metricFreehold: 'حقوق التملك الحر الدولي',
      metricFreeholdSub: 'سندات ملكية حرة مع تسهيلات الإقامة الذهبية'
    },
    collection: {
      tag: 'استحواذات معمارية منتقاة بعناية',
      title: 'القصور الرائدة والواجهات الخاصة',
      viewAll: 'عرض جميع المقتنيات (١٨)',
      askingValuation: 'التقييم المطلوب',
      dossierBtn: 'الملف',
      suites: 'أجنحة',
      architect: 'المهندس',
      estYield: 'العائد المقدر',
      handover: 'التسليم',
      launchSearchBtn: 'الانتقال إلى محرك البحث العقاري الكامل',
      available: 'متاح للاستحواذ',
      offMarket: 'سري خارج السوق',
      penthouse: 'مجموعة البنتهاوس'
    },
    marketPulse: {
      tag: 'مؤشر الاقتصاد العقاري (١٢ شهراً)',
      period: 'فترة متجددة على مدار ١٢ شهراً (٢٠٢٥–٢٠٢٦)',
      title: 'نبض السوق: مسار تقييم العقارات فائقة الفخامة في دبي',
      subtitle: 'نماذج انحدار تفاعلية عبر مكتبة D3 ترصد نمو أسعار القدم المربع في أرقى المجمعات السكنية من نوفمبر ٢٠٢٥ حتى أكتوبر ٢٠٢٦.',
      requestBriefing: 'طلب إحاطة استثمارية',
      activeValue: 'السعر الحالي',
      capitalGrowth: 'النمو الرأسمالي السنوي',
      capitalGrowthSub: 'متفوقاً على المؤشرات العالمية الفاخرة',
      transactedCapital: 'حجم السيولة الشهرية',
      transactedCapitalSub: 'سيولة موثقة في حسابات الضمان المالي',
      institutionalRatio: 'نسبة المكاتب العائلية',
      institutionalRatioSub: 'مشترون سياديون ومكاتب ثروات خاصة',
      selectIndex: 'اختر مؤشر المنطقة المعمارية',
      dldGrounding: 'بيانات موثقة من سجلات دائرة الأراضي والأملاك بدبي (DLD).',
      hoverHint: 'مخطط D3 تفاعلي · مرر المؤشر لاستعراض تفاصيل النقاط الزمنية'
    },
    search: {
      returnHome: 'العودة إلى الصفحة الرئيسية',
      portfolioTag: 'محفظة دبي السيادية الخاصة',
      title: 'الاستحواذات العقارية الفاخرة',
      searchPlaceholder: 'ابحث بالمنطقة، المهندس، الواجهة البحرية، المسبح، أو الكلمات المفتاحية...',
      allEnclaves: 'كافة المناطق الفاخرة',
      sortValuationHigh: 'التقييم: من الأعلى للأدنى',
      sortValuationLow: 'التقييم: من الأدنى للأعلى',
      sortAreaLargest: 'المساحة: الأكبر أولاً',
      sortHandover: 'جاهزية التسليم',
      filterBtn: 'الفلاتر',
      clearAll: 'مسح الفلاتر',
      activeFiltersLabel: 'الفلاتر النشطة:',
      showingResults: 'عرض',
      ofVerified: 'من المقتنيات المعمارية المعتمدة',
      layoutLabel: 'طريقة العرض:',
      gridView: 'شبكة العقارات',
      mapView: 'الخريطة التفاعلية',
      mapModeActive: 'وضع الخريطة نشط',
      noResultsTitle: 'لم يتم العثور على مقتنيات مطابقة',
      noResultsDesc: 'لم نتمكن من العثور على عقارات مطابقة لمعايير البحث الحالية. يمتلك فريق الاستشارات لدينا أصولاً سرية إضافية قد تطابق تطلعاتكم.',
      resetFilters: 'إعادة ضبط الفلاتر',
      inquireCounter: 'استشارة المكتب السري',
      viewDossier: 'استعراض الملف',
      inquireBtn: 'استفسار'
    },
    modal: {
      monographTag: 'الدراسة المعمارية التوثيقية',
      saved: 'تم الحفظ',
      save: 'حفظ',
      virtualTourBtn: 'جولة افتراضية ثلاثية الأبعاد',
      returnPhotosBtn: 'العودة للصور الفوتوغرافية',
      virtualTourActive: 'جولة معمارية افتراضية تفاعلية',
      unrealEngineTag: 'رندرة معمارية فورية بتقنية Unreal Engine 5',
      panLeft: '◀ تحريك يساراً',
      panRight: 'تحريك يميناً ▶',
      resetPan: 'إعادة ضبط (٠°)',
      confidentialValuation: 'التقييم السري المعتمد',
      netYield: 'صافي العائد السنوي المتوقع',
      specsTitle: 'المواصفات والمعايير الهندسية',
      livingArea: 'المساحة الداخلية الصافية',
      plotArea: 'مساحة الأرض الخاصة',
      bedrooms: 'الأجنحة وغرف النوم',
      ceilingHeight: 'ارتفاع الأسقف والأحجام',
      architect: 'المهندس المصمم',
      handover: 'موعد التسليم',
      horizon: 'الأفق والإطلالة',
      yearBuilt: 'سنة البناء / التدشين',
      narrativeTitle: 'السرد المعماري للمشروع',
      amenitiesTitle: 'المرافق والتجهيزات السيادية',
      requestDossierTitle: 'طلب الملف التوثيقي السري والمعاينة الخاصة',
      requestDossierDesc: 'المخططات الهندسية الكاملة وسندات الملكية مخصصة للمستثمرين المعتمدين.',
      principalName: 'اسم المستثمر / الموكل *',
      emailAddress: 'البريد الإلكتروني المباشر *',
      phoneSignal: 'رقم الهاتف / تطبيق سيجنال *',
      patronRep: 'صفة التمثيل المالي',
      ndaCheckbox: 'توقيع اتفاقية سرية معلومات قياسية (DIFC NDA) قبل مشاركة الإحداثيات والمخططات التفصيلية.',
      submitBriefing: 'إرسال طلب الإحاطة',
      tokenDispatchedTitle: 'تم إصدار رمز الوصول المشفر',
      anotherRequestBtn: 'تقديم طلب آخر'
    },
    comparison: {
      matrixTag: 'مصفوفة المقارنة الهندسية',
      title: 'مقارنة المقتنيات جنباً إلى جنب',
      accentuateDiff: 'إبراز الفروقات القياسية',
      slotAvailable: 'خانة متاحة',
      exportPdf: 'تصدير كملف PDF',
      exportSuccess: 'تم تصدير الملف بنجاح!',
      closeBtn: 'إغلاق المقارنة',
      requestJointBtn: 'طلب ملف استثماري موحد',
      largestInterior: 'المساحة الأكبر',
      askingValuation: 'التقييم المطلوب',
      livingArea: 'المساحة الداخلية',
      plotArea: 'مساحة الأرض',
      enclaveLocation: 'المنطقة والموقع',
      bedroomsBaths: 'الأجنحة والحمامات',
      valuationRate: 'معدل سعر القدم',
      projectedYield: 'العائد السنوي المتوقع',
      primaryHorizon: 'الإطلالة البانورامية',
      masterArchitect: 'المهندس الرئيسي',
      handoverReadiness: 'جاهزية التسليم',
      acquisitionStatus: 'حالة الاستحواذ',
      signatureAmenities: 'المرافق الحصرية',
      privateMandate: 'تفويض الاستحواذ',
      requestBriefing: 'طلب إحاطة'
    },
    shortlist: {
      tag: 'قائمة المقتنيات المفضلة',
      title: 'العقارات المحفوظة',
      emptyTitle: 'لا توجد عقارات محفوظة',
      emptyDesc: 'انقر على أيقونة الحفظ على أي بطاقة لتجميع ملف مقارنة استثماري خاص.',
      exploreBtn: 'استعراض العقارات',
      compareSideBySide: 'المقارنة جنباً إلى جنب',
      selectUpTo3: 'حدد حتى ٣ عقارات للمقارنة',
      select3Preset: 'تحديد ٣',
      launchTable: 'فتح جدول المقارنة',
      aggregateValue: 'إجمالي قيمة المحفظة المفضلة',
      compareBtn: 'مقارنة العقارات المحددة جنباً إلى جنب',
      requestJointBtn: 'طلب دراسة مقارنة موحدة',
      complianceNote: 'إعداد استثماري معتمد وفق معايير مركز دبي المالي العالمي (DIFC).'
    }
  },
  ta: {
    nav: {
      brand: 'LYKA REALTY',
      brandTag: 'பிரீமியம் துபாய் சொகுசு இல்லங்கள்',
      home: 'முகப்பு',
      residences: 'சொகுசு இல்லங்கள்',
      privateCollection: 'தனிப்பட்ட தொகுப்பு',
      marketPulse: 'சந்தை நிலவரம்',
      intelligence: 'ஆய்வு & அறிக்கை',
      advisory: 'ஆலோசனை மையம்',
      searchPortfolio: 'இல்லங்களை தேடுங்கள்',
      privateBriefing: 'ரகசிய ஆலோசனை',
      compare: 'ஒப்பீடு',
      shortlist: 'விருப்ப பட்டியல்'
    },
    hero: {
      editorialTag: 'ஹாட் ரியல் எஸ்டேட் தலையங்கம்',
      monographTag: 'தொகுதி 14 · துபாய் பிரைம் சொத்துக்கள்',
      titlePart1: 'சார்பற்ற கட்டிடக்கலை',
      titlePart2: 'அரிய பொக்கிஷங்கள்',
      subtitle: 'பாம் ஜுமேரா, ஜுமேரா பே மற்றும் எமிரேட்ஸ் ஹில்ஸ் போன்ற உயர்தர இடங்களில் உள்ள தலைசிறந்த அரண்மனை வீடுகள் மற்றும் பென்ட்ஹவுஸ்கள்.',
      enclaveLabel: 'முக்கிய பகுதி',
      allEnclaves: 'அனைத்து பகுதிகள்',
      typologyLabel: 'கட்டிட வகை',
      allTypologies: 'அனைத்து வகைகள்',
      tierLabel: 'முதலீட்டு அளவு',
      allTiers: 'அனைத்து முதலீட்டு அளவுகள்',
      tierUnder100m: 'AED 100M வரை',
      tier100to200m: 'AED 100M – 200M',
      tierOver200m: 'AED 200M மேல்',
      discoverBtn: 'ஆரம்பிக்கவும்',
      metricValuation: 'AED 1.25B+',
      metricValuationSub: 'மதிப்பிடப்பட்ட போர்ட்ஃபோலியோ',
      metricDiscretion: '100% ரகசியம்',
      metricDiscretionSub: 'சந்தைக்கு அப்பாற்பட்ட விற்பனை',
      metricVelocity: '8.4% வரை',
      metricVelocitySub: 'முன்னணி வாடகை வருவாய்',
      metricFreehold: 'முழு உரிமை',
      metricFreeholdSub: '10 ஆண்டு கோல்டன் விசா'
    },
    collection: {
      tag: 'பிரத்தியேக போர்ட்ஃபோலியோ',
      title: 'கட்டிடக்கலை கலைப்படைப்புகள்',
      viewAll: 'அனைத்து இல்லங்களையும் காண்க',
      askingValuation: 'கேட்கப்படும் மதிப்பு',
      dossierBtn: 'முழு விவரம்',
      suites: 'படுக்கையறைகள்',
      architect: 'கட்டிடக்கலைஞர்',
      estYield: 'மதிப்பிடப்பட்ட வருவாய்',
      handover: 'ஒப்படைப்பு',
      launchSearchBtn: 'விரிவான தேடல்',
      available: 'கிடைக்கிறது',
      offMarket: 'தனிப்பட்ட ரகசியம்',
      penthouse: 'ஸ்கை பென்ட்ஹவுஸ்'
    },
    marketPulse: {
      tag: 'துபாய் நிலத்துறை ஆய்வு',
      period: '2026 Q3–Q4 பகுப்பாய்வு',
      title: 'துபாய் பிரைம் சொத்து சந்தை நிலவரம்',
      subtitle: 'துபாய் நிலத்துறை (DLD) உத்தியோகபூர்வ பரிவர்த்தனை குறியீட்டின் அடிப்படையில் கணக்கிடப்பட்ட நேரலை தரவுகள்.',
      requestBriefing: 'அறிக்கையை கோருங்கள்',
      activeValue: 'செயலில் உள்ள போர்ட்ஃபோலியோ மதிப்பு',
      capitalGrowth: '+18.4%',
      capitalGrowthSub: 'ஆண்டு மூலதன வளர்ச்சி',
      transactedCapital: 'AED 4.8B',
      transactedCapitalSub: 'மொத்த பரிவர்த்தனை மதிப்பு',
      institutionalRatio: '74%',
      institutionalRatioSub: 'குடும்ப அலுவலக முதலீடுகள்',
      selectIndex: 'குறியீட்டை தேர்ந்தெடுக்கவும்',
      dldGrounding: 'DLD உறுதிப்படுத்தப்பட்டது',
      hoverHint: 'மதிப்புகளைக் காண வரைபடத்தின் மீது கர்சரை நகர்த்தவும்'
    },
    search: {
      returnHome: 'முகப்புக்கு திரும்பவும்',
      portfolioTag: 'லைகா நேரடி சொத்துக்கள்',
      title: 'சொகுசு இல்லங்களின் போர்ட்ஃபோலியோ',
      searchPlaceholder: 'பெயர், கட்டிடக்கலைஞர் அல்லது பிரைம் பகுதி மூலம் தேடுங்கள்...',
      allEnclaves: 'அனைத்து பகுதிகள்',
      sortValuationHigh: 'விலை: உயர்விலிருந்து குறைவு',
      sortValuationLow: 'விலை: குறைவிலிருந்து உயர்வு',
      sortAreaLargest: 'பரப்பளவு: பெரியது முதல் சிறியது',
      sortHandover: 'ஒப்படைப்பு காலம்',
      filterBtn: 'வடிகட்டிகள்',
      clearAll: 'அனைத்தையும் நீக்கு',
      activeFiltersLabel: 'செயலில் உள்ள வடிகட்டிகள்:',
      showingResults: 'காட்டப்படும் முடிவுகள்',
      ofVerified: 'உறுதிப்படுத்தப்பட்ட இல்லங்கள்',
      layoutLabel: 'காட்சி முறை:',
      gridView: 'கட்டம்',
      mapView: 'வரைபடம்',
      mapModeActive: 'வரைபட முறை செயலில் உள்ளது',
      noResultsTitle: 'பொருந்தும் இல்லங்கள் எதுவும் கிடைக்கவில்லை',
      noResultsDesc: 'தேர்வு செய்த வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.',
      resetFilters: 'வடிகட்டிகளை மீட்டமைக்கவும்',
      inquireCounter: 'விசாரணை மையம்',
      viewDossier: 'விவரம்',
      inquireBtn: 'விசாரிக்க'
    },
    modal: {
      monographTag: 'கட்டிடக்கலை ஆய்வு அறிக்கை',
      saved: 'சேமிக்கப்பட்டது',
      save: 'சேமிக்கவும்',
      virtualTourBtn: '3D நேரடி மெய்நிகர் உலா',
      returnPhotosBtn: 'புகைப்படங்களுக்கு திரும்புக',
      virtualTourActive: '3D மெய்நிகர் உலா செயலில் உள்ளது',
      unrealEngineTag: 'அன்ரியல் என்ஜின் 5 நிகழ்நேர கட்டிடக்கலை காட்சி',
      panLeft: '◀ இடதுபுறம் நகர்த்து',
      panRight: 'வலதுபுறம் நகர்த்து ▶',
      resetPan: 'மீட்டமை (0°)',
      confidentialValuation: 'ரகசிய மதிப்பு',
      netYield: 'மதிப்பிடப்பட்ட நிகர வருவாய்',
      specsTitle: 'கட்டிடக்கலை விவரக்குறிப்புகள்',
      livingArea: 'உட்புற பரப்பளவு',
      plotArea: 'நிலப்பரப்பு',
      bedrooms: 'படுக்கையறைகள் & அலகுகள்',
      ceilingHeight: 'உச்சவரம்பு உயரம்',
      architect: 'முதன்மை கட்டிடக்கலைஞர்',
      handover: 'ஒப்படைப்பு தயார்நிலை',
      horizon: 'முக்கிய காட்சி',
      yearBuilt: 'உருவாக்கப்பட்ட ஆண்டு',
      narrativeTitle: 'கட்டிடக்கலை தலையங்கம்',
      amenitiesTitle: 'பிரத்தியேக வசதிகள்',
      requestDossierTitle: 'ரகசிய ஆவணம் & நேரடி பார்வைக்கான கோரிக்கை',
      requestDossierDesc: 'முழு வரைபடங்கள் மற்றும் ஆவணங்கள் சரிபார்க்கப்பட்ட வாடிக்கையாளர்களுக்கு மட்டுமே வழங்கப்படும்.',
      principalName: 'முதலீட்டாளர் பெயர் *',
      emailAddress: 'மின்னஞ்சல் முகவரி *',
      phoneSignal: 'பாதுகாப்பான தொலைபேசி எண் *',
      patronRep: 'நிதி பிரதிநிதித்துவம்',
      ndaCheckbox: 'வரைபடங்களைப் பெறுவதற்கு முன் DIFC NDA ரகசிய ஒப்பந்தத்தில் கையெழுத்திட ஒப்புக்கொள்கிறேன்.',
      submitBriefing: 'கோரிக்கையை அனுப்பவும்',
      tokenDispatchedTitle: 'ரகசிய அணுகல் குறியீடு அனுப்பப்பட்டது',
      anotherRequestBtn: 'மற்றொரு கோரிக்கையை சமர்ப்பிக்கவும்'
    },
    comparison: {
      matrixTag: 'முதலீட்டு பகுப்பாய்வு',
      title: 'சொத்துக்களின் நேரடி ஒப்பீடு',
      accentuateDiff: 'முக்கிய வேறுபாடுகளை முன்னிலைப்படுத்தவும்',
      slotAvailable: 'காலியிடம் உள்ளது',
      exportPdf: 'PDF ஆக ஏற்றுமதி செய்க',
      exportSuccess: 'வெற்றிகரமாக ஏற்றுமதி செய்யப்பட்டது!',
      closeBtn: 'ஒப்பீட்டை மூடவும்',
      requestJointBtn: 'ஒருங்கிணைந்த அறிக்கையை கோருங்கள்',
      largestInterior: 'மிகப்பெரிய உட்புறம்',
      askingValuation: 'கேட்கப்படும் மதிப்பு',
      livingArea: 'வாழும் பரப்பளவு',
      plotArea: 'நிலப்பரப்பு',
      enclaveLocation: 'பகுதி & இருப்பிடம்',
      bedroomsBaths: 'அறைகள் & குளியலறைகள்',
      valuationRate: 'சதுர அடி விலை விகிதம்',
      projectedYield: 'எதிர்பார்க்கப்படும் வருவாய்',
      primaryHorizon: 'முக்கிய காட்சி',
      masterArchitect: 'முதன்மை கட்டிடக்கலைஞர்',
      handoverReadiness: 'ஒப்படைப்பு தயார்நிலை',
      acquisitionStatus: 'கையகப்படுத்தல் நிலை',
      signatureAmenities: 'முக்கிய வசதிகள்',
      privateMandate: 'தனிப்பட்ட ஆணை',
      requestBriefing: 'ஆலோசனையை கோருங்கள்'
    },
    shortlist: {
      tag: 'விருப்ப பட்டியல்',
      title: 'சேமிக்கப்பட்ட இல்லங்கள்',
      emptyTitle: 'சேமிக்கப்பட்ட இல்லங்கள் எதுவும் இல்லை',
      emptyDesc: 'எந்தவொரு அட்டையிலும் உள்ள புக்மார்க் ஐகானைக் கிளிக் செய்து உங்கள் விருப்பப் பட்டியலில் சேர்க்கவும்.',
      exploreBtn: 'இல்லங்களை ஆராயுங்கள்',
      compareSideBySide: 'நேரடி ஒப்பீடு',
      selectUpTo3: 'ஒப்பிட 3 இல்லங்கள் வரை தேர்ந்தெடுக்கவும்',
      select3Preset: '3 இல்லங்களைத் தேர்ந்தெடு',
      launchTable: 'ஒப்பீட்டு அட்டவணையை திறக்கவும்',
      aggregateValue: 'மொத்த விருப்பப்பட்டியல் மதிப்பு',
      compareBtn: 'தேர்ந்தெடுக்கப்பட்டவற்றை ஒப்பிடுங்கள்',
      requestJointBtn: 'கூட்டு அறிக்கையை கோருங்கள்',
      complianceNote: 'DIFC விதிகளுக்கு இணங்க பாதுகாக்கப்பட்ட தனிப்பட்ட தரவுகள்.'
    }
  }
};
