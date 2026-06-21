import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useAppColors } from '@/hooks/use-app-colors';

const PRIMARY = '#2E7D32';

interface DeliveryOtpModalProps {
  visible:   boolean;
  onConfirm: (otp: string) => Promise<void>;
  onClose:   () => void;
}

export function DeliveryOtpModal({ visible, onConfirm, onClose }: DeliveryOtpModalProps) {
  const c = useAppColors();
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function reset() { setOtp(''); setError(''); setLoading(false); }

  async function handleConfirm() {
    if (otp.length !== 4) { setError('Enter the 4-digit OTP from the buyer'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(otp);
      reset();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid OTP — please try again');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[s.sheet, { backgroundColor: c.bg }]}>
          <View style={s.handle} />
          <Text style={[s.title, { color: c.text }]}>Confirm Delivery</Text>
          <Text style={[s.sub, { color: c.textMuted }]}>
            Ask the buyer for the 4-digit OTP sent to their phone.
          </Text>

          <TextInput
            style={[s.otpInput, { borderColor: error ? '#dc2626' : c.border, color: c.text }]}
            value={otp}
            onChangeText={v => { setOtp(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0 0 0 0"
            placeholderTextColor={c.textFaint}
            textContentType="oneTimeCode"
            autoFocus
          />

          {!!error && <Text style={s.errorTxt}>{error}</Text>}

          <View style={s.actions}>
            <Pressable
              style={[s.btn, s.cancelBtn, { borderColor: c.border }]}
              onPress={handleClose}
              disabled={loading}>
              <Text style={[s.btnTxt, { color: c.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[s.btn, s.confirmBtn, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleConfirm}
              disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[s.btnTxt, { color: '#fff' }]}>✓ Confirm</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:  { flex: 1, justifyContent: 'flex-end' },
  sheet:     {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 16,
  },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 20 },
  title:     { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  sub:       { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  otpInput:  {
    fontSize: 32, fontWeight: '800', letterSpacing: 16,
    textAlign: 'center', borderWidth: 2, borderRadius: 16,
    paddingVertical: 16, marginBottom: 8,
  },
  errorTxt:  { fontSize: 12, color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  actions:   { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn:       { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { borderWidth: 1.5 },
  confirmBtn:{ backgroundColor: PRIMARY },
  btnTxt:    { fontSize: 14, fontWeight: '700' },
});
