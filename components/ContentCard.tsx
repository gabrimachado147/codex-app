import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, Heart, MessageCircle, Share, MoveVertical as MoreVertical, Calendar, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

interface ContentCardProps {
  content: any;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export function ContentCard({
  content,
  onPress,
  onLongPress,
  isSelected = false,
  selectionMode = false,
  onEdit,
  onDelete,
  onStatusChange,
}: ContentCardProps) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const styles = createStyles(colors);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={16} color={colors.success} />;
      case 'approved':
        return <CheckCircle size={16} color={colors.success} />;
      case 'draft':
        return <Edit3 size={16} color={colors.warning} />;
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

  const handleStatusChange = (newStatus: string) => {
    Alert.alert(
      'Change Status',
      `Change status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onStatusChange?.(newStatus) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
      ]}
    >
      <TouchableOpacity
        onPress={selectionMode ? onLongPress : onPress}
        onLongPress={onLongPress}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.statusContainer}>
              {getStatusIcon(content.status)}
              <Text style={[styles.statusText, { color: getStatusColor(content.status) }]}>
                {content.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(content.created_at)}</Text>
          </View>
          
          {!selectionMode && (
            <TouchableOpacity
              onPress={() => setShowActions(!showActions)}
              style={styles.moreButton}
            >
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {selectionMode && isSelected && (
            <View style={styles.selectionIndicator}>
              <CheckCircle size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {content.title}
          </Text>
          
          {content.description && (
            <Text style={styles.description} numberOfLines={3}>
              {content.description}
            </Text>
          )}

          {/* Media Preview */}
          {content.media && content.media.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.mediaContainer}
            >
              {content.media.map((mediaUrl: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: mediaUrl }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {content.tags.slice(0, 3).map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {content.tags.length > 3 && (
                <Text style={styles.moreTagsText}>
                  +{content.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Scheduled Banner */}
          {content.scheduled_at && (
            <View style={styles.scheduledBanner}>
              <Calendar size={16} color={colors.info} />
              <Text style={styles.scheduledText}>
                Scheduled for {formatDate(content.scheduled_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Eye size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{content.view_count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {Math.round((content.engagement_score || 0) * 100)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MessageCircle size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>0</Text>
            </View>
            <View style={styles.statItem}>
              <Share size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>0</Text>
            </View>
          </View>
          
          <Text style={styles.contentType}>{content.type}</Text>
        </View>

        {/* Action Menu */}
        {showActions && !selectionMode && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.actionsMenu}>
            <TouchableOpacity
              onPress={() => {
                onEdit?.();
                setShowActions(false);
              }}
              style={styles.actionItem}
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                const nextStatus = content.status === 'draft' ? 'pending_approval' : 
                                 content.status === 'pending_approval' ? 'approved' : 
                                 content.status === 'approved' ? 'published' : 'draft';
                handleStatusChange(nextStatus);
                setShowActions(false);
              }}
              style={styles.actionItem}
            >
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.actionText}>Change Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                onDelete?.();
                setShowActions(false);
              }}
              style={styles.actionItem}
            >
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  touchable: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: 4,
  },
  selectionIndicator: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  mediaImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  scheduledText: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  contentType: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actionsMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    minWidth: 120,
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});