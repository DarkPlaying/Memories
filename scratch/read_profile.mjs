import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJCbIhC6LOhwpKHRpM5nXrtp5HDTRL31Q",
  authDomain: "dark-56626.firebaseapp.com",
  projectId: "dark-56626",
  storageBucket: "dark-56626.firebasestorage.app",
  messagingSenderId: "810773972266",
  appId: "1:810773972266:web:603f2283ba90a66bc14a53"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const colRef = collection(db, "profiles");
    const snap = await getDocs(colRef);
    console.log("Total profiles:", snap.size);
    snap.forEach(doc => {
      console.log(`Profile ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log("-----------------------------------------");
    });
  } catch (err) {
    console.error("Firebase read error:", err);
  }
}

run();
