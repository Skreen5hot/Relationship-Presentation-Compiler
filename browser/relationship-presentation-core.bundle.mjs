var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// <define:__RPC_ARTIFACT_DIGESTS__>
var define_RPC_ARTIFACT_DIGESTS_default;
var init_define_RPC_ARTIFACT_DIGESTS = __esm({
  "<define:__RPC_ARTIFACT_DIGESTS__>"() {
    define_RPC_ARTIFACT_DIGESTS_default = { context: "6e27b066fa6f205e130f322f479c89edd0c5e64a12800f3bcb9ea1117822b484", contract: "09dffb9112967a8e725244e8caa03e055a3f88761af545459a773a5a01722322", canonicalProfile: "cfa9db81b1388b11342e7a4433f259acc49595d8b801072bccd0587c0305c296", carrierStyle: "ffcf45b266ad10b4dc1f21d604beec4db52a3a618f13541444ed77e6f3a8cc3d", carrierNavigation: "94d1406758a8fe887a8d39f3559b505099ab08d5e2af39834b7f52bee5e914ad" };
  }
});

// node_modules/jsonld/lib/types.js
var require_types = __commonJS({
  "node_modules/jsonld/lib/types.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var api = {};
    module.exports = api;
    api.isArray = Array.isArray;
    api.isBoolean = (v) => typeof v === "boolean" || Object.prototype.toString.call(v) === "[object Boolean]";
    api.isDouble = (v) => api.isNumber(v) && (String(v).indexOf(".") !== -1 || Math.abs(v) >= 1e21);
    api.isEmptyObject = (v) => api.isObject(v) && Object.keys(v).length === 0;
    api.isNumber = (v) => typeof v === "number" || Object.prototype.toString.call(v) === "[object Number]";
    api.isNumeric = (v) => !isNaN(parseFloat(v)) && isFinite(v);
    api.isObject = (v) => Object.prototype.toString.call(v) === "[object Object]";
    api.isString = (v) => typeof v === "string" || Object.prototype.toString.call(v) === "[object String]";
    api.isUndefined = (v) => typeof v === "undefined";
  }
});

// node_modules/jsonld/lib/graphTypes.js
var require_graphTypes = __commonJS({
  "node_modules/jsonld/lib/graphTypes.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var types = require_types();
    var api = {};
    module.exports = api;
    api.isSubject = (v) => {
      if (types.isObject(v) && !("@value" in v || "@set" in v || "@list" in v)) {
        const keyCount = Object.keys(v).length;
        return keyCount > 1 || !("@id" in v);
      }
      return false;
    };
    api.isSubjectReference = (v) => (
      // Note: A value is a subject reference if all of these hold true:
      // 1. It is an Object.
      // 2. It has a single key: @id.
      types.isObject(v) && Object.keys(v).length === 1 && "@id" in v
    );
    api.isValue = (v) => (
      // Note: A value is a @value if all of these hold true:
      // 1. It is an Object.
      // 2. It has the @value property.
      types.isObject(v) && "@value" in v
    );
    api.isList = (v) => (
      // Note: A value is a @list if all of these hold true:
      // 1. It is an Object.
      // 2. It has the @list property.
      types.isObject(v) && "@list" in v
    );
    api.isGraph = (v) => {
      return types.isObject(v) && "@graph" in v && Object.keys(v).filter((key) => key !== "@id" && key !== "@index").length === 1;
    };
    api.isSimpleGraph = (v) => {
      return api.isGraph(v) && !("@id" in v);
    };
    api.isBlankNode = (v) => {
      if (types.isObject(v)) {
        if ("@id" in v) {
          const id = v["@id"];
          return !types.isString(id) || id.indexOf("_:") === 0;
        }
        return Object.keys(v).length === 0 || !("@value" in v || "@set" in v || "@list" in v);
      }
      return false;
    };
  }
});

// src/core/phase0-shims/identifier-issuer.cjs
var require_identifier_issuer = __commonJS({
  "src/core/phase0-shims/identifier-issuer.cjs"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var IdentifierIssuer = class _IdentifierIssuer {
      constructor(prefix, existing = /* @__PURE__ */ new Map(), counter = 0) {
        this.prefix = prefix;
        this.existing = existing;
        this.counter = counter;
      }
      clone() {
        return new _IdentifierIssuer(
          this.prefix,
          new Map(this.existing),
          this.counter
        );
      }
      getId(oldIdentifier) {
        const existingIdentifier = oldIdentifier && this.existing.get(oldIdentifier);
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
    };
    module.exports = { IdentifierIssuer };
  }
});

// node_modules/jsonld/lib/JsonLdError.js
var require_JsonLdError = __commonJS({
  "node_modules/jsonld/lib/JsonLdError.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    module.exports = class JsonLdError extends Error {
      /**
       * Creates a JSON-LD Error.
       *
       * @param msg the error message.
       * @param type the error type.
       * @param details the error details.
       */
      constructor(message = "An unspecified JSON-LD error occurred.", name = "jsonld.Error", details = {}) {
        super(message);
        this.name = name;
        this.message = message;
        this.details = details;
      }
    };
  }
});

// node_modules/jsonld/lib/util.js
var require_util = __commonJS({
  "node_modules/jsonld/lib/util.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var graphTypes = require_graphTypes();
    var types = require_types();
    var IdentifierIssuer = require_identifier_issuer().IdentifierIssuer;
    var JsonLdError = require_JsonLdError();
    var REGEX_BCP47 = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;
    var REGEX_LINK_HEADERS = /(?:<[^>]*?>|"[^"]*?"|[^,])+/g;
    var REGEX_LINK_HEADER = /\s*<([^>]*?)>\s*(?:;\s*(.*))?/;
    var REGEX_LINK_HEADER_PARAMS = /(.*?)=(?:(?:"([^"]*?)")|([^"]*?))\s*(?:(?:;\s*)|$)/g;
    var REGEX_KEYWORD = /^@[a-zA-Z]+$/;
    var DEFAULTS = {
      headers: {
        accept: "application/ld+json, application/json"
      }
    };
    var api = {};
    module.exports = api;
    api.IdentifierIssuer = IdentifierIssuer;
    api.REGEX_BCP47 = REGEX_BCP47;
    api.REGEX_KEYWORD = REGEX_KEYWORD;
    api.clone = function(value) {
      if (value && typeof value === "object") {
        let rval;
        if (types.isArray(value)) {
          rval = [];
          for (let i = 0; i < value.length; ++i) {
            rval[i] = api.clone(value[i]);
          }
        } else if (value instanceof Map) {
          rval = /* @__PURE__ */ new Map();
          for (const [k, v] of value) {
            rval.set(k, api.clone(v));
          }
        } else if (value instanceof Set) {
          rval = /* @__PURE__ */ new Set();
          for (const v of value) {
            rval.add(api.clone(v));
          }
        } else if (types.isObject(value)) {
          rval = {};
          for (const key in value) {
            rval[key] = api.clone(value[key]);
          }
        } else {
          rval = value.toString();
        }
        return rval;
      }
      return value;
    };
    api.asArray = function(value) {
      return Array.isArray(value) ? value : [value];
    };
    api.buildHeaders = (headers = {}) => {
      const hasAccept = Object.keys(headers).some(
        (h) => h.toLowerCase() === "accept"
      );
      if (hasAccept) {
        throw new RangeError(
          'Accept header may not be specified; only "' + DEFAULTS.headers.accept + '" is supported.'
        );
      }
      return Object.assign({ Accept: DEFAULTS.headers.accept }, headers);
    };
    api.parseLinkHeader = (header) => {
      const rval = {};
      const entries = header.match(REGEX_LINK_HEADERS);
      for (let i = 0; i < entries.length; ++i) {
        let match = entries[i].match(REGEX_LINK_HEADER);
        if (!match) {
          continue;
        }
        const result = { target: match[1] };
        const params = match[2];
        while (match = REGEX_LINK_HEADER_PARAMS.exec(params)) {
          result[match[1]] = match[2] === void 0 ? match[3] : match[2];
        }
        const rel = result.rel || "";
        if (Array.isArray(rval[rel])) {
          rval[rel].push(result);
        } else if (rval.hasOwnProperty(rel)) {
          rval[rel] = [rval[rel], result];
        } else {
          rval[rel] = result;
        }
      }
      return rval;
    };
    api.validateTypeValue = (v, isFrame) => {
      if (types.isString(v)) {
        return;
      }
      if (types.isArray(v) && v.every((vv) => types.isString(vv))) {
        return;
      }
      if (isFrame && types.isObject(v)) {
        switch (Object.keys(v).length) {
          case 0:
            return;
          case 1:
            if ("@default" in v && api.asArray(v["@default"]).every((vv) => types.isString(vv))) {
              return;
            }
        }
      }
      throw new JsonLdError(
        'Invalid JSON-LD syntax; "@type" value must a string, an array of strings, an empty object, or a default object.',
        "jsonld.SyntaxError",
        { code: "invalid type value", value: v }
      );
    };
    api.hasProperty = (subject, property) => {
      if (subject.hasOwnProperty(property)) {
        const value = subject[property];
        return !types.isArray(value) || value.length > 0;
      }
      return false;
    };
    api.hasValue = (subject, property, value) => {
      if (api.hasProperty(subject, property)) {
        let val = subject[property];
        const isList = graphTypes.isList(val);
        if (types.isArray(val) || isList) {
          if (isList) {
            val = val["@list"];
          }
          for (let i = 0; i < val.length; ++i) {
            if (api.compareValues(value, val[i])) {
              return true;
            }
          }
        } else if (!types.isArray(value)) {
          return api.compareValues(value, val);
        }
      }
      return false;
    };
    api.addValue = (subject, property, value, options) => {
      options = options || {};
      if (!("propertyIsArray" in options)) {
        options.propertyIsArray = false;
      }
      if (!("valueIsArray" in options)) {
        options.valueIsArray = false;
      }
      if (!("allowDuplicate" in options)) {
        options.allowDuplicate = true;
      }
      if (!("prependValue" in options)) {
        options.prependValue = false;
      }
      if (options.valueIsArray) {
        subject[property] = value;
      } else if (types.isArray(value)) {
        if (value.length === 0 && options.propertyIsArray && !subject.hasOwnProperty(property)) {
          subject[property] = [];
        }
        if (options.prependValue) {
          value = value.concat(subject[property]);
          subject[property] = [];
        }
        for (let i = 0; i < value.length; ++i) {
          api.addValue(subject, property, value[i], options);
        }
      } else if (subject.hasOwnProperty(property)) {
        const hasValue = !options.allowDuplicate && api.hasValue(subject, property, value);
        if (!types.isArray(subject[property]) && (!hasValue || options.propertyIsArray)) {
          subject[property] = [subject[property]];
        }
        if (!hasValue) {
          if (options.prependValue) {
            subject[property].unshift(value);
          } else {
            subject[property].push(value);
          }
        }
      } else {
        subject[property] = options.propertyIsArray ? [value] : value;
      }
    };
    api.getValues = (subject, property) => [].concat(subject[property] || []);
    api.removeProperty = (subject, property) => {
      delete subject[property];
    };
    api.removeValue = (subject, property, value, options) => {
      options = options || {};
      if (!("propertyIsArray" in options)) {
        options.propertyIsArray = false;
      }
      const values = api.getValues(subject, property).filter(
        (e) => !api.compareValues(e, value)
      );
      if (values.length === 0) {
        api.removeProperty(subject, property);
      } else if (values.length === 1 && !options.propertyIsArray) {
        subject[property] = values[0];
      } else {
        subject[property] = values;
      }
    };
    api.relabelBlankNodes = (input, options) => {
      options = options || {};
      const issuer = options.issuer || new IdentifierIssuer("_:b");
      return _labelBlankNodes(issuer, input);
    };
    api.compareValues = (v1, v2) => {
      if (v1 === v2) {
        return true;
      }
      if (graphTypes.isValue(v1) && graphTypes.isValue(v2) && v1["@value"] === v2["@value"] && v1["@type"] === v2["@type"] && v1["@language"] === v2["@language"] && v1["@index"] === v2["@index"]) {
        return true;
      }
      if (types.isObject(v1) && "@id" in v1 && types.isObject(v2) && "@id" in v2) {
        return v1["@id"] === v2["@id"];
      }
      return false;
    };
    api.compareShortestLeast = (a, b) => {
      if (a.length < b.length) {
        return -1;
      }
      if (b.length < a.length) {
        return 1;
      }
      if (a === b) {
        return 0;
      }
      return a < b ? -1 : 1;
    };
    function _labelBlankNodes(issuer, element) {
      if (types.isArray(element)) {
        for (let i = 0; i < element.length; ++i) {
          element[i] = _labelBlankNodes(issuer, element[i]);
        }
      } else if (graphTypes.isList(element)) {
        element["@list"] = _labelBlankNodes(issuer, element["@list"]);
      } else if (types.isObject(element)) {
        if (graphTypes.isBlankNode(element)) {
          element["@id"] = issuer.getId(element["@id"]);
        }
        const keys = Object.keys(element).sort();
        for (let ki = 0; ki < keys.length; ++ki) {
          const key = keys[ki];
          if (key !== "@id") {
            element[key] = _labelBlankNodes(issuer, element[key]);
          }
        }
      }
      return element;
    }
  }
});

