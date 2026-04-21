import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function SensorDebug() {
  // stores the latest accelerometer reading (x, y, z)
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  // stores the latest gyroscope reading (x, y, z)
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
  // controls whether sensors are active or not
  const [enabled, setEnabled] = useState(true);
  // refs to hold the sensor subscriptions so we can stop them later
  const accelSub = useRef(null);
  const gyroSub = useRef(null);

  useEffect(() => {
    if (enabled) {
      // update every 100ms (10 times per second)
      Accelerometer.setUpdateInterval(100);
      Gyroscope.setUpdateInterval(100);
      // start listening and save the subscription so we can remove it later
      accelSub.current = Accelerometer.addListener(setAccel);
      gyroSub.current = Gyroscope.addListener(setGyro);
    } else {
      // user turned the switch off so stop both sensors
      if (accelSub.current) accelSub.current.remove();
      if (gyroSub.current) gyroSub.current.remove();
    }
    // cleanup runs when the screen is closed or enabled changes
    return () => {
      if (accelSub.current) accelSub.current.remove();
      if (gyroSub.current) gyroSub.current.remove();
    };
  }, [enabled]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Debug</Text>

      {/* toggle to turn sensors on and off */}
      <View style={styles.row}>
        <Text style={styles.label}>Sensors On</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>

      {/* live accelerometer values - used to detect the cast flick gesture */}
      <Text style={styles.sectionTitle}>Accelerometer</Text>
      <Text style={styles.valueText}>X: {accel.x.toFixed(3)}  Y: {accel.y.toFixed(3)}  Z: {accel.z.toFixed(3)}</Text>

      {/* live gyroscope values - used to detect left/right tilt for answering */}
      <Text style={styles.sectionTitle}>Gyroscope</Text>
      <Text style={styles.valueText}>X: {gyro.x.toFixed(3)}  Y: {gyro.y.toFixed(3)}  Z: {gyro.z.toFixed(3)}</Text>

      {/* shows a message when the accelerometer Z goes above 2 - same threshold used in the game */}
      <Text style={[styles.castText, { color: Math.abs(accel.z) > 2 ? 'green' : 'gray' }]}>
        {Math.abs(accel.z) > 2 ? 'CAST DETECTED!' : 'Flick the phone forward...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
  },
  valueText: {
    fontSize: 14,
    color: 'gray',
  },
  castText: {
    fontSize: 15,
    marginTop: 20,
  },
});