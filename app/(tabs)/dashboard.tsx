import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Content } from '@/lib/supabase';
import { SearchBar } from '@/components/SearchBar';
import { FilterChips, Filter } from '@/components/FilterChips';
import { BatchActions } from '@/components/BatchActions';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Filter as FilterIcon,
  Calendar,
  MoreVertical
} from 'lucide-react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [contents, setContents] = useState<Content[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (user) {
      fetchContents();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [contents, searchQuery, activeFilters]);

  const fetchContents = async () => {
    try {
      let query = supabase
        .from('contents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...contents];

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply active filters
    activeFilters.forEach(filter => {
      switch (filter.type) {
        case 'status':
          filtered = filtered.filter(content => content.status === filter.value);
          break;
        case 'type':
          filtered = filtered.filter(content => content.type === filter.value);
          break;
        case 'tag':
          filtered = filtered.filter(content => 
            content.tags?.includes(filter.value)
          );
          break;
        case 'date':
          // Implement date range filtering
          break;
      }
    });

    setFilteredContents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContents();
    setRefreshing(false);
  };

  const deleteContent = async (id: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('contents')
                .delete()
                .eq('id', id);

              if (error) throw error;
              await fetchContents();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contents')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchContents();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleBatchAction = async (action: string) => {
    const selectedIds = Array.from(selectedItems);
    
    try {
      switch (action) {
        case 'approve':
          await Promise.all(selectedIds.map(id => updateStatus(id, 'approved')));
          break;
        case 'reject':
          await Promise.all(selectedIds.map(id => updateStatus(id, 'rejected')));
          break;
        case 'delete':
          Alert.alert(
            'Delete Selected Items',
            `Are you sure you want to delete ${selectedIds.length} items?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await Promise.all(selectedIds.map(id => 
                    supabase.from('contents').delete().eq('id', id)
                  ));
                  await fetchContents();
                  setSelectedItems(new Set());
                  setSelectionMode(false);
                },
              },
            ]
          );
          return;
        case 'archive':
          await Promise.all(selectedIds.map(id => updateStatus(id, 'draft')));
          break;
      }
      
      setSelectedItems(new Set());
      setSelectionMode(false);
      await fetchContents();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
    
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const startSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedItems(new Set([id]));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={16} color={colors.success} />;
      case 'approved':
        return <CheckCircle size={16} color={colors.success} />;
      case 'draft':
        return <Edit size={16} color={colors.warning} />;
      case 'pending_approval':
        return <Clock size={16} color={colors.info} />;
      case 'rejected':
        return <AlertCircle size={16} color={colors.error} />;
      default:
        return <Clock size={16} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return colors.success;
      case 'draft':
        return colors.warning;
      case 'pending_approval':
        return colors.info;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const addFilter = (filter: Filter) => {
    setActiveFilters(prev => [...prev, filter]);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const showFilterModal = () => {
    // Implement filter modal
    Alert.alert('Filters', 'Filter modal coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your content</Text>
      </LinearGradient>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={showFilterModal}
      />

      <FilterChips
        filters={activeFilters}
        onRemoveFilter={removeFilter}
        onClearAll={clearAllFilters}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredContents.length > 0 ? (
          filteredContents.map((content, index) => (
            <Animated.View
              key={content.id}
              entering={FadeInRight.delay(index * 100)}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                style={[
                  styles.contentCard,
                  selectedItems.has(content.id) && styles.selectedCard
                ]}
                onPress={() => {
                  if (selectionMode) {
                    toggleItemSelection(content.id);
                  }
                }}
                onLongPress={() => startSelectionMode(content.id)}
              >
                <View style={styles.contentHeader}>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>{content.title}</Text>
                    <Text style={styles.contentDescription}>
                      {content.description}
                    </Text>
                    <View style={styles.contentMeta}>
                      <View style={styles.statusContainer}>
                        {getStatusIcon(content.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(content.status) }]}>
                          {content.status.replace('_', ' ')}
                        </Text>
                      </View>
                      <Text style={styles.contentDate}>
                        {new Date(content.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {content.tags && content.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {content.tags.slice(0, 3).map((tag, tagIndex) => (
                          <View key={tagIndex} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {content.tags.length > 3 && (
                          <Text style={styles.moreTagsText}>
                            +{content.tags.length - 3} more
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {!selectionMode && (
                    <View style={styles.contentActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          const nextStatus = content.status === 'draft' ? 'pending_approval' : 
                                            content.status === 'pending_approval' ? 'approved' : 
                                            content.status === 'approved' ? 'published' : 'draft';
                          updateStatus(content.id, nextStatus);
                        }}
                      >
                        <Eye size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteContent(content.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {selectionMode && (
                    <View style={styles.selectionIndicator}>
                      {selectedItems.has(content.id) && (
                        <CheckCircle size={24} color={colors.primary} />
                      )}
                    </View>
                  )}
                </View>

                {content.media && content.media.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.mediaContainer}>
                      {content.media.map((mediaUrl, mediaIndex) => (
                        <Image
                          key={mediaIndex}
                          source={{ uri: mediaUrl }}
                          style={styles.mediaImage}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}

                {content.scheduled_at && (
                  <View style={styles.scheduledBanner}>
                    <Calendar size={16} color={colors.info} />
                    <Text style={styles.scheduledText}>
                      Scheduled for {new Date(content.scheduled_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No content found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || activeFilters.length > 0
                ? 'Try adjusting your search or filters'
                : 'You haven\'t created any content yet'}
            </Text>
          </View>
        )}
      </ScrollView>

      {selectionMode && (
        <BatchActions
          selectedCount={selectedItems.size}
          onApprove={() => handleBatchAction('approve')}
          onReject={() => handleBatchAction('reject')}
          onDelete={() => handleBatchAction('delete')}
          onArchive={() => handleBatchAction('archive')}
          onCancel={() => {
            setSelectionMode(false);
            setSelectedItems(new Set());
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.surface,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentInfo: {
    flex: 1,
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  contentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  contentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mediaImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  scheduledText: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});