const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const DATA = {};

class Base {
  constructor(args = [], kwargs = {}) {
    const sClass = this.constructor.name;
    if (!DATA[sClass]) {
      DATA[sClass] = {};
    }

    this.id = kwargs.id || uuid.v4();
    this.createdAt = kwargs.created_at
      ? new Date(kwargs.created_at)
      : new Date();
    this.updatedAt = kwargs.updated_at
      ? new Date(kwargs.updated_at)
      : new Date();
  }

  // Equality check
  equals(other) {
    if (!(other instanceof Base)) return false;
    return this.id === other.id;
  }

  // Convert object to JSON
  toJson(forSerialization = false) {
    const result = {};
    for (const [key, value] of Object.entries(this)) {
      if (!forSerialization && key.startsWith('_')) {
        continue;
      }
      if (value instanceof Date) {
        result[key] = value.toISOString();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Load all objects from file
  static loadFromFile() {
    const sClass = this.name;
    const filePath = `.db_${sClass}.json`;
    DATA[sClass] = {};
    if (!fs.existsSync(filePath)) {
      return;
    }

    const objsJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const [objId, objJson] of Object.entries(objsJson)) {
      DATA[sClass][objId] = new this(objJson);
    }
  }

  // Save all objects to file
  static saveToFile() {
    const sClass = this.name;
    const filePath = `.db_${sClass}.json`;
    const objsJson = {};
    for (const [objId, obj] of Object.entries(DATA[sClass])) {
      objsJson[objId] = obj.toJson(true);
    }
    fs.writeFileSync(filePath, JSON.stringify(objsJson, null, 2));
  }

  // Save current object
  save() {
    const sClass = this.constructor.name;
    this.updatedAt = new Date();
    DATA[sClass][this.id] = this;
    this.constructor.saveToFile();
  }

  // Remove object
  remove() {
    const sClass = this.constructor.name;
    if (DATA[sClass][this.id]) {
      delete DATA[sClass][this.id];
      this.constructor.saveToFile();
    }
  }

  // Count all objects
  static count() {
    const sClass = this.name;
    return Object.keys(DATA[sClass]).length;
  }

  // Return all objects
  static all() {
    return this.search();
  }

  // Return one object by ID
  static get(id) {
    const sClass = this.name;
    return DATA[sClass][id];
  }

  // Search all objects with matching attributes
  static search(attributes = {}) {
    const sClass = this.name;
    const _search = (obj) => {
      if (Object.keys(attributes).length === 0) {
        return true;
      }
      for (const [k, v] of Object.entries(attributes)) {
        if (obj[k] !== v) {
          return false;
        }
      }
      return true;
    };

    return Object.values(DATA[sClass]).filter(_search);
  }
}

module.exports = Base;
