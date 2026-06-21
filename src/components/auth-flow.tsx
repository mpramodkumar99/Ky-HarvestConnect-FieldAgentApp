import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizePhone, requestOtp, verifyOtp, type AuthSession } from '@/services/auth-api';
import { createAgent } from '@/services/agent-api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-provider';
import { useLanguage } from '@/context/language-context';

type Screen = 'welcome' | 'signup' | 'login-phone' | 'otp';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';
const IVORY   = '#FAF7F2';

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return msg.includes('network request failed') || msg.includes('fetch') || msg.includes('failed to fetch');
}

const DEV_SESSION: AuthSession = {
  token:     'dev-token-agent001',
  userId:    'agent-001',
  userType:  'agent',
  sessionId: 'dev-session-agent001',
  expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
};

// ── Welcome ────────────────────────────────────────────────────────────────────

function WelcomeScreen({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const { login }     = useAuth();
  const { showToast } = useToast();

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
          <Text style={w.brand}>FoxTail</Text>
          <View style={w.agentPill}>
            <Text style={w.agentPillTxt}>Field Agent</Text>
          </View>
        </View>

        <View style={w.hero}>
          <Text style={w.title}>Deliver fresh.{'\n'}Earn daily.</Text>
          <Text style={w.sub}>
            Join FoxTail's field agent network — deliver local produce, onboard stores, and earn competitive payouts.
          </Text>
        </View>

        <View style={w.features}>
          {[
            { icon: '🛵', text: 'Manage deliveries with real-time GPS routing' },
            { icon: '💰', text: 'Daily payouts directly to your bank account' },
            { icon: '🏪', text: 'Earn by onboarding local stores on the platform' },
          ].map(f => (
            <View key={f.text} style={w.featureRow}>
              <Text style={w.featureIcon}>{f.icon}</Text>
              <Text style={w.featureTxt}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={w.dotRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[w.dot, { backgroundColor: i % 3 === 0 ? ACCENT : i % 3 === 1 ? 'rgba(255,255,255,0.4)' : EARTH }]} />
          ))}
        </View>

        <View style={w.footer}>
          <Pressable style={w.signupBtn} onPress={onSignup}>
            <Text style={w.signupTxt}>Become an Agent</Text>
            <View style={w.arrow} />
          </Pressable>
          <Pressable style={w.loginBtn} onPress={onLogin}>
            <Text style={w.loginTxt}>Already an agent? Log In</Text>
          </Pressable>
          {__DEV__ && (
            <Pressable style={w.devBtn} onPress={devLogin}>
              <Text style={w.devBtnTxt}>⚡ Dev Login (skip AuthSvc)</Text>
            </Pressable>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

const w = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PRIMARY },
  safe:   { flex: 1, paddingHorizontal: 28 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 24, paddingBottom: 36 },
  logoRing: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: ACCENT,
  },
  logoIcon:     { fontSize: 22 },
  brand:        { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
  agentPill:    { backgroundColor: ACCENT, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  agentPillTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  hero:  { marginBottom: 36 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 44, marginBottom: 14 },
  sub:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  features:    { gap: 14, flex: 1 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  featureTxt:  { fontSize: 14, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 20 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 24 },
  dot:    { width: 8, height: 8, borderRadius: 4 },
  footer: { paddingBottom: 12, gap: 10 },
  signupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 17,
  },
  signupTxt: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  arrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8,
    borderStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: PRIMARY,
  },
  loginBtn: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
  },
  loginTxt: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  devBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderStyle: 'dashed',
  },
  devBtnTxt: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
});

// ── Signup ─────────────────────────────────────────────────────────────────────

