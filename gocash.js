"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
(function (global) {
  var STORAGE_KEY = '__APP2WEB_PARAMS__';
  var EVENT_CACHE_KEY = '__APP2WEB_EVENT_CACHE__';
  var USER_ID_KEY = '__APP2WEB_USER_ID__';
  var SESSION_ID_KEY = '__APP2WEB_SESSION_ID__';
  var goCashSdk = {
    config: {},
    queryParams: {},
    eventCache: new Map(),
    offlineQueue: [],
    pageEnterTime: 0,
    userId: null,
    sessionId: null,
    autoTrackedEvents: new Set(),
    initialized: false,
    /** 初始化 SDK */init: function init() {
      var _this = this;
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (this.initialized) {
        if (this.config.debug) this._log('SDK 已初始化，跳过重复初始化');
        return;
      }
      this.initialized = true;
      this.config = Object.assign({
        debug: true,
        storage: 'local',
        // or 'local'
        deduplicate: true,
        throttleInterval: 1500,
        // 3秒节流
        maxOfflineQueue: 20,
        // 离线队列最大长度
        // endpoint: 'http://localhost:3000/api/data', //事件上报接口
        endpoint: 'https://test-cw-gateway.snail99.com/cashwall-apis/v1.0/pixel/track',
        //事件上报接口
        uploadOnce: true,
        // 同一事件只上传一次
        appId: 6600
      }, options);
      this.queryParams = this._parseAndStoreParams();
      this.userId = this._getOrCreateId(USER_ID_KEY, 24);
      this.sessionId = this._getOrCreateId(SESSION_ID_KEY, 16, true);
      this._restoreOfflineQueue();
      this._flushOfflineEvents();
      this.pageEnterTime = Date.now();
      if (this.config.debug) {
        this._log('Initialized config1:', this.config);
        this._log('Query params1:', this.queryParams);
        this._log('UserId1:', this.userId, 'SessionId:', this.sessionId);
      }
      window.addEventListener('online', function () {
        _this._log('Network online, flushing offline queue...');
        _this._flushOfflineEvents();
      });
      window.addEventListener('beforeunload', function () {
        // const duration = Date.now() - this.pageEnterTime;
        // this.trackEvent('page_duration', {
        // 	duration
        // });
      });
      // this._setupAutoTrackEvents();
    },
    // Base64 编码
    _encode: function _encode(str) {
      try {
        // return btoa(unescape(encodeURIComponent(str)));
        return str;
      } catch (e) {
        this._log('Base64 encode error1:', e);
        return str;
      }
    },
    // Base64 解码
    _decode: function _decode(str) {
      try {
        // return decodeURIComponent(escape(atob(str)));
        return str;
      } catch (e) {
        this._log('Base64 decode error1:', e);
        return str;
      }
    },
    /** 解析并缓存 URL 参数 */_parseAndStoreParams: function _parseAndStoreParams() {
      var storage = this.config.storage === 'local' ? localStorage : sessionStorage;
      var query = new URLSearchParams(window.location.search);
      var storedRaw = storage.getItem(STORAGE_KEY);
      var stored = {};
      if (storedRaw) {
        try {
          stored = JSON.parse(this._decode(storedRaw));
        } catch (e) {
          stored = {};
        }
      }
      var _iterator = _createForOfIteratorHelper(query.entries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
            key = _step$value[0],
            value = _step$value[1];
          stored[key] = value;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      storage.setItem(STORAGE_KEY, this._encode(JSON.stringify(stored)));
      return stored;
    },
    /** 获取参数 */getParam: function getParam(key) {
      return this.queryParams[key] || null;
    },
    /** 生成或获取用户唯一 ID / Session ID */_getOrCreateId: function _getOrCreateId(key) {
      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
      var sessionOnly = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      try {
        var storage = sessionOnly ? sessionStorage : localStorage;
        var encodedId = storage.getItem(key);
        var id = encodedId ? this._decode(encodedId) : null;
        if (!id) {
          id = this._generateId(length);
          storage.setItem(key, this._encode(id));
          if (this.config.debug) {
            this._log("Generated new ID for ".concat(key, ":"), id);
          }
        }
        return id;
      } catch (e) {
        if (this.config.debug) {
          this._log("Failed to get/create ID for ".concat(key, ":"), e);
        }
        return null;
      }
    },
    /** 简单生成随机 ID */_generateId: function _generateId() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 16;
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var result = '';
      for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    /** 节流判断 */_isThrottled: function _isThrottled(eventKey) {
      var now = Date.now();
      var lastTime = this.eventCache.get(eventKey);
      if (!lastTime || now - lastTime > this.config.throttleInterval) {
        this.eventCache.set(eventKey, now);
        return false;
      }
      return true;
    },
    /** 恢复离线事件队列 */_restoreOfflineQueue: function _restoreOfflineQueue() {
      try {
        var raw = localStorage.getItem(EVENT_CACHE_KEY);
        this.offlineQueue = raw ? JSON.parse(this._decode(raw)) : [];
      } catch (e) {
        this.offlineQueue = [];
      }
    },
    /** 保存离线事件 */_persistOfflineQueue: function _persistOfflineQueue() {
      try {
        localStorage.setItem(EVENT_CACHE_KEY, this._encode(JSON.stringify(this.offlineQueue)));
      } catch (e) {
        if (this.config.debug) this._log('Failed to persist queue', e);
      }
    },
    _getEventKey: function _getEventKey(eventName, data) {
      var sortedData = Object.keys(data).sort().reduce(function (obj, key) {
        obj[key] = data[key];
        return obj;
      }, {});
      return "".concat(eventName, ":").concat(JSON.stringify(sortedData));
    },
    /** 上报事件（支持节流 & 离线缓存） */
    /** 上报事件（支持去重 & 节流 & 离线缓存） */
    trackEvent: function trackEvent(eventName) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var eventKey = this._getEventKey(eventName, data);

      // === 一次性事件上传判断 ===
      if (this.config.uploadOnce) {
        var dedupMap = this._getDedupEventMap();
        if (dedupMap[eventKey]) {
          if (this.config.debug) this._log('Event already tracked once, skipping:', eventKey);
          return;
        }
        dedupMap[eventKey] = true;
        this._setDedupEventMap(dedupMap);
      }

      // === 节流判断 ===
      if (this.config.deduplicate && this._isThrottled(eventKey)) {
        if (this.config.debug) this._log('Event throttled:', eventName);
        return;
      }
      var payload = _objectSpread({
        event: eventName || '',
        uuid: this.queryParams.uuid || '',
        appId: this.queryParams.appId || 6600
      }, data);
      if (this.config.debug) {
        this._log('Sending event:', payload);
      }

      // return

      if (!navigator.onLine) {
        if (this.config.debug) this._log('Offline - queueing event');
        if (this.offlineQueue.length >= this.config.maxOfflineQueue) {
          this.offlineQueue.shift();
        }
        this.offlineQueue.push(payload);
        this._persistOfflineQueue();
        return;
      }
      this._sendEvent(payload);
    },
    _getDedupEventMap: function _getDedupEventMap() {
      try {
        var raw = localStorage.getItem('__APP2WEB_DEDUP_EVENTS__');
        return raw ? JSON.parse(this._decode(raw)) : {};
      } catch (e) {
        return {};
      }
    },
    _setDedupEventMap: function _setDedupEventMap(map) {
      try {
        localStorage.setItem('__APP2WEB_DEDUP_EVENTS__', this._encode(JSON.stringify(map)));
      } catch (e) {
        if (this.config.debug) this._log('Failed to save dedup event map:', e);
      }
    },
    /** 实际发送事件 */_sendEvent: function _sendEvent(payload) {
      var _this2 = this;
      console.log("实际发送事件", payload);
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })["catch"](function (err) {
        if (_this2.config.debug) _this2._log('Failed to send event:', err);
        if (_this2.offlineQueue.length >= _this2.config.maxOfflineQueue) {
          _this2.offlineQueue.shift();
        }
        _this2.offlineQueue.push(payload);
        _this2._persistOfflineQueue();
      });
    },
    /** 网络恢复后重发离线缓存 */_flushOfflineEvents: function _flushOfflineEvents() {
      if (!navigator.onLine || this.offlineQueue.length === 0) return;
      if (this.config.debug) this._log('Flushing offline events');
      var queue = _toConsumableArray(this.offlineQueue);
      this.offlineQueue = [];
      this._persistOfflineQueue();
      var _iterator2 = _createForOfIteratorHelper(queue),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var payload = _step2.value;
          this._sendEvent(payload);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    },
    /** 新增：设置自动事件监听 */_setupAutoTrackEvents: function _setupAutoTrackEvents() {
      var _this3 = this;
      var eventsToTrack = ['click', 'scroll', 'touchstart', 'focus'];
      eventsToTrack.forEach(function (eventName) {
        var _handler = function handler() {
          if (!_this3.autoTrackedEvents.has(eventName)) {
            _this3.autoTrackedEvents.add(eventName);
            _this3.trackEvent("auto_event_".concat(eventName), {
              first: true
            });
            _this3._log("Auto-tracked first ".concat(eventName, " event"));
          }
          window.removeEventListener(eventName, _handler, true);
        };
        window.addEventListener(eventName, _handler, true);
      });
    },
    /** 获取所有参数 */getAllParams: function getAllParams() {
      return this.queryParams;
    },
    /** 内部调试日志 */_log: function _log() {
      if (this.config.debug) {
        var _console;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        (_console = console).log.apply(_console, ['[App2WebSDK]'].concat(args));
      }
    }
  };

  // 暴露到全局
  global.GoCash = goCashSdk;
})(window);
