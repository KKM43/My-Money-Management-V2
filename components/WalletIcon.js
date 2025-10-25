import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LightTheme } from '../theme';

export default function WalletIcon({ 
  size = 60, 
  color = 'white', 
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  style = {},
  showBackground = true 
}) {
  return (
    <View style={[
      styles.container,
      showBackground && {
        backgroundColor,
        width: size + 20,
        height: size + 20,
        borderRadius: (size + 20) / 2,
      },
      style
    ]}>
      <Ionicons 
        name="wallet" 
        size={size} 
        color={color} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
