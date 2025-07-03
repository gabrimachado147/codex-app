import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Calendar, Clock, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';

interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  currentDate?: Date;
}

export function ScheduleModal({ visible, onClose, onSchedule, currentDate }: ScheduleModalProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(currentDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const styles = createStyles(colors);

  const handleDateConfirm = (date: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(time.getHours());
    newDate.setMinutes(time.getMinutes());
    setSelectedDate(newDate);
    setShowTimePicker(false);
  };

  const handleSchedule = () => {
    onSchedule(selectedDate);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Schedule Publication</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Choose when you want this content to be published
            </Text>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateTimeButton}
              >
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {format(selectedDate, 'MMM dd, yyyy')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.dateTimeButton}
              >
                <Clock size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>
                  {format(selectedDate, 'HH:mm')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Scheduled for:</Text>
              <Text style={styles.previewDate}>
                {format(selectedDate, 'EEEE, MMMM dd, yyyy \'at\' HH:mm')}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSchedule} style={styles.scheduleButton}>
                <Text style={styles.scheduleText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  previewContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
});