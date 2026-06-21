import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { reviewOnboardingRequest, type StoreOnboardingRequest } from '@/services/agent-api';
import { useToast } from '@/components/toast-provider';
import { useAuth } from '@/context/auth-context';

interface Props {
  visible:   boolean;
  store:     StoreOnboardingRequest | null;
  onClose:   () => void;
  onUpdated: () => void;
}

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';

const STORE_TYPE_ICONS: Record<string, string> = {
  farmer: '🌾', dairy: '🥛', homefood: '🍱', artisan: '🪡',
  trades: '🔧', kirana: '🛒',
};

export function StoreReviewModal({ visible, store, onClose, onUpdated }: Props) {
  const c = useAppColors();
  const s = makeStyles(c);
  const { showToast, showConfirm } = useToast();
  const { session } = useAuth();
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);

  if (!store) return null;

  async function handleDecision(decision: 'approved' | 'rejected') {
    if (!session) return;
    showConfirm({
      title:        decision === 'approved' ? 'Approve Store?' : 'Reject Store?',
      message:      decision === 'approved'
        ? `Approve "${store.storeName}" for onboarding?`
        : `Reject "${store.storeName}"? This will notify the owner.`,
      confirmLabel: decision === 'approved' ? 'Approve' : 'Reject',
      destructive:  decision === 'rejected',
      onConfirm:    async () => {
        setLoading(true);
        try {
          await reviewOnboardingRequest(store.id, decision, notes.trim(), session.token);
          showToast(`Store ${decision === 'approved' ? 'approved' : 'rejected'}.`, decision === 'approved' ? 'success' : 'warning');
          setNotes('');
          onUpdated();
          onClose();
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Failed to update.', 'error');
        } finally {
          setLoading(false);
        }
      },
    });
  }

  const icon = STORE_TYPE_ICONS[store.storeType] ?? '🏪';
  const statusColor = store.status === 'approved' ? PRIMARY : store.status === 'rejected' ? '#dc2626' : ACCENT;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.container}>
        <Pressable style={[StyleSheet.absoluteFill, s.backdrop]} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.bar} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            <View style={s.head}>
              <View style={s.storeIcon}>
                <Text style={{ fontSize: 28 }}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.storeName}>{store.storeName}</Text>
                <Text style={s.storeOwner}>{store.ownerName} · {store.phone}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
                <Text style={[s.statusTxt, { color: statusColor }]}>
                  {store.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Store Details */}
            <View style={s.card}>
              <Text style={s.sectionLabel}>Store Details</Text>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Store Type</Text>
                <Text style={s.detailVal}>{icon} {store.storeType}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Location</Text>
                <Text style={s.detailVal}>{store.location}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Pincode</Text>
                <Text style={s.detailVal}>{store.pincode}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Submitted</Text>
                <Text style={s.detailVal}>{new Date(store.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              {store.kycDocUrl && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>KYC Doc</Text>
                  <Text style={[s.detailVal, { color: '#006D77' }]}>Document Uploaded ✓</Text>
                </View>
              )}
              {store.notes && (
                <View style={[s.detailRow, { marginTop: 4 }]}>
                  <Text style={s.detailLabel}>Review Notes</Text>
                  <Text style={s.detailVal}>{store.notes}</Text>
                </View>
              )}
            </View>

            {/* Review Notes Input — only when pending */}
            {store.status === 'pending' && (
              <View style={s.notesSection}>
                <Text style={s.sectionLabel}>Your Review Notes</Text>
                <TextInput
                  style={s.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about your on-site visit…"
                  placeholderTextColor={c.textFaint}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Actions */}
            {store.status === 'pending' && (
              <View style={s.actions}>
                <Pressable
                  style={[s.rejectBtn, loading && { opacity: 0.5 }]}
                  onPress={() => handleDecision('rejected')}
                  disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={s.rejectTxt}>✕  Reject</Text>}
                </Pressable>
                <Pressable
                  style={[s.approveBtn, loading && { opacity: 0.5 }]}
                  onPress={() => handleDecision('approved')}
                  disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.approveTxt}>✓  Approve</Text>}
                </Pressable>
              </View>
            )}

            <Pressable style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeTxt}>Close</Text>
            </Pressable>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    backdrop:  { backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, maxHeight: '90%',
    },
    bar: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderMid, marginBottom: 18 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    storeIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    storeName:  { fontSize: 16, fontWeight: '800', color: c.text },
    storeOwner: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
    statusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    card:      { backgroundColor: c.bgScreen, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 14 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    detailRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.borderLight },
    detailLabel: { fontSize: 12, color: c.textMuted, flex: 1 },
    detailVal:   { fontSize: 13, fontWeight: '600', color: c.text, flex: 2, textAlign: 'right' },
    notesSection: { marginBottom: 14 },
    notesInput: { borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14, fontSize: 14, color: c.text, backgroundColor: c.bgScreen, height: 100, marginTop: 8 },
    actions:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
    rejectBtn:  { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#dc2626', alignItems: 'center' },
    rejectTxt:  { fontSize: 15, fontWeight: '700', color: '#dc2626' },
    approveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
    approveTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
    closeBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: c.borderMid },
    closeTxt:   { fontSize: 15, fontWeight: '600', color: c.textSub },
  });
}
