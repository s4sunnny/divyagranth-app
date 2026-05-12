import React from 'react';

interface SliderProps {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
}

const Slider: React.FC<SliderProps> = ({
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  onSlidingComplete,
  thumbTintColor = '#007aff',
  style,
}) => (
  <input
    type="range"
    min={minimumValue}
    max={maximumValue}
    step={0.1}
    value={value}
    onChange={e => onSlidingComplete?.(Number(e.target.value))}
    style={{width: '100%', accentColor: thumbTintColor, cursor: 'pointer', ...style}}
  />
);

export default Slider;
