import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Gyroscope, Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '../firebase';

export default function GamePortal() {
  const [phase, setPhase] = useState('idle'); // idle, casting, waiting, question, result
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0); // session score
  const [bestScore, setBestScore] = useState(0); // best score loaded from Firestore or AsyncStorage
  const [loading, setLoading] = useState(false);
  const [gyroZ, setGyroZ] = useState(0);
  const [currentUser, setCurrentUser] = useState(null); // logged in user or null
  const gyroSub = useRef(null);
  const accelSub = useRef(null);
  const locked = useRef(false);
  const scoreRef = useRef(0); // ref copy of score so async callbacks always have the latest value

  // keep scoreRef in sync with score state
  useEffect(() => { scoreRef.current = score; }, [score]);

  // on app start, load best score from AsyncStorage as a baseline
  useEffect(() => {
    loadLocalBestScore();
  }, []);

  // listen for firebase auth changes to check if someone is logged in
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        // logged in so load from Firestore, which overrides local
        loadScores(user.uid);
      } else {
        // not logged in so just use local AsyncStorage score
        loadLocalBestScore();
      }
    });
    return () => unsubscribe();
  }, []);

  // load best score from AsyncStorage (local, works without login)
  const loadLocalBestScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('bestScore');
      if (saved !== null) {
        setBestScore(parseInt(saved));
      }
    } catch (err) {
      console.log('Could not load local best score:', err.message);
    }
  };

  // save best score to AsyncStorage (local backup)
  const saveLocalBestScore = async (newBest) => {
    try {
      await AsyncStorage.setItem('bestScore', String(newBest));
    } catch (err) {
      console.log('Could not save local best score:', err.message);
    }
  };

  // load best score from Firestore for this user
  const loadScores = async (uid) => {
    try {
      const doc = await firebase.firestore().collection('scores').doc(uid).get();
      if (doc.exists) { setBestScore(doc.data().bestScore || 0); }
    } catch (err) { console.log('Could not load scores:', err.message); }
  };

  // save session score and best score to Firestore and AsyncStorage
  const saveScores = async (newSessionScore) => {
    try {
      const currentBestLocal = await AsyncStorage.getItem('bestScore');
      const localBest = currentBestLocal !== null ? parseInt(currentBestLocal) : 0;
      const newBest = Math.max(localBest, newSessionScore);

      // always save to AsyncStorage as local backup
      await saveLocalBestScore(newBest);
      setBestScore(newBest);

      // also save to Firestore if logged in
      if (currentUser) {
        const uid = currentUser.uid;
        const docRef = firebase.firestore().collection('scores').doc(uid);
        const doc = await docRef.get();
        const firestoreBest = doc.exists ? (doc.data().bestScore || 0) : 0;
        const finalBest = Math.max(firestoreBest, newBest);

        await docRef.set({
          email: currentUser.email,
          sessionScore: newSessionScore,
          bestScore: finalBest,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        setBestScore(finalBest);
      }
    } catch (err) {
      console.log('Could not save score:', err.message);
    }
  };

  // fetch true/false questions from OpenTDB API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=10&type=boolean');
      const data = await res.json();
      setLoading(false);
      if (data.response_code === 0) { return data.results; }
      else { Alert.alert('Error', 'Could not load questions.'); return []; }
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Network error. Check your connection.');
      return [];
    }
  };

  // accelerometer listens for the cast flick gesture
  const startCast = () => {
    setPhase('casting');
    locked.current = false;
    Accelerometer.setUpdateInterval(100);
    accelSub.current = Accelerometer.addListener(({ z }) => {
      if (locked.current) return;
      // big forward flick = z spike above 2
      if (Math.abs(z) > 2) { locked.current = true; stopAccel(); startWaiting(); }
    });
  };

  const stopAccel = () => {
    if (accelSub.current) { accelSub.current.remove(); accelSub.current = null; }
  };

  // load next question from the pool, fetch more if empty
  const startWaiting = async () => {
    setPhase('waiting');
    let pool = questions;
    if (pool.length === 0) { pool = await fetchQuestions(); }
    if (pool.length === 0) { setPhase('idle'); return; }
    const next = pool[0];
    setQuestions(pool.slice(1));
    setQuestion(next);
    locked.current = false;
    setPhase('question');
    startGyro(next);
  };

  // gyroscope listens for tilt left or right to answer
  const startGyro = (q) => {
    Gyroscope.setUpdateInterval(100);
    gyroSub.current = Gyroscope.addListener(({ z }) => {
      setGyroZ(z);
      if (locked.current) return;
      // tilt right = TRUE, tilt left = FALSE
      if (z > 1.5) { locked.current = true; stopGyro(); checkAnswer('True', q); }
      else if (z < -1.5) { locked.current = true; stopGyro(); checkAnswer('False', q); }
    });
  };

  const stopGyro = () => {
    if (gyroSub.current) { gyroSub.current.remove(); gyroSub.current = null; }
  };

  // check the answer, update score, save to AsyncStorage and Firestore
  const checkAnswer = (answer, q) => {
    const correct = answer === q.correct_answer;
    let newScore = scoreRef.current;
    if (correct) { newScore = newScore + 1; setScore(newScore); scoreRef.current = newScore; }
    setResult(correct ? 'correct' : 'wrong');
    setPhase('result');
    // save every time an answer is given
    saveScores(newScore);
  };

  // tap fallback if sensor is not triggered
  const tapAnswer = (answer) => {
    if (phase !== 'question' || locked.current) return;
    locked.current = true; stopGyro(); checkAnswer(answer, question);
  };

  // reset everything back to the start, clears session score
  const reset = () => {
    stopGyro(); stopAccel();
    setPhase('idle'); setResult(null); setQuestion(null);
    locked.current = false; setGyroZ(0); setScore(0); scoreRef.current = 0;
  };

  // decode HTML entities from the API response
  const decode = (str) =>
    str.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');

  return (
    <View style={styles.container}>

      <Text style={styles.scoreText}>Score: {score}  |  Best: {bestScore}</Text>
      <Text style={styles.subText}>
        {currentUser ? `Logged in as ${currentUser.email}` : 'Log in to save your score to the cloud'}
      </Text>

      {phase === 'idle' && (
        <View>
          <Text style={styles.title}>Trivia Trawler 🎣</Text>
          <Text style={styles.subText}>Flick forward to cast, tilt to answer.</Text>
          <TouchableOpacity style={styles.btnBlue} onPress={startCast}>
            <Text style={styles.btnText}>Cast Your Line</Text>
          </TouchableOpacity>
        </View>
      )}


      {phase === 'casting' && (
        <View>
          <Text style={styles.title}>Flick the phone forward!</Text>
          <TouchableOpacity style={styles.btnGray} onPress={() => { locked.current = true; stopAccel(); startWaiting(); }}>
            <Text style={styles.btnText}>Skip Cast</Text>
          </TouchableOpacity>
        </View>
      )}


      {phase === 'waiting' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.subText}>Loading question...</Text>
        </View>
      )}

      {phase === 'question' && question && (
        <View>
          <Text style={styles.subText}>{question.category}</Text>
          <Text style={styles.questionText}>{decode(question.question)}</Text>
          <Text style={styles.subText}>Tilt right = TRUE | Tilt left = FALSE | Gyro Z: {gyroZ.toFixed(2)}</Text>
          <View style={styles.row}>
 
            <TouchableOpacity style={styles.btnGreen} onPress={() => tapAnswer('True')}>
              <Text style={styles.btnText}>TRUE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnRed} onPress={() => tapAnswer('False')}>
              <Text style={styles.btnText}>FALSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === 'result' && (
        <View>
          <Text style={styles.title}>
            {result === 'correct' ? 'You caught it! 🐟' : 'It got away! 🌊'}
          </Text>
          <Text style={styles.subText}>Answer: {question?.correct_answer}</Text>

          <Text style={styles.savedText}>
            {currentUser ? 'Score saved to cloud!' : 'Score saved locally!'}
          </Text>

          <TouchableOpacity style={styles.btnBlue} onPress={() => { setPhase('idle'); setResult(null); locked.current = false; }}>
            <Text style={styles.btnText}>Cast Again</Text>
          </TouchableOpacity>
        
          <TouchableOpacity style={styles.btnGray} onPress={reset}>
            <Text style={styles.btnText}>New Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
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
  centered: {
    alignItems: 'center',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: 'gray',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 17,
    marginBottom: 16,
  },
  savedText: {
    color: 'green',
    marginBottom: 8,
  },
  btnBlue: {
    backgroundColor: '#2e86de',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  btnGray: {
    backgroundColor: 'gray',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  btnGreen: {
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  btnRed: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
  },
});