// node_modules/jsonld/lib/url.js
var require_url = __commonJS({
  "node_modules/jsonld/lib/url.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var types = require_types();
    var api = {};
    module.exports = api;
    api.parsers = {
      simple: {
        // RFC 3986 basic parts
        keys: [
          "href",
          "scheme",
          "authority",
          "path",
          "query",
          "fragment"
        ],
        /* eslint-disable-next-line max-len */
        regex: /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
      },
      full: {
        keys: [
          "href",
          "protocol",
          "scheme",
          "authority",
          "auth",
          "user",
          "password",
          "hostname",
          "port",
          "path",
          "directory",
          "file",
          "query",
          "fragment"
        ],
        /* eslint-disable-next-line max-len */
        regex: /^(([a-zA-Z][a-zA-Z0-9+-.]*):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?(?:(((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };
    api.parse = (str, parser) => {
      const parsed = {};
      const o = api.parsers[parser || "full"];
      const m = o.regex.exec(str);
      let i = o.keys.length;
      while (i--) {
        parsed[o.keys[i]] = m[i] === void 0 ? null : m[i];
      }
      if (parsed.scheme === "https" && parsed.port === "443" || parsed.scheme === "http" && parsed.port === "80") {
        parsed.href = parsed.href.replace(":" + parsed.port, "");
        parsed.authority = parsed.authority.replace(":" + parsed.port, "");
        parsed.port = null;
      }
      parsed.normalizedPath = api.removeDotSegments(parsed.path);
      return parsed;
    };
    api.prependBase = (base, iri) => {
      if (base === null) {
        return iri;
      }
      if (api.isAbsolute(iri)) {
        return iri;
      }
      if (!base || types.isString(base)) {
        base = api.parse(base || "");
      }
      const rel = api.parse(iri);
      const transform = {
        protocol: base.protocol || ""
      };
      if (rel.authority !== null) {
        transform.authority = rel.authority;
        transform.path = rel.path;
        transform.query = rel.query;
      } else {
        transform.authority = base.authority;
        if (rel.path === "") {
          transform.path = base.path;
          if (rel.query !== null) {
            transform.query = rel.query;
          } else {
            transform.query = base.query;
          }
        } else {
          if (rel.path.indexOf("/") === 0) {
            transform.path = rel.path;
          } else {
            let path = base.path;
            path = path.substr(0, path.lastIndexOf("/") + 1);
            if ((path.length > 0 || base.authority) && path.substr(-1) !== "/") {
              path += "/";
            }
            path += rel.path;
            transform.path = path;
          }
          transform.query = rel.query;
        }
      }
      if (rel.path !== "") {
        transform.path = api.removeDotSegments(transform.path);
      }
      let rval = transform.protocol;
      if (transform.authority !== null) {
        rval += "//" + transform.authority;
      }
      rval += transform.path;
      if (transform.query !== null) {
        rval += "?" + transform.query;
      }
      if (rel.fragment !== null) {
        rval += "#" + rel.fragment;
      }
      if (rval === "") {
        rval = "./";
      }
      return rval;
    };
    api.removeBase = (base, iri) => {
      if (base === null) {
        return iri;
      }
      if (!base || types.isString(base)) {
        base = api.parse(base || "");
      }
      let root = "";
      if (base.href !== "") {
        root += (base.protocol || "") + "//" + (base.authority || "");
      } else if (iri.indexOf("//")) {
        root += "//";
      }
      if (iri.indexOf(root) !== 0) {
        return iri;
      }
      const rel = api.parse(iri.substr(root.length));
      const baseSegments = base.normalizedPath.split("/");
      const iriSegments = rel.normalizedPath.split("/");
      const last = rel.fragment || rel.query ? 0 : 1;
      while (baseSegments.length > 0 && iriSegments.length > last) {
        if (baseSegments[0] !== iriSegments[0]) {
          break;
        }
        baseSegments.shift();
        iriSegments.shift();
      }
      let rval = "";
      if (baseSegments.length > 0) {
        baseSegments.pop();
        for (let i = 0; i < baseSegments.length; ++i) {
          rval += "../";
        }
      }
      rval += iriSegments.join("/");
      if (rel.query !== null) {
        rval += "?" + rel.query;
      }
      if (rel.fragment !== null) {
        rval += "#" + rel.fragment;
      }
      if (rval === "") {
        rval = "./";
      }
      return rval;
    };
    api.removeDotSegments = (path) => {
      if (path.length === 0) {
        return "";
      }
      const input = path.split("/");
      const output = [];
      while (input.length > 0) {
        const next = input.shift();
        const done = input.length === 0;
        if (next === ".") {
          if (done) {
            output.push("");
          }
          continue;
        }
        if (next === "..") {
          output.pop();
          if (done) {
            output.push("");
          }
          continue;
        }
        output.push(next);
      }
      if (path[0] === "/" && output.length > 0 && output[0] !== "") {
        output.unshift("");
      }
      if (output.length === 1 && output[0] === "") {
        return "/";
      }
      return output.join("/");
    };
    var isAbsoluteRegex = /^([A-Za-z][A-Za-z0-9+-.]*|_):[^\s]*$/;
    api.isAbsolute = (v) => types.isString(v) && isAbsoluteRegex.test(v);
    api.isRelative = (v) => types.isString(v);
  }
});

// src/core/phase0-shims/fail-closed-events.cjs
var require_fail_closed_events = __commonJS({
  "src/core/phase0-shims/fail-closed-events.cjs"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    module.exports = {
      handleEvent({ event }) {
        const error = new Error(`JSON-LD event rejected: ${event.code}`);
        error.name = "jsonld.UnhandledEvent";
        error.details = { event };
        throw error;
      }
    };
  }
});

// node_modules/jsonld/lib/context.js
var require_context = __commonJS({
  "node_modules/jsonld/lib/context.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var util = require_util();
    var JsonLdError = require_JsonLdError();
    var {
      isArray: _isArray,
      isObject: _isObject,
      isString: _isString,
      isUndefined: _isUndefined
    } = require_types();
    var {
      isAbsolute: _isAbsoluteIri,
      isRelative: _isRelativeIri,
      prependBase
    } = require_url();
    var {
      handleEvent: _handleEvent
    } = require_fail_closed_events();
    var {
      REGEX_BCP47,
      REGEX_KEYWORD,
      asArray: _asArray,
      compareShortestLeast: _compareShortestLeast
    } = require_util();
    var INITIAL_CONTEXT_CACHE = /* @__PURE__ */ new Map();
    var INITIAL_CONTEXT_CACHE_MAX_SIZE = 1e4;
    var api = {};
    module.exports = api;
    api.process = async ({
      activeCtx,
      localCtx,
      options,
      propagate = true,
      overrideProtected = false,
      cycles = /* @__PURE__ */ new Set()
    }) => {
      if (_isObject(localCtx) && "@context" in localCtx && _isArray(localCtx["@context"])) {
        localCtx = localCtx["@context"];
      }
      const ctxs = _asArray(localCtx);
      if (ctxs.length === 0) {
        return activeCtx;
      }
      const events = [];
      const eventCaptureHandler = [
        ({ event, next }) => {
          events.push(event);
          next();
        }
      ];
      if (options.eventHandler) {
        eventCaptureHandler.push(options.eventHandler);
      }
      const originalOptions = options;
      options = { ...options, eventHandler: eventCaptureHandler };
      const resolved = await options.contextResolver.resolve({
        activeCtx,
        context: localCtx,
        documentLoader: options.documentLoader,
        base: options.base
      });
      if (_isObject(resolved[0].document) && typeof resolved[0].document["@propagate"] === "boolean") {
        propagate = resolved[0].document["@propagate"];
      }
      let rval = activeCtx;
      if (!propagate && !rval.previousContext) {
        rval = rval.clone();
        rval.previousContext = activeCtx;
      }
      for (const resolvedContext of resolved) {
        let { document: ctx } = resolvedContext;
        activeCtx = rval;
        if (ctx === null) {
          if (!overrideProtected && Object.keys(activeCtx.protected).length !== 0) {
            throw new JsonLdError(
              "Tried to nullify a context with protected terms outside of a term definition.",
              "jsonld.SyntaxError",
              { code: "invalid context nullification" }
            );
          }
          rval = activeCtx = api.getInitialContext(options).clone();
          continue;
        }
        const processed = resolvedContext.getProcessed(activeCtx);
        if (processed) {
          if (originalOptions.eventHandler) {
            for (const event of processed.events) {
              _handleEvent({ event, options: originalOptions });
            }
          }
          rval = activeCtx = processed.context;
          continue;
        }
        if (_isObject(ctx) && "@context" in ctx) {
          ctx = ctx["@context"];
        }
        if (!_isObject(ctx)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context must be an object.",
            "jsonld.SyntaxError",
            { code: "invalid local context", context: ctx }
          );
        }
        rval = rval.clone();
        const defined = /* @__PURE__ */ new Map();
        if ("@version" in ctx) {
          if (ctx["@version"] !== 1.1) {
            throw new JsonLdError(
              "Unsupported JSON-LD version: " + ctx["@version"],
              "jsonld.UnsupportedVersion",
              { code: "invalid @version value", context: ctx }
            );
          }
          if (activeCtx.processingMode && activeCtx.processingMode === "json-ld-1.0") {
            throw new JsonLdError(
              "@version: " + ctx["@version"] + " not compatible with " + activeCtx.processingMode,
              "jsonld.ProcessingModeConflict",
              { code: "processing mode conflict", context: ctx }
            );
          }
          rval.processingMode = "json-ld-1.1";
          rval["@version"] = ctx["@version"];
          defined.set("@version", true);
        }
        rval.processingMode = rval.processingMode || activeCtx.processingMode;
        if ("@base" in ctx) {
          let base = ctx["@base"];
          if (base === null || _isAbsoluteIri(base)) {
          } else if (_isRelativeIri(base)) {
            base = prependBase(rval["@base"], base);
          } else {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; the value of "@base" in a @context must be an absolute IRI, a relative IRI, or null.',
              "jsonld.SyntaxError",
              { code: "invalid base IRI", context: ctx }
            );
          }
          rval["@base"] = base;
          defined.set("@base", true);
        }
        if ("@vocab" in ctx) {
          const value = ctx["@vocab"];
          if (value === null) {
            delete rval["@vocab"];
          } else if (!_isString(value)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; the value of "@vocab" in a @context must be a string or null.',
              "jsonld.SyntaxError",
              { code: "invalid vocab mapping", context: ctx }
            );
          } else if (!_isAbsoluteIri(value) && api.processingMode(rval, 1)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; the value of "@vocab" in a @context must be an absolute IRI.',
              "jsonld.SyntaxError",
              { code: "invalid vocab mapping", context: ctx }
            );
          } else {
            const vocab = _expandIri(
              rval,
              value,
              { vocab: true, base: true },
              void 0,
              void 0,
              options
            );
            if (!_isAbsoluteIri(vocab)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "relative @vocab reference",
                    level: "warning",
                    message: "Relative @vocab reference found.",
                    details: {
                      vocab
                    }
                  },
                  options
                });
              }
            }
            rval["@vocab"] = vocab;
          }
          defined.set("@vocab", true);
        }
        if ("@language" in ctx) {
          const value = ctx["@language"];
          if (value === null) {
            delete rval["@language"];
          } else if (!_isString(value)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; the value of "@language" in a @context must be a string or null.',
              "jsonld.SyntaxError",
              { code: "invalid default language", context: ctx }
            );
          } else {
            if (!value.match(REGEX_BCP47)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "invalid @language value",
                    level: "warning",
                    message: "@language value must be valid BCP47.",
                    details: {
                      language: value
                    }
                  },
                  options
                });
              }
            }
            rval["@language"] = value.toLowerCase();
          }
          defined.set("@language", true);
        }
        if ("@direction" in ctx) {
          const value = ctx["@direction"];
          if (activeCtx.processingMode === "json-ld-1.0") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @direction not compatible with " + activeCtx.processingMode,
              "jsonld.SyntaxError",
              { code: "invalid context member", context: ctx }
            );
          }
          if (value === null) {
            delete rval["@direction"];
          } else if (value !== "ltr" && value !== "rtl") {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; the value of "@direction" in a @context must be null, "ltr", or "rtl".',
              "jsonld.SyntaxError",
              { code: "invalid base direction", context: ctx }
            );
          } else {
            rval["@direction"] = value;
          }
          defined.set("@direction", true);
        }
        if ("@propagate" in ctx) {
          const value = ctx["@propagate"];
          if (activeCtx.processingMode === "json-ld-1.0") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @propagate not compatible with " + activeCtx.processingMode,
              "jsonld.SyntaxError",
              { code: "invalid context entry", context: ctx }
            );
          }
          if (typeof value !== "boolean") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @propagate value must be a boolean.",
              "jsonld.SyntaxError",
              { code: "invalid @propagate value", context: localCtx }
            );
          }
          defined.set("@propagate", true);
        }
        if ("@import" in ctx) {
          const value = ctx["@import"];
          if (activeCtx.processingMode === "json-ld-1.0") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @import not compatible with " + activeCtx.processingMode,
              "jsonld.SyntaxError",
              { code: "invalid context entry", context: ctx }
            );
          }
          if (!_isString(value)) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @import must be a string.",
              "jsonld.SyntaxError",
              { code: "invalid @import value", context: localCtx }
            );
          }
          const resolvedImport = await options.contextResolver.resolve({
            activeCtx,
            context: value,
            documentLoader: options.documentLoader,
            base: options.base
          });
          if (resolvedImport.length !== 1) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @import must reference a single context.",
              "jsonld.SyntaxError",
              { code: "invalid remote context", context: localCtx }
            );
          }
          const processedImport = resolvedImport[0].getProcessed(activeCtx);
          if (processedImport) {
            ctx = processedImport;
          } else {
            const importCtx = resolvedImport[0].document;
            if ("@import" in importCtx) {
              throw new JsonLdError(
                "Invalid JSON-LD syntax: imported context must not include @import.",
                "jsonld.SyntaxError",
                { code: "invalid context entry", context: localCtx }
              );
            }
            for (const key in importCtx) {
              if (!ctx.hasOwnProperty(key)) {
                ctx[key] = importCtx[key];
              }
            }
            resolvedImport[0].setProcessed(activeCtx, ctx);
          }
          defined.set("@import", true);
        }
        defined.set("@protected", ctx["@protected"] || false);
        for (const key in ctx) {
          api.createTermDefinition({
            activeCtx: rval,
            localCtx: ctx,
            term: key,
            defined,
            options,
            overrideProtected
          });
          if (_isObject(ctx[key]) && "@context" in ctx[key]) {
            const keyCtx = ctx[key]["@context"];
            let process = true;
            if (_isString(keyCtx)) {
              const url = prependBase(options.base, keyCtx);
              if (cycles.has(url)) {
                process = false;
              } else {
                cycles.add(url);
              }
            }
            if (process) {
              try {
                await api.process({
                  activeCtx: rval.clone(),
                  localCtx: ctx[key]["@context"],
                  overrideProtected: true,
                  options,
                  cycles
                });
              } catch (e) {
                throw new JsonLdError(
                  "Invalid JSON-LD syntax; invalid scoped context.",
                  "jsonld.SyntaxError",
                  {
                    code: "invalid scoped context",
                    context: ctx[key]["@context"],
                    term: key
                  }
                );
              }
            }
          }
        }
        resolvedContext.setProcessed(activeCtx, {
          context: rval,
          events
        });
      }
      return rval;
    };
    api.createTermDefinition = ({
      activeCtx,
      localCtx,
      term,
      defined,
      options,
      overrideProtected = false
    }) => {
      if (defined.has(term)) {
        if (defined.get(term)) {
          return;
        }
        throw new JsonLdError(
          "Cyclical context definition detected.",
          "jsonld.CyclicalContext",
          { code: "cyclic IRI mapping", context: localCtx, term }
        );
      }
      defined.set(term, false);
      let value;
      if (localCtx.hasOwnProperty(term)) {
        value = localCtx[term];
      }
      if (term === "@type" && _isObject(value) && (value["@container"] || "@set") === "@set" && api.processingMode(activeCtx, 1.1)) {
        const validKeys2 = ["@container", "@id", "@protected"];
        const keys = Object.keys(value);
        if (keys.length === 0 || keys.some((k) => !validKeys2.includes(k))) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; keywords cannot be overridden.",
            "jsonld.SyntaxError",
            { code: "keyword redefinition", context: localCtx, term }
          );
        }
      } else if (api.isKeyword(term)) {
        throw new JsonLdError(
          "Invalid JSON-LD syntax; keywords cannot be overridden.",
          "jsonld.SyntaxError",
          { code: "keyword redefinition", context: localCtx, term }
        );
      } else if (term.match(REGEX_KEYWORD)) {
        if (options.eventHandler) {
          _handleEvent({
            event: {
              type: ["JsonLdEvent"],
              code: "reserved term",
              level: "warning",
              message: 'Terms beginning with "@" are reserved for future use and dropped.',
              details: {
                term
              }
            },
            options
          });
        }
        return;
      } else if (term === "") {
        throw new JsonLdError(
          "Invalid JSON-LD syntax; a term cannot be an empty string.",
          "jsonld.SyntaxError",
          { code: "invalid term definition", context: localCtx }
        );
      }
      const previousMapping = activeCtx.mappings.get(term);
      if (activeCtx.mappings.has(term)) {
        activeCtx.mappings.delete(term);
      }
      let simpleTerm = false;
      if (_isString(value) || value === null) {
        simpleTerm = true;
        value = { "@id": value };
      }
      if (!_isObject(value)) {
        throw new JsonLdError(
          "Invalid JSON-LD syntax; @context term values must be strings or objects.",
          "jsonld.SyntaxError",
          { code: "invalid term definition", context: localCtx }
        );
      }
      const mapping = {};
      activeCtx.mappings.set(term, mapping);
      mapping.reverse = false;
      const validKeys = ["@container", "@id", "@language", "@reverse", "@type"];
      if (api.processingMode(activeCtx, 1.1)) {
        validKeys.push(
          "@context",
          "@direction",
          "@index",
          "@nest",
          "@prefix",
          "@protected"
        );
      }
      for (const kw in value) {
        if (!validKeys.includes(kw)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a term definition must not contain " + kw,
            "jsonld.SyntaxError",
            { code: "invalid term definition", context: localCtx }
          );
        }
      }
      const colon = term.indexOf(":");
      mapping._termHasColon = colon > 0;
      if ("@reverse" in value) {
        if ("@id" in value) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a @reverse term definition must not contain @id.",
            "jsonld.SyntaxError",
            { code: "invalid reverse property", context: localCtx }
          );
        }
        if ("@nest" in value) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a @reverse term definition must not contain @nest.",
            "jsonld.SyntaxError",
            { code: "invalid reverse property", context: localCtx }
          );
        }
        const reverse = value["@reverse"];
        if (!_isString(reverse)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a @context @reverse value must be a string.",
            "jsonld.SyntaxError",
            { code: "invalid IRI mapping", context: localCtx }
          );
        }
        if (reverse.match(REGEX_KEYWORD)) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "reserved @reverse value",
                level: "warning",
                message: '@reverse values beginning with "@" are reserved for future use and dropped.',
                details: {
                  reverse
                }
              },
              options
            });
          }
          if (previousMapping) {
            activeCtx.mappings.set(term, previousMapping);
          } else {
            activeCtx.mappings.delete(term);
          }
          return;
        }
        const id2 = _expandIri(
          activeCtx,
          reverse,
          { vocab: true, base: false },
          localCtx,
          defined,
          options
        );
        if (!_isAbsoluteIri(id2)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a @context @reverse value must be an absolute IRI or a blank node identifier.",
            "jsonld.SyntaxError",
            { code: "invalid IRI mapping", context: localCtx }
          );
        }
        mapping["@id"] = id2;
        mapping.reverse = true;
      } else if ("@id" in value) {
        let id2 = value["@id"];
        if (id2 && !_isString(id2)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; a @context @id value must be an array of strings or a string.",
            "jsonld.SyntaxError",
            { code: "invalid IRI mapping", context: localCtx }
          );
        }
        if (id2 === null) {
          mapping["@id"] = null;
        } else if (!api.isKeyword(id2) && id2.match(REGEX_KEYWORD)) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "reserved @id value",
                level: "warning",
                message: '@id values beginning with "@" are reserved for future use and dropped.',
                details: {
                  id: id2
                }
              },
              options
            });
          }
          if (previousMapping) {
            activeCtx.mappings.set(term, previousMapping);
          } else {
            activeCtx.mappings.delete(term);
          }
          return;
        } else if (id2 !== term) {
          id2 = _expandIri(
            activeCtx,
            id2,
            { vocab: true, base: false },
            localCtx,
            defined,
            options
          );
          if (!_isAbsoluteIri(id2) && !api.isKeyword(id2)) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; a @context @id value must be an absolute IRI, a blank node identifier, or a keyword.",
              "jsonld.SyntaxError",
              { code: "invalid IRI mapping", context: localCtx }
            );
          }
          if (term.match(/(?::[^:])|\//)) {
            const termDefined = new Map(defined).set(term, true);
            const termIri = _expandIri(
              activeCtx,
              term,
              { vocab: true, base: false },
              localCtx,
              termDefined,
              options
            );
            if (termIri !== id2) {
              throw new JsonLdError(
                "Invalid JSON-LD syntax; term in form of IRI must expand to definition.",
                "jsonld.SyntaxError",
                { code: "invalid IRI mapping", context: localCtx }
              );
            }
          }
          mapping["@id"] = id2;
          mapping._prefix = simpleTerm && !mapping._termHasColon && id2.match(/[:\/\?#\[\]@]$/) !== null;
        }
      }
      if (!("@id" in mapping)) {
        if (mapping._termHasColon) {
          const prefix = term.substr(0, colon);
          if (localCtx.hasOwnProperty(prefix)) {
            api.createTermDefinition({
              activeCtx,
              localCtx,
              term: prefix,
              defined,
              options
            });
          }
          if (activeCtx.mappings.has(prefix)) {
            const suffix = term.substr(colon + 1);
            mapping["@id"] = activeCtx.mappings.get(prefix)["@id"] + suffix;
          } else {
            mapping["@id"] = term;
          }
        } else if (term === "@type") {
          mapping["@id"] = term;
        } else {
          if (!("@vocab" in activeCtx)) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; @context terms must define an @id.",
              "jsonld.SyntaxError",
              { code: "invalid IRI mapping", context: localCtx, term }
            );
          }
          mapping["@id"] = activeCtx["@vocab"] + term;
        }
      }
      if (value["@protected"] === true || defined.get("@protected") === true && value["@protected"] !== false) {
        activeCtx.protected[term] = true;
        mapping.protected = true;
      }
      defined.set(term, true);
      if ("@type" in value) {
        let type = value["@type"];
        if (!_isString(type)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; an @context @type value must be a string.",
            "jsonld.SyntaxError",
            { code: "invalid type mapping", context: localCtx }
          );
        }
        if (type === "@json" || type === "@none") {
          if (api.processingMode(activeCtx, 1)) {
            throw new JsonLdError(
              `Invalid JSON-LD syntax; an @context @type value must not be "${type}" in JSON-LD 1.0 mode.`,
              "jsonld.SyntaxError",
              { code: "invalid type mapping", context: localCtx }
            );
          }
        } else if (type !== "@id" && type !== "@vocab") {
          type = _expandIri(
            activeCtx,
            type,
            { vocab: true, base: false },
            localCtx,
            defined,
            options
          );
          if (!_isAbsoluteIri(type)) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; an @context @type value must be an absolute IRI.",
              "jsonld.SyntaxError",
              { code: "invalid type mapping", context: localCtx }
            );
          }
          if (type.indexOf("_:") === 0) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; an @context @type value must be an IRI, not a blank node identifier.",
              "jsonld.SyntaxError",
              { code: "invalid type mapping", context: localCtx }
            );
          }
        }
        mapping["@type"] = type;
      }
      if ("@container" in value) {
        const container = _isString(value["@container"]) ? [value["@container"]] : value["@container"] || [];
        const validContainers = ["@list", "@set", "@index", "@language"];
        let isValid = true;
        const hasSet = container.includes("@set");
        if (api.processingMode(activeCtx, 1.1)) {
          validContainers.push("@graph", "@id", "@type");
          if (container.includes("@list")) {
            if (container.length !== 1) {
              throw new JsonLdError(
                "Invalid JSON-LD syntax; @context @container with @list must have no other values",
                "jsonld.SyntaxError",
                { code: "invalid container mapping", context: localCtx }
              );
            }
          } else if (container.includes("@graph")) {
            if (container.some((key) => key !== "@graph" && key !== "@id" && key !== "@index" && key !== "@set")) {
              throw new JsonLdError(
                "Invalid JSON-LD syntax; @context @container with @graph must have no other values other than @id, @index, and @set",
                "jsonld.SyntaxError",
                { code: "invalid container mapping", context: localCtx }
              );
            }
          } else {
            isValid &= container.length <= (hasSet ? 2 : 1);
          }
          if (container.includes("@type")) {
            mapping["@type"] = mapping["@type"] || "@id";
            if (!["@id", "@vocab"].includes(mapping["@type"])) {
              throw new JsonLdError(
                "Invalid JSON-LD syntax; container: @type requires @type to be @id or @vocab.",
                "jsonld.SyntaxError",
                { code: "invalid type mapping", context: localCtx }
              );
            }
          }
        } else {
          isValid &= !_isArray(value["@container"]);
          isValid &= container.length <= 1;
        }
        isValid &= container.every((c) => validContainers.includes(c));
        isValid &= !(hasSet && container.includes("@list"));
        if (!isValid) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context @container value must be one of the following: " + validContainers.join(", "),
            "jsonld.SyntaxError",
            { code: "invalid container mapping", context: localCtx }
          );
        }
        if (mapping.reverse && !container.every((c) => ["@index", "@set"].includes(c))) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context @container value for a @reverse type definition must be @index or @set.",
            "jsonld.SyntaxError",
            { code: "invalid reverse property", context: localCtx }
          );
        }
        mapping["@container"] = container;
      }
      if ("@index" in value) {
        if (!("@container" in value) || !mapping["@container"].includes("@index")) {
          throw new JsonLdError(
            `Invalid JSON-LD syntax; @index without @index in @container: "${value["@index"]}" on term "${term}".`,
            "jsonld.SyntaxError",
            { code: "invalid term definition", context: localCtx }
          );
        }
        if (!_isString(value["@index"]) || value["@index"].indexOf("@") === 0) {
          throw new JsonLdError(
            `Invalid JSON-LD syntax; @index must expand to an IRI: "${value["@index"]}" on term "${term}".`,
            "jsonld.SyntaxError",
            { code: "invalid term definition", context: localCtx }
          );
        }
        mapping["@index"] = value["@index"];
      }
      if ("@context" in value) {
        mapping["@context"] = value["@context"];
      }
      if ("@language" in value && !("@type" in value)) {
        let language = value["@language"];
        if (language !== null && !_isString(language)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context @language value must be a string or null.",
            "jsonld.SyntaxError",
            { code: "invalid language mapping", context: localCtx }
          );
        }
        if (language !== null) {
          language = language.toLowerCase();
        }
        mapping["@language"] = language;
      }
      if ("@prefix" in value) {
        if (term.match(/:|\//)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context @prefix used on a compact IRI term",
            "jsonld.SyntaxError",
            { code: "invalid term definition", context: localCtx }
          );
        }
        if (api.isKeyword(mapping["@id"])) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; keywords may not be used as prefixes",
            "jsonld.SyntaxError",
            { code: "invalid term definition", context: localCtx }
          );
        }
        if (typeof value["@prefix"] === "boolean") {
          mapping._prefix = value["@prefix"] === true;
        } else {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context value for @prefix must be boolean",
            "jsonld.SyntaxError",
            { code: "invalid @prefix value", context: localCtx }
          );
        }
      }
      if ("@direction" in value) {
        const direction = value["@direction"];
        if (direction !== null && direction !== "ltr" && direction !== "rtl") {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; @direction value must be null, "ltr", or "rtl".',
            "jsonld.SyntaxError",
            { code: "invalid base direction", context: localCtx }
          );
        }
        mapping["@direction"] = direction;
      }
      if ("@nest" in value) {
        const nest = value["@nest"];
        if (!_isString(nest) || nest !== "@nest" && nest.indexOf("@") === 0) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; @context @nest value must be a string which is not a keyword other than @nest.",
            "jsonld.SyntaxError",
            { code: "invalid @nest value", context: localCtx }
          );
        }
        mapping["@nest"] = nest;
      }
      const id = mapping["@id"];
      if (id === "@context" || id === "@preserve") {
        throw new JsonLdError(
          "Invalid JSON-LD syntax; @context and @preserve cannot be aliased.",
          "jsonld.SyntaxError",
          { code: "invalid keyword alias", context: localCtx }
        );
      }
      if (previousMapping && previousMapping.protected && !overrideProtected) {
        activeCtx.protected[term] = true;
        mapping.protected = true;
        if (!_deepCompare(previousMapping, mapping)) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; tried to redefine a protected term.",
            "jsonld.SyntaxError",
            { code: "protected term redefinition", context: localCtx, term }
          );
        }
      }
    };
    api.expandIri = (activeCtx, value, relativeTo, options) => {
      return _expandIri(
        activeCtx,
        value,
        relativeTo,
        void 0,
        void 0,
        options
      );
    };
    function _expandIri(activeCtx, value, relativeTo, localCtx, defined, options) {
      if (value === null || !_isString(value) || api.isKeyword(value)) {
        return value;
      }
      if (value.match(REGEX_KEYWORD)) {
        return null;
      }
      if (localCtx && localCtx.hasOwnProperty(value) && defined.get(value) !== true) {
        api.createTermDefinition({
          activeCtx,
          localCtx,
          term: value,
          defined,
          options
        });
      }
      relativeTo = relativeTo || {};
      if (relativeTo.vocab) {
        const mapping = activeCtx.mappings.get(value);
        if (mapping === null) {
          return null;
        }
        if (_isObject(mapping) && "@id" in mapping) {
          return mapping["@id"];
        }
      }
      const colon = value.indexOf(":");
      if (colon > 0) {
        const prefix = value.substr(0, colon);
        const suffix = value.substr(colon + 1);
        if (prefix === "_" || suffix.indexOf("//") === 0) {
          return value;
        }
        if (localCtx && localCtx.hasOwnProperty(prefix)) {
          api.createTermDefinition({
            activeCtx,
            localCtx,
            term: prefix,
            defined,
            options
          });
        }
        const mapping = activeCtx.mappings.get(prefix);
        if (mapping && mapping._prefix) {
          return mapping["@id"] + suffix;
        }
        if (_isAbsoluteIri(value)) {
          return value;
        }
      }
      if (relativeTo.vocab && "@vocab" in activeCtx) {
        const prependedResult = activeCtx["@vocab"] + value;
        value = prependedResult;
      } else if (relativeTo.base) {
        let prependedResult;
        let base;
        if ("@base" in activeCtx) {
          if (activeCtx["@base"]) {
            base = prependBase(options.base, activeCtx["@base"]);
            prependedResult = prependBase(base, value);
          } else {
            base = activeCtx["@base"];
            prependedResult = value;
          }
        } else {
          base = options.base;
          prependedResult = prependBase(options.base, value);
        }
        value = prependedResult;
      }
      return value;
    }
    api.getInitialContext = (options) => {
      const key = JSON.stringify({ processingMode: options.processingMode });
      const cached = INITIAL_CONTEXT_CACHE.get(key);
      if (cached) {
        return cached;
      }
      const initialContext = {
        processingMode: options.processingMode,
        mappings: /* @__PURE__ */ new Map(),
        inverse: null,
        getInverse: _createInverseContext,
        clone: _cloneActiveContext,
        revertToPreviousContext: _revertToPreviousContext,
        protected: {}
      };
      if (INITIAL_CONTEXT_CACHE.size === INITIAL_CONTEXT_CACHE_MAX_SIZE) {
        INITIAL_CONTEXT_CACHE.clear();
      }
      INITIAL_CONTEXT_CACHE.set(key, initialContext);
      return initialContext;
      function _createInverseContext() {
        const activeCtx = this;
        if (activeCtx.inverse) {
          return activeCtx.inverse;
        }
        const inverse = activeCtx.inverse = {};
        const fastCurieMap = activeCtx.fastCurieMap = {};
        const irisToTerms = {};
        const defaultLanguage = (activeCtx["@language"] || "@none").toLowerCase();
        const defaultDirection = activeCtx["@direction"];
        const mappings = activeCtx.mappings;
        const terms = [...mappings.keys()].sort(_compareShortestLeast);
        for (const term of terms) {
          const mapping = mappings.get(term);
          if (mapping === null) {
            continue;
          }
          let container = mapping["@container"] || "@none";
          container = [].concat(container).sort().join("");
          if (mapping["@id"] === null) {
            continue;
          }
          const ids = _asArray(mapping["@id"]);
          for (const iri of ids) {
            let entry = inverse[iri];
            const isKeyword = api.isKeyword(iri);
            if (!entry) {
              inverse[iri] = entry = {};
              if (!isKeyword && !mapping._termHasColon) {
                irisToTerms[iri] = [term];
                const fastCurieEntry = { iri, terms: irisToTerms[iri] };
                if (iri[0] in fastCurieMap) {
                  fastCurieMap[iri[0]].push(fastCurieEntry);
                } else {
                  fastCurieMap[iri[0]] = [fastCurieEntry];
                }
              }
            } else if (!isKeyword && !mapping._termHasColon) {
              irisToTerms[iri].push(term);
            }
            if (!entry[container]) {
              entry[container] = {
                "@language": {},
                "@type": {},
                "@any": {}
              };
            }
            entry = entry[container];
            _addPreferredTerm(term, entry["@any"], "@none");
            if (mapping.reverse) {
              _addPreferredTerm(term, entry["@type"], "@reverse");
            } else if (mapping["@type"] === "@none") {
              _addPreferredTerm(term, entry["@any"], "@none");
              _addPreferredTerm(term, entry["@language"], "@none");
              _addPreferredTerm(term, entry["@type"], "@none");
            } else if ("@type" in mapping) {
              _addPreferredTerm(term, entry["@type"], mapping["@type"]);
            } else if ("@language" in mapping && "@direction" in mapping) {
              const language = mapping["@language"];
              const direction = mapping["@direction"];
              if (language && direction) {
                _addPreferredTerm(
                  term,
                  entry["@language"],
                  `${language}_${direction}`.toLowerCase()
                );
              } else if (language) {
                _addPreferredTerm(term, entry["@language"], language.toLowerCase());
              } else if (direction) {
                _addPreferredTerm(term, entry["@language"], `_${direction}`);
              } else {
                _addPreferredTerm(term, entry["@language"], "@null");
              }
            } else if ("@language" in mapping) {
              _addPreferredTerm(
                term,
                entry["@language"],
                (mapping["@language"] || "@null").toLowerCase()
              );
            } else if ("@direction" in mapping) {
              if (mapping["@direction"]) {
                _addPreferredTerm(
                  term,
                  entry["@language"],
                  `_${mapping["@direction"]}`
                );
              } else {
                _addPreferredTerm(term, entry["@language"], "@none");
              }
            } else if (defaultDirection) {
              _addPreferredTerm(term, entry["@language"], `_${defaultDirection}`);
              _addPreferredTerm(term, entry["@language"], "@none");
              _addPreferredTerm(term, entry["@type"], "@none");
            } else {
              _addPreferredTerm(term, entry["@language"], defaultLanguage);
              _addPreferredTerm(term, entry["@language"], "@none");
              _addPreferredTerm(term, entry["@type"], "@none");
            }
          }
        }
        for (const key2 in fastCurieMap) {
          _buildIriMap(fastCurieMap, key2, 1);
        }
        return inverse;
      }
      function _buildIriMap(iriMap, key2, idx) {
        const entries = iriMap[key2];
        const next = iriMap[key2] = {};
        let iri;
        let letter;
        for (const entry of entries) {
          iri = entry.iri;
          if (idx >= iri.length) {
            letter = "";
          } else {
            letter = iri[idx];
          }
          if (letter in next) {
            next[letter].push(entry);
          } else {
            next[letter] = [entry];
          }
        }
        for (const key3 in next) {
          if (key3 === "") {
            continue;
          }
          _buildIriMap(next, key3, idx + 1);
        }
      }
      function _addPreferredTerm(term, entry, typeOrLanguageValue) {
        if (!entry.hasOwnProperty(typeOrLanguageValue)) {
          entry[typeOrLanguageValue] = term;
        }
      }
      function _cloneActiveContext() {
        const child = {};
        child.mappings = util.clone(this.mappings);
        child.clone = this.clone;
        child.inverse = null;
        child.getInverse = this.getInverse;
        child.protected = util.clone(this.protected);
        if (this.previousContext) {
          child.previousContext = this.previousContext.clone();
        }
        child.revertToPreviousContext = this.revertToPreviousContext;
        if ("@base" in this) {
          child["@base"] = this["@base"];
        }
        if ("@language" in this) {
          child["@language"] = this["@language"];
        }
        if ("@vocab" in this) {
          child["@vocab"] = this["@vocab"];
        }
        return child;
      }
      function _revertToPreviousContext() {
        if (!this.previousContext) {
          return this;
        }
        return this.previousContext.clone();
      }
    };
    api.getContextValue = (ctx, key, type) => {
      if (key === null) {
        if (type === "@context") {
          return void 0;
        }
        return null;
      }
      if (ctx.mappings.has(key)) {
        const entry = ctx.mappings.get(key);
        if (_isUndefined(type)) {
          return entry;
        }
        if (entry.hasOwnProperty(type)) {
          return entry[type];
        }
      }
      if (type === "@language" && type in ctx) {
        return ctx[type];
      }
      if (type === "@direction" && type in ctx) {
        return ctx[type];
      }
      if (type === "@context") {
        return void 0;
      }
      return null;
    };
    api.processingMode = (activeCtx, version) => {
      if (version.toString() >= "1.1") {
        return !activeCtx.processingMode || activeCtx.processingMode >= "json-ld-" + version.toString();
      } else {
        return activeCtx.processingMode === "json-ld-1.0";
      }
    };
    api.isKeyword = (v) => {
      if (!_isString(v) || v[0] !== "@") {
        return false;
      }
      switch (v) {
        case "@base":
        case "@container":
        case "@context":
        case "@default":
        case "@direction":
        case "@embed":
        case "@explicit":
        case "@graph":
        case "@id":
        case "@included":
        case "@index":
        case "@json":
        case "@language":
        case "@list":
        case "@nest":
        case "@none":
        case "@omitDefault":
        case "@prefix":
        case "@preserve":
        case "@protected":
        case "@requireAll":
        case "@reverse":
        case "@set":
        case "@type":
        case "@value":
        case "@version":
        case "@vocab":
          return true;
      }
      return false;
    };
    function _deepCompare(x1, x2) {
      if (!(x1 && typeof x1 === "object") || !(x2 && typeof x2 === "object")) {
        return x1 === x2;
      }
      const x1Array = Array.isArray(x1);
      if (x1Array !== Array.isArray(x2)) {
        return false;
      }
      if (x1Array) {
        if (x1.length !== x2.length) {
          return false;
        }
        for (let i = 0; i < x1.length; ++i) {
          if (!_deepCompare(x1[i], x2[i])) {
            return false;
          }
        }
        return true;
      }
      const k1s = Object.keys(x1);
      const k2s = Object.keys(x2);
      if (k1s.length !== k2s.length) {
        return false;
      }
      for (const k1 in x1) {
        let v1 = x1[k1];
        let v2 = x2[k1];
        if (k1 === "@container") {
          if (Array.isArray(v1) && Array.isArray(v2)) {
            v1 = v1.slice().sort();
            v2 = v2.slice().sort();
          }
        }
        if (!_deepCompare(v1, v2)) {
          return false;
        }
      }
      return true;
    }
  }
});

