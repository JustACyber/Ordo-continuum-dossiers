/*jslint browser: true, devel: true, esversion: 6 */
/*global window, console, prompt, alert, JSON */

/**
 * ORDO CONTINUUM DATABASE CORE (CLOUD EDITION)
 * Версия: 12.0.0 (Firebase Firestore Integration)
 * Статус: Облачная синхронизация, поддержка раздельных файлов
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- КОНФИГУРАЦИЯ ---
// Когда будете выкладывать на GitHub, замените этот блок на свой конфиг от Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB1gqid0rb9K-z0lKNTpyKiFpOKUl7ffrM",
  authDomain: "ordo-continuum-dossiers.firebaseapp.com",
  projectId: "ordo-continuum-dossiers",
  storageBucket: "ordo-continuum-dossiers.firebasestorage.app",
  messagingSenderId: "1017277527969",
  appId: "1:1017277527969:web:1ab73e9a064c76015c3de0",
  measurementId: "G-7CGN7MPC4G"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;

// --- АВТОРИЗАЦИЯ ---
async function initAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                console.log("SYSTEM: Connected to Cloud as", user.uid);
                resolve(user);
            } else {
                // Если есть токен среды (Canvas)
                if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                    signInWithCustomToken(auth, window.__initial_auth_token);
                } else {
                    signInAnonymously(auth).catch((error) => {
                        console.error("Auth Failed:", error);
                    });
                }
            }
        });
    });
}

// --- ПУТИ К ДАННЫМ ---
// Все данные хранятся в одной общей публичной коллекции, чтобы все видели анкеты друг друга
function getCollectionRef() {
    return collection(db, 'artifacts', appId, 'public', 'data', 'protocols');
}
function getDocRef(id) {
    return doc(db, 'artifacts', appId, 'public', 'data', 'protocols', id);
}

// --- API ---

const OrdoDB = {
    init: async function() {
        await initAuth();
    },

    // Подписка на список всех анкет (для index.html)
    subscribeAll: function(callback) {
        if (!currentUser) return;
        const q = getCollectionRef();
        return onSnapshot(q, (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => {
                data[doc.id] = doc.data();
            });
            callback(data);
        });
    },

    // Подписка на одну анкету (для dossier.html)
    subscribeOne: function(id, callback) {
        if (!currentUser) return;
        return onSnapshot(getDocRef(id), (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },

    // Создание (возвращает Promise)
    create: async function(name) {
        if (!currentUser) throw new Error("No Connection");
        const id = name.toLowerCase().replace(/\s+/g, '_') + "_" + Math.floor(Math.random() * 10000);
        
        // ЧИСТЫЙ ШАБЛОН
        const newChar = {
            id: id,
            meta: {
                name: name, rank: "Рекрут", image: "", 
                class: "", archetype: "", race: "", background: "",
                level: 1, origin: "", age: "", job: "", clearance: "", comm: ""
            },
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

        await setDoc(getDocRef(id), newChar);
        return id;
    },

    // Сохранение изменений
    set: async function(id, data) {
        if (!currentUser) return;
        // Firestore требует, чтобы данные были чистым объектом (без undefined)
        // JSON.parse(JSON.stringify) удаляет undefined и функции
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(getDocRef(id), cleanData);
    },

    // Удаление
    delete: async function(id) {
        if (!currentUser) return;
        await deleteDoc(getDocRef(id));
        return true;
    }
};

// Делаем доступным глобально
window.OrdoDB = OrdoDB;
