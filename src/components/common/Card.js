import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';

export const Card = ({ children, style, isDarkMode = false, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: isDarkMode ? COLORS.background.dark : COLORS.background.light,
          borderWidth: 1,
          borderColor: isDarkMode ? COLORS.gray.dark : COLORS.gray.light,
        };
      case 'elevated':
        return {
          backgroundColor: isDarkMode ? COLORS.background.dark : COLORS.background.light,
          ...(isDarkMode ? SHADOWS.dark : SHADOWS.light),
        };
      default:
        return {
          backgroundColor: isDarkMode ? COLORS.background.dark : COLORS.background.light,
          borderWidth: 1,
          borderColor: isDarkMode ? COLORS.gray.dark : COLORS.gray.light,
        };
    }
  };

  return <View style={[styles.card, getVariantStyles(), style]}>{children}</View>;
};

export const CardTitle = ({ children, style, isDarkMode = false }) => (
  <Text style={[styles.title, { color: isDarkMode ? COLORS.text.dark : COLORS.text.light }, style]}>
    {children}
  </Text>
);

export const CardSubtitle = ({ children, style, isDarkMode = false }) => (
  <Text
    style={[styles.subtitle, { color: isDarkMode ? COLORS.gray.dark : COLORS.gray.light }, style]}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
});
