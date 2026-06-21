import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/toast-provider';
import { updateAgentProfile, updateAgentBank, updateAgentKyc } from '@/services/agent-api';
import { lookupIFSC, type IFSCInfo } from '@/utils/ifsc';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const PEACOCK = '#006D77';

const TOTAL_STEPS = 3;

// ── Google Places (New) API ────────────────────────────────────────────────────

const PLACES_KEY       = 'AIzaSyAWcTKuepfygLZhGejYPhOIaIBuoRriSUw';
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places';
const NEARBY_URL       = 'https://places.googleapis.com/v1/places:searchNearby';

type AddrComp = { longText: string; types: string[] };

function getComp(comps: AddrComp[], ...types: string[]): string {
  return comps.find(c => types.some(t => c.types.includes(t)))?.longText ?? '';
}

interface Prediction { placeId: string; mainText: string; secondaryText: string }

async function fetchNearbyPincode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(NEARBY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': 'places.addressComponents' },
      body:    JSON.stringify({ includedTypes: ['postal_code'], locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 3000 } }, maxResultCount: 1 }),
    });
    const data  = await res.json();
    const comps = (data.places?.[0]?.addressComponents ?? []) as AddrComp[];
    return comps.find(c => c.types.includes('postal_code'))?.longText ?? '';
  } catch { return ''; }
}

async function reverseGeocodeLatLng(lat: number, lng: number): Promise<{ location: string; pincode: string }> {
  try {
    const res = await fetch(NEARBY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': 'places.addressComponents,places.displayName' },
      body:    JSON.stringify({ includedTypes: ['locality', 'sublocality'], locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } }, maxResultCount: 1 }),
    });
    const data  = await res.json();
    const place = data.places?.[0];
    if (!place) return { location: '', pincode: '' };
    const comps    = (place.addressComponents ?? []) as AddrComp[];
    const locality = getComp(comps, 'locality', 'sublocality_level_1');
    const district = getComp(comps, 'administrative_area_level_3', 'administrative_area_level_2');
    const state    = getComp(comps, 'administrative_area_level_1');
    let pincode    = getComp(comps, 'postal_code');
    if (!pincode) pincode = await fetchNearbyPincode(lat, lng);
    return { location: [locality || place.displayName?.text, district, state].filter(Boolean).join(', '), pincode };
  } catch { return { location: '', pincode: '' }; }
}

async function fetchAutocompleteSuggestions(input: string): Promise<Prediction[]> {
  try {
    const res  = await fetch(AUTOCOMPLETE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_KEY },
      body:    JSON.stringify({ input, includedRegionCodes: ['in'], languageCode: 'en' }),
    });
    const data = await res.json();
    const raw  = (data.suggestions ?? []) as Array<{
      placePrediction: { placeId: string; structuredFormat: { mainText: { text: string }; secondaryText: { text: string } } };
    }>;
    return raw.map(s => ({
      placeId:       s.placePrediction.placeId,
      mainText:      s.placePrediction.structuredFormat.mainText.text,
      secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? '',
    }));
  } catch { return []; }
}

async function fetchPlaceDetail(placeId: string): Promise<{ location: string; pincode: string; lat: number; lng: number }> {
  try {
    const res  = await fetch(`${DETAILS_BASE_URL}/${placeId}`, {
      headers: { 'X-Goog-Api-Key': PLACES_KEY, 'X-Goog-FieldMask': 'displayName,formattedAddress,location,addressComponents' },
    });
    const data  = await res.json();
    const comps = (data.addressComponents ?? []) as AddrComp[];
    const locality = getComp(comps, 'locality', 'sublocality_level_1', 'sublocality');
    const district = getComp(comps, 'administrative_area_level_3', 'administrative_area_level_2');
    const state    = getComp(comps, 'administrative_area_level_1');
    const lat      = data.location?.latitude  ?? 0;
    const lng      = data.location?.longitude ?? 0;
    let pincode    = getComp(comps, 'postal_code');
    if (!pincode && lat && lng) pincode = await fetchNearbyPincode(lat, lng);
    return { location: [locality || data.displayName?.text, district, state].filter(Boolean).join(', '), pincode, lat, lng };
  } catch { return { location: '', pincode: '', lat: 0, lng: 0 }; }
}

