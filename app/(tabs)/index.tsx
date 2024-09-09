import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, ScrollView, Alert, Platform, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// Define the valid tile class names as a TypeScript union type (no 0b)
type TileClass = "1m" | "1p" | "1s" | "1z" | "2m" | "2p" | "2s" | "2z" |
                 "3m" | "3p" | "3s" | "3z" | "4m" | "4p" | "4s" | "4z" | 
                 "5m" | "5p" | "5s" | "5z" | "6m" | "6p" | "6s" | "6z" |
                 "7m" | "7p" | "7s" | "7z" | "8m" | "8p" | "8s" | "9m" | "9p" | "9s";

// Map tile class names to their image paths (from tileicons folder with lowercase i)
const tileMap: Record<TileClass, any> = {
  "1m": require('../../assets/images/tileicons/1m.png'),
  "1p": require('../../assets/images/tileicons/1p.png'),
  "1s": require('../../assets/images/tileicons/1s.png'),
  "1z": require('../../assets/images/tileicons/1z.png'),
  "2m": require('../../assets/images/tileicons/2m.png'),
  "2p": require('../../assets/images/tileicons/2p.png'),
  "2s": require('../../assets/images/tileicons/2s.png'),
  "2z": require('../../assets/images/tileicons/2z.png'),
  "3m": require('../../assets/images/tileicons/3m.png'),
  "3p": require('../../assets/images/tileicons/3p.png'),
  "3s": require('../../assets/images/tileicons/3s.png'),
  "3z": require('../../assets/images/tileicons/3z.png'),
  "4m": require('../../assets/images/tileicons/4m.png'),
  "4p": require('../../assets/images/tileicons/4p.png'),
  "4s": require('../../assets/images/tileicons/4s.png'),
  "4z": require('../../assets/images/tileicons/4z.png'),
  "5m": require('../../assets/images/tileicons/5m.png'),
  "5p": require('../../assets/images/tileicons/5p.png'),
  "5s": require('../../assets/images/tileicons/5s.png'),
  "5z": require('../../assets/images/tileicons/5z.png'),
  "6m": require('../../assets/images/tileicons/6m.png'),
  "6p": require('../../assets/images/tileicons/6p.png'),
  "6s": require('../../assets/images/tileicons/6s.png'),
  "6z": require('../../assets/images/tileicons/6z.png'),
  "7m": require('../../assets/images/tileicons/7m.png'),
  "7p": require('../../assets/images/tileicons/7p.png'),
  "7s": require('../../assets/images/tileicons/7s.png'),
  "7z": require('../../assets/images/tileicons/7z.png'),
  "8m": require('../../assets/images/tileicons/8m.png'),
  "8p": require('../../assets/images/tileicons/8p.png'),
  "8s": require('../../assets/images/tileicons/8s.png'),
  "9m": require('../../assets/images/tileicons/9m.png'),
  "9p": require('../../assets/images/tileicons/9p.png'),
  "9s": require('../../assets/images/tileicons/9s.png')
};

const DetectScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tilesArray, setTilesArray] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      console.log('Image selected:', result.assets[0].uri);
      detectMahjongTiles(result.assets[0].uri);
    }
  };

  const detectMahjongTiles = async (imageUri: string) => {
    try {
      console.log('Starting detection process...');
      setLoading(true); // Start loading
      setTilesArray([]); // Clear previous tiles array

      let imageBase64;
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        imageBase64 = await convertBlobToBase64(blob);
      } else {
        imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      console.log('Sending image to API...');
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/mahjong-tiles-model/2", // Adjust API endpoint
        params: {
          api_key: "kBTLG5qTaHdBEAasikao", // Your actual API key
        },
        data: imageBase64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.data && response.data.predictions) {
        console.log('API response received:', response.data);

        // Sort the predictions by their `x` coordinate (left to right)
        const sortedTiles = response.data.predictions.sort((a: any, b: any) => a.x - b.x);
        setTilesArray(sortedTiles); // Store sorted tiles in state
      } else {
        Alert.alert("No predictions found.");
        console.log('No predictions found in API response.');
      }

    } catch (error) {
      console.error("Error detecting tiles:", (error as Error).message);
      Alert.alert("Error", "There was an error processing the image.");
    } finally {
      setLoading(false); // End loading
      console.log('Detection process completed.');
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const renderDetectedTiles = () => {
    if (!tilesArray.length) return null;

    return tilesArray.map((tile: any, index: number) => {
      // Ensure the tile class is mapped correctly and does not conflict with JSX keywords
      const tileClass = tile.class as TileClass; // Change class to tileClass
      const tilePath = tileMap[tileClass];

      return tilePath ? (
        <View key={index} style={styles.tileContainer}>
          <Image source={tilePath} style={styles.tileImage} />
        </View>
      ) : (
        <Text key={index} style={styles.resultText}>{`Tile ${tileClass} not found`}</Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>Pick an image</Text>
      </Pressable>
      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      {loading && <Text style={styles.loadingText}>Processing image...</Text>}
      <ScrollView contentContainerStyle={styles.tilesContainer}>
        {renderDetectedTiles()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 300,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FF5733',
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tileContainer: {
    margin: 5,
  },
  tileImage: {
    width: 80,
    height: 120,
  },
  resultText: {
    fontSize: 14,
    color: '#333333',
  },
});

export default DetectScreen;