// src/core/phase0-shims/deterministic-lru.cjs
var require_deterministic_lru = __commonJS({
  "src/core/phase0-shims/deterministic-lru.cjs"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    module.exports = class DeterministicLru {
      constructor({ max }) {
        this.max = max;
        this.entries = /* @__PURE__ */ new Map();
      }
      get(key) {
        if (!this.entries.has(key)) {
          return void 0;
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
  }
});

// node_modules/jsonld/lib/ResolvedContext.js
var require_ResolvedContext = __commonJS({
  "node_modules/jsonld/lib/ResolvedContext.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var LRU = require_deterministic_lru();
    var MAX_ACTIVE_CONTEXTS = 10;
    module.exports = class ResolvedContext {
      /**
       * Creates a ResolvedContext.
       *
       * @param document the context document.
       */
      constructor({ document }) {
        this.document = document;
        this.cache = new LRU({ max: MAX_ACTIVE_CONTEXTS });
      }
      getProcessed(activeCtx) {
        return this.cache.get(activeCtx);
      }
      setProcessed(activeCtx, processedCtx) {
        this.cache.set(activeCtx, processedCtx);
      }
    };
  }
});

// node_modules/jsonld/lib/ContextResolver.js
var require_ContextResolver = __commonJS({
  "node_modules/jsonld/lib/ContextResolver.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var {
      isArray: _isArray,
      isObject: _isObject,
      isString: _isString
    } = require_types();
    var {
      asArray: _asArray
    } = require_util();
    var { prependBase } = require_url();
    var JsonLdError = require_JsonLdError();
    var ResolvedContext = require_ResolvedContext();
    var MAX_CONTEXT_URLS = 10;
    module.exports = class ContextResolver {
      /**
       * Creates a ContextResolver.
       *
       * @param sharedCache a shared LRU cache with `get` and `set` APIs.
       */
      constructor({ sharedCache }) {
        this.perOpCache = /* @__PURE__ */ new Map();
        this.sharedCache = sharedCache;
      }
      async resolve({
        activeCtx,
        context,
        documentLoader,
        base,
        cycles = /* @__PURE__ */ new Set()
      }) {
        if (context && _isObject(context) && context["@context"]) {
          context = context["@context"];
        }
        context = _asArray(context);
        const allResolved = [];
        for (const ctx of context) {
          if (_isString(ctx)) {
            let resolved2 = this._get(ctx);
            if (!resolved2) {
              resolved2 = await this._resolveRemoteContext(
                { activeCtx, url: ctx, documentLoader, base, cycles }
              );
            }
            if (_isArray(resolved2)) {
              allResolved.push(...resolved2);
            } else {
              allResolved.push(resolved2);
            }
            continue;
          }
          if (ctx === null) {
            allResolved.push(new ResolvedContext({ document: null }));
            continue;
          }
          if (!_isObject(ctx)) {
            _throwInvalidLocalContext(context);
          }
          const key = JSON.stringify(ctx);
          let resolved = this._get(key);
          if (!resolved) {
            resolved = new ResolvedContext({ document: ctx });
            this._cacheResolvedContext({ key, resolved, tag: "static" });
          }
          allResolved.push(resolved);
        }
        return allResolved;
      }
      _get(key) {
        let resolved = this.perOpCache.get(key);
        if (!resolved) {
          const tagMap = this.sharedCache.get(key);
          if (tagMap) {
            resolved = tagMap.get("static");
            if (resolved) {
              this.perOpCache.set(key, resolved);
            }
          }
        }
        return resolved;
      }
      _cacheResolvedContext({ key, resolved, tag }) {
        this.perOpCache.set(key, resolved);
        if (tag !== void 0) {
          let tagMap = this.sharedCache.get(key);
          if (!tagMap) {
            tagMap = /* @__PURE__ */ new Map();
            this.sharedCache.set(key, tagMap);
          }
          tagMap.set(tag, resolved);
        }
        return resolved;
      }
      async _resolveRemoteContext({ activeCtx, url, documentLoader, base, cycles }) {
        url = prependBase(base, url);
        const { context, remoteDoc } = await this._fetchContext(
          { activeCtx, url, documentLoader, cycles }
        );
        base = remoteDoc.documentUrl || url;
        _resolveContextUrls({ context, base });
        const resolved = await this.resolve(
          { activeCtx, context, documentLoader, base, cycles }
        );
        this._cacheResolvedContext({ key: url, resolved, tag: remoteDoc.tag });
        return resolved;
      }
      async _fetchContext({ activeCtx, url, documentLoader, cycles }) {
        if (cycles.size > MAX_CONTEXT_URLS) {
          throw new JsonLdError(
            "Maximum number of @context URLs exceeded.",
            "jsonld.ContextUrlError",
            {
              code: activeCtx.processingMode === "json-ld-1.0" ? "loading remote context failed" : "context overflow",
              max: MAX_CONTEXT_URLS
            }
          );
        }
        if (cycles.has(url)) {
          throw new JsonLdError(
            "Cyclical @context URLs detected.",
            "jsonld.ContextUrlError",
            {
              code: activeCtx.processingMode === "json-ld-1.0" ? "recursive context inclusion" : "context overflow",
              url
            }
          );
        }
        cycles.add(url);
        let context;
        let remoteDoc;
        try {
          remoteDoc = await documentLoader(url);
          context = remoteDoc.document || null;
          if (_isString(context)) {
            context = JSON.parse(context);
          }
        } catch (e) {
          throw new JsonLdError(
            `Dereferencing a URL did not result in a valid JSON-LD object. Possible causes are an inaccessible URL perhaps due to a same-origin policy (ensure the server uses CORS if you are using client-side JavaScript), too many redirects, a non-JSON response, or more than one HTTP Link Header was provided for a remote context. URL: "${url}".`,
            "jsonld.InvalidUrl",
            { code: "loading remote context failed", url, cause: e }
          );
        }
        if (!_isObject(context)) {
          throw new JsonLdError(
            `Dereferencing a URL did not result in a JSON object. The response was valid JSON, but it was not a JSON object. URL: "${url}".`,
            "jsonld.InvalidUrl",
            { code: "invalid remote context", url }
          );
        }
        if (!("@context" in context)) {
          context = { "@context": {} };
        } else {
          context = { "@context": context["@context"] };
        }
        if (remoteDoc.contextUrl) {
          if (!_isArray(context["@context"])) {
            context["@context"] = [context["@context"]];
          }
          context["@context"].push(remoteDoc.contextUrl);
        }
        return { context, remoteDoc };
      }
    };
    function _throwInvalidLocalContext(ctx) {
      throw new JsonLdError(
        "Invalid JSON-LD syntax; @context must be an object.",
        "jsonld.SyntaxError",
        {
          code: "invalid local context",
          context: ctx
        }
      );
    }
    function _resolveContextUrls({ context, base }) {
      if (!context) {
        return;
      }
      const ctx = context["@context"];
      if (_isString(ctx)) {
        context["@context"] = prependBase(base, ctx);
        return;
      }
      if (_isArray(ctx)) {
        for (let i = 0; i < ctx.length; ++i) {
          const element = ctx[i];
          if (_isString(element)) {
            ctx[i] = prependBase(base, element);
            continue;
          }
          if (_isObject(element)) {
            _resolveContextUrls({ context: { "@context": element }, base });
          }
        }
        return;
      }
      if (!_isObject(ctx)) {
        return;
      }
      for (const term in ctx) {
        _resolveContextUrls({ context: ctx[term], base });
      }
    }
  }
});

