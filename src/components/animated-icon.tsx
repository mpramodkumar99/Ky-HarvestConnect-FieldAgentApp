import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function AnimatedSplashOverlay() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue:         0,
        duration:        500,
        useNativeDriver: true,
      }).start();
    }, 400);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity }]}>
      <View style={styles.iconRing}>
        <Animated.Text style={styles.icon}>🦊</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay:  { backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', zIndex: 9998 },
  iconRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: 52 },
});
