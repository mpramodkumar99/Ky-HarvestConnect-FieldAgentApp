import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizePhone, requestOtp, verifyOtp, type AuthSession } from '@/services/auth-api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-provider';
import { useLanguage } from '@/context/language-context';

type Screen = 'welcome' | 'login-phone' | 'otp';

const PRIMARY   = '#2E7D32';
const ACCENT    = '#F4A300';
const IVORY     = '#FAF7F2';
const EARTH     = '#7B4B2A';

const DEV_SESSION: AuthSession = {
  token:     'dev-token-agent001',
  userId:    'agent-001',
  userType:  'agent',
  sessionId: 'dev-session-agent001',
  expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
};

// ── Welcome ────────────────────────────────────────────────────────────────────

function WelcomeScreen({ onLogin }: { onLogin: () => void }) {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const { t }         = useLanguage();

  async function devLogin() {
    await login(DEV_SESSION);
    showToast('Dev login — AuthSvc bypassed.', 'info');
  }

  return (
    <View style={w.screen}>
      <SafeAreaView style={w.safe} edges={['top', 'bottom']}>

        <View style={w.top}>
          <View style={w.logoRing}>
            <Text style={w.logoIcon}>🦊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={w.brand}>FoxTail</Text>
            <Text style={w.brandSub}>Field Agent</Text>
          </View>
          <View style={w.goldBadge}>
            <Text style={w.goldBadgeTxt}>Agent</Text>
          </View>
        </View>

        <View style={w.hero}>
          <Text style={w.title}>Deliver fresh.{'\n'}Serve local.</Text>
          <Text style={w.sub}>
            From Local Roots to Every Home — your last-mile delivery partner for India's local marketplace.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={w.pillRow}>
          {['📍 GPS Routing', '🏪 Store Admin', '📊 Reports'].map(p => (
            <View key={p} style={w.pill}>
              <Text style={w.pillTxt}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Rangoli-style dot divider */}
        <View style={w.dotRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[w.dot, { backgroundColor: i % 3 === 0 ? ACCENT : i % 3 === 1 ? PRIMARY : EARTH }]} />
          ))}
        </View>

        <View style={w.footer}>
          <Pressable style={w.ctaBtn} onPress={onLogin}>
            <Text style={w.ctaTxt}>{t('auth_login')}</Text>
          </Pressable>
          {__DEV__ && (
            <Pressable style={w.devBtn} onPress={devLogin}>
              <Text style={w.devTxt}>{t('dev_login')}</Text>
            </Pressable>
          )}
          <Text style={w.tagline}>From Local Roots to Every Home 🦊</Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const w = StyleSheet.create({
  screen: { flex: 1, backgroundColor: IVORY },
  safe:   { flex: 1, paddingHorizontal: 24 },
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 24, paddingBottom: 32,
  },
  logoRing: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: ACCENT,
  },
  logoIcon:    { fontSize: 30 },
  brand:       { fontSize: 22, fontWeight: '800', color: PRIMARY },
  brandSub:    { fontSize: 12, fontWeight: '600', color: EARTH, marginTop: 1 },
  goldBadge: {
    backgroundColor: ACCENT, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  goldBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  hero:     { marginBottom: 28 },
  title:    { fontSize: 34, fontWeight: '800', color: '#1a1208', lineHeight: 42, marginBottom: 12 },
  sub:      { fontSize: 14, color: '#7a6a52', lineHeight: 22 },
  pillRow:  { flexDirection: 'row', gap: 8, marginBottom: 28, flexWrap: 'wrap' },
  pill: {
    backgroundColor: '#fff', borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: '#e0d8cc',
  },
  pillTxt:  { fontSize: 12, fontWeight: '600', color: '#3d2f1a' },
  dotRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  footer:   { gap: 12 },
  ctaBtn:   { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  ctaTxt:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  devBtn:   { backgroundColor: ACCENT + '22', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: ACCENT + '55' },
  devTxt:   { fontSize: 14, fontWeight: '600', color: EARTH },
  tagline:  { fontSize: 12, color: '#a89880', textAlign: 'center', marginTop: 4 },
});

// ── Phone Entry ────────────────────────────────────────────────────────────────

function PhoneScreen({ onOtpSent, onBack }: { onOtpSent: (phone: string) => void; onBack: () => void }) {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { t } = useLanguage();

  async function handleSend() {
    const normalized = normalizePhone(phone);
    if (normalized.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      await requestOtp(normalized);
      onOtpSent(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: IVORY, paddingHorizontal: 24 }} edges={['top', 'bottom']}>
        <Pressable style={p.backBtn} onPress={onBack}>
          <View style={p.backArrow} />
        </Pressable>

        <View style={p.logoRow}>
          <View style={p.logoRing}><Text style={{ fontSize: 22 }}>🦊</Text></View>
          <Text style={p.brand}>FoxTail Agent</Text>
        </View>

        <Text style={p.title}>{t('auth_login')}</Text>
        <Text style={p.sub}>Enter your registered mobile number to continue.</Text>

        <View style={p.inputWrap}>
          <View style={p.countryCode}><Text style={p.countryTxt}>🇮🇳 +91</Text></View>
          <TextInput
            style={p.input}
            value={phone}
            onChangeText={v => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setError(''); }}
            placeholder={t('auth_phone_ph')}
            placeholderTextColor="#a89880"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {error ? <Text style={p.err}>{error}</Text> : null}

        <Pressable
          style={[p.btn, (loading || phone.length < 10) && p.btnDisabled]}
          onPress={handleSend}
          disabled={loading || phone.length < 10}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={p.btnTxt}>{t('auth_send_otp')}</Text>}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const p = StyleSheet.create({
  backBtn:  { marginTop: 16, marginBottom: 8, width: 40, height: 40, justifyContent: 'center' },
  backArrow: { width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 10, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#3d2f1a' },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoRing: { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  brand:    { fontSize: 17, fontWeight: '700', color: PRIMARY },
  title:    { fontSize: 28, fontWeight: '800', color: '#1a1208', marginBottom: 8 },
  sub:      { fontSize: 14, color: '#7a6a52', lineHeight: 21, marginBottom: 32 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0d8cc', borderRadius: 14, backgroundColor: '#fff', marginBottom: 8 },
  countryCode: { paddingHorizontal: 14, paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#e0d8cc' },
  countryTxt:  { fontSize: 14, fontWeight: '600', color: '#3d2f1a' },
  input:  { flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 16, color: '#1a1208' },
  err:    { fontSize: 12, color: '#dc2626', marginBottom: 12 },
  btn:         { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.45 },
  btnTxt:      { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ── OTP Screen ─────────────────────────────────────────────────────────────────

function OtpScreen({ phone, onBack }: { phone: string; onBack: () => void }) {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const { t }         = useLanguage();
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function handleVerify() {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const session = await verifyOtp(phone, otp);
      await login(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    try {
      await requestOtp(phone);
      setCountdown(30);
      showToast('OTP resent!', 'success');
    } catch {
      showToast('Failed to resend OTP', 'error');
    }
  }

  const digits = otp.padEnd(6, ' ').split('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: IVORY, paddingHorizontal: 24 }} edges={['top', 'bottom']}>
        <Pressable style={p.backBtn} onPress={onBack}>
          <View style={p.backArrow} />
        </Pressable>

        <View style={p.logoRow}>
          <View style={p.logoRing}><Text style={{ fontSize: 22 }}>🦊</Text></View>
          <Text style={p.brand}>FoxTail Agent</Text>
        </View>

        <Text style={p.title}>{t('auth_otp_title')}</Text>
        <Text style={p.sub}>{t('auth_otp_sub')} +91 {phone}</Text>

        {/* OTP boxes */}
        <Pressable style={o.boxRow} onPress={() => inputRef.current?.focus()}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                o.box,
                otp.length === i && o.boxActive,
                d.trim() && o.boxFilled,
              ]}>
              <Text style={o.boxTxt}>{d.trim()}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={v => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          keyboardType="number-pad"
          maxLength={6}
          style={{ position: 'absolute', opacity: 0 }}
        />

        {error ? <Text style={[p.err, { textAlign: 'center' }]}>{error}</Text> : null}

        <Pressable
          style={[p.btn, (loading || otp.length < 6) && p.btnDisabled, { marginTop: 24 }]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={p.btnTxt}>{t('auth_verify')}</Text>}
        </Pressable>

        <Pressable style={o.resend} onPress={handleResend} disabled={countdown > 0}>
          <Text style={[o.resendTxt, countdown > 0 && o.resendDisabled]}>
            {countdown > 0 ? `${t('auth_resend_in')} ${countdown}s` : t('auth_resend')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const o = StyleSheet.create({
  boxRow:    { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  box:       { width: 48, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: '#e0d8cc', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: PRIMARY, backgroundColor: '#f1faf1' },
  boxFilled: { borderColor: PRIMARY, backgroundColor: '#f1faf1' },
  boxTxt:    { fontSize: 22, fontWeight: '700', color: '#1a1208' },
  resend:    { alignItems: 'center', marginTop: 20 },
  resendTxt: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  resendDisabled: { color: '#a89880' },
});

// ── Orchestrator ───────────────────────────────────────────────────────────────

export function AuthFlow() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [phone,  setPhone]  = useState('');

  if (screen === 'otp')
    return <OtpScreen phone={phone} onBack={() => setScreen('login-phone')} />;
  if (screen === 'login-phone')
    return <PhoneScreen onOtpSent={p => { setPhone(p); setScreen('otp'); }} onBack={() => setScreen('welcome')} />;
  return <WelcomeScreen onLogin={() => setScreen('login-phone')} />;
}
