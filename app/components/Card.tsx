import React from 'react';
import StyledView from './StyledView';
import { ViewProps } from 'react-native';
import { useMaterialYouColors } from '../../lib/hooks/MaterialYouProvider';
import { M3Elevation } from '../../lib/design/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, style, ...props }) => {
  const colors = useMaterialYouColors();

  return (
    <StyledView
      className={`p-4 ${className}`}
      style={[
        {
          backgroundColor: colors.surfaceContainer,
          borderRadius: 16,
          ...M3Elevation.level2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </StyledView>
  );
};

export default Card;
