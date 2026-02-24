import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SITES } from '../../lib/data/sites';
import { Site } from '../../lib/types';
import { M3Motion } from '../../lib/design';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SitesScreen() {
  const router = useRouter();
  const colors = useMaterialYouColors();

  const renderSite = ({ item, index }: { item: Site; index: number }) => (
    <AnimatedTouchableOpacity
      entering={FadeInUp.duration(M3Motion.duration.medium).delay(index * 50)}
      style={[
        styles.siteCard,
        {
          backgroundColor: colors.surfaceContainer,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={() => router.push(`/site/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.siteHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
          <Ionicons name="sunny" size={28} color={colors.primary} />
        </View>
        <View style={styles.siteInfo}>
          <Text style={[styles.siteName, { color: colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.siteCapacity, { color: colors.primary }]}>{item.capacity}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.outline} />
      </View>
      <View style={[styles.locationContainer, { backgroundColor: colors.surfaceContainerLow }]}>
        <Ionicons name="location" size={16} color={colors.outline} style={styles.locationIcon} />
        <Text style={[styles.locationText, { color: colors.onSurfaceVariant }]}>
          {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Animated.Text
          entering={FadeInUp.duration(M3Motion.duration.medium)}
          style={[styles.headerTitle, { color: colors.onSurface }]}
        >
          Solar Sites
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.duration(M3Motion.duration.medium).delay(50)}
          style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}
        >
          {SITES.length} active solar parks
        </Animated.Text>
      </View>
      <FlatList
        data={SITES}
        renderItem={renderSite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  siteCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 22,
    fontWeight: '400',
    marginBottom: 4,
  },
  siteCapacity: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
  },
});
