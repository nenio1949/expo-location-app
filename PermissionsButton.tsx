import React, { useEffect, useState } from 'react';
import { Button, View, StyleSheet, Text } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import Storage from './storage';
// import { Geolocation, init } from 'react-native-amap-geolocation';
import dayjs from 'dayjs';

const LOCATION_TASK_NAME = 'background-location-task';

const PermissionsButton = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    handleInit();
  }, []);

  const handleInit = async () => {
    // await init({
    //   ios: '7e093314aa6a992caf723982e6cd8bff',
    //   android: 'aebbfb62111d3745f679d1119610c012',
    // });
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)) {
      setIsRegistered(true);
    } else {
      setIsRegistered(false);
    }
  };

  const handleLocation = async () => {
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsRegistered(false);
      console.log('关闭定位');
    } else {
      requestPermissions();
    }
  };

  async function getCurrentLocation() {
    const timeout = 10000;
    return new Promise<Location.LocationObject | null>(async (resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Error getting gps location after ${(timeout * 2) / 1000} s`));
      }, timeout * 2);
      setTimeout(async () => {
        resolve(await Location.getLastKnownPositionAsync());
      }, timeout);
      resolve(await Location.getCurrentPositionAsync());
    });
  }

  const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    console.log('前台定位权限', foregroundStatus);
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        const position = await getCurrentLocation();

        console.log('5555', position);
        const datas = await Storage.get('_Location_List');
        if (!datas) {
          await Storage.set('_Location_List', [
            `${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')}  经度：${position?.coords?.longitude}，纬度：${
              position?.coords?.latitude
            }`,
          ]);
        } else {
          datas.push(
            `${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')}  经度：${position?.coords?.longitude}，纬度：${
              position?.coords?.latitude
            }`
          );
          await Storage.set('_Location_List', [...datas]);
        }
        // if (position) {
        //   const address = await Location.reverseGeocodeAsync({
        //     longitude: position.coords.longitude,
        //     latitude: position.coords.latitude,
        //   });

        //   console.log('333', address);

        //   console.log(`当前位置：${address[0].city}${address[0].district}${address[0].name}`);
        // }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationBox}>
        <Button title='获取位置' onPress={requestPermissions} />
        {list.map((item, index) => {
          return <Text key={index}>当前位置：{item}</Text>;
        })}
      </View>
    </View>
  );
};

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    // const { locations } = data;
    console.log('🚀 ~ file: PermissionsButton.tsx:33 ~ TaskManager.defineTask ~ locations:', JSON.stringify(data));
    // do something with the locations captured in the background
  }
});

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    textAlign: 'center',
  },
  locationBox: {
    marginTop: 20,
  },
});

export default PermissionsButton;