// node_modules/jsonld/lib/expand.js
var require_expand = __commonJS({
  "node_modules/jsonld/lib/expand.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var JsonLdError = require_JsonLdError();
    var {
      isArray: _isArray,
      isObject: _isObject,
      isEmptyObject: _isEmptyObject,
      isString: _isString,
      isUndefined: _isUndefined
    } = require_types();
    var {
      isList: _isList,
      isValue: _isValue,
      isGraph: _isGraph,
      isSubject: _isSubject
    } = require_graphTypes();
    var {
      expandIri: _expandIri,
      getContextValue: _getContextValue,
      isKeyword: _isKeyword,
      process: _processContext,
      processingMode: _processingMode
    } = require_context();
    var {
      isAbsolute: _isAbsoluteIri
    } = require_url();
    var {
      REGEX_BCP47,
      REGEX_KEYWORD,
      addValue: _addValue,
      asArray: _asArray,
      getValues: _getValues,
      validateTypeValue: _validateTypeValue
    } = require_util();
    var {
      handleEvent: _handleEvent
    } = require_fail_closed_events();
    var api = {};
    module.exports = api;
    api.expand = async ({
      activeCtx,
      activeProperty = null,
      element,
      options = {},
      insideList = false,
      insideIndex = false,
      typeScopedContext = null
    }) => {
      if (element === null || element === void 0) {
        return null;
      }
      if (activeProperty === "@default") {
        options = Object.assign({}, options, { isFrame: false });
      }
      if (!_isArray(element) && !_isObject(element)) {
        if (!insideList && (activeProperty === null || _expandIri(
          activeCtx,
          activeProperty,
          { vocab: true },
          options
        ) === "@graph")) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "free-floating scalar",
                level: "warning",
                message: "Dropping free-floating scalar not in a list.",
                details: {
                  value: element
                  //activeProperty
                  //insideList
                }
              },
              options
            });
          }
          return null;
        }
        return _expandValue({ activeCtx, activeProperty, value: element, options });
      }
      if (_isArray(element)) {
        let rval2 = [];
        const container = _getContextValue(
          activeCtx,
          activeProperty,
          "@container"
        ) || [];
        insideList = insideList || container.includes("@list");
        for (let i = 0; i < element.length; ++i) {
          let e = await api.expand({
            activeCtx,
            activeProperty,
            element: element[i],
            options,
            insideIndex,
            typeScopedContext
          });
          if (insideList && _isArray(e)) {
            e = { "@list": e };
          }
          if (e === null) {
            continue;
          }
          if (_isArray(e)) {
            rval2 = rval2.concat(e);
          } else {
            rval2.push(e);
          }
        }
        return rval2;
      }
      const expandedActiveProperty = _expandIri(
        activeCtx,
        activeProperty,
        { vocab: true },
        options
      );
      const propertyScopedCtx = _getContextValue(activeCtx, activeProperty, "@context");
      typeScopedContext = typeScopedContext || (activeCtx.previousContext ? activeCtx : null);
      let keys = Object.keys(element).sort();
      let mustRevert = !insideIndex;
      if (mustRevert && typeScopedContext && keys.length <= 2 && !keys.includes("@context")) {
        for (const key of keys) {
          const expandedProperty = _expandIri(
            typeScopedContext,
            key,
            { vocab: true },
            options
          );
          if (expandedProperty === "@value") {
            mustRevert = false;
            activeCtx = typeScopedContext;
            break;
          }
          if (expandedProperty === "@id" && keys.length === 1) {
            mustRevert = false;
            break;
          }
        }
      }
      if (mustRevert) {
        activeCtx = activeCtx.revertToPreviousContext();
      }
      if (!_isUndefined(propertyScopedCtx)) {
        activeCtx = await _processContext({
          activeCtx,
          localCtx: propertyScopedCtx,
          propagate: true,
          overrideProtected: true,
          options
        });
      }
      if ("@context" in element) {
        activeCtx = await _processContext(
          { activeCtx, localCtx: element["@context"], options }
        );
      }
      typeScopedContext = activeCtx;
      let typeKey = null;
      for (const key of keys) {
        const expandedProperty = _expandIri(activeCtx, key, { vocab: true }, options);
        if (expandedProperty === "@type") {
          typeKey = typeKey || key;
          const value = element[key];
          const types = Array.isArray(value) ? value.length > 1 ? value.slice().sort() : value : [value];
          for (const type of types) {
            const ctx = _getContextValue(typeScopedContext, type, "@context");
            if (!_isUndefined(ctx)) {
              activeCtx = await _processContext({
                activeCtx,
                localCtx: ctx,
                options,
                propagate: false
              });
            }
          }
        }
      }
      let rval = {};
      await _expandObject({
        activeCtx,
        activeProperty,
        expandedActiveProperty,
        element,
        expandedParent: rval,
        options,
        insideList,
        typeKey,
        typeScopedContext
      });
      keys = Object.keys(rval);
      let count = keys.length;
      if ("@value" in rval) {
        if ("@type" in rval && ("@language" in rval || "@direction" in rval)) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; an element containing "@value" may not contain both "@type" and either "@language" or "@direction".',
            "jsonld.SyntaxError",
            { code: "invalid value object", element: rval }
          );
        }
        let validCount = count - 1;
        if ("@type" in rval) {
          validCount -= 1;
        }
        if ("@index" in rval) {
          validCount -= 1;
        }
        if ("@language" in rval) {
          validCount -= 1;
        }
        if ("@direction" in rval) {
          validCount -= 1;
        }
        if (validCount !== 0) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; an element containing "@value" may only have an "@index" property and either "@type" or either or both "@language" or "@direction".',
            "jsonld.SyntaxError",
            { code: "invalid value object", element: rval }
          );
        }
        const values = rval["@value"] === null ? [] : _asArray(rval["@value"]);
        const types = _getValues(rval, "@type");
        if (_processingMode(activeCtx, 1.1) && types.includes("@json") && types.length === 1) {
        } else if (values.length === 0) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "null @value value",
                level: "warning",
                message: "Dropping null @value value.",
                details: {
                  value: rval
                }
              },
              options
            });
          }
          rval = null;
        } else if (!values.every((v) => _isString(v) || _isEmptyObject(v)) && "@language" in rval) {
          throw new JsonLdError(
            "Invalid JSON-LD syntax; only strings may be language-tagged.",
            "jsonld.SyntaxError",
            { code: "invalid language-tagged value", element: rval }
          );
        } else if (!types.every((t) => _isAbsoluteIri(t) && !(_isString(t) && t.indexOf("_:") === 0) || _isEmptyObject(t))) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; an element containing "@value" and "@type" must have an absolute IRI for the value of "@type".',
            "jsonld.SyntaxError",
            { code: "invalid typed value", element: rval }
          );
        }
      } else if ("@type" in rval && !_isArray(rval["@type"])) {
        rval["@type"] = [rval["@type"]];
      } else if ("@set" in rval || "@list" in rval) {
        if (count > 1 && !(count === 2 && "@index" in rval)) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; if an element has the property "@set" or "@list", then it can have at most one other property that is "@index".',
            "jsonld.SyntaxError",
            { code: "invalid set or list object", element: rval }
          );
        }
        if ("@set" in rval) {
          rval = rval["@set"];
          keys = Object.keys(rval);
          count = keys.length;
        }
      } else if (count === 1 && "@language" in rval) {
        if (options.eventHandler) {
          _handleEvent({
            event: {
              type: ["JsonLdEvent"],
              code: "object with only @language",
              level: "warning",
              message: "Dropping object with only @language.",
              details: {
                value: rval
              }
            },
            options
          });
        }
        rval = null;
      }
      if (_isObject(rval) && !options.keepFreeFloatingNodes && !insideList && (activeProperty === null || expandedActiveProperty === "@graph" || (_getContextValue(activeCtx, activeProperty, "@container") || []).includes("@graph"))) {
        rval = _dropUnsafeObject({ value: rval, count, options });
      }
      return rval;
    };
    function _dropUnsafeObject({
      value,
      count,
      options
    }) {
      if (count === 0 || "@value" in value || "@list" in value || count === 1 && "@id" in value) {
        if (options.eventHandler) {
          let code;
          let message;
          if (count === 0) {
            code = "empty object";
            message = "Dropping empty object.";
          } else if ("@value" in value) {
            code = "object with only @value";
            message = "Dropping object with only @value.";
          } else if ("@list" in value) {
            code = "object with only @list";
            message = "Dropping object with only @list.";
          } else if (count === 1 && "@id" in value) {
            code = "object with only @id";
            message = "Dropping object with only @id.";
          }
          _handleEvent({
            event: {
              type: ["JsonLdEvent"],
              code,
              level: "warning",
              message,
              details: {
                value
              }
            },
            options
          });
        }
        return null;
      }
      return value;
    }
    async function _expandObject({
      activeCtx,
      activeProperty,
      expandedActiveProperty,
      element,
      expandedParent,
      options = {},
      insideList,
      typeKey,
      typeScopedContext
    }) {
      const keys = Object.keys(element).sort();
      const nests = [];
      let unexpandedValue;
      const isJsonType = element[typeKey] && _expandIri(
        activeCtx,
        _isArray(element[typeKey]) ? element[typeKey][0] : element[typeKey],
        { vocab: true },
        {
          ...options,
          typeExpansion: true
        }
      ) === "@json";
      for (const key of keys) {
        let value = element[key];
        let expandedValue;
        if (key === "@context") {
          continue;
        }
        const expandedProperty = _expandIri(activeCtx, key, { vocab: true }, options);
        if (expandedProperty === null || !(_isAbsoluteIri(expandedProperty) || _isKeyword(expandedProperty))) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "invalid property",
                level: "warning",
                message: "Dropping property that did not expand into an absolute IRI or keyword.",
                details: {
                  property: key,
                  expandedProperty
                }
              },
              options
            });
          }
          continue;
        }
        if (_isKeyword(expandedProperty)) {
          if (expandedActiveProperty === "@reverse") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; a keyword cannot be used as a @reverse property.",
              "jsonld.SyntaxError",
              { code: "invalid reverse property map", value }
            );
          }
          if (expandedProperty in expandedParent && expandedProperty !== "@included" && expandedProperty !== "@type") {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; colliding keywords detected.",
              "jsonld.SyntaxError",
              { code: "colliding keywords", keyword: expandedProperty }
            );
          }
        }
        if (expandedProperty === "@id") {
          if (!_isString(value)) {
            if (!options.isFrame) {
              throw new JsonLdError(
                'Invalid JSON-LD syntax; "@id" value must a string.',
                "jsonld.SyntaxError",
                { code: "invalid @id value", value }
              );
            }
            if (_isObject(value)) {
              if (!_isEmptyObject(value)) {
                throw new JsonLdError(
                  'Invalid JSON-LD syntax; "@id" value an empty object or array of strings, if framing',
                  "jsonld.SyntaxError",
                  { code: "invalid @id value", value }
                );
              }
            } else if (_isArray(value)) {
              if (!value.every((v) => _isString(v))) {
                throw new JsonLdError(
                  'Invalid JSON-LD syntax; "@id" value an empty object or array of strings, if framing',
                  "jsonld.SyntaxError",
                  { code: "invalid @id value", value }
                );
              }
            } else {
              throw new JsonLdError(
                'Invalid JSON-LD syntax; "@id" value an empty object or array of strings, if framing',
                "jsonld.SyntaxError",
                { code: "invalid @id value", value }
              );
            }
          }
          _addValue(
            expandedParent,
            "@id",
            _asArray(value).map((v) => {
              if (_isString(v)) {
                const ve = _expandIri(activeCtx, v, { base: true }, options);
                if (options.eventHandler) {
                  if (ve === null) {
                    if (v === null) {
                      _handleEvent({
                        event: {
                          type: ["JsonLdEvent"],
                          code: "null @id value",
                          level: "warning",
                          message: "Null @id found.",
                          details: {
                            id: v
                          }
                        },
                        options
                      });
                    } else {
                      _handleEvent({
                        event: {
                          type: ["JsonLdEvent"],
                          code: "reserved @id value",
                          level: "warning",
                          message: "Reserved @id found.",
                          details: {
                            id: v
                          }
                        },
                        options
                      });
                    }
                  } else if (!_isAbsoluteIri(ve)) {
                    _handleEvent({
                      event: {
                        type: ["JsonLdEvent"],
                        code: "relative @id reference",
                        level: "warning",
                        message: "Relative @id reference found.",
                        details: {
                          id: v,
                          expandedId: ve
                        }
                      },
                      options
                    });
                  }
                }
                return ve;
              }
              return v;
            }),
            { propertyIsArray: options.isFrame }
          );
          continue;
        }
        if (expandedProperty === "@type") {
          if (_isObject(value)) {
            value = Object.fromEntries(Object.entries(value).map(([k, v]) => [
              _expandIri(typeScopedContext, k, { vocab: true }),
              _asArray(v).map(
                (vv) => _expandIri(
                  typeScopedContext,
                  vv,
                  { base: true, vocab: true },
                  { ...options, typeExpansion: true }
                )
              )
            ]));
          }
          _validateTypeValue(value, options.isFrame);
          _addValue(
            expandedParent,
            "@type",
            _asArray(value).map((v) => {
              if (_isString(v)) {
                const ve = _expandIri(
                  typeScopedContext,
                  v,
                  { base: true, vocab: true },
                  { ...options, typeExpansion: true }
                );
                if (ve !== "@json" && !_isAbsoluteIri(ve)) {
                  if (options.eventHandler) {
                    _handleEvent({
                      event: {
                        type: ["JsonLdEvent"],
                        code: "relative @type reference",
                        level: "warning",
                        message: "Relative @type reference found.",
                        details: {
                          type: v
                        }
                      },
                      options
                    });
                  }
                }
                return ve;
              }
              return v;
            }),
            { propertyIsArray: !!options.isFrame }
          );
          continue;
        }
        if (expandedProperty === "@included" && _processingMode(activeCtx, 1.1)) {
          const includedResult = _asArray(await api.expand({
            activeCtx,
            activeProperty,
            element: value,
            options
          }));
          if (!includedResult.every((v) => _isSubject(v))) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; values of @included must expand to node objects.",
              "jsonld.SyntaxError",
              { code: "invalid @included value", value }
            );
          }
          _addValue(
            expandedParent,
            "@included",
            includedResult,
            { propertyIsArray: true }
          );
          continue;
        }
        if (expandedProperty === "@graph" && !(_isObject(value) || _isArray(value))) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; "@graph" value must not be an object or an array.',
            "jsonld.SyntaxError",
            { code: "invalid @graph value", value }
          );
        }
        if (expandedProperty === "@value") {
          unexpandedValue = value;
          if (isJsonType && _processingMode(activeCtx, 1.1)) {
            expandedParent["@value"] = value;
          } else {
            _addValue(
              expandedParent,
              "@value",
              value,
              { propertyIsArray: options.isFrame }
            );
          }
          continue;
        }
        if (expandedProperty === "@language") {
          if (value === null) {
            continue;
          }
          if (!_isString(value) && !options.isFrame) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; "@language" value must be a string.',
              "jsonld.SyntaxError",
              { code: "invalid language-tagged string", value }
            );
          }
          value = _asArray(value).map((v) => _isString(v) ? v.toLowerCase() : v);
          for (const language of value) {
            if (_isString(language) && !language.match(REGEX_BCP47)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "invalid @language value",
                    level: "warning",
                    message: "@language value must be valid BCP47.",
                    details: {
                      language
                    }
                  },
                  options
                });
              }
            }
          }
          _addValue(
            expandedParent,
            "@language",
            value,
            { propertyIsArray: options.isFrame }
          );
          continue;
        }
        if (expandedProperty === "@direction") {
          if (!_isString(value) && !options.isFrame) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; "@direction" value must be a string.',
              "jsonld.SyntaxError",
              { code: "invalid base direction", value }
            );
          }
          value = _asArray(value);
          for (const dir of value) {
            if (_isString(dir) && dir !== "ltr" && dir !== "rtl") {
              throw new JsonLdError(
                'Invalid JSON-LD syntax; "@direction" must be "ltr" or "rtl".',
                "jsonld.SyntaxError",
                { code: "invalid base direction", value }
              );
            }
          }
          _addValue(
            expandedParent,
            "@direction",
            value,
            { propertyIsArray: options.isFrame }
          );
          continue;
        }
        if (expandedProperty === "@index") {
          if (!_isString(value)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; "@index" value must be a string.',
              "jsonld.SyntaxError",
              { code: "invalid @index value", value }
            );
          }
          _addValue(expandedParent, "@index", value);
          continue;
        }
        if (expandedProperty === "@reverse") {
          if (!_isObject(value)) {
            throw new JsonLdError(
              'Invalid JSON-LD syntax; "@reverse" value must be an object.',
              "jsonld.SyntaxError",
              { code: "invalid @reverse value", value }
            );
          }
          expandedValue = await api.expand({
            activeCtx,
            activeProperty: "@reverse",
            element: value,
            options
          });
          if ("@reverse" in expandedValue) {
            for (const property in expandedValue["@reverse"]) {
              _addValue(
                expandedParent,
                property,
                expandedValue["@reverse"][property],
                { propertyIsArray: true }
              );
            }
          }
          let reverseMap = expandedParent["@reverse"] || null;
          for (const property in expandedValue) {
            if (property === "@reverse") {
              continue;
            }
            if (reverseMap === null) {
              reverseMap = expandedParent["@reverse"] = {};
            }
            _addValue(reverseMap, property, [], { propertyIsArray: true });
            const items = expandedValue[property];
            for (let ii = 0; ii < items.length; ++ii) {
              const item = items[ii];
              if (_isValue(item) || _isList(item)) {
                throw new JsonLdError(
                  'Invalid JSON-LD syntax; "@reverse" value must not be a @value or an @list.',
                  "jsonld.SyntaxError",
                  { code: "invalid reverse property value", value: expandedValue }
                );
              }
              _addValue(reverseMap, property, item, { propertyIsArray: true });
            }
          }
          continue;
        }
        if (expandedProperty === "@nest") {
          nests.push(key);
          continue;
        }
        let termCtx = activeCtx;
        const ctx = _getContextValue(activeCtx, key, "@context");
        if (!_isUndefined(ctx)) {
          termCtx = await _processContext({
            activeCtx,
            localCtx: ctx,
            propagate: true,
            overrideProtected: true,
            options
          });
        }
        const container = _getContextValue(activeCtx, key, "@container") || [];
        if (container.includes("@language") && _isObject(value)) {
          const direction = _getContextValue(termCtx, key, "@direction");
          expandedValue = _expandLanguageMap(termCtx, value, direction, options);
        } else if (container.includes("@index") && _isObject(value)) {
          const asGraph = container.includes("@graph");
          const indexKey = _getContextValue(termCtx, key, "@index") || "@index";
          const propertyIndex = indexKey !== "@index" && _expandIri(activeCtx, indexKey, { vocab: true }, options);
          expandedValue = await _expandIndexMap({
            activeCtx: termCtx,
            options,
            activeProperty: key,
            value,
            asGraph,
            indexKey,
            propertyIndex
          });
        } else if (container.includes("@id") && _isObject(value)) {
          const asGraph = container.includes("@graph");
          expandedValue = await _expandIndexMap({
            activeCtx: termCtx,
            options,
            activeProperty: key,
            value,
            asGraph,
            indexKey: "@id"
          });
        } else if (container.includes("@type") && _isObject(value)) {
          expandedValue = await _expandIndexMap({
            // since container is `@type`, revert type scoped context when expanding
            activeCtx: termCtx.revertToPreviousContext(),
            options,
            activeProperty: key,
            value,
            asGraph: false,
            indexKey: "@type"
          });
        } else {
          const isList = expandedProperty === "@list";
          if (isList || expandedProperty === "@set") {
            let nextActiveProperty = activeProperty;
            if (isList && expandedActiveProperty === "@graph") {
              nextActiveProperty = null;
            }
            expandedValue = await api.expand({
              activeCtx: termCtx,
              activeProperty: nextActiveProperty,
              element: value,
              options,
              insideList: isList
            });
          } else if (_getContextValue(activeCtx, key, "@type") === "@json") {
            expandedValue = {
              "@type": "@json",
              "@value": value
            };
          } else {
            expandedValue = await api.expand({
              activeCtx: termCtx,
              activeProperty: key,
              element: value,
              options,
              insideList: false
            });
          }
        }
        if (expandedValue === null && expandedProperty !== "@value") {
          continue;
        }
        if (expandedProperty !== "@list" && !_isList(expandedValue) && container.includes("@list")) {
          expandedValue = { "@list": _asArray(expandedValue) };
        }
        if (container.includes("@graph") && !container.some((key2) => key2 === "@id" || key2 === "@index")) {
          expandedValue = _asArray(expandedValue);
          if (!options.isFrame) {
            expandedValue = expandedValue.filter((v) => {
              const count = Object.keys(v).length;
              return _dropUnsafeObject({ value: v, count, options }) !== null;
            });
          }
          if (expandedValue.length === 0) {
            continue;
          }
          expandedValue = expandedValue.map((v) => ({ "@graph": _asArray(v) }));
        }
        if (termCtx.mappings.has(key) && termCtx.mappings.get(key).reverse) {
          const reverseMap = expandedParent["@reverse"] = expandedParent["@reverse"] || {};
          expandedValue = _asArray(expandedValue);
          for (let ii = 0; ii < expandedValue.length; ++ii) {
            const item = expandedValue[ii];
            if (_isValue(item) || _isList(item)) {
              throw new JsonLdError(
                'Invalid JSON-LD syntax; "@reverse" value must not be a @value or an @list.',
                "jsonld.SyntaxError",
                { code: "invalid reverse property value", value: expandedValue }
              );
            }
            _addValue(reverseMap, expandedProperty, item, { propertyIsArray: true });
          }
          continue;
        }
        _addValue(expandedParent, expandedProperty, expandedValue, {
          propertyIsArray: true
        });
      }
      if ("@value" in expandedParent) {
        if (expandedParent["@type"] === "@json" && _processingMode(activeCtx, 1.1)) {
        } else if ((_isObject(unexpandedValue) || _isArray(unexpandedValue)) && !options.isFrame) {
          throw new JsonLdError(
            'Invalid JSON-LD syntax; "@value" value must not be an object or an array.',
            "jsonld.SyntaxError",
            { code: "invalid value object value", value: unexpandedValue }
          );
        }
      }
      for (const key of nests) {
        const nestedValues = _isArray(element[key]) ? element[key] : [element[key]];
        for (const nv of nestedValues) {
          if (!_isObject(nv) || Object.keys(nv).some((k) => _expandIri(activeCtx, k, { vocab: true }, options) === "@value")) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; nested value must be a node object.",
              "jsonld.SyntaxError",
              { code: "invalid @nest value", value: nv }
            );
          }
          await _expandObject({
            activeCtx,
            activeProperty,
            expandedActiveProperty,
            element: nv,
            expandedParent,
            options,
            insideList,
            typeScopedContext,
            typeKey
          });
        }
      }
    }
    function _expandValue({ activeCtx, activeProperty, value, options }) {
      if (value === null || value === void 0) {
        return null;
      }
      const expandedProperty = _expandIri(
        activeCtx,
        activeProperty,
        { vocab: true },
        options
      );
      if (expandedProperty === "@id") {
        return _expandIri(activeCtx, value, { base: true }, options);
      } else if (expandedProperty === "@type") {
        return _expandIri(
          activeCtx,
          value,
          { vocab: true, base: true },
          { ...options, typeExpansion: true }
        );
      }
      const type = _getContextValue(activeCtx, activeProperty, "@type");
      if ((type === "@id" || expandedProperty === "@graph") && _isString(value)) {
        const expandedValue = _expandIri(activeCtx, value, { base: true }, options);
        if (expandedValue === null && value.match(REGEX_KEYWORD)) {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "reserved @id value",
                level: "warning",
                message: "Reserved @id found.",
                details: {
                  id: activeProperty
                }
              },
              options
            });
          }
        }
        return { "@id": expandedValue };
      }
      if (type === "@vocab" && _isString(value)) {
        return {
          "@id": _expandIri(activeCtx, value, { vocab: true, base: true }, options)
        };
      }
      if (_isKeyword(expandedProperty)) {
        return value;
      }
      const rval = {};
      if (type && !["@id", "@vocab", "@none"].includes(type)) {
        rval["@type"] = type;
      } else if (_isString(value)) {
        const language = _getContextValue(activeCtx, activeProperty, "@language");
        if (language !== null) {
          rval["@language"] = language;
        }
        const direction = _getContextValue(activeCtx, activeProperty, "@direction");
        if (direction !== null) {
          rval["@direction"] = direction;
        }
      }
      if (!["boolean", "number", "string"].includes(typeof value)) {
        value = value.toString();
      }
      rval["@value"] = value;
      return rval;
    }
    function _expandLanguageMap(activeCtx, languageMap, direction, options) {
      const rval = [];
      const keys = Object.keys(languageMap).sort();
      for (const key of keys) {
        const expandedKey = _expandIri(activeCtx, key, { vocab: true }, options);
        let val = languageMap[key];
        if (!_isArray(val)) {
          val = [val];
        }
        for (const item of val) {
          if (item === null) {
            continue;
          }
          if (!_isString(item)) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; language map values must be strings.",
              "jsonld.SyntaxError",
              { code: "invalid language map value", languageMap }
            );
          }
          const val2 = { "@value": item };
          if (expandedKey !== "@none") {
            if (!key.match(REGEX_BCP47)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "invalid @language value",
                    level: "warning",
                    message: "@language value must be valid BCP47.",
                    details: {
                      language: key
                    }
                  },
                  options
                });
              }
            }
            val2["@language"] = key.toLowerCase();
          }
          if (direction) {
            val2["@direction"] = direction;
          }
          rval.push(val2);
        }
      }
      return rval;
    }
    async function _expandIndexMap({
      activeCtx,
      options,
      activeProperty,
      value,
      asGraph,
      indexKey,
      propertyIndex
    }) {
      const rval = [];
      const keys = Object.keys(value).sort();
      const isTypeIndex = indexKey === "@type";
      for (let key of keys) {
        if (isTypeIndex) {
          const ctx = _getContextValue(activeCtx, key, "@context");
          if (!_isUndefined(ctx)) {
            activeCtx = await _processContext({
              activeCtx,
              localCtx: ctx,
              propagate: false,
              options
            });
          }
        }
        let val = value[key];
        if (!_isArray(val)) {
          val = [val];
        }
        val = await api.expand({
          activeCtx,
          activeProperty,
          element: val,
          options,
          insideList: false,
          insideIndex: true
        });
        let expandedKey;
        if (propertyIndex) {
          if (key === "@none") {
            expandedKey = "@none";
          } else {
            expandedKey = _expandValue(
              { activeCtx, activeProperty: indexKey, value: key, options }
            );
          }
        } else {
          expandedKey = _expandIri(activeCtx, key, { vocab: true }, options);
        }
        if (indexKey === "@id") {
          key = _expandIri(activeCtx, key, { base: true }, options);
        } else if (isTypeIndex) {
          key = expandedKey;
        }
        for (let item of val) {
          if (asGraph && !_isGraph(item)) {
            item = { "@graph": [item] };
          }
          if (indexKey === "@type") {
            if (expandedKey === "@none") {
            } else if (item["@type"]) {
              item["@type"] = [key].concat(item["@type"]);
            } else {
              item["@type"] = [key];
            }
          } else if (_isValue(item) && !["@language", "@type", "@index"].includes(indexKey)) {
            throw new JsonLdError(
              `Invalid JSON-LD syntax; Attempt to add illegal key to value object: "${indexKey}".`,
              "jsonld.SyntaxError",
              { code: "invalid value object", value: item }
            );
          } else if (propertyIndex) {
            if (expandedKey !== "@none") {
              _addValue(item, propertyIndex, expandedKey, {
                propertyIsArray: true,
                prependValue: true
              });
            }
          } else if (expandedKey !== "@none" && !(indexKey in item)) {
            item[indexKey] = key;
          }
          rval.push(item);
        }
      }
      return rval;
    }
  }
});

