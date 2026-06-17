const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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
  console.log("Querying Firestore database...");
  const snapshot = await getDocs(collection(db, "letters"));
  console.log(`Found ${snapshot.size} letters:`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Sender ID: "${data.senderId}"`);
    console.log(`  Recipient ID: "${data.recipientId}"`);
    console.log(`  Content: "${data.content.substring(0, 50)}..."`);
    console.log(`  isEternal: ${data.isEternal}`);
  });
}

run().catch(console.error);
