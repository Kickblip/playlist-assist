const firebase_db = require('firebase/database');
const firebase_auth = require('firebase/auth');


const login = (firebaseApp) => {

    const database = firebase_db.getDatabase(firebaseApp);
    const auth = firebase_auth.getAuth(firebaseApp);

    console.log('starting firebase login');

    firebase_auth.signInAnonymously(auth) // signing user in
        .then(() => {
            console.log('logged in');
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
        });

    firebase_auth.onAuthStateChanged(auth, (user => { // checking user state
        if (user) {
            let user_id = user.uid;
            let userRef = firebase_db.ref(database, `users/${user_id}`);

            firebase_db.set(userRef, { // set player ref
                id: user_id,
            });

            firebase_db.onDisconnect(userRef).remove(userRef);
            return user_id;

        } else {
            //signed out
        };


    }));

}


module.exports = { login };