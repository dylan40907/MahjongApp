import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const DetectScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const pickImage = async () => {
    // Request permission to access the media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access media library is required!');
      return;
    }

    // Launch the image library to pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      detectMahjongTiles(result.assets[0].uri);
    }
  };

  const detectMahjongTiles = async (imageUri: string) => {
    try {
      // Convert the image to base64 format
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send the image to Roboflow API for detection
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/mahjong-tiles-model/2", // Replace with your actual model endpoint
        params: {
          api_key: "kBTLG5qTaHdBEAasikao", // Replace with your actual API key
        },
        data: imageBase64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Set the detection result state with the response data
      setDetectionResult(response.data);
    } catch (error) {
      console.error("Error detecting tiles:", (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image" onPress={pickImage} />
      {selectedImage && <Image source={{ uri: selectedImage }} style={styles.image} />}
      {detectionResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Detection Results:</Text>
          <Text style={styles.resultText}>{JSON.stringify(detectionResult, null, 2)}</Text>
        </View>
      )}
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
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 20,
  },
  resultText: {
    textAlign: 'center',
  },
});

export default DetectScreen;
