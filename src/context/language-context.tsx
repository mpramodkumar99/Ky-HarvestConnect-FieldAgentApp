import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ft_agent_language';
export type Language = 'en' | 'te' | 'hi';

const EN = {
  // Tabs
  tab_dashboard:   'Dashboard',
  tab_deliveries:  'Deliveries',
  tab_stores:      'Stores',
  tab_reports:     'Reports',
  tab_profile:     'Profile',

  // Auth
  auth_welcome:      'Welcome, Agent!',
  auth_sub:          'FoxTail Field Operations',
  auth_login:        'Log In',
  auth_phone_ph:     'Mobile number',
  auth_send_otp:     'Send OTP',
  auth_otp_title:    'Enter OTP',
  auth_otp_sub:      'Sent to',
  auth_verify:       'Verify & Continue',
  auth_resend:       'Resend OTP',
  auth_resend_in:    'Resend in',

  // Dashboard
  dash_greeting:          'Good morning',
  dash_active_delivery:   'Active Delivery',
  dash_no_active:         'No active delivery',
  dash_pending_pickups:   'Pending Pickups',
  dash_completed_today:   'Completed Today',
  dash_earnings_today:    "Today's Earnings",
  dash_new_request:       'New Delivery Request',
  dash_accept:            'Accept',
  dash_decline:           'Decline',
  dash_navigate:          'Navigate',
  dash_mark_delivered:    'Mark Delivered',
  dash_view_all:          'View All',

  // Deliveries
  del_title:           'My Deliveries',
  del_pending:         'Pending',
  del_active:          'Active',
  del_completed:       'Completed',
  del_empty:           'No deliveries here',
  del_order:           'Order',
  del_from:            'Pick up from',
  del_to:              'Deliver to',
  del_cod:             'Cash on Delivery',
  del_online:          'Online Paid',
  del_accept_btn:      'Accept Delivery',
  del_pickup_btn:      'Picked Up',
  del_deliver_btn:     'Mark Delivered',
  del_route_btn:       'Open Route',

  // Route
  route_title:         'Delivery Route',
  route_your_location: 'Your Location',
  route_pickup:        'Pickup — Store',
  route_dropoff:       'Drop-off — Buyer',
  route_navigate:      'Open in Maps',
  route_store_map:     'Store → You',
  route_buyer_map:     'Store → Buyer',

  // Stores
  stores_title:        'Store Administration',
  stores_onboarding:   'Onboarding Review',
  stores_active:       'Active Stores',
  stores_pending:      'Pending',
  stores_approved:     'Approved',
  stores_rejected:     'Rejected',
  stores_approve:      'Approve',
  stores_reject:       'Reject',
  stores_notes_ph:     'Add review notes…',
  stores_empty:        'No stores to review',

  // Reports
  rep_title:           'Reports',
  rep_this_week:       'This Week',
  rep_this_month:      'This Month',
  rep_deliveries:      'Deliveries',
  rep_completed:       'Completed',
  rep_cancelled:       'Cancelled',
  rep_earnings:        'Earnings',
  rep_avg_time:        'Avg Delivery Time',
  rep_rating:          'Rating',
  rep_performance:     'Performance',
  rep_daily:           'Daily Breakdown',

  // Profile
  prof_title:          'My Profile',
  prof_status:         'Status',
  prof_available:      'Available',
  prof_on_delivery:    'On Delivery',
  prof_offline:        'Offline',
  prof_zone:           'Assigned Zone',
  prof_total_del:      'Total Deliveries',
  prof_rating:         'My Rating',
  prof_settings:       'Settings',
  prof_theme:          'App Theme',
  prof_language:       'Language',
  prof_logout:         'Sign Out',

  // Common
  cancel:              'Cancel',
  save:                'Save',
  confirm:             'Confirm',
  loading:             'Loading…',
  error_generic:       'Something went wrong. Please try again.',
  retry:               'Retry',
  dev_login:           'Dev Login',
};

