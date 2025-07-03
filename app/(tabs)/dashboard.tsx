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
import { supabase, Content } from '@/lib/supabase';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'review'>('all');

  useEffect(() => {
    if (user) {
      fetchContents();
    }
  }, [user, filter]);

  const fetchContents = async () => {
    try {
      let query = supabase
        .from('contents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
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

  const updateStatus = async (id: string, newStatus: 'draft' | 'published' | 'review') => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={16} color="#10B981" />;
      case 'draft':
        return <Edit size={16} color="#F59E0B" />;
      case 'review':
        return <AlertCircle size={16} color="#8B5CF6" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#10B981';
      case 'draft':
        return '#F59E0B';
      case 'review':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const filteredContents = contents.filter(content => 
    filter === 'all' || content.status === filter
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your content</Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterTabs}>
            {(['all', 'draft', 'published', 'review'] as const).map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterTab,
                  filter === filterType && styles.filterTabActive,
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === filterType && styles.filterTabTextActive,
                  ]}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
                {filterType !== 'all' && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>
                      {contents.filter(c => c.status === filterType).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredContents.length > 0 ? (
          filteredContents.map((content) => (
            <View key={content.id} style={styles.contentCard}>
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
                        {content.status}
                      </Text>
                    </View>
                    <Text style={styles.contentDate}>
                      {new Date(content.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.contentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      const nextStatus = content.status === 'draft' ? 'review' : 
                                        content.status === 'review' ? 'published' : 'draft';
                      updateStatus(content.id, nextStatus);
                    }}
                  >
                    <Eye size={16} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteContent(content.id)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {content.media && content.media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.mediaContainer}>
                    {content.media.map((mediaUrl, index) => (
                      <Image
                        key={index}
                        source={{ uri: mediaUrl }}
                        style={styles.mediaImage}
                      />
                    ))}
                  </View>
                </ScrollView>
              )}

              <View style={styles.contentFooter}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: getStatusColor(content.status) }]}
                  onPress={() => {
                    const options = ['draft', 'review', 'published'].filter(s => s !== content.status);
                    Alert.alert(
                      'Update Status',
                      'Choose new status:',
                      options.map(status => ({
                        text: status.charAt(0).toUpperCase() + status.slice(1),
                        onPress: () => updateStatus(content.id, status as any),
                      }))
                    );
                  }}
                >
                  <Text style={styles.statusButtonText}>
                    Change Status
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No content found</Text>
            <Text style={styles.emptyDescription}>
              {filter === 'all' 
                ? 'You haven\'t created any content yet' 
                : `No ${filter} content found`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#1F2937',
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#9CA3AF',
  },
  contentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});