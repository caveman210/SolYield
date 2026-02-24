import React from 'react';
import { ScrollView, View } from 'react-native';
import StyledView from '../components/StyledView';
import StyledText from '../components/StyledText';
import Card from '../components/Card';
import Icon from '../../lib/theme/icons';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Typography } from '../../lib/design/tokens';

const Dashboard = () => {
  const colors = useMaterialYouColors();

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <StyledText style={{ 
          ...M3Typography.headline.medium, 
          color: colors.onSurface, 
          marginBottom: 16 
        }}>
          Dashboard
        </StyledText>
        <Card>
          <StyledText style={{ 
            ...M3Typography.title.large, 
            color: colors.onSurface, 
            marginBottom: 8 
          }}>
            Welcome Back!
          </StyledText>
          <StyledText style={{ color: colors.onSurfaceVariant }}>
            Here's a summary of your activity.
          </StyledText>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <Card style={{ flex: 1, marginRight: 8 }}>
            <Icon name="CalendarMonth" size="large" color={colors.primary} />
            <StyledText style={{ 
              ...M3Typography.title.medium, 
              color: colors.onSurface, 
              marginTop: 8 
            }}>
              Today's Visits
            </StyledText>
            <StyledText style={{ color: colors.primary }}>
              3 sites
            </StyledText>
          </Card>
          <Card style={{ flex: 1, marginLeft: 8 }}>
            <Icon name="ShowChart" size="large" color={colors.primary} />
            <StyledText style={{ 
              ...M3Typography.title.medium, 
              color: colors.onSurface, 
              marginTop: 8 
            }}>
              Performance
            </StyledText>
            <StyledText style={{ color: colors.primary }}>
              85%
            </StyledText>
          </Card>
        </View>

        <Card style={{ marginTop: 16 }}>
          <StyledText style={{ 
            ...M3Typography.title.large, 
            color: colors.onSurface, 
            marginBottom: 8 
          }}>
            Recent Activity
          </StyledText>
          <StyledText style={{ color: colors.onSurfaceVariant }}>
            - Site A inspection completed.
          </StyledText>
          <StyledText style={{ color: colors.onSurfaceVariant }}>
            - Site B maintenance scheduled.
          </StyledText>
        </Card>
      </View>
    </ScrollView>
  );
};

export default Dashboard;
