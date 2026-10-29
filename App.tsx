
import React, { useState, useEffect, useMemo } from 'react';
import { Screen, Property, SearchFilters, AdminMessage, Provider, PropertyVisit } from './types';
import { supabase } from './supabase';
import { formatPhoneForSupabase } from './sms';
import OnboardingPermissions from './components/OnboardingPermissions';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import OTPScreen from './components/OTPScreen';
import RegistrationSuccess from './components/RegistrationSuccess';
import HomeScreen from './components/HomeScreen';
import ResultsScreen from './components/ResultsScreen';
import FilterModal from './components/FilterModal';
import WalletDashboard from './components/WalletDashboard';
import AddMoney from './components/AddMoney';
import AddMoneySuccess from './components/AddMoneySuccess';
import WithdrawFunds from './components/WithdrawFunds';
import PropertyDetails from './components/PropertyDetails';
import RentalStep1 from './components/RentalStep1';
import RentalStep2 from './components/RentalStep2';
import RentalStep3 from './components/RentalStep3';
import RentalSuccess from './components/RentalSuccess';
import MyAdvertisements from './components/MyAdvertisements';
import BoostAd from './components/BoostAd';
import BoostPayment from './components/BoostPayment';
import PostAdScreen from './components/PostAdScreen';
import AdSubmittedSuccess from './components/AdSubmittedSuccess';
import LandlordApplication from './components/LandlordApplication';
import PickDropApplication from './components/PickDropApplication';
import LocatorApplication from './components/LocatorApplication';
import MaidApplication from './components/MaidApplication';
import SecurityGuardApplication from './components/SecurityGuardApplication';
import MaintenanceApplication from './components/MaintenanceApplication';
import ApplicationSubmitted from './components/ApplicationSubmitted';
import ApplicationStatusScreen from './components/ApplicationStatusScreen';
import LiveTracking from './components/LiveTracking';
import MyVisits from './components/MyVisits';
import NotificationSettings from './components/NotificationSettings';
import ServiceHistory from './components/ServiceHistory';
import SendMoneySearch from './components/SendMoneySearch';
import SendMoneyAmount from './components/SendMoneyAmount';
import PinVerification from './components/PinVerification';
import TransactionSuccess from './components/TransactionSuccess';
import AdminNotifications from './components/AdminNotifications';
import ServicesHub from './components/ServicesHub';
import ProfileScreen from './components/ProfileScreen';
import MaintenanceHub from './components/MaintenanceHub';
import MaintenanceBooking from './components/MaintenanceBooking';
import MaintenanceSuccess from './components/MaintenanceSuccess';
import MaidBooking from './components/MaidBooking';
import SecurityBooking from './components/SecurityBooking';
import PickDropBooking from './components/PickDropBooking';
import PickDropSuccess from './components/PickDropSuccess';
import ServiceRating from './components/ServiceRating';
import RatingSuccess from './components/RatingSuccess';
import EmergencyHelp from './components/EmergencyHelp';
import EditProfileScreen from './components/EditProfileScreen';
import HelpSupportScreen from './components/HelpSupportScreen';
import BookVisitScreen from './components/BookVisitScreen';
import VisitScheduledSuccess from './components/VisitScheduledSuccess';
import PropertyArrivalView from './components/PropertyArrivalView';
import VisitFeedbackScreen from './components/VisitFeedbackScreen';
import PropertyComparisonView from './components/PropertyComparisonView';
import SavedPropertiesView from './components/SavedPropertiesView';
import RouteNavigationView from './components/RouteNavigationView';
import InterestedPropertiesView from './components/InterestedPropertiesView';
import ServiceChatScreen from './components/ServiceChatScreen';
import SmsAdminScreen from './components/SmsAdminScreen';
import ManualRechargeForm from './components/ManualRechargeForm';
import RechargeStatus from './components/RechargeStatus';
import RechargeHistory from './components/RechargeHistory';
import SecurityScreen from './components/SecurityScreen';
import { getInAppNotifications, subscribeToAlertTriggered } from './searchAlertStorage';
import { haptics } from './haptics';
import { 
  checkAndTriggerDueNotifications, 
  ScheduledMaintenanceVisit, 
  REMINDER_DUE_EVENT 
} from './maintenanceScheduler';
import AvailabilityConfirmModal from './components/AvailabilityConfirmModal';
import OfflineIndicator from './components/OfflineIndicator';
import { initPWACapabilities } from './pwaCapabilities';
import PropertyNoteTakingModal from './components/PropertyNoteTakingModal';

// Dashboard Imports
import LocatorDashboard from './components/dashboards/LocatorDashboard';
import LandlordDashboard from './components/dashboards/LandlordDashboard';
import MaidDashboard from './components/dashboards/MaidDashboard';
import SecurityGuardDashboard from './components/dashboards/SecurityGuardDashboard';
import MaintenanceDashboard from './components/dashboards/MaintenanceDashboard';
import PickDropDashboard from './components/dashboards/PickDropDashboard';

// Admin Panel Suite Imports
import AdminWebDashboard from './admin-panel';
import { AdminLoginGate } from './components/AdminLoginGate';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLiveTracking from './components/admin/AdminLiveTracking';
import AdminRevenue from './components/admin/AdminRevenue';
import AdminPayouts from './components/admin/AdminPayouts';
import AdminWallet from './components/admin/AdminWallet';
import AdminApprovals from './components/admin/AdminApprovals';
import AdminModeration from './components/admin/AdminModeration';
import AdminActivityLog from './components/admin/AdminActivityLog';
import AdminSupport from './components/admin/AdminSupport';
import AdminAdPlacement from './components/admin/AdminAdPlacement';
import AdminManualRecharge from './components/admin/AdminManualRecharge';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { sanitizeAppStorageForProduction } from './cleanStorage';
import { submitProviderApplication, ProviderRoleKey } from './providerApplicationsStorage';

export type AppStatus = 'NONE' | 'PENDING' | 'APPROVED';

