import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAI } from '@/hooks/useAI';
import { useScheduling } from '@/hooks/useScheduling';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { AIAssistant } from '@/components/AIAssistant';
import { ScheduleModal } from '@/components/ScheduleModal';
import { 
  Camera, 
  Image as ImageIcon, 
  Video, 
  Upload, 
  X, 
  Check, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Plus,
  Sparkles,
  Save
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function CreateScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { generateTags } = useAI();
  const { schedulePost } = useScheduling();
  const params = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'post' | 'carousel' | 'video' | 'story'>('post');
  const [media, setMedia] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    if (params.edit) {
      loadContentForEditing(params.edit as string);
    }
  }, [params.edit]);

  const loadContentForEditing = async (contentId: string) => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description || '');
      setContentType(data.type);
      setMedia(data.media || []);
      setTags(data.tags || []);
      setIsEditing(true);
      setEditingId(contentId);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load content for editing');
      router.back();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const uploadMedia = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const { data, error } = await supabase.storage
      .from('contents')
      .upload(`${user?.id}/${fileName}`, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('contents')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleGenerateTags = async () => {
    if (title || description) {
      const suggestedTags = await generateTags(title, description);
      setTags(prev => [...new Set([...prev, ...suggestedTags])]);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (shouldSchedule = false, status = 'draft') => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setUploading(true);
    try {
      // Upload media files
      const uploadedMedia = [];
      for (const uri of media) {
        if (uri.startsWith('http')) {
          // Already uploaded
          uploadedMedia.push(uri);
        } else {
          // New file to upload
          const publicUrl = await uploadMedia(uri);
          uploadedMedia.push(publicUrl);
        }
      }

      const contentData = {
        title,
        description,
        type: contentType,
        media: uploadedMedia,
        tags,
        status: shouldSchedule ? 'pending_approval' : status,
      };

      let content;
      if (isEditing && editingId) {
        // Update existing content
        const { data, error } = await supabase
          .from('contents')
          .update(contentData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        content = data;
      } else {
        // Create new content
        const { data, error } = await supabase
          .from('contents')
          .insert([
            {
              user_id: user?.id,
              ...contentData,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        content = data;
      }

      if (shouldSchedule) {
        setShowScheduleModal(true);
        return content;
      }

      Alert.alert(
        'Success', 
        isEditing ? 'Content updated successfully!' : 'Content created successfully!'
      );
      
      // Reset form
      resetForm();
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSchedule = async (date: Date) => {
    const content = await handleSubmit(true);
    if (content) {
      const success = await schedulePost(content.id, date);
      if (success) {
        Alert.alert('Success', 'Content scheduled successfully!');
        resetForm();
        router.back();
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMedia([]);
    setTags([]);
    setContentType('post');
    setIsEditing(false);
    setEditingId(null);
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView style={styles.camera} type={cameraType}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => {
                // Handle photo capture
                setShowCamera(false);
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
            >
              <Camera size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.surface} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Content' : 'Create Content'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditing ? 'Update your content' : 'Share your story with the world'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Type</Text>
          <View style={styles.typeSelector}>
            {(['post', 'carousel', 'video', 'story'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  contentType === type && styles.typeButtonActive,
                ]}
                onPress={() => setContentType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    contentType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter content title"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description</Text>
            <AIAssistant
              contentId={editingId || "new"}
              currentText={description}
              onSuggestionApplied={setDescription}
            />
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter content description"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Tags</Text>
            <TouchableOpacity onPress={handleGenerateTags} style={styles.generateTagsButton}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.generateTagsText}>AI Generate</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addTag}
            />
            <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <X size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Media Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Media</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <ImageIcon size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
              <Camera size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Media Preview */}
          {media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.mediaPreview}>
                {media.map((uri, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMedia(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.draftButton]}
              onPress={() => handleSubmit(false, 'draft')}
              disabled={uploading}
            >
              <Save size={20} color={colors.surface} />
              <Text style={styles.actionButtonText}>
                {uploading ? 'Saving...' : 'Save Draft'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={() => setShowScheduleModal(true)}
              disabled={uploading}
            >
              <Calendar size={20} color={colors.surface} />
              <Text style={styles.actionButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={() => handleSubmit(false, 'pending_approval')}
            disabled={uploading}
          >
            {uploading ? (
              <Upload size={20} color={colors.surface} />
            ) : (
              <Check size={20} color={colors.surface} />
            )}
            <Text style={styles.actionButtonText}>
              {uploading ? 'Publishing...' : 'Submit for Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
      />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerText: {
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.surface,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  generateTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  generateTagsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 8,
  },
  tagInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  mediaPreview: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  draftButton: {
    backgroundColor: colors.textSecondary,
  },
  scheduleButton: {
    backgroundColor: colors.warning,
  },
  publishButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#ccc',
  },
});