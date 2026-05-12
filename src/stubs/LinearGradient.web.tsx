import React from 'react';
import {View} from 'react-native';

interface Props {
  colors: string[];
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  style?: any;
  children?: React.ReactNode;
}

const LinearGradient: React.FC<Props> = ({
  colors,
  start = {x: 0.5, y: 0},
  end = {x: 0.5, y: 1},
  style,
  children,
}) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // CSS 0deg = upward; add 90 to convert from math atan2 convention.
  const deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  const gradient = `linear-gradient(${deg}deg, ${colors.join(', ')})`;

  return (
    <View style={[style, {background: gradient} as any]}>{children}</View>
  );
};

export default LinearGradient;
