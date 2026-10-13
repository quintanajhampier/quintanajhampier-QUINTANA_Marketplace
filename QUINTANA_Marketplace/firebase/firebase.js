// =============================================
// FIREBASE CONFIGURACIÓN CENTRAL
// Rantiy y Rantikuy
// =============================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =============================================
// CONFIGURACIÓN DE TU PROYECTO FIREBASE
// =============================================

const firebaseConfig = {
    apiKey: "AIzaSyDYF0A8d5pyS-HpbqAADi-TTu_BeRoG3jw",
    authDomain: "rantiy-y-rantikuy.firebaseapp.com",
    projectId: "rantiy-y-rantikuy",
    storageBucket: "rantiy-y-rantikuy.firebasestorage.app",
    messagingSenderId: "49676513708",
    appId: "1:49676513708:web:943ad781c98cb7bac78a09"
  };

// =============================================
// INICIALIZAR FIREBASE
// =============================================

const app = initializeApp(firebaseConfig);

// =============================================
// INICIALIZAR FIRESTORE
// =============================================

const db = getFirestore(app);

// =============================================
// EXPORTAR
// =============================================

export {
    app,
    db
};