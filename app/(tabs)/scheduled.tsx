import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useScheduling } from '@/hooks/useScheduling';
import { Clock } from 'lucide-react-native';
import { format } from 'date-fns';

export default function ScheduledScreen() {
  const { colors } = useTheme();
  const { scheduledPosts, loading, refetch, cancelScheduledPost } = useScheduling();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Scheduled Posts</Text>
        <Text style={styles.headerSubtitle}>
          Manage your upcoming publications
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {scheduledPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No scheduled posts</Text>
          </View>
        ) : (
          scheduledPosts.map(post => (
            <View key={post.id} style={styles.card}>
              <Text style={styles.title}>{post.content?.title}</Text>
              {post.content?.description && (
                <Text style={styles.description}>{post.content.description}</Text>
              )}
              <View style={styles.dateRow}>
                <Clock size={16} color={colors.info} />
                <Text style={styles.dateText}>
                  {format(new Date(post.scheduled_at), 'MMM dd, yyyy HH:mm')}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>{post.status}</Text>
                <TouchableOpacity
                  onPress={() => cancelScheduledPost(post.id)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
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
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    dateText: {
      fontSize: 12,
      color: colors.info,
      fontWeight: '500',
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    cancelText: {
      fontSize: 12,
      color: colors.error,
      fontWeight: '500',
    },
  });

