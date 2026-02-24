import { Platform } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

export const theme = {
  colors: {
    primary: '#005B41',
    secondary: '#008170',
    background: '#F0F4F8',
    text: '#333333',
    white: '#FFFFFF',
    gray: '#BDBDBD',
    lightGray: '#E0E0E0',
    darkGray: '#4F4F4F',
    success: '#27AE60',
    error: '#EB5757',
    warning: '#F2C94C',
  },
  spacing: {
    xs: moderateScale(4),
    s: moderateScale(8),
    m: moderateScale(16),
    l: moderateScale(24),
    xl: moderateScale(32),
  },
  typography: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    fontSize: {
      s: moderateScale(12),
      m: moderateScale(16),
      l: moderateScale(20),
      xl: moderateScale(24),
    },
    fontWeight: {
      light: '300' as '300',
      regular: '400' as '400',
      bold: '700' as '700',
    },
  },
  borderRadius: {
    s: scale(4),
    m: scale(8),
    l: scale(16),
  },
  elevation: {
    s: 2,
    m: 4,
    l: 8,
  },
  verticalScale,
  moderateScale,
  scale,
};
