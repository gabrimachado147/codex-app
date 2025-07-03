import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Wand2, Sparkles, Brain, Target, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAI, AIStyle, AISuggestionType } from '@/hooks/useAI';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface AIAssistantProps {
  contentId: string;
  currentText: string;
  onSuggestionApplied: (text: string) => void;
}

export function AIAssistant({ contentId, currentText, onSuggestionApplied }: AIAssistantProps) {
  const { colors } = useTheme();
  const { generateSuggestion, loading } = useAI();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AIStyle>('professional');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const styles = createStyles(colors);

  const handleGenerateSuggestion = async (type: AISuggestionType) => {
    const suggestion = await generateSuggestion(contentId, type, currentText, selectedStyle);
    if (suggestion) {
      setSuggestions(prev => [...prev, suggestion]);
    }
  };

  const applySuggestion = (suggestedText: string) => {
    onSuggestionApplied(suggestedText);
    setModalVisible(false);
  };

  const styles_data = [
    { key: 'professional' as AIStyle, label: 'Professional', icon: Target, color: colors.primary },
    { key: 'witty' as AIStyle, label: 'Witty', icon: Brain, color: colors.secondary },
    { key: 'playful' as AIStyle, label: 'Playful', icon: Sparkles, color: colors.success },
  ];

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        style={styles.triggerButton}
      >
        <Wand2 size={20} color={colors.primary} />
        <Text style={styles.triggerText}>AI Assistant</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View entering={SlideInUp.duration(300)} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Assistant</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Style Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Writing Style</Text>
                <View style={styles.styleGrid}>
                  {styles_data.map((style) => {
                    const IconComponent = style.icon;
                    return (
                      <TouchableOpacity
                        key={style.key}
                        onPress={() => setSelectedStyle(style.key)}
                        style={[
                          styles.styleButton,
                          selectedStyle === style.key && { 
                            backgroundColor: style.color,
                            borderColor: style.color 
                          }
                        ]}
                      >
                        <IconComponent 
                          size={20} 
                          color={selectedStyle === style.key ? colors.surface : style.color} 
                        />
                        <Text style={[
                          styles.styleText,
                          selectedStyle === style.key && { color: colors.surface }
                        ]}>
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Suggestion Types */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generate Suggestions</Text>
                <View style={styles.suggestionGrid}>
                  <TouchableOpacity
                    onPress={() => handleGenerateSuggestion('title')}
                    style={styles.suggestionButton}
                    disabled={loading}
                  >
                    <Text style={styles.suggestionButtonText}>Improve Title</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleGenerateSuggestion('description')}
                    style={styles.suggestionButton}
                    disabled={loading}
                  >
                    <Text style={styles.suggestionButtonText}>Enhance Description</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleGenerateSuggestion('tags')}
                    style={styles.suggestionButton}
                    disabled={loading}
                  >
                    <Text style={styles.suggestionButtonText}>Suggest Tags</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleGenerateSuggestion('optimization')}
                    style={styles.suggestionButton}
                    disabled={loading}
                  >
                    <Text style={styles.suggestionButtonText}>Optimization Tips</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Suggestions List */}
              {suggestions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Suggestions</Text>
                  {suggestions.map((suggestion, index) => (
                    <Animated.View 
                      key={suggestion.id} 
                      entering={FadeIn.delay(index * 100)}
                      style={styles.suggestionCard}
                    >
                      <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionType}>
                          {suggestion.suggestion_type.charAt(0).toUpperCase() + 
                           suggestion.suggestion_type.slice(1)}
                        </Text>
                        <Text style={styles.confidenceScore}>
                          {Math.round(suggestion.confidence_score * 100)}% confidence
                        </Text>
                      </View>
                      <Text style={styles.suggestionText}>
                        {suggestion.suggested_text}
                      </Text>
                      <TouchableOpacity
                        onPress={() => applySuggestion(suggestion.suggested_text)}
                        style={styles.applyButton}
                      >
                        <Text style={styles.applyButtonText}>Apply Suggestion</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  triggerText: {
    color: colors.primary,
    fontSize: 14,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  styleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  styleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: '48%',
  },
  suggestionButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  confidenceScore: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  applyButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '500',
  },
});