import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import firebase from '../firebase';

export default function LoginForm() {
  // store what the user types
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // if user is logged in, store their email here
  const [user, setUser] = useState(null);
  // show a spinner while waiting for firebase
  const [loading, setLoading] = useState(false);

  // create a new account using firebase auth
  const register = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password.'); return; }
    setLoading(true);
    try {
      // firebase creates the account and returns the user object
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      setUser(result.user.email);
    } catch (e) {
      // firebase sends back a message explaining what went wrong
      Alert.alert('Register failed', e.message);
    }
    setLoading(false);
  };

  // log in to an existing account using firebase auth
  const login = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password.'); return; }
    setLoading(true);
    try {
      // firebase checks the email and password and returns the user object
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      setUser(result.user.email);
    } catch (e) {
      // wrong password or email not found
      Alert.alert('Login failed', e.message);
    }
    setLoading(false);
  };

  // sign out and clear the form
  const logout = async () => {
    await firebase.auth().signOut();
    setUser(null); setEmail(''); setPassword('');
  };

  // if user is logged in, show their email and a logout button instead of the form
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Logged In</Text>
        <Text style={styles.subText}>{user}</Text>
        <TouchableOpacity style={styles.btnRed} onPress={logout}>
          <Text style={styles.btnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // show the login and register form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trivia Trawler</Text>
      <Text style={styles.subText}>Login to save your score</Text>

      {/* email input */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      {/* password input - secureTextEntry hides the text */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {/* show spinner while firebase is working */}
      {loading && <ActivityIndicator style={{ marginBottom: 10 }} />}

      {/* log in to existing account */}
      <TouchableOpacity style={styles.btnBlue} onPress={login}>
        <Text style={styles.btnText}>Log In</Text>
      </TouchableOpacity>

      {/* create a new account */}
      <TouchableOpacity style={styles.btnGray} onPress={register}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>
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
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    color: 'gray',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 15,
  },
  btnBlue: {
    backgroundColor: '#2e86de',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnGray: {
    backgroundColor: 'gray',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnRed: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
  },
});