import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Send, Reply, MoreVertical, Trash2 } from 'lucide-react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  comment: string;
  parent_id: string | null;
  created_at: string;
  user?: {
    email: string;
  };
  replies?: Comment[];
}

interface CommentsThreadProps {
  contentId: string;
  visible: boolean;
  onClose: () => void;
}

export function CommentsThread({ contentId, visible, onClose }: CommentsThreadProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible, contentId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('content_comments')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentsMap = new Map();
      const rootComments: Comment[] = [];

      data?.forEach((comment) => {
        commentsMap.set(comment.id, { ...comment, replies: [] });
      });

      data?.forEach((comment) => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentsMap.get(comment.id));
          }
        } else {
          rootComments.push(commentsMap.get(comment.id));
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('content_comments')
        .insert({
          content_id: contentId,
          user_id: user.id,
          comment: newComment.trim(),
          parent_id: replyingTo,
        });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('content_comments')
                .delete()
                .eq('id', commentId);

              if (error) throw error;
              await fetchComments();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <Animated.View
      key={comment.id}
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
      style={[styles.commentContainer, isReply && styles.replyContainer]}
    >
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {comment.user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {comment.user?.email?.split('@')[0] || 'Unknown User'}
            </Text>
            <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
          </View>
        </View>
        
        {comment.user_id === user?.id && (
          <TouchableOpacity
            onPress={() => deleteComment(comment.id)}
            style={styles.deleteButton}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.commentText}>{comment.comment}</Text>

      {!isReply && (
        <TouchableOpacity
          onPress={() => setReplyingTo(comment.id)}
          style={styles.replyButton}
        >
          <Reply size={16} color={colors.primary} />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => renderComment(reply, true))}
        </View>
      )}
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageCircle size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Comments</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.commentsContainer}>
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptyDescription}>
              Be the first to leave a comment on this content
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Replying to comment...
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.cancelReplyText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={addComment}
            disabled={!newComment.trim() || loading}
            style={[
              styles.sendButton,
              (!newComment.trim() || loading) && styles.sendButtonDisabled,
            ]}
          >
            <Send size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    backgroundColor: colors.background,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelReplyText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});