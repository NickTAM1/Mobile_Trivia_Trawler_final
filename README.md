# Trivia Trawler 🎣

A fishing-themed True/False trivia game built with React Native (Expo).

## How to Play

1. Open the app and tap **Cast Your Line** (or flick your phone forward)
2. A trivia question appears
3. Tilt your phone **right for TRUE** or **left for FALSE**
4. See if you caught it or it got away!

## Features

- Motion controls using accelerometer and gyroscope
- True/False trivia questions from Open Trivia Database
- Login to save your best score to the cloud
- Best score also saved locally without needing to log in

## Screens

- **Game** — main trivia gameplay
- **Sensors** — live sensor debug screen with on/off toggle
- **Login** — register, log in, and log out

## Tech Stack

- React Native / Expo Snack
- expo-sensors (Accelerometer + Gyroscope)
- OpenTDB API (https://opentdb.com)
- Firebase v8 (Authentication + Firestore)
- AsyncStorage (local score backup)
- React Navigation (bottom tabs)

## Setup

1. Open the project in Expo Snack
2. Make sure these packages are in `package.json`:
   - `firebase: 8.10.0`
   - `expo-sensors`
   - `@react-native-async-storage/async-storage`
   - `@react-navigation/native`
   - `@react-navigation/bottom-tabs`
3. Run the project on your phone using the Expo Go app

## API

Uses Open Trivia Database: https://opentdb.com/api.php?amount=10&type=boolean