const TE: typeof EN = {
  tab_dashboard:   'డాష్‌బోర్డ్',
  tab_deliveries:  'డెలివరీలు',
  tab_stores:      'స్టోర్లు',
  tab_reports:     'నివేదికలు',
  tab_profile:     'ప్రొఫైల్',
  auth_welcome:    'స్వాగతం, ఏజెంట్!',
  auth_sub:        'FoxTail ఫీల్డ్ ఆపరేషన్స్',
  auth_login:      'లాగిన్ అవ్వండి',
  auth_phone_ph:   'మొబైల్ నంబర్',
  auth_send_otp:   'OTP పంపండి',
  auth_otp_title:  'OTP నమోదు చేయండి',
  auth_otp_sub:    'పంపబడింది',
  auth_verify:     'ధృవీకరించండి',
  auth_resend:     'OTP మళ్ళీ పంపండి',
  auth_resend_in:  'మళ్ళీ పంపు',
  dash_greeting:        'శుభోదయం',
  dash_active_delivery: 'చురుకైన డెలివరీ',
  dash_no_active:       'చురుకైన డెలివరీ లేదు',
  dash_pending_pickups: 'పెండింగ్ పికప్‌లు',
  dash_completed_today: 'నేడు పూర్తయినవి',
  dash_earnings_today:  'నేటి సంపాదన',
  dash_new_request:     'కొత్త డెలివరీ అభ్యర్థన',
  dash_accept:          'అంగీకరించు',
  dash_decline:         'తిరస్కరించు',
  dash_navigate:        'నావిగేట్ చేయి',
  dash_mark_delivered:  'డెలివరీ అయింది',
  dash_view_all:        'అన్నీ చూడు',
  del_title:       'నా డెలివరీలు',
  del_pending:     'పెండింగ్',
  del_active:      'చురుకైన',
  del_completed:   'పూర్తయినవి',
  del_empty:       'డెలివరీలు లేవు',
  del_order:       'ఆర్డర్',
  del_from:        'పికప్ చేయు',
  del_to:          'డెలివరీ చేయు',
  del_cod:         'క్యాష్ ఆన్ డెలివరీ',
  del_online:      'ఆన్‌లైన్ చెల్లింపు',
  del_accept_btn:  'డెలివరీ అంగీకరించు',
  del_pickup_btn:  'పికప్ చేసాను',
  del_deliver_btn: 'డెలివరీ అయింది',
  del_route_btn:   'రూట్ తెరవండి',
  route_title:         'డెలివరీ రూట్',
  route_your_location: 'మీ స్థానం',
  route_pickup:        'పికప్ — స్టోర్',
  route_dropoff:       'డెలివరీ — కొనుగోలుదారు',
  route_navigate:      'మ్యాప్‌లో తెరవండి',
  route_store_map:     'స్టోర్ → మీరు',
  route_buyer_map:     'స్టోర్ → కొనుగోలుదారు',
  stores_title:      'స్టోర్ నిర్వహణ',
  stores_onboarding: 'ఆన్‌బోర్డింగ్ సమీక్ష',
  stores_active:     'చురుకైన స్టోర్లు',
  stores_pending:    'పెండింగ్',
  stores_approved:   'ఆమోదించబడింది',
  stores_rejected:   'తిరస్కరించబడింది',
  stores_approve:    'ఆమోదించు',
  stores_reject:     'తిరస్కరించు',
  stores_notes_ph:   'గమనికలు రాయండి…',
  stores_empty:      'సమీక్షించాల్సిన స్టోర్లు లేవు',
  rep_title:       'నివేదికలు',
  rep_this_week:   'ఈ వారం',
  rep_this_month:  'ఈ నెల',
  rep_deliveries:  'డెలివరీలు',
  rep_completed:   'పూర్తయినవి',
  rep_cancelled:   'రద్దు చేయబడినవి',
  rep_earnings:    'సంపాదన',
  rep_avg_time:    'సగటు డెలివరీ సమయం',
  rep_rating:      'రేటింగ్',
  rep_performance: 'పనితీరు',
  rep_daily:       'రోజువారీ వివరాలు',
  prof_title:      'నా ప్రొఫైల్',
  prof_status:     'స్థితి',
  prof_available:  'అందుబాటులో ఉన్నారు',
  prof_on_delivery:'డెలివరీలో ఉన్నారు',
  prof_offline:    'ఆఫ్‌లైన్',
  prof_zone:       'కేటాయించిన జోన్',
  prof_total_del:  'మొత్తం డెలివరీలు',
  prof_rating:     'నా రేటింగ్',
  prof_settings:   'సెట్టింగ్లు',
  prof_theme:      'యాప్ థీమ్',
  prof_language:   'భాష',
  prof_logout:     'సైన్ అవుట్',
  cancel:          'రద్దు',
  save:            'సేవ్ చేయి',
  confirm:         'నిర్ధారించు',
  loading:         'లోడవుతోంది…',
  error_generic:   'ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.',
  retry:           'మళ్ళీ ప్రయత్నించు',
  dev_login:       'డెవ్ లాగిన్',
};

