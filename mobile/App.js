import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import DateField from './src/DateField';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const colors = {
  paper: '#F4F2E9',
  white: '#FFFEFA',
  ink: '#20342D',
  muted: '#778078',
  green: '#28614B',
  paleGreen: '#E0E9DF',
  line: '#E5E3D9',
  coral: '#B84F3F',
  paleCoral: '#F5E5DF',
  gold: '#D4A94C',
};

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Unable to reach MiniLedger.');
  return body;
}

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
}

function AppButton({ label, onPress, disabled, secondary }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#9A9D96"
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

function Login({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    try {
      await request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone_number: phone.trim() }) });
      setSent(true);
      Alert.alert('Code is ready', 'Check the MiniLedger server terminal for your six-digit OTP.');
    } catch (error) {
      Alert.alert('Could not send code', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    try {
      const result = await request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phone.trim(), otp }),
      });
      onLogin(result);
    } catch (error) {
      Alert.alert('Could not sign in', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
            <Text style={styles.brandName}>MINILEDGER</Text>
          </View>
          <View style={styles.loginCopy}>
            <Text style={styles.eyebrow}>A LITTLE MORE CLARITY</Text>
            <Text style={styles.loginTitle}>Good money{ '\n' } deserves a good memory.</Text>
            <Text style={styles.loginSub}>Keep every favor, date, and payback in one calm place.</Text>
          </View>
          <View style={styles.loginForm}>
            <Field
              label="PHONE NUMBER"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 415 555 2671"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
            {sent && (
              <Field
                label="SIX-DIGIT CODE"
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
              />
            )}
            <AppButton
              label={busy ? 'PLEASE WAIT...' : sent ? 'VERIFY & CONTINUE' : 'SEND A SIGN-IN CODE'}
              onPress={sent ? verifyCode : sendCode}
              disabled={busy || (sent ? otp.length !== 6 : phone.trim().length < 7)}
            />
            <Text style={styles.formFoot}>No password. Your phone number is your key.</Text>
          </View>
          <View style={styles.loginFooter}><Text style={styles.footerNote}>PERSONAL LENDING, KEPT PERSONAL</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ExpoStatusBar style="dark" />
    </SafeAreaView>
  );
}

function Summary({ summary }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.summaryLabel}>STILL OUT THERE</Text>
          <Text style={styles.summaryTotal}>{money(summary?.pending_amount)}</Text>
        </View>
        <View style={styles.summaryBadge}><Text style={styles.summaryBadgeText}>MY LEDGER</Text></View>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}><Text style={styles.statValue}>{money(summary?.total_lent)}</Text><Text style={styles.statLabel}>TOTAL LENT</Text></View>
        <View style={styles.statRule} />
        <View style={styles.summaryStat}><Text style={styles.statValue}>{money(summary?.total_repaid)}</Text><Text style={styles.statLabel}>PAID BACK</Text></View>
        <View style={styles.statRule} />
        <View style={styles.summaryStat}><Text style={[styles.statValue, summary?.overdue_amount > 0 && styles.overdueText]}>{money(summary?.overdue_amount)}</Text><Text style={styles.statLabel}>OVERDUE</Text></View>
      </View>
    </View>
  );
}

function LoanRow({ loan, onRepaid }) {
  return (
    <View style={[styles.loanRow, loan.is_overdue && styles.loanOverdue, loan.is_repaid && styles.loanRepaid]}>
      <View style={styles.loanIdentity}>
        <View style={[styles.avatar, loan.is_overdue && styles.avatarOverdue]}>
          <Text style={[styles.avatarText, loan.is_overdue && styles.overdueText]}>{loan.friend_name.trim().slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.loanDetails}>
          <Text style={styles.friendName} numberOfLines={1}>{loan.friend_name}</Text>
          <Text style={[styles.dueText, loan.is_overdue && styles.overdueText, loan.is_repaid && styles.paidText]}>
            {loan.is_repaid ? 'SETTLED' : loan.is_overdue ? 'OVERDUE' : `DUE ${loan.due_date}`}
          </Text>
        </View>
      </View>
      <View style={styles.loanAmountBlock}>
        <Text style={styles.loanAmount}>{money(loan.amount)}</Text>
        {!loan.is_repaid && <Pressable onPress={() => onRepaid(loan)} hitSlop={8}><Text style={styles.repaidAction}>MARK PAID</Text></Pressable>}
      </View>
    </View>
  );
}

