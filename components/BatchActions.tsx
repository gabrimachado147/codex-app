import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X, Trash2, Archive } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface BatchActionsProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onCancel: () => void;
}

export function BatchActions({ 
  selectedCount, 
  onApprove, 
  onReject, 
  onDelete, 
  onArchive, 
  onCancel 
}: BatchActionsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (selectedCount === 0) return null;

  return (
    <Animated.View 
      entering={FadeInUp.duration(300)} 
      exiting={FadeOutUp.duration(300)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={onApprove} style={[styles.actionButton, styles.approveButton]}>
          <Check size={18} color={colors.surface} />
          <Text style={[styles.actionText, { color: colors.surface }]}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onReject} style={[styles.actionButton, styles.rejectButton]}>
          <X size={18} color={colors.surface} />
          <Text style={[styles.actionText, { color: colors.surface }]}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onArchive} style={[styles.actionButton, styles.archiveButton]}>
          <Archive size={18} color={colors.surface} />
          <Text style={[styles.actionText, { color: colors.surface }]}>Archive</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
          <Trash2 size={18} color={colors.surface} />
          <Text style={[styles.actionText, { color: colors.surface }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  archiveButton: {
    backgroundColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
});