function SignupScreen({
  onOtpSent, onSwitchToLogin, onBack,
}: {
  onOtpSent: (phone: string) => void;
  onSwitchToLogin: (phone: string) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [swLoading, setSwLoading] = useState(false);
  const [error,    setError]    = useState('');
  const [offline,  setOffline]  = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const digits    = phone.replace(/\D/g, '');
  const canSubmit = name.trim().length >= 2 && digits.length === 10 && !loading && !swLoading;

  async function handleSwitchToLogin() {
    setSwLoading(true);
    try { await requestOtp(normalizePhone(phone)); } catch {}
    setSwLoading(false);
    onSwitchToLogin(normalizePhone(phone));
  }

  async function handleSignup() {
    if (!canSubmit) return;
    setLoading(true); setError(''); setOffline(false); setDuplicate(false);
    const normalized = normalizePhone(phone);
    try {
      await createAgent({ name: name.trim(), phone: normalized, email: email.trim() || undefined });
      await requestOtp(normalized);
      onOtpSent(normalized);
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        setError('Cannot reach services. Check that UserSvc (3002) and AuthSvc (3001) are running.');
      } else if (err instanceof Error && err.message.toLowerCase().includes('already')) {
        setDuplicate(true);
        setError('This phone number is already registered as an agent.');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={sg.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={sg.screen}>
        <SafeAreaView style={sg.safe} edges={['top', 'bottom']}>
          <Pressable style={sg.back} onPress={onBack}>
            <View style={sg.backChevron} /><Text style={sg.backTxt}>Back</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={sg.header}>
              <View style={sg.iconWrap}><Text style={{ fontSize: 36 }}>🦊</Text></View>
              <Text style={sg.title}>Join as a{'\n'}Field Agent</Text>
              <Text style={sg.sub}>Free to register. Start earning deliveries today.</Text>
            </View>

            <View style={sg.field}>
              <Text style={sg.label}>Full Name *</Text>
              <TextInput
                style={sg.input}
                value={name}
                onChangeText={v => { setName(v); setError(''); }}
                placeholder="e.g. Ravi Kumar"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View style={sg.field}>
              <Text style={sg.label}>Phone Number *</Text>
              <View style={sg.phoneWrap}>
                <View style={sg.prefix}>
                  <Text style={sg.flag}>🇮🇳</Text>
                  <Text style={sg.prefixTxt}>+91</Text>
                </View>
                <TextInput
                  style={sg.phoneInput}
                  value={phone}
                  onChangeText={v => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setError(''); setDuplicate(false); }}
                  placeholder="00000 00000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={sg.field}>
              <Text style={sg.label}>Email <Text style={sg.optional}>(optional)</Text></Text>
              <TextInput
                style={sg.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={[sg.errorBox, offline && sg.offlineBox]}>
                <Text style={[sg.errorTxt, offline && sg.offlineTxt]}>{error}</Text>
                {duplicate && (
                  <Pressable style={sg.switchBtn} onPress={handleSwitchToLogin} disabled={swLoading}>
                    <Text style={sg.switchBtnTxt}>{swLoading ? 'Sending OTP…' : 'Log in with this number'}</Text>
                    {!swLoading && <View style={sg.switchArrow} />}
                  </Pressable>
                )}
              </View>
            ) : null}

            <View style={sg.terms}>
              <Text style={sg.termsTxt}>
                By creating an account you agree to FoxTail's{' '}
                <Text style={sg.termsLink}>Terms of Service</Text> and{' '}
                <Text style={sg.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={sg.footer}>
            <Pressable style={[sg.submitBtn, !canSubmit && sg.submitBtnDisabled]} onPress={handleSignup} disabled={!canSubmit}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={sg.submitTxt}>Create Account & Send OTP</Text>}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const sg = StyleSheet.create({
  flex:   { flex: 1 },
  screen: { flex: 1, backgroundColor: IVORY },
  safe:   { flex: 1, paddingHorizontal: 24 },
  back:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 4 },
  backChevron: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 8, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: PRIMARY },
  backTxt: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  header:   { paddingTop: 8, paddingBottom: 28 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: PRIMARY + '44' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', lineHeight: 36, marginBottom: 8 },
  sub:   { fontSize: 14, color: '#6b7280' },
  field:     { marginBottom: 18 },
  label:     { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 7 },
  optional:  { fontWeight: '400', color: '#9ca3af' },
  input:     { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  phoneWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#fff', overflow: 'hidden' },
  prefix:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  flag:       { fontSize: 18 },
  prefixTxt:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#111827', letterSpacing: 1.5 },
  errorBox:   { backgroundColor: '#fff5f5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 16 },
  offlineBox: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  errorTxt:   { fontSize: 12, color: '#dc2626', lineHeight: 17 },
  offlineTxt: { color: '#92400e' },
  switchBtn:    { marginTop: 10, paddingVertical: 8, backgroundColor: PRIMARY, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  switchBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  switchArrow:  { width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff' },
  terms:     { marginBottom: 4 },
  termsTxt:  { fontSize: 11, color: '#9ca3af', lineHeight: 16 },
  termsLink: { color: PRIMARY, fontWeight: '600' },
  footer:           { paddingBottom: 16, paddingTop: 8 },
  submitBtn:        { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  submitBtnDisabled:{ opacity: 0.4 },
  submitTxt:        { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ── Login Phone ────────────────────────────────────────────────────────────────

function LoginPhoneScreen({
  onOtpSent, onSwitchToSignup, onBack,
}: {
  onOtpSent: (phone: string) => void;
  onSwitchToSignup: (phone: string) => void;
  onBack: () => void;
}) {
  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [offline,  setOffline]  = useState(false);
  const [notFound, setNotFound] = useState(false);

  const digits    = phone.replace(/\D/g, '');
  const canSubmit = digits.length === 10 && !loading;

  async function handleSend() {
    if (!canSubmit) return;
    setLoading(true); setError(''); setOffline(false); setNotFound(false);
    try {
      await requestOtp(normalizePhone(phone));
      onOtpSent(normalizePhone(phone));
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        setError('Cannot reach AuthSvc. Make sure it\'s running on port 3001.');
      } else if (err instanceof Error && (err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('not registered'))) {
        setNotFound(true);
        setError('No agent account found for this number.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={lp.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={lp.screen}>
        <SafeAreaView style={lp.safe} edges={['top', 'bottom']}>
          <Pressable style={lp.back} onPress={onBack}>
            <View style={lp.backChevron} /><Text style={lp.backTxt}>Back</Text>
          </Pressable>

          <View style={lp.body}>
            <View style={lp.iconWrap}><Text style={{ fontSize: 36 }}>📱</Text></View>
            <Text style={lp.title}>Welcome{'\n'}back!</Text>
            <Text style={lp.sub}>Enter your registered phone number to receive an OTP.</Text>

            <View style={lp.inputWrap}>
              <View style={lp.prefix}>
                <Text style={lp.flag}>🇮🇳</Text>
                <Text style={lp.prefixTxt}>+91</Text>
              </View>
              <TextInput
                style={lp.input}
                value={phone}
                onChangeText={v => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                placeholder="00000 00000"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>

            {error ? (
              <View style={[lp.errorBox, offline && lp.offlineBox]}>
                <Text style={[lp.errorTxt, offline && lp.offlineTxt]}>{error}</Text>
                {offline && __DEV__ && <Text style={lp.offlineHint}>Go back and use ⚡ Dev Login.</Text>}
                {notFound && (
                  <Pressable style={lp.switchBtn} onPress={() => onSwitchToSignup(normalizePhone(phone))}>
                    <Text style={lp.switchBtnTxt}>Register as an Agent</Text>
                    <View style={lp.switchArrow} />
                  </Pressable>
                )}
              </View>
            ) : null}

            {__DEV__ && <Text style={lp.hint}>Dev: OTP is always 123456</Text>}
          </View>

          <View style={lp.footer}>
            <Pressable style={[lp.sendBtn, !canSubmit && lp.sendBtnDisabled]} onPress={handleSend} disabled={!canSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={lp.sendTxt}>Send OTP</Text>}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const lp = StyleSheet.create({
  flex:   { flex: 1 },
  screen: { flex: 1, backgroundColor: IVORY },
  safe:   { flex: 1, paddingHorizontal: 24 },
  back:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  backChevron: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 8, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: PRIMARY },
  backTxt: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  body:     { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: PRIMARY + '44' },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', lineHeight: 38, marginBottom: 10 },
  sub:   { fontSize: 14, color: '#6b7280', lineHeight: 21, marginBottom: 28 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: PRIMARY, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden', marginBottom: 12 },
  prefix: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  flag:      { fontSize: 18 },
  prefixTxt: { fontSize: 15, fontWeight: '700', color: '#111827' },
  input:     { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontSize: 20, fontWeight: '600', color: '#111827', letterSpacing: 2 },
  errorBox:    { backgroundColor: '#fff5f5', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 12 },
  offlineBox:  { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  errorTxt:    { fontSize: 12, color: '#dc2626', lineHeight: 17 },
  offlineTxt:  { color: '#92400e' },
  offlineHint: { fontSize: 11, color: '#b45309', marginTop: 6 },
  switchBtn:    { marginTop: 10, paddingVertical: 8, backgroundColor: PRIMARY, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  switchBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  switchArrow:  { width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff' },
  hint: { fontSize: 11, color: '#9ca3af' },
  footer:          { paddingBottom: 12 },
  sendBtn:         { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.45 },
  sendTxt:         { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ── OTP ────────────────────────────────────────────────────────────────────────

function OtpScreen({ phone, onBack }: { phone: string; onBack: () => void }) {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const [code,      setCode]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; }), 1000);
    return () => clearInterval(id);
  }, []);

  async function handleVerify(finalCode: string) {
    if (finalCode.length !== 6 || loading) return;
    setLoading(true); setError('');
    try {
      const session = await verifyOtp(phone, finalCode);
      await login(session);
      showToast('Welcome to FoxTail! 🦊', 'success');
    } catch (err) {
      setError(isNetworkError(err)
        ? 'Cannot reach AuthSvc (port 3001). Go back and use ⚡ Dev Login.'
        : (err instanceof Error ? err.message : 'Invalid OTP. Try again.'));
      setCode(''); inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true); setError('');
    try {
      await requestOtp(phone);
      setCountdown(30); setCode('');
      showToast('New OTP sent!', 'success');
    } catch (err) {
      setError(isNetworkError(err) ? 'Cannot reach AuthSvc.' : (err instanceof Error ? err.message : 'Failed to resend.'));
    } finally {
      setResending(false);
    }
  }

  function handleCodeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits); setError('');
    if (digits.length === 6) handleVerify(digits);
  }

  return (
    <KeyboardAvoidingView style={ot.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={ot.screen}>
        <SafeAreaView style={ot.safe} edges={['top', 'bottom']}>
          <Pressable style={ot.back} onPress={onBack}>
            <View style={ot.backChevron} /><Text style={ot.backTxt}>Back</Text>
          </Pressable>
          <View style={ot.body}>
            <View style={ot.iconWrap}><Text style={{ fontSize: 36 }}>🔐</Text></View>
            <Text style={ot.title}>Verify your{'\n'}number</Text>
            <Text style={ot.sub}>Enter the 6-digit OTP sent to{'\n'}<Text style={ot.phone}>+91 {phone}</Text></Text>

            <TextInput ref={inputRef} value={code} onChangeText={handleCodeChange} keyboardType="number-pad" maxLength={6} autoFocus textContentType="oneTimeCode" style={ot.hiddenInput} caretHidden />
            <Pressable style={ot.boxRow} onPress={() => inputRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => {
                const filled = i < code.length;
                const active = i === code.length && !loading;
                return (
                  <View key={i} style={[ot.box, filled && ot.boxFilled, active && ot.boxActive, loading && ot.boxLoading]}>
                    {loading && i === 0
                      ? <ActivityIndicator size="small" color={PRIMARY} />
                      : <Text style={[ot.boxTxt, filled && ot.boxTxtFilled]}>{code[i] ?? ''}</Text>}
                  </View>
                );
              })}
            </Pressable>

            {error ? <View style={ot.errorBox}><Text style={ot.errorTxt}>{error}</Text></View> : null}
            {__DEV__ && <View style={ot.devHint}><Text style={ot.devHintTxt}>Dev: OTP is always <Text style={{ fontWeight: '800' }}>123456</Text></Text></View>}

            <View style={ot.resendRow}>
              {countdown > 0
                ? <Text style={ot.resendCountdown}>Resend OTP in {countdown}s</Text>
                : <Pressable onPress={handleResend} disabled={resending}>
                    <Text style={[ot.resendBtn, resending && { opacity: 0.5 }]}>{resending ? 'Sending…' : 'Resend OTP'}</Text>
                  </Pressable>}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const ot = StyleSheet.create({
  flex:   { flex: 1 },
  screen: { flex: 1, backgroundColor: IVORY },
  safe:   { flex: 1, paddingHorizontal: 24 },
  back:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  backChevron: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 8, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: PRIMARY },
  backTxt: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  body:     { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: PRIMARY + '44' },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', lineHeight: 38, marginBottom: 10 },
  sub:   { fontSize: 14, color: '#6b7280', lineHeight: 22, marginBottom: 32 },
  phone: { fontWeight: '700', color: '#111827' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  boxRow:    { flexDirection: 'row', gap: 10, marginBottom: 16, justifyContent: 'center' },
  box:       { width: 48, height: 58, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  boxFilled:    { borderColor: PRIMARY, backgroundColor: PRIMARY + '18' },
  boxActive:    { borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  boxLoading:   { borderColor: '#e5e7eb' },
  boxTxt:       { fontSize: 22, fontWeight: '700', color: '#9ca3af' },
  boxTxtFilled: { color: '#1a1208' },
  errorBox:   { backgroundColor: '#fff5f5', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 12 },
  errorTxt:   { fontSize: 12, color: '#dc2626', lineHeight: 17 },
  devHint:    { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fde68a', marginBottom: 12, alignItems: 'center' },
  devHintTxt: { fontSize: 12, color: '#92400e' },
  resendRow:       { alignItems: 'center', marginTop: 8 },
  resendCountdown: { fontSize: 13, color: '#9ca3af' },
  resendBtn:       { fontSize: 14, fontWeight: '700', color: PRIMARY },
});

// ── Orchestrator ───────────────────────────────────────────────────────────────

export function AuthFlow() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [phone,  setPhone]  = useState('');

  if (screen === 'welcome') return <WelcomeScreen onSignup={() => setScreen('signup')} onLogin={() => setScreen('login-phone')} />;
  if (screen === 'signup')
    return (
      <SignupScreen
        onOtpSent={ph => { setPhone(ph); setScreen('otp'); }}
        onSwitchToLogin={ph => { setPhone(ph); setScreen('otp'); }}
        onBack={() => setScreen('welcome')}
      />
    );
  if (screen === 'login-phone')
    return (
      <LoginPhoneScreen
        onOtpSent={ph => { setPhone(ph); setScreen('otp'); }}
        onSwitchToSignup={ph => { setPhone(ph); setScreen('signup'); }}
        onBack={() => setScreen('welcome')}
      />
    );
  return <OtpScreen phone={phone} onBack={() => setScreen('login-phone')} />;
}
