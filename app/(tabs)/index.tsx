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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Content } from '@/lib/supabase';
import { router } from 'expo-router';
import { TrendingUp, Users, FileText, Clock, Plus } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
  const [stats, setStats] = useState({
    totalContents: 0,
    publishedContents: 0,
    draftContents: 0,
    pendingContents: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchContents();
      fetchStats();
    }
  }, [user]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('status')
        .eq('user_id', user?.id);

      if (error) throw error;

      const totalContents = data?.length || 0;
      const publishedContents = data?.filter(c => c.status === 'published').length || 0;
      const draftContents = data?.filter(c => c.status === 'draft').length || 0;
      const pendingContents = data?.filter(c => c.status === 'pending_approval').length || 0;

      setStats({
        totalContents,
        publishedContents,
        draftContents,
        pendingContents,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContents();
    await fetchStats();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#10B981';
      case 'approved':
        return '#10B981';
      case 'draft':
        return '#F59E0B';
      case 'pending_approval':
        return '#8B5CF6';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1E40AF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FileText size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats.totalContents}</Text>
              <Text style={styles.statLabel}>Total Content</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats.publishedContents}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Clock size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.draftContents}</Text>
              <Text style={styles.statLabel}>Drafts</Text>
            </View>
            <View style={styles.statCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{stats.pendingContents}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Recent Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Content</Text>
          {contents.length > 0 ? (
            contents.map((content) => (
              <View key={content.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>{content.title}</Text>
                    <Text style={styles.contentDescription}>
                      {content.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(content.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{content.status}</Text>
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
                <Text style={styles.contentDate}>
                  {new Date(content.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No content yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first piece of content to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.emptyButtonText}>Create Content</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  },
  contentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
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
  contentDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});