import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import PermissionsButton from './PermissionsButton';
import dayjs from 'dayjs';
import Storage from './storage';

const BACKGROUND_FETCH_TASK = 'background-fetch';
const LOCATION_TASK_NAME = 'background-location-task';

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const position = await getCurrentLocation();
  console.log('🚀 ~ file: App.tsx:16 ~ TaskManager.defineTask ~ position:', JSON.stringify(position));
  // const address = await Location.reverseGeocodeAsync({
  //   longitude: position.coords.longitude,
  //   latitude: position.coords.latitude,
  // });

  // console.log(
  //   `${dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')}： ${address[0].city}${address[0].district}${address[0].name}`
  // );
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
  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

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

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function registerBackgroundFetchAsync() {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME);
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function unregisterBackgroundFetchAsync() {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<BackgroundFetch.BackgroundFetchStatus | null>(null);
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    checkStatusAsync();
    handleGetLocationPermissionsAsync();
    handleGetLogs();
  }, []);

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  const handleGetLocationPermissionsAsync = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('位置权限已获取');
      } else {
        console.log('后台权限未获得');
      }
    } else {
      console.log('前台定位权限未获得');
    }
  };

  const handleGetLogs = async () => {
    setInterval(async () => {
      const datas = await Storage.get('_Location_List');

      if (datas) {
        setList(datas);
      }
    }, 1000);
  };

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  const handleClear = async () => {
    await Storage.clear();
    setList([]);
  };

  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior='automatic'>
        <View style={styles.screen}>
          <View style={styles.textContainer}>
            <Text>
              Background fetch status:{' '}
              <Text style={styles.boldText}>{status && BackgroundFetch.BackgroundFetchStatus[status]}</Text>
            </Text>
            <Text>
              Background fetch task name:{' '}
              <Text style={styles.boldText}>{isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}</Text>
            </Text>
          </View>
          <View style={styles.textContainer}></View>
          <Button
            title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
            onPress={toggleFetchTask}
          />
          <PermissionsButton />
          <View style={styles.logBox}>
            <Button title='清空记录' onPress={handleClear} />
            {list.map((item, index) => {
              return <Text key={index}>{item}</Text>;
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  logBox: {
    marginTop: 20,
  },
});
