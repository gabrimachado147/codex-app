import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase, Content } from '@/lib/supabase';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { ContentCard } from '@/components/ContentCard';
import { BatchActions } from '@/components/BatchActions';
import { CommentsThread } from '@/components/CommentsThread';
import { FileText, Plus, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

interface SearchFilters {
  query: string;
  status: string[];
  type: string[];
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [contents, setContents] = useState<Content[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    type: [],
    tags: [],
    dateFrom: null,
    dateTo: null,
  });

  const styles = createStyles(colors);

  useEffect(() => {
    if (user) {
      fetchContents();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [contents, filters]);

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
      
      // Extract unique tags
      const allTags = new Set<string>();
      data?.forEach(content => {
        content.tags?.forEach((tag: string) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));
      
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...contents];

    // Apply search query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(query) ||
        content.description?.toLowerCase().includes(query) ||
        content.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(content => filters.status.includes(content.status));
    }

    // Apply type filters
    if (filters.type.length > 0) {
      filtered = filtered.filter(content => filters.type.includes(content.type));
    }

    // Apply tag filters
    if (filters.tags.length > 0) {
      filtered = filtered.filter(content =>
        filters.tags.some(tag => content.tags?.includes(tag))
      );
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(content =>
        new Date(content.created_at) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(content =>
        new Date(content.created_at) <= endDate
      );
    }

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

  const handleSearch = () => {
    applyFilters();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {filteredContents.length} of {contents.length} items
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      </LinearGradient>

      <AdvancedSearch
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        availableTags={availableTags}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredContents.length > 0 ? (
          filteredContents.map((content, index) => (
            <ContentCard
              key={content.id}
              content={content}
              isSelected={selectedItems.has(content.id)}
              selectionMode={selectionMode}
              onPress={() => {
                if (selectionMode) {
                  toggleItemSelection(content.id);
                } else {
                  // Navigate to content detail or edit
                  router.push(`/(tabs)/create?edit=${content.id}`);
                }
              }}
              onLongPress={() => startSelectionMode(content.id)}
              onEdit={() => router.push(`/(tabs)/create?edit=${content.id}`)}
              onDelete={() => deleteContent(content.id)}
              onStatusChange={(newStatus) => updateStatus(content.id, newStatus)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No content found</Text>
            <Text style={styles.emptyDescription}>
              {filters.query || filters.status.length > 0 || filters.type.length > 0 || filters.tags.length > 0
                ? 'Try adjusting your search filters'
                : 'Create your first piece of content to get started'}
            </Text>
            {!filters.query && filters.status.length === 0 && filters.type.length === 0 && filters.tags.length === 0 && (
              <TouchableOpacity
                style={styles.createContentButton}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.createContentButtonText}>Create Content</Text>
              </TouchableOpacity>
            )}
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

      {/* Comments Modal */}
      <Modal
        visible={showComments !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(null)}
      >
        {showComments && (
          <CommentsThread
            contentId={showComments}
            visible={showComments !== null}
            onClose={() => setShowComments(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
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
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  createContentButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 24,
  },
  createContentButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});