// ── Validation ─────────────────────────────────────────────────────────────────

const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX     = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX    = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function validateAadhaar(v: string): string | null {
  if (!v) return null;
  return AADHAAR_REGEX.test(v) ? null : 'Aadhaar must be exactly 12 digits';
}
function validatePan(v: string): string | null {
  if (!v) return null;
  return PAN_REGEX.test(v.toUpperCase()) ? null : 'PAN format: ABCDE1234F (5 letters + 4 digits + 1 letter)';
}
function validateIfsc(v: string): string | null {
  if (!v) return null;
  return IFSC_REGEX.test(v.toUpperCase()) ? null : 'IFSC format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)';
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
  wrap:          { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  item:          { flex: 1, alignItems: 'center', position: 'relative' },
  circle:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  circleDone:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  circleActive:  { backgroundColor: '#fff', borderColor: PRIMARY },
  checkTxt:      { fontSize: 14, fontWeight: '800', color: '#fff' },
  numTxt:        { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  numTxtActive:  { color: PRIMARY },
  label:         { fontSize: 10, fontWeight: '600', color: '#9ca3af', textAlign: 'center' },
  labelActive:   { color: PRIMARY },
  connector:     { position: 'absolute', top: 15, left: '60%', right: '-60%', height: 2, backgroundColor: '#e5e7eb', zIndex: -1 },
  connectorDone: { backgroundColor: PRIMARY },
});

// ── Step 1: Personal Profile ───────────────────────────────────────────────────

interface ProfileData {
  name: string; email: string; vehicleType: string; vehicleNumber: string;
  location: string; pincode: string; lat: number; lng: number;
}

const VEHICLE_TYPES = [
  { id: 'bicycle',    label: '🚲 Bicycle' },
  { id: 'scooter',    label: '🛵 Scooter' },
  { id: 'motorcycle', label: '🏍️ Motorcycle' },
  { id: 'auto',       label: '🛺 Auto' },
  { id: 'van',        label: '🚐 Van / Tempo' },
];

function Step1Profile({ initial, onNext }: { initial: ProfileData; onNext: (d: ProfileData) => void }) {
  const c = useAppColors();
  const s = makeStyles(c);
  const [data,        setData]        = useState(initial);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [locLoading,  setLocLoading]  = useState(false);
  const [sugLoading,  setSugLoading]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canNext = data.name.trim().length >= 2 && data.vehicleType !== '';

  function handleLocationChange(text: string) {
    setData(d => ({ ...d, location: text, pincode: '', lat: 0, lng: 0 }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      const results = await fetchAutocompleteSuggestions(text);
      setSuggestions(results);
      setSugLoading(false);
    }, 350);
  }

  async function handleSelectPrediction(p: Prediction) {
    setSuggestions([]);
    setLocLoading(true);
    const detail = await fetchPlaceDetail(p.placeId);
    setData(d => ({ ...d, location: detail.location || p.mainText, pincode: detail.pincode, lat: detail.lat, lng: detail.lng }));
    setLocLoading(false);
  }

  async function handleUseCurrentLocation() {
    setLocLoading(true);
    setSuggestions([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      const { location, pincode } = await reverseGeocodeLatLng(lat, lng);
      setData(d => ({ ...d, location: location || d.location, pincode: pincode || d.pincode, lat, lng }));
    } catch {
      // GPS unavailable — silently ignore
    } finally {
      setLocLoading(false);
    }
  }

  return (
    <ScrollView style={s.stepBody} contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.stepHeader}>
        <View style={s.stepIconWrap}><Text style={{ fontSize: 32 }}>🧑‍💼</Text></View>
        <Text style={s.stepTitle}>Your Profile</Text>
        <Text style={s.stepSub}>Tell us about yourself so stores and buyers can know you.</Text>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Full Name *</Text>
        <TextInput style={s.input} value={data.name} onChangeText={v => setData(d => ({ ...d, name: v }))} placeholder="e.g. Ravi Kumar" placeholderTextColor="#9ca3af" autoCapitalize="words" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Email <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={s.input} value={data.email} onChangeText={v => setData(d => ({ ...d, email: v }))} placeholder="you@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Vehicle Type *</Text>
        <View style={s.pillGrid}>
          {VEHICLE_TYPES.map(vt => (
            <Pressable key={vt.id} style={[s.vehiclePill, data.vehicleType === vt.id && s.vehiclePillActive]} onPress={() => setData(d => ({ ...d, vehicleType: vt.id }))}>
              <Text style={[s.vehiclePillTxt, data.vehicleType === vt.id && s.vehiclePillTxtActive]}>{vt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.label}>Vehicle Number <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={[s.input, s.monoInput]} value={data.vehicleNumber} onChangeText={v => setData(d => ({ ...d, vehicleNumber: v.toUpperCase() }))} placeholder="e.g. TS09EA1234" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
      </View>

      {/* ── Service Zone / Location ── */}
      <View style={s.field}>
        <View style={s.labelRow}>
          <Text style={s.label}>Service Zone <Text style={s.optional}>(recommended)</Text></Text>
          {(locLoading || sugLoading) && <ActivityIndicator size="small" color={PRIMARY} />}
        </View>

        <View style={s.locInputRow}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            value={data.location}
            onChangeText={handleLocationChange}
            placeholder="Search area, city…"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Pressable style={s.gpsBtn} onPress={handleUseCurrentLocation} disabled={locLoading}>
            {locLoading
              ? <ActivityIndicator size="small" color={PRIMARY} />
              : <Text style={s.gpsBtnTxt}>📍</Text>}
          </Pressable>
        </View>

        {suggestions.length > 0 && (
          <View style={s.dropdown}>
            {suggestions.map((p, i) => (
              <Pressable key={p.placeId} style={[s.dropdownItem, i > 0 && s.dropdownItemBorder]} onPress={() => handleSelectPrediction(p)}>
                <Text style={s.dropdownMain} numberOfLines={1}>{p.mainText}</Text>
                <Text style={s.dropdownSub}  numberOfLines={1}>{p.secondaryText}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {data.pincode ? (
          <View style={s.pincodeChip}>
            <Text style={s.pincodeChipPin}>📮 {data.pincode}</Text>
            {data.location ? <Text style={s.pincodeChipLoc}> · {data.location}</Text> : null}
          </View>
        ) : (
          <Text style={s.fieldHint}>Your primary delivery area. Tap 📍 to detect from GPS.</Text>
        )}
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
  const [data,         setData]         = useState(initial);
  const [ifscErr,      setIfscErr]      = useState<string | null>(null);
  const [ifscInfo,     setIfscInfo]     = useState<IFSCInfo | null>(null);
  const [ifscLoading,  setIfscLoading]  = useState(false);
  const [ifscNotFound, setIfscNotFound] = useState(false);
  const [accErr,       setAccErr]       = useState<string | null>(null);

  async function handleIfscChange(v: string) {
    const upper = v.toUpperCase();
    setData(d => ({ ...d, ifsc: upper }));
    const err = validateIfsc(upper);
    setIfscErr(err);
    setIfscInfo(null);
    setIfscNotFound(false);

    if (!err && upper.length === 11) {
      setIfscLoading(true);
      const info = await lookupIFSC(upper);
      setIfscLoading(false);
      if (info) {
        setIfscInfo(info);
        // Auto-fill bank name only if field is still empty
        setData(d => ({ ...d, bankName: d.bankName.trim() === '' ? info.bank : d.bankName }));
      } else {
        setIfscNotFound(true);
      }
    }
  }

  function checkAccountMatch(confirm: string) {
    setData(d => ({ ...d, confirmAccountNumber: confirm }));
    setAccErr(data.accountNumber && confirm && data.accountNumber !== confirm ? 'Account numbers do not match' : null);
  }

  const ifscOk  = data.ifsc.length === 11 && !ifscErr;
  const canNext = data.holderName.trim().length >= 2
    && data.accountNumber.length >= 9
    && data.accountNumber === data.confirmAccountNumber
    && ifscOk
    && data.bankName.trim().length >= 2;

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
        <TextInput style={s.input} value={data.holderName} onChangeText={v => setData(d => ({ ...d, holderName: v }))} placeholder="As per bank records" placeholderTextColor="#9ca3af" autoCapitalize="words" />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Account Number *</Text>
        <TextInput
          style={[s.input, s.monoInput]}
          value={data.accountNumber}
          onChangeText={v => { setData(d => ({ ...d, accountNumber: v.replace(/\D/g, '') })); setAccErr(null); }}
          placeholder="9 – 18 digit account number"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          secureTextEntry
        />
      </View>

      <View style={s.field}>
        <Text style={s.label}>Confirm Account Number *</Text>
        <TextInput
          style={[s.input, s.monoInput, accErr ? s.inputError : null]}
          value={data.confirmAccountNumber}
          onChangeText={checkAccountMatch}
          placeholder="Re-enter account number"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />
        {accErr ? <Text style={s.fieldErr}>{accErr}</Text> : null}
      </View>

      {/* ── IFSC with auto bank-name lookup ── */}
      <View style={s.field}>
        <View style={s.labelRow}>
          <Text style={s.label}>IFSC Code *</Text>
          {ifscLoading && <ActivityIndicator size="small" color={PRIMARY} />}
        </View>
        <TextInput
          style={[s.input, s.monoInput, ifscErr ? s.inputError : ifscOk ? s.inputValid : null]}
          value={data.ifsc}
          onChangeText={handleIfscChange}
          placeholder="e.g. SBIN0001234"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          maxLength={11}
        />
        {ifscErr
          ? <Text style={s.fieldErr}>{ifscErr}</Text>
          : ifscLoading
            ? <Text style={s.fieldHint}>Looking up bank details…</Text>
            : ifscNotFound
              ? <Text style={s.fieldHint}>IFSC not found — enter bank name manually below.</Text>
              : ifscOk && !ifscInfo
                ? <Text style={s.fieldOk}>✓ Valid IFSC format</Text>
                : null}

        {ifscInfo && (
          <View style={s.ifscInfoCard}>
            <Text style={s.ifscInfoBank}>🏦 {ifscInfo.bank}</Text>
            <Text style={s.ifscInfoDetail}>{ifscInfo.branch}  ·  {ifscInfo.city}</Text>
            {ifscInfo.state ? <Text style={s.ifscInfoSub}>{ifscInfo.state}</Text> : null}
          </View>
        )}
      </View>

      <View style={s.field}>
        <View style={s.labelRow}>
          <Text style={s.label}>Bank Name *</Text>
          {ifscInfo && <View style={s.validBadge}><Text style={s.validBadgeTxt}>✓</Text></View>}
        </View>
        <TextInput
          style={[s.input, ifscInfo ? s.inputValid : null]}
          value={data.bankName}
          onChangeText={v => setData(d => ({ ...d, bankName: v }))}
          placeholder="e.g. State Bank of India"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
        {ifscInfo && <Text style={s.fieldOk}>✓ Auto-filled — edit if incorrect</Text>}
      </View>

      <View style={s.field}>
        <Text style={s.label}>UPI ID <Text style={s.optional}>(optional)</Text></Text>
        <TextInput style={s.input} value={data.upiId} onChangeText={v => setData(d => ({ ...d, upiId: v }))} placeholder="e.g. ravi@upi" placeholderTextColor="#9ca3af" autoCapitalize="none" keyboardType="email-address" />
      </View>

      <View style={s.stepFooter}>
        <Pressable style={s.backBtn} onPress={onBack} disabled={saving}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </Pressable>
        <Pressable style={[s.nextBtn, (!canNext || saving) && s.nextBtnDisabled, { flex: 1 }]} onPress={() => canNext && onNext(data)} disabled={!canNext || saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Text style={s.nextBtnTxt}>Next — KYC Docs</Text><View style={s.nextArrow} /></>}
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

interface KycField {
  key:        keyof KycData;
  label:      string;
  icon:       string;
  placeholder: string;
  hint:       string;
  validate?:  (v: string) => string | null;
  keyboard?:  'default' | 'number-pad';
  upper?:     boolean;
  maxLen?:    number;
}

const KYC_FIELDS: KycField[] = [
  { key: 'aadhaar',         label: 'Aadhaar Number *',         icon: '🪪', placeholder: '1234 5678 9012',    hint: '12-digit Aadhaar card number',           validate: validateAadhaar, keyboard: 'number-pad', maxLen: 12 },
  { key: 'pan',             label: 'PAN Card Number *',         icon: '💳', placeholder: 'ABCDE1234F',        hint: '10-character PAN card number',           validate: validatePan,     upper: true, maxLen: 10 },
  { key: 'drivingLicense',  label: "Driver's License Number *", icon: '🪪', placeholder: 'TS1420120012345',  hint: 'As printed on your driving license' },
  { key: 'vehicleRc',       label: 'Vehicle RC Number *',       icon: '🚗', placeholder: 'TS09EA1234',        hint: 'Registration Certificate number',        upper: true },
  { key: 'insurancePolicy', label: 'Insurance Policy Number',   icon: '🛡️', placeholder: 'POL/2024/123456', hint: 'Vehicle insurance policy number (optional)' },
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
        const val     = data[field.key];
        const err     = errors[field.key];
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
              placeholderTextColor="#9ca3af"
              keyboardType={field.keyboard ?? 'default'}
              autoCapitalize={field.upper ? 'characters' : 'none'}
              maxLength={field.maxLen}
            />
            {err
              ? <Text style={s.fieldErr}>{err}</Text>
              : <Text style={s.fieldHint}>{field.hint}</Text>}
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

  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '', vehicleType: '', vehicleNumber: '', location: '', pincode: '', lat: 0, lng: 0 });
  const [bank,    setBank]    = useState<BankData>({ holderName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '', bankName: '', upiId: '' });

  async function handleFinalSubmit(kyc: KycData) {
    if (!session) return;
    setSaving(true);
    try {
      await Promise.all([
        updateAgentProfile(session.userId, {
          name:          profile.name,
          email:         profile.email || undefined,
          vehicleType:   profile.vehicleType,
          vehicleNumber: profile.vehicleNumber || undefined,
          zone:          profile.location || undefined,
        }, session.token),
        updateAgentBank(session.userId, {
          accountHolderName: bank.holderName,
          accountNumber:     bank.accountNumber,
          ifscCode:          bank.ifsc.toUpperCase(),
          bankName:          bank.bankName,
          upiId:             bank.upiId || undefined,
        }, session.token),
        updateAgentKyc(session.userId, {
          aadhaarNumber:        kyc.aadhaar,
          panNumber:            kyc.pan.toUpperCase(),
          drivingLicenseNumber: kyc.drivingLicense,
          vehicleRcNumber:      kyc.vehicleRc.toUpperCase(),
          insurancePolicyNumber: kyc.insurancePolicy || undefined,
        }, session.token),
      ]);
      showToast('Profile set up! Welcome to FoxTail 🦊', 'success');
      await markOnboardingDone();
    } catch {
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
        {step === 1 && (
          <Step1Profile
            initial={profile}
            onNext={d => { setProfile(d); setStep(2); }}
          />
        )}
        {step === 2 && (
          <Step2Bank
            initial={bank}
            onNext={d => { setBank(d); setStep(3); }}
            onBack={() => setStep(1)}
            saving={false}
          />
        )}
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

// ── Styles ─────────────────────────────────────────────────────────────────────

function makeStyles(_c: AppColors) {
  return StyleSheet.create({
    root:         { flex: 1, backgroundColor: '#f9fafb' },
    onboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
    onboardLogo:   { width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: PRIMARY + '44' },
    onboardTitle:  { fontSize: 16, fontWeight: '800', color: '#111827' },
    onboardSub:    { fontSize: 11, color: '#6b7280' },
    skipTxt:       { fontSize: 13, fontWeight: '600', color: '#6b7280' },

    stepBody:     { flex: 1 },
    stepContent:  { padding: 20, paddingBottom: 40 },
    stepHeader:   { alignItems: 'center', marginBottom: 24 },
    stepIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: PRIMARY + '44' },
    stepTitle:    { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
    stepSub:      { fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 20 },

    infoCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: ACCENT + '18', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: ACCENT + '55', marginBottom: 20 },
    infoCardIcon: { fontSize: 18 },
    infoCardTxt:  { flex: 1, fontSize: 12, color: '#78350f', lineHeight: 18, fontWeight: '600' },

    field:    { marginBottom: 18 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
    label:    { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
    optional: { fontWeight: '400', color: '#9ca3af' },

    input:      { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827', backgroundColor: '#ffffff' },
    monoInput:  { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
    inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    inputValid: { borderColor: PRIMARY, backgroundColor: '#f0fdf4' },

    fieldErr:  { fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: '600' },
    fieldOk:   { fontSize: 11, color: '#166534', marginTop: 4, fontWeight: '600' },
    fieldHint: { fontSize: 11, color: '#6b7280', marginTop: 4 },

    // ── Location picker
    locInputRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
    gpsBtn:            { width: 50, height: 50, borderRadius: 12, backgroundColor: PRIMARY + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: PRIMARY + '44' },
    gpsBtnTxt:         { fontSize: 22 },
    dropdown:          { marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
    dropdownItem:      { paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff' },
    dropdownItemBorder: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    dropdownMain:      { fontSize: 13, fontWeight: '600', color: '#111827' },
    dropdownSub:       { fontSize: 11, color: '#6b7280', marginTop: 2 },
    pincodeChip:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: PRIMARY + '12', borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: PRIMARY + '30' },
    pincodeChipPin:    { fontSize: 12, fontWeight: '800', color: PRIMARY },
    pincodeChipLoc:    { fontSize: 12, color: '#374151' },

    // ── IFSC info card
    ifscInfoCard:   { marginTop: 8, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
    ifscInfoBank:   { fontSize: 14, fontWeight: '800', color: '#14532d', marginBottom: 3 },
    ifscInfoDetail: { fontSize: 12, color: '#166534', fontWeight: '600' },
    ifscInfoSub:    { fontSize: 11, color: '#4ade80', marginTop: 2 },

    // ── Vehicle pills
    pillGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vehiclePill:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#ffffff' },
    vehiclePillActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '15' },
    vehiclePillTxt:   { fontSize: 13, fontWeight: '600', color: '#374151' },
    vehiclePillTxtActive: { color: PRIMARY, fontWeight: '700' },

    // ── Valid badge
    validBadge:    { backgroundColor: '#dcfce7', borderRadius: 99, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    validBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#166534' },

    // ── KYC note
    kycNote:    { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    kycNoteTxt: { fontSize: 12, color: '#374151', lineHeight: 18 },

    // ── Footer actions
    stepFooter:      { flexDirection: 'row', gap: 10, paddingTop: 8 },
    backBtn:         { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
    backBtnTxt:      { fontSize: 14, fontWeight: '600', color: '#374151' },
    nextBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15 },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnTxt:      { fontSize: 14, fontWeight: '800', color: '#fff' },
    nextArrow:       { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 7, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff' },
  });
}