// node_modules/jsonld/lib/nodeMap.js
var require_nodeMap = __commonJS({
  "node_modules/jsonld/lib/nodeMap.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var { isKeyword } = require_context();
    var graphTypes = require_graphTypes();
    var types = require_types();
    var util = require_util();
    var JsonLdError = require_JsonLdError();
    var api = {};
    module.exports = api;
    api.createMergedNodeMap = (input, options) => {
      options = options || {};
      const issuer = options.issuer || new util.IdentifierIssuer("_:b");
      const graphs = { "@default": {} };
      api.createNodeMap(input, graphs, "@default", issuer);
      return api.mergeNodeMaps(graphs);
    };
    api.createNodeMap = (input, graphs, graph, issuer, name, list) => {
      if (types.isArray(input)) {
        for (const node of input) {
          api.createNodeMap(node, graphs, graph, issuer, void 0, list);
        }
        return;
      }
      if (!types.isObject(input)) {
        if (list) {
          list.push(input);
        }
        return;
      }
      if (graphTypes.isValue(input)) {
        if ("@type" in input) {
          let type = input["@type"];
          if (type.indexOf("_:") === 0) {
            input["@type"] = type = issuer.getId(type);
          }
        }
        if (list) {
          list.push(input);
        }
        return;
      } else if (list && graphTypes.isList(input)) {
        const _list = [];
        api.createNodeMap(input["@list"], graphs, graph, issuer, name, _list);
        list.push({ "@list": _list });
        return;
      }
      if ("@type" in input) {
        const types2 = input["@type"];
        for (const type of types2) {
          if (type.indexOf("_:") === 0) {
            issuer.getId(type);
          }
        }
      }
      if (types.isUndefined(name)) {
        name = graphTypes.isBlankNode(input) ? issuer.getId(input["@id"]) : input["@id"];
      }
      if (list) {
        list.push({ "@id": name });
      }
      const subjects2 = graphs[graph];
      const subject = subjects2[name] = subjects2[name] || {};
      subject["@id"] = name;
      const properties = Object.keys(input).sort();
      for (let property of properties) {
        if (property === "@id") {
          continue;
        }
        if (property === "@reverse") {
          const referencedNode = { "@id": name };
          const reverseMap = input["@reverse"];
          for (const reverseProperty in reverseMap) {
            const items = reverseMap[reverseProperty];
            for (const item of items) {
              let itemName = item["@id"];
              if (graphTypes.isBlankNode(item)) {
                itemName = issuer.getId(itemName);
              }
              api.createNodeMap(item, graphs, graph, issuer, itemName);
              util.addValue(
                subjects2[itemName],
                reverseProperty,
                referencedNode,
                { propertyIsArray: true, allowDuplicate: false }
              );
            }
          }
          continue;
        }
        if (property === "@graph") {
          if (!(name in graphs)) {
            graphs[name] = {};
          }
          api.createNodeMap(input[property], graphs, name, issuer);
          continue;
        }
        if (property === "@included") {
          api.createNodeMap(input[property], graphs, graph, issuer);
          continue;
        }
        if (property !== "@type" && isKeyword(property)) {
          if (property === "@index" && property in subject && (input[property] !== subject[property] || input[property]["@id"] !== subject[property]["@id"])) {
            throw new JsonLdError(
              "Invalid JSON-LD syntax; conflicting @index property detected.",
              "jsonld.SyntaxError",
              { code: "conflicting indexes", subject }
            );
          }
          subject[property] = input[property];
          continue;
        }
        const objects2 = input[property];
        if (property.indexOf("_:") === 0) {
          property = issuer.getId(property);
        }
        if (objects2.length === 0) {
          util.addValue(subject, property, [], { propertyIsArray: true });
          continue;
        }
        for (let o of objects2) {
          if (property === "@type") {
            o = o.indexOf("_:") === 0 ? issuer.getId(o) : o;
          }
          if (graphTypes.isSubject(o) || graphTypes.isSubjectReference(o)) {
            if ("@id" in o && !o["@id"]) {
              continue;
            }
            const id = graphTypes.isBlankNode(o) ? issuer.getId(o["@id"]) : o["@id"];
            util.addValue(
              subject,
              property,
              { "@id": id },
              { propertyIsArray: true, allowDuplicate: false }
            );
            api.createNodeMap(o, graphs, graph, issuer, id);
          } else if (graphTypes.isValue(o)) {
            util.addValue(
              subject,
              property,
              o,
              { propertyIsArray: true, allowDuplicate: false }
            );
          } else if (graphTypes.isList(o)) {
            const _list = [];
            api.createNodeMap(o["@list"], graphs, graph, issuer, name, _list);
            o = { "@list": _list };
            util.addValue(
              subject,
              property,
              o,
              { propertyIsArray: true, allowDuplicate: false }
            );
          } else {
            api.createNodeMap(o, graphs, graph, issuer, name);
            util.addValue(
              subject,
              property,
              o,
              { propertyIsArray: true, allowDuplicate: false }
            );
          }
        }
      }
    };
    api.mergeNodeMapGraphs = (graphs) => {
      const merged = {};
      for (const name of Object.keys(graphs).sort()) {
        for (const id of Object.keys(graphs[name]).sort()) {
          const node = graphs[name][id];
          if (!(id in merged)) {
            merged[id] = { "@id": id };
          }
          const mergedNode = merged[id];
          for (const property of Object.keys(node).sort()) {
            if (isKeyword(property) && property !== "@type") {
              mergedNode[property] = util.clone(node[property]);
            } else {
              for (const value of node[property]) {
                util.addValue(
                  mergedNode,
                  property,
                  util.clone(value),
                  { propertyIsArray: true, allowDuplicate: false }
                );
              }
            }
          }
        }
      }
      return merged;
    };
    api.mergeNodeMaps = (graphs) => {
      const defaultGraph = graphs["@default"];
      const graphNames = Object.keys(graphs).sort();
      for (const graphName of graphNames) {
        if (graphName === "@default") {
          continue;
        }
        const nodeMap = graphs[graphName];
        let subject = defaultGraph[graphName];
        if (!subject) {
          defaultGraph[graphName] = subject = {
            "@id": graphName,
            "@graph": []
          };
        } else if (!("@graph" in subject)) {
          subject["@graph"] = [];
        }
        const graph = subject["@graph"];
        for (const id of Object.keys(nodeMap).sort()) {
          const node = nodeMap[id];
          if (!graphTypes.isSubjectReference(node)) {
            graph.push(node);
          }
        }
      }
      return defaultGraph;
    };
  }
});

// node_modules/canonicalize/lib/canonicalize.js
var require_canonicalize = __commonJS({
  "node_modules/canonicalize/lib/canonicalize.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    module.exports = function serialize(object) {
      if (typeof object === "number" && isNaN(object)) {
        throw new Error("NaN is not allowed");
      }
      if (typeof object === "number" && !isFinite(object)) {
        throw new Error("Infinity is not allowed");
      }
      if (object === null || typeof object !== "object") {
        return JSON.stringify(object);
      }
      if (object.toJSON instanceof Function) {
        return serialize(object.toJSON());
      }
      if (Array.isArray(object)) {
        const values2 = object.reduce((t, cv, ci) => {
          const comma = ci === 0 ? "" : ",";
          const value = cv === void 0 || typeof cv === "symbol" ? null : cv;
          return `${t}${comma}${serialize(value)}`;
        }, "");
        return `[${values2}]`;
      }
      const values = Object.keys(object).sort().reduce((t, cv) => {
        if (object[cv] === void 0 || typeof object[cv] === "symbol") {
          return t;
        }
        const comma = t.length === 0 ? "" : ",";
        return `${t}${comma}${serialize(cv)}:${serialize(object[cv])}`;
      }, "");
      return `{${values}}`;
    };
  }
});

// node_modules/jsonld/lib/constants.js
var require_constants = __commonJS({
  "node_modules/jsonld/lib/constants.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var RDF2 = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    var XSD2 = "http://www.w3.org/2001/XMLSchema#";
    module.exports = {
      // TODO: Deprecated and will be removed later. Use LINK_HEADER_CONTEXT.
      LINK_HEADER_REL: "http://www.w3.org/ns/json-ld#context",
      LINK_HEADER_CONTEXT: "http://www.w3.org/ns/json-ld#context",
      RDF: RDF2,
      RDF_LIST: RDF2 + "List",
      RDF_FIRST: RDF2 + "first",
      RDF_REST: RDF2 + "rest",
      RDF_NIL: RDF2 + "nil",
      RDF_TYPE: RDF2 + "type",
      RDF_PLAIN_LITERAL: RDF2 + "PlainLiteral",
      RDF_XML_LITERAL: RDF2 + "XMLLiteral",
      RDF_JSON_LITERAL: RDF2 + "JSON",
      RDF_OBJECT: RDF2 + "object",
      RDF_LANGSTRING: RDF2 + "langString",
      XSD: XSD2,
      XSD_BOOLEAN: XSD2 + "boolean",
      XSD_DOUBLE: XSD2 + "double",
      XSD_INTEGER: XSD2 + "integer",
      XSD_STRING: XSD2 + "string"
    };
  }
});

