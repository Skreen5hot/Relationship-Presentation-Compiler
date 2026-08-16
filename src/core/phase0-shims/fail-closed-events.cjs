"use strict";

module.exports = {
  handleEvent({ event }) {
    const error = new Error(`JSON-LD event rejected: ${event.code}`);
    error.name = "jsonld.UnhandledEvent";
    error.details = { event };
    throw error;
  }
};