function AddLoanForm({ token, onAdded, onCancel }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsedAmount = Number(amount);
    if (name.trim().length < 2 || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert('Check the details', 'Add a friend, a positive amount, and a date in YYYY-MM-DD format.');
      return;
    }
    setBusy(true);
    try {
      await request('/loans', {
        token,
        method: 'POST',
        body: JSON.stringify({ friend_name: name.trim(), amount: parsedAmount, due_date: dueDate }),
      });
      onAdded();
    } catch (error) {
      Alert.alert('Could not save loan', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.formSheet}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>New loan</Text>
        <Pressable accessibilityRole="button" onPress={onCancel}><Text style={styles.closeText}>CLOSE</Text></Pressable>
      </View>
      <Field label="FRIEND'S NAME" value={name} onChangeText={setName} placeholder="Who did you lend to?" autoCapitalize="words" />
      <Field label="AMOUNT" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>DUE DATE</Text>
        <DateField value={dueDate} onChange={setDueDate} />
      </View>
      <AppButton label={busy ? 'SAVING...' : 'ADD TO LEDGER'} onPress={submit} disabled={busy} />
    </View>
  );
}

function Dashboard({ session, onLogout }) {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [nextLoans, nextSummary] = await Promise.all([
        request('/loans', { token: session.token }),
        request('/loans/summary', { token: session.token }),
      ]);
      setLoans(nextLoans);
      setSummary(nextSummary);
    } catch (error) {
      Alert.alert('Could not load ledger', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function markRepaid(loan) {
    Alert.alert('Mark as paid?', `${loan.friend_name} · ${money(loan.amount)}`, [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: async () => {
          try {
            await request(`/loans/${loan.id}/repaid`, { token: session.token, method: 'PATCH' });
            await loadData(true);
          } catch (error) {
            Alert.alert('Could not update loan', error.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandMarkSmall}><Text style={styles.brandMarkTextSmall}>M</Text></View>
          <Text style={styles.brandName}>MINILEDGER</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onLogout} hitSlop={12}><Text style={styles.signOut}>SIGN OUT</Text></Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.dashboardContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.green} />}
      >
        <Text style={styles.eyebrow}>YOUR PEOPLE, YOUR PROMISES</Text>
        <Text style={styles.pageTitle}>The ledger.</Text>
        <Summary summary={summary} />
        <View style={styles.listHeading}>
          <View><Text style={styles.sectionTitle}>Open tabs</Text><Text style={styles.sectionSub}>{loans.filter((loan) => !loan.is_repaid).length} still to come back</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setShowForm((visible) => !visible)} style={styles.addButton}>
            <Text style={styles.addButtonText}>{showForm ? '−' : '+'}</Text>
          </Pressable>
        </View>
        {showForm && <AddLoanForm token={session.token} onCancel={() => setShowForm(false)} onAdded={() => { setShowForm(false); loadData(); }} />}
        {loading ? (
          <ActivityIndicator color={colors.green} style={styles.loader} />
        ) : loans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyMark}>0</Text>
            <Text style={styles.emptyTitle}>A clean slate.</Text>
            <Text style={styles.emptySub}>When you lend a friend money, add it here and we’ll keep track.</Text>
          </View>
        ) : (
          <View style={styles.loanList}>{loans.map((loan) => <LoanRow key={loan.id} loan={loan} onRepaid={markRepaid} />)}</View>
        )}
        <Text style={styles.accountNote}>SIGNED IN AS {session.user.phone_number}</Text>
      </ScrollView>
      <ExpoStatusBar style="dark" />
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  return (
    <View style={styles.fill}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
      {session ? <Dashboard session={session} onLogout={() => setSession(null)} /> : <Login onLogin={setSession} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.paper },
  loginPage: { flexGrow: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'android' ? 34 : 20, paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 34, height: 34, backgroundColor: colors.green, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandMarkSmall: { width: 28, height: 28, backgroundColor: colors.green, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontSize: 20, fontFamily: 'Georgia', color: colors.white },
  brandMarkTextSmall: { fontSize: 17, fontFamily: 'Georgia', color: colors.white },
  brandName: { color: colors.ink, fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  loginCopy: { marginTop: 86 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  loginTitle: { color: colors.ink, fontSize: 39, lineHeight: 45, fontFamily: 'Georgia', marginTop: 14 },
  loginSub: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 300 },
  loginForm: { marginTop: 44 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 9 },
  input: { backgroundColor: colors.white, minHeight: 54, borderRadius: 7, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, color: colors.ink, fontSize: 16 },
  button: { minHeight: 54, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, paddingHorizontal: 18, marginTop: 4 },
  buttonText: { color: colors.white, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  secondaryButton: { backgroundColor: colors.paleGreen },
  secondaryButtonText: { color: colors.green },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  formFoot: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 15 },
  loginFooter: { marginTop: 'auto', paddingTop: 36 },
  footerNote: { color: '#9A9D96', fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  topBar: { minHeight: 58, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  signOut: { color: colors.muted, fontWeight: '700', fontSize: 10, letterSpacing: 1 },
  dashboardContent: { paddingHorizontal: 22, paddingTop: 30, paddingBottom: 44 },
  pageTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 35, marginTop: 7, marginBottom: 22 },
  summaryCard: { backgroundColor: colors.green, borderRadius: 9, padding: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { color: '#C9D9CF', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  summaryTotal: { color: colors.white, fontFamily: 'Georgia', fontSize: 35, marginTop: 7 },
  summaryBadge: { borderWidth: 1, borderColor: '#638574', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5 },
  summaryBadgeText: { color: '#DFE8DE', fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#527563', marginVertical: 19 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryStat: { flex: 1 },
  statValue: { color: colors.white, fontSize: 13, fontWeight: '700' },
  statLabel: { color: '#C9D9CF', fontSize: 8, letterSpacing: 0.8, marginTop: 5 },
  statRule: { width: 1, height: 27, backgroundColor: '#527563', marginHorizontal: 8 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 31, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontFamily: 'Georgia' },
  sectionSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  addButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: colors.white, fontSize: 27, lineHeight: 31, fontWeight: '300' },
  loanList: { borderTopWidth: 1, borderTopColor: colors.line },
  loanRow: { minHeight: 78, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, backgroundColor: colors.white },
  loanOverdue: { backgroundColor: colors.paleCoral },
  loanRepaid: { opacity: 0.62 },
  loanIdentity: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarOverdue: { backgroundColor: '#EAD0C8' },
  avatarText: { color: colors.green, fontFamily: 'Georgia', fontSize: 18 },
  loanDetails: { flex: 1, minWidth: 0 },
  friendName: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  dueText: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.9, marginTop: 5 },
  overdueText: { color: colors.coral },
  paidText: { color: colors.green },
  loanAmountBlock: { alignItems: 'flex-end', paddingLeft: 8 },
  loanAmount: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  repaidAction: { color: colors.green, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, marginTop: 5 },
  emptyState: { alignItems: 'center', paddingHorizontal: 35, paddingVertical: 36, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  emptyMark: { color: colors.gold, fontSize: 29, fontFamily: 'Georgia' },
  emptyTitle: { color: colors.ink, fontSize: 19, fontFamily: 'Georgia', marginTop: 9 },
  emptySub: { color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  formSheet: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 17, marginBottom: 17 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 20 },
  closeText: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  loader: { marginVertical: 44 },
  accountNote: { color: '#969A92', fontSize: 8, letterSpacing: 1, marginTop: 27, textAlign: 'center' },
});