// The designated admin phone number (E.164 format)
const ADMIN_PHONE = '+8801977347402';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lang, setLang] = useState<'EN' | 'BN'>(() => {
    try {
      const saved = localStorage.getItem('duyar_lang');
      if (saved === 'BN' || saved === 'EN') return saved;
    } catch (e) {}
    return 'EN';
  });

  const handleLangChange = (newLang: 'EN' | 'BN') => {
    setLang(newLang);
    try {
      localStorage.setItem('duyar_lang', newLang);
    } catch (e) {}
  };

  const handleLangToggle = () => {
    handleLangChange(lang === 'EN' ? 'BN' : 'EN');
  };
  const [verificationPhone, setVerificationPhone] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  
  // New state to hold signup data until OTP is verified
  const [pendingUserData, setPendingUserData] = useState<{ name: string; avatarUrl: string | null } | null>(null);

  const [lastAdTitle, setLastAdTitle] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [sendAmount, setSendAmount] = useState('0');
  const [addedAmount, setAddedAmount] = useState<number>(0);
  const [selectedBoostPlan, setSelectedBoostPlan] = useState<any>(null);
  const [selectedMaintenanceService, setSelectedMaintenanceService] = useState<string>('Electrical');
  const [activeTrackingService, setActiveTrackingService] = useState<any>(null);
  const [activeChatService, setActiveChatService] = useState<any>(null);
  const [ratingServiceData, setRatingServiceData] = useState<any>(null);
  const [ratingSuccessData, setRatingSuccessData] = useState<any>(null);
  const [lastAppliedType, setLastAppliedType] = useState<string>('Provider');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeVisitForReview, setActiveVisitForReview] = useState<PropertyVisit | null>(null);
  const [rechargeStatusProps, setRechargeStatusProps] = useState<any>(null);
  
  // Admin Messages State - fetched from DB in real app
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);

  const [inAppAlertToast, setInAppAlertToast] = useState<{
    title: string;
    content: string;
    property?: any;
    isPriceDrop?: boolean;
    isMaintenanceReminder?: boolean;
    visit?: ScheduledMaintenanceVisit;
  } | null>(null);

  const [activeVisitForConfirmation, setActiveVisitForConfirmation] = useState<ScheduledMaintenanceVisit | null>(null);
  const [isNoteTakingOpen, setIsNoteTakingOpen] = useState(false);

  const [appStatuses, setAppStatuses] = useState<{
    landlord: AppStatus;
    locator: AppStatus;
    maintenance: AppStatus;
    pickDrop: AppStatus;
    securityGuard: AppStatus;
    maid: AppStatus;
  }>(() => {
    try {
      const saved = localStorage.getItem('duyar_app_statuses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      landlord: 'NONE',
      locator: 'NONE',
      maintenance: 'NONE',
      pickDrop: 'NONE',
      securityGuard: 'NONE',
      maid: 'NONE'
    };
  });

  const handleApplicationSubmit = (roleKey: ProviderRoleKey, roleTitle: string, extraData?: any) => {
    const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
    const userName = userProfile?.full_name || 'Resident';

    submitProviderApplication({
      roleKey,
      name: userName,
      applicantPhone: userPhone,
      userId: userProfile?.id,
      ...extraData
    });

    const statusMap: Record<string, keyof typeof appStatuses> = {
      Landlords: 'landlord',
      Security: 'securityGuard',
      Maids: 'maid',
      Maintenance: 'maintenance',
      PickDrop: 'pickDrop',
      Locators: 'locator'
    };

    const key = statusMap[roleKey];
    if (key) {
      setAppStatuses(prev => {
        const next = { ...prev, [key]: 'PENDING' as AppStatus };
        try {
          localStorage.setItem('duyar_app_statuses', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    setLastAppliedType(roleTitle);
    navigate(Screen.APP_SUBMITTED);
  };

  const [filters, setFilters] = useState<SearchFilters>({
    propertyType: 'Flat',
    maxBudget: 200,
    beds: 'Any',
    tenantType: 'Family',
    radius: 50
  });
  
  const navigate = (screen: Screen, pushHistory: boolean = true) => {
    const isTactileNavigation = [
      Screen.LOCATOR_DASHBOARD,
      Screen.LANDLORD_DASHBOARD,
      Screen.MAID_DASHBOARD,
      Screen.SECURITY_GUARD_DASHBOARD,
      Screen.MAINTENANCE_DASHBOARD,
      Screen.PICK_DROP_DASHBOARD,
      Screen.ADMIN_LOGIN_GATE,
      Screen.ADMIN_DASHBOARD,
      Screen.ADMIN_LIVE_TRACKING,
      Screen.ADMIN_REVENUE,
      Screen.ADMIN_PAYOUTS,
      Screen.ADMIN_WALLET,
      Screen.ADMIN_APPROVALS,
      Screen.ADMIN_RECHARGE_APPROVAL,
      Screen.ADMIN_MODERATION,
      Screen.ADMIN_ACTIVITY_LOG,
      Screen.ADMIN_SUPPORT,
      Screen.ADMIN_AD_PLACEMENT,
      Screen.SERVICES_HUB,
      Screen.WALLET,
      Screen.HISTORY,
      Screen.SECURITY,
      Screen.HOME
    ].includes(screen);

    if (isTactileNavigation) {
      haptics.dashboardNavigated();
    }
    if (pushHistory && typeof window !== 'undefined') {
      try {
        if (screen === Screen.ADMIN_DASHBOARD || screen === Screen.ADMIN_LOGIN_GATE) {
          if (!window.location.pathname.toLowerCase().startsWith('/admin')) {
            window.history.pushState({ screen }, '', '/admin');
          } else {
            window.history.pushState({ screen }, '');
          }
        } else {
          if (window.location.pathname.toLowerCase().startsWith('/admin')) {
            window.history.pushState({ screen }, '', '/');
          } else {
            window.history.pushState({ screen }, '');
          }
        }
      } catch (e) {}
    }
    setCurrentScreen(screen);
  };

  const fetchProfile = async (phone: string) => {
    if (phone === ADMIN_PHONE) {
      setUserProfile({ 
        id: 'admin-master', 
        full_name: 'Duyar Administrator', 
        phone, 
        role: 'ADMIN', 
        balance: 0,
        avatar_url: ''
      });
      setAppStatuses({
        landlord: 'APPROVED',
        locator: 'APPROVED',
        maintenance: 'APPROVED',
        pickDrop: 'APPROVED',
        securityGuard: 'APPROVED',
        maid: 'APPROVED'
      });
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
        setAppStatuses({
          landlord: data.is_landlord ? 'APPROVED' : data.landlord_status === 'PENDING' ? 'PENDING' : 'NONE',
          locator: data.is_locator ? 'APPROVED' : data.locator_status === 'PENDING' ? 'PENDING' : 'NONE',
          maintenance: data.is_maintenance ? 'APPROVED' : data.maintenance_status === 'PENDING' ? 'PENDING' : 'NONE',
          pickDrop: data.is_pickdrop ? 'APPROVED' : data.pickdrop_status === 'PENDING' ? 'PENDING' : 'NONE',
          securityGuard: data.is_security ? 'APPROVED' : data.security_status === 'PENDING' ? 'PENDING' : 'NONE',
          maid: data.is_maid ? 'APPROVED' : data.maid_status === 'PENDING' ? 'PENDING' : 'NONE'
        });
      } else {
        const defaultProfile = {
          id: 'user-' + phone.replace(/[^0-9]/g, ''),
          phone,
          full_name: 'Resident ' + phone.slice(-4),
          role: 'TENANT',
          balance: 0,
          avatar_url: ''
        };
        setUserProfile(defaultProfile);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
      setUserProfile({
        id: 'user-' + phone.replace(/[^0-9]/g, ''),
        phone,
        full_name: 'Resident',
        role: 'TENANT',
        balance: 0
      });
    }
  };

  useEffect(() => {
    // Purge any legacy demo mock data keys from browser localStorage
    sanitizeAppStorageForProduction();

    // Strictly check if direct /admin URL is entered in the browser address bar
    const checkIsDirectAdmin = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        return path === '/admin' || path.startsWith('/admin/');
      } catch (e) {
        return false;
      }
    };

    const isDirectAdmin = checkIsDirectAdmin();

    const storedPhone = localStorage.getItem('duyar_user_phone');
    if (storedPhone) {
      fetchProfile(storedPhone);
      if (isDirectAdmin) {
        if (storedPhone === ADMIN_PHONE) {
          navigate(Screen.ADMIN_DASHBOARD);
        } else {
          // If non-admin user hits /admin, show dedicated Admin Login Gate
          navigate(Screen.ADMIN_LOGIN_GATE);
        }
      } else {
        navigate(Screen.HOME);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session && session.user.email) {
          // Reconstruct phone from dummy email
          const phoneFromEmail = session.user.email.split('@')[0];
          const phone = '+' + phoneFromEmail;
          fetchProfile(phone);
          if (isDirectAdmin) {
            if (phone === ADMIN_PHONE) {
              navigate(Screen.ADMIN_DASHBOARD);
            } else {
              navigate(Screen.ADMIN_LOGIN_GATE);
            }
          } else {
            navigate(Screen.HOME);
          }
        } else {
          localStorage.setItem('duyar_installed', 'true');
          localStorage.setItem('duyar_permissions_granted', 'true');
          if (isDirectAdmin) {
            // Unauthenticated user hitting /admin gets dedicated Admin Login Gate
            setCurrentScreen(Screen.ADMIN_LOGIN_GATE);
          } else {
            setCurrentScreen(Screen.LOGIN);
          }
        }
      }).catch((err) => {
        console.warn("Session retrieval fallback:", err);
        if (isDirectAdmin) {
          setCurrentScreen(Screen.ADMIN_LOGIN_GATE);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession && newSession.user.email) {
        const phoneFromEmail = newSession.user.email.split('@')[0];
        const phone = '+' + phoneFromEmail;
        await fetchProfile(phone);
        if (checkIsDirectAdmin()) {
          if (phone === ADMIN_PHONE) {
            navigate(Screen.ADMIN_DASHBOARD);
          } else {
            navigate(Screen.ADMIN_LOGIN_GATE);
          }
        } else {
          navigate(Screen.HOME);
        }
      }
    });

    // Sync stored in-app notifications (search alerts, price drops)
    const storedNotifications = getInAppNotifications();
    if (storedNotifications && storedNotifications.length > 0) {
      setAdminMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const combined = [...prev];
        for (const item of storedNotifications) {
          if (!existingIds.has(item.id)) {
            combined.unshift(item);
            existingIds.add(item.id);
          }
        }
        return combined;
      });
    }

    // Subscribe to real-time search alert & price drop trigger events
    const unsubAlert = subscribeToAlertTriggered((data: any) => {
      if (data.inAppMsg) {
        setAdminMessages(prev => [data.inAppMsg, ...prev.filter(m => m.id !== data.inAppMsg.id)]);
      }
      try {
        haptics.notification();
      } catch (e) {
        // Fallback
      }
      setInAppAlertToast({
        title: data.inAppMsg?.title || (data.isPriceDrop ? '📉 Price Drop Alert' : '🔔 Search Match Alert'),
        content: data.inAppMsg?.content || 'New update matching your search criteria',
        property: data.property,
        isPriceDrop: Boolean(data.isPriceDrop)
      });
      setTimeout(() => {
        setInAppAlertToast(null);
      }, 7000);
    });

    // 30-Minute Pre-Visit Notification Event Listener
    const handleReminderDue = (e: any) => {
      const visit = e.detail as ScheduledMaintenanceVisit;
      if (!visit) return;
      try {
        haptics.notification();
      } catch (err) {}
      setInAppAlertToast({
        title: `🔔 30-Min Reminder: ${visit.serviceType} Visit`,
        content: `Technician ${visit.providerName} arrives at ${visit.scheduledTime}. Please confirm your availability!`,
        isMaintenanceReminder: true,
        visit
      });
      setActiveVisitForConfirmation(visit);
    };
    window.addEventListener(REMINDER_DUE_EVENT, handleReminderDue);

    // Initial check and poller every 20s for upcoming 30-min visits
    checkAndTriggerDueNotifications();
    const schedInterval = setInterval(() => {
      checkAndTriggerDueNotifications();
    }, 20000);

    // Android Hardware / Swipe Back Navigation Listener
    const handlePopState = (e: PopStateEvent) => {
      if (checkIsDirectAdmin()) {
        const currentPhone = localStorage.getItem('duyar_user_phone');
        if (currentPhone === ADMIN_PHONE) {
          navigate(Screen.ADMIN_DASHBOARD, false);
        } else {
          navigate(Screen.ADMIN_LOGIN_GATE, false);
        }
      } else if (e.state && e.state.screen) {
        navigate(e.state.screen, false);
      } else {
        navigate(Screen.HOME, false);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Sync provider role approval updates across components
    const handleAppsSync = () => {
      try {
        const raw = localStorage.getItem('duyar_app_statuses');
        if (raw) {
          const parsed = JSON.parse(raw);
          setAppStatuses(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {}
    };
    window.addEventListener('duyar_provider_applications_updated', handleAppsSync);

    // PWA Capabilities: Shortcuts, File Handlers, Launch Handler, Protocol Handlers, Share Target, Note Taking
    const handleOpenNotesEvent = () => setIsNoteTakingOpen(true);
    window.addEventListener('OPEN_PROPERTY_NOTES', handleOpenNotesEvent);

    const cleanupCapabilities = initPWACapabilities({
      onNavigateAction: (action) => {
        if (action === 'explore') navigate(Screen.HOME);
        else if (action === 'post_ad') navigate(Screen.POST_AD);
        else if (action === 'saved_properties') navigate(Screen.SAVED_PROPERTIES);
        else if (action === 'wallet') navigate(Screen.WALLET);
      },
      onNoteTakingRequested: () => {
        setIsNoteTakingOpen(true);
      },
      onShareReceived: (shareData) => {
        setInAppAlertToast({
          title: 'Shared Content Received',
          content: shareData.title || shareData.text || shareData.url || 'Shared property received via Web Share Target',
          isPriceDrop: true
        });
      },
      onFileReceived: (file) => {
        setInAppAlertToast({
          title: 'Property Document Attached',
          content: `${file.name} (${Math.round((file.size || 0) / 1024)} KB) opened via File Handler`,
          isPriceDrop: true
        });
      },
      onProtocolReceived: (propertyRef) => {
        setInAppAlertToast({
          title: 'Deep Link Opened (web+duyar)',
          content: `Opening property reference: ${decodeURIComponent(propertyRef)}`,
          isPriceDrop: true
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubAlert();
      window.removeEventListener(REMINDER_DUE_EVENT, handleReminderDue);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('OPEN_PROPERTY_NOTES', handleOpenNotesEvent);
      cleanupCapabilities();
      clearInterval(schedInterval);
    };
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('duyar_installed', 'true');
    navigate(Screen.LOGIN);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('duyar_user_phone');
    setSession(null);
    setUserProfile(null);
    navigate(Screen.LOGIN);
  };

  const startOtpFlow = (phone: string, otp: string, userData?: { name: string; avatarUrl: string | null }) => {
    setVerificationPhone(phone);
    setExpectedOtp(otp);
    setPendingUserData(userData || null);
    navigate(Screen.OTP);
  };

  const handleVerifySuccess = async () => {
    const cleanPhone = verificationPhone.replace(/[^0-9]/g, '');
    
    // Login Flow
    if (!pendingUserData) {
      await fetchProfile(verificationPhone);
      localStorage.setItem('duyar_user_phone', verificationPhone);
      navigate(Screen.HOME);
      return;
    }

    // Registration Flow
    try {
      const dummyEmail = `${cleanPhone}@duyar.app`;
      const dummyPassword = `duyar-${cleanPhone}-secure`;

      // 1. Attempt Sign Up
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
      });

      // 2. If user exists, try Sign In
      if (authError && authError.message.includes('registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: dummyPassword
        });
        if (signInError) throw signInError;
        authData = signInData;
      } else if (authError) {
        throw authError;
      }

      // 3. CRITICAL CHECK: Verify Session
      // If we don't have a session here, it means Email Confirmation is ON in Supabase
      if (!authData.session) {
        alert("Registration Incomplete: Please disable 'Confirm Email' in Supabase Authentication settings to allow instant signup.");
        return;
      }

      // 4. Upsert Profile using the Authenticated User ID
      // This ensures RLS passes because auth.uid() will match id
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user?.id, 
          phone: verificationPhone,
          full_name: pendingUserData.name, 
          avatar_url: pendingUserData.avatarUrl,
          role: 'TENANT',
          balance: 0
        });
      
      if (profileError) {
        console.error("Profile Creation Failed:", profileError);
        alert(`Database Error: ${profileError.message}`);
        return;
      }
      
      setPendingUserData(null);
      localStorage.setItem('duyar_user_phone', verificationPhone);
      navigate(Screen.REGISTRATION_SUCCESS);
      
    } catch (err: any) {
      console.error("Registration Error:", err);
      alert(`Registration Failed: ${err.message}`);
    }
  };

  const handleDirectLogin = async (phone: string) => {
    localStorage.setItem('duyar_installed', 'true');
    const formattedPhone = formatPhoneForSupabase(phone);
    await fetchProfile(formattedPhone);
    localStorage.setItem('duyar_user_phone', formattedPhone);
    navigate(Screen.HOME);
  };

  const handleDirectSignup = async (name: string, phone: string, avatarUrl: string | null) => {
    localStorage.setItem('duyar_installed', 'true');
    const formattedPhone = formatPhoneForSupabase(phone);
    const newProfile = {
      id: 'user-' + Date.now(),
      phone: formattedPhone,
      full_name: name,
      avatar_url: avatarUrl || '',
      role: formattedPhone === ADMIN_PHONE ? 'ADMIN' : 'TENANT',
      balance: 0
    };
    setUserProfile(newProfile);
    localStorage.setItem('duyar_user_phone', formattedPhone);
    navigate(Screen.HOME);

    // Save profile to Supabase
    try {
      await supabase.from('profiles').upsert({
        phone: formattedPhone,
        full_name: name,
        avatar_url: avatarUrl,
        role: formattedPhone === ADMIN_PHONE ? 'ADMIN' : 'TENANT',
        balance: 0
      }, { onConflict: 'phone' });
    } catch (e) {
      console.warn("Direct signup DB upsert note:", e);
    }
  };

  const renderScreen = () => {
    const isAdmin = userProfile?.role === 'ADMIN';

    switch (currentScreen) {
      case Screen.ONBOARDING_PERMISSIONS: 
        return <LoginScreen onLogin={(phone) => handleDirectLogin(phone)} onSignup={() => navigate(Screen.SIGNUP)} />;
      case Screen.LOGIN: 
        return <LoginScreen onLogin={(phone) => handleDirectLogin(phone)} onSignup={() => navigate(Screen.SIGNUP)} />;
      case Screen.SIGNUP: 
        return <SignupScreen onBack={() => navigate(Screen.LOGIN)} onSignup={(name, phone, avatarUrl) => handleDirectSignup(name, phone, avatarUrl)} />;
      case Screen.OTP: 
        return (
          <OTPScreen 
            phone={verificationPhone} 
            expectedOtp={expectedOtp} 
            onVerify={handleVerifySuccess} 
            onResend={() => {}} 
          />
        );
      case Screen.REGISTRATION_SUCCESS: 
        return <RegistrationSuccess onLogin={() => navigate(Screen.HOME)} />;
      case Screen.HOME: return (
        <HomeScreen 
          onSearch={() => navigate(Screen.RESULTS)} 
          onProfile={() => navigate(Screen.SECURITY)} 
          onCategories={() => navigate(Screen.SERVICES_HUB)} 
          onWallet={() => navigate(Screen.WALLET)} 
          onPostAd={() => navigate(Screen.POST_AD)} 
          onHistory={() => navigate(Screen.HISTORY)} 
          onNotifications={() => navigate(Screen.ADMIN_NOTIFICATIONS)} 
          onFilter={() => navigate(Screen.FILTERS)} 
          isAdmin={isAdmin}
          onNavigate={navigate}
          onPropertySelect={(p) => { setSelectedProperty(p); navigate(Screen.PROPERTY_DETAILS); }}
          lang={lang}
          onToggleLang={handleLangToggle}
          userProfile={userProfile}
        />
      );
      // ... rest of cases
      case Screen.RESULTS: return <ResultsScreen onBack={() => navigate(Screen.HOME)} onFilter={() => navigate(Screen.FILTERS)} onPropertySelect={(p) => { setSelectedProperty(p); navigate(Screen.PROPERTY_DETAILS); }} onCompare={() => navigate(Screen.COMPARE)} filters={filters} onUpdateFilters={(newFilters) => setFilters(newFilters)} lang={lang} />;
      case Screen.PROPERTY_DETAILS: return (
        <PropertyDetails 
          property={selectedProperty} 
          onBack={() => navigate(Screen.HOME)} 
          onBook={() => navigate(Screen.BOOK_VISIT)} 
          onApply={() => navigate(Screen.RENT_STEP1)} 
          onRate={() => { setActiveVisitForReview(null); navigate(Screen.VISIT_FEEDBACK); }}
          onCompare={() => navigate(Screen.COMPARE)}
        />
      );
      case Screen.COMPARE: return (
        <PropertyComparisonView 
          onBack={() => {
            if (selectedProperty) {
              navigate(Screen.PROPERTY_DETAILS);
            } else {
              navigate(Screen.RESULTS);
            }
          }} 
          onPropertySelect={(p) => { setSelectedProperty(p); navigate(Screen.PROPERTY_DETAILS); }}
          onBrowse={() => navigate(Screen.RESULTS)}
        />
      );
      case Screen.BOOK_VISIT: return <BookVisitScreen property={selectedProperty} userProfile={userProfile} onBack={() => navigate(Screen.PROPERTY_DETAILS)} onConfirm={() => navigate(Screen.VISIT_SUCCESS)} />;
      case Screen.VISIT_SUCCESS: return <VisitScheduledSuccess property={selectedProperty} onHome={() => navigate(Screen.HOME)} onTrack={() => navigate(Screen.MY_VISITS)} />;
      case Screen.VISIT_ARRIVAL: return <PropertyArrivalView property={selectedProperty} onBack={() => navigate(Screen.MY_VISITS)} onStartVisit={() => navigate(Screen.VISIT_FEEDBACK)} />;
      case Screen.VISIT_FEEDBACK: return <VisitFeedbackScreen property={selectedProperty} visit={activeVisitForReview} onBack={() => navigate(Screen.MY_VISITS)} onSubmit={() => navigate(Screen.MY_VISITS)} />;
      case Screen.ROUTE_NAVIGATION: return <RouteNavigationView property={selectedProperty} onBack={() => navigate(Screen.MY_VISITS)} />;
      case Screen.SAVED_PROPERTIES: return <SavedPropertiesView onBack={() => navigate(Screen.SECURITY)} onPropertySelect={(p) => { setSelectedProperty(p); navigate(Screen.PROPERTY_DETAILS); }} onBrowse={() => navigate(Screen.RESULTS)} />;
      case Screen.INTERESTED_PROPERTIES: return <InterestedPropertiesView onBack={() => navigate(Screen.HOME)} />;
      case Screen.RENT_STEP1: return <RentalStep1 onNext={() => navigate(Screen.RENT_STEP2)} onBack={() => navigate(Screen.PROPERTY_DETAILS)} />;
      case Screen.RENT_STEP2: return <RentalStep2 onNext={() => navigate(Screen.RENT_STEP3)} onBack={() => navigate(Screen.RENT_STEP1)} />;
      case Screen.RENT_STEP3: return <RentalStep3 onSubmit={() => navigate(Screen.RENT_SUCCESS)} onBack={() => navigate(Screen.RENT_STEP2)} />;
      case Screen.RENT_SUCCESS: return <RentalSuccess property={selectedProperty} onHome={() => navigate(Screen.HOME)} />;
      case Screen.FILTERS: return <FilterModal filters={filters} onApply={(newFilters) => { setFilters(newFilters); navigate(Screen.RESULTS); }} onBack={() => navigate(Screen.HOME)} lang={lang} />;
      case Screen.SECURITY: return (
        <ProfileScreen 
          onBack={() => navigate(Screen.HOME)}
          onEditProfile={() => navigate(Screen.EDIT_PROFILE)}
          onMyAds={() => navigate(Screen.MY_ADS)}
          onPostAd={() => navigate(Screen.POST_AD)}
          onPaymentMethods={() => navigate(Screen.WALLET)}
          onApplyLandlord={() => {
            if (appStatuses.landlord === 'APPROVED') navigate(Screen.LANDLORD_DASHBOARD);
            else if (appStatuses.landlord === 'PENDING') { setLastAppliedType('Landlord'); navigate(Screen.APPLICATION_STATUS); }
            else navigate(Screen.LANDLORD_APP);
          }}
          onApplyPickDrop={() => {
            if (appStatuses.pickDrop === 'APPROVED') navigate(Screen.PICK_DROP_DASHBOARD);
            else if (appStatuses.pickDrop === 'PENDING') { setLastAppliedType('Pick & Drop'); navigate(Screen.APPLICATION_STATUS); }
            else navigate(Screen.PICK_DROP_APP);
          }}
          onApplyMaintenance={() => {
            if (appStatuses.maintenance === 'APPROVED') navigate(Screen.MAINTENANCE_DASHBOARD);
            else if (appStatuses.maintenance === 'PENDING') { setLastAppliedType('Maintenance'); navigate(Screen.APPLICATION_STATUS); }
            else navigate(Screen.MAINTENANCE_APP);
          }}
          onApplyLocator={() => {
             if (appStatuses.locator === 'APPROVED') navigate(Screen.LOCATOR_DASHBOARD);
             else if (appStatuses.locator === 'PENDING') { setLastAppliedType('Locator'); navigate(Screen.APPLICATION_STATUS); }
             else navigate(Screen.LOCATOR_APP);
          }}
          onApplySecurityGuard={() => {
             if (appStatuses.securityGuard === 'APPROVED') navigate(Screen.SECURITY_GUARD_DASHBOARD);
             else if (appStatuses.securityGuard === 'PENDING') { setLastAppliedType('Security Guard'); navigate(Screen.APPLICATION_STATUS); }
             else navigate(Screen.SECURITY_GUARD_APP);
          }}
          onApplyMaid={() => {
             if (appStatuses.maid === 'APPROVED') navigate(Screen.MAID_DASHBOARD);
             else if (appStatuses.maid === 'PENDING') { setLastAppliedType('Maid'); navigate(Screen.APPLICATION_STATUS); }
             else navigate(Screen.MAID_APP);
          }}
          appStatuses={appStatuses}
          onNotificationSettings={() => navigate(Screen.NOTIFICATIONS)}
          onSavedProperties={() => navigate(Screen.SAVED_PROPERTIES)}
          onSecurity={() => navigate(Screen.ACCOUNT_SECURITY)}
          onSupport={() => navigate(Screen.HELP_SUPPORT)}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          userProfile={userProfile}
          onNavigate={navigate}
          lang={lang}
          onToggleLang={handleLangToggle}
          onLangChange={handleLangChange}
        />
      );
      case Screen.ACCOUNT_SECURITY: return <SecurityScreen onBack={() => navigate(Screen.SECURITY)} />;
      case Screen.WALLET: return <WalletDashboard onBack={() => navigate(Screen.HOME)} onAdd={() => navigate(Screen.MANUAL_RECHARGE_FORM)} onWithdraw={() => navigate(Screen.WITHDRAW)} onSend={() => navigate(Screen.SEND_MONEY_SEARCH)} onHistory={() => navigate(Screen.RECHARGE_HISTORY)} userProfile={userProfile} onNavigate={navigate} lang={lang} />;
      case Screen.ADD_MONEY: return <AddMoney onBack={() => navigate(Screen.WALLET)} onSuccess={(amt) => { setAddedAmount(amt); navigate(Screen.TRANSACTION_SUCCESS); }} />;
      case Screen.WITHDRAW: return <WithdrawFunds onBack={() => navigate(Screen.WALLET)} userProfile={userProfile} />;
      case Screen.SEND_MONEY_SEARCH: return <SendMoneySearch onBack={() => navigate(Screen.WALLET)} onSelect={(user) => { setSelectedRecipient(user); navigate(Screen.SEND_MONEY_AMOUNT); }} />;
      case Screen.SEND_MONEY_AMOUNT: return <SendMoneyAmount recipient={selectedRecipient} onBack={() => navigate(Screen.SEND_MONEY_SEARCH)} onConfirm={(amount) => { setSendAmount(amount); navigate(Screen.PIN_VERIFICATION); }} />;
      case Screen.PIN_VERIFICATION: return <PinVerification recipient={selectedRecipient} amount={sendAmount} onBack={() => navigate(Screen.SEND_MONEY_AMOUNT)} onVerify={async () => navigate(Screen.TRANSACTION_SUCCESS)} />;
      case Screen.TRANSACTION_SUCCESS: if (addedAmount > 0) { return <AddMoneySuccess amount={addedAmount} onWallet={() => { setAddedAmount(0); navigate(Screen.WALLET); }} onHome={() => { setAddedAmount(0); navigate(Screen.HOME); }} />; } return <TransactionSuccess recipient={selectedRecipient} amount={sendAmount} onHome={() => navigate(Screen.HOME)} />;
      case Screen.MY_ADS: return <MyAdvertisements onBack={() => navigate(Screen.SECURITY)} onBoost={() => navigate(Screen.BOOST_AD)} userProfile={userProfile} />;
      case Screen.POST_AD: return (
        <PostAdScreen 
          onBack={() => navigate(Screen.HOME)} 
          onSubmit={(data) => { setLastAdTitle(data.title); navigate(Screen.AD_SUCCESS); }} 
          onApplyLandlord={() => navigate(Screen.LANDLORD_APP)}
          onApplyLocator={() => navigate(Screen.LOCATOR_APP)}
          userProfile={userProfile} 
          lang={lang} 
        />
      );
      case Screen.AD_SUCCESS: return <AdSubmittedSuccess onHome={() => navigate(Screen.HOME)} onViewAds={() => navigate(Screen.MY_ADS)} adTitle={lastAdTitle} />;
      case Screen.BOOST_AD: return <BoostAd onBack={() => navigate(Screen.MY_ADS)} onSelectPlan={(plan) => { setSelectedBoostPlan(plan); navigate(Screen.BOOST_PAYMENT); }} />;
      case Screen.BOOST_PAYMENT: return <BoostPayment plan={selectedBoostPlan} onBack={() => navigate(Screen.BOOST_AD)} onPay={() => navigate(Screen.TRANSACTION_SUCCESS)} />;
      case Screen.LANDLORD_APP: return <LandlordApplication onBack={() => navigate(Screen.SECURITY)} onSubmit={(extra) => handleApplicationSubmit('Landlords', 'Landlord', extra)} userProfile={userProfile} />;
      case Screen.PICK_DROP_APP: return <PickDropApplication onBack={() => navigate(Screen.SERVICES_HUB)} onSubmit={() => handleApplicationSubmit('PickDrop', 'Pick & Drop')} />;
      case Screen.LOCATOR_APP: return <LocatorApplication onBack={() => navigate(Screen.SECURITY)} onSubmit={() => handleApplicationSubmit('Locators', 'Locator')} />;
      case Screen.MAID_APP: return <MaidApplication onBack={() => navigate(Screen.SECURITY)} onSubmit={() => handleApplicationSubmit('Maids', 'Maid')} />;
      case Screen.SECURITY_GUARD_APP: return <SecurityGuardApplication onBack={() => navigate(Screen.SECURITY)} onSubmit={() => handleApplicationSubmit('Security', 'Security Guard')} />;
      case Screen.APP_SUBMITTED: return <ApplicationSubmitted type={lastAppliedType} onHome={() => navigate(Screen.HOME)} />;
      case Screen.APPLICATION_STATUS: return <ApplicationStatusScreen role={lastAppliedType} userProfile={userProfile} onBack={() => navigate(Screen.SECURITY)} />;
      case Screen.SERVICE_TRACKING: 
        return (
          <LiveTracking 
            serviceType={activeTrackingService?.type || activeTrackingService?.category || selectedMaintenanceService || 'Electrical'} 
            serviceData={activeTrackingService}
            onBack={() => navigate(Screen.HISTORY)} 
            onArrived={() => {
              setRatingServiceData(activeTrackingService);
              navigate(Screen.SERVICE_RATING);
            }} 
          />
        );
      case Screen.SERVICE_RATING: 
        return (
          <ServiceRating 
            serviceType={ratingServiceData?.type || ratingServiceData?.category || selectedMaintenanceService}
            serviceData={ratingServiceData}
            onBack={() => navigate(Screen.HOME)} 
            onSubmit={(data) => {
              setRatingSuccessData(data);
              navigate(Screen.RATING_SUCCESS);
            }} 
          />
        );
      case Screen.RATING_SUCCESS: 
        return <RatingSuccess ratingData={ratingSuccessData} onHome={() => navigate(Screen.HOME)} />;
      case Screen.MY_VISITS: return <MyVisits userProfile={userProfile} onBack={() => navigate(Screen.HOME)} onNavigate={() => navigate(Screen.ROUTE_NAVIGATION)} onArrival={() => navigate(Screen.VISIT_ARRIVAL)} onRateVisit={(visit) => { setActiveVisitForReview(visit); if (visit.propertyId) { setSelectedProperty({ id: visit.propertyId, title: visit.propertyTitle, image: visit.propertyImage, location: visit.propertyLocation, price: visit.propertyPrice, beds: 3, baths: 3, sqft: 1650, tag: 'Rent' }); } navigate(Screen.VISIT_FEEDBACK); }} />;
      case Screen.NOTIFICATIONS: return <NotificationSettings onBack={() => navigate(Screen.SECURITY)} />;
      case Screen.ADMIN_NOTIFICATIONS: return <AdminNotifications messages={adminMessages} setMessages={setAdminMessages} onBack={() => navigate(Screen.HOME)} />;
      case Screen.HISTORY: return (
        <ServiceHistory 
          userProfile={userProfile}
          onBack={() => navigate(Screen.HOME)} 
          onTrack={(service) => { 
            if (service) {
              setActiveTrackingService({
                type: service.serviceType || service.category || service.title,
                serviceName: service.title,
                category: service.category,
                price: service.price,
                id: service.id,
                providerName: service.providerName,
                providerRole: service.providerRole,
                providerPhone: service.providerPhone,
                address: service.address
              });
              setSelectedMaintenanceService(service.category || service.title);
            } else {
              setActiveTrackingService({
                type: selectedMaintenanceService || 'Electrical',
                serviceName: selectedMaintenanceService || 'Electrical',
                category: selectedMaintenanceService || 'Electrical'
              });
            }
            navigate(Screen.SERVICE_TRACKING); 
          }} 
          onChat={(service) => {
            if (service) {
              setActiveChatService(service);
              setSelectedMaintenanceService(service.category || service.title);
            }
            navigate(Screen.SERVICE_CHAT);
          }} 
          onNavigate={navigate} 
          lang={lang}
        />
      );
      case Screen.SERVICES_HUB: return <ServicesHub activeTab="SERVICES" onBack={() => navigate(Screen.HOME)} onNavigate={(screen) => { if (screen === Screen.MAINTENANCE_HUB) { setLastAppliedType('Maintenance'); navigate(Screen.MAINTENANCE_HUB); } else { navigate(screen); } }} lang={lang} />;
      case Screen.MAINTENANCE_HUB: return <MaintenanceHub onBack={() => navigate(Screen.SERVICES_HUB)} onSelect={(service) => { setSelectedMaintenanceService(service); navigate(Screen.MAINTENANCE_BOOKING); }} lang={lang} />;
      case Screen.MAINTENANCE_BOOKING: return <MaintenanceBooking serviceName={selectedMaintenanceService} userProfile={userProfile} onBack={() => navigate(Screen.MAINTENANCE_HUB)} onConfirm={() => navigate(Screen.HISTORY)} />;
      case Screen.MAINTENANCE_SUCCESS: return (
        <MaintenanceSuccess 
          serviceName={selectedMaintenanceService} 
          onHome={() => navigate(Screen.HOME)} 
          onTrack={() => {
            setActiveTrackingService({
              type: selectedMaintenanceService,
              serviceName: selectedMaintenanceService,
              category: selectedMaintenanceService
            });
            navigate(Screen.SERVICE_TRACKING);
          }} 
        />
      );
      case Screen.MAINTENANCE_APP: return <MaintenanceApplication onBack={() => navigate(Screen.SECURITY)} onSubmit={() => handleApplicationSubmit('Maintenance', 'Maintenance')} />;
      case Screen.SERVICE_CHAT: {
        const cat = activeChatService?.category || selectedMaintenanceService || 'Electrical';
        const isElec = cat.toLowerCase().includes('electric');
        const isPlumb = cat.toLowerCase().includes('plumb');
        const isMaid = cat.toLowerCase().includes('maid');
        const isSec = cat.toLowerCase().includes('security') || cat.toLowerCase().includes('guard');
        const isPd = cat.toLowerCase().includes('pick') || cat.toLowerCase().includes('drop');

        const chatProvider = {
          id: activeChatService?.id || (isElec ? 'prov-elec' : isPlumb ? 'prov-plm' : isMaid ? 'prov-md' : isSec ? 'prov-sec' : isPd ? 'prov-pd' : 'prov-maint'),
          name: activeChatService?.providerName && !activeChatService.providerName.includes('Awaiting')
            ? activeChatService.providerName
            : (isElec ? 'Electrical Specialist' : isPlumb ? 'Plumbing Specialist' : isMaid ? 'Housekeeping Specialist' : isSec ? 'Security Specialist' : isPd ? 'Logistics Pilot' : 'Maintenance Specialist'),
          rating: 5.0,
          jobsDone: 0,
          location: activeChatService?.location || 'Banani, Dhaka',
          price: activeChatService?.price || (isSec ? '৳ 15,000' : '৳ 1,250'),
          category: cat,
          online: true,
          image: activeChatService?.providerImage || ''
        };

        return (
          <ServiceChatScreen 
            provider={chatProvider} 
            initialPrice={activeChatService?.price || (isSec ? '15000' : '1250')} 
            serviceCategory={cat}
            ticketId={activeChatService?.id}
            onBack={() => navigate(Screen.HISTORY)} 
            onConfirmed={(finalPrice) => {
              setActiveTrackingService({
                type: cat,
                serviceName: activeChatService?.title || cat,
                category: cat,
                price: `৳ ${finalPrice}`,
                providerName: chatProvider.name,
                providerRole: isSec ? 'Senior Security Officer • 5.0★' : 'Verified Specialist',
                providerImage: chatProvider.image,
                id: activeChatService?.id
              });
            }}
            onTrack={(info) => {
              setActiveTrackingService({
                type: cat,
                serviceName: activeChatService?.title || cat,
                category: cat,
                ...info
              });
              navigate(Screen.SERVICE_TRACKING);
            }} 
            lang={lang}
          />
        );
      }
      case Screen.MAID_BOOKING: return <MaidBooking userProfile={userProfile} onBack={() => navigate(Screen.SERVICES_HUB)} onConfirm={() => { setSelectedMaintenanceService('Maid'); navigate(Screen.HISTORY); }} />;
      case Screen.SECURITY_BOOKING: return <SecurityBooking userProfile={userProfile} onBack={() => navigate(Screen.SERVICES_HUB)} onConfirm={() => { setSelectedMaintenanceService('Security'); navigate(Screen.HISTORY); }} />;
      case Screen.PICK_DROP_BOOKING: return <PickDropBooking userProfile={userProfile} onBack={() => navigate(Screen.SERVICES_HUB)} onConfirm={() => { setSelectedMaintenanceService('Pick & Drop'); navigate(Screen.HISTORY); }} />;
      case Screen.PICK_DROP_SUCCESS: return (
        <PickDropSuccess 
          onHome={() => navigate(Screen.HOME)} 
          onTrack={() => {
            setActiveTrackingService({
              type: 'Pick & Drop',
              serviceName: 'Pick & Drop Shipment',
              category: 'Pick & Drop'
            });
            navigate(Screen.SERVICE_TRACKING);
          }} 
        />
      );
      case Screen.EMERGENCY_HELP: return <EmergencyHelp onBack={() => navigate(Screen.SERVICES_HUB)} lang={lang} />;
      case Screen.EDIT_PROFILE: return <EditProfileScreen onBack={() => navigate(Screen.SECURITY)} onSave={() => { fetchProfile(userProfile?.phone); navigate(Screen.SECURITY); }} userProfile={userProfile} />;
      case Screen.HELP_SUPPORT: return <HelpSupportScreen onBack={() => navigate(Screen.SECURITY)} />;
      case Screen.SMS_ADMIN: return <SmsAdminScreen onBack={() => navigate(Screen.ADMIN_NOTIFICATIONS)} />;
      case Screen.MANUAL_RECHARGE_FORM: return <ManualRechargeForm onBack={() => navigate(Screen.WALLET)} onSubmit={(data) => { setRechargeStatusProps({ status: 'pending', ...data }); navigate(Screen.RECHARGE_STATUS); }} />;
      case Screen.RECHARGE_STATUS: return <RechargeStatus {...rechargeStatusProps} onBack={() => navigate(Screen.WALLET)} onContactSupport={() => navigate(Screen.HELP_SUPPORT)} />;
      case Screen.RECHARGE_HISTORY: return <RechargeHistory onBack={() => navigate(Screen.WALLET)} onItemClick={(data) => { setRechargeStatusProps(data); navigate(Screen.RECHARGE_STATUS); }} userProfile={userProfile} />;

      // Dashboards
      case Screen.LOCATOR_DASHBOARD: return <LocatorDashboard onBack={() => navigate(Screen.SECURITY)} onPostAd={() => navigate(Screen.POST_AD)} userProfile={userProfile} />;
      case Screen.LANDLORD_DASHBOARD: return <LandlordDashboard onBack={() => navigate(Screen.SECURITY)} onPostAd={() => navigate(Screen.POST_AD)} userProfile={userProfile} />;
      case Screen.MAID_DASHBOARD: return <MaidDashboard onBack={() => navigate(Screen.SECURITY)} userProfile={userProfile} />;
      case Screen.SECURITY_GUARD_DASHBOARD: return <SecurityGuardDashboard onBack={() => navigate(Screen.SECURITY)} onSOS={() => navigate(Screen.EMERGENCY_HELP)} userProfile={userProfile} />;
      case Screen.MAINTENANCE_DASHBOARD: return <MaintenanceDashboard onBack={() => navigate(Screen.SECURITY)} onNavigate={() => navigate(Screen.ROUTE_NAVIGATION)} userProfile={userProfile} />;
      case Screen.PICK_DROP_DASHBOARD: return (
        <PickDropDashboard 
          onBack={() => navigate(Screen.SECURITY)} 
          userProfile={userProfile}
          onTrack={() => {
            setActiveTrackingService({
              type: 'Pick & Drop',
              serviceName: 'Pick & Drop Shipment',
              category: 'Pick & Drop'
            });
            navigate(Screen.SERVICE_TRACKING);
          }} 
        />
      );

      // Admin Panel Suite
      case Screen.ADMIN_LOGIN_GATE:
        return (
          <AdminLoginGate
            adminPhone={ADMIN_PHONE}
            onAdminLogin={(phone) => {
              fetchProfile(phone);
              try {
                localStorage.setItem('duyar_user_phone', phone);
                if (!window.location.pathname.toLowerCase().startsWith('/admin')) {
                  window.history.replaceState({ screen: Screen.ADMIN_DASHBOARD }, '', '/admin');
                }
              } catch (e) {}
              setCurrentScreen(Screen.ADMIN_DASHBOARD);
            }}
            onReturnToApp={() => {
              try {
                if (window.location.pathname.toLowerCase().startsWith('/admin')) {
                  window.history.pushState(null, '', '/');
                }
              } catch (e) {}
              navigate(Screen.HOME);
            }}
          />
        );

      case Screen.ADMIN_DASHBOARD: 
        return (
          <AdminWebDashboard 
            onBackToApp={() => {
              try {
                if (window.location.hash === '#admin') {
                  window.history.replaceState(null, '', window.location.pathname);
                }
                const params = new URLSearchParams(window.location.search);
                if (params.has('admin') || params.has('view') || params.has('screen')) {
                  params.delete('admin');
                  params.delete('view');
                  params.delete('screen');
                  const newSearch = params.toString() ? `?${params.toString()}` : '';
                  window.history.replaceState(null, '', window.location.pathname + newSearch);
                }
                if (window.location.pathname.toLowerCase().startsWith('/admin')) {
                  window.history.pushState(null, '', '/');
                }
              } catch (e) {}
              navigate(Screen.HOME);
            }} 
          />
        );
      case Screen.ADMIN_LIVE_TRACKING: return <AdminLiveTracking onBack={() => navigate(Screen.ADMIN_DASHBOARD)} onSupport={() => navigate(Screen.ADMIN_SUPPORT)} />;
      case Screen.ADMIN_REVENUE: return <AdminRevenue onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_PAYOUTS: return <AdminPayouts onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_WALLET: return <AdminWallet onBack={() => navigate(Screen.ADMIN_DASHBOARD)} onRechargeApproval={() => navigate(Screen.ADMIN_RECHARGE_APPROVAL)} onPayouts={() => navigate(Screen.ADMIN_PAYOUTS)} />;
      case Screen.ADMIN_APPROVALS: return <AdminApprovals onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_MODERATION: return <AdminModeration onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_ACTIVITY_LOG: return <AdminActivityLog onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_SUPPORT: return <AdminSupport onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_AD_PLACEMENT: return <AdminAdPlacement onBack={() => navigate(Screen.ADMIN_DASHBOARD)} />;
      case Screen.ADMIN_RECHARGE_APPROVAL: return <AdminManualRecharge onBack={() => navigate(Screen.ADMIN_WALLET)} />;

      default: return (
        <HomeScreen 
          onSearch={() => navigate(Screen.RESULTS)} 
          onProfile={() => navigate(Screen.SECURITY)} 
          onCategories={() => navigate(Screen.SERVICES_HUB)} 
          onWallet={() => navigate(Screen.WALLET)} 
          onPostAd={() => navigate(Screen.POST_AD)} 
          onHistory={() => navigate(Screen.HISTORY)} 
          onNotifications={() => navigate(Screen.ADMIN_NOTIFICATIONS)} 
          onFilter={() => navigate(Screen.FILTERS)} 
          onNavigate={navigate}
          userProfile={userProfile}
          isAdmin={isAdmin}
          lang={lang}
        />
      );
    }
  };

  // Full-width standalone render for the Web Admin Dashboard
  if (currentScreen === Screen.ADMIN_DASHBOARD) {
    return <AdminWebDashboard onBackToApp={() => navigate(Screen.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-background-dark overflow-x-hidden selection:bg-primary/20 flex flex-col items-center">
      <PWAInstallPrompt />
      <div className="flex-1 relative w-full max-w-[430px] bg-[#0a1211] shadow-2xl overflow-hidden">
        {/* Floating In-App Price Drop & Match Alert Toast with Gentle Glowing Pulse */}
        {inAppAlertToast && (
          <div 
            id="inapp-alert-toast"
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-[400px] bg-[#0c1c1a]/95 backdrop-blur-2xl border rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden transition-all ${
              inAppAlertToast.isMaintenanceReminder
                ? 'toast-glow-amber border-amber-500/50'
                : inAppAlertToast.isPriceDrop 
                  ? 'toast-glow-emerald border-emerald-500/50' 
                  : 'toast-glow-teal border-primary/50'
            }`}
          >
            {/* Subtle light sweep beam */}
            <div className="toast-shimmer-beam" />

            {/* Ambient Radial Glow behind the icon */}
            <div className={`absolute -top-10 -left-10 size-28 rounded-full blur-2xl pointer-events-none ${
              inAppAlertToast.isMaintenanceReminder
                ? 'bg-amber-500/20'
                : inAppAlertToast.isPriceDrop 
                  ? 'bg-emerald-500/20' 
                  : 'bg-primary/20'
            }`} />

            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border relative z-10 toast-icon-pulse ${
              inAppAlertToast.isMaintenanceReminder
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                : inAppAlertToast.isPriceDrop 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.4)]' 
                  : 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_14px_rgba(19,236,218,0.4)]'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {inAppAlertToast.isMaintenanceReminder
                  ? 'schedule'
                  : inAppAlertToast.isPriceDrop 
                    ? 'trending_down' 
                    : 'notifications_active'}
              </span>
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">
                  {inAppAlertToast.title}
                </h4>
                <button
                  type="button"
                  id="close-inapp-toast-btn"
                  onClick={() => setInAppAlertToast(null)}
                  className="text-white/40 hover:text-white size-5 flex items-center justify-center rounded-full"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-[11px] text-white/70 font-medium line-clamp-2 mt-0.5">
                {inAppAlertToast.content}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {inAppAlertToast.visit && (
                  <button
                    type="button"
                    id="toast-confirm-visit-btn"
                    onClick={() => {
                      setActiveVisitForConfirmation(inAppAlertToast.visit!);
                      setInAppAlertToast(null);
                    }}
                    className="bg-primary hover:bg-[#11d8c7] text-background-dark text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg active:scale-95 transition-transform flex items-center gap-1 shadow-[0_0_12px_rgba(19,236,218,0.4)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs font-bold">check_circle</span>
                    Confirm Availability
                  </button>
                )}
                {inAppAlertToast.property && (
                  <button
                    type="button"
                    id="toast-view-property-btn"
                    onClick={() => {
                      setSelectedProperty(inAppAlertToast.property);
                      setInAppAlertToast(null);
                      navigate(Screen.PROPERTY_DETAILS);
                    }}
                    className="bg-primary text-background-dark text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg active:scale-95 transition-transform"
                  >
                    View Listing
                  </button>
                )}
                <button
                  type="button"
                  id="toast-view-inbox-btn"
                  onClick={() => {
                    setInAppAlertToast(null);
                    navigate(Screen.ADMIN_NOTIFICATIONS);
                  }}
                  className="text-primary text-[10px] font-black uppercase tracking-wider px-2 py-1 hover:underline"
                >
                  View In-Box
                </button>
              </div>
            </div>
          </div>
        )}
        {renderScreen()}
        <OfflineIndicator />

        {/* 30-Minute Maintenance Visit Availability Confirmation Modal */}
        {activeVisitForConfirmation && (
          <AvailabilityConfirmModal
            isOpen={Boolean(activeVisitForConfirmation)}
            visit={activeVisitForConfirmation}
            onClose={() => setActiveVisitForConfirmation(null)}
            onConfirmed={() => {
              setActiveVisitForConfirmation(null);
              setInAppAlertToast({
                title: '✅ Availability Confirmed',
                content: 'Your technician has been notified and will arrive on schedule.',
                isPriceDrop: true
              });
              setTimeout(() => setInAppAlertToast(null), 5000);
            }}
          />
        )}

        {/* PWA Note Taking Inspection Modal */}
        <PropertyNoteTakingModal
          isOpen={isNoteTakingOpen}
          onClose={() => setIsNoteTakingOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;
