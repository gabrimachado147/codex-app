import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface Filter {
  id: string;
  label: string;
  value: any;
  type: 'status' | 'tag' | 'date' | 'type';
}

interface FilterChipsProps {
  filters: Filter[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const { colors } = useTheme();

  if (filters.length === 0) return null;

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipContainer}>
          {filters.map((filter) => (
            <View key={filter.id} style={styles.chip}>
              <Text style={styles.chipText}>{filter.label}</Text>
              <TouchableOpacity
                onPress={() => onRemoveFilter(filter.id)}
                style={styles.removeButton}
              >
                <X size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          
          {filters.length > 1 && (
            <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  clearAllButton: {
    backgroundColor: colors.error,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '500',
  },
});