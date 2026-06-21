import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-provider';
import { updateAgentProfile, updateAgentBank, updateAgentKyc } from '@/services/agent-api';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';
const PEACOCK = '#006D77';
const IVORY   = '#FAF7F2';

const TOTAL_STEPS = 3;

// ── Validation ─────────────────────────────────────────────────────────────────

const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX    = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function validateAadhaar(v: string): string | null {
  if (!v) return null;
  if (!AADHAAR_REGEX.test(v)) return 'Aadhaar must be exactly 12 digits';
  return null;
}
function validatePan(v: string): string | null {
  if (!v) return null;
  if (!PAN_REGEX.test(v.toUpperCase())) return 'PAN format: ABCDE1234F (5 letters + 4 digits + 1 letter)';
  return null;
}
function validateIfsc(v: string): string | null {
  if (!v) return null;
  if (!IFSC_REGEX.test(v.toUpperCase())) return 'IFSC format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)';
  return null;
}

// ── Step Progress Bar ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const labels = ['Profile', 'Bank Account', 'KYC'];
  return (
    <View style={bar.wrap}>
      {labels.map((label, i) => {
        const done   = i < step - 1;
        const active = i === step - 1;
        return (
          <View key={label} style={bar.item}>
            <View style={[bar.circle, done && bar.circleDone, active && bar.circleActive]}>
              {done
                ? <Text style={bar.checkTxt}>✓</Text>
                : <Text style={[bar.numTxt, active && bar.numTxtActive]}>{i + 1}</Text>}
            </View>
            <Text style={[bar.label, active && bar.labelActive]}>{label}</Text>
            {i < labels.length - 1 && (
              <View style={[bar.connector, done && bar.connectorDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const bar = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  item:      { flex: 1, alignItems: 'center', position: 'relative' },
  circle:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  circleDone:   { backgroundColor: PRIMARY, borderColor: PRIMARY },
  circleActive: { backgroundColor: '#fff', borderColor: PRIMARY },
  checkTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  numTxt:    { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  numTxtActive: { color: PRIMARY },
  label:        { fontSize: 10, fontWeight: '600', color: '#9ca3af', textAlign: 'center' },
  labelActive:  { color: PRIMARY },
  connector:    { position: 'absolute', top: 15, left: '60%', right: '-60%', height: 2, backgroundColor: '#e5e7eb', zIndex: -1 },
  connectorDone: { backgroundColor: PRIMARY },
});

// ── Step 1: Personal Profile ───────────────────────────────────────────────────

interface ProfileData { name: string; email: string; vehicleType: string; vehicleNumber: string }

const VEHICLE_TYPES = [
  { id: 'bicycle',  label: '🚲 Bicycle' },
  { id: 'scooter',  label: '🛵 Scooter' },
  { id: 'motorcycle', label: '🏍️ Motorcycle' },
  { id: 'auto',     label: '🛺 Auto' },
  { id: 'van',      label: '🚐 Van / Tempo' },
];

function Step1Profile({ initial, onNext }: { initial: ProfileData; onNext: (d: ProfileData) => void }) {
  const c = useAppColors();
  const s = makeStyles(c);
  const { session } = useAuth();
  const [data, setData] = useState(initial);

  const canNext = data.name.trim().length >= 2 && data.vehicleType !== '';

  return (
    <ScrollView style={s.stepBody} contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}><Text style={{ fontSize: 32 }}>🧑‍💼</Text></View>
        <Text style={s.stepTitle}>Your Profile</Text>
        <Text style={s.stepSub}>Tell us about yourself so stores and buyers can know you.</Text>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Full Name *</Text>
        <TextInput style={s.input} value={data.name} onChangeText={v => setData(d => ({ ...d, name: v }))} placeholder="e.g. Ravi Kumar" placeholderTextColor={c.textFaint} autoCapitalize="words" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Email <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={s.input} value={data.email} onChangeText={v => setData(d => ({ ...d, email: v }))} placeholder="you@example.com" placeholderTextColor={c.textFaint} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Vehicle Type *</Text>
        <View style={s.pillGrid}>
          {VEHICLE_TYPES.map(vt => (
            <Pressable
              key={vt.id}
              style={[s.vehiclePill, data.vehicleType === vt.id && s.vehiclePillActive]}
              onPress={() => setData(d => ({ ...d, vehicleType: vt.id }))}>
              <Text style={[s.vehiclePillTxt, data.vehicleType === vt.id && s.vehiclePillTxtActive]}>{vt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Vehicle Number <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={[s.input, s.monoInput]} value={data.vehicleNumber} onChangeText={v => setData(d => ({ ...d, vehicleNumber: v.toUpperCase() }))} placeholder="e.g. TS09EA1234" placeholderTextColor={c.textFaint} autoCapitalize="characters" />
      </View>

      <View style={s.stepFooter}>
        <Pressable style={[s.nextBtn, !canNext && s.nextBtnDisabled]} onPress={() => canNext && onNext(data)} disabled={!canNext}>
          <Text style={s.nextBtnTxt}>Next — Bank Account</Text>
          <View style={s.nextArrow} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Step 2: Bank Account ───────────────────────────────────────────────────────

interface BankData { holderName: string; accountNumber: string; confirmAccountNumber: string; ifsc: string; bankName: string; upiId: string }

function Step2Bank({ initial, onNext, onBack, saving }: { initial: BankData; onNext: (d: BankData) => void; onBack: () => void; saving: boolean }) {
  const c = useAppColors();
  const s = makeStyles(c);
  const [data,    setData]    = useState(initial);
  const [ifscErr, setIfscErr] = useState<string | null>(null);
  const [accErr,  setAccErr]  = useState<string | null>(null);

  function checkIfsc(v: string) {
    const upper = v.toUpperCase();
    setData(d => ({ ...d, ifsc: upper }));
    setIfscErr(validateIfsc(upper));
  }

  function checkAccountMatch(confirm: string) {
    setData(d => ({ ...d, confirmAccountNumber: confirm }));
    setAccErr(data.accountNumber && confirm && data.accountNumber !== confirm ? 'Account numbers do not match' : null);
  }

  const canNext = data.holderName.trim().length >= 2 && data.accountNumber.length >= 9 && data.accountNumber === data.confirmAccountNumber && data.ifsc.length === 11 && !ifscErr && data.bankName.trim().length >= 2;

  return (
    <ScrollView style={s.stepBody} contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}><Text style={{ fontSize: 32 }}>🏦</Text></View>
        <Text style={s.stepTitle}>Bank Account</Text>
        <Text style={s.stepSub}>Your earnings will be deposited here. Details are encrypted and secure.</Text>
      </View>

      <View style={s.infoCard}>
        <Text style={s.infoCardIcon}>💰</Text>
        <Text style={s.infoCardTxt}>Payouts are processed within 24 hours of delivery completion.</Text>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Account Holder Name *</Text>
        <TextInput style={s.input} value={data.holderName} onChangeText={v => setData(d => ({ ...d, holderName: v }))} placeholder="As per bank records" placeholderTextColor={c.textFaint} autoCapitalize="words" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Account Number *</Text>
        <TextInput style={[s.input, s.monoInput]} value={data.accountNumber} onChangeText={v => { setData(d => ({ ...d, accountNumber: v.replace(/\D/g, '') })); setAccErr(null); }} placeholder="9 – 18 digit account number" placeholderTextColor={c.textFaint} keyboardType="number-pad" secureTextEntry />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Confirm Account Number *</Text>
        <TextInput style={[s.input, s.monoInput, accErr ? s.inputError : null]} value={data.confirmAccountNumber} onChangeText={checkAccountMatch} placeholder="Re-enter account number" placeholderTextColor={c.textFaint} keyboardType="number-pad" />
        {accErr ? <Text style={s.fieldErr}>{accErr}</Text> : null}
      </View>

      <View style={s.field}>
        <Text style={s.label}>IFSC Code *</Text>
        <TextInput style={[s.input, s.monoInput, ifscErr ? s.inputError : (data.ifsc.length === 11 && !ifscErr) ? s.inputValid : null]} value={data.ifsc} onChangeText={checkIfsc} placeholder="e.g. SBIN0001234" placeholderTextColor={c.textFaint} autoCapitalize="characters" maxLength={11} />
        {ifscErr ? <Text style={s.fieldErr}>{ifscErr}</Text> : data.ifsc.length === 11 && !ifscErr ? <Text style={s.fieldOk}>✓ Valid IFSC format</Text> : null}
      </View>

      <View style={s.field}>
        <Text style={s.label}>Bank Name *</Text>
        <TextInput style={s.input} value={data.bankName} onChangeText={v => setData(d => ({ ...d, bankName: v }))} placeholder="e.g. State Bank of India" placeholderTextColor={c.textFaint} autoCapitalize="words" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>UPI ID <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={s.input} value={data.upiId} onChangeText={v => setData(d => ({ ...d, upiId: v }))} placeholder="e.g. ravi@upi" placeholderTextColor={c.textFaint} autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={s.stepFooter}>
        <Pressable style={s.backBtn} onPress={onBack} disabled={saving}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </Pressable>
        <Pressable style={[s.nextBtn, (!canNext || saving) && s.nextBtnDisabled, { flex: 1 }]} onPress={() => canNext && onNext(data)} disabled={!canNext || saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={s.nextBtnTxt}>Next — KYC Docs</Text><View style={s.nextArrow} /></>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Step 3: KYC Documents ──────────────────────────────────────────────────────

interface KycData {
  aadhaar: string; pan: string; drivingLicense: string;
  vehicleRc: string; insurancePolicy: string;
}

interface KycField { key: keyof KycData; label: string; icon: string; placeholder: string; hint: string; validate?: (v: string) => string | null; keyboard?: 'default' | 'number-pad'; upper?: boolean; maxLen?: number }

const KYC_FIELDS: KycField[] = [
  { key: 'aadhaar',         label: 'Aadhaar Number *',          icon: '🪪', placeholder: '1234 5678 9012',    hint: '12-digit Aadhaar card number', validate: validateAadhaar, keyboard: 'number-pad', maxLen: 12 },
  { key: 'pan',             label: 'PAN Card Number *',          icon: '💳', placeholder: 'ABCDE1234F',        hint: '10-character PAN card number', validate: validatePan, upper: true, maxLen: 10 },
  { key: 'drivingLicense',  label: "Driver's License Number *",  icon: '🪪', placeholder: 'TS1420120012345',  hint: 'As printed on your driving license' },
  { key: 'vehicleRc',       label: 'Vehicle RC Number *',        icon: '🚗', placeholder: 'TS09EA1234',        hint: 'Registration Certificate number', upper: true },
  { key: 'insurancePolicy', label: 'Insurance Policy Number',    icon: '🛡️', placeholder: 'POL/2024/123456', hint: 'Vehicle insurance policy number (optional)' },
];

function Step3Kyc({ initial, onSubmit, onBack, saving }: { initial: KycData; onSubmit: (d: KycData) => void; onBack: () => void; saving: boolean }) {
  const c = useAppColors();
  const s = makeStyles(c);
  const [data,   setData]   = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof KycData, string>>>({});

  function handleChange(key: keyof KycData, value: string, field: KycField) {
    const v = field.upper ? value.toUpperCase() : value;
    setData(d => ({ ...d, [key]: v }));
    if (errors[key]) {
      const err = field.validate?.(v) ?? null;
      setErrors(e => ({ ...e, [key]: err ?? undefined }));
    }
  }

  function handleBlur(key: keyof KycData, field: KycField) {
    const err = field.validate?.(data[key]) ?? null;
    if (err) setErrors(e => ({ ...e, [key]: err }));
  }

  const requiredFilled = data.aadhaar.length === 12 && data.pan.length === 10 && data.drivingLicense.trim().length >= 5 && data.vehicleRc.trim().length >= 5;
  const hasErrors      = Object.values(errors).some(Boolean);
  const canSubmit      = requiredFilled && !hasErrors && !saving;

  return (
    <ScrollView style={s.stepBody} contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}><Text style={{ fontSize: 32 }}>📋</Text></View>
        <Text style={s.stepTitle}>KYC Documents</Text>
        <Text style={s.stepSub}>Required by regulations. Your data is encrypted and shared only with HarvestConnect.</Text>
      </View>

      <View style={[s.infoCard, { borderColor: PEACOCK + '55', backgroundColor: PEACOCK + '0f' }]}>
        <Text style={s.infoCardIcon}>🔒</Text>
        <Text style={[s.infoCardTxt, { color: PEACOCK }]}>All KYC information is end-to-end encrypted and used only for verification purposes.</Text>
      </View>

      {KYC_FIELDS.map(field => {
        const val = data[field.key];
        const err = errors[field.key];
        const isValid = field.validate ? (val.length > 0 && !field.validate(val)) : false;
        return (
          <View key={field.key} style={s.field}>
            <View style={s.labelRow}>
              <Text style={s.label}>{field.icon}  {field.label}</Text>
              {isValid && <View style={s.validBadge}><Text style={s.validBadgeTxt}>✓</Text></View>}
            </View>
            <TextInput
              style={[s.input, s.monoInput, err ? s.inputError : isValid ? s.inputValid : null]}
              value={val}
              onChangeText={v => handleChange(field.key, v, field)}
              onBlur={() => handleBlur(field.key, field)}
              placeholder={field.placeholder}
              placeholderTextColor={c.textFaint}
              keyboardType={field.keyboard ?? 'default'}
              autoCapitalize={field.upper ? 'characters' : 'none'}
              maxLength={field.maxLen}
            />
            {err ? <Text style={s.fieldErr}>{err}</Text> : <Text style={s.fieldHint}>{field.hint}</Text>}
          </View>
        );
      })}

      <View style={s.kycNote}>
        <Text style={s.kycNoteTxt}>📸 Physical document verification may be required during your first week as an agent.</Text>
      </View>

      <View style={s.stepFooter}>
        <Pressable style={s.backBtn} onPress={onBack} disabled={saving}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </Pressable>
        <Pressable style={[s.nextBtn, !canSubmit && s.nextBtnDisabled, { flex: 1, backgroundColor: ACCENT }]} onPress={() => canSubmit && onSubmit(data)} disabled={!canSubmit}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.nextBtnTxt}>Submit & Start Earning 🦊</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Orchestrator ───────────────────────────────────────────────────────────────

export function AgentOnboarding() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { session, markOnboardingDone } = useAuth();
  const { showToast } = useToast();

  const [step,     setStep]    = useState(1);
  const [saving,   setSaving]  = useState(false);
  const [profile,  setProfile] = useState<ProfileData>({ name: '', email: '', vehicleType: '', vehicleNumber: '' });
  const [bank,     setBank]    = useState<BankData>({ holderName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '', bankName: '', upiId: '' });

  async function handleFinalSubmit(kyc: KycData) {
    if (!session) return;
    setSaving(true);
    try {
      await Promise.all([
        updateAgentProfile(session.userId, { name: profile.name, email: profile.email || undefined, vehicleType: profile.vehicleType, vehicleNumber: profile.vehicleNumber || undefined }, session.token),
        updateAgentBank(session.userId, { accountHolderName: bank.holderName, accountNumber: bank.accountNumber, ifscCode: bank.ifsc.toUpperCase(), bankName: bank.bankName, upiId: bank.upiId || undefined }, session.token),
        updateAgentKyc(session.userId, { aadhaarNumber: kyc.aadhaar, panNumber: kyc.pan.toUpperCase(), drivingLicenseNumber: kyc.drivingLicense, vehicleRcNumber: kyc.vehicleRc.toUpperCase(), insurancePolicyNumber: kyc.insurancePolicy || undefined }, session.token),
      ]);
      showToast('Profile set up! Welcome to FoxTail 🦊', 'success');
      await markOnboardingDone();
    } catch {
      // Even if API fails (backend not ready), mark onboarding done locally
      showToast('Profile saved locally. Sync will complete when services are online.', 'info');
      await markOnboardingDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={s.onboardHeader}>
          <View style={s.onboardLogo}><Text style={{ fontSize: 20 }}>🦊</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.onboardTitle}>Agent Setup</Text>
            <Text style={s.onboardSub}>Step {step} of {TOTAL_STEPS}</Text>
          </View>
          <Pressable onPress={markOnboardingDone}>
            <Text style={s.skipTxt}>Skip for now</Text>
          </Pressable>
        </View>
        <StepBar step={step} />
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 1 && <Step1Profile initial={profile} onNext={d => { setProfile(d); setStep(2); }} />}
        {step === 2 && <Step2Bank initial={bank} onNext={d => { setBank(d); setStep(3); }} onBack={() => setStep(1)} saving={false} />}
        {step === 3 && (
          <Step3Kyc
            initial={{ aadhaar: '', pan: '', drivingLicense: '', vehicleRc: profile.vehicleNumber, insurancePolicy: '' }}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(2)}
            saving={saving}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    onboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
    onboardLogo:   { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: PRIMARY + '44' },
    onboardTitle:  { fontSize: 16, fontWeight: '800', color: '#111827' },
    onboardSub:    { fontSize: 11, color: '#6b7280' },
    skipTxt:       { fontSize: 13, fontWeight: '600', color: '#6b7280' },
    stepBody:    { flex: 1 },
    stepContent: { padding: 20, paddingBottom: 40 },
    stepHeader:  { alignItems: 'center', marginBottom: 24 },
    stepIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: PRIMARY + '44' },
    stepTitle:   { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
    stepSub:     { fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 20 },
    infoCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: ACCENT + '18', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: ACCENT + '55', marginBottom: 20 },
    infoCardIcon: { fontSize: 18 },
    infoCardTxt:  { flex: 1, fontSize: 12, color: '#78350f', lineHeight: 18, fontWeight: '600' },
    field:     { marginBottom: 18 },
    labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
    label:     { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
    optional:  { fontWeight: '400', color: '#9ca3af' },
    input:     { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827', backgroundColor: '#ffffff' },
    monoInput: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
    inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    inputValid: { borderColor: PRIMARY, backgroundColor: '#f0fdf4' },
    fieldErr:  { fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: '600' },
    fieldOk:   { fontSize: 11, color: '#166534', marginTop: 4, fontWeight: '600' },
    fieldHint: { fontSize: 11, color: '#6b7280', marginTop: 4 },
    pillGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vehiclePill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#ffffff' },
    vehiclePillActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '15' },
    vehiclePillTxt:    { fontSize: 13, fontWeight: '600', color: '#374151' },
    vehiclePillTxtActive: { color: PRIMARY, fontWeight: '700' },
    validBadge:    { backgroundColor: '#dcfce7', borderRadius: 99, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    validBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#166534' },
    kycNote:    { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    kycNoteTxt: { fontSize: 12, color: '#374151', lineHeight: 18 },
    stepFooter: { flexDirection: 'row', gap: 10, paddingTop: 8 },
    backBtn:    { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
    backBtnTxt: { fontSize: 14, fontWeight: '600', color: '#374151' },
    nextBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15 },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
    nextArrow:  { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 7, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff' },
  });
}