const HI: typeof EN = {
  tab_dashboard:   'डैशबोर्ड',
  tab_deliveries:  'डिलीवरी',
  tab_stores:      'स्टोर',
  tab_reports:     'रिपोर्ट',
  tab_profile:     'प्रोफ़ाइल',
  auth_welcome:    'स्वागत है, एजेंट!',
  auth_sub:        'FoxTail फील्ड ऑपरेशंस',
  auth_login:      'लॉग इन करें',
  auth_phone_ph:   'मोबाइल नंबर',
  auth_send_otp:   'OTP भेजें',
  auth_otp_title:  'OTP दर्ज करें',
  auth_otp_sub:    'भेजा गया',
  auth_verify:     'सत्यापित करें',
  auth_resend:     'OTP पुनः भेजें',
  auth_resend_in:  'पुनः भेजें',
  dash_greeting:        'शुभ प्रभात',
  dash_active_delivery: 'सक्रिय डिलीवरी',
  dash_no_active:       'कोई सक्रिय डिलीवरी नहीं',
  dash_pending_pickups: 'लंबित पिकअप',
  dash_completed_today: 'आज पूर्ण',
  dash_earnings_today:  'आज की कमाई',
  dash_new_request:     'नई डिलीवरी अनुरोध',
  dash_accept:          'स्वीकार करें',
  dash_decline:         'अस्वीकार करें',
  dash_navigate:        'नेविगेट करें',
  dash_mark_delivered:  'डिलीवर किया',
  dash_view_all:        'सभी देखें',
  del_title:       'मेरी डिलीवरी',
  del_pending:     'लंबित',
  del_active:      'सक्रिय',
  del_completed:   'पूर्ण',
  del_empty:       'यहाँ कोई डिलीवरी नहीं',
  del_order:       'ऑर्डर',
  del_from:        'पिकअप',
  del_to:          'डिलीवरी',
  del_cod:         'कैश ऑन डिलीवरी',
  del_online:      'ऑनलाइन भुगतान',
  del_accept_btn:  'डिलीवरी स्वीकार करें',
  del_pickup_btn:  'पिकअप किया',
  del_deliver_btn: 'डिलीवर किया',
  del_route_btn:   'रूट खोलें',
  route_title:         'डिलीवरी रूट',
  route_your_location: 'आपका स्थान',
  route_pickup:        'पिकअप — स्टोर',
  route_dropoff:       'डिलीवरी — खरीदार',
  route_navigate:      'मैप में खोलें',
  route_store_map:     'स्टोर → आप',
  route_buyer_map:     'स्टोर → खरीदार',
  stores_title:      'स्टोर प्रशासन',
  stores_onboarding: 'ऑनबोर्डिंग समीक्षा',
  stores_active:     'सक्रिय स्टोर',
  stores_pending:    'लंबित',
  stores_approved:   'स्वीकृत',
  stores_rejected:   'अस्वीकृत',
  stores_approve:    'स्वीकार करें',
  stores_reject:     'अस्वीकार करें',
  stores_notes_ph:   'समीक्षा नोट्स…',
  stores_empty:      'समीक्षा के लिए कोई स्टोर नहीं',
  rep_title:       'रिपोर्ट',
  rep_this_week:   'इस सप्ताह',
  rep_this_month:  'इस महीने',
  rep_deliveries:  'डिलीवरी',
  rep_completed:   'पूर्ण',
  rep_cancelled:   'रद्द',
  rep_earnings:    'कमाई',
  rep_avg_time:    'औसत डिलीवरी समय',
  rep_rating:      'रेटिंग',
  rep_performance: 'प्रदर्शन',
  rep_daily:       'दैनिक विवरण',
  prof_title:      'मेरी प्रोफ़ाइल',
  prof_status:     'स्थिति',
  prof_available:  'उपलब्ध',
  prof_on_delivery:'डिलीवरी पर',
  prof_offline:    'ऑफलाइन',
  prof_zone:       'असाइन किया ज़ोन',
  prof_total_del:  'कुल डिलीवरी',
  prof_rating:     'मेरी रेटिंग',
  prof_settings:   'सेटिंग्स',
  prof_theme:      'ऐप थीम',
  prof_language:   'भाषा',
  prof_logout:     'साइन आउट',
  cancel:          'रद्द करें',
  save:            'सहेजें',
  confirm:         'पुष्टि करें',
  loading:         'लोड हो रहा है…',
  error_generic:   'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
  retry:           'पुनः प्रयास करें',
  dev_login:       'डेव लॉगिन',
};

const TRANSLATIONS: Record<Language, typeof EN> = { en: EN, te: TE, hi: HI };

interface LanguageContextValue {
  language:    Language;
  setLanguage: (l: Language) => void;
  t:           (key: keyof typeof EN) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'en' || v === 'te' || v === 'hi') setLang(v);
    }).catch(() => {});
  }, []);

  function setLanguage(l: Language) {
    setLang(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }

  function t(key: keyof typeof EN): string {
    return TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
