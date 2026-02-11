import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Alert, Platform } from 'react-native';
import { reportError } from './logger';

export interface ShareImageOptions {
  eventName: string;
  saveToLibrary?: boolean;
}

export async function captureAndShareCard(
  viewRef: React.RefObject<any>,
  options: ShareImageOptions
): Promise<{ success: boolean; uri?: string }> {
  try {
    if (!viewRef.current) {
      throw new Error('View reference is null');
    }

    // Capture the view as image
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    
    // Save to camera roll if requested
    if (options.saveToLibrary && Platform.OS !== 'web') {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert(
            'Saved!',
            'Your Brewmaster card has been saved to your photos.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable photo library access in Settings to save images.',
            [{ text: 'OK' }]
          );
        }
      } catch (saveError) {
        reportError(saveError as Error, {
          scope: 'shareImage',
          action: 'saveToLibrary',
        });
      }
    }
    
    // Share via native share sheet
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${options.eventName} Results`,
      });
    } else {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device.',
        [{ text: 'OK' }]
      );
    }
    
    return { success: true, uri };
  } catch (error) {
    reportError(error as Error, {
      scope: 'shareImage',
      action: 'captureAndShare',
    });
    
    Alert.alert('Error', 'Failed to share image. Please try again.');
    return { success: false };
  }
}

export async function captureView(
  viewRef: React.RefObject<any>,
  options?: {
    format?: 'png' | 'jpg';
    quality?: number;
  }
): Promise<string | null> {
  try {
    if (!viewRef.current) {
      throw new Error('View reference is null');
    }

    const uri = await captureRef(viewRef, {
      format: options?.format || 'png',
      quality: options?.quality || 1,
      result: 'tmpfile',
    });
    
    return uri;
  } catch (error) {
    reportError(error as Error, {
      scope: 'shareImage',
      action: 'captureView',
    });
    return null;
  }
}