// node_modules/jsonld/lib/toRdf.js
var require_toRdf = __commonJS({
  "node_modules/jsonld/lib/toRdf.js"(exports, module) {
    "use strict";
    init_define_RPC_ARTIFACT_DIGESTS();
    var { createNodeMap } = require_nodeMap();
    var { isKeyword } = require_context();
    var graphTypes = require_graphTypes();
    var jsonCanonicalize = require_canonicalize();
    var JsonLdError = require_JsonLdError();
    var types = require_types();
    var util = require_util();
    var {
      handleEvent: _handleEvent
    } = require_fail_closed_events();
    var {
      // RDF,
      // RDF_LIST,
      RDF_FIRST,
      RDF_REST,
      RDF_NIL,
      RDF_TYPE: RDF_TYPE2,
      // RDF_PLAIN_LITERAL,
      // RDF_XML_LITERAL,
      RDF_JSON_LITERAL,
      // RDF_OBJECT,
      RDF_LANGSTRING,
      // XSD,
      XSD_BOOLEAN,
      XSD_DOUBLE,
      XSD_INTEGER,
      XSD_STRING
    } = require_constants();
    var {
      isAbsolute: _isAbsoluteIri
    } = require_url();
    var api = {};
    module.exports = api;
    api.toRDF = (input, options) => {
      const issuer = new util.IdentifierIssuer("_:b");
      const nodeMap = { "@default": {} };
      createNodeMap(input, nodeMap, "@default", issuer);
      const dataset = [];
      const graphNames = Object.keys(nodeMap).sort();
      for (const graphName of graphNames) {
        let graphTerm;
        if (graphName === "@default") {
          graphTerm = { termType: "DefaultGraph", value: "" };
        } else if (_isAbsoluteIri(graphName)) {
          graphTerm = _makeTerm(graphName);
        } else {
          if (options.eventHandler) {
            _handleEvent({
              event: {
                type: ["JsonLdEvent"],
                code: "relative graph reference",
                level: "warning",
                message: "Relative graph reference found.",
                details: {
                  graph: graphName
                }
              },
              options
            });
          }
          continue;
        }
        _graphToRDF(dataset, nodeMap[graphName], graphTerm, issuer, options);
      }
      return dataset;
    };
    function _graphToRDF(dataset, graph, graphTerm, issuer, options) {
      const ids = Object.keys(graph).sort();
      for (const id of ids) {
        const node = graph[id];
        const properties = Object.keys(node).sort();
        for (let property of properties) {
          const items = node[property];
          if (property === "@type") {
            property = RDF_TYPE2;
          } else if (isKeyword(property)) {
            continue;
          }
          for (const item of items) {
            const subject = _makeTerm(id);
            if (!_isAbsoluteIri(id)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "relative subject reference",
                    level: "warning",
                    message: "Relative subject reference found.",
                    details: {
                      subject: id
                    }
                  },
                  options
                });
              }
              continue;
            }
            const predicate = _makeTerm(property);
            if (!_isAbsoluteIri(property)) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "relative predicate reference",
                    level: "warning",
                    message: "Relative predicate reference found.",
                    details: {
                      predicate: property
                    }
                  },
                  options
                });
              }
              continue;
            }
            if (predicate.termType === "BlankNode" && !options.produceGeneralizedRdf) {
              if (options.eventHandler) {
                _handleEvent({
                  event: {
                    type: ["JsonLdEvent"],
                    code: "blank node predicate",
                    level: "warning",
                    message: "Dropping blank node predicate.",
                    details: {
                      // FIXME: add better issuer API to get reverse mapping
                      property: issuer.getOldIds().find((key) => issuer.getId(key) === property)
                    }
                  },
                  options
                });
              }
              continue;
            }
            const object = _objectToRDF(
              item,
              issuer,
              dataset,
              graphTerm,
              options.rdfDirection,
              options
            );
            if (object) {
              dataset.push({
                subject,
                predicate,
                object,
                graph: graphTerm
              });
            }
          }
        }
      }
    }
    function _listToRDF(list, issuer, dataset, graphTerm, rdfDirection, options) {
      const first = { termType: "NamedNode", value: RDF_FIRST };
      const rest = { termType: "NamedNode", value: RDF_REST };
      const nil = { termType: "NamedNode", value: RDF_NIL };
      const last = list.pop();
      const result = last ? {
        termType: "BlankNode",
        value: issuer.getId().slice(2)
      } : nil;
      let subject = result;
      for (const item of list) {
        const object = _objectToRDF(
          item,
          issuer,
          dataset,
          graphTerm,
          rdfDirection,
          options
        );
        const next = { termType: "BlankNode", value: issuer.getId().slice(2) };
        dataset.push({
          subject,
          predicate: first,
          object,
          graph: graphTerm
        });
        dataset.push({
          subject,
          predicate: rest,
          object: next,
          graph: graphTerm
        });
        subject = next;
      }
      if (last) {
        const object = _objectToRDF(
          last,
          issuer,
          dataset,
          graphTerm,
          rdfDirection,
          options
        );
        dataset.push({
          subject,
          predicate: first,
          object,
          graph: graphTerm
        });
        dataset.push({
          subject,
          predicate: rest,
          object: nil,
          graph: graphTerm
        });
      }
      return result;
    }
    function _objectToRDF(item, issuer, dataset, graphTerm, rdfDirection, options) {
      let object;
      if (graphTypes.isValue(item)) {
        object = {
          termType: "Literal",
          value: void 0,
          datatype: {
            termType: "NamedNode"
          }
        };
        let value = item["@value"];
        const datatype = item["@type"] || null;
        if (datatype === "@json") {
          object.value = jsonCanonicalize(value);
          object.datatype.value = RDF_JSON_LITERAL;
        } else if (types.isBoolean(value)) {
          object.value = value.toString();
          object.datatype.value = datatype || XSD_BOOLEAN;
        } else if (types.isDouble(value) || datatype === XSD_DOUBLE) {
          if (!types.isDouble(value)) {
            value = parseFloat(value);
          }
          object.value = value.toExponential(15).replace(/(\d)0*e\+?/, "$1E");
          object.datatype.value = datatype || XSD_DOUBLE;
        } else if (types.isNumber(value)) {
          object.value = value.toFixed(0);
          object.datatype.value = datatype || XSD_INTEGER;
        } else if ("@direction" in item && rdfDirection === "i18n-datatype") {
          const language = (item["@language"] || "").toLowerCase();
          const direction = item["@direction"];
          const datatype2 = `https://www.w3.org/ns/i18n#${language}_${direction}`;
          object.datatype.value = datatype2;
          object.value = value;
        } else if ("@direction" in item && rdfDirection === "compound-literal") {
          throw new JsonLdError(
            "Unsupported rdfDirection value.",
            "jsonld.InvalidRdfDirection",
            { value: rdfDirection }
          );
        } else if ("@direction" in item && rdfDirection) {
          throw new JsonLdError(
            "Unknown rdfDirection value.",
            "jsonld.InvalidRdfDirection",
            { value: rdfDirection }
          );
        } else if ("@language" in item) {
          if ("@direction" in item && !rdfDirection) {
            if (options.eventHandler) {
              _handleEvent({
                event: {
                  type: ["JsonLdEvent"],
                  code: "rdfDirection not set",
                  level: "warning",
                  message: "rdfDirection not set for @direction.",
                  details: {
                    object: object.value
                  }
                },
                options
              });
            }
          }
          object.value = value;
          object.datatype.value = datatype || RDF_LANGSTRING;
          object.language = item["@language"];
        } else {
          if ("@direction" in item && !rdfDirection) {
            if (options.eventHandler) {
              _handleEvent({
                event: {
                  type: ["JsonLdEvent"],
                  code: "rdfDirection not set",
                  level: "warning",
                  message: "rdfDirection not set for @direction.",
                  details: {
                    object: object.value
                  }
                },
                options
              });
            }
          }
          object.value = value;
          object.datatype.value = datatype || XSD_STRING;
        }
      } else if (graphTypes.isList(item)) {
        const _list = _listToRDF(
          item["@list"],
          issuer,
          dataset,
          graphTerm,
          rdfDirection,
          options
        );
        object = {
          termType: _list.termType,
          value: _list.value
        };
      } else {
        const id = types.isObject(item) ? item["@id"] : item;
        object = _makeTerm(id);
      }
      if (object.termType === "NamedNode" && !_isAbsoluteIri(object.value)) {
        if (options.eventHandler) {
          _handleEvent({
            event: {
              type: ["JsonLdEvent"],
              code: "relative object reference",
              level: "warning",
              message: "Relative object reference found.",
              details: {
                object: object.value
              }
            },
            options
          });
        }
        return null;
      }
      return object;
    }
    function _makeTerm(id) {
      if (id.startsWith("_:")) {
        return {
          termType: "BlankNode",
          value: id.slice(2)
        };
      }
      return {
        termType: "NamedNode",
        value: id
      };
    }
  }
});

// src/core/core.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/build-constants.js
init_define_RPC_ARTIFACT_DIGESTS();
var EMBEDDED_ARTIFACT_DIGESTS = define_RPC_ARTIFACT_DIGESTS_default;

// src/core/core-failure.js
init_define_RPC_ARTIFACT_DIGESTS();
var CoreFailure = class extends Error {
  constructor(code, violations = []) {
    super(code);
    this.code = code;
    this.violations = violations;
  }
};
function fail(code, violations = []) {
  throw new CoreFailure(code, violations);
}

// src/core/error-report.js
init_define_RPC_ARTIFACT_DIGESTS();
function compareCodeUnits(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}
function compareViolations(left, right) {
  const codeOrder = compareCodeUnits(left.code, right.code);
  if (codeOrder !== 0) {
    return codeOrder;
  }
  const sourceOrder = compareCodeUnits(left.source ?? "", right.source ?? "");
  if (sourceOrder !== 0) {
    return sourceOrder;
  }
  return compareCodeUnits(left.message, right.message);
}
function buildErrorReport(errorData) {
  const orderedViolations = [...errorData.violations ?? []].sort(compareViolations).slice(0, 100).map((violation2) => {
    const normalized = { code: violation2.code };
    if (violation2.source !== void 0) {
      normalized.source = violation2.source;
    }
    normalized.message = violation2.message;
    return normalized;
  });
  const tooManyViolations = (errorData.violations?.length ?? 0) > 100;
  const code = tooManyViolations ? "TOO_MANY_VIOLATIONS" : errorData.code;
  const report = {
    errorVersion: "error-report-v1.0",
    code
  };
  if (code === "FIXTURE_CONTRACT_FAILED" || code === "TOO_MANY_VIOLATIONS") {
    report.contractVersion = errorData.contractVersion ?? "person-association-contract-v1.0";
  }
  report.violations = orderedViolations;
  return new TextEncoder().encode(`${JSON.stringify(report, null, 2)}
`);
}

