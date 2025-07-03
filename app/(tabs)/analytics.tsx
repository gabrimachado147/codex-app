import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Eye,
  Heart,
  Share,
  MessageCircle
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { data, loading, error, refetch } = useAnalytics();

  const styles = createStyles(colors);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    change, 
    color 
  }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        {change && (
          <Text style={[styles.changeText, { color }]}>
            {change}
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your content performance</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard
              icon={FileText}
              title="Total Content"
              value={data?.totalContents || 0}
              change="+12%"
              color={colors.primary}
            />
            <StatCard
              icon={TrendingUp}
              title="Published"
              value={data?.publishedContents || 0}
              change="+8%"
              color={colors.success}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Clock}
              title="Drafts"
              value={data?.draftContents || 0}
              color={colors.warning}
            />
            <StatCard
              icon={Eye}
              title="Total Views"
              value={data?.totalViews || 0}
              change="+24%"
              color={colors.info}
            />
          </View>
        </View>

        {/* Charts */}
        {data && (
          <>
            <AnalyticsChart
              type="line"
              data={data.postsPerDay.map(item => ({
                value: item.count,
                label: item.date,
              }))}
              title="Posts Per Day (Last 30 Days)"
              height={200}
            />

            <AnalyticsChart
              type="pie"
              data={data.statusDistribution.map((item, index) => ({
                value: item.count,
                label: item.status,
                color: index === 0 ? colors.success : 
                       index === 1 ? colors.warning : colors.info,
              }))}
              title="Content Status Distribution"
              height={200}
            />

            <AnalyticsChart
              type="bar"
              data={data.topTags.map(item => ({
                value: item.count,
                label: item.tag,
              }))}
              title="Top Tags"
              height={200}
            />
          </>
        )}

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement Overview</Text>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementCard}>
              <Heart size={20} color={colors.error} />
              <Text style={styles.engagementValue}>1.2K</Text>
              <Text style={styles.engagementLabel}>Likes</Text>
            </View>
            <View style={styles.engagementCard}>
              <Share size={20} color={colors.primary} />
              <Text style={styles.engagementValue}>342</Text>
              <Text style={styles.engagementLabel}>Shares</Text>
            </View>
            <View style={styles.engagementCard}>
              <MessageCircle size={20} color={colors.secondary} />
              <Text style={styles.engagementValue}>89</Text>
              <Text style={styles.engagementLabel}>Comments</Text>
            </View>
            <View style={styles.engagementCard}>
              <Eye size={20} color={colors.info} />
              <Text style={styles.engagementValue}>5.7K</Text>
              <Text style={styles.engagementLabel}>Views</Text>
            </View>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>🚀 Best Performing Content</Text>
            <Text style={styles.insightText}>
              Posts with images get 3x more engagement than text-only posts
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📈 Growth Trend</Text>
            <Text style={styles.insightText}>
              Your content engagement has increased by 24% this month
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>⏰ Optimal Posting Time</Text>
            <Text style={styles.insightText}>
              Your audience is most active between 2-4 PM on weekdays
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engagementCard: {
    width: (screenWidth - 64) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  engagementLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});