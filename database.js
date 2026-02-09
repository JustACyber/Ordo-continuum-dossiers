/**
 * ORDO CONTINUUM DATABASE CORE
 * Версия: 11.4.0 (Visual Bars & Psi Cap)
 * Статус: Чистая база, финальная структура
 */

const DB_KEY = "ORDO_CONTINUUM_DB_V11_FINAL";

// 1. Инициализация
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        console.log("SYSTEM: Creating NEW CLEAN database...");
        localStorage.setItem(DB_KEY, JSON.stringify({}));
    }
}

// 2. Получить всю базу
function getDB() {
    initDB();
    try {
        const data = JSON.parse(localStorage.getItem(DB_KEY));
        return data || {};
    } catch (e) {
        console.error("DB Corrupted. Resetting.");
        return {};
    }
}

// 3. Сохранить базу
function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// 4. CRUD Операции
const OrdoDB = {
    init: initDB,
    
    getAll: getDB,

    get: function(id) {
        const db = getDB();
        return db[id] || null;
    },

    set: function(id, data) {
        const db = getDB();
        db[id] = data;
        saveDB(db);
    },

    delete: function(id) {
        const db = getDB();
        if (db[id]) {
            delete db[id];
            saveDB(db);
            return true;
        }
        return false;
    },

    create: function(name) {
        const id = name.toLowerCase().replace(/\s+/g, '_') + "_" + Math.floor(Math.random() * 10000);
        const db = getDB();

        // ЧИСТЫЙ ШАБЛОН
        const newChar = {
            id: id,
            meta: {
                name: name,
                rank: "Рекрут",
                image: "", 
                class: "", archetype: "", 
                race: "", subrace: "",
                background: "",
                level: 1, origin: "", age: "", job: "", clearance: "", comm: ""
            },
            locks: { 
                identity: false, biometrics: false, skills: false, 
                equipment: false, psych: false, psionics: false, universalis: false
            },
            stats: {
                str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
                hp_curr: 0, hp_max: 0, hp_temp: 0,
                shield_curr: 0, shield_max: 0,
                ac: 10, speed_mod: 0
            },
            saves: {
                prof_str: false, prof_dex: false, prof_con: false,
                prof_int: false, prof_wis: false, prof_cha: false
            },
            skills: { 
                data: {}, 
                bonuses: {} 
            },
            combat: { weapons: [], inventory: [] },
            abilities: [],
            traits: [],
            features: [],
            profs: { langs: [], tools: [], armory: [] },
            money: { u: 0, k: 0, m: 0, g: 0 },
            psych: {
                size: "Средний", age: "", height: "", weight: "",
                trait: "", ideal: "", bond: "", flaw: "", analysis: ""
            },
            psionics: {
                base_attr: "int", caster_type: "1", class_lvl: 1, type: "learned",
                mod_points: 0, points_curr: 0, spells: []
            },
            universalis: {
                save_base: 8, save_attr: "int", custom_table: [], 
                counters: [] 
            }
        };

        db[id] = newChar;
        saveDB(db);
        return id;
    }
};

window.OrdoDB = OrdoDB;