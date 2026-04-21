import firebase from 'firebase';

const firebaseConfig = {
  apiKey: 'AIzaSyDDWBucZje8DhQjTQH_7FTYmh_e2JTnph4',
  authDomain: 't4mobile-cbe92.firebaseapp.com',
  projectId: 't4mobile-cbe92',
  storageBucket: 't4mobile-cbe92.firebasestorage.app',
  messagingSenderId: '605841721740',
  appId: '1:605841721740:web:0abe2368a82acbf327aea9',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;