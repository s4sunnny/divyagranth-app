// Web version of react-native-vector-icons/MaterialCommunityIcons.
// Loads the TTF font via a dynamic @font-face rule, then renders each icon
// as a Text span using its Unicode code point from the glyph map.

import React, {useEffect, useRef} from 'react';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const glyphMap: Record<string, number> = require('react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fontUrl: string = require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf');

let fontInjected = false;
function injectFont() {
  if (fontInjected || typeof document === 'undefined') {
    return;
  }
  fontInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('${fontUrl}') format('truetype');
      font-display: block;
    }
  `;
  document.head.appendChild(style);
}

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({name, size = 24, color = '#000', style}) => {
  const injectedRef = useRef(false);
  if (!injectedRef.current) {
    injectFont();
    injectedRef.current = true;
  }

  const code = glyphMap[name];
  const char = code != null ? String.fromCodePoint(code) : '?';

  return (
    <span
      style={{
        fontFamily: 'MaterialCommunityIcons',
        fontSize: size,
        color,
        lineHeight: 1,
        display: 'inline-block',
        userSelect: 'none',
        ...style,
      }}>
      {char}
    </span>
  );
};

export default Icon;
