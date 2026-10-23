import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  return value ? new Date(`${value}T12:00:00`) : new Date();
}

export default function DateField({ value, onChange }) {
  const [open, setOpen] = useState(false);

  function handleChange(event, selectedDate) {
    if (event.type === 'set' && selectedDate) onChange(formatDate(selectedDate));
    if (Platform.OS !== 'ios' || event.type === 'dismissed') setOpen(false);
  }

  return (
    <View>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.input}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Choose a date'}</Text>
        <Text style={styles.action}>SELECT DATE</Text>
      </Pressable>
      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>DONE</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 54,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E5E3D9',
    backgroundColor: '#FFFEFA',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { color: '#20342D', fontSize: 16 },
  placeholder: { color: '#9A9D96' },
  action: { color: '#28614B', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  pickerWrap: { marginTop: 8, alignItems: 'flex-end' },
  doneButton: { paddingHorizontal: 14, paddingVertical: 9 },
  doneText: { color: '#28614B', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});