// src/core/json-scan.js
init_define_RPC_ARTIFACT_DIGESTS();
var UTF8_BOM = [239, 187, 191];
var MAX_JSON_DEPTH = 64;
var JsonScanError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function isWhitespace(code) {
  return code === 32 || code === 9 || code === 10 || code === 13;
}
function isDigit(code) {
  return code >= 48 && code <= 57;
}
function isHexDigit(code) {
  return isDigit(code) || code >= 65 && code <= 70 || code >= 97 && code <= 102;
}
function syntaxError() {
  return new JsonScanError("INVALID_JSON_SYNTAX");
}
function decodeUtf8Input(bytes) {
  const hasBom = bytes.length >= UTF8_BOM.length && UTF8_BOM.every((value, index) => bytes[index] === value);
  const content = hasBom ? bytes.subarray(UTF8_BOM.length) : bytes;
  const decoder = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true
  });
  return { hadBom: hasBom, text: decoder.decode(content) };
}
function scanJsonText(text) {
  let index = 0;
  let maximumDepth = 0;
  let rootState = "value";
  const stack = [];
  function skipWhitespace() {
    while (index < text.length && isWhitespace(text.charCodeAt(index))) {
      index += 1;
    }
  }
  function parseString() {
    if (text.charCodeAt(index) !== 34) {
      throw syntaxError();
    }
    const start = index;
    index += 1;
    while (index < text.length) {
      const code = text.charCodeAt(index);
      if (code === 34) {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      if (code < 32) {
        throw syntaxError();
      }
      if (code !== 92) {
        index += 1;
        continue;
      }
      index += 1;
      const escape = text.charCodeAt(index);
      if (escape === 34 || escape === 47 || escape === 92 || escape === 98 || escape === 102 || escape === 110 || escape === 114 || escape === 116) {
        index += 1;
        continue;
      }
      if (escape !== 117) {
        throw syntaxError();
      }
      for (let offset = 1; offset <= 4; offset += 1) {
        if (!isHexDigit(text.charCodeAt(index + offset))) {
          throw syntaxError();
        }
      }
      index += 5;
    }
    throw syntaxError();
  }
  function parseNumber() {
    if (text.charCodeAt(index) === 45) {
      index += 1;
    }
    if (text.charCodeAt(index) === 48) {
      index += 1;
      if (isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
    } else {
      const firstDigit = text.charCodeAt(index);
      if (firstDigit < 49 || firstDigit > 57) {
        throw syntaxError();
      }
      do {
        index += 1;
      } while (isDigit(text.charCodeAt(index)));
    }
    if (text.charCodeAt(index) === 46) {
      index += 1;
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }
    const exponent = text.charCodeAt(index);
    if (exponent === 69 || exponent === 101) {
      index += 1;
      const sign = text.charCodeAt(index);
      if (sign === 43 || sign === 45) {
        index += 1;
      }
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }
  }
  function parseLiteral(literal) {
    if (text.slice(index, index + literal.length) !== literal) {
      throw syntaxError();
    }
    index += literal.length;
  }
  function consumeValue() {
    if (stack.length === 0) {
      if (rootState !== "value") {
        throw syntaxError();
      }
      rootState = "done";
      return;
    }
    const parent = stack[stack.length - 1];
    if (parent.state !== "value" && parent.state !== "valueOrEnd") {
      throw syntaxError();
    }
    parent.state = "commaOrEnd";
  }
  function openContainer(kind) {
    consumeValue();
    stack.push({
      kind,
      keys: kind === "object" ? /* @__PURE__ */ new Set() : void 0,
      state: kind === "object" ? "keyOrEnd" : "valueOrEnd"
    });
    maximumDepth = Math.max(maximumDepth, stack.length);
    if (maximumDepth > MAX_JSON_DEPTH) {
      throw new JsonScanError("JSON_TOO_DEEP");
    }
  }
  function closeContainer(expectedKind) {
    const current = stack.at(-1);
    if (current?.kind !== expectedKind) {
      throw syntaxError();
    }
    stack.pop();
    index += 1;
  }
  while (true) {
    skipWhitespace();
    if (stack.length === 0 && rootState === "done") {
      if (index !== text.length) {
        throw syntaxError();
      }
      break;
    }
    const current = stack.at(-1);
    const state = current?.state ?? rootState;
    const code = text.charCodeAt(index);
    if (state === "keyOrEnd" || state === "key") {
      if (state === "keyOrEnd" && code === 125) {
        closeContainer("object");
        continue;
      }
      const key = parseString();
      if (current.keys.has(key)) {
        throw new JsonScanError("DUPLICATE_JSON_MEMBER");
      }
      current.keys.add(key);
      current.state = "colon";
      continue;
    }
    if (state === "colon") {
      if (code !== 58) {
        throw syntaxError();
      }
      index += 1;
      current.state = "value";
      continue;
    }
    if (state === "commaOrEnd") {
      if (current.kind === "object") {
        if (code === 125) {
          closeContainer("object");
        } else if (code === 44) {
          index += 1;
          current.state = "key";
        } else {
          throw syntaxError();
        }
      } else if (code === 93) {
        closeContainer("array");
      } else if (code === 44) {
        index += 1;
        current.state = "value";
      } else {
        throw syntaxError();
      }
      continue;
    }
    if (state === "valueOrEnd" && code === 93) {
      closeContainer("array");
      continue;
    }
    if (state !== "value" && state !== "valueOrEnd") {
      throw syntaxError();
    }
    if (code === 123) {
      index += 1;
      openContainer("object");
    } else if (code === 91) {
      index += 1;
      openContainer("array");
    } else if (code === 34) {
      parseString();
      consumeValue();
    } else if (code === 116) {
      parseLiteral("true");
      consumeValue();
    } else if (code === 102) {
      parseLiteral("false");
      consumeValue();
    } else if (code === 110) {
      parseLiteral("null");
      consumeValue();
    } else if (code === 45 || isDigit(code)) {
      parseNumber();
      consumeValue();
    } else {
      throw syntaxError();
    }
  }
  return { depth: maximumDepth, value: JSON.parse(text) };
}

// src/core/phase6.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/build-narrative.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/template.js
init_define_RPC_ARTIFACT_DIGESTS();
function substituteAssociation(template, first, second) {
  return template.replace(
    /\{participant1\}|\{participant2\}/gu,
    (token) => token === "{participant1}" ? first : second
  );
}
function substituteRelationshipTitle(template, relationshipTitle) {
  return template.replace(/\{relationshipTitle\}/gu, () => relationshipTitle);
}

// src/core/vocabulary.js
init_define_RPC_ARTIFACT_DIGESTS();
var APPROVED_CONTEXT_TOKEN = "../contexts/poc.context.jsonld";
var RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var RDFS = "http://www.w3.org/2000/01/rdf-schema#";
var OWL = "http://www.w3.org/2002/07/owl#";
var SKOS = "http://www.w3.org/2004/02/skos/core#";
var XSD = "http://www.w3.org/2001/XMLSchema#";
var OBO = "http://purl.obolibrary.org/obo/";
var CCO = "https://www.commoncoreontologies.org/";
var CONTRACT = "https://example.org/relationship-presentation-poc/contract/";
var PROJECTION = "https://example.org/relationship-presentation-poc/projection/";
var PROFILE = "https://example.org/relationship-presentation-poc/profile/";
var RULE = "https://example.org/relationship-presentation-poc/rule/";
var RUN = "https://example.org/relationship-presentation-poc/run/";
var HTML = "https://example.org/relationship-presentation-poc/html/";
var RDF_TYPE = `${RDF}type`;
var RDFS_LABEL = `${RDFS}label`;
var OWL_IMPORTS = `${OWL}imports`;
var OWL_DIFFERENT_FROM = `${OWL}differentFrom`;
var OWL_SAME_AS = `${OWL}sameAs`;
var OWL_NAMED_INDIVIDUAL = `${OWL}NamedIndividual`;
var PERSON_ASSOCIATION = `${CONTRACT}PersonAssociation`;
var RELATIONAL_QUALITY = `${OBO}BFO_0000145`;
var SPECIFICALLY_DEPENDS_ON = `${OBO}BFO_0000195`;
var PERSON = `${CCO}ont00001262`;
var DESIGNATIVE_NAME = `${CCO}ont00000003`;
var NON_NAME_IDENTIFIER = `${CCO}ont00000649`;
var DESIGNATES = `${CCO}ont00001916`;
var SUPPORTED_PROFILE = `${PROFILE}two-slide-explainer-v3`;
var PRESENTATION_PROFILE = `${PROJECTION}PresentationProfile`;
var META_TYPES = /* @__PURE__ */ new Set([
  `${OWL}Class`,
  `${RDFS}Class`,
  `${RDF}Property`,
  `${OWL}ObjectProperty`,
  `${OWL}DatatypeProperty`,
  `${OWL}AnnotationProperty`
]);
var PROHIBITED_SOURCE_NAMESPACES = [
  PROJECTION,
  PROFILE,
  RULE,
  RUN,
  HTML,
  "https://example.org/relationship-presentation-poc/layout/",
  "https://example.org/relationship-presentation-poc/intent/",
  "http://www.w3.org/1999/xhtml"
];
var ALLOWED_VOCABULARY_NAMESPACES = [
  RDF,
  RDFS,
  OWL,
  XSD,
  SKOS,
  OBO,
  CCO,
  CONTRACT
];

// src/core/build-narrative.js
function compactRule(iri) {
  if (typeof iri !== "string" || !iri.startsWith(RULE)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return `rule:${iri.slice(RULE.length)}`;
}
function sameValues(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}
function associationSources(template, first, second) {
  const sources = [];
  template.replace(/\{participant1\}|\{participant2\}/gu, (token) => {
    const source = token === "{participant1}" ? first.name : second.name;
    if (!sources.includes(source)) {
      sources.push(source);
    }
    return token;
  });
  return sources;
}
function expectedContent(selection, profile) {
  const first = selection.participants[0];
  const second = selection.participants[1];
  return [
    {
      id: "run:document-title-content",
      sequence: 1,
      role: "projection:DocumentTitleContent",
      text: substituteRelationshipTitle(
        profile.documentTitleTemplate,
        selection.designatorLabel
      ),
      derivedFrom: [selection.designatorNode],
      generatedBy: "rule:document-title-from-profile-v1-0"
    },
    {
      id: "run:title-content-1",
      sequence: 1,
      role: "projection:DeckTitleContent",
      text: selection.designatorLabel,
      derivedFrom: [selection.designatorNode],
      generatedBy: "rule:relationship-title-from-resolving-designator-v1-0"
    },
    {
      id: "run:primary-message-content-1",
      sequence: 2,
      role: "projection:PrimaryMessageContent",
      text: substituteAssociation(
        profile.associationTemplate,
        first.label,
        second.label
      ),
      derivedFrom: associationSources(profile.associationTemplate, first, second),
      generatedBy: compactRule(profile.overviewRule)
    },
    {
      id: "run:slide-title-content-2",
      sequence: 1,
      role: "projection:SlideTitleContent",
      text: profile.participantSlideTitle,
      generatedBy: "rule:participant-slide-title-from-profile-v1-0"
    },
    {
      id: "run:participant-item-content-1",
      sequence: 2,
      role: "projection:ParticipantItemContent",
      text: first.label,
      derivedFrom: [first.name],
      generatedBy: "rule:participant-name-label-v1-0"
    },
    {
      id: "run:participant-item-content-2",
      sequence: 3,
      role: "projection:ParticipantItemContent",
      text: second.label,
      derivedFrom: [second.name],
      generatedBy: "rule:participant-name-label-v1-0"
    }
  ];
}
function validateNarrativeProvenance(narrative, selection, profile) {
  const units = narrative?.hasUnit;
  if (!Array.isArray(narrative?.hasDocumentContent) || narrative.hasDocumentContent.length !== 1 || !Array.isArray(units) || units.length !== profile.slideCount || units.some((unit, index) => unit.sequence !== index + 1)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const actualContent = [
    ...narrative.hasDocumentContent,
    ...units.flatMap(
      (unit) => Array.isArray(unit.hasContent) ? unit.hasContent : []
    )
  ];
  const expected = expectedContent(selection, profile);
  if (actualContent.length !== expected.length) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const byId = new Map(actualContent.map((content) => [content?.["@id"], content]));
  if (byId.size !== expected.length) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  for (const record of expected) {
    const content = byId.get(record.id);
    const hasDerivedFrom = Object.prototype.hasOwnProperty.call(
      content ?? {},
      "derivedFrom"
    );
    if (content?.["@type"] !== "projection:TextContent" || content.sequence !== record.sequence || content.contentRole !== record.role || content.textValue !== record.text || content.generatedBy !== record.generatedBy || (record.derivedFrom === void 0 ? hasDerivedFrom : !hasDerivedFrom || !sameValues(content.derivedFrom, record.derivedFrom) || content.derivedFrom.length === 0)) {
      fail("INTERNAL_COMPILER_ERROR");
    }
  }
}
function contentNode(record) {
  const node = {
    "@id": record.id,
    "@type": "projection:TextContent",
    sequence: record.sequence,
    contentRole: record.role,
    textValue: record.text
  };
  if (record.derivedFrom !== void 0) {
    node.derivedFrom = record.derivedFrom;
  }
  node.generatedBy = record.generatedBy;
  return node;
}
function buildNarrative(selection, profile) {
  if (profile.slideCount !== 2 || selection.participants.length !== 2 || typeof selection.designatorLabel !== "string" || !profile.documentTitleTemplate.includes("{relationshipTitle}") || !profile.associationTemplate.includes("{participant1}") || !profile.associationTemplate.includes("{participant2}")) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const content = expectedContent(selection, profile).map(contentNode);
  const narrative = {
    "@context": "./poc.context.jsonld",
    "@id": "run:narrative",
    "@type": "projection:Narrative",
    hasDocumentContent: [content[0]],
    hasUnit: [
      {
        "@id": "run:narrative-unit-1",
        "@type": "projection:NarrativeUnit",
        sequence: 1,
        hasContent: [content[1], content[2]]
      },
      {
        "@id": "run:narrative-unit-2",
        "@type": "projection:NarrativeUnit",
        sequence: 2,
        hasContent: [content[3], content[4], content[5]]
      }
    ]
  };
  validateNarrativeProvenance(narrative, selection, profile);
  return narrative;
}

// src/core/build-presentation.js
init_define_RPC_ARTIFACT_DIGESTS();
function compactProfile(iri) {
  if (typeof iri !== "string" || !iri.startsWith(PROFILE)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return `profile:${iri.slice(PROFILE.length)}`;
}
function buildPresentation(narrative, profile) {
  if (profile.slideCount !== 2 || narrative.hasUnit?.length !== profile.slideCount) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const presentation = {
    "@context": "./poc.context.jsonld",
    "@id": "run:presentation",
    "@type": "projection:Presentation",
    profileRef: compactProfile(profile.id),
    hasDocumentContent: ["run:document-title-content"],
    hasSlide: [
      {
        "@id": "run:slide-1",
        "@type": "projection:Slide",
        sequence: 1,
        projectsNarrativeUnit: "run:narrative-unit-1",
        hasRegion: [
          {
            "@id": "run:slide-1-title-region",
            "@type": "projection:DeckTitleRegion",
            sequence: 1,
            projectsContent: "run:title-content-1"
          },
          {
            "@id": "run:slide-1-message-region",
            "@type": "projection:PrimaryMessageRegion",
            sequence: 2,
            projectsContent: "run:primary-message-content-1"
          },
          {
            "@id": "run:slide-1-navigation-region",
            "@type": "projection:NavigationRegion",
            sequence: 3,
            intent: "projection:Advance",
            buttonLabel: profile.advanceLabel,
            generatedBy: "rule:advance-navigation-from-profile-v1-0"
          }
        ]
      },
      {
        "@id": "run:slide-2",
        "@type": "projection:Slide",
        sequence: 2,
        projectsNarrativeUnit: "run:narrative-unit-2",
        hasRegion: [
          {
            "@id": "run:slide-2-title-region",
            "@type": "projection:SlideTitleRegion",
            sequence: 1,
            projectsContent: "run:slide-title-content-2"
          },
          {
            "@id": "run:slide-2-items-region",
            "@type": "projection:ItemCollectionRegion",
            sequence: 2,
            hasItem: [
              {
                "@id": "run:slide-2-item-region-1",
                "@type": "projection:ItemRegion",
                sequence: 1,
                projectsContent: "run:participant-item-content-1"
              },
              {
                "@id": "run:slide-2-item-region-2",
                "@type": "projection:ItemRegion",
                sequence: 2,
                projectsContent: "run:participant-item-content-2"
              }
            ]
          },
          {
            "@id": "run:slide-2-navigation-region",
            "@type": "projection:NavigationRegion",
            sequence: 3,
            intent: "projection:GoBack",
            buttonLabel: profile.backLabel,
            generatedBy: "rule:back-navigation-from-profile-v1-0"
          }
        ]
      }
    ]
  };
  if (presentation.hasSlide.length !== profile.slideCount || presentation.hasSlide.some(
    (slide, index) => slide.sequence !== index + 1 || slide.hasRegion.some(
      (region, regionIndex) => region.sequence !== regionIndex + 1
    )
  )) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return presentation;
}

// src/core/phase5.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/jsonld-load.js
init_define_RPC_ARTIFACT_DIGESTS();
var import_context = __toESM(require_context(), 1);
var import_ContextResolver = __toESM(require_ContextResolver(), 1);
var import_expand = __toESM(require_expand(), 1);
var import_toRdf = __toESM(require_toRdf(), 1);
var MAX_CONTEXT_TERMS = 250;
var MAX_TRIPLES = 5e3;
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (isObject(value)) {
    const clone = {};
    for (const key of Object.keys(value)) {
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneValue(value[key]),
        writable: true
      });
    }
    return clone;
  }
  return value;
}
function equalJsonValue(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => equalJsonValue(value, right[index]));
  }
  if (!isObject(left) || !isObject(right)) {
    return false;
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every(
    (key, index) => key === rightKeys[index] && equalJsonValue(left[key], right[key])
  );
}
function isAbsoluteIri(value) {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) && !/[\u0000-\u0020]/u.test(value);
}
function isCompilerOrVocabularyNamespace(value) {
  return [...ALLOWED_VOCABULARY_NAMESPACES, ...PROHIBITED_SOURCE_NAMESPACES].some(
    (namespace) => value.startsWith(namespace)
  );
}
function validateInlineContext(inlineContext, canonicalTerms) {
  if (!isObject(inlineContext)) {
    fail("LOCAL_CONTEXT_NOT_APPROVED");
  }
  const entries = Object.entries(inlineContext);
  if (entries.length > MAX_CONTEXT_TERMS) {
    fail("TOO_MANY_CONTEXT_TERMS");
  }
  for (const [term, definition] of entries) {
    if (term === "@base" || term === "@vocab" || term === "@language" || term === "@direction" || term === "@import") {
      fail(
        term === "@import" ? "JSONLD_IMPORT_NOT_SUPPORTED" : "LOCAL_CONTEXT_NOT_APPROVED"
      );
    }
    if (Object.prototype.hasOwnProperty.call(canonicalTerms, term)) {
      if (!equalJsonValue(definition, canonicalTerms[term])) {
        fail("CONTEXT_TERM_REDEFINITION");
      }
      continue;
    }
    if (isObject(definition) && "@context" in definition) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    if (term.startsWith("@")) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    if (!isObject(definition) || Object.keys(definition).length !== 2 || typeof definition["@id"] !== "string" || definition["@prefix"] !== true || !isAbsoluteIri(definition["@id"]) || isCompilerOrVocabularyNamespace(definition["@id"])) {
      fail("CONTEXT_TERM_REDEFINITION");
    }
  }
}
function approveContexts(value, canonicalTerms) {
  if (Array.isArray(value)) {
    return value.map((item) => approveContexts(item, canonicalTerms));
  }
  if (!isObject(value)) {
    return value;
  }
  const clone = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "@import") {
      fail("JSONLD_IMPORT_NOT_SUPPORTED");
    }
    if (key === "@context") {
      if (typeof child === "string") {
        if (/^https?:/iu.test(child)) {
          fail("REMOTE_CONTEXT_NOT_SUPPORTED");
        }
        if (/^file:/iu.test(child) || child !== APPROVED_CONTEXT_TOKEN) {
          fail("LOCAL_CONTEXT_NOT_APPROVED");
        }
        Object.defineProperty(clone, key, {
          configurable: true,
          enumerable: true,
          value: cloneValue(canonicalTerms),
          writable: true
        });
      } else {
        if (Array.isArray(child) && child.some(
          (entry) => typeof entry === "string" && /^https?:/iu.test(entry)
        )) {
          fail("REMOTE_CONTEXT_NOT_SUPPORTED");
        }
        validateInlineContext(child, canonicalTerms);
        Object.defineProperty(clone, key, {
          configurable: true,
          enumerable: true,
          value: cloneValue(child),
          writable: true
        });
      }
      continue;
    }
    if (isObject(child) && "@context" in child) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    Object.defineProperty(clone, key, {
      configurable: true,
      enumerable: true,
      value: approveContexts(child, canonicalTerms),
      writable: true
    });
  }
  return clone;
}
function termKey(term) {
  if (term.termType === "Literal") {
    return [
      "literal",
      term.value,
      term.language,
      term.datatype?.value ?? ""
    ];
  }
  return [term.termType, term.value];
}
function quadKey(quad) {
  return JSON.stringify([
    termKey(quad.subject),
    termKey(quad.predicate),
    termKey(quad.object),
    termKey(quad.graph)
  ]);
}
function normalizedObject(term) {
  if (term.termType === "NamedNode") {
    return { kind: "iri", value: term.value };
  }
  return {
    kind: "literal",
    value: term.value,
    language: term.language ?? "",
    datatype: term.datatype.value
  };
}
function normalizeDataset(dataset, role) {
  const unique = /* @__PURE__ */ new Map();
  for (const quad of dataset) {
    if (quad.graph.termType !== "DefaultGraph") {
      fail("NAMED_GRAPH_NOT_SUPPORTED");
    }
    if (quad.subject.termType === "BlankNode" || quad.object.termType === "BlankNode") {
      fail("BLANK_NODE_NOT_SUPPORTED");
    }
    if (quad.subject.termType !== "NamedNode" || quad.predicate.termType !== "NamedNode" || quad.object.termType !== "NamedNode" && quad.object.termType !== "Literal") {
      fail("INTERNAL_COMPILER_ERROR");
    }
    unique.set(quadKey(quad), {
      subject: quad.subject.value,
      predicate: quad.predicate.value,
      object: normalizedObject(quad.object)
    });
  }
  if (unique.size > MAX_TRIPLES) {
    fail("TOO_MANY_TRIPLES");
  }
  const triples = [...unique.values()];
  if (role === "source" && triples.some((triple) => triple.predicate === OWL_IMPORTS)) {
    fail("OWL_IMPORTS_NOT_SUPPORTED");
  }
  return triples;
}
async function expandTrustedDocument(jsonDocument, canonicalContextDocument, role) {
  const canonicalTerms = canonicalContextDocument?.["@context"];
  if (!isObject(canonicalTerms)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  if (Object.keys(canonicalTerms).length > MAX_CONTEXT_TERMS) {
    fail("TOO_MANY_CONTEXT_TERMS");
  }
  if ((role === "contract" || role === "canonicalProfile") && jsonDocument?.["@context"] !== APPROVED_CONTEXT_TOKEN) {
    fail("LOCAL_CONTEXT_NOT_APPROVED");
  }
  const approvedDocument = approveContexts(jsonDocument, canonicalTerms);
  const options = {
    base: "",
    contextResolver: new import_ContextResolver.default({ sharedCache: /* @__PURE__ */ new Map() }),
    documentLoader: async () => {
      throw new Error("The inert JSON-LD loader rejected an external document.");
    },
    keepFreeFloatingNodes: false
  };
  let expanded;
  try {
    expanded = await import_expand.default.expand({
      activeCtx: import_context.default.getInitialContext(options),
      element: approvedDocument,
      options
    });
  } catch {
    fail("INTERNAL_COMPILER_ERROR");
  }
  if (expanded !== null && !Array.isArray(expanded) && typeof expanded === "object" && Object.keys(expanded).length === 1 && "@graph" in expanded) {
    expanded = expanded["@graph"];
  } else if (expanded === null) {
    expanded = [];
  }
  if (!Array.isArray(expanded)) {
    expanded = [expanded];
  }
  let dataset;
  try {
    dataset = import_toRdf.default.toRDF(expanded, {
      produceGeneralizedRdf: false,
      rdfDirection: null
    });
  } catch {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return normalizeDataset(dataset, role);
}

// src/core/normalize-request.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/unicode.js
init_define_RPC_ARTIFACT_DIGESTS();
var BIDI_CONTROLS = /* @__PURE__ */ new Set([
  1564,
  8206,
  8207,
  8234,
  8235,
  8236,
  8237,
  8238,
  8294,
  8295,
  8296,
  8297
]);
function compareCodeUnits2(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}
function scalarLength(value) {
  let count = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 55296 && codePoint <= 57343) {
      return null;
    }
    count += 1;
  }
  return count;
}
function isCriticalStringValid(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0 && codePoint <= 31 || codePoint >= 127 && codePoint <= 159 || BIDI_CONTROLS.has(codePoint) || codePoint >= 64976 && codePoint <= 65007 || (codePoint & 65535) === 65534 || (codePoint & 65535) === 65535 || codePoint >= 55296 && codePoint <= 57343) {
      return false;
    }
  }
  return true;
}
function normalizeCriticalString(value) {
  return value.normalize("NFC");
}

// src/core/normalize-request.js
var PREFIX = "Create a two-slide presentation explaining ";
var SUFFIX = " to a general audience.";
function normalizeRequest(requestText) {
  let text = requestText;
  if (text.endsWith("\r\n")) {
    text = text.slice(0, -2);
  } else if (text.endsWith("\n")) {
    text = text.slice(0, -1);
  }
  if (!text.startsWith(PREFIX) || !text.endsWith(SUFFIX)) {
    fail("REQUEST_GRAMMAR_MISMATCH");
  }
  const designator = normalizeCriticalString(
    text.slice(PREFIX.length, text.length - SUFFIX.length)
  );
  if (designator.length === 0) {
    fail("REQUEST_GRAMMAR_MISMATCH");
  }
  const length = scalarLength(designator);
  if (length === null || !isCriticalStringValid(designator)) {
    fail("INVALID_CRITICAL_STRING");
  }
  if (length > 256) {
    fail("DESIGNATOR_TOO_LONG");
  }
  return designator;
}

