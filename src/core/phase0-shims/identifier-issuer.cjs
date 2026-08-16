"use strict";

/*
 * Adapted from rdf-canonize 5.0.0 lib/IdentifierIssuer.js.
 * Copyright (c) 2016-2021 Digital Bazaar, Inc.
 * Licensed under BSD-3-Clause; the dependency package contains the full text.
 */

class IdentifierIssuer {
  constructor(prefix, existing = new Map(), counter = 0) {
    this.prefix = prefix;
    this.existing = existing;
    this.counter = counter;
  }

  clone() {
    return new IdentifierIssuer(
      this.prefix,
      new Map(this.existing),
      this.counter
    );
  }

  getId(oldIdentifier) {
    const existingIdentifier =
      oldIdentifier && this.existing.get(oldIdentifier);
    if (existingIdentifier) {
      return existingIdentifier;
    }

    const issuedIdentifier = `${this.prefix}${this.counter}`;
    this.counter += 1;
    if (oldIdentifier) {
      this.existing.set(oldIdentifier, issuedIdentifier);
    }
    return issuedIdentifier;
  }

  hasId(oldIdentifier) {
    return this.existing.has(oldIdentifier);
  }

  getOldIds() {
    return [...this.existing.keys()];
  }
}

module.exports = { IdentifierIssuer };
