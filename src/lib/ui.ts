import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1e88e5',
  danger: '#e53935',
  bg: '#f5f6f8',
  card: '#ffffff',
  text: '#1b1f23',
  sub: '#6b7280',
};

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 14, color: colors.sub },
  big: { fontSize: 40, fontWeight: '700', color: colors.text },
  text: { fontSize: 16, color: colors.text },
  sub: { fontSize: 13, color: colors.sub },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