// src/core/stable-jsonld.js
init_define_RPC_ARTIFACT_DIGESTS();
var encoder = new TextEncoder();
function serializeJsonLd(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}
`);
}

// src/core/validate-profile.js
init_define_RPC_ARTIFACT_DIGESTS();

// src/core/normalize-graph.js
init_define_RPC_ARTIFACT_DIGESTS();
function isAbsoluteIri2(value) {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) && !/[\u0000-\u0020]/u.test(value);
}
function objects(graph, subject, predicate) {
  return graph.filter(
    (triple) => triple.subject === subject && triple.predicate === predicate
  ).map((triple) => triple.object);
}
function namedObjects(graph, subject, predicate) {
  return objects(graph, subject, predicate).filter((object) => object.kind === "iri").map((object) => object.value);
}
function subjects(graph, predicate, objectIri) {
  return graph.filter(
    (triple) => triple.predicate === predicate && triple.object.kind === "iri" && triple.object.value === objectIri
  ).map((triple) => triple.subject).filter((subject, index, values) => values.indexOf(subject) === index);
}
function hasIri(graph, subject, predicate, objectIri) {
  return graph.some(
    (triple) => triple.subject === subject && triple.predicate === predicate && triple.object.kind === "iri" && triple.object.value === objectIri
  );
}
function normalizedTripleKey(triple) {
  const object = triple.object;
  if (object.kind === "literal" && object.language === "" && object.datatype === "http://www.w3.org/2001/XMLSchema#string") {
    return JSON.stringify([
      triple.subject,
      triple.predicate,
      "literal",
      normalizeCriticalString(object.value),
      "",
      object.datatype
    ]);
  }
  if (object.kind === "literal") {
    return JSON.stringify([
      triple.subject,
      triple.predicate,
      "literal",
      object.value,
      object.language,
      object.datatype
    ]);
  }
  return JSON.stringify([
    triple.subject,
    triple.predicate,
    "iri",
    object.value
  ]);
}
function equalNormalizedTripleSets(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right.map((triple) => normalizedTripleKey(triple)));
  return left.every((triple) => rightSet.has(normalizedTripleKey(triple)));
}

// src/core/validate-profile.js
function oneLiteral(graph, predicate, datatype = `${XSD}string`) {
  const values = objects(graph, SUPPORTED_PROFILE, predicate).filter(
    (object) => object.kind === "literal" && object.language === "" && object.datatype === datatype
  );
  if (values.length !== 1) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  return values[0].value.normalize("NFC");
}
function oneIri(graph, predicate) {
  const values = objects(graph, SUPPORTED_PROFILE, predicate).filter(
    (object) => object.kind === "iri"
  );
  if (values.length !== 1) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  return values[0].value;
}
function validateProfile(canonicalGraph, userGraph) {
  const profileSubjects = subjects(
    userGraph,
    RDF_TYPE,
    PRESENTATION_PROFILE
  );
  if (profileSubjects.length === 1 && profileSubjects[0] !== SUPPORTED_PROFILE) {
    fail("UNSUPPORTED_PROFILE");
  }
  if (profileSubjects.length !== 1 || profileSubjects[0] !== SUPPORTED_PROFILE || !equalNormalizedTripleSets(canonicalGraph, userGraph)) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  const slideCountText = oneLiteral(
    userGraph,
    `${PROJECTION}slideCount`,
    `${XSD}integer`
  );
  const slideCount = Number(slideCountText);
  const participantOrder = oneLiteral(
    userGraph,
    `${PROJECTION}participantOrder`
  );
  if (slideCount !== 2 || !Number.isSafeInteger(slideCount)) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  if (participantOrder !== "utf16-code-unit-ascending-label") {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  return {
    id: SUPPORTED_PROFILE,
    slideCount,
    participantOrder,
    eligibleSourceClass: oneIri(
      userGraph,
      `${PROJECTION}eligibleSourceClass`
    ),
    overviewRule: oneIri(userGraph, `${PROJECTION}overviewRule`),
    associationTemplate: oneLiteral(
      userGraph,
      `${PROJECTION}associationTemplate`
    ),
    documentTitleTemplate: oneLiteral(
      userGraph,
      `${PROJECTION}documentTitleTemplate`
    ),
    participantSlideTitle: oneLiteral(
      userGraph,
      `${PROJECTION}participantSlideTitle`
    ),
    advanceLabel: oneLiteral(userGraph, `${PROJECTION}advanceLabel`),
    backLabel: oneLiteral(userGraph, `${PROJECTION}backLabel`),
    outputFormat: oneIri(userGraph, `${PROJECTION}outputFormat`)
  };
}

// src/core/validate-resolved-neighborhood.js
init_define_RPC_ARTIFACT_DIGESTS();
var MESSAGES = {
  EXACTLY_ONE_NAME_PER_PARTICIPANT: "Each selected participant must have exactly one valid Designative Name.",
  EXACTLY_ONE_RESOLVING_DESIGNATOR: "Exactly one Non-Name Identifier must match the requested designator.",
  EXACTLY_TWO_PERSON_PARTICIPANTS: "Resolved association must specifically depend on exactly two distinct Persons.",
  NO_OWL_SAMEAS_AMONG_SELECTED: "No owl:sameAs assertion may connect selected individuals.",
  PARTICIPANTS_ASSERTED_DIFFERENT: "The selected participants must be asserted owl:differentFrom.",
  RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY: "Resolved entity must be directly typed as a BFO relational quality.",
  RESOLVED_ENTITY_IS_PERSON_ASSOCIATION: "Resolved entity must be directly typed as a Person Association.",
  RESOLVING_DESIGNATOR_IS_VALID: "Resolving designator must have one label, designate one entity, and not be meta-typed.",
  SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT: "The six selected individuals must have pairwise-distinct absolute IRIs."
};
function violation(code, source) {
  const result = { code };
  if (source !== void 0) {
    result.source = source;
  }
  result.message = MESSAGES[code];
  return result;
}
function namespaceAllowed(value) {
  return ALLOWED_VOCABULARY_NAMESPACES.some(
    (namespace) => value.startsWith(namespace)
  );
}
function prohibited(value) {
  return PROHIBITED_SOURCE_NAMESPACES.some(
    (namespace) => value.startsWith(namespace)
  );
}
function validateSourceNamespaces(graph) {
  for (const triple of graph) {
    const iriPositions = [triple.subject, triple.predicate];
    if (triple.object.kind === "iri") {
      iriPositions.push(triple.object.value);
    } else {
      iriPositions.push(triple.object.datatype);
    }
    if (iriPositions.some((value) => prohibited(value))) {
      fail("SOURCE_GRAPH_CONTAMINATED");
    }
    if (triple.subject.startsWith(CONTRACT) || triple.predicate.startsWith(CONTRACT) || triple.object.kind === "literal" && triple.object.datatype.startsWith(CONTRACT) || triple.object.kind === "iri" && triple.object.value.startsWith(CONTRACT) && !(triple.predicate === RDF_TYPE && triple.object.value === PERSON_ASSOCIATION)) {
      fail("LOCAL_CONTRACT_VOCABULARY_VIOLATION");
    }
    if (!namespaceAllowed(triple.predicate)) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
    if (triple.predicate === RDF_TYPE && (triple.object.kind !== "iri" || !namespaceAllowed(triple.object.value))) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
    if (triple.object.kind === "literal" && !namespaceAllowed(triple.object.datatype)) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
  }
}
function hasMetaType(graph, subject) {
  return [...META_TYPES].some((type) => hasIri(graph, subject, RDF_TYPE, type));
}
function criticalLabel(object) {
  if (object.kind !== "literal" || object.language !== "" || object.datatype !== `${XSD}string`) {
    return null;
  }
  const value = normalizeCriticalString(object.value);
  const length = scalarLength(value);
  if (length === null || !isCriticalStringValid(value)) {
    fail("INVALID_CRITICAL_STRING");
  }
  if (length > 256) {
    fail("LABEL_TOO_LONG");
  }
  return value;
}
function selectDesignator(graph, designator, violations) {
  const candidates = subjects(graph, RDF_TYPE, NON_NAME_IDENTIFIER).filter(
    (subject) => objects(graph, subject, RDFS_LABEL).some(
      (object) => object.kind === "literal" && normalizeCriticalString(object.value) === designator
    )
  );
  if (candidates.length !== 1 || !isAbsoluteIri2(candidates[0])) {
    violations.push(violation("EXACTLY_ONE_RESOLVING_DESIGNATOR"));
    return null;
  }
  const designatorNode = candidates[0];
  const labels = objects(graph, designatorNode, RDFS_LABEL);
  const designated = objects(graph, designatorNode, DESIGNATES);
  const designatorLabel = labels.length === 1 ? criticalLabel(labels[0]) : null;
  if (labels.length !== 1 || designatorLabel !== designator || designated.length !== 1 || designated[0].kind !== "iri" || !isAbsoluteIri2(designated[0].value) || hasMetaType(graph, designatorNode)) {
    violations.push(
      violation("RESOLVING_DESIGNATOR_IS_VALID", designatorNode)
    );
    return null;
  }
  return { designatorLabel, designatorNode, root: designated[0].value };
}
function validateParticipant(graph, participant, violations) {
  if (!isAbsoluteIri2(participant) || !hasIri(graph, participant, RDF_TYPE, PERSON) || hasMetaType(graph, participant)) {
    violations.push(
      violation("EXACTLY_TWO_PERSON_PARTICIPANTS", participant)
    );
  }
}
function selectName(graph, participant, violations) {
  const candidates = subjects(graph, RDF_TYPE, DESIGNATIVE_NAME).filter(
    (subject) => hasIri(graph, subject, DESIGNATES, participant)
  );
  if (candidates.length !== 1 || !isAbsoluteIri2(candidates[0])) {
    violations.push(
      violation("EXACTLY_ONE_NAME_PER_PARTICIPANT", participant)
    );
    return null;
  }
  const name = candidates[0];
  const designated = objects(graph, name, DESIGNATES);
  const labels = objects(graph, name, RDFS_LABEL);
  const label = labels.length === 1 ? criticalLabel(labels[0]) : null;
  if (designated.length !== 1 || designated[0].kind !== "iri" || designated[0].value !== participant || labels.length !== 1 || label === null || label.length === 0 || hasMetaType(graph, name)) {
    violations.push(
      violation("EXACTLY_ONE_NAME_PER_PARTICIPANT", participant)
    );
    return null;
  }
  return { label, name, participant };
}
function resolveAndValidate(graph, designator, profile) {
  validateSourceNamespaces(graph);
  const violations = [];
  const resolution = selectDesignator(graph, designator, violations);
  if (resolution === null) {
    fail("FIXTURE_CONTRACT_FAILED", violations);
  }
  const { designatorLabel, designatorNode, root } = resolution;
  if (!hasIri(graph, root, RDF_TYPE, profile.eligibleSourceClass)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_PERSON_ASSOCIATION", root)
    );
  }
  if (!hasIri(graph, root, RDF_TYPE, RELATIONAL_QUALITY)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY", root)
    );
  }
  if (hasMetaType(graph, root)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_PERSON_ASSOCIATION", root)
    );
  }
  const participantObjects = objects(graph, root, SPECIFICALLY_DEPENDS_ON);
  const participants = namedObjects(graph, root, SPECIFICALLY_DEPENDS_ON).filter(
    (participant, index, values) => values.indexOf(participant) === index
  );
  if (participantObjects.length !== 2 || participants.length !== 2 || participants.some((participant) => !isAbsoluteIri2(participant))) {
    violations.push(violation("EXACTLY_TWO_PERSON_PARTICIPANTS", root));
  }
  for (const participant of participants) {
    validateParticipant(graph, participant, violations);
  }
  if (participants.length === 2 && !hasIri(
    graph,
    participants[0],
    OWL_DIFFERENT_FROM,
    participants[1]
  ) && !hasIri(
    graph,
    participants[1],
    OWL_DIFFERENT_FROM,
    participants[0]
  )) {
    violations.push(violation("PARTICIPANTS_ASSERTED_DIFFERENT", root));
  }
  const namedParticipants = participants.map(
    (participant) => selectName(graph, participant, violations)
  );
  const selectedNames = namedParticipants.filter((entry) => entry !== null);
  if (participants.length === 2 && selectedNames.length === 2) {
    const selected = [
      designatorNode,
      root,
      ...participants,
      ...selectedNames.map((entry) => entry.name)
    ];
    const distinct = new Set(selected);
    if (selected.length !== 6 || distinct.size !== 6) {
      violations.push(
        violation("SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT", root)
      );
    }
    if (graph.some(
      (triple) => triple.predicate === OWL_SAME_AS && triple.object.kind === "iri" && distinct.has(triple.subject) && distinct.has(triple.object.value)
    )) {
      violations.push(violation("NO_OWL_SAMEAS_AMONG_SELECTED", root));
    }
  }
  if (violations.length > 0) {
    fail("FIXTURE_CONTRACT_FAILED", violations);
  }
  selectedNames.sort(
    (left, right) => compareCodeUnits2(left.label, right.label) || compareCodeUnits2(left.participant, right.participant)
  );
  const associationSentence = substituteAssociation(
    profile.associationTemplate,
    selectedNames[0].label,
    selectedNames[1].label
  );
  if (graph.some(
    (triple) => triple.object.kind === "literal" && triple.object.value === associationSentence
  )) {
    fail("SOURCE_GRAPH_CONTAMINATED");
  }
  return {
    designatorLabel,
    designatorNode,
    root,
    participants: selectedNames,
    associationSentence
  };
}

// src/core/phase5.js
var PASSED_CHECKS = [
  "EXACTLY_ONE_NAME_PER_PARTICIPANT",
  "EXACTLY_TWO_PERSON_PARTICIPANTS",
  "NO_OWL_SAMEAS_AMONG_SELECTED",
  "NO_SOURCE_GRAPH_CONTAMINATION",
  "PARTICIPANTS_ASSERTED_DIFFERENT",
  "RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY",
  "RESOLVED_ENTITY_IS_PERSON_ASSOCIATION",
  "SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT"
];
function checkId(code) {
  return `run:check-${code.toLowerCase().replaceAll("_", "-")}`;
}
function buildRequestStage(designator, profile) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:request",
    "@type": "projection:ProjectionRequest",
    targetArtifact: "projection:Presentation",
    requestedDesignatorText: designator,
    communicativeGoal: "projection:Explain",
    audience: "projection:GeneralAudience",
    slideLimit: profile.slideCount,
    outputFormat: `projection:${profile.outputFormat.slice(PROJECTION.length)}`,
    normalizedBy: "rule:controlled-request-v1-0"
  };
}
function buildResolutionStage(designator, selection) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:resolution",
    "@type": "projection:ScopeResolution",
    requestedDesignatorText: designator,
    sourceScope: selection.root,
    resolvedBy: selection.designatorNode,
    resolutionStatus: "projection:UniqueMatch",
    resolutionRule: "rule:exact-designator-match-v1-0"
  };
}
function buildValidationStage(selection) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:contract-validation",
    "@type": "projection:ContractValidation",
    contractVersion: "person-association-contract-v1.0",
    validatedRoot: selection.root,
    status: "projection:Passed",
    check: PASSED_CHECKS.map((code) => ({
      "@id": checkId(code),
      "@type": "projection:ValidationCheck",
      code,
      passed: true
    }))
  };
}
async function runPhase5(parsedInputs) {
  const contractGraph = await expandTrustedDocument(
    parsedInputs.contract,
    parsedInputs.context,
    "contract"
  );
  const canonicalProfileGraph = await expandTrustedDocument(
    parsedInputs.canonicalProfile,
    parsedInputs.context,
    "canonicalProfile"
  );
  const userProfileGraph = await expandTrustedDocument(
    parsedInputs.userProfile,
    parsedInputs.context,
    "userProfile"
  );
  const sourceGraph = await expandTrustedDocument(
    parsedInputs.source,
    parsedInputs.context,
    "source"
  );
  const designator = normalizeRequest(parsedInputs.request);
  const profile = validateProfile(canonicalProfileGraph, userProfileGraph);
  const selection = resolveAndValidate(sourceGraph, designator, profile);
  const request = buildRequestStage(designator, profile);
  const resolution = buildResolutionStage(designator, selection);
  const contractValidation = buildValidationStage(selection);
  return {
    artifacts: {
      "01-request.jsonld": serializeJsonLd(request),
      "02-resolution.jsonld": serializeJsonLd(resolution),
      "03-contract-validation.jsonld": serializeJsonLd(contractValidation)
    },
    contractGraph,
    profile,
    selection,
    sourceGraph,
    stages: { request, resolution, contractValidation }
  };
}

// src/core/select-content.js
init_define_RPC_ARTIFACT_DIGESTS();
var REASONS = [
  "projection:ResolvedRoot",
  "projection:ResolvingDesignator",
  "projection:SpecificallyDependedOnParticipant",
  "projection:DesignatesParticipant",
  "projection:SpecificallyDependedOnParticipant",
  "projection:DesignatesParticipant"
];
function selectContent(selection) {
  const selectedSource = [
    selection.root,
    selection.designatorNode,
    selection.participants[0]?.participant,
    selection.participants[0]?.name,
    selection.participants[1]?.participant,
    selection.participants[1]?.name
  ];
  if (selectedSource.some((source) => typeof source !== "string") || new Set(selectedSource).size !== 6) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const selectionTrace = selectedSource.map((source, index) => ({
    "@id": `run:trace-${index + 1}`,
    "@type": "projection:SelectionTrace",
    sequence: index + 1,
    source,
    reason: REASONS[index]
  }));
  if (selectionTrace.length !== selectedSource.length || selectionTrace.some(
    (trace, index) => trace.sequence !== index + 1 || trace.source !== selectedSource[index]
  )) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:manifest",
    "@type": "projection:ContentManifest",
    root: selection.root,
    selectedSource,
    selectionTrace,
    selectionRule: "rule:person-association-neighborhood-v1-0"
  };
}

// src/core/phase6.js
async function runPhase6(parsedInputs) {
  const phase5 = await runPhase5(parsedInputs);
  const contentManifest = selectContent(phase5.selection);
  const narrative = buildNarrative(phase5.selection, phase5.profile);
  const presentation = buildPresentation(narrative, phase5.profile);
  return {
    ...phase5,
    artifacts: {
      ...phase5.artifacts,
      "04-content-manifest.jsonld": serializeJsonLd(contentManifest),
      "05-narrative.jsonld": serializeJsonLd(narrative),
      "06-presentation.jsonld": serializeJsonLd(presentation)
    },
    stages: {
      ...phase5.stages,
      contentManifest,
      narrative,
      presentation
    }
  };
}

// src/core/core.js
var INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request",
  "carrierStyle",
  "carrierNavigation"
];
var LOCKED_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation"
];
var STRUCTURAL_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request"
];
var JSON_INPUT_ROLES = /* @__PURE__ */ new Set([
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source"
]);
var INPUT_LIMITS = {
  context: [64 * 1024, "CONTEXT_TOO_LARGE"],
  contract: [64 * 1024, "CONTRACT_TOO_LARGE"],
  canonicalProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  userProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  source: [1024 * 1024, "SOURCE_TOO_LARGE"],
  request: [4 * 1024, "REQUEST_TOO_LARGE"]
};
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function hasExactDataMembers(value, memberNames) {
  if (!isPlainObject(value)) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== memberNames.length || ownKeys.some((key) => typeof key !== "string" || !memberNames.includes(key))) {
    return false;
  }
  return memberNames.every((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor !== void 0 && "value" in descriptor;
  });
}
function snapshotCoreRequest(coreRequest) {
  if (!hasExactDataMembers(coreRequest, ["inputs"])) {
    return null;
  }
  const suppliedInputs = coreRequest.inputs;
  if (!hasExactDataMembers(suppliedInputs, INPUT_ROLES)) {
    return null;
  }
  const snapshots = {};
  try {
    for (const role of INPUT_ROLES) {
      if (Object.prototype.toString.call(suppliedInputs[role]) !== "[object Uint8Array]") {
        return null;
      }
      snapshots[role] = Uint8Array.prototype.slice.call(suppliedInputs[role]);
    }
  } catch {
    return null;
  }
  return snapshots;
}
function failure(code, violations = []) {
  const governingCode = violations.length > 100 ? "TOO_MANY_VIOLATIONS" : code;
  return {
    status: "error",
    statusLine: `status=error code=${governingCode}
`,
    code: governingCode,
    errorReport: buildErrorReport({ code, violations })
  };
}
function lowercaseHex(arrayBuffer) {
  let result = "";
  for (const value of new Uint8Array(arrayBuffer)) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}
async function sha256(bytes) {
  return lowercaseHex(await crypto.subtle.digest("SHA-256", bytes));
}
async function compileCore(coreRequest) {
  const inputs = snapshotCoreRequest(coreRequest);
  if (inputs === null) {
    return failure("INVALID_CORE_REQUEST");
  }
  for (const role of LOCKED_INPUT_ROLES) {
    if (await sha256(inputs[role]) !== EMBEDDED_ARTIFACT_DIGESTS[role]) {
      return failure("ARTIFACT_LOCK_MISMATCH");
    }
  }
  const parsedInputs = {};
  for (const role of STRUCTURAL_INPUT_ROLES) {
    const [limit, tooLargeCode] = INPUT_LIMITS[role];
    if (inputs[role].byteLength > limit) {
      return failure(tooLargeCode);
    }
    let decoded;
    try {
      decoded = decodeUtf8Input(inputs[role]);
    } catch {
      return failure("INVALID_UTF8");
    }
    if (JSON_INPUT_ROLES.has(role)) {
      try {
        parsedInputs[role] = scanJsonText(decoded.text).value;
      } catch (error) {
        if (error instanceof JsonScanError && (error.code === "DUPLICATE_JSON_MEMBER" || error.code === "JSON_TOO_DEEP")) {
          return failure(error.code);
        }
        return failure("INTERNAL_COMPILER_ERROR");
      }
    } else {
      parsedInputs[role] = decoded.text;
    }
  }
  try {
    await runPhase6(parsedInputs);
  } catch (error) {
    if (error instanceof CoreFailure) {
      return failure(error.code, error.violations);
    }
    return failure("INTERNAL_COMPILER_ERROR");
  }
  return failure("INTERNAL_COMPILER_ERROR");
}
export {
  buildErrorReport,
  compileCore
};
