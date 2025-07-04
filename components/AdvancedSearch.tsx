import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Tag,
  FileText,
  Clock
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface SearchFilters {
  query: string;
  status: string[];
  type: string[];
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  availableTags?: string[];
}

export function AdvancedSearch({
  filters,
  onFiltersChange,
  onSearch,
  availableTags = [],
}: AdvancedSearchProps) {
  const { colors } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  const styles = createStyles(colors);

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: colors.warning },
    { value: 'pending_approval', label: 'Pending', color: colors.info },
    { value: 'approved', label: 'Approved', color: colors.success },
    { value: 'rejected', label: 'Rejected', color: colors.error },
    { value: 'published', label: 'Published', color: colors.success },
  ];

  const typeOptions = [
    { value: 'post', label: 'Post', icon: FileText },
    { value: 'story', label: 'Story', icon: Clock },
    { value: 'video', label: 'Video', icon: FileText },
    { value: 'carousel', label: 'Carousel', icon: FileText },
  ];

  const toggleFilter = (filterType: keyof SearchFilters, value: string) => {
    const currentValues = filters[filterType] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [filterType]: newValues,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      status: [],
      type: [],
      tags: [],
      dateFrom: null,
      dateTo: null,
    });
  };

  const getActiveFiltersCount = () => {
    return (
      filters.status.length +
      filters.type.length +
      filters.tags.length +
      (filters.dateFrom ? 1 : 0) +
      (filters.dateTo ? 1 : 0)
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={filters.query}
            onChangeText={(text) => onFiltersChange({ ...filters, query: text })}
            placeholder="Search content..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={onSearch}
          />
          {filters.query.length > 0 && (
            <TouchableOpacity
              onPress={() => onFiltersChange({ ...filters, query: '' })}
              style={styles.searchClearButton}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Filter size={20} color={colors.primary} />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersContainer}
        >
          <View style={styles.activeFilters}>
            {filters.status.map((status) => (
              <View key={status} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {statusOptions.find(s => s.value === status)?.label}
                </Text>
                <TouchableOpacity onPress={() => toggleFilter('status', status)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            
            {filters.type.map((type) => (
              <View key={type} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {typeOptions.find(t => t.value === type)?.label}
                </Text>
                <TouchableOpacity onPress={() => toggleFilter('type', type)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            
            {filters.tags.map((tag) => (
              <View key={tag} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>#{tag}</Text>
                <TouchableOpacity onPress={() => toggleFilter('tags', tag)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            
            {filters.dateFrom && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  From: {formatDate(filters.dateFrom)}
                </Text>
                <TouchableOpacity 
                  onPress={() => onFiltersChange({ ...filters, dateFrom: null })}
                >
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            
            {filters.dateTo && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  To: {formatDate(filters.dateTo)}
                </Text>
                <TouchableOpacity 
                  onPress={() => onFiltersChange({ ...filters, dateTo: null })}
                >
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View entering={SlideInUp.duration(300)} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterOptions}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => toggleFilter('status', option.value)}
                      style={[
                        styles.filterOption,
                        filters.status.includes(option.value) && {
                          backgroundColor: option.color + '20',
                          borderColor: option.color,
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.status.includes(option.value) && { color: option.color }
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Content Type</Text>
                <View style={styles.filterOptions}>
                  {typeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => toggleFilter('type', option.value)}
                        style={[
                          styles.filterOption,
                          filters.type.includes(option.value) && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary,
                          }
                        ]}
                      >
                        <IconComponent 
                          size={16} 
                          color={filters.type.includes(option.value) ? colors.primary : colors.textSecondary} 
                        />
                        <Text
                          style={[
                            styles.filterOptionText,
                            filters.type.includes(option.value) && { color: colors.primary }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                <View style={styles.dateRange}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker('from')}
                    style={styles.dateButton}
                  >
                    <Calendar size={16} color={colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {filters.dateFrom ? formatDate(filters.dateFrom) : 'From Date'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setShowDatePicker('to')}
                    style={styles.dateButton}
                  >
                    <Calendar size={16} color={colors.primary} />
                    <Text style={styles.dateButtonText}>
                      {filters.dateTo ? formatDate(filters.dateTo) : 'To Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tags */}
              {availableTags.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tags</Text>
                  <View style={styles.filterOptions}>
                    {availableTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleFilter('tags', tag)}
                        style={[
                          styles.filterOption,
                          filters.tags.includes(tag) && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary,
                          }
                        ]}
                      >
                        <Tag size={16} color={filters.tags.includes(tag) ? colors.primary : colors.textSecondary} />
                        <Text
                          style={[
                            styles.filterOptionText,
                            filters.tags.includes(tag) && { color: colors.primary }
                          ]}
                        >
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={clearAllFilters} style={styles.modalClearButton}>
                <Text style={styles.modalClearButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  onSearch();
                  setShowFilters(false);
                }} 
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker !== null}
        mode="date"
        onConfirm={(date) => {
          if (showDatePicker === 'from') {
            onFiltersChange({ ...filters, dateFrom: date });
          } else if (showDatePicker === 'to') {
            onFiltersChange({ ...filters, dateTo: date });
          }
          setShowDatePicker(null);
        }}
        onCancel={() => setShowDatePicker(null)}
        maximumDate={new Date()}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  searchClearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    paddingVertical: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: colors.error,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  dateRange: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  modalClearButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalClearButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
});