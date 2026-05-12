// Web stub for react-native-video — renders an HTML <video> element.
// Covers the props and ref API used by ReelsScreen.

import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

export interface VideoRef {
  seek(positionSeconds: number): void;
}

interface VideoProps {
  source: {uri: string};
  style?: any;
  paused?: boolean;
  repeat?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'none';
  poster?: string;
  posterResizeMode?: string;
  onBuffer?: (e: {isBuffering: boolean}) => void;
  onError?: (e: any) => void;
  ignoreSilentSwitch?: string;
  playInBackground?: boolean;
  muted?: boolean;
  volume?: number;
}

const OBJECT_FIT: Record<string, string> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  none: 'none',
};

const Video = forwardRef<VideoRef, VideoProps>(
  (
    {
      source,
      style,
      paused = false,
      repeat = false,
      resizeMode = 'cover',
      poster,
      onBuffer,
      onError,
      muted = false,
      volume = 1,
    },
    ref,
  ) => {
    const videoEl = useRef<HTMLVideoElement | null>(null);

    useImperativeHandle(ref, () => ({
      seek(positionSeconds: number) {
        if (videoEl.current) {
          videoEl.current.currentTime = positionSeconds;
        }
      },
    }));

    useEffect(() => {
      const el = videoEl.current;
      if (!el) return;
      if (paused) {
        el.pause();
      } else {
        el.play().catch(() => {});
      }
    }, [paused]);

    useEffect(() => {
      if (videoEl.current) {
        videoEl.current.volume = volume ?? 1;
      }
    }, [volume]);

    const flat = StyleSheet.flatten(style) ?? {};

    return (
      <View style={style} pointerEvents="none">
        <video
          ref={videoEl}
          src={source.uri}
          poster={poster}
          loop={repeat}
          muted={muted}
          playsInline
          autoPlay={!paused}
          onWaiting={() => onBuffer?.({isBuffering: true})}
          onPlaying={() => onBuffer?.({isBuffering: false})}
          onError={e => onError?.(e)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: flat.width ?? '100%',
            height: flat.height ?? '100%',
            objectFit: (OBJECT_FIT[resizeMode] ?? 'cover') as any,
            background: '#000',
          }}
        />
      </View>
    );
  },
);

Video.displayName = 'Video';
export default Video;
