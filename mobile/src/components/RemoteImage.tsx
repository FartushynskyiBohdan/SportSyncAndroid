import { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { buildMediaUrl } from '../api/client';
import { palette } from '../theme/palette';

interface RemoteImageProps {
  uri?: string | null;
  style: StyleProp<ImageStyle>;
  fallbackLabel?: string | null;
  fallbackStyle?: StyleProp<ViewStyle>;
}

export function RemoteImage({ uri, style, fallbackLabel, fallbackStyle }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedUri = uri ? buildMediaUrl(uri) : '';

  useEffect(() => {
    setFailed(false);
  }, [resolvedUri]);

  if (!resolvedUri || failed) {
    return (
      <View style={[style as StyleProp<ViewStyle>, styles.fallback, fallbackStyle]}>
        <Text style={styles.fallbackText}>{fallbackLabel?.slice(0, 1).toUpperCase() || 'SS'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142347',
  },
  fallbackText: {
    color: palette.textMuted,
    fontSize: 28,
    fontWeight: '900',
  },
});
