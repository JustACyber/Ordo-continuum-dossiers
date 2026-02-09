/*jslint browser: true, devel: true, esversion: 6 */
/*global window, console, prompt, alert, JSON, setTimeout */

/**
 * ORDO CONTINUUM DATABASE CORE (CLOUD EDITION)
 * Версия: 13.0 (Fixed Loading Logic)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- КОНФИГУРАЦИЯ ---
let firebaseConfig;
let appId = 'ordo-continuum-v12';

// Проверка среды (Canvas или GitHub)
if (typeof window.__firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(window.__firebase_config);
    if (typeof window.__app_id !== 'undefined') appId = window.__app_id;
} else {
    // !!! ВСТАВЬТЕ СЮДА СВОЙ КОНФИГ ДЛЯ GITHUB !!!
    firebaseConfig = {
      apiKey: "AIzaSyB1gqid0rb9K-z0lKNTpyKiFpOKUl7ffrM",
      authDomain: "ordo-continuum-dossiers.firebaseapp.com",
      projectId: "ordo-continuum-dossiers",
      storageBucket: "ordo-continuum-dossiers.firebasestorage.app",
      messagingSenderId: "1017277527969",
      appId: "1:1017277527969:web:1ab73e9a064c76015c3de0",
      measurementId: "G-7CGN7MPC4G"
    };
}

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;

// Ссылка на коллекцию
function getCollRef() {
    return collection(db, 'artifacts', appId, 'public', 'data', 'protocols');
}

const OrdoDB = {
    // 1. Инициализация и вход
    init: async function() {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    currentUser = user;
                    console.log("DB: Connected as " + user.uid);
                    resolve(user);
                } else {
                    // Попытка анонимного входа
                    if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                        signInWithCustomToken(auth, window.__initial_auth_token).catch(reject);
                    } else {
                        signInAnonymously(auth).catch(reject);
                    }
                }
            }, reject);
        });
    },

    // 2. Подписка на весь список (Index)
    subscribeAll: function(callback) {
        if (!currentUser) return;
        return onSnapshot(getCollRef(), (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => { data[doc.id] = doc.data(); });
            callback(data);
        }, (error) => {
            console.error("Sync Error:", error);
            alert("Ошибка синхронизации: " + error.message);
        });
    },

    // 3. Подписка на один документ (Dossier)
    subscribeOne: function(id, callback) {
        if (!currentUser) return;
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'protocols', id);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) callback(docSnap.data());
            else callback(null);
        });
    },

    // 4. Создание
    create: async function(name) {
        if (!currentUser) throw new Error("Not authenticated");
        const id = name.toLowerCase().replace(/\s+/g, '_') + "_" + Math.floor(Math.random() * 10000);
        
        // ЧИСТЫЙ ШАБЛОН
        const newChar = {
            id: id,
            meta: { name: name, rank: "Рекрут", image: "", level: 1 },
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, hp_curr: 0, hp_max: 0, ac: 10, speed_mod: 0 },
            saves: { prof_str: false, prof_dex: false, prof_con: false, prof_int: false, prof_wis: false, prof_cha: false },
            skills: { data: {}, bonuses: {} },
            combat: { weapons: [], inventory: [] },
            abilities: [], traits: [], features: [],
            profs: { langs: [], tools: [] },
            money: { u: 0, k: 0, m: 0, g: 0 },
            psych: { size: "Средний", age: "", height: "", weight: "", trait: "", ideal: "", bond: "", flaw: "", analysis: "" },
            psionics: { base_attr: "int", caster_type: "1", class_lvl: 1, type: "learned", mod_points: 0, points_curr: 0, spells: [] },
            universalis: { save_base: 8, save_attr: "int", custom_table: [], counters: [] }
        };

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'protocols', id), newChar);
        return id;
    },

    // 5. Сохранение
    set: async function(id, data) {
        if (!currentUser) return;
        const cleanData = JSON.parse(JSON.stringify(data)); // Удаляем undefined
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'protocols', id), cleanData);
    },

    // 6. Удаление
    delete: async function(id) {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'protocols', id));
        return true;
    }
};

// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ (ВАЖНО ДЛЯ HTML)
window.OrdoDB = OrdoDB;
