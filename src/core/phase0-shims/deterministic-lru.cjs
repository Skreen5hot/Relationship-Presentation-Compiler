"use strict";

module.exports = class DeterministicLru {
  constructor({ max }) {
    this.max = max;
    this.entries = new Map();
  }

  get(key) {
    if (!this.entries.has(key)) {
      return undefined;
    }
    const value = this.entries.get(key);
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.max) {
      const oldest = this.entries.keys().next().value;
      this.entries.delete(oldest);
    }
    return this;
  }
};
