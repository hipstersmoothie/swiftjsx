"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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

  // node_modules/react-refresh/cjs/react-refresh-runtime.development.js
  var require_react_refresh_runtime_development = __commonJS({
    "node_modules/react-refresh/cjs/react-refresh-runtime.development.js"(exports) {
      "use strict";
      (function() {
        function computeFullKey(signature) {
          if (null !== signature.fullKey) return signature.fullKey;
          var fullKey = signature.ownKey;
          try {
            var hooks = signature.getCustomHooks();
          } catch (err) {
            return signature.forceReset = true, signature.fullKey = fullKey;
          }
          for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            if ("function" !== typeof hook)
              return signature.forceReset = true, signature.fullKey = fullKey;
            hook = allSignaturesByType.get(hook);
            if (void 0 !== hook) {
              var nestedHookKey = computeFullKey(hook);
              hook.forceReset && (signature.forceReset = true);
              fullKey += "\n---\n" + nestedHookKey;
            }
          }
          return signature.fullKey = fullKey;
        }
        function resolveFamily(type) {
          return updatedFamiliesByType.get(type);
        }
        function cloneMap(map) {
          var clone = /* @__PURE__ */ new Map();
          map.forEach(function(value, key) {
            clone.set(key, value);
          });
          return clone;
        }
        function cloneSet(set) {
          var clone = /* @__PURE__ */ new Set();
          set.forEach(function(value) {
            clone.add(value);
          });
          return clone;
        }
        function getProperty(object, property) {
          try {
            return object[property];
          } catch (err) {
          }
        }
        function register2(type, id) {
          if (!(null === type || "function" !== typeof type && "object" !== typeof type || allFamiliesByType.has(type))) {
            var family = allFamiliesByID.get(id);
            void 0 === family ? (family = { current: type }, allFamiliesByID.set(id, family)) : pendingUpdates.push([family, type]);
            allFamiliesByType.set(type, family);
            if ("object" === typeof type && null !== type)
              switch (getProperty(type, "$$typeof")) {
                case REACT_FORWARD_REF_TYPE:
                  register2(type.render, id + "$render");
                  break;
                case REACT_MEMO_TYPE:
                  register2(type.type, id + "$type");
              }
          }
        }
        function setSignature(type, key) {
          var forceReset = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : false, getCustomHooks = 3 < arguments.length ? arguments[3] : void 0;
          allSignaturesByType.has(type) || allSignaturesByType.set(type, {
            forceReset,
            ownKey: key,
            fullKey: null,
            getCustomHooks: getCustomHooks || function() {
              return [];
            }
          });
          if ("object" === typeof type && null !== type)
            switch (getProperty(type, "$$typeof")) {
              case REACT_FORWARD_REF_TYPE:
                setSignature(type.render, key, forceReset, getCustomHooks);
                break;
              case REACT_MEMO_TYPE:
                setSignature(type.type, key, forceReset, getCustomHooks);
            }
        }
        function collectCustomHooksForSignature(type) {
          type = allSignaturesByType.get(type);
          void 0 !== type && computeFullKey(type);
        }
        var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map, allFamiliesByID = /* @__PURE__ */ new Map(), allFamiliesByType = new PossiblyWeakMap(), allSignaturesByType = new PossiblyWeakMap(), updatedFamiliesByType = new PossiblyWeakMap(), pendingUpdates = [], helpersByRendererID = /* @__PURE__ */ new Map(), helpersByRoot = /* @__PURE__ */ new Map(), mountedRoots = /* @__PURE__ */ new Set(), failedRoots = /* @__PURE__ */ new Set(), rootElements = "function" === typeof WeakMap ? /* @__PURE__ */ new WeakMap() : null, isPerformingRefresh = false;
        exports._getMountedRootCount = function() {
          return mountedRoots.size;
        };
        exports.collectCustomHooksForSignature = collectCustomHooksForSignature;
        exports.createSignatureFunctionForTransform = function() {
          var savedType, hasCustomHooks, didCollectHooks = false;
          return function(type, key, forceReset, getCustomHooks) {
            if ("string" === typeof key)
              return savedType || (savedType = type, hasCustomHooks = "function" === typeof getCustomHooks), null == type || "function" !== typeof type && "object" !== typeof type || setSignature(type, key, forceReset, getCustomHooks), type;
            !didCollectHooks && hasCustomHooks && (didCollectHooks = true, collectCustomHooksForSignature(savedType));
          };
        };
        exports.getFamilyByID = function(id) {
          return allFamiliesByID.get(id);
        };
        exports.getFamilyByType = function(type) {
          return allFamiliesByType.get(type);
        };
        exports.hasUnrecoverableErrors = function() {
          return false;
        };
        exports.injectIntoGlobalHook = function(globalObject) {
          var hook = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (void 0 === hook) {
            var nextID = 0;
            globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
              renderers: /* @__PURE__ */ new Map(),
              supportsFiber: true,
              inject: function() {
                return nextID++;
              },
              onScheduleFiberRoot: function() {
              },
              onCommitFiberRoot: function() {
              },
              onCommitFiberUnmount: function() {
              }
            };
          }
          if (hook.isDisabled)
            console.warn(
              "Something has shimmed the React DevTools global hook (__REACT_DEVTOOLS_GLOBAL_HOOK__). Fast Refresh is not compatible with this shim and will be disabled."
            );
          else {
            var oldInject = hook.inject;
            hook.inject = function(injected) {
              var id = oldInject.apply(this, arguments);
              "function" === typeof injected.scheduleRefresh && "function" === typeof injected.setRefreshHandler && helpersByRendererID.set(id, injected);
              return id;
            };
            hook.renderers.forEach(function(injected, id) {
              "function" === typeof injected.scheduleRefresh && "function" === typeof injected.setRefreshHandler && helpersByRendererID.set(id, injected);
            });
            var oldOnCommitFiberRoot = hook.onCommitFiberRoot, oldOnScheduleFiberRoot = hook.onScheduleFiberRoot || function() {
            };
            hook.onScheduleFiberRoot = function(id, root2, children) {
              isPerformingRefresh || (failedRoots.delete(root2), null !== rootElements && rootElements.set(root2, children));
              return oldOnScheduleFiberRoot.apply(this, arguments);
            };
            hook.onCommitFiberRoot = function(id, root2, maybePriorityLevel, didError) {
              var helpers = helpersByRendererID.get(id);
              if (void 0 !== helpers) {
                helpersByRoot.set(root2, helpers);
                helpers = root2.current;
                var alternate = helpers.alternate;
                null !== alternate ? (alternate = null != alternate.memoizedState && null != alternate.memoizedState.element && mountedRoots.has(root2), helpers = null != helpers.memoizedState && null != helpers.memoizedState.element, !alternate && helpers ? (mountedRoots.add(root2), failedRoots.delete(root2)) : alternate && helpers || (alternate && !helpers ? (mountedRoots.delete(root2), didError ? failedRoots.add(root2) : helpersByRoot.delete(root2)) : alternate || helpers || didError && failedRoots.add(root2))) : mountedRoots.add(root2);
              }
              return oldOnCommitFiberRoot.apply(this, arguments);
            };
          }
        };
        exports.isLikelyComponentType = function(type) {
          switch (typeof type) {
            case "function":
              if (null != type.prototype) {
                if (type.prototype.isReactComponent) return true;
                var ownNames = Object.getOwnPropertyNames(type.prototype);
                if (1 < ownNames.length || "constructor" !== ownNames[0] || type.prototype.__proto__ !== Object.prototype)
                  return false;
              }
              type = type.name || type.displayName;
              return "string" === typeof type && /^[A-Z]/.test(type);
            case "object":
              if (null != type)
                switch (getProperty(type, "$$typeof")) {
                  case REACT_FORWARD_REF_TYPE:
                  case REACT_MEMO_TYPE:
                    return true;
                }
              return false;
            default:
              return false;
          }
        };
        exports.performReactRefresh = function() {
          if (0 === pendingUpdates.length || isPerformingRefresh) return null;
          isPerformingRefresh = true;
          try {
            var staleFamilies = /* @__PURE__ */ new Set(), updatedFamilies = /* @__PURE__ */ new Set(), updates = pendingUpdates;
            pendingUpdates = [];
            updates.forEach(function(_ref) {
              var family = _ref[0];
              _ref = _ref[1];
              var prevType = family.current;
              updatedFamiliesByType.set(prevType, family);
              updatedFamiliesByType.set(_ref, family);
              family.current = _ref;
              prevType.prototype && prevType.prototype.isReactComponent || _ref.prototype && _ref.prototype.isReactComponent || typeof prevType !== typeof _ref || "object" === typeof prevType && null !== prevType && null !== _ref && (getProperty(prevType, "$$typeof") !== getProperty(_ref, "$$typeof") || getProperty(prevType, "$$typeof") === REACT_MEMO_TYPE && null === getProperty(prevType, "compare") !== (null === getProperty(_ref, "compare"))) ? _ref = false : (prevType = allSignaturesByType.get(prevType), _ref = allSignaturesByType.get(_ref), _ref = void 0 === prevType && void 0 === _ref || void 0 !== prevType && void 0 !== _ref && computeFullKey(prevType) === computeFullKey(_ref) && !_ref.forceReset ? true : false);
              _ref ? updatedFamilies.add(family) : staleFamilies.add(family);
            });
            var update = {
              updatedFamilies,
              staleFamilies
            };
            helpersByRendererID.forEach(function(helpers) {
              helpers.setRefreshHandler(resolveFamily);
            });
            var didError = false, firstError = null, failedRootsSnapshot = cloneSet(failedRoots), mountedRootsSnapshot = cloneSet(mountedRoots), helpersByRootSnapshot = cloneMap(helpersByRoot);
            failedRootsSnapshot.forEach(function(root2) {
              var helpers = helpersByRootSnapshot.get(root2);
              if (void 0 === helpers)
                throw Error(
                  "Could not find helpers for a root. This is a bug in React Refresh."
                );
              failedRoots.has(root2);
              if (null !== rootElements && rootElements.has(root2)) {
                var element = rootElements.get(root2);
                try {
                  helpers.scheduleRoot(root2, element);
                } catch (err) {
                  didError || (didError = true, firstError = err);
                }
              }
            });
            mountedRootsSnapshot.forEach(function(root2) {
              var helpers = helpersByRootSnapshot.get(root2);
              if (void 0 === helpers)
                throw Error(
                  "Could not find helpers for a root. This is a bug in React Refresh."
                );
              mountedRoots.has(root2);
              try {
                helpers.scheduleRefresh(root2, update);
              } catch (err) {
                didError || (didError = true, firstError = err);
              }
            });
            if (didError) throw firstError;
            return update;
          } finally {
            isPerformingRefresh = false;
          }
        };
        exports.register = register2;
        exports.setSignature = setSignature;
      })();
    }
  });

  // node_modules/react-refresh/runtime.js
  var require_runtime = __commonJS({
    "node_modules/react-refresh/runtime.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_refresh_runtime_development();
      }
    }
  });

  // node_modules/react/cjs/react.development.js
  var require_react_development = __commonJS({
    "node_modules/react/cjs/react.development.js"(exports, module) {
      "use strict";
      (function() {
        function defineDeprecationWarning(methodName, info) {
          Object.defineProperty(Component.prototype, methodName, {
            get: function() {
              console.warn(
                "%s(...) is deprecated in plain JavaScript React classes. %s",
                info[0],
                info[1]
              );
            }
          });
        }
        function getIteratorFn(maybeIterable) {
          if (null === maybeIterable || "object" !== typeof maybeIterable)
            return null;
          maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
          return "function" === typeof maybeIterable ? maybeIterable : null;
        }
        function warnNoop(publicInstance, callerName) {
          publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
          var warningKey = publicInstance + "." + callerName;
          didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
            "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
            callerName,
            publicInstance
          ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function ComponentDummy() {
        }
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function noop() {
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
              return "ViewTransition";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          newKey = ReactElement(
            oldElement.type,
            newKey,
            oldElement.props,
            oldElement._owner,
            oldElement._debugStack,
            oldElement._debugTask
          );
          oldElement._store && (newKey._store.validated = oldElement._store.validated);
          return newKey;
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function escape(key) {
          var escaperLookup = { "=": "=0", ":": "=2" };
          return "$" + key.replace(/[=:]/g, function(match) {
            return escaperLookup[match];
          });
        }
        function getElementKey(element, index) {
          return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
        }
        function resolveThenable(thenable) {
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
            default:
              switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
                function(fulfilledValue) {
                  "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
                },
                function(error) {
                  "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              )), thenable.status) {
                case "fulfilled":
                  return thenable.value;
                case "rejected":
                  throw thenable.reason;
              }
          }
          throw thenable;
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if ("undefined" === type || "boolean" === type) children = null;
          var invokeCallback = false;
          if (null === children) invokeCallback = true;
          else
            switch (type) {
              case "bigint":
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                    break;
                  case REACT_LAZY_TYPE:
                    return invokeCallback = children._init, mapIntoArray(
                      invokeCallback(children._payload),
                      array,
                      escapedPrefix,
                      nameSoFar,
                      callback
                    );
                }
            }
          if (invokeCallback) {
            invokeCallback = children;
            callback = callback(invokeCallback);
            var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
            isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
              return c;
            })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
              callback,
              escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
                userProvidedKeyEscapeRegex,
                "$&/"
              ) + "/") + childKey
            ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
            return 1;
          }
          invokeCallback = 0;
          childKey = "" === nameSoFar ? "." : nameSoFar + ":";
          if (isArrayImpl(children))
            for (var i = 0; i < children.length; i++)
              nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if (i = getIteratorFn(children), "function" === typeof i)
            for (i === children.entries && (didWarnAboutMaps || console.warn(
              "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
            ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
              nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if ("object" === type) {
            if ("function" === typeof children.then)
              return mapIntoArray(
                resolveThenable(children),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              );
            array = String(children);
            throw Error(
              "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
            );
          }
          return invokeCallback;
        }
        function mapChildren(children, func, context) {
          if (null == children) return children;
          var result = [], count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function lazyInitializer(payload) {
          if (-1 === payload._status) {
            var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
            null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
              resolveDebugValue = resolve;
              rejectDebugValue = reject;
            }));
            ioInfo = payload._result;
            var thenable = ioInfo();
            thenable.then(
              function(moduleObject) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 1;
                  payload._result = moduleObject;
                  var _ioInfo = payload._ioInfo;
                  if (null != _ioInfo) {
                    _ioInfo.end = performance.now();
                    var debugValue = null == moduleObject ? void 0 : moduleObject.default;
                    resolveDebugValue(debugValue);
                    _ioInfo.value.status = "fulfilled";
                    _ioInfo.value.value = debugValue;
                  }
                  void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
                }
              },
              function(error) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 2;
                  payload._result = error;
                  var _ioInfo2 = payload._ioInfo;
                  null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop, noop), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
                  void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              }
            );
            ioInfo = payload._ioInfo;
            if (null != ioInfo) {
              var displayName = thenable.displayName;
              "string" === typeof displayName && (ioInfo.name = displayName);
            }
            -1 === payload._status && (payload._status = 0, payload._result = thenable);
          }
          if (1 === payload._status)
            return ioInfo = payload._result, void 0 === ioInfo && console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
              ioInfo
            ), "default" in ioInfo || console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
              ioInfo
            ), ioInfo.default;
          throw payload._result;
        }
        function resolveDispatcher() {
          var dispatcher = ReactSharedInternals.H;
          null === dispatcher && console.error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
          return dispatcher;
        }
        function releaseAsyncTransition() {
          ReactSharedInternals.asyncTransitions--;
        }
        function startTransition(scope) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition.types = null !== prevTransition ? prevTransition.types : null;
          currentTransition._updatedFibers = /* @__PURE__ */ new Set();
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
          } catch (error) {
            reportGlobalError(error);
          } finally {
            null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
              "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
            )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
              "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
            ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        }
        function addTransitionType(type) {
          var transition = ReactSharedInternals.T;
          if (null !== transition) {
            var transitionTypes = transition.types;
            null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
          } else
            0 === ReactSharedInternals.asyncTransitions && console.error(
              "addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."
            ), startTransition(addTransitionType.bind(null, type));
        }
        function enqueueTask(task) {
          if (null === enqueueTaskImpl)
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              enqueueTaskImpl = (module && module[requireString]).call(
                module,
                "timers"
              ).setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                  "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
                ));
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          return enqueueTaskImpl(task);
        }
        function aggregateErrors(errors) {
          return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
        }
        function popActScope(prevActQueue, prevActScopeDepth) {
          prevActScopeDepth !== actScopeDepth - 1 && console.error(
            "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
          );
          actScopeDepth = prevActScopeDepth;
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          var queue = ReactSharedInternals.actQueue;
          if (null !== queue)
            if (0 !== queue.length)
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                });
                return;
              } catch (error) {
                ReactSharedInternals.thrownErrors.push(error);
              }
            else ReactSharedInternals.actQueue = null;
          0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
        }
        function flushActQueue(queue) {
          if (!isFlushing) {
            isFlushing = true;
            var i = 0;
            try {
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  ReactSharedInternals.didUsePromise = false;
                  var continuation = callback(false);
                  if (null !== continuation) {
                    if (ReactSharedInternals.didUsePromise) {
                      queue[i] = callback;
                      queue.splice(0, i);
                      return;
                    }
                    callback = continuation;
                  } else break;
                } while (1);
              }
              queue.length = 0;
            } catch (error) {
              queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
            } finally {
              isFlushing = false;
            }
          }
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
          isMounted: function() {
            return false;
          },
          enqueueForceUpdate: function(publicInstance) {
            warnNoop(publicInstance, "forceUpdate");
          },
          enqueueReplaceState: function(publicInstance) {
            warnNoop(publicInstance, "replaceState");
          },
          enqueueSetState: function(publicInstance) {
            warnNoop(publicInstance, "setState");
          }
        }, assign = Object.assign, emptyObject = {};
        Object.freeze(emptyObject);
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
            throw Error(
              "takes an object of state variables to update or a function which returns an object of state variables."
            );
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        var deprecatedAPIs = {
          isMounted: [
            "isMounted",
            "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
          ],
          replaceState: [
            "replaceState",
            "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
          ]
        };
        for (fnName in deprecatedAPIs)
          deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
        ComponentDummy.prototype = Component.prototype;
        deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
        deprecatedAPIs.constructor = PureComponent;
        assign(deprecatedAPIs, Component.prototype);
        deprecatedAPIs.isPureReactComponent = true;
        var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
          H: null,
          A: null,
          T: null,
          S: null,
          actQueue: null,
          asyncTransitions: 0,
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false,
          didUsePromise: false,
          thrownErrors: [],
          getCurrentStack: null,
          recentlyCreatedOwnerStacks: 0
        }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        deprecatedAPIs = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
          deprecatedAPIs,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
          if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
            var event = new window.ErrorEvent("error", {
              bubbles: true,
              cancelable: true,
              message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
              error
            });
            if (!window.dispatchEvent(event)) return;
          } else if ("object" === typeof process && "function" === typeof process.emit) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
          queueMicrotask(function() {
            return queueMicrotask(callback);
          });
        } : enqueueTask;
        deprecatedAPIs = Object.freeze({
          __proto__: null,
          c: function(size) {
            return resolveDispatcher().useMemoCache(size);
          }
        });
        var fnName = {
          map: mapChildren,
          forEach: function(children, forEachFunc, forEachContext) {
            mapChildren(
              children,
              function() {
                forEachFunc.apply(this, arguments);
              },
              forEachContext
            );
          },
          count: function(children) {
            var n = 0;
            mapChildren(children, function() {
              n++;
            });
            return n;
          },
          toArray: function(children) {
            return mapChildren(children, function(child) {
              return child;
            }) || [];
          },
          only: function(children) {
            if (!isValidElement(children))
              throw Error(
                "React.Children.only expected to receive a single React element child."
              );
            return children;
          }
        };
        exports.Activity = REACT_ACTIVITY_TYPE;
        exports.Children = fnName;
        exports.Component = Component;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
        exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
        exports.__COMPILER_RUNTIME = deprecatedAPIs;
        exports.act = function(callback) {
          var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
          actScopeDepth++;
          var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
          try {
            var result = callback();
          } catch (error) {
            ReactSharedInternals.thrownErrors.push(error);
          }
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          if (null !== result && "object" === typeof result && "function" === typeof result.then) {
            var thenable = result;
            queueSeveralMicrotasks(function() {
              didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
                "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
              ));
            });
            return {
              then: function(resolve, reject) {
                didAwaitActCall = true;
                thenable.then(
                  function(returnValue) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    if (0 === prevActScopeDepth) {
                      try {
                        flushActQueue(queue), enqueueTask(function() {
                          return recursivelyFlushAsyncActWork(
                            returnValue,
                            resolve,
                            reject
                          );
                        });
                      } catch (error$0) {
                        ReactSharedInternals.thrownErrors.push(error$0);
                      }
                      if (0 < ReactSharedInternals.thrownErrors.length) {
                        var _thrownError = aggregateErrors(
                          ReactSharedInternals.thrownErrors
                        );
                        ReactSharedInternals.thrownErrors.length = 0;
                        reject(_thrownError);
                      }
                    } else resolve(returnValue);
                  },
                  function(error) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                      ReactSharedInternals.thrownErrors
                    ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                  }
                );
              }
            };
          }
          var returnValue$jscomp$0 = result;
          popActScope(prevActQueue, prevActScopeDepth);
          0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
            ));
          }), ReactSharedInternals.actQueue = null);
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
                return recursivelyFlushAsyncActWork(
                  returnValue$jscomp$0,
                  resolve,
                  reject
                );
              })) : resolve(returnValue$jscomp$0);
            }
          };
        };
        exports.addTransitionType = addTransitionType;
        exports.cache = function(fn) {
          return function() {
            return fn.apply(null, arguments);
          };
        };
        exports.cacheSignal = function() {
          return null;
        };
        exports.captureOwnerStack = function() {
          var getCurrentStack = ReactSharedInternals.getCurrentStack;
          return null === getCurrentStack ? null : getCurrentStack();
        };
        exports.cloneElement = function(element, config, children) {
          if (null === element || void 0 === element)
            throw Error(
              "The argument must be a React element, but you passed " + element + "."
            );
          var props = assign({}, element.props), key = element.key, owner = element._owner;
          if (null != config) {
            var JSCompiler_inline_result;
            a: {
              if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
                config,
                "ref"
              ).get) && JSCompiler_inline_result.isReactWarning) {
                JSCompiler_inline_result = false;
                break a;
              }
              JSCompiler_inline_result = void 0 !== config.ref;
            }
            JSCompiler_inline_result && (owner = getOwner());
            hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
            for (propName in config)
              !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
          }
          var propName = arguments.length - 2;
          if (1 === propName) props.children = children;
          else if (1 < propName) {
            JSCompiler_inline_result = Array(propName);
            for (var i = 0; i < propName; i++)
              JSCompiler_inline_result[i] = arguments[i + 2];
            props.children = JSCompiler_inline_result;
          }
          props = ReactElement(
            element.type,
            key,
            props,
            owner,
            element._debugStack,
            element._debugTask
          );
          for (key = 2; key < arguments.length; key++)
            validateChildKeys(arguments[key]);
          return props;
        };
        exports.createContext = function(defaultValue) {
          defaultValue = {
            $$typeof: REACT_CONTEXT_TYPE,
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            _threadCount: 0,
            Provider: null,
            Consumer: null
          };
          defaultValue.Provider = defaultValue;
          defaultValue.Consumer = {
            $$typeof: REACT_CONSUMER_TYPE,
            _context: defaultValue
          };
          defaultValue._currentRenderer = null;
          defaultValue._currentRenderer2 = null;
          return defaultValue;
        };
        exports.createElement = function(type, config, children) {
          for (var i = 2; i < arguments.length; i++)
            validateChildKeys(arguments[i]);
          var propName;
          i = {};
          var key = null;
          if (null != config)
            for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
              "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
            )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
              hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
          var childrenLength = arguments.length - 2;
          if (1 === childrenLength) i.children = children;
          else if (1 < childrenLength) {
            for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
              childArray[_i] = arguments[_i + 2];
            Object.freeze && Object.freeze(childArray);
            i.children = childArray;
          }
          if (type && type.defaultProps)
            for (propName in childrenLength = type.defaultProps, childrenLength)
              void 0 === i[propName] && (i[propName] = childrenLength[propName]);
          key && defineKeyPropWarningGetter(
            i,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
          return ReactElement(
            type,
            key,
            i,
            getOwner(),
            childrenLength,
            propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
        exports.createRef = function() {
          var refObject = { current: null };
          Object.seal(refObject);
          return refObject;
        };
        exports.forwardRef = function(render2) {
          null != render2 && render2.$$typeof === REACT_MEMO_TYPE ? console.error(
            "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
          ) : "function" !== typeof render2 ? console.error(
            "forwardRef requires a render function but was given %s.",
            null === render2 ? "null" : typeof render2
          ) : 0 !== render2.length && 2 !== render2.length && console.error(
            "forwardRef render functions accept exactly two parameters: props and ref. %s",
            1 === render2.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
          );
          null != render2 && null != render2.defaultProps && console.error(
            "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
          );
          var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render: render2 }, ownName;
          Object.defineProperty(elementType, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              render2.name || render2.displayName || (Object.defineProperty(render2, "name", { value: name }), render2.displayName = name);
            }
          });
          return elementType;
        };
        exports.isValidElement = isValidElement;
        exports.lazy = function(ctor) {
          ctor = { _status: -1, _result: ctor };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: ctor,
            _init: lazyInitializer
          }, ioInfo = {
            name: "lazy",
            start: -1,
            end: -1,
            value: null,
            owner: null,
            debugStack: Error("react-stack-top-frame"),
            debugTask: console.createTask ? console.createTask("lazy()") : null
          };
          ctor._ioInfo = ioInfo;
          lazyType._debugInfo = [{ awaited: ioInfo }];
          return lazyType;
        };
        exports.memo = function(type, compare) {
          null == type && console.error(
            "memo: The first argument must be a component. Instead received: %s",
            null === type ? "null" : typeof type
          );
          compare = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: void 0 === compare ? null : compare
          };
          var ownName;
          Object.defineProperty(compare, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
            }
          });
          return compare;
        };
        exports.startTransition = startTransition;
        exports.unstable_useCacheRefresh = function() {
          return resolveDispatcher().useCacheRefresh();
        };
        exports.use = function(usable) {
          return resolveDispatcher().use(usable);
        };
        exports.useActionState = function(action, initialState, permalink) {
          return resolveDispatcher().useActionState(
            action,
            initialState,
            permalink
          );
        };
        exports.useCallback = function(callback, deps) {
          return resolveDispatcher().useCallback(callback, deps);
        };
        exports.useContext = function(Context) {
          var dispatcher = resolveDispatcher();
          Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
            "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
          );
          return dispatcher.useContext(Context);
        };
        exports.useDebugValue = function(value, formatterFn) {
          return resolveDispatcher().useDebugValue(value, formatterFn);
        };
        exports.useDeferredValue = function(value, initialValue) {
          return resolveDispatcher().useDeferredValue(value, initialValue);
        };
        exports.useEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useEffect(create, deps);
        };
        exports.useEffectEvent = function(callback) {
          return resolveDispatcher().useEffectEvent(callback);
        };
        exports.useId = function() {
          return resolveDispatcher().useId();
        };
        exports.useImperativeHandle = function(ref, create, deps) {
          return resolveDispatcher().useImperativeHandle(ref, create, deps);
        };
        exports.useInsertionEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useInsertionEffect(create, deps);
        };
        exports.useLayoutEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useLayoutEffect(create, deps);
        };
        exports.useMemo = function(create, deps) {
          return resolveDispatcher().useMemo(create, deps);
        };
        exports.useOptimistic = function(passthrough, reducer) {
          return resolveDispatcher().useOptimistic(passthrough, reducer);
        };
        exports.useReducer = function(reducer, initialArg, init) {
          return resolveDispatcher().useReducer(reducer, initialArg, init);
        };
        exports.useRef = function(initialValue) {
          return resolveDispatcher().useRef(initialValue);
        };
        exports.useState = function(initialState) {
          return resolveDispatcher().useState(initialState);
        };
        exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
          return resolveDispatcher().useSyncExternalStore(
            subscribe,
            getSnapshot,
            getServerSnapshot
          );
        };
        exports.useTransition = function() {
          return resolveDispatcher().useTransition();
        };
        exports.version = "19.3.1";
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_development();
      }
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.development.js
  var require_react_jsx_runtime_development = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
      "use strict";
      (function() {
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
              return "ViewTransition";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
          var children = config.children;
          if (void 0 !== children)
            if (isStaticChildren)
              if (isArrayImpl(children)) {
                for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                  validateChildKeys(children[isStaticChildren]);
                Object.freeze && Object.freeze(children);
              } else
                console.error(
                  "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
                );
            else validateChildKeys(children);
          if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
              return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
              'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
              isStaticChildren,
              children,
              keys,
              children
            ), didWarnAboutKeySpread[children + isStaticChildren] = true);
          }
          children = null;
          void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
          hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
          if ("key" in config) {
            maybeKey = {};
            for (var propName in config)
              "key" !== propName && (maybeKey[propName] = config[propName]);
          } else maybeKey = config;
          children && defineKeyPropWarningGetter(
            maybeKey,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          return ReactElement(
            type,
            children,
            maybeKey,
            getOwner(),
            debugStack,
            debugTask
          );
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var React2 = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        React2 = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = React2.react_stack_bottom_frame.bind(
          React2,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutKeySpread = {};
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.jsx = function(type, config, maybeKey) {
          var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
          } else debugStackDEV = unknownOwnerDebugStack;
          return jsxDEVImpl(
            type,
            config,
            maybeKey,
            false,
            debugStackDEV,
            trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
        exports.jsxs = function(type, config, maybeKey) {
          var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
          } else debugStackDEV = unknownOwnerDebugStack;
          return jsxDEVImpl(
            type,
            config,
            maybeKey,
            true,
            debugStackDEV,
            trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
      })();
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_jsx_runtime_development();
      }
    }
  });

  // node_modules/react/cjs/react-jsx-dev-runtime.development.js
  var require_react_jsx_dev_runtime_development = __commonJS({
    "node_modules/react/cjs/react-jsx-dev-runtime.development.js"(exports) {
      "use strict";
      (function() {
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
              return "ViewTransition";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
          var children = config.children;
          if (void 0 !== children)
            if (isStaticChildren)
              if (isArrayImpl(children)) {
                for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                  validateChildKeys(children[isStaticChildren]);
                Object.freeze && Object.freeze(children);
              } else
                console.error(
                  "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
                );
            else validateChildKeys(children);
          if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
              return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
              'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
              isStaticChildren,
              children,
              keys,
              children
            ), didWarnAboutKeySpread[children + isStaticChildren] = true);
          }
          children = null;
          void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
          hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
          if ("key" in config) {
            maybeKey = {};
            for (var propName in config)
              "key" !== propName && (maybeKey[propName] = config[propName]);
          } else maybeKey = config;
          children && defineKeyPropWarningGetter(
            maybeKey,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          return ReactElement(
            type,
            children,
            maybeKey,
            getOwner(),
            debugStack,
            debugTask
          );
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var React2 = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        React2 = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = React2.react_stack_bottom_frame.bind(
          React2,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutKeySpread = {};
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
          var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
          } else debugStackDEV = unknownOwnerDebugStack;
          return jsxDEVImpl(
            type,
            config,
            maybeKey,
            isStaticChildren,
            debugStackDEV,
            trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
      })();
    }
  });

  // node_modules/react/jsx-dev-runtime.js
  var require_jsx_dev_runtime = __commonJS({
    "node_modules/react/jsx-dev-runtime.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_jsx_dev_runtime_development();
      }
    }
  });

  // node_modules/react/cjs/react-compiler-runtime.development.js
  var require_react_compiler_runtime_development = __commonJS({
    "node_modules/react/cjs/react-compiler-runtime.development.js"(exports) {
      "use strict";
      (function() {
        var ReactSharedInternals = require_react().__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
        exports.c = function(size) {
          var dispatcher = ReactSharedInternals.H;
          null === dispatcher && console.error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
          return dispatcher.useMemoCache(size);
        };
      })();
    }
  });

  // node_modules/react/compiler-runtime.js
  var require_compiler_runtime = __commonJS({
    "node_modules/react/compiler-runtime.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_compiler_runtime_development();
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.development.js
  var require_scheduler_development = __commonJS({
    "node_modules/scheduler/cjs/scheduler.development.js"(exports) {
      "use strict";
      (function() {
        function performWorkUntilDeadline() {
          needsPaint = false;
          if (isMessageLoopRunning) {
            var currentTime = exports.unstable_now();
            startTime = currentTime;
            var hasMoreWork = true;
            try {
              a: {
                isHostCallbackScheduled = false;
                isHostTimeoutScheduled && (isHostTimeoutScheduled = false, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
                isPerformingWork = true;
                var previousPriorityLevel = currentPriorityLevel;
                try {
                  b: {
                    advanceTimers(currentTime);
                    for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                      var callback = currentTask.callback;
                      if ("function" === typeof callback) {
                        currentTask.callback = null;
                        currentPriorityLevel = currentTask.priorityLevel;
                        var continuationCallback = callback(
                          currentTask.expirationTime <= currentTime
                        );
                        currentTime = exports.unstable_now();
                        if ("function" === typeof continuationCallback) {
                          currentTask.callback = continuationCallback;
                          advanceTimers(currentTime);
                          hasMoreWork = true;
                          break b;
                        }
                        currentTask === peek(taskQueue) && pop(taskQueue);
                        advanceTimers(currentTime);
                      } else pop(taskQueue);
                      currentTask = peek(taskQueue);
                    }
                    if (null !== currentTask) hasMoreWork = true;
                    else {
                      var firstTimer = peek(timerQueue);
                      null !== firstTimer && requestHostTimeout(
                        handleTimeout,
                        firstTimer.startTime - currentTime
                      );
                      hasMoreWork = false;
                    }
                  }
                  break a;
                } finally {
                  currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = false;
                }
                hasMoreWork = void 0;
              }
            } finally {
              hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = false;
            }
          }
        }
        function push(heap, node) {
          var index = heap.length;
          heap.push(node);
          a: for (; 0 < index; ) {
            var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
            if (0 < compare(parent, node))
              heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
            else break a;
          }
        }
        function peek(heap) {
          return 0 === heap.length ? null : heap[0];
        }
        function pop(heap) {
          if (0 === heap.length) return null;
          var first = heap[0], last = heap.pop();
          if (last !== first) {
            heap[0] = last;
            a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength; ) {
              var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
              if (0 > compare(left, last))
                rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
              else if (rightIndex < length && 0 > compare(right, last))
                heap[index] = right, heap[rightIndex] = last, index = rightIndex;
              else break a;
            }
          }
          return first;
        }
        function compare(a, b) {
          var diff = a.sortIndex - b.sortIndex;
          return 0 !== diff ? diff : a.id - b.id;
        }
        function advanceTimers(currentTime) {
          for (var timer = peek(timerQueue); null !== timer; ) {
            if (null === timer.callback) pop(timerQueue);
            else if (timer.startTime <= currentTime)
              pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
            else break;
            timer = peek(timerQueue);
          }
        }
        function handleTimeout(currentTime) {
          isHostTimeoutScheduled = false;
          advanceTimers(currentTime);
          if (!isHostCallbackScheduled)
            if (null !== peek(taskQueue))
              isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline());
            else {
              var firstTimer = peek(timerQueue);
              null !== firstTimer && requestHostTimeout(
                handleTimeout,
                firstTimer.startTime - currentTime
              );
            }
        }
        function shouldYieldToHost() {
          return needsPaint ? true : exports.unstable_now() - startTime < frameInterval ? false : true;
        }
        function requestHostTimeout(callback, ms) {
          taskTimeoutID = localSetTimeout(function() {
            callback(exports.unstable_now());
          }, ms);
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        exports.unstable_now = void 0;
        if ("object" === typeof performance && "function" === typeof performance.now) {
          var localPerformance = performance;
          exports.unstable_now = function() {
            return localPerformance.now();
          };
        } else {
          var localDate = Date, initialTime = localDate.now();
          exports.unstable_now = function() {
            return localDate.now() - initialTime;
          };
        }
        var taskQueue = [], timerQueue = [], taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = false, isHostCallbackScheduled = false, isHostTimeoutScheduled = false, needsPaint = false, localSetTimeout = "function" === typeof setTimeout ? setTimeout : null, localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null, localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null, isMessageLoopRunning = false, taskTimeoutID = -1, frameInterval = 5, startTime = -1;
        if ("function" === typeof localSetImmediate)
          var schedulePerformWorkUntilDeadline = function() {
            localSetImmediate(performWorkUntilDeadline);
          };
        else if ("undefined" !== typeof MessageChannel) {
          var channel = new MessageChannel(), port = channel.port2;
          channel.port1.onmessage = performWorkUntilDeadline;
          schedulePerformWorkUntilDeadline = function() {
            port.postMessage(null);
          };
        } else
          schedulePerformWorkUntilDeadline = function() {
            localSetTimeout(performWorkUntilDeadline, 0);
          };
        exports.unstable_IdlePriority = 5;
        exports.unstable_ImmediatePriority = 1;
        exports.unstable_LowPriority = 4;
        exports.unstable_NormalPriority = 3;
        exports.unstable_Profiling = null;
        exports.unstable_UserBlockingPriority = 2;
        exports.unstable_cancelCallback = function(task) {
          task.callback = null;
        };
        exports.unstable_forceFrameRate = function(fps) {
          0 > fps || 125 < fps ? console.error(
            "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
          ) : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
        };
        exports.unstable_getCurrentPriorityLevel = function() {
          return currentPriorityLevel;
        };
        exports.unstable_next = function(eventHandler) {
          switch (currentPriorityLevel) {
            case 1:
            case 2:
            case 3:
              var priorityLevel = 3;
              break;
            default:
              priorityLevel = currentPriorityLevel;
          }
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = priorityLevel;
          try {
            return eventHandler();
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
        exports.unstable_requestPaint = function() {
          needsPaint = true;
        };
        exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
          switch (priorityLevel) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              priorityLevel = 3;
          }
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = priorityLevel;
          try {
            return eventHandler();
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
        exports.unstable_scheduleCallback = function(priorityLevel, callback, options) {
          var currentTime = exports.unstable_now();
          "object" === typeof options && null !== options ? (options = options.delay, options = "number" === typeof options && 0 < options ? currentTime + options : currentTime) : options = currentTime;
          switch (priorityLevel) {
            case 1:
              var timeout = -1;
              break;
            case 2:
              timeout = 250;
              break;
            case 5:
              timeout = 1073741823;
              break;
            case 4:
              timeout = 1e4;
              break;
            default:
              timeout = 5e3;
          }
          timeout = options + timeout;
          priorityLevel = {
            id: taskIdCounter++,
            callback,
            priorityLevel,
            startTime: options,
            expirationTime: timeout,
            sortIndex: -1
          };
          options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = true, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline())));
          return priorityLevel;
        };
        exports.unstable_shouldYield = shouldYieldToHost;
        exports.unstable_wrapCallback = function(callback) {
          var parentPriorityLevel = currentPriorityLevel;
          return function() {
            var previousPriorityLevel = currentPriorityLevel;
            currentPriorityLevel = parentPriorityLevel;
            try {
              return callback.apply(this, arguments);
            } finally {
              currentPriorityLevel = previousPriorityLevel;
            }
          };
        };
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_scheduler_development();
      }
    }
  });

  // node_modules/react-reconciler/cjs/react-reconciler.development.js
  var require_react_reconciler_development = __commonJS({
    "node_modules/react-reconciler/cjs/react-reconciler.development.js"(exports, module) {
      "use strict";
      module.exports = function($$$config) {
        function findHook(fiber, id) {
          for (fiber = fiber.memoizedState; null !== fiber && 0 < id; )
            fiber = fiber.next, id--;
          return fiber;
        }
        function copyWithSetImpl(obj, path, index, value) {
          if (index >= path.length) return value;
          var key = path[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
          updated[key] = copyWithSetImpl(obj[key], path, index + 1, value);
          return updated;
        }
        function copyWithRename(obj, oldPath, newPath) {
          if (oldPath.length !== newPath.length)
            console.warn("copyWithRename() expects paths of the same length");
          else {
            for (var i = 0; i < newPath.length - 1; i++)
              if (oldPath[i] !== newPath[i]) {
                console.warn(
                  "copyWithRename() expects paths to be the same except for the deepest key"
                );
                return;
              }
            return copyWithRenameImpl(obj, oldPath, newPath, 0);
          }
        }
        function copyWithRenameImpl(obj, oldPath, newPath, index) {
          var oldKey = oldPath[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
          index + 1 === oldPath.length ? (updated[newPath[index]] = updated[oldKey], isArrayImpl(updated) ? updated.splice(oldKey, 1) : delete updated[oldKey]) : updated[oldKey] = copyWithRenameImpl(
            obj[oldKey],
            oldPath,
            newPath,
            index + 1
          );
          return updated;
        }
        function copyWithDeleteImpl(obj, path, index) {
          var key = path[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
          if (index + 1 === path.length)
            return isArrayImpl(updated) ? updated.splice(key, 1) : delete updated[key], updated;
          updated[key] = copyWithDeleteImpl(obj[key], path, index + 1);
          return updated;
        }
        function shouldSuspendImpl() {
          return false;
        }
        function shouldErrorImpl() {
          return null;
        }
        function createFiber(tag, pendingProps, key, mode) {
          return new FiberNode(tag, pendingProps, key, mode);
        }
        function scheduleRoot(root2, element) {
          root2.context === emptyContextObject && (updateContainerSync(element, root2, null, null), flushSyncWork());
        }
        function scheduleRefresh(root2, update) {
          if (null !== resolveFamily) {
            var staleFamilies = update.staleFamilies;
            update = update.updatedFamilies;
            flushPendingEffects();
            scheduleFibersWithFamiliesRecursively(
              root2.current,
              update,
              staleFamilies
            );
            flushSyncWork();
          }
        }
        function setRefreshHandler(handler) {
          resolveFamily = handler;
        }
        function warnInvalidHookAccess() {
          console.error(
            "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks"
          );
        }
        function warnInvalidContextAccess() {
          console.error(
            "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
          );
        }
        function noop() {
        }
        function warnForMissingKey() {
        }
        function setToSortedString(set) {
          var array = [];
          set.forEach(function(value) {
            array.push(value);
          });
          return array.sort().join(", ");
        }
        function getNearestMountedFiber(fiber) {
          for (var node = fiber, nextNode = node; nextNode && !nextNode.alternate; )
            node = nextNode, 0 !== (node.flags & 4098) && (fiber = node.return), nextNode = node.return;
          for (; node.return; ) node = node.return;
          return 3 === node.tag ? fiber : null;
        }
        function assertIsMounted(fiber) {
          if (getNearestMountedFiber(fiber) !== fiber)
            throw Error("Unable to find node on an unmounted component.");
        }
        function findCurrentFiberUsingSlowPath(fiber) {
          var alternate = fiber.alternate;
          if (!alternate) {
            alternate = getNearestMountedFiber(fiber);
            if (null === alternate)
              throw Error("Unable to find node on an unmounted component.");
            return alternate !== fiber ? null : fiber;
          }
          for (var a = fiber, b = alternate; ; ) {
            var parentA = a.return;
            if (null === parentA) break;
            var parentB = parentA.alternate;
            if (null === parentB) {
              b = parentA.return;
              if (null !== b) {
                a = b;
                continue;
              }
              break;
            }
            if (parentA.child === parentB.child) {
              for (parentB = parentA.child; parentB; ) {
                if (parentB === a) return assertIsMounted(parentA), fiber;
                if (parentB === b) return assertIsMounted(parentA), alternate;
                parentB = parentB.sibling;
              }
              throw Error("Unable to find node on an unmounted component.");
            }
            if (a.return !== b.return) a = parentA, b = parentB;
            else {
              for (var didFindChild = false, _child = parentA.child; _child; ) {
                if (_child === a) {
                  didFindChild = true;
                  a = parentA;
                  b = parentB;
                  break;
                }
                if (_child === b) {
                  didFindChild = true;
                  b = parentA;
                  a = parentB;
                  break;
                }
                _child = _child.sibling;
              }
              if (!didFindChild) {
                for (_child = parentB.child; _child; ) {
                  if (_child === a) {
                    didFindChild = true;
                    a = parentB;
                    b = parentA;
                    break;
                  }
                  if (_child === b) {
                    didFindChild = true;
                    b = parentB;
                    a = parentA;
                    break;
                  }
                  _child = _child.sibling;
                }
                if (!didFindChild)
                  throw Error(
                    "Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue."
                  );
              }
            }
            if (a.alternate !== b)
              throw Error(
                "Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue."
              );
          }
          if (3 !== a.tag)
            throw Error("Unable to find node on an unmounted component.");
          return a.stateNode.current === a ? fiber : alternate;
        }
        function findCurrentHostFiber(parent) {
          parent = findCurrentFiberUsingSlowPath(parent);
          return null !== parent ? findCurrentHostFiberImpl(parent) : null;
        }
        function findCurrentHostFiberImpl(node) {
          var tag = node.tag;
          if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
          for (node = node.child; null !== node; ) {
            tag = findCurrentHostFiberImpl(node);
            if (null !== tag) return tag;
            node = node.sibling;
          }
          return null;
        }
        function findCurrentHostFiberWithNoPortalsImpl(node) {
          var tag = node.tag;
          if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
          for (node = node.child; null !== node; ) {
            if (4 !== node.tag && (tag = findCurrentHostFiberWithNoPortalsImpl(node), null !== tag))
              return tag;
            node = node.sibling;
          }
          return null;
        }
        function getIteratorFn(maybeIterable) {
          if (null === maybeIterable || "object" !== typeof maybeIterable)
            return null;
          maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
          return "function" === typeof maybeIterable ? maybeIterable : null;
        }
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
              return "ViewTransition";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function getComponentNameFromFiber(fiber) {
          var type = fiber.type;
          switch (fiber.tag) {
            case 31:
              return "Activity";
            case 24:
              return "Cache";
            case 9:
              return (type._context.displayName || "Context") + ".Consumer";
            case 10:
              return type.displayName || "Context";
            case 18:
              return "DehydratedFragment";
            case 11:
              return fiber = type.render, fiber = fiber.displayName || fiber.name || "", type.displayName || ("" !== fiber ? "ForwardRef(" + fiber + ")" : "ForwardRef");
            case 7:
              return "Fragment";
            case 26:
            case 27:
            case 5:
              return type;
            case 4:
              return "Portal";
            case 3:
              return "Root";
            case 6:
              return "Text";
            case 16:
              return getComponentNameFromType(type);
            case 8:
              return type === REACT_STRICT_MODE_TYPE ? "StrictMode" : "Mode";
            case 22:
              if (null !== fiber.return)
                return getComponentNameFromFiber(fiber.return);
              break;
            case 12:
              return "Profiler";
            case 21:
              return "Scope";
            case 13:
              return "Suspense";
            case 19:
              return "SuspenseList";
            case 25:
              return "TracingMarker";
            case 30:
              return "ViewTransition";
            case 1:
            case 0:
            case 14:
            case 15:
              if ("function" === typeof type)
                return type.displayName || type.name || null;
              if ("string" === typeof type) return type;
              break;
            case 29:
              type = fiber._debugInfo;
              if (null != type) {
                for (var i = type.length - 1; 0 <= i; i--)
                  if ("string" === typeof type[i].name) return type[i].name;
              }
              if (null !== fiber.return)
                return getComponentNameFromFiber(fiber.return);
          }
          return null;
        }
        function createCursor(defaultValue) {
          return { current: defaultValue };
        }
        function pop(cursor, fiber) {
          0 > index$jscomp$0 ? console.error("Unexpected pop.") : (fiber !== fiberStack[index$jscomp$0] && console.error("Unexpected Fiber popped."), cursor.current = valueStack[index$jscomp$0], valueStack[index$jscomp$0] = null, fiberStack[index$jscomp$0] = null, index$jscomp$0--);
        }
        function push(cursor, value, fiber) {
          index$jscomp$0++;
          valueStack[index$jscomp$0] = cursor.current;
          fiberStack[index$jscomp$0] = fiber;
          cursor.current = value;
        }
        function clz32Fallback(x) {
          x >>>= 0;
          return 0 === x ? 32 : 31 - (log$1(x) / LN2 | 0) | 0;
        }
        function getHighestPriorityLanes(lanes) {
          var pendingSyncLanes = lanes & 42;
          if (0 !== pendingSyncLanes) return pendingSyncLanes;
          switch (lanes & -lanes) {
            case 1:
              return 1;
            case 2:
              return 2;
            case 4:
              return 4;
            case 8:
              return 8;
            case 16:
              return 16;
            case 32:
              return 32;
            case 64:
              return 64;
            case 128:
              return 128;
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
              return lanes & -lanes;
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
              return lanes & 3932160;
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
              return lanes & 62914560;
            case 67108864:
              return 67108864;
            case 134217728:
              return 134217728;
            case 268435456:
              return 268435456;
            case 536870912:
              return 536870912;
            case 1073741824:
              return 0;
            default:
              return console.error(
                "Should have found matching lanes. This is a bug in React."
              ), lanes;
          }
        }
        function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
          var pendingLanes = root2.pendingLanes;
          if (0 === pendingLanes) return 0;
          var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
          root2 = root2.warmLanes;
          var nonIdlePendingLanes = pendingLanes & 134217727;
          0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
          return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
        }
        function checkIfRootIsPrerendering(root2, renderLanes2) {
          return 0 === (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2);
        }
        function getEntangledLanes(root2, renderLanes2) {
          0 !== (renderLanes2 & 8) && (renderLanes2 |= renderLanes2 & 32);
          var allEntangledLanes = root2.entangledLanes;
          if (0 !== allEntangledLanes)
            for (root2 = root2.entanglements, allEntangledLanes &= renderLanes2; 0 < allEntangledLanes; ) {
              var index = 31 - clz32(allEntangledLanes), lane = 1 << index;
              renderLanes2 |= root2[index];
              allEntangledLanes &= ~lane;
            }
          return renderLanes2;
        }
        function computeExpirationTime(lane, currentTime) {
          switch (lane) {
            case 1:
            case 2:
            case 4:
            case 8:
            case 64:
              return currentTime + 250;
            case 16:
            case 32:
            case 128:
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
              return currentTime + 5e3;
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
              return -1;
            case 67108864:
            case 134217728:
            case 268435456:
            case 536870912:
            case 1073741824:
              return -1;
            default:
              return console.error(
                "Should have found matching lanes. This is a bug in React."
              ), -1;
          }
        }
        function claimNextRetryLane() {
          var lane = nextRetryLane;
          nextRetryLane <<= 1;
          0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
          return lane;
        }
        function createLaneMap(initial) {
          for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
          return laneMap;
        }
        function markRootUpdated$1(root2, updateLane) {
          root2.pendingLanes |= updateLane;
          268435456 !== updateLane && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
        }
        function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
          var previouslyPendingLanes = root2.pendingLanes;
          root2.pendingLanes = remainingLanes;
          root2.suspendedLanes = 0;
          root2.pingedLanes = 0;
          root2.warmLanes = 0;
          root2.expiredLanes &= remainingLanes;
          root2.entangledLanes &= remainingLanes;
          root2.errorRecoveryDisabledLanes &= remainingLanes;
          root2.shellSuspendCounter = 0;
          var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
          for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
            var index = 31 - clz32(remainingLanes), lane = 1 << index;
            entanglements[index] = 0;
            expirationTimes[index] = -1;
            var hiddenUpdatesForLane = hiddenUpdates[index];
            if (null !== hiddenUpdatesForLane)
              for (hiddenUpdates[index] = null, index = 0; index < hiddenUpdatesForLane.length; index++) {
                var update = hiddenUpdatesForLane[index];
                null !== update && (update.lane &= -536870913);
              }
            remainingLanes &= ~lane;
          }
          0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, 0);
          0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root2.tag && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
        }
        function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
          root2.pendingLanes |= spawnedLane;
          root2.suspendedLanes &= ~spawnedLane;
          var spawnedLaneIndex = 31 - clz32(spawnedLane);
          root2.entangledLanes |= spawnedLane;
          root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
        }
        function markRootEntangled(root2, entangledLanes) {
          var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
          for (root2 = root2.entanglements; rootEntangledLanes; ) {
            var index = 31 - clz32(rootEntangledLanes), lane = 1 << index;
            lane & entangledLanes | root2[index] & entangledLanes && (root2[index] |= entangledLanes);
            rootEntangledLanes &= ~lane;
          }
        }
        function getBumpedLaneForHydration(root2, renderLanes2) {
          var renderLane = renderLanes2 & -renderLanes2;
          renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
          return 0 !== (renderLane & (root2.suspendedLanes | renderLanes2)) ? 0 : renderLane;
        }
        function getBumpedLaneForHydrationByLane(lane) {
          switch (lane) {
            case 2:
              lane = 1;
              break;
            case 8:
              lane = 4;
              break;
            case 32:
              lane = 16;
              break;
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
              lane = 128;
              break;
            case 268435456:
              lane = 134217728;
              break;
            default:
              lane = 0;
          }
          return lane;
        }
        function addFiberToLanesMap(root2, fiber, lanes) {
          if (isDevToolsPresent)
            for (root2 = root2.pendingUpdatersLaneMap; 0 < lanes; ) {
              var index = 31 - clz32(lanes), lane = 1 << index;
              root2[index].add(fiber);
              lanes &= ~lane;
            }
        }
        function movePendingFibersToMemoized(root2, lanes) {
          if (isDevToolsPresent)
            for (var pendingUpdatersLaneMap = root2.pendingUpdatersLaneMap, memoizedUpdaters = root2.memoizedUpdaters; 0 < lanes; ) {
              var index = 31 - clz32(lanes);
              root2 = 1 << index;
              index = pendingUpdatersLaneMap[index];
              0 < index.size && (index.forEach(function(fiber) {
                var alternate = fiber.alternate;
                null !== alternate && memoizedUpdaters.has(alternate) || memoizedUpdaters.add(fiber);
              }), index.clear());
              lanes &= ~root2;
            }
        }
        function lanesToEventPriority(lanes) {
          lanes &= -lanes;
          return 2 < lanes ? 8 < lanes ? 0 !== (lanes & 134217727) ? 32 : 268435456 : 8 : 2;
        }
        function injectInternals(internals) {
          if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return false;
          var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (hook.isDisabled) return true;
          if (!hook.supportsFiber)
            return console.error(
              "The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://react.dev/link/react-devtools"
            ), true;
          try {
            rendererID = hook.inject(internals), injectedHook = hook;
          } catch (err) {
            console.error("React instrumentation encountered an error: %o.", err);
          }
          return hook.checkDCE ? true : false;
        }
        function setIsStrictModeForDevtools(newIsStrictMode) {
          "function" === typeof log && unstable_setDisableYieldValue(newIsStrictMode);
          if (injectedHook && "function" === typeof injectedHook.setStrictMode)
            try {
              injectedHook.setStrictMode(rendererID, newIsStrictMode);
            } catch (err) {
              hasLoggedError || (hasLoggedError = true, console.error(
                "React instrumentation encountered an error: %o",
                err
              ));
            }
        }
        function getViewTransitionName(props, instance) {
          if (null != props.name && "auto" !== props.name) return props.name;
          if (null !== instance.autoName) return instance.autoName;
          props = pendingEffectsRoot.identifierPrefix;
          var globalClientId = globalClientIdCounter$1++;
          props = "_" + props + "t_" + globalClientId.toString(32) + "_";
          return instance.autoName = props;
        }
        function getClassNameByType(classByType) {
          if (null == classByType || "string" === typeof classByType)
            return classByType;
          var className = null, activeTypes = pendingTransitionTypes;
          if (null !== activeTypes)
            for (var i = 0; i < activeTypes.length; i++) {
              var match = classByType[activeTypes[i]];
              if (null != match) {
                if ("none" === match) return "none";
                className = null == className ? match : className + (" " + match);
              }
            }
          return null == className ? classByType.default : className;
        }
        function getViewTransitionClassName(defaultClass, eventClass) {
          defaultClass = getClassNameByType(defaultClass);
          eventClass = getClassNameByType(eventClass);
          return null == eventClass ? "auto" === defaultClass ? null : defaultClass : "auto" === eventClass ? null : eventClass;
        }
        function is(x, y) {
          return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
        }
        function getArrayKind(array) {
          for (var kind = 0, i = 0; i < array.length && 100 > i; i++) {
            var value = array[i];
            if ("object" === typeof value && null !== value)
              if (isArrayImpl(value) && 2 === value.length && "string" === typeof value[0]) {
                if (0 !== kind && 3 !== kind) return 1;
                kind = 3;
              } else return 1;
            else {
              if ("function" === typeof value || "string" === typeof value && 50 < value.length || 0 !== kind && 2 !== kind || "bigint" === typeof value)
                return 1;
              kind = 2;
            }
          }
          return kind;
        }
        function addObjectToProperties(object, properties, indent, prefix2) {
          if (!ArrayBuffer.isView(object)) {
            var addedProperties = 0, key;
            for (key in object)
              if (hasOwnProperty.call(object, key) && "_" !== key[0] && (addedProperties++, addValueToProperties(key, object[key], properties, indent, prefix2), 100 <= addedProperties)) {
                properties.push([
                  prefix2 + "\xA0\xA0".repeat(indent) + "Only 100 properties are shown. React will not log more properties of this object.",
                  ""
                ]);
                break;
              }
          }
        }
        function readReactElementTypeof(value) {
          return "$$typeof" in value && hasOwnProperty.call(value, "$$typeof") ? value.$$typeof : void 0;
        }
        function addValueToProperties(propertyName, value, properties, indent, prefix2) {
          switch (typeof value) {
            case "object":
              if (null === value) {
                value = "null";
                break;
              } else {
                if (readReactElementTypeof(value) === REACT_ELEMENT_TYPE) {
                  var typeName = getComponentNameFromType(value.type) || "\u2026", key = value.key;
                  value = value.props;
                  var propsKeys = Object.keys(value), propsLength = propsKeys.length;
                  if (null == key && 0 === propsLength) {
                    value = "<" + typeName + " />";
                    break;
                  }
                  if (3 > indent || 1 === propsLength && "children" === propsKeys[0] && null == key) {
                    value = "<" + typeName + " \u2026 />";
                    break;
                  }
                  properties.push([
                    prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                    "<" + typeName
                  ]);
                  null !== key && addValueToProperties(
                    "key",
                    key,
                    properties,
                    indent + 1,
                    prefix2
                  );
                  propertyName = false;
                  key = 0;
                  for (var propKey in value)
                    if (key++, "children" === propKey ? null != value.children && (!isArrayImpl(value.children) || 0 < value.children.length) && (propertyName = true) : hasOwnProperty.call(value, propKey) && "_" !== propKey[0] && addValueToProperties(
                      propKey,
                      value[propKey],
                      properties,
                      indent + 1,
                      prefix2
                    ), 100 <= key)
                      break;
                  properties.push([
                    "",
                    propertyName ? ">\u2026</" + typeName + ">" : "/>"
                  ]);
                  return;
                }
                typeName = Object.prototype.toString.call(value);
                typeName = typeName.slice(8, typeName.length - 1);
                if (ArrayBuffer.isView(value)) {
                  value = value.length;
                  value = "number" === typeof value ? typeName + "(" + value + ")" : typeName;
                  break;
                }
                if ("Array" === typeName) {
                  if (propKey = 100 < value.length, key = getArrayKind(value), 2 === key || 0 === key) {
                    value = JSON.stringify(
                      propKey ? value.slice(0, 100).concat("\u2026") : value
                    );
                    break;
                  } else if (3 === key) {
                    properties.push([
                      prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                      ""
                    ]);
                    for (propertyName = 0; propertyName < value.length && 100 > propertyName; propertyName++)
                      typeName = value[propertyName], addValueToProperties(
                        typeName[0],
                        typeName[1],
                        properties,
                        indent + 1,
                        prefix2
                      );
                    propKey && addValueToProperties(
                      100 .toString(),
                      "\u2026",
                      properties,
                      indent + 1,
                      prefix2
                    );
                    return;
                  }
                }
                if ("Promise" === typeName) {
                  if ("fulfilled" === value.status) {
                    if (typeName = properties.length, addValueToProperties(
                      propertyName,
                      value.value,
                      properties,
                      indent,
                      prefix2
                    ), properties.length > typeName) {
                      properties = properties[typeName];
                      properties[1] = "Promise<" + (properties[1] || "Object") + ">";
                      return;
                    }
                  } else if ("rejected" === value.status && (typeName = properties.length, addValueToProperties(
                    propertyName,
                    value.reason,
                    properties,
                    indent,
                    prefix2
                  ), properties.length > typeName)) {
                    properties = properties[typeName];
                    properties[1] = "Rejected Promise<" + properties[1] + ">";
                    return;
                  }
                  properties.push([
                    "\xA0\xA0".repeat(indent) + propertyName,
                    "Promise"
                  ]);
                  return;
                }
                "Object" === typeName && (propKey = Object.getPrototypeOf(value)) && "function" === typeof propKey.constructor && (typeName = propKey.constructor.name);
                properties.push([
                  prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                  "Object" === typeName ? 3 > indent ? "" : "\u2026" : typeName
                ]);
                3 > indent && addObjectToProperties(value, properties, indent + 1, prefix2);
                return;
              }
            case "function":
              value = value.name;
              value = "" === value || "string" !== typeof value ? "() => {}" : value + "() {}";
              break;
            case "string":
              value = "This object has been omitted by React in the console log to avoid sending too much data from the server. Try logging smaller or more specific objects." === value ? "\u2026" : JSON.stringify(
                1024 <= value.length ? value.slice(0, 1023) + "\u2026" : value
              );
              break;
            case "undefined":
              value = "undefined";
              break;
            case "boolean":
              value = value ? "true" : "false";
              break;
            default:
              value = String(value);
          }
          properties.push([
            prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
            value
          ]);
        }
        function addObjectDiffToProperties(prev, next, properties, indent) {
          var isDeeplyEqual = true, prevPropertiesChecked = 0;
          for (key in prev) {
            if (100 < prevPropertiesChecked) {
              properties.push([
                "Previous object has more than 100 properties. React will not attempt to diff objects with too many properties.",
                ""
              ]);
              isDeeplyEqual = false;
              break;
            }
            key in next || (properties.push([
              "-\xA0" + "\xA0\xA0".repeat(indent) + key,
              "\u2026"
            ]), isDeeplyEqual = false);
            prevPropertiesChecked++;
          }
          prevPropertiesChecked = 0;
          for (var _key in next) {
            if (100 < prevPropertiesChecked) {
              properties.push([
                "Next object has more than 100 properties. React will not attempt to diff objects with too many properties.",
                ""
              ]);
              isDeeplyEqual = false;
              break;
            }
            if (_key in prev) {
              var key = prev[_key];
              var nextValue = next[_key];
              if (key !== nextValue) {
                if (0 === indent && "children" === _key) {
                  isDeeplyEqual = "\xA0\xA0".repeat(indent) + _key;
                  properties.push(
                    ["-\xA0" + isDeeplyEqual, "\u2026"],
                    ["+\xA0" + isDeeplyEqual, "\u2026"]
                  );
                  isDeeplyEqual = false;
                  continue;
                }
                if (!(3 <= indent)) {
                  if ("object" === typeof key && "object" === typeof nextValue && null !== key && null !== nextValue && readReactElementTypeof(key) === readReactElementTypeof(nextValue))
                    if (readReactElementTypeof(nextValue) === REACT_ELEMENT_TYPE) {
                      if (key.type === nextValue.type && key.key === nextValue.key) {
                        key = getComponentNameFromType(nextValue.type) || "\u2026";
                        isDeeplyEqual = "\xA0\xA0".repeat(indent) + _key;
                        key = "<" + key + " \u2026 />";
                        properties.push(
                          ["-\xA0" + isDeeplyEqual, key],
                          ["+\xA0" + isDeeplyEqual, key]
                        );
                        isDeeplyEqual = false;
                        continue;
                      }
                    } else {
                      var prevKind = Object.prototype.toString.call(key), nextKind = Object.prototype.toString.call(nextValue);
                      if (prevKind === nextKind && ("[object Object]" === nextKind || "[object Array]" === nextKind)) {
                        prevKind = [
                          "\u2007\xA0" + "\xA0\xA0".repeat(indent) + _key,
                          "[object Array]" === nextKind ? "Array" : ""
                        ];
                        properties.push(prevKind);
                        nextKind = properties.length;
                        addObjectDiffToProperties(
                          key,
                          nextValue,
                          properties,
                          indent + 1
                        ) ? nextKind === properties.length && (prevKind[1] = "Referentially unequal but deeply equal objects. Consider memoization.") : isDeeplyEqual = false;
                        continue;
                      }
                    }
                  else if ("function" === typeof key && "function" === typeof nextValue && key.name === nextValue.name && key.length === nextValue.length && (prevKind = Function.prototype.toString.call(key), nextKind = Function.prototype.toString.call(nextValue), prevKind === nextKind)) {
                    key = "" === nextValue.name ? "() => {}" : nextValue.name + "() {}";
                    properties.push([
                      "\u2007\xA0" + "\xA0\xA0".repeat(indent) + _key,
                      key + " Referentially unequal function closure. Consider memoization."
                    ]);
                    continue;
                  }
                }
                addValueToProperties(_key, key, properties, indent, "-\xA0");
                addValueToProperties(
                  _key,
                  nextValue,
                  properties,
                  indent,
                  "+\xA0"
                );
                isDeeplyEqual = false;
              }
            } else
              properties.push([
                "+\xA0" + "\xA0\xA0".repeat(indent) + _key,
                "\u2026"
              ]), isDeeplyEqual = false;
            prevPropertiesChecked++;
          }
          return isDeeplyEqual;
        }
        function setCurrentTrackFromLanes(lanes) {
          currentTrack = lanes & 63 ? "Blocking" : lanes & 64 ? "Gesture" : lanes & 4194176 ? "Transition" : lanes & 62914560 ? "Suspense" : lanes & 2080374784 ? "Idle" : "Other";
        }
        function logComponentTrigger(fiber, startTime, endTime, trigger) {
          supportsUserTiming && (reusableComponentOptions.start = startTime, reusableComponentOptions.end = endTime, reusableComponentDevToolDetails.color = "warning", reusableComponentDevToolDetails.tooltipText = trigger, reusableComponentDevToolDetails.properties = null, (fiber = fiber._debugTask) ? fiber.run(
            performance.measure.bind(
              performance,
              trigger,
              reusableComponentOptions
            )
          ) : performance.measure(trigger, reusableComponentOptions), performance.clearMeasures(trigger));
        }
        function logComponentReappeared(fiber, startTime, endTime) {
          logComponentTrigger(fiber, startTime, endTime, "Reconnect");
        }
        function logComponentRender(fiber, startTime, endTime, wasHydrated, committedLanes) {
          var name = getComponentNameFromFiber(fiber);
          if (null !== name && supportsUserTiming) {
            var alternate = fiber.alternate, selfTime = fiber.actualDuration;
            if (null === alternate || alternate.child !== fiber.child)
              for (var child = fiber.child; null !== child; child = child.sibling)
                selfTime -= child.actualDuration;
            selfTime = 0.5 > selfTime ? wasHydrated ? "tertiary-light" : "primary-light" : 10 > selfTime ? wasHydrated ? "tertiary" : "primary" : 100 > selfTime ? wasHydrated ? "tertiary-dark" : "primary-dark" : "error";
            var props = fiber.memoizedProps;
            wasHydrated = fiber._debugTask;
            null !== props && null !== alternate && alternate.memoizedProps !== props ? (child = [reusableChangedPropsEntry], props = addObjectDiffToProperties(
              alternate.memoizedProps,
              props,
              child,
              0
            ), 1 < child.length ? (props && !alreadyWarnedForDeepEquality && 0 === (alternate.lanes & committedLanes) && 100 < fiber.actualDuration ? (alreadyWarnedForDeepEquality = true, child[0] = reusableDeeplyEqualPropsEntry, reusableComponentDevToolDetails.color = "warning", reusableComponentDevToolDetails.tooltipText = "This component received deeply equal props. It might benefit from useMemo or the React Compiler in its owner.") : (reusableComponentDevToolDetails.color = selfTime, reusableComponentDevToolDetails.tooltipText = name), reusableComponentDevToolDetails.properties = child, reusableComponentOptions.start = startTime, reusableComponentOptions.end = endTime, fiber = "\u200B" + name, null != wasHydrated ? wasHydrated.run(
              performance.measure.bind(
                performance,
                fiber,
                reusableComponentOptions
              )
            ) : performance.measure(fiber, reusableComponentOptions), performance.clearMeasures(fiber)) : null != wasHydrated ? wasHydrated.run(
              console.timeStamp.bind(
                console,
                name,
                startTime,
                endTime,
                "Components \u269B",
                void 0,
                selfTime
              )
            ) : console.timeStamp(
              name,
              startTime,
              endTime,
              "Components \u269B",
              void 0,
              selfTime
            )) : null != wasHydrated ? wasHydrated.run(
              console.timeStamp.bind(
                console,
                name,
                startTime,
                endTime,
                "Components \u269B",
                void 0,
                selfTime
              )
            ) : console.timeStamp(
              name,
              startTime,
              endTime,
              "Components \u269B",
              void 0,
              selfTime
            );
          }
        }
        function logComponentErrored(fiber, startTime, endTime, errors) {
          if (supportsUserTiming) {
            var name = getComponentNameFromFiber(fiber);
            if (null !== name) {
              for (var debugTask = null, properties = [], i = 0; i < errors.length; i++) {
                var capturedValue = errors[i];
                null == debugTask && null !== capturedValue.source && (debugTask = capturedValue.source._debugTask);
                capturedValue = capturedValue.value;
                properties.push([
                  "Error",
                  "object" === typeof capturedValue && null !== capturedValue && "string" === typeof capturedValue.message ? String(capturedValue.message) : String(capturedValue)
                ]);
              }
              null !== fiber.key && addValueToProperties("key", fiber.key, properties, 0, "");
              null !== fiber.memoizedProps && addObjectToProperties(fiber.memoizedProps, properties, 0, "");
              null == debugTask && (debugTask = fiber._debugTask);
              fiber = {
                start: startTime,
                end: endTime,
                detail: {
                  devtools: {
                    color: "error",
                    track: "Components \u269B",
                    tooltipText: 13 === fiber.tag ? "Hydration failed" : "Error boundary caught an error",
                    properties
                  }
                }
              };
              name = "\u200B" + name;
              debugTask ? debugTask.run(performance.measure.bind(performance, name, fiber)) : performance.measure(name, fiber);
              performance.clearMeasures(name);
            }
          }
        }
        function logComponentEffect(fiber, startTime, endTime, selfTime, errors) {
          if (null !== errors) {
            if (supportsUserTiming) {
              var name = getComponentNameFromFiber(fiber);
              if (null !== name) {
                selfTime = [];
                for (var i = 0; i < errors.length; i++) {
                  var error = errors[i].value;
                  selfTime.push([
                    "Error",
                    "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
                  ]);
                }
                null !== fiber.key && addValueToProperties("key", fiber.key, selfTime, 0, "");
                null !== fiber.memoizedProps && addObjectToProperties(fiber.memoizedProps, selfTime, 0, "");
                startTime = {
                  start: startTime,
                  end: endTime,
                  detail: {
                    devtools: {
                      color: "error",
                      track: "Components \u269B",
                      tooltipText: "A lifecycle or effect errored",
                      properties: selfTime
                    }
                  }
                };
                fiber = fiber._debugTask;
                endTime = "\u200B" + name;
                fiber ? fiber.run(
                  performance.measure.bind(performance, endTime, startTime)
                ) : performance.measure(endTime, startTime);
                performance.clearMeasures(endTime);
              }
            }
          } else
            name = getComponentNameFromFiber(fiber), null !== name && supportsUserTiming && (errors = 1 > selfTime ? "secondary-light" : 100 > selfTime ? "secondary" : 500 > selfTime ? "secondary-dark" : "error", (fiber = fiber._debugTask) ? fiber.run(
              console.timeStamp.bind(
                console,
                name,
                startTime,
                endTime,
                "Components \u269B",
                void 0,
                errors
              )
            ) : console.timeStamp(
              name,
              startTime,
              endTime,
              "Components \u269B",
              void 0,
              errors
            ));
        }
        function logSuspendedRenderPhase(startTime, endTime, lanes, debugTask) {
          !supportsUserTiming || endTime <= startTime || (lanes = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              "Prewarm",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              lanes
            )
          ) : console.timeStamp(
            "Prewarm",
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            lanes
          ));
        }
        function logSuspendedWithDelayPhase(startTime, endTime, lanes, debugTask) {
          !supportsUserTiming || endTime <= startTime || (lanes = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              "Suspended",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              lanes
            )
          ) : console.timeStamp(
            "Suspended",
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            lanes
          ));
        }
        function logErroredRenderPhase(startTime, endTime, lanes, debugTask) {
          !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              "Errored",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              "error"
            )
          ) : console.timeStamp(
            "Errored",
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            "error"
          ));
        }
        function logSuspendedCommitPhase(startTime, endTime, reason, debugTask) {
          !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              reason,
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              "secondary-light"
            )
          ) : console.timeStamp(
            reason,
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            "secondary-light"
          ));
        }
        function logCommitErrored(startTime, endTime, errors, passive, debugTask) {
          if (supportsUserTiming && !(endTime <= startTime)) {
            for (var properties = [], i = 0; i < errors.length; i++) {
              var error = errors[i].value;
              properties.push([
                "Error",
                "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
              ]);
            }
            startTime = {
              start: startTime,
              end: endTime,
              detail: {
                devtools: {
                  color: "error",
                  track: currentTrack,
                  trackGroup: "Scheduler \u269B",
                  tooltipText: passive ? "Remaining Effects Errored" : "Commit Errored",
                  properties
                }
              }
            };
            debugTask ? debugTask.run(
              performance.measure.bind(performance, "Errored", startTime)
            ) : performance.measure("Errored", startTime);
            performance.clearMeasures("Errored");
          }
        }
        function logCommitPhase(startTime, endTime, errors, abortedViewTransition, debugTask) {
          null !== errors ? logCommitErrored(startTime, endTime, errors, false, debugTask) : !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              abortedViewTransition ? "Commit Interrupted View Transition" : "Commit",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              abortedViewTransition ? "error" : "secondary-dark"
            )
          ) : console.timeStamp(
            abortedViewTransition ? "Commit Interrupted View Transition" : "Commit",
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            abortedViewTransition ? "error" : "secondary-dark"
          ));
        }
        function logAnimatingPhase(startTime, endTime, debugTask) {
          !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(
            console.timeStamp.bind(
              console,
              "Animating",
              startTime,
              endTime,
              currentTrack,
              "Scheduler \u269B",
              "secondary-dark"
            )
          ) : console.timeStamp(
            "Animating",
            startTime,
            endTime,
            currentTrack,
            "Scheduler \u269B",
            "secondary-dark"
          ));
        }
        function disabledLog() {
        }
        function disableLogs() {
          if (0 === disabledDepth) {
            prevLog = console.log;
            prevInfo = console.info;
            prevWarn = console.warn;
            prevError = console.error;
            prevGroup = console.group;
            prevGroupCollapsed = console.groupCollapsed;
            prevGroupEnd = console.groupEnd;
            var props = {
              configurable: true,
              enumerable: true,
              value: disabledLog,
              writable: true
            };
            Object.defineProperties(console, {
              info: props,
              log: props,
              warn: props,
              error: props,
              group: props,
              groupCollapsed: props,
              groupEnd: props
            });
          }
          disabledDepth++;
        }
        function reenableLogs() {
          disabledDepth--;
          if (0 === disabledDepth) {
            var props = { configurable: true, enumerable: true, writable: true };
            Object.defineProperties(console, {
              log: assign({}, props, { value: prevLog }),
              info: assign({}, props, { value: prevInfo }),
              warn: assign({}, props, { value: prevWarn }),
              error: assign({}, props, { value: prevError }),
              group: assign({}, props, { value: prevGroup }),
              groupCollapsed: assign({}, props, { value: prevGroupCollapsed }),
              groupEnd: assign({}, props, { value: prevGroupEnd })
            });
          }
          0 > disabledDepth && console.error(
            "disabledDepth fell below zero. This is a bug in React. Please file an issue."
          );
        }
        function formatOwnerStack(error) {
          var prevPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          error = error.stack;
          Error.prepareStackTrace = prevPrepareStackTrace;
          error.startsWith("Error: react-stack-top-frame\n") && (error = error.slice(29));
          prevPrepareStackTrace = error.indexOf("\n");
          -1 !== prevPrepareStackTrace && (error = error.slice(prevPrepareStackTrace + 1));
          prevPrepareStackTrace = error.indexOf("react_stack_bottom_frame");
          -1 !== prevPrepareStackTrace && (prevPrepareStackTrace = error.lastIndexOf(
            "\n",
            prevPrepareStackTrace
          ));
          if (-1 !== prevPrepareStackTrace)
            error = error.slice(0, prevPrepareStackTrace);
          else return "";
          return error;
        }
        function describeBuiltInComponentFrame(name) {
          if (void 0 === prefix)
            try {
              throw Error();
            } catch (x) {
              var match = x.stack.trim().match(/\n( *(at )?)/);
              prefix = match && match[1] || "";
              suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
            }
          return "\n" + prefix + name + suffix;
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) return "";
          var frame = componentFrameCache.get(fn);
          if (void 0 !== frame) return frame;
          reentry = true;
          frame = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher = null;
          previousDispatcher = ReactSharedInternals.H;
          ReactSharedInternals.H = null;
          disableLogs();
          try {
            var RunInRootFrame = {
              DetermineComponentFrameRoot: function() {
                try {
                  if (construct) {
                    var Fake = function() {
                      throw Error();
                    };
                    Object.defineProperty(Fake.prototype, "props", {
                      set: function() {
                        throw Error();
                      }
                    });
                    if ("object" === typeof Reflect && Reflect.construct) {
                      try {
                        Reflect.construct(Fake, []);
                      } catch (x) {
                        var control = x;
                      }
                      Reflect.construct(fn, [], Fake);
                    } else {
                      try {
                        Fake.call();
                      } catch (x$0) {
                        control = x$0;
                      }
                      Fake = false;
                      try {
                        var prevProps = Object.getOwnPropertyDescriptor(
                          fn.prototype,
                          "props"
                        );
                        Object.defineProperty(fn.prototype, "props", {
                          configurable: true,
                          set: function() {
                            throw Error();
                          }
                        });
                        Fake = true;
                        new fn();
                      } finally {
                        Fake && (void 0 !== prevProps ? Object.defineProperty(
                          fn.prototype,
                          "props",
                          prevProps
                        ) : delete fn.prototype.props);
                      }
                    }
                  } else {
                    try {
                      throw Error();
                    } catch (x$1) {
                      control = x$1;
                    }
                    (Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {
                    });
                  }
                } catch (sample) {
                  if (sample && control && "string" === typeof sample.stack)
                    return [sample.stack, control.stack];
                }
                return [null, null];
              }
            };
            RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var namePropDescriptor = Object.getOwnPropertyDescriptor(
              RunInRootFrame.DetermineComponentFrameRoot,
              "name"
            );
            namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(
              RunInRootFrame.DetermineComponentFrameRoot,
              "name",
              { value: "DetermineComponentFrameRoot" }
            );
            var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
            if (sampleStack && controlStack) {
              var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
              for (_RunInRootFrame$Deter = namePropDescriptor = 0; namePropDescriptor < sampleLines.length && !sampleLines[namePropDescriptor].includes(
                "DetermineComponentFrameRoot"
              ); )
                namePropDescriptor++;
              for (; _RunInRootFrame$Deter < controlLines.length && !controlLines[_RunInRootFrame$Deter].includes(
                "DetermineComponentFrameRoot"
              ); )
                _RunInRootFrame$Deter++;
              if (namePropDescriptor === sampleLines.length || _RunInRootFrame$Deter === controlLines.length)
                for (namePropDescriptor = sampleLines.length - 1, _RunInRootFrame$Deter = controlLines.length - 1; 1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter && sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]; )
                  _RunInRootFrame$Deter--;
              for (; 1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter; namePropDescriptor--, _RunInRootFrame$Deter--)
                if (sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]) {
                  if (1 !== namePropDescriptor || 1 !== _RunInRootFrame$Deter) {
                    do
                      if (namePropDescriptor--, _RunInRootFrame$Deter--, 0 > _RunInRootFrame$Deter || sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]) {
                        var _frame = "\n" + sampleLines[namePropDescriptor].replace(
                          " at new ",
                          " at "
                        );
                        fn.displayName && _frame.includes("<anonymous>") && (_frame = _frame.replace("<anonymous>", fn.displayName));
                        "function" === typeof fn && componentFrameCache.set(fn, _frame);
                        return _frame;
                      }
                    while (1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter);
                  }
                  break;
                }
            }
          } finally {
            reentry = false, ReactSharedInternals.H = previousDispatcher, reenableLogs(), Error.prepareStackTrace = frame;
          }
          sampleLines = (sampleLines = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(sampleLines) : "";
          "function" === typeof fn && componentFrameCache.set(fn, sampleLines);
          return sampleLines;
        }
        function describeFiber(fiber, childFiber) {
          switch (fiber.tag) {
            case 26:
            case 27:
            case 5:
              return describeBuiltInComponentFrame(fiber.type);
            case 16:
              return describeBuiltInComponentFrame("Lazy");
            case 13:
              return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
            case 19:
              return describeBuiltInComponentFrame("SuspenseList");
            case 0:
            case 15:
              return describeNativeComponentFrame(fiber.type, false);
            case 11:
              return describeNativeComponentFrame(fiber.type.render, false);
            case 1:
              return describeNativeComponentFrame(fiber.type, true);
            case 31:
              return describeBuiltInComponentFrame("Activity");
            case 30:
              return describeBuiltInComponentFrame("ViewTransition");
            default:
              return "";
          }
        }
        function getStackByFiberInDevAndProd(workInProgress2) {
          try {
            var info = "", previous = null;
            do {
              info += describeFiber(workInProgress2, previous);
              var debugInfo = workInProgress2._debugInfo;
              if (debugInfo)
                for (var i = debugInfo.length - 1; 0 <= i; i--) {
                  var entry = debugInfo[i];
                  if ("string" === typeof entry.name) {
                    var JSCompiler_temp_const = info;
                    a: {
                      var name = entry.name, env = entry.env, location = entry.debugLocation;
                      if (null != location) {
                        var childStack = formatOwnerStack(location), idx = childStack.lastIndexOf("\n"), lastLine = -1 === idx ? childStack : childStack.slice(idx + 1);
                        if (-1 !== lastLine.indexOf(name)) {
                          var JSCompiler_inline_result = "\n" + lastLine;
                          break a;
                        }
                      }
                      JSCompiler_inline_result = describeBuiltInComponentFrame(
                        name + (env ? " [" + env + "]" : "")
                      );
                    }
                    info = JSCompiler_temp_const + JSCompiler_inline_result;
                  }
                }
              previous = workInProgress2;
              workInProgress2 = workInProgress2.return;
            } while (workInProgress2);
            return info;
          } catch (x) {
            return "\nError generating stack: " + x.message + "\n" + x.stack;
          }
        }
        function describeFunctionComponentFrameWithoutLineNumber(fn) {
          return (fn = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(fn) : "";
        }
        function createCapturedValueAtFiber(value, source) {
          if ("object" === typeof value && null !== value) {
            var existing = CapturedStacks.get(value);
            if (void 0 !== existing) return existing;
            source = {
              value,
              source,
              stack: getStackByFiberInDevAndProd(source)
            };
            CapturedStacks.set(value, source);
            return source;
          }
          return {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          };
        }
        function pushTreeFork(workInProgress2, totalChildren) {
          warnIfNotHydrating();
          forkStack[forkStackIndex++] = treeForkCount;
          forkStack[forkStackIndex++] = treeForkProvider;
          treeForkProvider = workInProgress2;
          treeForkCount = totalChildren;
        }
        function pushTreeId(workInProgress2, totalChildren, index) {
          warnIfNotHydrating();
          idStack[idStackIndex++] = treeContextId;
          idStack[idStackIndex++] = treeContextOverflow;
          idStack[idStackIndex++] = treeContextProvider;
          treeContextProvider = workInProgress2;
          var baseIdWithLeadingBit = treeContextId;
          workInProgress2 = treeContextOverflow;
          var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
          baseIdWithLeadingBit &= ~(1 << baseLength);
          index += 1;
          var length = 32 - clz32(totalChildren) + baseLength;
          if (30 < length) {
            var numberOfOverflowBits = baseLength - baseLength % 5;
            length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
            baseIdWithLeadingBit >>= numberOfOverflowBits;
            baseLength -= numberOfOverflowBits;
            treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit;
            treeContextOverflow = length + workInProgress2;
          } else
            treeContextId = 1 << length | index << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
        }
        function pushMaterializedTreeId(workInProgress2) {
          warnIfNotHydrating();
          null !== workInProgress2.return && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
        }
        function popTreeContext(workInProgress2) {
          for (; workInProgress2 === treeForkProvider; )
            treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
          for (; workInProgress2 === treeContextProvider; )
            treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
        }
        function getSuspendedTreeContext() {
          warnIfNotHydrating();
          return null !== treeContextProvider ? { id: treeContextId, overflow: treeContextOverflow } : null;
        }
        function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
          warnIfNotHydrating();
          idStack[idStackIndex++] = treeContextId;
          idStack[idStackIndex++] = treeContextOverflow;
          idStack[idStackIndex++] = treeContextProvider;
          treeContextId = suspendedContext.id;
          treeContextOverflow = suspendedContext.overflow;
          treeContextProvider = workInProgress2;
        }
        function warnIfNotHydrating() {
          isHydrating || console.error(
            "Expected to be hydrating. This is a bug in React. Please file an issue."
          );
        }
        function requiredContext(c) {
          null === c && console.error(
            "Expected host context to exist. This error is likely caused by a bug in React. Please file an issue."
          );
          return c;
        }
        function pushHostContainer(fiber, nextRootInstance) {
          push(rootInstanceStackCursor, nextRootInstance, fiber);
          push(contextFiberStackCursor, fiber, fiber);
          push(contextStackCursor, null, fiber);
          nextRootInstance = getRootHostContext(nextRootInstance);
          pop(contextStackCursor, fiber);
          push(contextStackCursor, nextRootInstance, fiber);
        }
        function popHostContainer(fiber) {
          pop(contextStackCursor, fiber);
          pop(contextFiberStackCursor, fiber);
          pop(rootInstanceStackCursor, fiber);
        }
        function getHostContext() {
          return requiredContext(contextStackCursor.current);
        }
        function pushHostContext(fiber) {
          var stateHook = fiber.memoizedState;
          null !== stateHook && (stateHook = stateHook.memoizedState, isPrimaryRenderer ? HostTransitionContext._currentValue = stateHook : HostTransitionContext._currentValue2 = stateHook, push(hostTransitionProviderCursor, fiber, fiber));
          stateHook = requiredContext(contextStackCursor.current);
          var nextContext = getChildHostContext(stateHook, fiber.type);
          stateHook !== nextContext && (push(contextFiberStackCursor, fiber, fiber), push(contextStackCursor, nextContext, fiber));
        }
        function popHostContext(fiber) {
          contextFiberStackCursor.current === fiber && (pop(contextStackCursor, fiber), pop(contextFiberStackCursor, fiber));
          hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor, fiber), isPrimaryRenderer ? HostTransitionContext._currentValue = NotPendingTransition : HostTransitionContext._currentValue2 = NotPendingTransition);
        }
        function findNotableNode(node, indent) {
          return void 0 === node.serverProps && 0 === node.serverTail.length && 1 === node.children.length && 3 < node.distanceFromLeaf && node.distanceFromLeaf > 15 - indent ? findNotableNode(node.children[0], indent) : node;
        }
        function indentation(indent) {
          return "  " + "  ".repeat(indent);
        }
        function added(indent) {
          return "+ " + "  ".repeat(indent);
        }
        function removed(indent) {
          return "- " + "  ".repeat(indent);
        }
        function describeFiberType(fiber) {
          switch (fiber.tag) {
            case 26:
            case 27:
            case 5:
              return fiber.type;
            case 16:
              return "Lazy";
            case 31:
              return "Activity";
            case 13:
              return "Suspense";
            case 19:
              return "SuspenseList";
            case 0:
            case 15:
              return fiber = fiber.type, fiber.displayName || fiber.name || null;
            case 11:
              return fiber = fiber.type.render, fiber.displayName || fiber.name || null;
            case 1:
              return fiber = fiber.type, fiber.displayName || fiber.name || null;
            default:
              return null;
          }
        }
        function describeTextNode(content, maxLength) {
          return needsEscaping.test(content) ? (content = JSON.stringify(content), content.length > maxLength - 2 ? 8 > maxLength ? '{"..."}' : "{" + content.slice(0, maxLength - 7) + '..."}' : "{" + content + "}") : content.length > maxLength ? 5 > maxLength ? '{"..."}' : content.slice(0, maxLength - 3) + "..." : content;
        }
        function describeTextDiff(clientText, serverProps, indent) {
          var maxLength = 120 - 2 * indent;
          if (null === serverProps)
            return added(indent) + describeTextNode(clientText, maxLength) + "\n";
          if ("string" === typeof serverProps) {
            for (var firstDiff = 0; firstDiff < serverProps.length && firstDiff < clientText.length && serverProps.charCodeAt(firstDiff) === clientText.charCodeAt(firstDiff); firstDiff++) ;
            firstDiff > maxLength - 8 && 10 < firstDiff && (clientText = "..." + clientText.slice(firstDiff - 8), serverProps = "..." + serverProps.slice(firstDiff - 8));
            return added(indent) + describeTextNode(clientText, maxLength) + "\n" + removed(indent) + describeTextNode(serverProps, maxLength) + "\n";
          }
          return indentation(indent) + describeTextNode(clientText, maxLength) + "\n";
        }
        function objectName(object) {
          return Object.prototype.toString.call(object).replace(/^\[object (.*)\]$/, function(m, p0) {
            return p0;
          });
        }
        function describeValue(value, maxLength) {
          switch (typeof value) {
            case "string":
              return value = JSON.stringify(value), value.length > maxLength ? 5 > maxLength ? '"..."' : value.slice(0, maxLength - 4) + '..."' : value;
            case "object":
              if (null === value) return "null";
              if (isArrayImpl(value)) return "[...]";
              if (value.$$typeof === REACT_ELEMENT_TYPE)
                return (maxLength = getComponentNameFromType(value.type)) ? "<" + maxLength + ">" : "<...>";
              var name = objectName(value);
              if ("Object" === name) {
                name = "";
                maxLength -= 2;
                for (var propName in value)
                  if (value.hasOwnProperty(propName)) {
                    var jsonPropName = JSON.stringify(propName);
                    jsonPropName !== '"' + propName + '"' && (propName = jsonPropName);
                    maxLength -= propName.length - 2;
                    jsonPropName = describeValue(
                      value[propName],
                      15 > maxLength ? maxLength : 15
                    );
                    maxLength -= jsonPropName.length;
                    if (0 > maxLength) {
                      name += "" === name ? "..." : ", ...";
                      break;
                    }
                    name += ("" === name ? "" : ",") + propName + ":" + jsonPropName;
                  }
                return "{" + name + "}";
              }
              return name;
            case "function":
              return (maxLength = value.displayName || value.name) ? "function " + maxLength : "function";
            default:
              return String(value);
          }
        }
        function describePropValue(value, maxLength) {
          return "string" !== typeof value || needsEscaping.test(value) ? "{" + describeValue(value, maxLength - 2) + "}" : value.length > maxLength - 2 ? 5 > maxLength ? '"..."' : '"' + value.slice(0, maxLength - 5) + '..."' : '"' + value + '"';
        }
        function describeExpandedElement(type, props, rowPrefix) {
          var remainingRowLength = 120 - rowPrefix.length - type.length, properties = [], propName;
          for (propName in props)
            if (props.hasOwnProperty(propName) && "children" !== propName) {
              var propValue = describePropValue(
                props[propName],
                120 - rowPrefix.length - propName.length - 1
              );
              remainingRowLength -= propName.length + propValue.length + 2;
              properties.push(propName + "=" + propValue);
            }
          return 0 === properties.length ? rowPrefix + "<" + type + ">\n" : 0 < remainingRowLength ? rowPrefix + "<" + type + " " + properties.join(" ") + ">\n" : rowPrefix + "<" + type + "\n" + rowPrefix + "  " + properties.join("\n" + rowPrefix + "  ") + "\n" + rowPrefix + ">\n";
        }
        function describePropertiesDiff(clientObject, serverObject, indent) {
          var properties = "", remainingServerProperties = assign({}, serverObject), propName;
          for (propName in clientObject)
            if (clientObject.hasOwnProperty(propName)) {
              delete remainingServerProperties[propName];
              var maxLength = 120 - 2 * indent - propName.length - 2, clientPropValue = describeValue(clientObject[propName], maxLength);
              serverObject.hasOwnProperty(propName) ? (maxLength = describeValue(serverObject[propName], maxLength), properties += added(indent) + propName + ": " + clientPropValue + "\n", properties += removed(indent) + propName + ": " + maxLength + "\n") : properties += added(indent) + propName + ": " + clientPropValue + "\n";
            }
          for (var _propName in remainingServerProperties)
            remainingServerProperties.hasOwnProperty(_propName) && (clientObject = describeValue(
              remainingServerProperties[_propName],
              120 - 2 * indent - _propName.length - 2
            ), properties += removed(indent) + _propName + ": " + clientObject + "\n");
          return properties;
        }
        function describeElementDiff(type, clientProps, serverProps, indent) {
          var content = "", serverPropNames = /* @__PURE__ */ new Map();
          for (propName$jscomp$0 in serverProps)
            serverProps.hasOwnProperty(propName$jscomp$0) && serverPropNames.set(
              propName$jscomp$0.toLowerCase(),
              propName$jscomp$0
            );
          if (1 === serverPropNames.size && serverPropNames.has("children"))
            content += describeExpandedElement(
              type,
              clientProps,
              indentation(indent)
            );
          else {
            for (var _propName2 in clientProps)
              if (clientProps.hasOwnProperty(_propName2) && "children" !== _propName2) {
                var maxLength$jscomp$0 = 120 - 2 * (indent + 1) - _propName2.length - 1, serverPropName = serverPropNames.get(_propName2.toLowerCase());
                if (void 0 !== serverPropName) {
                  serverPropNames.delete(_propName2.toLowerCase());
                  var propName$jscomp$0 = clientProps[_propName2];
                  serverPropName = serverProps[serverPropName];
                  var clientPropValue = describePropValue(
                    propName$jscomp$0,
                    maxLength$jscomp$0
                  );
                  maxLength$jscomp$0 = describePropValue(
                    serverPropName,
                    maxLength$jscomp$0
                  );
                  "object" === typeof propName$jscomp$0 && null !== propName$jscomp$0 && "object" === typeof serverPropName && null !== serverPropName && "Object" === objectName(propName$jscomp$0) && "Object" === objectName(serverPropName) && (2 < Object.keys(propName$jscomp$0).length || 2 < Object.keys(serverPropName).length || -1 < clientPropValue.indexOf("...") || -1 < maxLength$jscomp$0.indexOf("...")) ? content += indentation(indent + 1) + _propName2 + "={{\n" + describePropertiesDiff(
                    propName$jscomp$0,
                    serverPropName,
                    indent + 2
                  ) + indentation(indent + 1) + "}}\n" : (content += added(indent + 1) + _propName2 + "=" + clientPropValue + "\n", content += removed(indent + 1) + _propName2 + "=" + maxLength$jscomp$0 + "\n");
                } else
                  content += indentation(indent + 1) + _propName2 + "=" + describePropValue(clientProps[_propName2], maxLength$jscomp$0) + "\n";
              }
            serverPropNames.forEach(function(propName) {
              if ("children" !== propName) {
                var maxLength = 120 - 2 * (indent + 1) - propName.length - 1;
                content += removed(indent + 1) + propName + "=" + describePropValue(serverProps[propName], maxLength) + "\n";
              }
            });
            content = "" === content ? indentation(indent) + "<" + type + ">\n" : indentation(indent) + "<" + type + "\n" + content + indentation(indent) + ">\n";
          }
          type = serverProps.children;
          clientProps = clientProps.children;
          if ("string" === typeof type || "number" === typeof type || "bigint" === typeof type) {
            serverPropNames = "";
            if ("string" === typeof clientProps || "number" === typeof clientProps || "bigint" === typeof clientProps)
              serverPropNames = "" + clientProps;
            content += describeTextDiff(serverPropNames, "" + type, indent + 1);
          } else if ("string" === typeof clientProps || "number" === typeof clientProps || "bigint" === typeof clientProps)
            content = null == type ? content + describeTextDiff("" + clientProps, null, indent + 1) : content + describeTextDiff("" + clientProps, void 0, indent + 1);
          return content;
        }
        function describeSiblingFiber(fiber, indent) {
          var type = describeFiberType(fiber);
          if (null === type) {
            type = "";
            for (fiber = fiber.child; fiber; )
              type += describeSiblingFiber(fiber, indent), fiber = fiber.sibling;
            return type;
          }
          return indentation(indent) + "<" + type + ">\n";
        }
        function describeNode(node, indent) {
          var skipToNode = findNotableNode(node, indent);
          if (skipToNode !== node && (1 !== node.children.length || node.children[0] !== skipToNode))
            return indentation(indent) + "...\n" + describeNode(skipToNode, indent + 1);
          skipToNode = "";
          var debugInfo = node.fiber._debugInfo;
          if (debugInfo)
            for (var i = 0; i < debugInfo.length; i++) {
              var serverComponentName = debugInfo[i].name;
              "string" === typeof serverComponentName && (skipToNode += indentation(indent) + "<" + serverComponentName + ">\n", indent++);
            }
          debugInfo = "";
          i = node.fiber.pendingProps;
          if (6 === node.fiber.tag)
            debugInfo = describeTextDiff(i, node.serverProps, indent), indent++;
          else if (serverComponentName = describeFiberType(node.fiber), null !== serverComponentName)
            if (void 0 === node.serverProps) {
              debugInfo = indent;
              var maxLength = 120 - 2 * debugInfo - serverComponentName.length - 2, content = "";
              for (propName in i)
                if (i.hasOwnProperty(propName) && "children" !== propName) {
                  var propValue = describePropValue(i[propName], 15);
                  maxLength -= propName.length + propValue.length + 2;
                  if (0 > maxLength) {
                    content += " ...";
                    break;
                  }
                  content += " " + propName + "=" + propValue;
                }
              debugInfo = indentation(debugInfo) + "<" + serverComponentName + content + ">\n";
              indent++;
            } else
              null === node.serverProps ? (debugInfo = describeExpandedElement(
                serverComponentName,
                i,
                added(indent)
              ), indent++) : "string" === typeof node.serverProps ? console.error(
                "Should not have matched a non HostText fiber to a Text node. This is a bug in React."
              ) : (debugInfo = describeElementDiff(
                serverComponentName,
                i,
                node.serverProps,
                indent
              ), indent++);
          var propName = "";
          i = node.fiber.child;
          for (serverComponentName = 0; i && serverComponentName < node.children.length; )
            maxLength = node.children[serverComponentName], maxLength.fiber === i ? (propName += describeNode(maxLength, indent), serverComponentName++) : propName += describeSiblingFiber(i, indent), i = i.sibling;
          i && 0 < node.children.length && (propName += indentation(indent) + "...\n");
          i = node.serverTail;
          null === node.serverProps && indent--;
          for (node = 0; node < i.length; node++)
            serverComponentName = i[node], propName = "string" === typeof serverComponentName ? propName + (removed(indent) + describeTextNode(serverComponentName, 120 - 2 * indent) + "\n") : propName + describeExpandedElement(
              serverComponentName.type,
              serverComponentName.props,
              removed(indent)
            );
          return skipToNode + debugInfo + propName;
        }
        function describeDiff(rootNode) {
          try {
            return "\n\n" + describeNode(rootNode, 0);
          } catch (x) {
            return "";
          }
        }
        function getCurrentFiberStackInDev() {
          if (null === current) return "";
          var workInProgress2 = current;
          try {
            var info = "";
            6 === workInProgress2.tag && (workInProgress2 = workInProgress2.return);
            switch (workInProgress2.tag) {
              case 26:
              case 27:
              case 5:
                info += describeBuiltInComponentFrame(workInProgress2.type);
                break;
              case 13:
                info += describeBuiltInComponentFrame("Suspense");
                break;
              case 19:
                info += describeBuiltInComponentFrame("SuspenseList");
                break;
              case 31:
                info += describeBuiltInComponentFrame("Activity");
                break;
              case 30:
                info += describeBuiltInComponentFrame("ViewTransition");
                break;
              case 0:
              case 15:
              case 1:
                workInProgress2._debugOwner || "" !== info || (info += describeFunctionComponentFrameWithoutLineNumber(
                  workInProgress2.type
                ));
                break;
              case 11:
                workInProgress2._debugOwner || "" !== info || (info += describeFunctionComponentFrameWithoutLineNumber(
                  workInProgress2.type.render
                ));
            }
            for (; workInProgress2; )
              if ("number" === typeof workInProgress2.tag) {
                var fiber = workInProgress2;
                workInProgress2 = fiber._debugOwner;
                var debugStack = fiber._debugStack;
                if (workInProgress2 && debugStack) {
                  var formattedStack = formatOwnerStack(debugStack);
                  "" !== formattedStack && (info += "\n" + formattedStack);
                }
              } else if (null != workInProgress2.debugStack) {
                var ownerStack = workInProgress2.debugStack;
                (workInProgress2 = workInProgress2.owner) && ownerStack && (info += "\n" + formatOwnerStack(ownerStack));
              } else break;
            var JSCompiler_inline_result = info;
          } catch (x) {
            JSCompiler_inline_result = "\nError generating stack: " + x.message + "\n" + x.stack;
          }
          return JSCompiler_inline_result;
        }
        function runWithFiberInDEV(fiber, callback, arg0, arg1, arg2, arg3, arg4) {
          var previousFiber = current;
          setCurrentFiber(fiber);
          try {
            return null !== fiber && fiber._debugTask ? fiber._debugTask.run(
              callback.bind(null, arg0, arg1, arg2, arg3, arg4)
            ) : callback(arg0, arg1, arg2, arg3, arg4);
          } finally {
            setCurrentFiber(previousFiber);
          }
          throw Error(
            "runWithFiberInDEV should never be called in production. This is a bug in React."
          );
        }
        function setCurrentFiber(fiber) {
          ReactSharedInternals.getCurrentStack = null === fiber ? null : getCurrentFiberStackInDev;
          isRendering = false;
          current = fiber;
        }
        function buildHydrationDiffNode(fiber, distanceFromLeaf) {
          if (null === fiber.return) {
            if (null === hydrationDiffRootDEV)
              hydrationDiffRootDEV = {
                fiber,
                children: [],
                serverProps: void 0,
                serverTail: [],
                distanceFromLeaf
              };
            else {
              if (hydrationDiffRootDEV.fiber !== fiber)
                throw Error(
                  "Saw multiple hydration diff roots in a pass. This is a bug in React."
                );
              hydrationDiffRootDEV.distanceFromLeaf > distanceFromLeaf && (hydrationDiffRootDEV.distanceFromLeaf = distanceFromLeaf);
            }
            return hydrationDiffRootDEV;
          }
          var siblings = buildHydrationDiffNode(
            fiber.return,
            distanceFromLeaf + 1
          ).children;
          if (0 < siblings.length && siblings[siblings.length - 1].fiber === fiber)
            return siblings = siblings[siblings.length - 1], siblings.distanceFromLeaf > distanceFromLeaf && (siblings.distanceFromLeaf = distanceFromLeaf), siblings;
          distanceFromLeaf = {
            fiber,
            children: [],
            serverProps: void 0,
            serverTail: [],
            distanceFromLeaf
          };
          siblings.push(distanceFromLeaf);
          return distanceFromLeaf;
        }
        function warnIfHydrating() {
          isHydrating && console.error(
            "We should not be hydrating here. This is a bug in React. Please file a bug."
          );
        }
        function warnNonHydratedInstance(fiber, rejectedCandidate) {
          didSuspendOrErrorDEV || (fiber = buildHydrationDiffNode(fiber, 0), fiber.serverProps = null, null !== rejectedCandidate && (rejectedCandidate = describeHydratableInstanceForDevWarnings(rejectedCandidate), fiber.serverTail.push(rejectedCandidate)));
        }
        function throwOnHydrationMismatch(fiber) {
          var fromText = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : false, diff = "", diffRoot = hydrationDiffRootDEV;
          null !== diffRoot && (hydrationDiffRootDEV = null, diff = describeDiff(diffRoot));
          queueHydrationError(
            createCapturedValueAtFiber(
              Error(
                "Hydration failed because the server rendered " + (fromText ? "text" : "HTML") + " didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\nhttps://react.dev/link/hydration-mismatch" + diff
              ),
              fiber
            )
          );
          throw HydrationMismatchException;
        }
        function prepareToHydrateHostInstance(fiber, hostContext) {
          if (!supportsHydration)
            throw Error(
              "Expected prepareToHydrateHostInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
            );
          hydrateInstance(
            fiber.stateNode,
            fiber.type,
            fiber.memoizedProps,
            hostContext,
            fiber
          ) || throwOnHydrationMismatch(fiber, true);
        }
        function popToNextHostParent(fiber) {
          for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
            switch (hydrationParentFiber.tag) {
              case 5:
              case 31:
              case 13:
                rootOrSingletonContext = false;
                return;
              case 27:
              case 3:
                rootOrSingletonContext = true;
                return;
              default:
                hydrationParentFiber = hydrationParentFiber.return;
            }
        }
        function popHydrationState(fiber) {
          if (!supportsHydration || fiber !== hydrationParentFiber) return false;
          if (!isHydrating)
            return popToNextHostParent(fiber), isHydrating = true, false;
          var tag = fiber.tag;
          supportsSingletons ? 3 !== tag && 27 !== tag && (5 !== tag || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps)) && nextHydratableInstance && (warnIfUnhydratedTailNodes(fiber), throwOnHydrationMismatch(fiber)) : 3 !== tag && (5 !== tag || shouldDeleteUnhydratedTailInstances(fiber.type) && !shouldSetTextContent(fiber.type, fiber.memoizedProps)) && nextHydratableInstance && (warnIfUnhydratedTailNodes(fiber), throwOnHydrationMismatch(fiber));
          popToNextHostParent(fiber);
          if (13 === tag) {
            if (!supportsHydration)
              throw Error(
                "Expected skipPastDehydratedSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
              );
            fiber = fiber.memoizedState;
            fiber = null !== fiber ? fiber.dehydrated : null;
            if (!fiber)
              throw Error(
                "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
              );
            nextHydratableInstance = getNextHydratableInstanceAfterSuspenseInstance(fiber);
          } else if (31 === tag) {
            fiber = fiber.memoizedState;
            fiber = null !== fiber ? fiber.dehydrated : null;
            if (!fiber)
              throw Error(
                "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
              );
            nextHydratableInstance = getNextHydratableInstanceAfterActivityInstance(fiber);
          } else
            nextHydratableInstance = supportsSingletons && 27 === tag ? getNextHydratableSiblingAfterSingleton(
              fiber.type,
              nextHydratableInstance
            ) : hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
          return true;
        }
        function warnIfUnhydratedTailNodes(fiber) {
          for (var nextInstance = nextHydratableInstance; nextInstance; ) {
            var diffNode = buildHydrationDiffNode(fiber, 0), description = describeHydratableInstanceForDevWarnings(nextInstance);
            diffNode.serverTail.push(description);
            nextInstance = "Suspense" === description.type ? getNextHydratableInstanceAfterSuspenseInstance(nextInstance) : getNextHydratableSibling(nextInstance);
          }
        }
        function resetHydrationState() {
          supportsHydration && (nextHydratableInstance = hydrationParentFiber = null, didSuspendOrErrorDEV = isHydrating = false);
        }
        function upgradeHydrationErrorsToRecoverable() {
          var queuedErrors = hydrationErrors;
          null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(
            workInProgressRootRecoverableErrors,
            queuedErrors
          ), hydrationErrors = null);
          return queuedErrors;
        }
        function queueHydrationError(error) {
          null === hydrationErrors ? hydrationErrors = [error] : hydrationErrors.push(error);
        }
        function emitPendingHydrationWarnings() {
          var diffRoot = hydrationDiffRootDEV;
          if (null !== diffRoot) {
            hydrationDiffRootDEV = null;
            for (var diff = describeDiff(diffRoot); 0 < diffRoot.children.length; )
              diffRoot = diffRoot.children[0];
            runWithFiberInDEV(diffRoot.fiber, function() {
              console.error(
                "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\n%s%s",
                "https://react.dev/link/hydration-mismatch",
                diff
              );
            });
          }
        }
        function resetContextDependencies() {
          lastContextDependency = currentlyRenderingFiber$1 = null;
          isDisallowedContextReadInDEV = false;
        }
        function pushProvider(providerFiber, context, nextValue) {
          isPrimaryRenderer ? (push(valueCursor, context._currentValue, providerFiber), context._currentValue = nextValue, push(rendererCursorDEV, context._currentRenderer, providerFiber), void 0 !== context._currentRenderer && null !== context._currentRenderer && context._currentRenderer !== rendererSigil && console.error(
            "Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
          ), context._currentRenderer = rendererSigil) : (push(valueCursor, context._currentValue2, providerFiber), context._currentValue2 = nextValue, push(renderer2CursorDEV, context._currentRenderer2, providerFiber), void 0 !== context._currentRenderer2 && null !== context._currentRenderer2 && context._currentRenderer2 !== rendererSigil && console.error(
            "Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."
          ), context._currentRenderer2 = rendererSigil);
        }
        function popProvider(context, providerFiber) {
          var currentValue = valueCursor.current;
          isPrimaryRenderer ? (context._currentValue = currentValue, currentValue = rendererCursorDEV.current, pop(rendererCursorDEV, providerFiber), context._currentRenderer = currentValue) : (context._currentValue2 = currentValue, currentValue = renderer2CursorDEV.current, pop(renderer2CursorDEV, providerFiber), context._currentRenderer2 = currentValue);
          pop(valueCursor, providerFiber);
        }
        function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
          for (; null !== parent; ) {
            var alternate = parent.alternate;
            (parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, null !== alternate && (alternate.childLanes |= renderLanes2)) : null !== alternate && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2);
            if (parent === propagationRoot) break;
            parent = parent.return;
          }
          parent !== propagationRoot && console.error(
            "Expected to find the propagation root when scheduling context work. This error is likely caused by a bug in React. Please file an issue."
          );
        }
        function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
          var fiber = workInProgress2.child;
          null !== fiber && (fiber.return = workInProgress2);
          for (; null !== fiber; ) {
            var list = fiber.dependencies;
            if (null !== list) {
              var nextFiber = fiber.child;
              list = list.firstContext;
              a: for (; null !== list; ) {
                var dependency = list;
                list = fiber;
                for (var i = 0; i < contexts.length; i++)
                  if (dependency.context === contexts[i]) {
                    list.lanes |= renderLanes2;
                    dependency = list.alternate;
                    null !== dependency && (dependency.lanes |= renderLanes2);
                    scheduleContextWorkOnParentPath(
                      list.return,
                      renderLanes2,
                      workInProgress2
                    );
                    forcePropagateEntireTree || (nextFiber = null);
                    break a;
                  }
                list = dependency.next;
              }
            } else if (18 === fiber.tag) {
              nextFiber = fiber.return;
              if (null === nextFiber)
                throw Error(
                  "We just came from a parent so we must have had a parent. This is a bug in React."
                );
              nextFiber.lanes |= renderLanes2;
              list = nextFiber.alternate;
              null !== list && (list.lanes |= renderLanes2);
              scheduleContextWorkOnParentPath(
                nextFiber,
                renderLanes2,
                workInProgress2
              );
              nextFiber = null;
            } else
              13 === fiber.tag && null !== fiber.memoizedState && null === fiber.memoizedState.dehydrated ? (fiber.lanes |= renderLanes2, nextFiber = fiber.alternate, null !== nextFiber && (nextFiber.lanes |= renderLanes2), scheduleContextWorkOnParentPath(
                fiber.return,
                renderLanes2,
                workInProgress2
              ), nextFiber = fiber.child, nextFiber = null !== nextFiber ? nextFiber.sibling : null) : nextFiber = fiber.child;
            if (null !== nextFiber) nextFiber.return = fiber;
            else
              for (nextFiber = fiber; null !== nextFiber; ) {
                if (nextFiber === workInProgress2) {
                  nextFiber = null;
                  break;
                }
                fiber = nextFiber.sibling;
                if (null !== fiber) {
                  fiber.return = nextFiber.return;
                  nextFiber = fiber;
                  break;
                }
                nextFiber = nextFiber.return;
              }
            fiber = nextFiber;
          }
        }
        function propagateParentContextChanges(current2, workInProgress2, renderLanes2, forcePropagateEntireTree) {
          current2 = null;
          for (var parent = workInProgress2, isInsidePropagationBailout = false; null !== parent; ) {
            if (!isInsidePropagationBailout) {
              if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = true;
              else if (0 !== (parent.flags & 262144)) break;
            }
            if (10 === parent.tag) {
              var currentParent = parent.alternate;
              if (null === currentParent)
                throw Error("Should have a current fiber. This is a bug in React.");
              currentParent = currentParent.memoizedProps;
              if (null !== currentParent) {
                var context = parent.type;
                objectIs(parent.pendingProps.value, currentParent.value) || (null !== current2 ? current2.push(context) : current2 = [context]);
              }
            } else if (parent === hostTransitionProviderCursor.current) {
              currentParent = parent.alternate;
              if (null === currentParent)
                throw Error("Should have a current fiber. This is a bug in React.");
              currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current2 ? current2.push(HostTransitionContext) : current2 = [HostTransitionContext]);
            }
            parent = parent.return;
          }
          null !== current2 && propagateContextChanges(
            workInProgress2,
            current2,
            renderLanes2,
            forcePropagateEntireTree
          );
          workInProgress2.flags |= 262144;
          return null !== current2;
        }
        function checkIfContextChanged(currentDependencies) {
          for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies; ) {
            var context = currentDependencies.context;
            if (!objectIs(
              isPrimaryRenderer ? context._currentValue : context._currentValue2,
              currentDependencies.memoizedValue
            ))
              return true;
            currentDependencies = currentDependencies.next;
          }
          return false;
        }
        function prepareToReadContext(workInProgress2) {
          currentlyRenderingFiber$1 = workInProgress2;
          lastContextDependency = null;
          workInProgress2 = workInProgress2.dependencies;
          null !== workInProgress2 && (workInProgress2.firstContext = null);
        }
        function readContext(context) {
          isDisallowedContextReadInDEV && console.error(
            "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
          );
          return readContextForConsumer(currentlyRenderingFiber$1, context);
        }
        function readContextDuringReconciliation(consumer, context) {
          null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
          return readContextForConsumer(consumer, context);
        }
        function readContextForConsumer(consumer, context) {
          var value = isPrimaryRenderer ? context._currentValue : context._currentValue2;
          context = { context, memoizedValue: value, next: null };
          if (null === lastContextDependency) {
            if (null === consumer)
              throw Error(
                "Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo()."
              );
            lastContextDependency = context;
            consumer.dependencies = {
              lanes: 0,
              firstContext: context,
              _debugThenableState: null
            };
            consumer.flags |= 524288;
          } else lastContextDependency = lastContextDependency.next = context;
          return value;
        }
        function createCache() {
          return {
            controller: new AbortControllerLocal(),
            data: /* @__PURE__ */ new Map(),
            refCount: 0
          };
        }
        function retainCache(cache) {
          cache.controller.signal.aborted && console.warn(
            "A cache instance was retained after it was already freed. This likely indicates a bug in React."
          );
          cache.refCount++;
        }
        function releaseCache(cache) {
          cache.refCount--;
          0 > cache.refCount && console.warn(
            "A cache instance was released after it was already freed. This likely indicates a bug in React."
          );
          0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
            cache.controller.abort();
          });
        }
        function queueTransitionTypes(root2, transitionTypes) {
          if (0 !== (root2.pendingLanes & 4194048)) {
            var queued = root2.transitionTypes;
            null === queued && (queued = root2.transitionTypes = []);
            for (root2 = 0; root2 < transitionTypes.length; root2++) {
              var transitionType = transitionTypes[root2];
              -1 === queued.indexOf(transitionType) && queued.push(transitionType);
            }
          }
        }
        function claimQueuedTransitionTypes(root2) {
          var claimed = root2.transitionTypes;
          root2.transitionTypes = null;
          return claimed;
        }
        function startUpdateTimerByLane(lane, method, fiber) {
          if (0 !== (lane & 127))
            0 > blockingUpdateTime && (blockingUpdateTime = now(), blockingUpdateTask = createTask(method), blockingUpdateMethodName = method, null != fiber && (blockingUpdateComponentName = getComponentNameFromFiber(fiber)), isAlreadyRendering() && (componentEffectSpawnedUpdate = true, blockingUpdateType = 1), lane = resolveEventTimeStamp(), method = resolveEventType(), lane !== blockingEventRepeatTime || method !== blockingEventType ? blockingEventRepeatTime = -1.1 : null !== method && (blockingUpdateType = 1), blockingEventTime = lane, blockingEventType = method);
          else if (0 !== (lane & 4194048) && 0 > transitionUpdateTime && (transitionUpdateTime = now(), transitionUpdateTask = createTask(method), transitionUpdateMethodName = method, null != fiber && (transitionUpdateComponentName = getComponentNameFromFiber(fiber)), 0 > transitionStartTime)) {
            lane = resolveEventTimeStamp();
            method = resolveEventType();
            if (lane !== transitionEventRepeatTime || method !== transitionEventType)
              transitionEventRepeatTime = -1.1;
            transitionEventTime = lane;
            transitionEventType = method;
          }
        }
        function startHostActionTimer(fiber) {
          if (0 > blockingUpdateTime) {
            blockingUpdateTime = now();
            blockingUpdateTask = null != fiber._debugTask ? fiber._debugTask : null;
            isAlreadyRendering() && (blockingUpdateType = 1);
            var newEventTime = resolveEventTimeStamp(), newEventType = resolveEventType();
            newEventTime !== blockingEventRepeatTime || newEventType !== blockingEventType ? blockingEventRepeatTime = -1.1 : null !== newEventType && (blockingUpdateType = 1);
            blockingEventTime = newEventTime;
            blockingEventType = newEventType;
          }
          if (0 > transitionUpdateTime && (transitionUpdateTime = now(), transitionUpdateTask = null != fiber._debugTask ? fiber._debugTask : null, 0 > transitionStartTime)) {
            fiber = resolveEventTimeStamp();
            newEventTime = resolveEventType();
            if (fiber !== transitionEventRepeatTime || newEventTime !== transitionEventType)
              transitionEventRepeatTime = -1.1;
            transitionEventTime = fiber;
            transitionEventType = newEventTime;
          }
        }
        function pushNestedEffectDurations() {
          var prevEffectDuration = profilerEffectDuration;
          profilerEffectDuration = 0;
          return prevEffectDuration;
        }
        function popNestedEffectDurations(prevEffectDuration) {
          var elapsedTime = profilerEffectDuration;
          profilerEffectDuration = prevEffectDuration;
          return elapsedTime;
        }
        function bubbleNestedEffectDurations(prevEffectDuration) {
          var elapsedTime = profilerEffectDuration;
          profilerEffectDuration += prevEffectDuration;
          return elapsedTime;
        }
        function resetComponentEffectTimers() {
          componentEffectEndTime = componentEffectStartTime = -1.1;
        }
        function pushComponentEffectStart() {
          var prevEffectStart = componentEffectStartTime;
          componentEffectStartTime = -1.1;
          return prevEffectStart;
        }
        function popComponentEffectStart(prevEffectStart) {
          0 <= prevEffectStart && (componentEffectStartTime = prevEffectStart);
        }
        function pushComponentEffectDuration() {
          var prevEffectDuration = componentEffectDuration;
          componentEffectDuration = -0;
          return prevEffectDuration;
        }
        function popComponentEffectDuration(prevEffectDuration) {
          0 <= prevEffectDuration && (componentEffectDuration = prevEffectDuration);
        }
        function pushComponentEffectErrors() {
          var prevErrors = componentEffectErrors;
          componentEffectErrors = null;
          return prevErrors;
        }
        function pushComponentEffectDidSpawnUpdate() {
          var prev = componentEffectSpawnedUpdate;
          componentEffectSpawnedUpdate = false;
          return prev;
        }
        function startProfilerTimer(fiber) {
          profilerStartTime = now();
          0 > fiber.actualStartTime && (fiber.actualStartTime = profilerStartTime);
        }
        function stopProfilerTimerIfRunningAndRecordDuration(fiber) {
          if (0 <= profilerStartTime) {
            var elapsedTime = now() - profilerStartTime;
            fiber.actualDuration += elapsedTime;
            fiber.selfBaseDuration = elapsedTime;
            profilerStartTime = -1;
          }
        }
        function stopProfilerTimerIfRunningAndRecordIncompleteDuration(fiber) {
          if (0 <= profilerStartTime) {
            var elapsedTime = now() - profilerStartTime;
            fiber.actualDuration += elapsedTime;
            profilerStartTime = -1;
          }
        }
        function recordEffectDuration() {
          if (0 <= profilerStartTime) {
            var endTime = now(), elapsedTime = endTime - profilerStartTime;
            profilerStartTime = -1;
            profilerEffectDuration += elapsedTime;
            componentEffectDuration += elapsedTime;
            componentEffectEndTime = endTime;
          }
        }
        function recordEffectError(errorInfo) {
          null === componentEffectErrors && (componentEffectErrors = []);
          componentEffectErrors.push(errorInfo);
          null === commitErrors && (commitErrors = []);
          commitErrors.push(errorInfo);
        }
        function startEffectTimer() {
          profilerStartTime = now();
          0 > componentEffectStartTime && (componentEffectStartTime = profilerStartTime);
        }
        function transferActualDuration(fiber) {
          for (var child = fiber.child; child; )
            fiber.actualDuration += child.actualDuration, child = child.sibling;
        }
        function noop$1() {
        }
        function ensureRootIsScheduled(root2) {
          root2 !== lastScheduledRoot && null === root2.next && (null === lastScheduledRoot ? firstScheduledRoot = lastScheduledRoot = root2 : lastScheduledRoot = lastScheduledRoot.next = root2);
          mightHavePendingSyncWork = true;
          null !== ReactSharedInternals.actQueue ? didScheduleMicrotask_act || (didScheduleMicrotask_act = true, scheduleImmediateRootScheduleTask()) : didScheduleMicrotask || (didScheduleMicrotask = true, scheduleImmediateRootScheduleTask());
        }
        function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
          if (!isFlushingWork && mightHavePendingSyncWork) {
            isFlushingWork = true;
            do {
              var didPerformSomeWork = false;
              for (var root2 = firstScheduledRoot; null !== root2; ) {
                if (!onlyLegacy)
                  if (0 !== syncTransitionLanes) {
                    var pendingLanes = root2.pendingLanes;
                    if (0 === pendingLanes) var nextLanes = 0;
                    else {
                      var suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
                      nextLanes = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
                      nextLanes &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
                      nextLanes = nextLanes & 201326741 ? nextLanes & 201326741 | 1 : nextLanes ? nextLanes | 2 : 0;
                    }
                    0 !== nextLanes && (didPerformSomeWork = true, performSyncWorkOnRoot(root2, nextLanes));
                  } else
                    nextLanes = workInProgressRootRenderLanes, nextLanes = getNextLanes(
                      root2,
                      root2 === workInProgressRoot ? nextLanes : 0,
                      null !== root2.cancelPendingCommit || root2.timeoutHandle !== noTimeout
                    ), 0 === (nextLanes & 3) || checkIfRootIsPrerendering(root2, nextLanes) || (didPerformSomeWork = true, performSyncWorkOnRoot(root2, nextLanes));
                root2 = root2.next;
              }
            } while (didPerformSomeWork);
            isFlushingWork = false;
          }
        }
        function processRootScheduleInImmediateTask() {
          trackSchedulerEvent();
          processRootScheduleInMicrotask();
        }
        function processRootScheduleInMicrotask() {
          mightHavePendingSyncWork = didScheduleMicrotask_act = didScheduleMicrotask = false;
          var syncTransitionLanes = 0;
          0 !== currentEventTransitionLane && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
          for (var currentTime = now$1(), prev = null, root2 = firstScheduledRoot; null !== root2; ) {
            var next = root2.next, nextLanes = scheduleTaskForRootDuringMicrotask(root2, currentTime);
            if (0 === nextLanes)
              root2.next = null, null === prev ? firstScheduledRoot = next : prev.next = next, null === next && (lastScheduledRoot = prev);
            else if (prev = root2, 0 !== syncTransitionLanes || 0 !== (nextLanes & 3))
              mightHavePendingSyncWork = true;
            root2 = next;
          }
          pendingEffectsStatus !== NO_PENDING_EFFECTS && pendingEffectsStatus !== PENDING_PASSIVE_PHASE || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
          0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
        }
        function scheduleTaskForRootDuringMicrotask(root2, currentTime) {
          for (var suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes, expirationTimes = root2.expirationTimes, lanes = root2.pendingLanes & -62914561; 0 < lanes; ) {
            var index = 31 - clz32(lanes), lane = 1 << index, expirationTime = expirationTimes[index];
            if (-1 === expirationTime) {
              if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
                expirationTimes[index] = computeExpirationTime(lane, currentTime);
            } else expirationTime <= currentTime && (root2.expiredLanes |= lane);
            lanes &= ~lane;
          }
          currentTime = workInProgressRoot;
          suspendedLanes = workInProgressRootRenderLanes;
          suspendedLanes = getNextLanes(
            root2,
            root2 === currentTime ? suspendedLanes : 0,
            null !== root2.cancelPendingCommit || root2.timeoutHandle !== noTimeout
          );
          pingedLanes = root2.callbackNode;
          if (0 === suspendedLanes || root2 === currentTime && (workInProgressSuspendedReason === SuspendedOnData || workInProgressSuspendedReason === SuspendedOnAction) || null !== root2.cancelPendingCommit)
            return null !== pingedLanes && cancelCallback(pingedLanes), root2.callbackNode = null, root2.callbackPriority = 0;
          if (0 === (suspendedLanes & 3) || checkIfRootIsPrerendering(root2, suspendedLanes)) {
            currentTime = suspendedLanes & -suspendedLanes;
            if (currentTime !== root2.callbackPriority || null !== ReactSharedInternals.actQueue && pingedLanes !== fakeActCallbackNode$1)
              cancelCallback(pingedLanes);
            else return currentTime;
            switch (lanesToEventPriority(suspendedLanes)) {
              case 2:
              case 8:
                suspendedLanes = UserBlockingPriority;
                break;
              case 32:
                suspendedLanes = NormalPriority$1;
                break;
              case 268435456:
                suspendedLanes = IdlePriority;
                break;
              default:
                suspendedLanes = NormalPriority$1;
            }
            pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root2);
            null !== ReactSharedInternals.actQueue ? (ReactSharedInternals.actQueue.push(pingedLanes), suspendedLanes = fakeActCallbackNode$1) : suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
            root2.callbackPriority = currentTime;
            root2.callbackNode = suspendedLanes;
            return currentTime;
          }
          null !== pingedLanes && cancelCallback(pingedLanes);
          root2.callbackPriority = 2;
          root2.callbackNode = null;
          return 2;
        }
        function performWorkOnRootViaSchedulerTask(root2, didTimeout) {
          nestedUpdateScheduled = currentUpdateIsNested = false;
          trackSchedulerEvent();
          if (pendingEffectsStatus !== NO_PENDING_EFFECTS && pendingEffectsStatus !== PENDING_PASSIVE_PHASE)
            return root2.callbackNode = null, root2.callbackPriority = 0, null;
          var originalCallbackNode = root2.callbackNode;
          pendingDelayedCommitReason === IMMEDIATE_COMMIT && (pendingDelayedCommitReason = DELAYED_PASSIVE_COMMIT);
          if (flushPendingEffects() && root2.callbackNode !== originalCallbackNode)
            return null;
          var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
          workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
            root2,
            root2 === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0,
            null !== root2.cancelPendingCommit || root2.timeoutHandle !== noTimeout
          );
          if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
          performWorkOnRoot(
            root2,
            workInProgressRootRenderLanes$jscomp$0,
            didTimeout
          );
          scheduleTaskForRootDuringMicrotask(root2, now$1());
          return null != root2.callbackNode && root2.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root2) : null;
        }
        function performSyncWorkOnRoot(root2, lanes) {
          if (flushPendingEffects()) return null;
          currentUpdateIsNested = nestedUpdateScheduled;
          nestedUpdateScheduled = false;
          performWorkOnRoot(root2, lanes, true);
        }
        function cancelCallback(callbackNode) {
          callbackNode !== fakeActCallbackNode$1 && null !== callbackNode && cancelCallback$1(callbackNode);
        }
        function scheduleImmediateRootScheduleTask() {
          null !== ReactSharedInternals.actQueue && ReactSharedInternals.actQueue.push(function() {
            processRootScheduleInMicrotask();
            return null;
          });
          supportsMicrotasks ? scheduleMicrotask(function() {
            (executionContext & (RenderContext | CommitContext)) !== NoContext ? scheduleCallback$3(
              ImmediatePriority,
              processRootScheduleInImmediateTask
            ) : processRootScheduleInMicrotask();
          }) : scheduleCallback$3(
            ImmediatePriority,
            processRootScheduleInImmediateTask
          );
        }
        function requestTransitionLane() {
          if (0 === currentEventTransitionLane) {
            var actionScopeLane = currentEntangledLane;
            0 === actionScopeLane && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, 0 === (nextTransitionUpdateLane & 261888) && (nextTransitionUpdateLane = 256));
            currentEventTransitionLane = actionScopeLane;
          }
          return currentEventTransitionLane;
        }
        function entangleAsyncAction(transition, thenable) {
          if (null === currentEntangledListeners) {
            var entangledListeners = currentEntangledListeners = [];
            currentEntangledPendingCount = 0;
            currentEntangledLane = requestTransitionLane();
            currentEntangledActionThenable = {
              status: "pending",
              value: void 0,
              then: function(resolve) {
                entangledListeners.push(resolve);
              }
            };
          }
          currentEntangledPendingCount++;
          thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
          return thenable;
        }
        function pingEngtangledActionScope() {
          if (0 === --currentEntangledPendingCount && (-1 < transitionUpdateTime || (transitionStartTime = -1.1), entangledTransitionTypes = null, null !== currentEntangledListeners)) {
            null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
            var listeners2 = currentEntangledListeners;
            currentEntangledListeners = null;
            currentEntangledLane = 0;
            currentEntangledActionThenable = null;
            for (var i = 0; i < listeners2.length; i++) (0, listeners2[i])();
          }
        }
        function chainThenableValue(thenable, result) {
          var listeners2 = [], thenableWithOverride = {
            status: "pending",
            value: null,
            reason: null,
            then: function(resolve) {
              listeners2.push(resolve);
            }
          };
          thenable.then(
            function() {
              thenableWithOverride.status = "fulfilled";
              thenableWithOverride.value = result;
              for (var i = 0; i < listeners2.length; i++) (0, listeners2[i])(result);
            },
            function(error) {
              thenableWithOverride.status = "rejected";
              thenableWithOverride.reason = error;
              for (error = 0; error < listeners2.length; error++)
                (0, listeners2[error])(void 0);
            }
          );
          return thenableWithOverride;
        }
        function peekCacheFromPool() {
          var cacheResumedFromPreviousRender = resumedCache.current;
          return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
        }
        function pushTransition(offscreenWorkInProgress, prevCachePool) {
          null === prevCachePool ? push(resumedCache, resumedCache.current, offscreenWorkInProgress) : push(resumedCache, prevCachePool.pool, offscreenWorkInProgress);
        }
        function getSuspendedCache() {
          var cacheFromPool = peekCacheFromPool();
          return null === cacheFromPool ? null : {
            parent: isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2,
            pool: cacheFromPool
          };
        }
        function shallowEqual(objA, objB) {
          if (objectIs(objA, objB)) return true;
          if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB)
            return false;
          var keysA = Object.keys(objA), keysB = Object.keys(objB);
          if (keysA.length !== keysB.length) return false;
          for (keysB = 0; keysB < keysA.length; keysB++) {
            var currentKey = keysA[keysB];
            if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
              return false;
          }
          return true;
        }
        function createThenableState() {
          return { didWarnAboutUncachedPromise: false, thenables: [] };
        }
        function isThenableResolved(thenable) {
          thenable = thenable.status;
          return "fulfilled" === thenable || "rejected" === thenable;
        }
        function trackUsedThenable(thenableState2, thenable, index, fiber) {
          null !== ReactSharedInternals.actQueue && (ReactSharedInternals.didUsePromise = true);
          var trackedThenables = thenableState2.thenables;
          index = trackedThenables[index];
          void 0 === index ? trackedThenables.push(thenable) : index !== thenable && (thenableState2.didWarnAboutUncachedPromise || (thenableState2.didWarnAboutUncachedPromise = true, console.error(
            "A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework."
          )), thenable.then(noop$1, noop$1), thenable = index);
          if (void 0 === thenable._debugInfo) {
            thenableState2 = performance.now();
            trackedThenables = thenable.displayName;
            var ioInfo = {
              name: "string" === typeof trackedThenables ? trackedThenables : "Promise",
              start: thenableState2,
              end: thenableState2,
              value: thenable
            };
            thenable._debugInfo = [{ awaited: ioInfo }];
            "fulfilled" !== thenable.status && "rejected" !== thenable.status && (thenableState2 = function() {
              ioInfo.end = performance.now();
            }, thenable.then(thenableState2, thenableState2));
          }
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              fiber = thenable.reason;
              checkIfUseWrappedInAsyncCatch(fiber);
              if (void 0 === fiber && !("reason" in thenable))
                throw Error(
                  "A rejected Promise was passed to React without a `reason` property. React threw a generic error from where the Promise was used to assist in identifying the problematic Promise. Make sure that instrumented Promises correctly set the `reason` property when setting `status` to `'rejected'`."
                );
              throw fiber;
            default:
              if ("string" === typeof thenable.status)
                thenable.then(noop$1, noop$1);
              else {
                thenableState2 = workInProgressRoot;
                if (null !== thenableState2 && 100 < thenableState2.shellSuspendCounter)
                  throw Error(
                    "An unknown Component is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
                  );
                thenableState2 = thenable;
                thenableState2.status = "pending";
                thenableState2.then(
                  function(fulfilledValue) {
                    if ("pending" === thenable.status) {
                      var fulfilledThenable = thenable;
                      fulfilledThenable.status = "fulfilled";
                      fulfilledThenable.value = fulfilledValue;
                    }
                  },
                  function(error) {
                    if ("pending" === thenable.status) {
                      var rejectedThenable = thenable;
                      rejectedThenable.status = "rejected";
                      rejectedThenable.reason = error;
                    }
                  }
                );
              }
              switch (thenable.status) {
                case "fulfilled":
                  return thenable.value;
                case "rejected":
                  throw fiber = thenable.reason, checkIfUseWrappedInAsyncCatch(fiber), fiber;
              }
              suspendedThenable = thenable;
              needsToResetSuspendedThenableDEV = true;
              didIssueUseWarning || null === fiber || null !== fiber.alternate || (lastSuspendedFiber = fiber, lastSuspendedStack = Error(
                "This library called use() to suspend in a previous render but did not call use() when it finished. This indicates an incorrect use of use(). Learn more: https://react.dev/warnings/conditional-use-of-use"
              ));
              throw SuspenseException;
          }
        }
        function resolveLazy(lazyType) {
          try {
            return callLazyInitInDEV(lazyType);
          } catch (x) {
            if (null !== x && "object" === typeof x && "function" === typeof x.then)
              throw suspendedThenable = x, needsToResetSuspendedThenableDEV = true, SuspenseException;
            throw x;
          }
        }
        function getSuspendedThenable() {
          if (null === suspendedThenable)
            throw Error(
              "Expected a suspended thenable. This is a bug in React. Please file an issue."
            );
          var thenable = suspendedThenable;
          suspendedThenable = null;
          needsToResetSuspendedThenableDEV = false;
          return thenable;
        }
        function checkIfUseWrappedInAsyncCatch(rejectedReason) {
          if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
            throw Error(
              "Hooks are not supported inside an async component. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
            );
        }
        function areSameKeyPath(a, b) {
          return a === b ? true : a.tag !== b.tag || a.type !== b.type || a.key !== b.key || a.index !== b.index || 3 === a.tag && a.stateNode !== b.stateNode || null === a.return || null === b.return ? false : areSameKeyPath(a.return, b.return);
        }
        function pushDebugInfo(debugInfo) {
          var previousDebugInfo = currentDebugInfo;
          null != debugInfo && (currentDebugInfo = null === previousDebugInfo ? debugInfo : previousDebugInfo.concat(debugInfo));
          return previousDebugInfo;
        }
        function getCurrentDebugTask() {
          var debugInfo = currentDebugInfo;
          if (null != debugInfo) {
            for (var i = debugInfo.length - 1; 0 <= i; i--)
              if (null != debugInfo[i].name) {
                var debugTask = debugInfo[i].debugTask;
                if (null != debugTask) return debugTask;
              }
          }
          return null;
        }
        function validateFragmentProps(element, fiber, returnFiber) {
          for (var keys = Object.keys(element.props), i = 0; i < keys.length; i++) {
            var key = keys[i];
            if ("children" !== key && "key" !== key && "ref" !== key) {
              null === fiber && (fiber = createFiberFromElement(element, returnFiber.mode, 0), fiber._debugInfo = currentDebugInfo, fiber.return = returnFiber);
              runWithFiberInDEV(
                fiber,
                function(erroredKey) {
                  console.error(
                    "Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key`, `ref`, and `children` props.",
                    erroredKey
                  );
                },
                key
              );
              break;
            }
          }
        }
        function unwrapThenable(thenable) {
          var index = thenableIndexCounter$1;
          thenableIndexCounter$1 += 1;
          null === thenableState$1 && (thenableState$1 = createThenableState());
          return trackUsedThenable(thenableState$1, thenable, index, null);
        }
        function coerceRef(workInProgress2, element) {
          element = element.props.ref;
          workInProgress2.ref = void 0 !== element ? element : null;
        }
        function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
          if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
            throw Error(
              'A React Element from an older version of React was rendered. This is not supported. It can happen if:\n- Multiple copies of the "react" package is used.\n- A library pre-bundled an old copy of "react" or "react/jsx-runtime".\n- A compiler tries to "inline" JSX instead of using the runtime.'
            );
          returnFiber = Object.prototype.toString.call(newChild);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === returnFiber ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        function throwOnInvalidObjectType(returnFiber, newChild) {
          var debugTask = getCurrentDebugTask();
          null !== debugTask ? debugTask.run(
            throwOnInvalidObjectTypeImpl.bind(null, returnFiber, newChild)
          ) : throwOnInvalidObjectTypeImpl(returnFiber, newChild);
        }
        function warnOnFunctionTypeImpl(returnFiber, invalidChild) {
          var parentName = getComponentNameFromFiber(returnFiber) || "Component";
          ownerHasFunctionTypeWarning[parentName] || (ownerHasFunctionTypeWarning[parentName] = true, invalidChild = invalidChild.displayName || invalidChild.name || "Component", 3 === returnFiber.tag ? console.error(
            "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  root.render(%s)",
            invalidChild,
            invalidChild,
            invalidChild
          ) : console.error(
            "Functions are not valid as a React child. This may happen if you return %s instead of <%s /> from render. Or maybe you meant to call this function rather than return it.\n  <%s>{%s}</%s>",
            invalidChild,
            invalidChild,
            parentName,
            invalidChild,
            parentName
          ));
        }
        function warnOnFunctionType(returnFiber, invalidChild) {
          var debugTask = getCurrentDebugTask();
          null !== debugTask ? debugTask.run(
            warnOnFunctionTypeImpl.bind(null, returnFiber, invalidChild)
          ) : warnOnFunctionTypeImpl(returnFiber, invalidChild);
        }
        function warnOnSymbolTypeImpl(returnFiber, invalidChild) {
          var parentName = getComponentNameFromFiber(returnFiber) || "Component";
          ownerHasSymbolTypeWarning[parentName] || (ownerHasSymbolTypeWarning[parentName] = true, invalidChild = String(invalidChild), 3 === returnFiber.tag ? console.error(
            "Symbols are not valid as a React child.\n  root.render(%s)",
            invalidChild
          ) : console.error(
            "Symbols are not valid as a React child.\n  <%s>%s</%s>",
            parentName,
            invalidChild,
            parentName
          ));
        }
        function warnOnSymbolType(returnFiber, invalidChild) {
          var debugTask = getCurrentDebugTask();
          null !== debugTask ? debugTask.run(
            warnOnSymbolTypeImpl.bind(null, returnFiber, invalidChild)
          ) : warnOnSymbolTypeImpl(returnFiber, invalidChild);
        }
        function createChildReconciler(shouldTrackSideEffects) {
          function deleteChild(returnFiber, childToDelete) {
            if (shouldTrackSideEffects) {
              var deletions = returnFiber.deletions;
              null === deletions ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
            }
          }
          function deleteRemainingChildren(returnFiber, currentFirstChild) {
            if (!shouldTrackSideEffects) return null;
            for (; null !== currentFirstChild; )
              deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
            return null;
          }
          function mapRemainingChildren(currentFirstChild) {
            for (var existingChildren = /* @__PURE__ */ new Map(); null !== currentFirstChild; )
              null === currentFirstChild.key ? existingChildren.set(currentFirstChild.index, currentFirstChild) : existingChildren.set(currentFirstChild.key, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
            return existingChildren;
          }
          function useFiber(fiber, pendingProps) {
            fiber = createWorkInProgress(fiber, pendingProps);
            fiber.index = 0;
            fiber.sibling = null;
            return fiber;
          }
          function placeChild(newFiber, lastPlacedIndex, newIndex) {
            newFiber.index = newIndex;
            if (!shouldTrackSideEffects)
              return newFiber.flags |= 1048576, lastPlacedIndex;
            newIndex = newFiber.alternate;
            if (null !== newIndex)
              return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 2, lastPlacedIndex) : newIndex;
            newFiber.flags |= 134217730;
            return lastPlacedIndex;
          }
          function placeSingleChild(newFiber) {
            shouldTrackSideEffects && null === newFiber.alternate && (newFiber.flags |= 134217730);
            return newFiber;
          }
          function updateTextNode(returnFiber, current2, textContent, lanes) {
            if (null === current2 || 6 !== current2.tag)
              return current2 = createFiberFromText(
                textContent,
                returnFiber.mode,
                lanes
              ), current2.return = returnFiber, current2._debugOwner = returnFiber, current2._debugTask = returnFiber._debugTask, current2._debugInfo = currentDebugInfo, current2;
            current2 = useFiber(current2, textContent);
            current2.return = returnFiber;
            current2._debugInfo = currentDebugInfo;
            return current2;
          }
          function updateElement(returnFiber, current2, element, lanes) {
            var elementType = element.type;
            if (elementType === REACT_FRAGMENT_TYPE)
              return current2 = updateFragment(
                returnFiber,
                current2,
                element.props.children,
                lanes,
                element.key
              ), coerceRef(current2, element), validateFragmentProps(element, current2, returnFiber), current2;
            if (null !== current2 && (current2.elementType === elementType || isCompatibleFamilyForHotReloading(current2, element) || "object" === typeof elementType && null !== elementType && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current2.type))
              return current2 = useFiber(current2, element.props), coerceRef(current2, element), current2.return = returnFiber, current2._debugOwner = element._owner, current2._debugInfo = currentDebugInfo, current2;
            current2 = createFiberFromElement(element, returnFiber.mode, lanes);
            coerceRef(current2, element);
            current2.return = returnFiber;
            current2._debugInfo = currentDebugInfo;
            return current2;
          }
          function updatePortal(returnFiber, current2, portal, lanes) {
            if (null === current2 || 4 !== current2.tag || current2.stateNode.containerInfo !== portal.containerInfo || current2.stateNode.implementation !== portal.implementation)
              return current2 = createFiberFromPortal(portal, returnFiber.mode, lanes), current2.return = returnFiber, current2._debugInfo = currentDebugInfo, current2;
            current2 = useFiber(current2, portal.children || []);
            current2.return = returnFiber;
            current2._debugInfo = currentDebugInfo;
            return current2;
          }
          function updateFragment(returnFiber, current2, fragment, lanes, key) {
            if (null === current2 || 7 !== current2.tag)
              return current2 = createFiberFromFragment(
                fragment,
                returnFiber.mode,
                lanes,
                key
              ), current2.return = returnFiber, current2._debugOwner = returnFiber, current2._debugTask = returnFiber._debugTask, current2._debugInfo = currentDebugInfo, current2;
            current2 = useFiber(current2, fragment);
            current2.return = returnFiber;
            current2._debugInfo = currentDebugInfo;
            return current2;
          }
          function createChild(returnFiber, newChild, lanes) {
            if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
              return newChild = createFiberFromText(
                "" + newChild,
                returnFiber.mode,
                lanes
              ), newChild.return = returnFiber, newChild._debugOwner = returnFiber, newChild._debugTask = returnFiber._debugTask, newChild._debugInfo = currentDebugInfo, newChild;
            if ("object" === typeof newChild && null !== newChild) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                  return lanes = createFiberFromElement(
                    newChild,
                    returnFiber.mode,
                    lanes
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = pushDebugInfo(newChild._debugInfo), lanes._debugInfo = currentDebugInfo, currentDebugInfo = returnFiber, lanes;
                case REACT_PORTAL_TYPE:
                  return newChild = createFiberFromPortal(
                    newChild,
                    returnFiber.mode,
                    lanes
                  ), newChild.return = returnFiber, newChild._debugInfo = currentDebugInfo, newChild;
                case REACT_LAZY_TYPE:
                  var _prevDebugInfo = pushDebugInfo(newChild._debugInfo);
                  newChild = resolveLazy(newChild);
                  returnFiber = createChild(returnFiber, newChild, lanes);
                  currentDebugInfo = _prevDebugInfo;
                  return returnFiber;
              }
              if (isArrayImpl(newChild) || getIteratorFn(newChild))
                return lanes = createFiberFromFragment(
                  newChild,
                  returnFiber.mode,
                  lanes,
                  null
                ), lanes.return = returnFiber, lanes._debugOwner = returnFiber, lanes._debugTask = returnFiber._debugTask, returnFiber = pushDebugInfo(newChild._debugInfo), lanes._debugInfo = currentDebugInfo, currentDebugInfo = returnFiber, lanes;
              if ("function" === typeof newChild.then)
                return _prevDebugInfo = pushDebugInfo(newChild._debugInfo), returnFiber = createChild(
                  returnFiber,
                  unwrapThenable(newChild),
                  lanes
                ), currentDebugInfo = _prevDebugInfo, returnFiber;
              if (newChild.$$typeof === REACT_CONTEXT_TYPE)
                return createChild(
                  returnFiber,
                  readContextDuringReconciliation(returnFiber, newChild),
                  lanes
                );
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            "function" === typeof newChild && warnOnFunctionType(returnFiber, newChild);
            "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
            return null;
          }
          function updateSlot(returnFiber, oldFiber, newChild, lanes) {
            var key = null !== oldFiber ? oldFiber.key : null;
            if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
              return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
            if ("object" === typeof newChild && null !== newChild) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                  return newChild.key === key ? (key = pushDebugInfo(newChild._debugInfo), returnFiber = updateElement(
                    returnFiber,
                    oldFiber,
                    newChild,
                    lanes
                  ), currentDebugInfo = key, returnFiber) : null;
                case REACT_PORTAL_TYPE:
                  return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
                case REACT_LAZY_TYPE:
                  return key = pushDebugInfo(newChild._debugInfo), newChild = resolveLazy(newChild), returnFiber = updateSlot(
                    returnFiber,
                    oldFiber,
                    newChild,
                    lanes
                  ), currentDebugInfo = key, returnFiber;
              }
              if (isArrayImpl(newChild) || getIteratorFn(newChild)) {
                if (null !== key) return null;
                key = pushDebugInfo(newChild._debugInfo);
                returnFiber = updateFragment(
                  returnFiber,
                  oldFiber,
                  newChild,
                  lanes,
                  null
                );
                currentDebugInfo = key;
                return returnFiber;
              }
              if ("function" === typeof newChild.then)
                return key = pushDebugInfo(newChild._debugInfo), returnFiber = updateSlot(
                  returnFiber,
                  oldFiber,
                  unwrapThenable(newChild),
                  lanes
                ), currentDebugInfo = key, returnFiber;
              if (newChild.$$typeof === REACT_CONTEXT_TYPE)
                return updateSlot(
                  returnFiber,
                  oldFiber,
                  readContextDuringReconciliation(returnFiber, newChild),
                  lanes
                );
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            "function" === typeof newChild && warnOnFunctionType(returnFiber, newChild);
            "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
            return null;
          }
          function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
            if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
              return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
            if ("object" === typeof newChild && null !== newChild) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                  return newIdx = existingChildren.get(
                    null === newChild.key ? newIdx : newChild.key
                  ) || null, existingChildren = pushDebugInfo(newChild._debugInfo), returnFiber = updateElement(
                    returnFiber,
                    newIdx,
                    newChild,
                    lanes
                  ), currentDebugInfo = existingChildren, returnFiber;
                case REACT_PORTAL_TYPE:
                  return existingChildren = existingChildren.get(
                    null === newChild.key ? newIdx : newChild.key
                  ) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
                case REACT_LAZY_TYPE:
                  var _prevDebugInfo7 = pushDebugInfo(newChild._debugInfo);
                  newChild = resolveLazy(newChild);
                  returnFiber = updateFromMap(
                    existingChildren,
                    returnFiber,
                    newIdx,
                    newChild,
                    lanes
                  );
                  currentDebugInfo = _prevDebugInfo7;
                  return returnFiber;
              }
              if (isArrayImpl(newChild) || getIteratorFn(newChild))
                return newIdx = existingChildren.get(newIdx) || null, existingChildren = pushDebugInfo(newChild._debugInfo), returnFiber = updateFragment(
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes,
                  null
                ), currentDebugInfo = existingChildren, returnFiber;
              if ("function" === typeof newChild.then)
                return _prevDebugInfo7 = pushDebugInfo(newChild._debugInfo), returnFiber = updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  unwrapThenable(newChild),
                  lanes
                ), currentDebugInfo = _prevDebugInfo7, returnFiber;
              if (newChild.$$typeof === REACT_CONTEXT_TYPE)
                return updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  readContextDuringReconciliation(returnFiber, newChild),
                  lanes
                );
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            "function" === typeof newChild && warnOnFunctionType(returnFiber, newChild);
            "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
            return null;
          }
          function warnOnInvalidKey(returnFiber, workInProgress2, child, knownKeys) {
            if ("object" !== typeof child || null === child) return knownKeys;
            switch (child.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                warnForMissingKey(returnFiber, workInProgress2, child);
                var key = child.key;
                if ("string" !== typeof key) break;
                if (null === knownKeys) {
                  knownKeys = /* @__PURE__ */ new Set();
                  knownKeys.add(key);
                  break;
                }
                if (!knownKeys.has(key)) {
                  knownKeys.add(key);
                  break;
                }
                runWithFiberInDEV(workInProgress2, function() {
                  console.error(
                    "Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted \u2014 the behavior is unsupported and could change in a future version.",
                    key
                  );
                });
                break;
              case REACT_LAZY_TYPE:
                child = resolveLazy(child), warnOnInvalidKey(returnFiber, workInProgress2, child, knownKeys);
            }
            return knownKeys;
          }
          function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
            for (var knownKeys = null, resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
              oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
              var newFiber = updateSlot(
                returnFiber,
                oldFiber,
                newChildren[newIdx],
                lanes
              );
              if (null === newFiber) {
                null === oldFiber && (oldFiber = nextOldFiber);
                break;
              }
              knownKeys = warnOnInvalidKey(
                returnFiber,
                newFiber,
                newChildren[newIdx],
                knownKeys
              );
              shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
              currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
              null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
              previousNewFiber = newFiber;
              oldFiber = nextOldFiber;
            }
            if (newIdx === newChildren.length)
              return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
            if (null === oldFiber) {
              for (; newIdx < newChildren.length; newIdx++)
                oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), null !== oldFiber && (knownKeys = warnOnInvalidKey(
                  returnFiber,
                  oldFiber,
                  newChildren[newIdx],
                  knownKeys
                ), currentFirstChild = placeChild(
                  oldFiber,
                  currentFirstChild,
                  newIdx
                ), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
              isHydrating && pushTreeFork(returnFiber, newIdx);
              return resultingFirstChild;
            }
            for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++)
              nextOldFiber = updateFromMap(
                oldFiber,
                returnFiber,
                newIdx,
                newChildren[newIdx],
                lanes
              ), null !== nextOldFiber && (knownKeys = warnOnInvalidKey(
                returnFiber,
                nextOldFiber,
                newChildren[newIdx],
                knownKeys
              ), shouldTrackSideEffects && (newFiber = nextOldFiber.alternate, null !== newFiber && oldFiber.delete(
                null === newFiber.key ? newIdx : newFiber.key
              )), currentFirstChild = placeChild(
                nextOldFiber,
                currentFirstChild,
                newIdx
              ), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
            shouldTrackSideEffects && oldFiber.forEach(function(child) {
              return deleteChild(returnFiber, child);
            });
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
            if (null == newChildren)
              throw Error("An iterable object provided no iterator.");
            for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, knownKeys = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, step = newChildren.next()) {
              oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
              var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
              if (null === newFiber) {
                null === oldFiber && (oldFiber = nextOldFiber);
                break;
              }
              knownKeys = warnOnInvalidKey(
                returnFiber,
                newFiber,
                step.value,
                knownKeys
              );
              shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
              currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
              null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
              previousNewFiber = newFiber;
              oldFiber = nextOldFiber;
            }
            if (step.done)
              return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
            if (null === oldFiber) {
              for (; !step.done; newIdx++, step = newChildren.next())
                oldFiber = createChild(returnFiber, step.value, lanes), null !== oldFiber && (knownKeys = warnOnInvalidKey(
                  returnFiber,
                  oldFiber,
                  step.value,
                  knownKeys
                ), currentFirstChild = placeChild(
                  oldFiber,
                  currentFirstChild,
                  newIdx
                ), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
              isHydrating && pushTreeFork(returnFiber, newIdx);
              return resultingFirstChild;
            }
            for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next())
              nextOldFiber = updateFromMap(
                oldFiber,
                returnFiber,
                newIdx,
                step.value,
                lanes
              ), null !== nextOldFiber && (knownKeys = warnOnInvalidKey(
                returnFiber,
                nextOldFiber,
                step.value,
                knownKeys
              ), shouldTrackSideEffects && (step = nextOldFiber.alternate, null !== step && oldFiber.delete(null === step.key ? newIdx : step.key)), currentFirstChild = placeChild(
                nextOldFiber,
                currentFirstChild,
                newIdx
              ), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
            shouldTrackSideEffects && oldFiber.forEach(function(child) {
              return deleteChild(returnFiber, child);
            });
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
            "object" === typeof newChild && null !== newChild && newChild.type === REACT_FRAGMENT_TYPE && null === newChild.key && void 0 === newChild.props.ref && (validateFragmentProps(newChild, null, returnFiber), newChild = newChild.props.children);
            if ("object" === typeof newChild && null !== newChild) {
              switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                  var prevDebugInfo = pushDebugInfo(newChild._debugInfo);
                  a: {
                    for (var key = newChild.key; null !== currentFirstChild; ) {
                      if (currentFirstChild.key === key) {
                        key = newChild.type;
                        if (key === REACT_FRAGMENT_TYPE) {
                          if (7 === currentFirstChild.tag) {
                            deleteRemainingChildren(
                              returnFiber,
                              currentFirstChild.sibling
                            );
                            lanes = useFiber(
                              currentFirstChild,
                              newChild.props.children
                            );
                            coerceRef(lanes, newChild);
                            lanes.return = returnFiber;
                            lanes._debugOwner = newChild._owner;
                            lanes._debugInfo = currentDebugInfo;
                            validateFragmentProps(newChild, lanes, returnFiber);
                            returnFiber = lanes;
                            break a;
                          }
                        } else if (currentFirstChild.elementType === key || isCompatibleFamilyForHotReloading(
                          currentFirstChild,
                          newChild
                        ) || "object" === typeof key && null !== key && key.$$typeof === REACT_LAZY_TYPE && resolveLazy(key) === currentFirstChild.type) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          );
                          lanes = useFiber(currentFirstChild, newChild.props);
                          coerceRef(lanes, newChild);
                          lanes.return = returnFiber;
                          lanes._debugOwner = newChild._owner;
                          lanes._debugInfo = currentDebugInfo;
                          returnFiber = lanes;
                          break a;
                        }
                        deleteRemainingChildren(returnFiber, currentFirstChild);
                        break;
                      } else deleteChild(returnFiber, currentFirstChild);
                      currentFirstChild = currentFirstChild.sibling;
                    }
                    newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(
                      newChild.props.children,
                      returnFiber.mode,
                      lanes,
                      newChild.key
                    ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes._debugOwner = returnFiber, lanes._debugTask = returnFiber._debugTask, lanes._debugInfo = currentDebugInfo, validateFragmentProps(newChild, lanes, returnFiber), returnFiber = lanes) : (lanes = createFiberFromElement(
                      newChild,
                      returnFiber.mode,
                      lanes
                    ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes._debugInfo = currentDebugInfo, returnFiber = lanes);
                  }
                  returnFiber = placeSingleChild(returnFiber);
                  currentDebugInfo = prevDebugInfo;
                  return returnFiber;
                case REACT_PORTAL_TYPE:
                  a: {
                    prevDebugInfo = newChild;
                    for (newChild = prevDebugInfo.key; null !== currentFirstChild; ) {
                      if (currentFirstChild.key === newChild)
                        if (4 === currentFirstChild.tag && currentFirstChild.stateNode.containerInfo === prevDebugInfo.containerInfo && currentFirstChild.stateNode.implementation === prevDebugInfo.implementation) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          );
                          lanes = useFiber(
                            currentFirstChild,
                            prevDebugInfo.children || []
                          );
                          lanes.return = returnFiber;
                          returnFiber = lanes;
                          break a;
                        } else {
                          deleteRemainingChildren(returnFiber, currentFirstChild);
                          break;
                        }
                      else deleteChild(returnFiber, currentFirstChild);
                      currentFirstChild = currentFirstChild.sibling;
                    }
                    lanes = createFiberFromPortal(
                      prevDebugInfo,
                      returnFiber.mode,
                      lanes
                    );
                    lanes.return = returnFiber;
                    returnFiber = lanes;
                  }
                  return placeSingleChild(returnFiber);
                case REACT_LAZY_TYPE:
                  return prevDebugInfo = pushDebugInfo(newChild._debugInfo), newChild = resolveLazy(newChild), returnFiber = reconcileChildFibersImpl(
                    returnFiber,
                    currentFirstChild,
                    newChild,
                    lanes
                  ), currentDebugInfo = prevDebugInfo, returnFiber;
              }
              if (isArrayImpl(newChild))
                return reconcileChildrenArray(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                );
              if (getIteratorFn(newChild)) {
                prevDebugInfo = newChild;
                newChild = getIteratorFn(prevDebugInfo);
                if ("function" !== typeof newChild)
                  throw Error(
                    "An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."
                  );
                key = newChild.call(prevDebugInfo);
                if (key === prevDebugInfo) {
                  if (0 !== returnFiber.tag || "[object GeneratorFunction]" !== Object.prototype.toString.call(returnFiber.type) || "[object Generator]" !== Object.prototype.toString.call(key))
                    didWarnAboutGenerators || console.error(
                      "Using Iterators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. You can also use an Iterable that can iterate multiple times over the same items."
                    ), didWarnAboutGenerators = true;
                } else
                  prevDebugInfo.entries !== newChild || didWarnAboutMaps || (console.error(
                    "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
                  ), didWarnAboutMaps = true);
                return reconcileChildrenIterator(
                  returnFiber,
                  currentFirstChild,
                  key,
                  lanes
                );
              }
              if ("function" === typeof newChild.then)
                return prevDebugInfo = pushDebugInfo(newChild._debugInfo), returnFiber = reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  unwrapThenable(newChild),
                  lanes
                ), currentDebugInfo = prevDebugInfo, returnFiber;
              if (newChild.$$typeof === REACT_CONTEXT_TYPE)
                return reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  readContextDuringReconciliation(returnFiber, newChild),
                  lanes
                );
              throwOnInvalidObjectType(returnFiber, newChild);
            }
            if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
              return prevDebugInfo = "" + newChild, null !== currentFirstChild && 6 === currentFirstChild.tag ? (deleteRemainingChildren(
                returnFiber,
                currentFirstChild.sibling
              ), lanes = useFiber(currentFirstChild, prevDebugInfo), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(
                prevDebugInfo,
                returnFiber.mode,
                lanes
              ), lanes.return = returnFiber, lanes._debugOwner = returnFiber, lanes._debugTask = returnFiber._debugTask, lanes._debugInfo = currentDebugInfo, returnFiber = lanes), placeSingleChild(returnFiber);
            "function" === typeof newChild && warnOnFunctionType(returnFiber, newChild);
            "symbol" === typeof newChild && warnOnSymbolType(returnFiber, newChild);
            return deleteRemainingChildren(returnFiber, currentFirstChild);
          }
          return function(returnFiber, currentFirstChild, newChild, lanes) {
            var prevDebugInfo = currentDebugInfo;
            currentDebugInfo = null;
            try {
              thenableIndexCounter$1 = 0;
              var firstChildFiber = reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
              thenableState$1 = null;
              return firstChildFiber;
            } catch (x) {
              if (x === SuspenseException || x === SuspenseActionException) throw x;
              var fiber = createFiber(29, x, null, returnFiber.mode);
              fiber.lanes = lanes;
              fiber.return = returnFiber;
              var debugInfo = fiber._debugInfo = currentDebugInfo;
              fiber._debugOwner = returnFiber._debugOwner;
              fiber._debugTask = returnFiber._debugTask;
              if (null != debugInfo) {
                for (var i = debugInfo.length - 1; 0 <= i; i--)
                  if ("string" === typeof debugInfo[i].stack) {
                    fiber._debugOwner = debugInfo[i];
                    fiber._debugTask = debugInfo[i].debugTask;
                    break;
                  }
              }
              return fiber;
            } finally {
              currentDebugInfo = prevDebugInfo;
            }
          };
        }
        function validateSuspenseListNestedChild(childSlot, index) {
          var isAnArray = isArrayImpl(childSlot);
          childSlot = !isAnArray && "function" === typeof getIteratorFn(childSlot);
          return isAnArray || childSlot ? (isAnArray = isAnArray ? "array" : "iterable", console.error(
            "A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>",
            isAnArray,
            index,
            isAnArray
          ), false) : true;
        }
        function finishQueueingConcurrentUpdates() {
          for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex; ) {
            var fiber = concurrentQueues[i];
            concurrentQueues[i++] = null;
            var queue = concurrentQueues[i];
            concurrentQueues[i++] = null;
            var update = concurrentQueues[i];
            concurrentQueues[i++] = null;
            var lane = concurrentQueues[i];
            concurrentQueues[i++] = null;
            if (null !== queue && null !== update) {
              var pending3 = queue.pending;
              null === pending3 ? update.next = update : (update.next = pending3.next, pending3.next = update);
              queue.pending = update;
            }
            0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
          }
        }
        function enqueueUpdate$1(fiber, queue, update, lane) {
          concurrentQueues[concurrentQueuesIndex++] = fiber;
          concurrentQueues[concurrentQueuesIndex++] = queue;
          concurrentQueues[concurrentQueuesIndex++] = update;
          concurrentQueues[concurrentQueuesIndex++] = lane;
          concurrentlyUpdatedLanes |= lane;
          fiber.lanes |= lane;
          fiber = fiber.alternate;
          null !== fiber && (fiber.lanes |= lane);
        }
        function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
          enqueueUpdate$1(fiber, queue, update, lane);
          return getRootForUpdatedFiber(fiber);
        }
        function enqueueConcurrentRenderForLane(fiber, lane) {
          enqueueUpdate$1(fiber, null, null, lane);
          return getRootForUpdatedFiber(fiber);
        }
        function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
          sourceFiber.lanes |= lane;
          var alternate = sourceFiber.alternate;
          null !== alternate && (alternate.lanes |= lane);
          for (var isHidden = false, parent = sourceFiber.return; null !== parent; )
            parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & OffscreenVisible || (isHidden = true)), sourceFiber = parent, parent = parent.return;
          return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
        }
        function getRootForUpdatedFiber(sourceFiber) {
          if (nestedUpdateCount > NESTED_UPDATE_LIMIT)
            throw nestedPassiveUpdateCount = nestedUpdateCount = 0, rootWithPassiveNestedUpdates = rootWithNestedUpdates = null, Error(
              "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
            );
          nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT && (nestedPassiveUpdateCount = 0, rootWithPassiveNestedUpdates = null, console.error(
            "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."
          ));
          null === sourceFiber.alternate && 0 !== (sourceFiber.flags & 4098) && warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
          for (var node = sourceFiber, parent = node.return; null !== parent; )
            null === node.alternate && 0 !== (node.flags & 4098) && warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber), node = parent, parent = node.return;
          return 3 === node.tag ? node.stateNode : null;
        }
        function initializeUpdateQueue(fiber) {
          fiber.updateQueue = {
            baseState: fiber.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: { pending: null, lanes: 0, hiddenCallbacks: null },
            callbacks: null
          };
        }
        function cloneUpdateQueue(current2, workInProgress2) {
          current2 = current2.updateQueue;
          workInProgress2.updateQueue === current2 && (workInProgress2.updateQueue = {
            baseState: current2.baseState,
            firstBaseUpdate: current2.firstBaseUpdate,
            lastBaseUpdate: current2.lastBaseUpdate,
            shared: current2.shared,
            callbacks: null
          });
        }
        function createUpdate(lane) {
          return {
            lane,
            tag: UpdateState,
            payload: null,
            callback: null,
            next: null
          };
        }
        function enqueueUpdate(fiber, update, lane) {
          var updateQueue = fiber.updateQueue;
          if (null === updateQueue) return null;
          updateQueue = updateQueue.shared;
          if (currentlyProcessingQueue === updateQueue && !didWarnUpdateInsideUpdate) {
            var componentName2 = getComponentNameFromFiber(fiber);
            console.error(
              "An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback.\n\nPlease update the following component: %s",
              componentName2
            );
            didWarnUpdateInsideUpdate = true;
          }
          if ((executionContext & RenderContext) !== NoContext)
            return componentName2 = updateQueue.pending, null === componentName2 ? update.next = update : (update.next = componentName2.next, componentName2.next = update), updateQueue.pending = update, update = getRootForUpdatedFiber(fiber), markUpdateLaneFromFiberToRoot(fiber, null, lane), update;
          enqueueUpdate$1(fiber, updateQueue, update, lane);
          return getRootForUpdatedFiber(fiber);
        }
        function entangleTransitions(root2, fiber, lane) {
          fiber = fiber.updateQueue;
          if (null !== fiber && (fiber = fiber.shared, 0 !== (lane & 4194048))) {
            var queueLanes = fiber.lanes;
            queueLanes &= root2.pendingLanes;
            lane |= queueLanes;
            fiber.lanes = lane;
            markRootEntangled(root2, lane);
          }
        }
        function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
          var queue = workInProgress2.updateQueue, current2 = workInProgress2.alternate;
          if (null !== current2 && (current2 = current2.updateQueue, queue === current2)) {
            var newFirst = null, newLast = null;
            queue = queue.firstBaseUpdate;
            if (null !== queue) {
              do {
                var clone = {
                  lane: queue.lane,
                  tag: queue.tag,
                  payload: queue.payload,
                  callback: null,
                  next: null
                };
                null === newLast ? newFirst = newLast = clone : newLast = newLast.next = clone;
                queue = queue.next;
              } while (null !== queue);
              null === newLast ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
            } else newFirst = newLast = capturedUpdate;
            queue = {
              baseState: current2.baseState,
              firstBaseUpdate: newFirst,
              lastBaseUpdate: newLast,
              shared: current2.shared,
              callbacks: current2.callbacks
            };
            workInProgress2.updateQueue = queue;
            return;
          }
          workInProgress2 = queue.lastBaseUpdate;
          null === workInProgress2 ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate;
          queue.lastBaseUpdate = capturedUpdate;
        }
        function suspendIfUpdateReadFromEntangledAsyncAction() {
          if (didReadFromEntangledAsyncAction) {
            var entangledActionThenable = currentEntangledActionThenable;
            if (null !== entangledActionThenable) throw entangledActionThenable;
          }
        }
        function processUpdateQueue(workInProgress2, props, instance$jscomp$0, renderLanes2) {
          didReadFromEntangledAsyncAction = false;
          var queue = workInProgress2.updateQueue;
          hasForceUpdate = false;
          currentlyProcessingQueue = queue.shared;
          var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
          if (null !== pendingQueue) {
            queue.shared.pending = null;
            var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
            lastPendingUpdate.next = null;
            null === lastBaseUpdate ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
            lastBaseUpdate = lastPendingUpdate;
            var current2 = workInProgress2.alternate;
            null !== current2 && (current2 = current2.updateQueue, pendingQueue = current2.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (null === pendingQueue ? current2.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current2.lastBaseUpdate = lastPendingUpdate));
          }
          if (null !== firstBaseUpdate) {
            var newState = queue.baseState;
            lastBaseUpdate = 0;
            current2 = firstPendingUpdate = lastPendingUpdate = null;
            pendingQueue = firstBaseUpdate;
            do {
              var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
              if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
                0 !== updateLane && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = true);
                null !== current2 && (current2 = current2.next = {
                  lane: 0,
                  tag: pendingQueue.tag,
                  payload: pendingQueue.payload,
                  callback: null,
                  next: null
                });
                a: {
                  updateLane = workInProgress2;
                  var partialState = pendingQueue;
                  var nextProps = props, instance = instance$jscomp$0;
                  switch (partialState.tag) {
                    case ReplaceState:
                      partialState = partialState.payload;
                      if ("function" === typeof partialState) {
                        isDisallowedContextReadInDEV = true;
                        var nextState = partialState.call(
                          instance,
                          newState,
                          nextProps
                        );
                        if (updateLane.mode & 8) {
                          setIsStrictModeForDevtools(true);
                          try {
                            partialState.call(instance, newState, nextProps);
                          } finally {
                            setIsStrictModeForDevtools(false);
                          }
                        }
                        isDisallowedContextReadInDEV = false;
                        newState = nextState;
                        break a;
                      }
                      newState = partialState;
                      break a;
                    case CaptureUpdate:
                      updateLane.flags = updateLane.flags & -65537 | 128;
                    case UpdateState:
                      nextState = partialState.payload;
                      if ("function" === typeof nextState) {
                        isDisallowedContextReadInDEV = true;
                        partialState = nextState.call(
                          instance,
                          newState,
                          nextProps
                        );
                        if (updateLane.mode & 8) {
                          setIsStrictModeForDevtools(true);
                          try {
                            nextState.call(instance, newState, nextProps);
                          } finally {
                            setIsStrictModeForDevtools(false);
                          }
                        }
                        isDisallowedContextReadInDEV = false;
                      } else partialState = nextState;
                      if (null === partialState || void 0 === partialState) break a;
                      newState = assign({}, newState, partialState);
                      break a;
                    case ForceUpdate:
                      hasForceUpdate = true;
                  }
                }
                updateLane = pendingQueue.callback;
                null !== updateLane && (workInProgress2.flags |= 64, isHiddenUpdate && (workInProgress2.flags |= 8192), isHiddenUpdate = queue.callbacks, null === isHiddenUpdate ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
              } else
                isHiddenUpdate = {
                  lane: updateLane,
                  tag: pendingQueue.tag,
                  payload: pendingQueue.payload,
                  callback: pendingQueue.callback,
                  next: null
                }, null === current2 ? (firstPendingUpdate = current2 = isHiddenUpdate, lastPendingUpdate = newState) : current2 = current2.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
              pendingQueue = pendingQueue.next;
              if (null === pendingQueue)
                if (pendingQueue = queue.shared.pending, null === pendingQueue)
                  break;
                else
                  isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
            } while (1);
            null === current2 && (lastPendingUpdate = newState);
            queue.baseState = lastPendingUpdate;
            queue.firstBaseUpdate = firstPendingUpdate;
            queue.lastBaseUpdate = current2;
            null === firstBaseUpdate && (queue.shared.lanes = 0);
            workInProgressRootSkippedLanes |= lastBaseUpdate;
            workInProgress2.lanes = lastBaseUpdate;
            workInProgress2.memoizedState = newState;
          }
          currentlyProcessingQueue = null;
        }
        function callCallback(callback, context) {
          if ("function" !== typeof callback)
            throw Error(
              "Invalid argument passed as callback. Expected a function. Instead received: " + callback
            );
          callback.call(context);
        }
        function commitHiddenCallbacks(updateQueue, context) {
          var hiddenCallbacks = updateQueue.shared.hiddenCallbacks;
          if (null !== hiddenCallbacks)
            for (updateQueue.shared.hiddenCallbacks = null, updateQueue = 0; updateQueue < hiddenCallbacks.length; updateQueue++)
              callCallback(hiddenCallbacks[updateQueue], context);
        }
        function commitCallbacks(updateQueue, context) {
          var callbacks2 = updateQueue.callbacks;
          if (null !== callbacks2)
            for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks2.length; updateQueue++)
              callCallback(callbacks2[updateQueue], context);
        }
        function pushHiddenContext(fiber, context) {
          var prevEntangledRenderLanes = entangledRenderLanes;
          push(prevEntangledRenderLanesCursor, prevEntangledRenderLanes, fiber);
          push(currentTreeHiddenStackCursor, context, fiber);
          entangledRenderLanes = prevEntangledRenderLanes | context.baseLanes;
        }
        function reuseHiddenContextOnStack(fiber) {
          push(prevEntangledRenderLanesCursor, entangledRenderLanes, fiber);
          push(
            currentTreeHiddenStackCursor,
            currentTreeHiddenStackCursor.current,
            fiber
          );
        }
        function popHiddenContext(fiber) {
          entangledRenderLanes = prevEntangledRenderLanesCursor.current;
          pop(currentTreeHiddenStackCursor, fiber);
          pop(prevEntangledRenderLanesCursor, fiber);
        }
        function pushPrimaryTreeSuspenseHandler(handler) {
          var current2 = handler.alternate;
          push(
            suspenseStackCursor,
            suspenseStackCursor.current & SubtreeSuspenseContextMask,
            handler
          );
          push(suspenseHandlerStackCursor, handler, handler);
          null === shellBoundary && (null === current2 || null !== currentTreeHiddenStackCursor.current ? shellBoundary = handler : null !== current2.memoizedState && (shellBoundary = handler));
        }
        function pushDehydratedActivitySuspenseHandler(fiber) {
          push(suspenseStackCursor, suspenseStackCursor.current, fiber);
          push(suspenseHandlerStackCursor, fiber, fiber);
          null === shellBoundary && (shellBoundary = fiber);
        }
        function pushOffscreenSuspenseHandler(fiber) {
          22 === fiber.tag ? (push(suspenseStackCursor, suspenseStackCursor.current, fiber), push(suspenseHandlerStackCursor, fiber, fiber), null === shellBoundary && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack(fiber);
        }
        function reuseSuspenseHandlerOnStack(fiber) {
          push(suspenseStackCursor, suspenseStackCursor.current, fiber);
          push(
            suspenseHandlerStackCursor,
            suspenseHandlerStackCursor.current,
            fiber
          );
        }
        function popSuspenseHandler(fiber) {
          pop(suspenseHandlerStackCursor, fiber);
          shellBoundary === fiber && (shellBoundary = null);
          pop(suspenseStackCursor, fiber);
        }
        function pushSuspenseListContext(fiber, newContext) {
          push(
            suspenseHandlerStackCursor,
            suspenseHandlerStackCursor.current,
            fiber
          );
          push(suspenseStackCursor, newContext, fiber);
        }
        function popSuspenseListContext(fiber) {
          pop(suspenseStackCursor, fiber);
          pop(suspenseHandlerStackCursor, fiber);
          shellBoundary === fiber && (shellBoundary = null);
        }
        function findFirstSuspended(row) {
          for (var node = row; null !== node; ) {
            if (13 === node.tag) {
              var state = node.memoizedState;
              if (null !== state && (state = state.dehydrated, null === state || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
                return node;
            } else if (19 === node.tag && "independent" !== node.memoizedProps.revealOrder) {
              if (0 !== (node.flags & 128)) return node;
            } else if (null !== node.child) {
              node.child.return = node;
              node = node.child;
              continue;
            }
            if (node === row) break;
            for (; null === node.sibling; ) {
              if (null === node.return || node.return === row) return null;
              node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
          }
          return null;
        }
        function mountHookTypesDev() {
          var hookName = currentHookNameInDev;
          null === hookTypesDev ? hookTypesDev = [hookName] : hookTypesDev.push(hookName);
        }
        function updateHookTypesDev() {
          var hookName = currentHookNameInDev;
          if (null !== hookTypesDev && (hookTypesUpdateIndexDev++, hookTypesDev[hookTypesUpdateIndexDev] !== hookName)) {
            var componentName2 = getComponentNameFromFiber(currentlyRenderingFiber);
            if (!didWarnAboutMismatchedHooksForComponent.has(componentName2) && (didWarnAboutMismatchedHooksForComponent.add(componentName2), null !== hookTypesDev)) {
              for (var table = "", i = 0; i <= hookTypesUpdateIndexDev; i++) {
                var oldHookName = hookTypesDev[i], newHookName = i === hookTypesUpdateIndexDev ? hookName : oldHookName;
                for (oldHookName = i + 1 + ". " + oldHookName; 30 > oldHookName.length; )
                  oldHookName += " ";
                oldHookName += newHookName + "\n";
                table += oldHookName;
              }
              console.error(
                "React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks\n\n   Previous render            Next render\n   ------------------------------------------------------\n%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n",
                componentName2,
                table
              );
            }
          }
        }
        function checkDepsAreArrayDev(deps) {
          void 0 === deps || null === deps || isArrayImpl(deps) || console.error(
            "%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.",
            currentHookNameInDev,
            typeof deps
          );
        }
        function warnOnUseFormStateInDev() {
          var componentName2 = getComponentNameFromFiber(currentlyRenderingFiber);
          didWarnAboutUseFormState.has(componentName2) || (didWarnAboutUseFormState.add(componentName2), console.error(
            "ReactDOM.useFormState has been renamed to React.useActionState. Please update %s to use React.useActionState.",
            componentName2
          ));
        }
        function throwInvalidHookError() {
          throw Error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
        }
        function areHookInputsEqual(nextDeps, prevDeps) {
          if (ignorePreviousDependencies) return false;
          if (null === prevDeps)
            return console.error(
              "%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.",
              currentHookNameInDev
            ), false;
          nextDeps.length !== prevDeps.length && console.error(
            "The final argument passed to %s changed size between renders. The order and size of this array must remain constant.\n\nPrevious: %s\nIncoming: %s",
            currentHookNameInDev,
            "[" + prevDeps.join(", ") + "]",
            "[" + nextDeps.join(", ") + "]"
          );
          for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
            if (!objectIs(nextDeps[i], prevDeps[i])) return false;
          return true;
        }
        function renderWithHooks(current2, workInProgress2, Component, props, secondArg, nextRenderLanes) {
          renderLanes = nextRenderLanes;
          currentlyRenderingFiber = workInProgress2;
          hookTypesDev = null !== current2 ? current2._debugHookTypes : null;
          hookTypesUpdateIndexDev = -1;
          ignorePreviousDependencies = null !== current2 && current2.type !== workInProgress2.type;
          if ("[object AsyncFunction]" === Object.prototype.toString.call(Component) || "[object AsyncGeneratorFunction]" === Object.prototype.toString.call(Component))
            nextRenderLanes = getComponentNameFromFiber(currentlyRenderingFiber), didWarnAboutAsyncClientComponent.has(nextRenderLanes) || (didWarnAboutAsyncClientComponent.add(nextRenderLanes), console.error(
              "%s is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server.",
              null === nextRenderLanes ? "An unknown Component" : "<" + nextRenderLanes + ">"
            ));
          workInProgress2.memoizedState = null;
          workInProgress2.updateQueue = null;
          workInProgress2.lanes = 0;
          ReactSharedInternals.H = null !== current2 && null !== current2.memoizedState ? HooksDispatcherOnUpdateInDEV : null !== hookTypesDev ? HooksDispatcherOnMountWithHookTypesInDEV : HooksDispatcherOnMountInDEV;
          shouldDoubleInvokeUserFnsInHooksDEV = nextRenderLanes = (workInProgress2.mode & 8) !== NoMode;
          var children = callComponentInDEV(Component, props, secondArg);
          shouldDoubleInvokeUserFnsInHooksDEV = false;
          didScheduleRenderPhaseUpdateDuringThisPass && (children = renderWithHooksAgain(
            workInProgress2,
            Component,
            props,
            secondArg
          ));
          if (nextRenderLanes) {
            setIsStrictModeForDevtools(true);
            try {
              children = renderWithHooksAgain(
                workInProgress2,
                Component,
                props,
                secondArg
              );
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          finishRenderingHooks(current2, workInProgress2);
          return children;
        }
        function finishRenderingHooks(current2, workInProgress2) {
          workInProgress2._debugHookTypes = hookTypesDev;
          null === workInProgress2.dependencies ? null !== thenableState && (workInProgress2.dependencies = {
            lanes: 0,
            firstContext: null,
            _debugThenableState: thenableState
          }) : workInProgress2.dependencies._debugThenableState = thenableState;
          var thenableState$jscomp$0 = thenableState;
          null !== lastSuspendedFiber && areSameKeyPath(lastSuspendedFiber, workInProgress2) && (null !== thenableState$jscomp$0 || null === lastSuspendedStack || didIssueUseWarning || (didIssueUseWarning = true, console.error(lastSuspendedStack)), lastSuspendedStack = lastSuspendedFiber = null);
          ReactSharedInternals.H = ContextOnlyDispatcher;
          thenableState$jscomp$0 = null !== currentHook && null !== currentHook.next;
          renderLanes = 0;
          hookTypesDev = currentHookNameInDev = workInProgressHook = currentHook = currentlyRenderingFiber = null;
          hookTypesUpdateIndexDev = -1;
          null !== current2 && (current2.flags & 1206910976) !== (workInProgress2.flags & 1206910976) && console.error(
            "Internal React error: Expected static flag was missing. Please notify the React team."
          );
          didScheduleRenderPhaseUpdate = false;
          thenableIndexCounter = 0;
          thenableState = null;
          if (thenableState$jscomp$0)
            throw Error(
              "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
            );
          null === current2 || didReceiveUpdate || (current2 = current2.dependencies, null !== current2 && checkIfContextChanged(current2) && (didReceiveUpdate = true));
          needsToResetSuspendedThenableDEV ? (needsToResetSuspendedThenableDEV = false, current2 = true) : current2 = false;
          current2 && (workInProgress2 = getComponentNameFromFiber(workInProgress2) || "Unknown", didWarnAboutUseWrappedInTryCatch.has(workInProgress2) || didWarnAboutAsyncClientComponent.has(workInProgress2) || (didWarnAboutUseWrappedInTryCatch.add(workInProgress2), console.error(
            "`use` was called from inside a try/catch block. This is not allowed and can lead to unexpected behavior. To handle errors triggered by `use`, wrap your component in a error boundary."
          )));
        }
        function renderWithHooksAgain(workInProgress2, Component, props, secondArg) {
          currentlyRenderingFiber = workInProgress2;
          var numberOfReRenders = 0;
          do {
            didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
            thenableIndexCounter = 0;
            didScheduleRenderPhaseUpdateDuringThisPass = false;
            if (numberOfReRenders >= RE_RENDER_LIMIT)
              throw Error(
                "Too many re-renders. React limits the number of renders to prevent an infinite loop."
              );
            numberOfReRenders += 1;
            ignorePreviousDependencies = false;
            workInProgressHook = currentHook = null;
            if (null != workInProgress2.updateQueue) {
              var children = workInProgress2.updateQueue;
              children.lastEffect = null;
              children.events = null;
              children.stores = null;
              null != children.memoCache && (children.memoCache.index = 0);
            }
            hookTypesUpdateIndexDev = -1;
            ReactSharedInternals.H = HooksDispatcherOnRerenderInDEV;
            children = callComponentInDEV(Component, props, secondArg);
          } while (didScheduleRenderPhaseUpdateDuringThisPass);
          return children;
        }
        function TransitionAwareHostComponent() {
          var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
          maybeThenable = "function" === typeof maybeThenable.then ? useThenable(maybeThenable) : maybeThenable;
          dispatcher = dispatcher.useState()[0];
          (null !== currentHook ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
          return maybeThenable;
        }
        function checkDidRenderIdHook() {
          var didRenderIdHook = 0 !== localIdCounter;
          localIdCounter = 0;
          return didRenderIdHook;
        }
        function bailoutHooks(current2, workInProgress2, lanes) {
          workInProgress2.updateQueue = current2.updateQueue;
          workInProgress2.flags = (workInProgress2.mode & 16) !== NoMode ? workInProgress2.flags & -805308421 : workInProgress2.flags & -2053;
          current2.lanes &= ~lanes;
        }
        function resetHooksOnUnwind(workInProgress2) {
          if (didScheduleRenderPhaseUpdate) {
            for (workInProgress2 = workInProgress2.memoizedState; null !== workInProgress2; ) {
              var queue = workInProgress2.queue;
              null !== queue && (queue.pending = null);
              workInProgress2 = workInProgress2.next;
            }
            didScheduleRenderPhaseUpdate = false;
          }
          renderLanes = 0;
          hookTypesDev = workInProgressHook = currentHook = currentlyRenderingFiber = null;
          hookTypesUpdateIndexDev = -1;
          currentHookNameInDev = null;
          didScheduleRenderPhaseUpdateDuringThisPass = false;
          thenableIndexCounter = localIdCounter = 0;
          thenableState = null;
        }
        function mountWorkInProgressHook() {
          var hook = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
          };
          null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
          return workInProgressHook;
        }
        function updateWorkInProgressHook() {
          if (null === currentHook) {
            var nextCurrentHook = currentlyRenderingFiber.alternate;
            nextCurrentHook = null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
          } else nextCurrentHook = currentHook.next;
          var nextWorkInProgressHook = null === workInProgressHook ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
          if (null !== nextWorkInProgressHook)
            workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
          else {
            if (null === nextCurrentHook) {
              if (null === currentlyRenderingFiber.alternate)
                throw Error(
                  "Update hook called on initial render. This is likely a bug in React. Please file an issue."
                );
              throw Error("Rendered more hooks than during the previous render.");
            }
            currentHook = nextCurrentHook;
            nextCurrentHook = {
              memoizedState: currentHook.memoizedState,
              baseState: currentHook.baseState,
              baseQueue: currentHook.baseQueue,
              queue: currentHook.queue,
              next: null
            };
            null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
          }
          return workInProgressHook;
        }
        function createFunctionComponentUpdateQueue() {
          return { lastEffect: null, events: null, stores: null, memoCache: null };
        }
        function useThenable(thenable) {
          var index = thenableIndexCounter;
          thenableIndexCounter += 1;
          null === thenableState && (thenableState = createThenableState());
          thenable = trackUsedThenable(
            thenableState,
            thenable,
            index,
            currentlyRenderingFiber
          );
          index = currentlyRenderingFiber;
          null === (null === workInProgressHook ? index.memoizedState : workInProgressHook.next) && (index = index.alternate, ReactSharedInternals.H = null !== index && null !== index.memoizedState ? HooksDispatcherOnUpdateInDEV : HooksDispatcherOnMountInDEV);
          return thenable;
        }
        function use(usable) {
          if (null !== usable && "object" === typeof usable) {
            if ("function" === typeof usable.then) return useThenable(usable);
            if (usable.$$typeof === REACT_RECOVERABLE_TYPE) return;
            if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
          }
          throw Error("An unsupported type was passed to use(): " + String(usable));
        }
        function useMemoCache(size) {
          var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
          null !== updateQueue && (memoCache = updateQueue.memoCache);
          if (null == memoCache) {
            var current2 = currentlyRenderingFiber.alternate;
            null !== current2 && (current2 = current2.updateQueue, null !== current2 && (current2 = current2.memoCache, null != current2 && (memoCache = {
              data: current2.data.map(function(array) {
                return array.slice();
              }),
              index: 0
            })));
          }
          null == memoCache && (memoCache = { data: [], index: 0 });
          null === updateQueue && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
          updateQueue.memoCache = memoCache;
          updateQueue = memoCache.data[memoCache.index];
          if (void 0 === updateQueue || ignorePreviousDependencies)
            for (updateQueue = memoCache.data[memoCache.index] = Array(size), current2 = 0; current2 < size; current2++)
              updateQueue[current2] = REACT_MEMO_CACHE_SENTINEL;
          else
            updateQueue.length !== size && console.error(
              "Expected a constant size argument for each invocation of useMemoCache. The previous cache was allocated with size %s but size %s was requested.",
              updateQueue.length,
              size
            );
          memoCache.index++;
          return updateQueue;
        }
        function basicStateReducer(state, action) {
          return "function" === typeof action ? action(state) : action;
        }
        function mountReducer(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          if (void 0 !== init) {
            var initialState = init(initialArg);
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(true);
              try {
                init(initialArg);
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
          } else initialState = initialArg;
          hook.memoizedState = hook.baseState = initialState;
          reducer = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          };
          hook.queue = reducer;
          reducer = reducer.dispatch = dispatchReducerAction.bind(
            null,
            currentlyRenderingFiber,
            reducer
          );
          return [hook.memoizedState, reducer];
        }
        function updateReducer(reducer) {
          var hook = updateWorkInProgressHook();
          return updateReducerImpl(hook, currentHook, reducer);
        }
        function updateReducerImpl(hook, current2, reducer) {
          var queue = hook.queue;
          if (null === queue)
            throw Error(
              "Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)"
            );
          queue.lastRenderedReducer = reducer;
          var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
          if (null !== pendingQueue) {
            if (null !== baseQueue) {
              var baseFirst = baseQueue.next;
              baseQueue.next = pendingQueue.next;
              pendingQueue.next = baseFirst;
            }
            current2.baseQueue !== baseQueue && console.error(
              "Internal error: Expected work-in-progress queue to be a clone. This is a bug in React."
            );
            current2.baseQueue = baseQueue = pendingQueue;
            queue.pending = null;
          }
          pendingQueue = hook.baseState;
          if (null === baseQueue) hook.memoizedState = pendingQueue;
          else {
            current2 = baseQueue.next;
            var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current2, didReadFromEntangledAsyncAction2 = false;
            do {
              var updateLane = update.lane & -536870913;
              if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
                var revertLane = update.revertLane;
                if (0 === revertLane)
                  null !== newBaseQueueLast && (newBaseQueueLast = newBaseQueueLast.next = {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: null
                  }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction2 = true);
                else if ((renderLanes & revertLane) === revertLane) {
                  update = update.next;
                  revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction2 = true);
                  continue;
                } else
                  updateLane = {
                    lane: 0,
                    revertLane: update.revertLane,
                    gesture: null,
                    action: update.action,
                    hasEagerState: update.hasEagerState,
                    eagerState: update.eagerState,
                    next: null
                  }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
                updateLane = update.action;
                shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
                pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
              } else
                revertLane = {
                  lane: updateLane,
                  revertLane: update.revertLane,
                  gesture: update.gesture,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
              update = update.next;
            } while (null !== update && update !== current2);
            null === newBaseQueueLast ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
            if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = true, didReadFromEntangledAsyncAction2 && (reducer = currentEntangledActionThenable, null !== reducer)))
              throw reducer;
            hook.memoizedState = pendingQueue;
            hook.baseState = baseFirst;
            hook.baseQueue = newBaseQueueLast;
            queue.lastRenderedState = pendingQueue;
          }
          null === baseQueue && (queue.lanes = 0);
          return [hook.memoizedState, queue.dispatch];
        }
        function rerenderReducer(reducer) {
          var hook = updateWorkInProgressHook(), queue = hook.queue;
          if (null === queue)
            throw Error(
              "Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)"
            );
          queue.lastRenderedReducer = reducer;
          var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
          if (null !== lastRenderPhaseUpdate) {
            queue.pending = null;
            var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
            do
              newState = reducer(newState, update.action), update = update.next;
            while (update !== lastRenderPhaseUpdate);
            objectIs(newState, hook.memoizedState) || (didReceiveUpdate = true);
            hook.memoizedState = newState;
            null === hook.baseQueue && (hook.baseState = newState);
            queue.lastRenderedState = newState;
          }
          return [newState, dispatch];
        }
        function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
          if (isHydrating) {
            if (void 0 === getServerSnapshot)
              throw Error(
                "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
              );
            var nextSnapshot = getServerSnapshot();
            didWarnUncachedGetSnapshot || nextSnapshot === getServerSnapshot() || (console.error(
              "The result of getServerSnapshot should be cached to avoid an infinite loop"
            ), didWarnUncachedGetSnapshot = true);
          } else {
            nextSnapshot = getSnapshot();
            didWarnUncachedGetSnapshot || (getServerSnapshot = getSnapshot(), objectIs(nextSnapshot, getServerSnapshot) || (console.error(
              "The result of getSnapshot should be cached to avoid an infinite loop"
            ), didWarnUncachedGetSnapshot = true));
            if (null === workInProgressRoot)
              throw Error(
                "Expected a work-in-progress root. This is a bug in React. Please file an issue."
              );
            0 !== (workInProgressRootRenderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
          }
          hook.memoizedState = nextSnapshot;
          getServerSnapshot = { value: nextSnapshot, getSnapshot };
          hook.queue = getServerSnapshot;
          mountEffect(
            subscribeToStore.bind(null, fiber, getServerSnapshot, subscribe),
            [subscribe]
          );
          fiber.flags |= 2048;
          pushSimpleEffect(
            HasEffect | Passive,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              getServerSnapshot,
              nextSnapshot,
              getSnapshot
            ),
            null
          );
          return nextSnapshot;
        }
        function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
          if (isHydrating$jscomp$0) {
            if (void 0 === getServerSnapshot)
              throw Error(
                "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
              );
            getServerSnapshot = getServerSnapshot();
          } else if (getServerSnapshot = getSnapshot(), !didWarnUncachedGetSnapshot) {
            var cachedSnapshot = getSnapshot();
            objectIs(getServerSnapshot, cachedSnapshot) || (console.error(
              "The result of getSnapshot should be cached to avoid an infinite loop"
            ), didWarnUncachedGetSnapshot = true);
          }
          if (cachedSnapshot = !objectIs(
            (currentHook || hook).memoizedState,
            getServerSnapshot
          ))
            hook.memoizedState = getServerSnapshot, didReceiveUpdate = true;
          hook = hook.queue;
          var create = subscribeToStore.bind(null, fiber, hook, subscribe);
          updateEffectImpl(2048, Passive, create, [subscribe]);
          subscribe = hook.getSnapshot !== getSnapshot || cachedSnapshot || null !== workInProgressHook && (workInProgressHook.memoizedState.tag & HasEffect) !== NoFlags;
          pushSimpleEffect(
            subscribe ? HasEffect | Passive : Passive,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              hook,
              getServerSnapshot,
              getSnapshot
            ),
            null
          );
          if (subscribe) {
            fiber.flags |= 2048;
            if (null === workInProgressRoot)
              throw Error(
                "Expected a work-in-progress root. This is a bug in React. Please file an issue."
              );
            isHydrating$jscomp$0 || 0 !== (renderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
          }
          return getServerSnapshot;
        }
        function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
          fiber.flags |= 16384;
          fiber = { getSnapshot, value: renderedSnapshot };
          getSnapshot = currentlyRenderingFiber.updateQueue;
          null === getSnapshot ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, null === renderedSnapshot ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
        }
        function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
          inst.value = nextSnapshot;
          inst.getSnapshot = getSnapshot;
          checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
        }
        function subscribeToStore(fiber, inst, subscribe) {
          return subscribe(function() {
            checkIfSnapshotChanged(inst) && (startUpdateTimerByLane(2, "updateSyncExternalStore()", fiber), forceStoreRerender(fiber));
          });
        }
        function checkIfSnapshotChanged(inst) {
          var latestGetSnapshot = inst.getSnapshot;
          inst = inst.value;
          try {
            var nextValue = latestGetSnapshot();
            return !objectIs(inst, nextValue);
          } catch (error) {
            return true;
          }
        }
        function forceStoreRerender(fiber) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 2);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2);
        }
        function mountStateImpl(initialState) {
          var hook = mountWorkInProgressHook();
          if ("function" === typeof initialState) {
            var initialStateInitializer = initialState;
            initialState = initialStateInitializer();
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(true);
              try {
                initialStateInitializer();
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
          }
          hook.memoizedState = hook.baseState = initialState;
          hook.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialState
          };
          return hook;
        }
        function mountState(initialState) {
          initialState = mountStateImpl(initialState);
          var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
          queue.dispatch = dispatch;
          return [initialState.memoizedState, dispatch];
        }
        function mountOptimistic(passthrough) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = hook.baseState = passthrough;
          var queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null
          };
          hook.queue = queue;
          hook = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            true,
            queue
          );
          queue.dispatch = hook;
          return [passthrough, hook];
        }
        function updateOptimistic(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        }
        function updateOptimisticImpl(hook, current2, passthrough, reducer) {
          hook.baseState = passthrough;
          return updateReducerImpl(
            hook,
            currentHook,
            "function" === typeof reducer ? reducer : basicStateReducer
          );
        }
        function rerenderOptimistic(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          if (null !== currentHook)
            return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
          hook.baseState = passthrough;
          return [passthrough, hook.queue.dispatch];
        }
        function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
          if (isRenderPhaseUpdate(fiber))
            throw Error("Cannot update action state while rendering.");
          fiber = actionQueue.action;
          if (null !== fiber) {
            var actionNode = {
              payload,
              action: fiber,
              next: null,
              isTransition: true,
              status: "pending",
              value: null,
              reason: null,
              listeners: [],
              then: function(listener) {
                actionNode.listeners.push(listener);
              }
            };
            null !== ReactSharedInternals.T ? setPendingState(true) : actionNode.isTransition = false;
            setState(actionNode);
            setPendingState = actionQueue.pending;
            null === setPendingState ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
          }
        }
        function runActionStateAction(actionQueue, node) {
          var action = node.action, payload = node.payload, prevState = actionQueue.state;
          if (node.isTransition) {
            var prevTransition = ReactSharedInternals.T, currentTransition = {};
            currentTransition.types = null !== prevTransition ? prevTransition.types : null;
            currentTransition._updatedFibers = /* @__PURE__ */ new Set();
            ReactSharedInternals.T = currentTransition;
            try {
              var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
              null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
              handleActionReturnValue(actionQueue, node, returnValue);
            } catch (error) {
              onActionError(actionQueue, node, error);
            } finally {
              null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
                "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
              ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition, null === prevTransition && currentTransition._updatedFibers && (actionQueue = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < actionQueue && console.warn(
                "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
              ));
            }
          } else
            try {
              currentTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, currentTransition);
            } catch (error$2) {
              onActionError(actionQueue, node, error$2);
            }
        }
        function handleActionReturnValue(actionQueue, node, returnValue) {
          null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then ? (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(
            function(nextState) {
              onActionSuccess(actionQueue, node, nextState);
            },
            function(error) {
              return onActionError(actionQueue, node, error);
            }
          ), node.isTransition || console.error(
            "An async function with useActionState was called outside of a transition. This is likely not what you intended (for example, isPending will not update correctly). Either call the returned function inside startTransition, or pass it to an `action` or `formAction` prop."
          )) : onActionSuccess(actionQueue, node, returnValue);
        }
        function onActionSuccess(actionQueue, actionNode, nextState) {
          actionNode.status = "fulfilled";
          actionNode.value = nextState;
          notifyActionListeners(actionNode);
          actionQueue.state = nextState;
          actionNode = actionQueue.pending;
          null !== actionNode && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
        }
        function onActionError(actionQueue, actionNode, error) {
          var last = actionQueue.pending;
          actionQueue.pending = null;
          if (null !== last) {
            last = last.next;
            do
              actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
            while (actionNode !== last);
          }
          actionQueue.action = null;
        }
        function notifyActionListeners(actionNode) {
          actionNode = actionNode.listeners;
          for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
        }
        function actionStateReducer(oldState, newState) {
          return newState;
        }
        function mountActionState(action, initialStateProp) {
          if (isHydrating) {
            var ssrFormState = workInProgressRoot.formState;
            if (null !== ssrFormState) {
              a: {
                var isMatching = currentlyRenderingFiber;
                if (isHydrating) {
                  if (nextHydratableInstance) {
                    var markerInstance = canHydrateFormStateMarker(
                      nextHydratableInstance,
                      rootOrSingletonContext
                    );
                    if (markerInstance) {
                      nextHydratableInstance = getNextHydratableSibling(markerInstance);
                      isMatching = isFormStateMarkerMatching(markerInstance);
                      break a;
                    }
                  }
                  throwOnHydrationMismatch(isMatching);
                }
                isMatching = false;
              }
              isMatching && (initialStateProp = ssrFormState[0]);
            }
          }
          ssrFormState = mountWorkInProgressHook();
          ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
          isMatching = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: actionStateReducer,
            lastRenderedState: initialStateProp
          };
          ssrFormState.queue = isMatching;
          ssrFormState = dispatchSetState.bind(
            null,
            currentlyRenderingFiber,
            isMatching
          );
          isMatching.dispatch = ssrFormState;
          isMatching = mountStateImpl(false);
          var setPendingState = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            false,
            isMatching.queue
          );
          isMatching = mountWorkInProgressHook();
          markerInstance = {
            state: initialStateProp,
            dispatch: null,
            action,
            pending: null
          };
          isMatching.queue = markerInstance;
          ssrFormState = dispatchActionState.bind(
            null,
            currentlyRenderingFiber,
            markerInstance,
            setPendingState,
            ssrFormState
          );
          markerInstance.dispatch = ssrFormState;
          isMatching.memoizedState = action;
          return [initialStateProp, ssrFormState, false];
        }
        function updateActionState(action) {
          var stateHook = updateWorkInProgressHook();
          return updateActionStateImpl(stateHook, currentHook, action);
        }
        function updateActionStateImpl(stateHook, currentStateHook, action) {
          currentStateHook = updateReducerImpl(
            stateHook,
            currentStateHook,
            actionStateReducer
          )[0];
          stateHook = updateReducer(basicStateReducer)[0];
          if ("object" === typeof currentStateHook && null !== currentStateHook && "function" === typeof currentStateHook.then)
            try {
              var state = useThenable(currentStateHook);
            } catch (x) {
              if (x === SuspenseException) throw SuspenseActionException;
              throw x;
            }
          else state = currentStateHook;
          currentStateHook = updateWorkInProgressHook();
          var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
          action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(
            HasEffect | Passive,
            { destroy: void 0 },
            actionStateActionEffect.bind(null, actionQueue, action),
            null
          ));
          return [state, dispatch, stateHook];
        }
        function actionStateActionEffect(actionQueue, action) {
          actionQueue.action = action;
        }
        function rerenderActionState(action) {
          var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
          if (null !== currentStateHook)
            return updateActionStateImpl(stateHook, currentStateHook, action);
          updateWorkInProgressHook();
          stateHook = stateHook.memoizedState;
          currentStateHook = updateWorkInProgressHook();
          var dispatch = currentStateHook.queue.dispatch;
          currentStateHook.memoizedState = action;
          return [stateHook, dispatch, false];
        }
        function pushSimpleEffect(tag, inst, create, deps) {
          tag = { tag, create, deps, inst, next: null };
          inst = currentlyRenderingFiber.updateQueue;
          null === inst && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
          create = inst.lastEffect;
          null === create ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
          return tag;
        }
        function mountRef(initialValue) {
          var hook = mountWorkInProgressHook();
          initialValue = { current: initialValue };
          return hook.memoizedState = initialValue;
        }
        function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
          var hook = mountWorkInProgressHook();
          currentlyRenderingFiber.flags |= fiberFlags;
          hook.memoizedState = pushSimpleEffect(
            HasEffect | hookFlags,
            { destroy: void 0 },
            create,
            void 0 === deps ? null : deps
          );
        }
        function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
          var hook = updateWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var inst = hook.memoizedState.inst;
          null !== currentHook && null !== deps && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
            HasEffect | hookFlags,
            inst,
            create,
            deps
          ));
        }
        function mountEffect(create, deps) {
          (currentlyRenderingFiber.mode & 16) !== NoMode ? mountEffectImpl(545261568, Passive, create, deps) : mountEffectImpl(8390656, Passive, create, deps);
        }
        function useEffectEventImpl(payload) {
          currentlyRenderingFiber.flags |= 4;
          var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
          if (null === componentUpdateQueue)
            componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
          else {
            var events = componentUpdateQueue.events;
            null === events ? componentUpdateQueue.events = [payload] : events.push(payload);
          }
        }
        function mountEvent(callback) {
          var hook = mountWorkInProgressHook(), ref = { impl: callback };
          hook.memoizedState = ref;
          return function() {
            if ((executionContext & RenderContext) !== NoContext)
              throw Error(
                "A function wrapped in useEffectEvent can't be called during rendering."
              );
            return ref.impl.apply(void 0, arguments);
          };
        }
        function updateEvent(callback) {
          var ref = updateWorkInProgressHook().memoizedState;
          useEffectEventImpl({ ref, nextImpl: callback });
          return function() {
            if ((executionContext & RenderContext) !== NoContext)
              throw Error(
                "A function wrapped in useEffectEvent can't be called during rendering."
              );
            return ref.impl.apply(void 0, arguments);
          };
        }
        function mountLayoutEffect(create, deps) {
          var fiberFlags = 4194308;
          (currentlyRenderingFiber.mode & 16) !== NoMode && (fiberFlags |= 268435456);
          return mountEffectImpl(fiberFlags, Layout, create, deps);
        }
        function imperativeHandleEffect(create, ref) {
          if ("function" === typeof ref) {
            create = create();
            var refCleanup = ref(create);
            return function() {
              "function" === typeof refCleanup ? refCleanup() : ref(null);
            };
          }
          if (null !== ref && void 0 !== ref)
            return ref.hasOwnProperty("current") || console.error(
              "Expected useImperativeHandle() first argument to either be a ref callback or React.createRef() object. Instead received: %s.",
              "an object with keys {" + Object.keys(ref).join(", ") + "}"
            ), create = create(), ref.current = create, function() {
              ref.current = null;
            };
        }
        function mountImperativeHandle(ref, create, deps) {
          "function" !== typeof create && console.error(
            "Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.",
            null !== create ? typeof create : "null"
          );
          deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
          var fiberFlags = 4194308;
          (currentlyRenderingFiber.mode & 16) !== NoMode && (fiberFlags |= 268435456);
          mountEffectImpl(
            fiberFlags,
            Layout,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        }
        function updateImperativeHandle(ref, create, deps) {
          "function" !== typeof create && console.error(
            "Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.",
            null !== create ? typeof create : "null"
          );
          deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
          updateEffectImpl(
            4,
            Layout,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        }
        function mountCallback(callback, deps) {
          mountWorkInProgressHook().memoizedState = [
            callback,
            void 0 === deps ? null : deps
          ];
          return callback;
        }
        function updateCallback(callback, deps) {
          var hook = updateWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var prevState = hook.memoizedState;
          if (null !== deps && areHookInputsEqual(deps, prevState[1]))
            return prevState[0];
          hook.memoizedState = [callback, deps];
          return callback;
        }
        function mountMemo(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var nextValue = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          hook.memoizedState = [nextValue, deps];
          return nextValue;
        }
        function updateMemo(nextCreate, deps) {
          var hook = updateWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var prevState = hook.memoizedState;
          if (null !== deps && areHookInputsEqual(deps, prevState[1]))
            return prevState[0];
          prevState = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          hook.memoizedState = [prevState, deps];
          return prevState;
        }
        function mountDeferredValue(value, initialValue) {
          var hook = mountWorkInProgressHook();
          return mountDeferredValueImpl(hook, value, initialValue);
        }
        function updateDeferredValue(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        }
        function rerenderDeferredValue(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return null === currentHook ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        }
        function mountDeferredValueImpl(hook, value, initialValue) {
          if (void 0 === initialValue || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
            return hook.memoizedState = value;
          hook.memoizedState = initialValue;
          hook = requestDeferredLane();
          currentlyRenderingFiber.lanes |= hook;
          workInProgressRootSkippedLanes |= hook;
          return initialValue;
        }
        function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
          if (objectIs(value, prevValue)) return value;
          if (null !== currentTreeHiddenStackCursor.current)
            return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = true), hook;
          if (0 === (renderLanes & 106) || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
            return didReceiveUpdate = true, hook.memoizedState = value;
          hook = requestDeferredLane();
          currentlyRenderingFiber.lanes |= hook;
          workInProgressRootSkippedLanes |= hook;
          return prevValue;
        }
        function releaseAsyncTransition() {
          ReactSharedInternals.asyncTransitions--;
        }
        function startTransition(fiber, queue, pendingState, finishedState, callback) {
          var previousPriority = getCurrentUpdatePriority();
          setCurrentUpdatePriority(
            0 !== previousPriority && 8 > previousPriority ? previousPriority : 8
          );
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition.types = null !== prevTransition ? prevTransition.types : null;
          currentTransition._updatedFibers = /* @__PURE__ */ new Set();
          ReactSharedInternals.T = currentTransition;
          dispatchOptimisticSetState(fiber, false, queue, pendingState);
          try {
            var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            if (null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then) {
              ReactSharedInternals.asyncTransitions++;
              returnValue.then(releaseAsyncTransition, releaseAsyncTransition);
              var thenableForFinishedState = chainThenableValue(
                returnValue,
                finishedState
              );
              dispatchSetStateInternal(
                fiber,
                queue,
                thenableForFinishedState,
                requestUpdateLane(fiber)
              );
            } else
              dispatchSetStateInternal(
                fiber,
                queue,
                finishedState,
                requestUpdateLane(fiber)
              );
          } catch (error) {
            dispatchSetStateInternal(
              fiber,
              queue,
              { then: function() {
              }, status: "rejected", reason: error },
              requestUpdateLane(fiber)
            );
          } finally {
            setCurrentUpdatePriority(previousPriority), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
              "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
            ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition, null === prevTransition && currentTransition._updatedFibers && (fiber = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < fiber && console.warn(
              "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
            ));
          }
        }
        function ensureFormComponentIsStateful(formFiber) {
          var existingStateHook = formFiber.memoizedState;
          if (null !== existingStateHook) return existingStateHook;
          existingStateHook = {
            memoizedState: NotPendingTransition,
            baseState: NotPendingTransition,
            baseQueue: null,
            queue: {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: basicStateReducer,
              lastRenderedState: NotPendingTransition
            },
            next: null
          };
          var initialResetState = {};
          existingStateHook.next = {
            memoizedState: initialResetState,
            baseState: initialResetState,
            baseQueue: null,
            queue: {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: basicStateReducer,
              lastRenderedState: initialResetState
            },
            next: null
          };
          formFiber.memoizedState = existingStateHook;
          formFiber = formFiber.alternate;
          null !== formFiber && (formFiber.memoizedState = existingStateHook);
          return existingStateHook;
        }
        function mountTransition() {
          var stateHook = mountStateImpl(false);
          stateHook = startTransition.bind(
            null,
            currentlyRenderingFiber,
            stateHook.queue,
            true,
            false
          );
          mountWorkInProgressHook().memoizedState = stateHook;
          return [false, stateHook];
        }
        function updateTransition() {
          var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        }
        function rerenderTransition() {
          var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        }
        function useHostTransitionStatus() {
          return readContext(HostTransitionContext);
        }
        function mountId() {
          var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
          if (isHydrating) {
            var treeId = treeContextOverflow;
            var idWithLeadingBit = treeContextId;
            treeId = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + treeId;
            identifierPrefix = "_" + identifierPrefix + "R_" + treeId;
            treeId = localIdCounter++;
            0 < treeId && (identifierPrefix += "H" + treeId.toString(32));
            identifierPrefix += "_";
          } else
            treeId = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + treeId.toString(32) + "_";
          return hook.memoizedState = identifierPrefix;
        }
        function mountRefresh() {
          return mountWorkInProgressHook().memoizedState = refreshCache.bind(
            null,
            currentlyRenderingFiber
          );
        }
        function refreshCache(fiber, seedKey) {
          for (var provider = fiber.return; null !== provider; ) {
            switch (provider.tag) {
              case 24:
              case 3:
                var lane = requestUpdateLane(provider), refreshUpdate = createUpdate(lane), root2 = enqueueUpdate(provider, refreshUpdate, lane);
                null !== root2 && (startUpdateTimerByLane(lane, "refresh()", fiber), scheduleUpdateOnFiber(root2, provider, lane), entangleTransitions(root2, provider, lane));
                fiber = createCache();
                null !== seedKey && void 0 !== seedKey && null !== root2 && console.error(
                  "The seed argument is not enabled outside experimental channels."
                );
                refreshUpdate.payload = { cache: fiber };
                return;
            }
            provider = provider.return;
          }
        }
        function dispatchReducerAction(fiber, queue, action) {
          var args = arguments;
          "function" === typeof args[3] && console.error(
            "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
          );
          args = requestUpdateLane(fiber);
          var update = {
            lane: args,
            revertLane: 0,
            gesture: null,
            action,
            hasEagerState: false,
            eagerState: null,
            next: null
          };
          isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, update) : (update = enqueueConcurrentHookUpdate(fiber, queue, update, args), null !== update && (startUpdateTimerByLane(args, "dispatch()", fiber), scheduleUpdateOnFiber(update, fiber, args), entangleTransitionUpdate(update, queue, args)));
        }
        function dispatchSetState(fiber, queue, action) {
          var args = arguments;
          "function" === typeof args[3] && console.error(
            "State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect()."
          );
          args = requestUpdateLane(fiber);
          dispatchSetStateInternal(fiber, queue, action, args) && startUpdateTimerByLane(args, "setState()", fiber);
        }
        function dispatchSetStateInternal(fiber, queue, action, lane) {
          var update = {
            lane,
            revertLane: 0,
            gesture: null,
            action,
            hasEagerState: false,
            eagerState: null,
            next: null
          };
          if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
          else {
            var alternate = fiber.alternate;
            if (0 === fiber.lanes && (null === alternate || 0 === alternate.lanes) && (alternate = queue.lastRenderedReducer, null !== alternate)) {
              var prevDispatcher = ReactSharedInternals.H;
              ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
              try {
                var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
                update.hasEagerState = true;
                update.eagerState = eagerState;
                if (objectIs(eagerState, currentState))
                  return enqueueUpdate$1(fiber, queue, update, 0), null === workInProgressRoot && finishQueueingConcurrentUpdates(), false;
              } catch (error) {
              } finally {
                ReactSharedInternals.H = prevDispatcher;
              }
            }
            action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
            if (null !== action)
              return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), true;
          }
          return false;
        }
        function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
          null === ReactSharedInternals.T && 0 === currentEntangledLane && console.error(
            "An optimistic state update occurred outside a transition or action. To fix, move the update to an action, or wrap with startTransition."
          );
          action = {
            lane: 2,
            revertLane: requestTransitionLane(),
            gesture: null,
            action,
            hasEagerState: false,
            eagerState: null,
            next: null
          };
          if (isRenderPhaseUpdate(fiber)) {
            if (throwIfDuringRender)
              throw Error("Cannot update optimistic state while rendering.");
            console.error("Cannot call startTransition while rendering.");
          } else
            throwIfDuringRender = enqueueConcurrentHookUpdate(
              fiber,
              queue,
              action,
              2
            ), null !== throwIfDuringRender && (startUpdateTimerByLane(2, "setOptimistic()", fiber), scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2));
        }
        function isRenderPhaseUpdate(fiber) {
          var alternate = fiber.alternate;
          return fiber === currentlyRenderingFiber || null !== alternate && alternate === currentlyRenderingFiber;
        }
        function enqueueRenderPhaseUpdate(queue, update) {
          didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
          var pending3 = queue.pending;
          null === pending3 ? update.next = update : (update.next = pending3.next, pending3.next = update);
          queue.pending = update;
        }
        function entangleTransitionUpdate(root2, queue, lane) {
          if (0 !== (lane & 4194048)) {
            var queueLanes = queue.lanes;
            queueLanes &= root2.pendingLanes;
            lane |= queueLanes;
            queue.lanes = lane;
            markRootEntangled(root2, lane);
          }
        }
        function warnOnInvalidCallback(callback) {
          if (null !== callback && "function" !== typeof callback) {
            var key = String(callback);
            didWarnOnInvalidCallback.has(key) || (didWarnOnInvalidCallback.add(key), console.error(
              "Expected the last optional `callback` argument to be a function. Instead received: %s.",
              callback
            ));
          }
        }
        function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
          var prevState = workInProgress2.memoizedState, partialState = getDerivedStateFromProps(nextProps, prevState);
          if (workInProgress2.mode & 8) {
            setIsStrictModeForDevtools(true);
            try {
              partialState = getDerivedStateFromProps(nextProps, prevState);
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          void 0 === partialState && (ctor = getComponentNameFromType(ctor) || "Component", didWarnAboutUndefinedDerivedState.has(ctor) || (didWarnAboutUndefinedDerivedState.add(ctor), console.error(
            "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.",
            ctor
          )));
          prevState = null === partialState || void 0 === partialState ? prevState : assign({}, prevState, partialState);
          workInProgress2.memoizedState = prevState;
          0 === workInProgress2.lanes && (workInProgress2.updateQueue.baseState = prevState);
        }
        function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
          var instance = workInProgress2.stateNode;
          if ("function" === typeof instance.shouldComponentUpdate) {
            oldProps = instance.shouldComponentUpdate(
              newProps,
              newState,
              nextContext
            );
            if (workInProgress2.mode & 8) {
              setIsStrictModeForDevtools(true);
              try {
                oldProps = instance.shouldComponentUpdate(
                  newProps,
                  newState,
                  nextContext
                );
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
            void 0 === oldProps && console.error(
              "%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.",
              getComponentNameFromType(ctor) || "Component"
            );
            return oldProps;
          }
          return ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : true;
        }
        function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
          var oldState = instance.state;
          "function" === typeof instance.componentWillReceiveProps && instance.componentWillReceiveProps(newProps, nextContext);
          "function" === typeof instance.UNSAFE_componentWillReceiveProps && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
          instance.state !== oldState && (workInProgress2 = getComponentNameFromFiber(workInProgress2) || "Component", didWarnAboutStateAssignmentForComponent.has(workInProgress2) || (didWarnAboutStateAssignmentForComponent.add(workInProgress2), console.error(
            "%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
            workInProgress2
          )), classComponentUpdater.enqueueReplaceState(
            instance,
            instance.state,
            null
          ));
        }
        function resolveClassComponentProps(Component, baseProps) {
          var newProps = baseProps;
          if ("ref" in baseProps) {
            newProps = {};
            for (var propName in baseProps)
              "ref" !== propName && (newProps[propName] = baseProps[propName]);
          }
          if (Component = Component.defaultProps) {
            newProps === baseProps && (newProps = assign({}, newProps));
            for (var _propName in Component)
              void 0 === newProps[_propName] && (newProps[_propName] = Component[_propName]);
          }
          return newProps;
        }
        function logUncaughtError(root2, errorInfo) {
          try {
            componentName = errorInfo.source ? getComponentNameFromFiber(errorInfo.source) : null;
            errorBoundaryName = null;
            var error = errorInfo.value;
            if (null !== ReactSharedInternals.actQueue)
              ReactSharedInternals.thrownErrors.push(error);
            else {
              var onUncaughtError = root2.onUncaughtError;
              onUncaughtError(error, { componentStack: errorInfo.stack });
            }
          } catch (e) {
            setTimeout(function() {
              throw e;
            });
          }
        }
        function logCaughtError(root2, boundary, errorInfo) {
          try {
            componentName = errorInfo.source ? getComponentNameFromFiber(errorInfo.source) : null;
            errorBoundaryName = getComponentNameFromFiber(boundary);
            var onCaughtError = root2.onCaughtError;
            onCaughtError(errorInfo.value, {
              componentStack: errorInfo.stack,
              errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
            });
          } catch (e) {
            setTimeout(function() {
              throw e;
            });
          }
        }
        function createRootErrorUpdate(root2, errorInfo, lane) {
          lane = createUpdate(lane);
          lane.tag = CaptureUpdate;
          lane.payload = { element: null };
          lane.callback = function() {
            runWithFiberInDEV(errorInfo.source, logUncaughtError, root2, errorInfo);
          };
          return lane;
        }
        function createClassErrorUpdate(lane) {
          lane = createUpdate(lane);
          lane.tag = CaptureUpdate;
          return lane;
        }
        function initializeClassErrorUpdate(update, root2, fiber, errorInfo) {
          var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
          if ("function" === typeof getDerivedStateFromError) {
            var error = errorInfo.value;
            update.payload = function() {
              return getDerivedStateFromError(error);
            };
            update.callback = function() {
              markFailedErrorBoundaryForHotReloading(fiber);
              runWithFiberInDEV(
                errorInfo.source,
                logCaughtError,
                root2,
                fiber,
                errorInfo
              );
            };
          }
          var inst = fiber.stateNode;
          null !== inst && "function" === typeof inst.componentDidCatch && (update.callback = function() {
            markFailedErrorBoundaryForHotReloading(fiber);
            runWithFiberInDEV(
              errorInfo.source,
              logCaughtError,
              root2,
              fiber,
              errorInfo
            );
            "function" !== typeof getDerivedStateFromError && (null === legacyErrorBoundariesThatAlreadyFailed ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
            callComponentDidCatchInDEV(this, errorInfo);
            "function" === typeof getDerivedStateFromError || 0 === (fiber.lanes & 2) && console.error(
              "%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.",
              getComponentNameFromFiber(fiber) || "Unknown"
            );
          });
        }
        function throwException(root2, returnFiber, sourceFiber, value, rootRenderLanes) {
          sourceFiber.flags |= 32768;
          isDevToolsPresent && restorePendingUpdaters(root2, rootRenderLanes);
          if (null !== value && "object" === typeof value && "function" === typeof value.then) {
            returnFiber = sourceFiber.alternate;
            null !== returnFiber && propagateParentContextChanges(
              returnFiber,
              sourceFiber,
              rootRenderLanes,
              true
            );
            isHydrating && (didSuspendOrErrorDEV = true);
            sourceFiber = suspenseHandlerStackCursor.current;
            if (null !== sourceFiber) {
              switch (sourceFiber.tag) {
                case 31:
                case 13:
                case 19:
                  return null === shellBoundary ? renderDidSuspendDelayIfPossible() : null === sourceFiber.alternate && workInProgressRootExitStatus === RootInProgress && (workInProgressRootExitStatus = RootSuspended), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root2, value, rootRenderLanes)), false;
                case 22:
                  return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? (returnFiber = {
                    transitions: null,
                    markerInstances: null,
                    retryQueue: /* @__PURE__ */ new Set([value])
                  }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, null === sourceFiber ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root2, value, rootRenderLanes)), false;
              }
              throw Error(
                "Unexpected Suspense handler tag (" + sourceFiber.tag + "). This is a bug in React."
              );
            }
            attachPingListener(root2, value, rootRenderLanes);
            renderDidSuspendDelayIfPossible();
            return false;
          }
          if (isHydrating)
            return didSuspendOrErrorDEV = true, returnFiber = suspenseHandlerStackCursor.current, null !== returnFiber ? (19 === returnFiber.tag && console.error(
              "SuspenseList should never catch while hydrating. This is a bug in React."
            ), 0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && queueHydrationError(
              createCapturedValueAtFiber(
                Error(
                  "There was an error while hydrating but React was able to recover by instead client rendering from the nearest Suspense boundary.",
                  { cause: value }
                ),
                sourceFiber
              )
            )) : (value !== HydrationMismatchException && queueHydrationError(
              createCapturedValueAtFiber(
                Error(
                  "There was an error while hydrating but React was able to recover by instead client rendering the entire root.",
                  { cause: value }
                ),
                sourceFiber
              )
            ), root2 = root2.current.alternate, root2.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root2.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(
              root2.stateNode,
              value,
              rootRenderLanes
            ), enqueueCapturedUpdate(root2, rootRenderLanes), workInProgressRootExitStatus !== RootSuspendedWithDelay && (workInProgressRootExitStatus = RootErrored)), false;
          var error = createCapturedValueAtFiber(
            Error(
              "There was an error during concurrent rendering but React was able to recover by instead synchronously rendering the entire root.",
              { cause: value }
            ),
            sourceFiber
          );
          null === workInProgressRootConcurrentErrors ? workInProgressRootConcurrentErrors = [error] : workInProgressRootConcurrentErrors.push(error);
          workInProgressRootExitStatus !== RootSuspendedWithDelay && (workInProgressRootExitStatus = RootErrored);
          if (null === returnFiber) return true;
          value = createCapturedValueAtFiber(value, sourceFiber);
          sourceFiber = returnFiber;
          do {
            switch (sourceFiber.tag) {
              case 3:
                return sourceFiber.flags |= 65536, root2 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root2, root2 = createRootErrorUpdate(
                  sourceFiber.stateNode,
                  value,
                  root2
                ), enqueueCapturedUpdate(sourceFiber, root2), false;
              case 1:
                returnFiber = sourceFiber.type;
                error = sourceFiber.stateNode;
                if (0 === (sourceFiber.flags & 128) && ("function" === typeof returnFiber.getDerivedStateFromError || null !== error && "function" === typeof error.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(error))))
                  return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(
                    rootRenderLanes,
                    root2,
                    sourceFiber,
                    value
                  ), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), false;
                break;
              case 22:
                if (null !== sourceFiber.memoizedState)
                  return sourceFiber.flags |= 65536, false;
            }
            sourceFiber = sourceFiber.return;
          } while (null !== sourceFiber);
          return false;
        }
        function reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2) {
          workInProgress2.child = null === current2 ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(
            workInProgress2,
            current2.child,
            nextChildren,
            renderLanes2
          );
        }
        function updateForwardRef(current2, workInProgress2, Component, nextProps, renderLanes2) {
          Component = Component.render;
          var resolvedRender = resolveTypeForHotReloading(Component);
          resolvedRender !== Component && (Component = resolvedRender, null !== current2 && (didReceiveUpdate = true));
          resolvedRender = workInProgress2.ref;
          if ("ref" in nextProps) {
            var propsWithoutRef = {};
            for (var key in nextProps)
              "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
          } else propsWithoutRef = nextProps;
          prepareToReadContext(workInProgress2);
          nextProps = renderWithHooks(
            current2,
            workInProgress2,
            Component,
            propsWithoutRef,
            resolvedRender,
            renderLanes2
          );
          key = checkDidRenderIdHook();
          if (null !== current2 && !didReceiveUpdate)
            return bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
          isHydrating && key && pushMaterializedTreeId(workInProgress2);
          workInProgress2.flags |= 1;
          reconcileChildren(current2, workInProgress2, nextProps, renderLanes2);
          return workInProgress2.child;
        }
        function updateMemoComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
          if (null === current2) {
            var type = Component.type;
            if ("function" === typeof type && !shouldConstruct(type) && void 0 === type.defaultProps && null === Component.compare)
              return Component = resolveTypeForHotReloading(type), workInProgress2.tag = 15, workInProgress2.type = Component, validateFunctionComponentInDev(workInProgress2, type), updateSimpleMemoComponent(
                current2,
                workInProgress2,
                Component,
                nextProps,
                renderLanes2
              );
            current2 = createFiberFromTypeAndProps(
              Component.type,
              null,
              nextProps,
              workInProgress2,
              workInProgress2.mode,
              renderLanes2
            );
            current2.ref = workInProgress2.ref;
            current2.return = workInProgress2;
            return workInProgress2.child = current2;
          }
          type = current2.child;
          if (!checkScheduledUpdateOrContext(current2, renderLanes2)) {
            var prevProps = type.memoizedProps;
            Component = Component.compare;
            Component = null !== Component ? Component : shallowEqual;
            if (Component(prevProps, nextProps) && current2.ref === workInProgress2.ref)
              return bailoutOnAlreadyFinishedWork(
                current2,
                workInProgress2,
                renderLanes2
              );
          }
          workInProgress2.flags |= 1;
          current2 = createWorkInProgress(type, nextProps);
          current2.ref = workInProgress2.ref;
          current2.return = workInProgress2;
          return workInProgress2.child = current2;
        }
        function updateSimpleMemoComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
          if (null !== current2) {
            var prevProps = current2.memoizedProps;
            if (shallowEqual(prevProps, nextProps) && current2.ref === workInProgress2.ref && workInProgress2.type === current2.type)
              if (didReceiveUpdate = false, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current2, renderLanes2))
                0 !== (current2.flags & 131072) && (didReceiveUpdate = true);
              else
                return workInProgress2.lanes = current2.lanes, bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
          }
          return updateFunctionComponent(
            current2,
            workInProgress2,
            Component,
            nextProps,
            renderLanes2
          );
        }
        function updateOffscreenComponent(current2, workInProgress2, renderLanes2, nextProps) {
          var nextChildren = nextProps.children, prevState = null !== current2 ? current2.memoizedState : null;
          null === current2 && null === workInProgress2.stateNode && (workInProgress2.stateNode = {
            _visibility: OffscreenVisible,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
          });
          if ("hidden" === nextProps.mode) {
            if (0 !== (workInProgress2.flags & 128)) {
              prevState = null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2;
              if (null !== current2) {
                nextProps = workInProgress2.child = current2.child;
                for (nextChildren = 0; null !== nextProps; )
                  nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
                nextProps = nextChildren & ~prevState;
              } else nextProps = 0, workInProgress2.child = null;
              return deferHiddenOffscreenComponent(
                current2,
                workInProgress2,
                prevState,
                renderLanes2,
                nextProps
              );
            }
            if (0 !== (renderLanes2 & 536870912))
              workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, null !== current2 && pushTransition(
                workInProgress2,
                null !== prevState ? prevState.cachePool : null
              ), null !== prevState ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(workInProgress2), pushOffscreenSuspenseHandler(workInProgress2);
            else
              return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(
                current2,
                workInProgress2,
                null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2,
                renderLanes2,
                nextProps
              );
          } else
            null !== prevState ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.memoizedState = null) : (null !== current2 && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(workInProgress2), reuseSuspenseHandlerOnStack(workInProgress2));
          reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2);
          return workInProgress2.child;
        }
        function bailoutOffscreenComponent(current2, workInProgress2) {
          null !== current2 && 22 === current2.tag || null !== workInProgress2.stateNode || (workInProgress2.stateNode = {
            _visibility: OffscreenVisible,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
          });
          return workInProgress2.sibling;
        }
        function deferHiddenOffscreenComponent(current2, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
          var JSCompiler_inline_result = peekCacheFromPool();
          JSCompiler_inline_result = null === JSCompiler_inline_result ? null : {
            parent: isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2,
            pool: JSCompiler_inline_result
          };
          workInProgress2.memoizedState = {
            baseLanes: nextBaseLanes,
            cachePool: JSCompiler_inline_result
          };
          null !== current2 && pushTransition(workInProgress2, null);
          reuseHiddenContextOnStack(workInProgress2);
          pushOffscreenSuspenseHandler(workInProgress2);
          null !== current2 && propagateParentContextChanges(current2, workInProgress2, renderLanes2, true);
          workInProgress2.childLanes = remainingChildLanes;
          return null;
        }
        function mountActivityChildren(workInProgress2, nextProps) {
          var hiddenProp = nextProps.hidden;
          void 0 !== hiddenProp && console.error(
            `<Activity> doesn't accept a hidden prop. Use mode="hidden" instead.
- <Activity %s>
+ <Activity %s>`,
            true === hiddenProp ? "hidden" : false === hiddenProp ? "hidden={false}" : "hidden={...}",
            hiddenProp ? 'mode="hidden"' : 'mode="visible"'
          );
          nextProps = mountWorkInProgressOffscreenFiber(
            { mode: nextProps.mode, children: nextProps.children },
            workInProgress2.mode
          );
          nextProps.ref = workInProgress2.ref;
          workInProgress2.child = nextProps;
          nextProps.return = workInProgress2;
          return nextProps;
        }
        function retryActivityComponentWithoutHydrating(current2, workInProgress2, renderLanes2) {
          reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2);
          current2 = mountActivityChildren(
            workInProgress2,
            workInProgress2.pendingProps
          );
          current2.flags |= 2;
          popSuspenseHandler(workInProgress2);
          workInProgress2.memoizedState = null;
          return current2;
        }
        function updateActivityComponent(current2, workInProgress2, renderLanes2) {
          var nextProps = workInProgress2.pendingProps, didSuspend = 0 !== (workInProgress2.flags & 128);
          workInProgress2.flags &= -129;
          if (null === current2) {
            if (isHydrating) {
              if ("hidden" === nextProps.mode)
                return current2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, current2.memoizedState = { baseLanes: 0, cachePool: null }, bailoutOffscreenComponent(null, current2);
              pushDehydratedActivitySuspenseHandler(workInProgress2);
              (current2 = nextHydratableInstance) ? (renderLanes2 = canHydrateActivityInstance(
                current2,
                rootOrSingletonContext
              ), null !== renderLanes2 && (nextProps = {
                dehydrated: renderLanes2,
                treeContext: getSuspendedTreeContext(),
                retryLane: 536870912,
                hydrationErrors: null
              }, workInProgress2.memoizedState = nextProps, nextProps = createFiberFromDehydratedFragment(renderLanes2), nextProps.return = workInProgress2, workInProgress2.child = nextProps, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : renderLanes2 = null;
              if (null === renderLanes2)
                throw warnNonHydratedInstance(workInProgress2, current2), throwOnHydrationMismatch(workInProgress2);
              workInProgress2.lanes = 536870912;
              return null;
            }
            return mountActivityChildren(workInProgress2, nextProps);
          }
          var prevState = current2.memoizedState;
          if (null !== prevState) {
            var activityInstance = prevState.dehydrated;
            pushDehydratedActivitySuspenseHandler(workInProgress2);
            if (didSuspend)
              if (workInProgress2.flags & 256)
                workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(
                  current2,
                  workInProgress2,
                  renderLanes2
                );
              else if (null !== workInProgress2.memoizedState)
                workInProgress2.child = current2.child, workInProgress2.flags |= 128, workInProgress2 = null;
              else
                throw Error(
                  "Client rendering an Activity suspended it again. This is a bug in React."
                );
            else if (warnIfHydrating(), 0 !== (renderLanes2 & 536870912) && markRenderDerivedCause(workInProgress2), didReceiveUpdate || propagateParentContextChanges(
              current2,
              workInProgress2,
              renderLanes2,
              false
            ), didSuspend = 0 !== (renderLanes2 & current2.childLanes), didReceiveUpdate || didSuspend) {
              if (null === currentTreeHiddenStackCursor.current) {
                nextProps = workInProgressRoot;
                if (null !== nextProps && (activityInstance = getBumpedLaneForHydration(
                  nextProps,
                  renderLanes2
                ), 0 !== activityInstance && activityInstance !== prevState.retryLane))
                  throw prevState.retryLane = activityInstance, enqueueConcurrentRenderForLane(current2, activityInstance), scheduleUpdateOnFiber(nextProps, current2, activityInstance), SelectiveHydrationException;
                renderDidSuspendDelayIfPossible();
              }
              workInProgress2 = retryActivityComponentWithoutHydrating(
                current2,
                workInProgress2,
                renderLanes2
              );
            } else
              current2 = prevState.treeContext, supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinActivityInstance(
                activityInstance
              ), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, didSuspendOrErrorDEV = false, hydrationDiffRootDEV = null, rootOrSingletonContext = false, null !== current2 && restoreSuspendedTreeContext(workInProgress2, current2)), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 134221824;
            return workInProgress2;
          }
          prevState = current2.child;
          nextProps = { mode: nextProps.mode, children: nextProps.children };
          0 !== (renderLanes2 & 536870912) && 0 !== (renderLanes2 & current2.lanes) && markRenderDerivedCause(workInProgress2);
          current2 = createWorkInProgress(prevState, nextProps);
          current2.ref = workInProgress2.ref;
          workInProgress2.child = current2;
          current2.return = workInProgress2;
          return current2;
        }
        function markRef(current2, workInProgress2) {
          var ref = workInProgress2.ref;
          if (null === ref)
            null !== current2 && null !== current2.ref && (workInProgress2.flags |= 4194816);
          else {
            if ("function" !== typeof ref && "object" !== typeof ref)
              throw Error(
                "Expected ref to be a function, an object returned by React.createRef(), or undefined/null."
              );
            if (null === current2 || current2.ref !== ref)
              workInProgress2.flags |= 4194816;
          }
        }
        function updateFunctionComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
          if (Component.prototype && "function" === typeof Component.prototype.render) {
            var componentName2 = getComponentNameFromType(Component) || "Unknown";
            didWarnAboutBadClass[componentName2] || (console.error(
              "The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.",
              componentName2,
              componentName2
            ), didWarnAboutBadClass[componentName2] = true);
          }
          workInProgress2.mode & 8 && ReactStrictModeWarnings.recordLegacyContextWarning(
            workInProgress2,
            null
          );
          null === current2 && (validateFunctionComponentInDev(workInProgress2, workInProgress2.type), Component.contextTypes && (componentName2 = getComponentNameFromType(Component) || "Unknown", didWarnAboutContextTypes[componentName2] || (didWarnAboutContextTypes[componentName2] = true, console.error(
            "%s uses the legacy contextTypes API which was removed in React 19. Use React.createContext() with React.useContext() instead. (https://react.dev/link/legacy-context)",
            componentName2
          ))));
          prepareToReadContext(workInProgress2);
          Component = renderWithHooks(
            current2,
            workInProgress2,
            Component,
            nextProps,
            void 0,
            renderLanes2
          );
          nextProps = checkDidRenderIdHook();
          if (null !== current2 && !didReceiveUpdate)
            return bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
          isHydrating && nextProps && pushMaterializedTreeId(workInProgress2);
          workInProgress2.flags |= 1;
          reconcileChildren(current2, workInProgress2, Component, renderLanes2);
          return workInProgress2.child;
        }
        function replayFunctionComponent(current2, workInProgress2, nextProps, Component, secondArg, renderLanes2) {
          prepareToReadContext(workInProgress2);
          hookTypesUpdateIndexDev = -1;
          ignorePreviousDependencies = null !== current2 && current2.type !== workInProgress2.type;
          workInProgress2.updateQueue = null;
          nextProps = renderWithHooksAgain(
            workInProgress2,
            Component,
            nextProps,
            secondArg
          );
          finishRenderingHooks(current2, workInProgress2);
          Component = checkDidRenderIdHook();
          if (null !== current2 && !didReceiveUpdate)
            return bailoutHooks(current2, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
          isHydrating && Component && pushMaterializedTreeId(workInProgress2);
          workInProgress2.flags |= 1;
          reconcileChildren(current2, workInProgress2, nextProps, renderLanes2);
          return workInProgress2.child;
        }
        function updateClassComponent(current2, workInProgress2, Component, nextProps, renderLanes2) {
          switch (shouldErrorImpl(workInProgress2)) {
            case false:
              var _instance = workInProgress2.stateNode, state = new workInProgress2.type(
                workInProgress2.memoizedProps,
                _instance.context
              ).state;
              _instance.updater.enqueueSetState(_instance, state, null);
              break;
            case true:
              workInProgress2.flags |= 128;
              workInProgress2.flags |= 65536;
              _instance = Error("Simulated error coming from DevTools");
              var lane = renderLanes2 & -renderLanes2;
              workInProgress2.lanes |= lane;
              state = workInProgressRoot;
              if (null === state)
                throw Error(
                  "Expected a work-in-progress root. This is a bug in React. Please file an issue."
                );
              lane = createClassErrorUpdate(lane);
              initializeClassErrorUpdate(
                lane,
                state,
                workInProgress2,
                createCapturedValueAtFiber(_instance, workInProgress2)
              );
              enqueueCapturedUpdate(workInProgress2, lane);
          }
          prepareToReadContext(workInProgress2);
          if (null === workInProgress2.stateNode) {
            state = emptyContextObject;
            _instance = Component.contextType;
            "contextType" in Component && null !== _instance && (void 0 === _instance || _instance.$$typeof !== REACT_CONTEXT_TYPE) && !didWarnAboutInvalidateContextType.has(Component) && (didWarnAboutInvalidateContextType.add(Component), lane = void 0 === _instance ? " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : "object" !== typeof _instance ? " However, it is set to a " + typeof _instance + "." : _instance.$$typeof === REACT_CONSUMER_TYPE ? " Did you accidentally pass the Context.Consumer instead?" : " However, it is set to an object with keys {" + Object.keys(_instance).join(", ") + "}.", console.error(
              "%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s",
              getComponentNameFromType(Component) || "Component",
              lane
            ));
            "object" === typeof _instance && null !== _instance && (state = readContext(_instance));
            _instance = new Component(nextProps, state);
            if (workInProgress2.mode & 8) {
              setIsStrictModeForDevtools(true);
              try {
                _instance = new Component(nextProps, state);
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
            state = workInProgress2.memoizedState = null !== _instance.state && void 0 !== _instance.state ? _instance.state : null;
            _instance.updater = classComponentUpdater;
            workInProgress2.stateNode = _instance;
            _instance._reactInternals = workInProgress2;
            _instance._reactInternalInstance = fakeInternalInstance;
            "function" === typeof Component.getDerivedStateFromProps && null === state && (state = getComponentNameFromType(Component) || "Component", didWarnAboutUninitializedState.has(state) || (didWarnAboutUninitializedState.add(state), console.error(
              "`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
              state,
              null === _instance.state ? "null" : "undefined",
              state
            )));
            if ("function" === typeof Component.getDerivedStateFromProps || "function" === typeof _instance.getSnapshotBeforeUpdate) {
              var foundWillUpdateName = lane = state = null;
              "function" === typeof _instance.componentWillMount && true !== _instance.componentWillMount.__suppressDeprecationWarning ? state = "componentWillMount" : "function" === typeof _instance.UNSAFE_componentWillMount && (state = "UNSAFE_componentWillMount");
              "function" === typeof _instance.componentWillReceiveProps && true !== _instance.componentWillReceiveProps.__suppressDeprecationWarning ? lane = "componentWillReceiveProps" : "function" === typeof _instance.UNSAFE_componentWillReceiveProps && (lane = "UNSAFE_componentWillReceiveProps");
              "function" === typeof _instance.componentWillUpdate && true !== _instance.componentWillUpdate.__suppressDeprecationWarning ? foundWillUpdateName = "componentWillUpdate" : "function" === typeof _instance.UNSAFE_componentWillUpdate && (foundWillUpdateName = "UNSAFE_componentWillUpdate");
              if (null !== state || null !== lane || null !== foundWillUpdateName) {
                _instance = getComponentNameFromType(Component) || "Component";
                var newApiName = "function" === typeof Component.getDerivedStateFromProps ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
                didWarnAboutLegacyLifecyclesAndDerivedState.has(_instance) || (didWarnAboutLegacyLifecyclesAndDerivedState.add(_instance), console.error(
                  "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\nThe above lifecycles should be removed. Learn more about this warning here:\nhttps://react.dev/link/unsafe-component-lifecycles",
                  _instance,
                  newApiName,
                  null !== state ? "\n  " + state : "",
                  null !== lane ? "\n  " + lane : "",
                  null !== foundWillUpdateName ? "\n  " + foundWillUpdateName : ""
                ));
              }
            }
            _instance = workInProgress2.stateNode;
            state = getComponentNameFromType(Component) || "Component";
            _instance.render || (Component.prototype && "function" === typeof Component.prototype.render ? console.error(
              "No `render` method found on the %s instance: did you accidentally return an object from the constructor?",
              state
            ) : console.error(
              "No `render` method found on the %s instance: you may have forgotten to define `render`.",
              state
            ));
            !_instance.getInitialState || _instance.getInitialState.isReactClassApproved || _instance.state || console.error(
              "getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?",
              state
            );
            _instance.getDefaultProps && !_instance.getDefaultProps.isReactClassApproved && console.error(
              "getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.",
              state
            );
            _instance.contextType && console.error(
              "contextType was defined as an instance property on %s. Use a static property to define contextType instead.",
              state
            );
            Component.childContextTypes && !didWarnAboutChildContextTypes.has(Component) && (didWarnAboutChildContextTypes.add(Component), console.error(
              "%s uses the legacy childContextTypes API which was removed in React 19. Use React.createContext() instead. (https://react.dev/link/legacy-context)",
              state
            ));
            Component.contextTypes && !didWarnAboutContextTypes$1.has(Component) && (didWarnAboutContextTypes$1.add(Component), console.error(
              "%s uses the legacy contextTypes API which was removed in React 19. Use React.createContext() with static contextType instead. (https://react.dev/link/legacy-context)",
              state
            ));
            "function" === typeof _instance.componentShouldUpdate && console.error(
              "%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.",
              state
            );
            Component.prototype && Component.prototype.isPureReactComponent && "undefined" !== typeof _instance.shouldComponentUpdate && console.error(
              "%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.",
              getComponentNameFromType(Component) || "A pure component"
            );
            "function" === typeof _instance.componentDidUnmount && console.error(
              "%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?",
              state
            );
            "function" === typeof _instance.componentDidReceiveProps && console.error(
              "%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
              state
            );
            "function" === typeof _instance.componentWillRecieveProps && console.error(
              "%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
              state
            );
            "function" === typeof _instance.UNSAFE_componentWillRecieveProps && console.error(
              "%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
              state
            );
            lane = _instance.props !== nextProps;
            void 0 !== _instance.props && lane && console.error(
              "When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.",
              state
            );
            _instance.defaultProps && console.error(
              "Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.",
              state,
              state
            );
            "function" !== typeof _instance.getSnapshotBeforeUpdate || "function" === typeof _instance.componentDidUpdate || didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(Component) || (didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(Component), console.error(
              "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.",
              getComponentNameFromType(Component)
            ));
            "function" === typeof _instance.getDerivedStateFromProps && console.error(
              "%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
              state
            );
            "function" === typeof _instance.getDerivedStateFromError && console.error(
              "%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.",
              state
            );
            "function" === typeof Component.getSnapshotBeforeUpdate && console.error(
              "%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.",
              state
            );
            (lane = _instance.state) && ("object" !== typeof lane || isArrayImpl(lane)) && console.error("%s.state: must be set to an object or null", state);
            "function" === typeof _instance.getChildContext && "object" !== typeof Component.childContextTypes && console.error(
              "%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().",
              state
            );
            _instance = workInProgress2.stateNode;
            _instance.props = nextProps;
            _instance.state = workInProgress2.memoizedState;
            _instance.refs = {};
            initializeUpdateQueue(workInProgress2);
            state = Component.contextType;
            _instance.context = "object" === typeof state && null !== state ? readContext(state) : emptyContextObject;
            _instance.state === nextProps && (state = getComponentNameFromType(Component) || "Component", didWarnAboutDirectlyAssigningPropsToState.has(state) || (didWarnAboutDirectlyAssigningPropsToState.add(state), console.error(
              "%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.",
              state
            )));
            workInProgress2.mode & 8 && ReactStrictModeWarnings.recordLegacyContextWarning(
              workInProgress2,
              _instance
            );
            ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(
              workInProgress2,
              _instance
            );
            _instance.state = workInProgress2.memoizedState;
            state = Component.getDerivedStateFromProps;
            "function" === typeof state && (applyDerivedStateFromProps(
              workInProgress2,
              Component,
              state,
              nextProps
            ), _instance.state = workInProgress2.memoizedState);
            "function" === typeof Component.getDerivedStateFromProps || "function" === typeof _instance.getSnapshotBeforeUpdate || "function" !== typeof _instance.UNSAFE_componentWillMount && "function" !== typeof _instance.componentWillMount || (state = _instance.state, "function" === typeof _instance.componentWillMount && _instance.componentWillMount(), "function" === typeof _instance.UNSAFE_componentWillMount && _instance.UNSAFE_componentWillMount(), state !== _instance.state && (console.error(
              "%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.",
              getComponentNameFromFiber(workInProgress2) || "Component"
            ), classComponentUpdater.enqueueReplaceState(
              _instance,
              _instance.state,
              null
            )), processUpdateQueue(workInProgress2, nextProps, _instance, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), _instance.state = workInProgress2.memoizedState);
            "function" === typeof _instance.componentDidMount && (workInProgress2.flags |= 4194308);
            (workInProgress2.mode & 16) !== NoMode && (workInProgress2.flags |= 268435456);
            _instance = true;
          } else if (null === current2) {
            _instance = workInProgress2.stateNode;
            var unresolvedOldProps = workInProgress2.memoizedProps;
            lane = resolveClassComponentProps(Component, unresolvedOldProps);
            _instance.props = lane;
            var oldContext = _instance.context;
            foundWillUpdateName = Component.contextType;
            state = emptyContextObject;
            "object" === typeof foundWillUpdateName && null !== foundWillUpdateName && (state = readContext(foundWillUpdateName));
            newApiName = Component.getDerivedStateFromProps;
            foundWillUpdateName = "function" === typeof newApiName || "function" === typeof _instance.getSnapshotBeforeUpdate;
            unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps;
            foundWillUpdateName || "function" !== typeof _instance.UNSAFE_componentWillReceiveProps && "function" !== typeof _instance.componentWillReceiveProps || (unresolvedOldProps || oldContext !== state) && callComponentWillReceiveProps(
              workInProgress2,
              _instance,
              nextProps,
              state
            );
            hasForceUpdate = false;
            var oldState = workInProgress2.memoizedState;
            _instance.state = oldState;
            processUpdateQueue(workInProgress2, nextProps, _instance, renderLanes2);
            suspendIfUpdateReadFromEntangledAsyncAction();
            oldContext = workInProgress2.memoizedState;
            unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? ("function" === typeof newApiName && (applyDerivedStateFromProps(
              workInProgress2,
              Component,
              newApiName,
              nextProps
            ), oldContext = workInProgress2.memoizedState), (lane = hasForceUpdate || checkShouldComponentUpdate(
              workInProgress2,
              Component,
              lane,
              nextProps,
              oldState,
              oldContext,
              state
            )) ? (foundWillUpdateName || "function" !== typeof _instance.UNSAFE_componentWillMount && "function" !== typeof _instance.componentWillMount || ("function" === typeof _instance.componentWillMount && _instance.componentWillMount(), "function" === typeof _instance.UNSAFE_componentWillMount && _instance.UNSAFE_componentWillMount()), "function" === typeof _instance.componentDidMount && (workInProgress2.flags |= 4194308), (workInProgress2.mode & 16) !== NoMode && (workInProgress2.flags |= 268435456)) : ("function" === typeof _instance.componentDidMount && (workInProgress2.flags |= 4194308), (workInProgress2.mode & 16) !== NoMode && (workInProgress2.flags |= 268435456), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), _instance.props = nextProps, _instance.state = oldContext, _instance.context = state, _instance = lane) : ("function" === typeof _instance.componentDidMount && (workInProgress2.flags |= 4194308), (workInProgress2.mode & 16) !== NoMode && (workInProgress2.flags |= 268435456), _instance = false);
          } else {
            _instance = workInProgress2.stateNode;
            cloneUpdateQueue(current2, workInProgress2);
            state = workInProgress2.memoizedProps;
            foundWillUpdateName = resolveClassComponentProps(Component, state);
            _instance.props = foundWillUpdateName;
            newApiName = workInProgress2.pendingProps;
            oldState = _instance.context;
            oldContext = Component.contextType;
            lane = emptyContextObject;
            "object" === typeof oldContext && null !== oldContext && (lane = readContext(oldContext));
            unresolvedOldProps = Component.getDerivedStateFromProps;
            (oldContext = "function" === typeof unresolvedOldProps || "function" === typeof _instance.getSnapshotBeforeUpdate) || "function" !== typeof _instance.UNSAFE_componentWillReceiveProps && "function" !== typeof _instance.componentWillReceiveProps || (state !== newApiName || oldState !== lane) && callComponentWillReceiveProps(
              workInProgress2,
              _instance,
              nextProps,
              lane
            );
            hasForceUpdate = false;
            oldState = workInProgress2.memoizedState;
            _instance.state = oldState;
            processUpdateQueue(workInProgress2, nextProps, _instance, renderLanes2);
            suspendIfUpdateReadFromEntangledAsyncAction();
            var newState = workInProgress2.memoizedState;
            state !== newApiName || oldState !== newState || hasForceUpdate || null !== current2 && null !== current2.dependencies && checkIfContextChanged(current2.dependencies) ? ("function" === typeof unresolvedOldProps && (applyDerivedStateFromProps(
              workInProgress2,
              Component,
              unresolvedOldProps,
              nextProps
            ), newState = workInProgress2.memoizedState), (foundWillUpdateName = hasForceUpdate || checkShouldComponentUpdate(
              workInProgress2,
              Component,
              foundWillUpdateName,
              nextProps,
              oldState,
              newState,
              lane
            ) || null !== current2 && null !== current2.dependencies && checkIfContextChanged(current2.dependencies)) ? (oldContext || "function" !== typeof _instance.UNSAFE_componentWillUpdate && "function" !== typeof _instance.componentWillUpdate || ("function" === typeof _instance.componentWillUpdate && _instance.componentWillUpdate(nextProps, newState, lane), "function" === typeof _instance.UNSAFE_componentWillUpdate && _instance.UNSAFE_componentWillUpdate(
              nextProps,
              newState,
              lane
            )), "function" === typeof _instance.componentDidUpdate && (workInProgress2.flags |= 4), "function" === typeof _instance.getSnapshotBeforeUpdate && (workInProgress2.flags |= 1024)) : ("function" !== typeof _instance.componentDidUpdate || state === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof _instance.getSnapshotBeforeUpdate || state === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), _instance.props = nextProps, _instance.state = newState, _instance.context = lane, _instance = foundWillUpdateName) : ("function" !== typeof _instance.componentDidUpdate || state === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof _instance.getSnapshotBeforeUpdate || state === current2.memoizedProps && oldState === current2.memoizedState || (workInProgress2.flags |= 1024), _instance = false);
          }
          lane = _instance;
          markRef(current2, workInProgress2);
          state = 0 !== (workInProgress2.flags & 128);
          if (lane || state) {
            lane = workInProgress2.stateNode;
            setCurrentFiber(workInProgress2);
            if (state && "function" !== typeof Component.getDerivedStateFromError)
              Component = null, profilerStartTime = -1;
            else if (Component = callRenderInDEV(lane), workInProgress2.mode & 8) {
              setIsStrictModeForDevtools(true);
              try {
                callRenderInDEV(lane);
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
            workInProgress2.flags |= 1;
            null !== current2 && state ? (workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              current2.child,
              null,
              renderLanes2
            ), workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              null,
              Component,
              renderLanes2
            )) : reconcileChildren(current2, workInProgress2, Component, renderLanes2);
            workInProgress2.memoizedState = lane.state;
            current2 = workInProgress2.child;
          } else
            current2 = bailoutOnAlreadyFinishedWork(
              current2,
              workInProgress2,
              renderLanes2
            );
          renderLanes2 = workInProgress2.stateNode;
          _instance && renderLanes2.props !== nextProps && (didWarnAboutReassigningProps || console.error(
            "It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.",
            getComponentNameFromFiber(workInProgress2) || "a component"
          ), didWarnAboutReassigningProps = true);
          return current2;
        }
        function mountHostRootWithoutHydrating(current2, workInProgress2, nextChildren, renderLanes2) {
          resetHydrationState();
          workInProgress2.flags |= 256;
          reconcileChildren(current2, workInProgress2, nextChildren, renderLanes2);
          return workInProgress2.child;
        }
        function validateFunctionComponentInDev(workInProgress2, Component) {
          Component && Component.childContextTypes && console.error(
            "childContextTypes cannot be defined on a function component.\n  %s.childContextTypes = ...",
            Component.displayName || Component.name || "Component"
          );
          "function" === typeof Component.getDerivedStateFromProps && (workInProgress2 = getComponentNameFromType(Component) || "Unknown", didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress2] || (console.error(
            "%s: Function components do not support getDerivedStateFromProps.",
            workInProgress2
          ), didWarnAboutGetDerivedStateOnFunctionComponent[workInProgress2] = true));
          "object" === typeof Component.contextType && null !== Component.contextType && (Component = getComponentNameFromType(Component) || "Unknown", didWarnAboutContextTypeOnFunctionComponent[Component] || (console.error(
            "%s: Function components do not support contextType.",
            Component
          ), didWarnAboutContextTypeOnFunctionComponent[Component] = true));
        }
        function mountSuspenseOffscreenState(renderLanes2) {
          return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
        }
        function getRemainingWorkInPrimaryTree(current2, primaryTreeDidDefer, renderLanes2) {
          current2 = null !== current2 ? current2.childLanes & ~renderLanes2 : 0;
          primaryTreeDidDefer && (current2 |= workInProgressDeferredLane);
          return current2;
        }
        function updateSuspenseComponent(current2, workInProgress2, renderLanes2) {
          var nextProps = workInProgress2.pendingProps;
          shouldSuspendImpl(workInProgress2) && (workInProgress2.flags |= 128);
          var showFallback = false, didSuspend = 0 !== (workInProgress2.flags & 128), JSCompiler_temp;
          (JSCompiler_temp = didSuspend) || (JSCompiler_temp = null !== current2 && null === current2.memoizedState ? false : 0 !== (suspenseStackCursor.current & ForceSuspenseFallback));
          JSCompiler_temp && (showFallback = true, workInProgress2.flags &= -129);
          JSCompiler_temp = 0 !== (workInProgress2.flags & 32);
          workInProgress2.flags &= -33;
          if (null === current2) {
            if (isHydrating) {
              showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(workInProgress2);
              (current2 = nextHydratableInstance) ? (renderLanes2 = canHydrateSuspenseInstance(
                current2,
                rootOrSingletonContext
              ), null !== renderLanes2 && (JSCompiler_temp = {
                dehydrated: renderLanes2,
                treeContext: getSuspendedTreeContext(),
                retryLane: 536870912,
                hydrationErrors: null
              }, workInProgress2.memoizedState = JSCompiler_temp, JSCompiler_temp = createFiberFromDehydratedFragment(renderLanes2), JSCompiler_temp.return = workInProgress2, workInProgress2.child = JSCompiler_temp, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : renderLanes2 = null;
              if (null === renderLanes2)
                throw warnNonHydratedInstance(workInProgress2, current2), throwOnHydrationMismatch(workInProgress2);
              isSuspenseInstanceFallback(renderLanes2) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912;
              return null;
            }
            didSuspend = nextProps.children;
            nextProps = nextProps.fallback;
            if (showFallback)
              return reuseSuspenseHandlerOnStack(workInProgress2), showFallback = workInProgress2.mode, didSuspend = mountWorkInProgressOffscreenFiber(
                { mode: "hidden", children: didSuspend },
                showFallback
              ), nextProps = createFiberFromFragment(
                nextProps,
                showFallback,
                renderLanes2,
                null
              ), didSuspend.return = workInProgress2, nextProps.return = workInProgress2, didSuspend.sibling = nextProps, workInProgress2.child = didSuspend, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
                current2,
                JSCompiler_temp,
                renderLanes2
              ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            return mountSuspensePrimaryChildren(workInProgress2, didSuspend);
          }
          var prevState = current2.memoizedState;
          if (null !== prevState) {
            var _dehydrated2 = prevState.dehydrated;
            if (null !== _dehydrated2)
              return updateDehydratedSuspenseComponent(
                current2,
                workInProgress2,
                didSuspend,
                JSCompiler_temp,
                nextProps,
                _dehydrated2,
                prevState,
                renderLanes2
              );
          }
          if (showFallback)
            return reuseSuspenseHandlerOnStack(workInProgress2), showFallback = nextProps.fallback, didSuspend = workInProgress2.mode, prevState = current2.child, _dehydrated2 = prevState.sibling, nextProps = createWorkInProgress(prevState, {
              mode: "hidden",
              children: nextProps.children
            }), nextProps.subtreeFlags = prevState.subtreeFlags & 1206910976, null !== _dehydrated2 ? showFallback = createWorkInProgress(_dehydrated2, showFallback) : (showFallback = createFiberFromFragment(
              showFallback,
              didSuspend,
              renderLanes2,
              null
            ), showFallback.flags |= 2), showFallback.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = showFallback, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, showFallback = current2.child.memoizedState, null === showFallback ? showFallback = mountSuspenseOffscreenState(renderLanes2) : (didSuspend = showFallback.cachePool, null !== didSuspend ? (prevState = isPrimaryRenderer ? CacheContext._currentValue : CacheContext._currentValue2, didSuspend = didSuspend.parent !== prevState ? { parent: prevState, pool: prevState } : didSuspend) : didSuspend = getSuspendedCache(), showFallback = {
              baseLanes: showFallback.baseLanes | renderLanes2,
              cachePool: didSuspend
            }), nextProps.memoizedState = showFallback, nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current2,
              JSCompiler_temp,
              renderLanes2
            ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current2.child, nextProps);
          null !== prevState && (renderLanes2 & 62914560) === renderLanes2 && 0 !== (renderLanes2 & current2.lanes) && markRenderDerivedCause(workInProgress2);
          pushPrimaryTreeSuspenseHandler(workInProgress2);
          renderLanes2 = current2.child;
          current2 = renderLanes2.sibling;
          renderLanes2 = createWorkInProgress(renderLanes2, {
            mode: "visible",
            children: nextProps.children
          });
          renderLanes2.return = workInProgress2;
          renderLanes2.sibling = null;
          null !== current2 && (JSCompiler_temp = workInProgress2.deletions, null === JSCompiler_temp ? (workInProgress2.deletions = [current2], workInProgress2.flags |= 16) : JSCompiler_temp.push(current2));
          workInProgress2.child = renderLanes2;
          workInProgress2.memoizedState = null;
          return renderLanes2;
        }
        function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
          primaryChildren = mountWorkInProgressOffscreenFiber(
            { mode: "visible", children: primaryChildren },
            workInProgress2.mode
          );
          primaryChildren.return = workInProgress2;
          return workInProgress2.child = primaryChildren;
        }
        function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
          offscreenProps = createFiber(22, offscreenProps, null, mode);
          offscreenProps.lanes = 0;
          return offscreenProps;
        }
        function retrySuspenseComponentWithoutHydrating(current2, workInProgress2, renderLanes2) {
          reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2);
          current2 = mountSuspensePrimaryChildren(
            workInProgress2,
            workInProgress2.pendingProps.children
          );
          current2.flags |= 2;
          workInProgress2.memoizedState = null;
          return current2;
        }
        function updateDehydratedSuspenseComponent(current2, workInProgress2, didSuspend, didPrimaryChildrenDefer, nextProps, suspenseInstance, suspenseState, renderLanes2) {
          if (didSuspend) {
            if (workInProgress2.flags & 256)
              return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, retrySuspenseComponentWithoutHydrating(
                current2,
                workInProgress2,
                renderLanes2
              );
            if (null !== workInProgress2.memoizedState)
              return reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.child = current2.child, workInProgress2.flags |= 128, null;
            reuseSuspenseHandlerOnStack(workInProgress2);
            suspenseInstance = nextProps.fallback;
            suspenseState = workInProgress2.mode;
            nextProps = mountWorkInProgressOffscreenFiber(
              { mode: "visible", children: nextProps.children },
              suspenseState
            );
            suspenseInstance = createFiberFromFragment(
              suspenseInstance,
              suspenseState,
              renderLanes2,
              null
            );
            suspenseInstance.flags |= 2;
            nextProps.return = workInProgress2;
            suspenseInstance.return = workInProgress2;
            nextProps.sibling = suspenseInstance;
            workInProgress2.child = nextProps;
            reconcileChildFibers(workInProgress2, current2.child, null, renderLanes2);
            nextProps = workInProgress2.child;
            nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2);
            nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current2,
              didPrimaryChildrenDefer,
              renderLanes2
            );
            workInProgress2.memoizedState = SUSPENDED_MARKER;
            return bailoutOffscreenComponent(null, nextProps);
          }
          pushPrimaryTreeSuspenseHandler(workInProgress2);
          warnIfHydrating();
          0 !== (renderLanes2 & 536870912) && markRenderDerivedCause(workInProgress2);
          if (isSuspenseInstanceFallback(suspenseInstance))
            return suspenseState = getSuspenseInstanceFallbackErrorDetails(suspenseInstance), didPrimaryChildrenDefer = suspenseState.digest, suspenseInstance = suspenseState.message, nextProps = suspenseState.stack, suspenseState = suspenseState.componentStack, didPrimaryChildrenDefer !== REACT_RECOVERABLE_DIGEST && (suspenseInstance = suspenseInstance ? Error(suspenseInstance) : Error(
              "The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering."
            ), suspenseInstance.stack = nextProps || "", suspenseInstance.digest = didPrimaryChildrenDefer, didPrimaryChildrenDefer = void 0 === suspenseState ? null : suspenseState, nextProps = {
              value: suspenseInstance,
              source: null,
              stack: didPrimaryChildrenDefer
            }, "string" === typeof didPrimaryChildrenDefer && CapturedStacks.set(suspenseInstance, nextProps), queueHydrationError(nextProps)), retrySuspenseComponentWithoutHydrating(
              current2,
              workInProgress2,
              renderLanes2
            );
          didReceiveUpdate || propagateParentContextChanges(current2, workInProgress2, renderLanes2, false);
          didPrimaryChildrenDefer = 0 !== (renderLanes2 & current2.childLanes);
          if (didReceiveUpdate || didPrimaryChildrenDefer) {
            if (null !== currentTreeHiddenStackCursor.current)
              return retrySuspenseComponentWithoutHydrating(
                current2,
                workInProgress2,
                renderLanes2
              );
            didPrimaryChildrenDefer = workInProgressRoot;
            if (null !== didPrimaryChildrenDefer && (nextProps = getBumpedLaneForHydration(
              didPrimaryChildrenDefer,
              renderLanes2
            ), 0 !== nextProps && nextProps !== suspenseState.retryLane))
              throw suspenseState.retryLane = nextProps, enqueueConcurrentRenderForLane(current2, nextProps), scheduleUpdateOnFiber(didPrimaryChildrenDefer, current2, nextProps), SelectiveHydrationException;
            isSuspenseInstancePending(suspenseInstance) || renderDidSuspendDelayIfPossible();
            return retrySuspenseComponentWithoutHydrating(
              current2,
              workInProgress2,
              renderLanes2
            );
          }
          if (isSuspenseInstancePending(suspenseInstance))
            return workInProgress2.flags |= 192, workInProgress2.child = current2.child, null;
          current2 = suspenseState.treeContext;
          supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinSuspenseInstance(suspenseInstance), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, didSuspendOrErrorDEV = false, hydrationDiffRootDEV = null, rootOrSingletonContext = false, null !== current2 && restoreSuspendedTreeContext(workInProgress2, current2));
          workInProgress2 = mountSuspensePrimaryChildren(
            workInProgress2,
            nextProps.children
          );
          workInProgress2.flags |= 134221824;
          return workInProgress2;
        }
        function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
          fiber.lanes |= renderLanes2;
          var alternate = fiber.alternate;
          null !== alternate && (alternate.lanes |= renderLanes2);
          scheduleContextWorkOnParentPath(
            fiber.return,
            renderLanes2,
            propagationRoot
          );
        }
        function findLastContentRow(firstChild) {
          for (var lastContentRow = null; null !== firstChild; ) {
            var currentRow = firstChild.alternate;
            null !== currentRow && null === findFirstSuspended(currentRow) && (lastContentRow = firstChild);
            firstChild = firstChild.sibling;
          }
          return lastContentRow;
        }
        function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
          var renderState = workInProgress2.memoizedState;
          null === renderState ? workInProgress2.memoizedState = {
            isBackwards,
            rendering: null,
            renderingStartTime: 0,
            last: lastContentRow,
            tail,
            tailMode,
            treeForkCount: treeForkCount2
          } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
        }
        function reverseChildren(fiber) {
          var row = fiber.child;
          for (fiber.child = null; null !== row; ) {
            var nextRow = row.sibling;
            row.sibling = fiber.child;
            fiber.child = row;
            row = nextRow;
          }
        }
        function updateSuspenseListComponent(current2, workInProgress2, renderLanes2) {
          var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail, newChildren = nextProps.children, suspenseContext = suspenseStackCursor.current;
          if (workInProgress2.flags & 128)
            return pushSuspenseListContext(workInProgress2, suspenseContext), null;
          (nextProps = 0 !== (suspenseContext & ForceSuspenseFallback)) ? (suspenseContext = suspenseContext & SubtreeSuspenseContextMask | ForceSuspenseFallback, workInProgress2.flags |= 128) : suspenseContext &= SubtreeSuspenseContextMask;
          pushSuspenseListContext(workInProgress2, suspenseContext);
          suspenseContext = null == revealOrder ? "null" : revealOrder;
          if (null != revealOrder && "forwards" !== revealOrder && "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder && "together" !== revealOrder && "independent" !== revealOrder && !didWarnAboutRevealOrder[suspenseContext])
            if (didWarnAboutRevealOrder[suspenseContext] = true, "string" === typeof revealOrder)
              switch (revealOrder.toLowerCase()) {
                case "together":
                case "forwards":
                case "backwards":
                case "independent":
                  console.error(
                    '"%s" is not a valid value for revealOrder on <SuspenseList />. Use lowercase "%s" instead.',
                    revealOrder,
                    revealOrder.toLowerCase()
                  );
                  break;
                case "forward":
                case "backward":
                  console.error(
                    '"%s" is not a valid value for revealOrder on <SuspenseList />. React uses the -s suffix in the spelling. Use "%ss" instead.',
                    revealOrder,
                    revealOrder.toLowerCase()
                  );
                  break;
                default:
                  console.error(
                    '"%s" is not a supported revealOrder on <SuspenseList />. Did you mean "independent", "together", "forwards" or "backwards"?',
                    revealOrder
                  );
              }
            else
              console.error(
                '%s is not a supported value for revealOrder on <SuspenseList />. Did you mean "independent", "together", "forwards" or "backwards"?',
                revealOrder
              );
          suspenseContext = null == tailMode ? "null" : tailMode;
          didWarnAboutTailOptions[suspenseContext] || null == tailMode || ("visible" !== tailMode && "collapsed" !== tailMode && "hidden" !== tailMode ? (didWarnAboutTailOptions[suspenseContext] = true, console.error(
            '"%s" is not a supported value for tail on <SuspenseList />. Did you mean "visible", "collapsed" or "hidden"?',
            tailMode
          )) : null != revealOrder && "forwards" !== revealOrder && "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder && (didWarnAboutTailOptions[suspenseContext] = true, console.error(
            '<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" (default) or "backwards". Did you mean to specify revealOrder="forwards"?',
            tailMode
          )));
          a: if ((null == revealOrder || "forwards" === revealOrder || "backwards" === revealOrder || "unstable_legacy-backwards" === revealOrder) && void 0 !== newChildren && null !== newChildren && false !== newChildren)
            if (isArrayImpl(newChildren))
              for (suspenseContext = 0; suspenseContext < newChildren.length; suspenseContext++) {
                if (!validateSuspenseListNestedChild(
                  newChildren[suspenseContext],
                  suspenseContext
                ))
                  break a;
              }
            else if (suspenseContext = getIteratorFn(newChildren), "function" === typeof suspenseContext) {
              if (suspenseContext = suspenseContext.call(newChildren))
                for (var step = suspenseContext.next(), _i = 0; !step.done; step = suspenseContext.next()) {
                  if (!validateSuspenseListNestedChild(step.value, _i)) break a;
                  _i++;
                }
            } else
              console.error(
                'A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?',
                revealOrder
              );
          "backwards" === revealOrder && null !== current2 ? (reverseChildren(current2), reconcileChildren(current2, workInProgress2, newChildren, renderLanes2), reverseChildren(current2)) : reconcileChildren(current2, workInProgress2, newChildren, renderLanes2);
          isHydrating ? (warnIfNotHydrating(), newChildren = treeForkCount) : newChildren = 0;
          if (!nextProps && null !== current2 && 0 !== (current2.flags & 128))
            a: for (current2 = workInProgress2.child; null !== current2; ) {
              if (13 === current2.tag)
                null !== current2.memoizedState && scheduleSuspenseWorkOnFiber(current2, renderLanes2, workInProgress2);
              else if (19 === current2.tag)
                scheduleSuspenseWorkOnFiber(current2, renderLanes2, workInProgress2);
              else if (null !== current2.child) {
                current2.child.return = current2;
                current2 = current2.child;
                continue;
              }
              if (current2 === workInProgress2) break a;
              for (; null === current2.sibling; ) {
                if (null === current2.return || current2.return === workInProgress2)
                  break a;
                current2 = current2.return;
              }
              current2.sibling.return = current2.return;
              current2 = current2.sibling;
            }
          switch (revealOrder) {
            case "backwards":
              renderLanes2 = findLastContentRow(workInProgress2.child);
              null === renderLanes2 ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null, reverseChildren(workInProgress2));
              initSuspenseListRenderState(
                workInProgress2,
                true,
                revealOrder,
                null,
                tailMode,
                newChildren
              );
              break;
            case "unstable_legacy-backwards":
              renderLanes2 = null;
              revealOrder = workInProgress2.child;
              for (workInProgress2.child = null; null !== revealOrder; ) {
                current2 = revealOrder.alternate;
                if (null !== current2 && null === findFirstSuspended(current2)) {
                  workInProgress2.child = revealOrder;
                  break;
                }
                current2 = revealOrder.sibling;
                revealOrder.sibling = renderLanes2;
                renderLanes2 = revealOrder;
                revealOrder = current2;
              }
              initSuspenseListRenderState(
                workInProgress2,
                true,
                renderLanes2,
                null,
                tailMode,
                newChildren
              );
              break;
            case "together":
              initSuspenseListRenderState(
                workInProgress2,
                false,
                null,
                null,
                void 0,
                newChildren
              );
              break;
            case "independent":
              workInProgress2.memoizedState = null;
              break;
            default:
              renderLanes2 = findLastContentRow(workInProgress2.child), null === renderLanes2 ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null), initSuspenseListRenderState(
                workInProgress2,
                false,
                revealOrder,
                renderLanes2,
                tailMode,
                newChildren
              );
          }
          return workInProgress2.child;
        }
        function updateContextProvider(current2, workInProgress2, renderLanes2) {
          var context = workInProgress2.type, newProps = workInProgress2.pendingProps, newValue = newProps.value;
          "value" in newProps || hasWarnedAboutUsingNoValuePropOnContextProvider || (hasWarnedAboutUsingNoValuePropOnContextProvider = true, console.error(
            "The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"
          ));
          pushProvider(workInProgress2, context, newValue);
          reconcileChildren(
            current2,
            workInProgress2,
            newProps.children,
            renderLanes2
          );
          return workInProgress2.child;
        }
        function bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2) {
          null !== current2 && (workInProgress2.dependencies = current2.dependencies);
          profilerStartTime = -1;
          workInProgressRootSkippedLanes |= workInProgress2.lanes;
          if (0 === (renderLanes2 & workInProgress2.childLanes))
            if (null !== current2) {
              if (propagateParentContextChanges(
                current2,
                workInProgress2,
                renderLanes2,
                false
              ), 0 === (renderLanes2 & workInProgress2.childLanes))
                return null;
            } else return null;
          if (null !== current2 && workInProgress2.child !== current2.child)
            throw Error("Resuming work not yet implemented.");
          if (null !== workInProgress2.child) {
            current2 = workInProgress2.child;
            renderLanes2 = createWorkInProgress(current2, current2.pendingProps);
            workInProgress2.child = renderLanes2;
            for (renderLanes2.return = workInProgress2; null !== current2.sibling; )
              current2 = current2.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current2, current2.pendingProps), renderLanes2.return = workInProgress2;
            renderLanes2.sibling = null;
          }
          return workInProgress2.child;
        }
        function checkScheduledUpdateOrContext(current2, renderLanes2) {
          if (0 !== (current2.lanes & renderLanes2)) return true;
          current2 = current2.dependencies;
          return null !== current2 && checkIfContextChanged(current2) ? true : false;
        }
        function attemptEarlyBailoutIfNoScheduledUpdate(current2, workInProgress2, renderLanes2) {
          switch (workInProgress2.tag) {
            case 3:
              pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              );
              pushProvider(
                workInProgress2,
                CacheContext,
                current2.memoizedState.cache
              );
              resetHydrationState();
              break;
            case 27:
            case 5:
              pushHostContext(workInProgress2);
              break;
            case 4:
              pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              );
              break;
            case 10:
              pushProvider(
                workInProgress2,
                workInProgress2.type,
                workInProgress2.memoizedProps.value
              );
              break;
            case 12:
              0 !== (renderLanes2 & workInProgress2.childLanes) && (workInProgress2.flags |= 4);
              workInProgress2.flags |= 2048;
              var stateNode = workInProgress2.stateNode;
              stateNode.effectDuration = -0;
              stateNode.passiveEffectDuration = -0;
              break;
            case 31:
              if (null !== workInProgress2.memoizedState)
                return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
              break;
            case 13:
              stateNode = workInProgress2.memoizedState;
              if (null !== stateNode) {
                if (null !== stateNode.dehydrated)
                  return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
                stateNode = propagateParentContextChanges(
                  current2,
                  workInProgress2,
                  renderLanes2,
                  false
                );
                var primaryChildLanes = workInProgress2.child.childLanes;
                if (stateNode || 0 !== (renderLanes2 & primaryChildLanes))
                  return updateSuspenseComponent(
                    current2,
                    workInProgress2,
                    renderLanes2
                  );
                pushPrimaryTreeSuspenseHandler(workInProgress2);
                current2 = bailoutOnAlreadyFinishedWork(
                  current2,
                  workInProgress2,
                  renderLanes2
                );
                return null !== current2 ? current2.sibling : null;
              }
              pushPrimaryTreeSuspenseHandler(workInProgress2);
              break;
            case 19:
              if (workInProgress2.flags & 128)
                return updateSuspenseListComponent(
                  current2,
                  workInProgress2,
                  renderLanes2
                );
              primaryChildLanes = 0 !== (current2.flags & 128);
              stateNode = 0 !== (renderLanes2 & workInProgress2.childLanes);
              stateNode || (propagateParentContextChanges(
                current2,
                workInProgress2,
                renderLanes2,
                false
              ), stateNode = 0 !== (renderLanes2 & workInProgress2.childLanes));
              if (primaryChildLanes) {
                if (stateNode)
                  return updateSuspenseListComponent(
                    current2,
                    workInProgress2,
                    renderLanes2
                  );
                workInProgress2.flags |= 128;
              }
              primaryChildLanes = workInProgress2.memoizedState;
              null !== primaryChildLanes && (primaryChildLanes.rendering = null, primaryChildLanes.tail = null, primaryChildLanes.lastEffect = null);
              pushSuspenseListContext(workInProgress2, suspenseStackCursor.current);
              if (stateNode) break;
              else return null;
            case 22:
              return workInProgress2.lanes = 0, updateOffscreenComponent(
                current2,
                workInProgress2,
                renderLanes2,
                workInProgress2.pendingProps
              );
            case 24:
              pushProvider(
                workInProgress2,
                CacheContext,
                current2.memoizedState.cache
              );
          }
          return bailoutOnAlreadyFinishedWork(current2, workInProgress2, renderLanes2);
        }
        function beginWork(current2, workInProgress2, renderLanes2) {
          if (workInProgress2._debugNeedsRemount && null !== current2) {
            renderLanes2 = createFiberFromTypeAndProps(
              resolveTypeForHotReloading(workInProgress2.elementType),
              workInProgress2.key,
              workInProgress2.pendingProps,
              workInProgress2._debugOwner || null,
              workInProgress2.mode,
              workInProgress2.lanes
            );
            renderLanes2._debugStack = workInProgress2._debugStack;
            renderLanes2._debugTask = workInProgress2._debugTask;
            var returnFiber = workInProgress2.return;
            if (null === returnFiber) throw Error("Cannot swap the root fiber.");
            current2.alternate = null;
            workInProgress2.alternate = null;
            renderLanes2.index = workInProgress2.index;
            renderLanes2.sibling = workInProgress2.sibling;
            renderLanes2.return = workInProgress2.return;
            renderLanes2.ref = workInProgress2.ref;
            renderLanes2._debugInfo = workInProgress2._debugInfo;
            if (workInProgress2 === returnFiber.child)
              returnFiber.child = renderLanes2;
            else {
              var prevSibling = returnFiber.child;
              if (null === prevSibling)
                throw Error("Expected parent to have a child.");
              for (; prevSibling.sibling !== workInProgress2; )
                if (prevSibling = prevSibling.sibling, null === prevSibling)
                  throw Error("Expected to find the previous sibling.");
              prevSibling.sibling = renderLanes2;
            }
            workInProgress2 = returnFiber.deletions;
            null === workInProgress2 ? (returnFiber.deletions = [current2], returnFiber.flags |= 16) : workInProgress2.push(current2);
            renderLanes2.flags |= 134217730;
            return renderLanes2;
          }
          if (null !== current2)
            if (current2.memoizedProps !== workInProgress2.pendingProps || workInProgress2.type !== current2.type)
              didReceiveUpdate = true;
            else {
              if (!checkScheduledUpdateOrContext(current2, renderLanes2) && 0 === (workInProgress2.flags & 128))
                return didReceiveUpdate = false, attemptEarlyBailoutIfNoScheduledUpdate(
                  current2,
                  workInProgress2,
                  renderLanes2
                );
              didReceiveUpdate = 0 !== (current2.flags & 131072) ? true : false;
            }
          else {
            didReceiveUpdate = false;
            if (returnFiber = isHydrating)
              warnIfNotHydrating(), returnFiber = 0 !== (workInProgress2.flags & 1048576);
            returnFiber && (returnFiber = workInProgress2.index, warnIfNotHydrating(), pushTreeId(workInProgress2, treeForkCount, returnFiber));
          }
          workInProgress2.lanes = 0;
          switch (workInProgress2.tag) {
            case 16:
              a: if (returnFiber = workInProgress2.pendingProps, current2 = resolveLazy(workInProgress2.elementType), current2 = resolveTypeForHotReloading(current2), workInProgress2.type = current2, "function" === typeof current2)
                shouldConstruct(current2) ? (returnFiber = resolveClassComponentProps(
                  current2,
                  returnFiber
                ), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(
                  null,
                  workInProgress2,
                  current2,
                  returnFiber,
                  renderLanes2
                )) : (workInProgress2.tag = 0, validateFunctionComponentInDev(workInProgress2, current2), workInProgress2 = updateFunctionComponent(
                  null,
                  workInProgress2,
                  current2,
                  returnFiber,
                  renderLanes2
                ));
              else {
                if (void 0 !== current2 && null !== current2) {
                  if (prevSibling = current2.$$typeof, prevSibling === REACT_FORWARD_REF_TYPE) {
                    workInProgress2.tag = 11;
                    workInProgress2 = updateForwardRef(
                      null,
                      workInProgress2,
                      current2,
                      returnFiber,
                      renderLanes2
                    );
                    break a;
                  } else if (prevSibling === REACT_MEMO_TYPE) {
                    workInProgress2.tag = 14;
                    workInProgress2 = updateMemoComponent(
                      null,
                      workInProgress2,
                      current2,
                      returnFiber,
                      renderLanes2
                    );
                    break a;
                  } else if (prevSibling === REACT_CONTEXT_TYPE) {
                    workInProgress2.tag = 10;
                    workInProgress2.type = current2;
                    workInProgress2 = updateContextProvider(
                      null,
                      workInProgress2,
                      renderLanes2
                    );
                    break a;
                  }
                }
                workInProgress2 = "";
                null !== current2 && "object" === typeof current2 && current2.$$typeof === REACT_LAZY_TYPE && (workInProgress2 = " Did you wrap a component in React.lazy() more than once?");
                current2 = getComponentNameFromType(current2) || current2;
                throw Error(
                  "Element type is invalid. Received a promise that resolves to: " + current2 + ". Lazy element type must resolve to a class or function." + workInProgress2
                );
              }
              return workInProgress2;
            case 0:
              return updateFunctionComponent(
                current2,
                workInProgress2,
                workInProgress2.type,
                workInProgress2.pendingProps,
                renderLanes2
              );
            case 1:
              return returnFiber = workInProgress2.type, prevSibling = resolveClassComponentProps(
                returnFiber,
                workInProgress2.pendingProps
              ), updateClassComponent(
                current2,
                workInProgress2,
                returnFiber,
                prevSibling,
                renderLanes2
              );
            case 3:
              a: {
                pushHostContainer(
                  workInProgress2,
                  workInProgress2.stateNode.containerInfo
                );
                if (null === current2)
                  throw Error(
                    "Should have a current fiber. This is a bug in React."
                  );
                var nextProps = workInProgress2.pendingProps;
                prevSibling = workInProgress2.memoizedState;
                returnFiber = prevSibling.element;
                cloneUpdateQueue(current2, workInProgress2);
                processUpdateQueue(workInProgress2, nextProps, null, renderLanes2);
                var nextState = workInProgress2.memoizedState;
                nextProps = nextState.cache;
                pushProvider(workInProgress2, CacheContext, nextProps);
                nextProps !== prevSibling.cache && propagateContextChanges(
                  workInProgress2,
                  [CacheContext],
                  renderLanes2,
                  true
                );
                suspendIfUpdateReadFromEntangledAsyncAction();
                nextProps = nextState.element;
                if (supportsHydration && prevSibling.isDehydrated)
                  if (prevSibling = {
                    element: nextProps,
                    isDehydrated: false,
                    cache: nextState.cache
                  }, workInProgress2.updateQueue.baseState = prevSibling, workInProgress2.memoizedState = prevSibling, workInProgress2.flags & 256) {
                    workInProgress2 = mountHostRootWithoutHydrating(
                      current2,
                      workInProgress2,
                      nextProps,
                      renderLanes2
                    );
                    break a;
                  } else if (nextProps !== returnFiber) {
                    returnFiber = createCapturedValueAtFiber(
                      Error(
                        "This root received an early update, before anything was able hydrate. Switched the entire root to client rendering."
                      ),
                      workInProgress2
                    );
                    queueHydrationError(returnFiber);
                    workInProgress2 = mountHostRootWithoutHydrating(
                      current2,
                      workInProgress2,
                      nextProps,
                      renderLanes2
                    );
                    break a;
                  } else
                    for (supportsHydration && (nextHydratableInstance = getFirstHydratableChildWithinContainer(
                      workInProgress2.stateNode.containerInfo
                    ), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, didSuspendOrErrorDEV = false, hydrationDiffRootDEV = null, rootOrSingletonContext = true), current2 = mountChildFibers(
                      workInProgress2,
                      null,
                      nextProps,
                      renderLanes2
                    ), workInProgress2.child = current2; current2; )
                      current2.flags = current2.flags & -3 | 134221824, current2 = current2.sibling;
                else {
                  resetHydrationState();
                  if (nextProps === returnFiber) {
                    workInProgress2 = bailoutOnAlreadyFinishedWork(
                      current2,
                      workInProgress2,
                      renderLanes2
                    );
                    break a;
                  }
                  reconcileChildren(
                    current2,
                    workInProgress2,
                    nextProps,
                    renderLanes2
                  );
                }
                workInProgress2 = workInProgress2.child;
              }
              return workInProgress2;
            case 26:
              if (supportsResources)
                return markRef(current2, workInProgress2), null === current2 ? (current2 = getResource(
                  workInProgress2.type,
                  null,
                  workInProgress2.pendingProps,
                  null
                )) ? workInProgress2.memoizedState = current2 : isHydrating || (workInProgress2.stateNode = createHoistableInstance(
                  workInProgress2.type,
                  workInProgress2.pendingProps,
                  requiredContext(rootInstanceStackCursor.current),
                  workInProgress2
                )) : workInProgress2.memoizedState = getResource(
                  workInProgress2.type,
                  current2.memoizedProps,
                  workInProgress2.pendingProps,
                  current2.memoizedState
                ), null;
            case 27:
              if (supportsSingletons)
                return pushHostContext(workInProgress2), null === current2 && supportsSingletons && isHydrating && (prevSibling = requiredContext(
                  rootInstanceStackCursor.current
                ), returnFiber = getHostContext(), prevSibling = workInProgress2.stateNode = resolveSingletonInstance(
                  workInProgress2.type,
                  workInProgress2.pendingProps,
                  prevSibling,
                  returnFiber,
                  false
                ), didSuspendOrErrorDEV || (returnFiber = diffHydratedPropsForDevWarnings(
                  prevSibling,
                  workInProgress2.type,
                  workInProgress2.pendingProps,
                  returnFiber
                ), null !== returnFiber && (buildHydrationDiffNode(workInProgress2, 0).serverProps = returnFiber)), hydrationParentFiber = workInProgress2, rootOrSingletonContext = true, nextHydratableInstance = getFirstHydratableChildWithinSingleton(
                  workInProgress2.type,
                  prevSibling,
                  nextHydratableInstance
                )), reconcileChildren(
                  current2,
                  workInProgress2,
                  workInProgress2.pendingProps.children,
                  renderLanes2
                ), markRef(current2, workInProgress2), null === current2 && (workInProgress2.flags |= 4194304), workInProgress2.child;
            case 5:
              return null === current2 && isHydrating && (nextProps = getHostContext(), returnFiber = validateHydratableInstance(
                workInProgress2.type,
                workInProgress2.pendingProps,
                nextProps
              ), prevSibling = nextHydratableInstance, (nextState = !prevSibling) || (nextState = canHydrateInstance(
                prevSibling,
                workInProgress2.type,
                workInProgress2.pendingProps,
                rootOrSingletonContext
              ), null !== nextState ? (workInProgress2.stateNode = nextState, didSuspendOrErrorDEV || (nextProps = diffHydratedPropsForDevWarnings(
                nextState,
                workInProgress2.type,
                workInProgress2.pendingProps,
                nextProps
              ), null !== nextProps && (buildHydrationDiffNode(workInProgress2, 0).serverProps = nextProps)), hydrationParentFiber = workInProgress2, nextHydratableInstance = getFirstHydratableChild(nextState), rootOrSingletonContext = false, nextProps = true) : nextProps = false, nextState = !nextProps), nextState && (returnFiber && warnNonHydratedInstance(workInProgress2, prevSibling), throwOnHydrationMismatch(workInProgress2))), pushHostContext(workInProgress2), prevSibling = workInProgress2.type, nextProps = workInProgress2.pendingProps, nextState = null !== current2 ? current2.memoizedProps : null, returnFiber = nextProps.children, shouldSetTextContent(prevSibling, nextProps) ? returnFiber = null : null !== nextState && shouldSetTextContent(prevSibling, nextState) && (workInProgress2.flags |= 32), null !== workInProgress2.memoizedState && (prevSibling = renderWithHooks(
                current2,
                workInProgress2,
                TransitionAwareHostComponent,
                null,
                null,
                renderLanes2
              ), isPrimaryRenderer ? HostTransitionContext._currentValue = prevSibling : HostTransitionContext._currentValue2 = prevSibling), markRef(current2, workInProgress2), reconcileChildren(
                current2,
                workInProgress2,
                returnFiber,
                renderLanes2
              ), workInProgress2.child;
            case 6:
              return null === current2 && isHydrating && (current2 = workInProgress2.pendingProps, renderLanes2 = getHostContext(), current2 = validateHydratableTextInstance(current2, renderLanes2), renderLanes2 = nextHydratableInstance, (returnFiber = !renderLanes2) || (returnFiber = canHydrateTextInstance(
                renderLanes2,
                workInProgress2.pendingProps,
                rootOrSingletonContext
              ), null !== returnFiber ? (workInProgress2.stateNode = returnFiber, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, returnFiber = true) : returnFiber = false, returnFiber = !returnFiber), returnFiber && (current2 && warnNonHydratedInstance(workInProgress2, renderLanes2), throwOnHydrationMismatch(workInProgress2))), null;
            case 13:
              return updateSuspenseComponent(current2, workInProgress2, renderLanes2);
            case 4:
              return pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              ), returnFiber = workInProgress2.pendingProps, null === current2 ? workInProgress2.child = reconcileChildFibers(
                workInProgress2,
                null,
                returnFiber,
                renderLanes2
              ) : reconcileChildren(
                current2,
                workInProgress2,
                returnFiber,
                renderLanes2
              ), workInProgress2.child;
            case 11:
              return updateForwardRef(
                current2,
                workInProgress2,
                workInProgress2.type,
                workInProgress2.pendingProps,
                renderLanes2
              );
            case 7:
              return returnFiber = workInProgress2.pendingProps, markRef(current2, workInProgress2), reconcileChildren(
                current2,
                workInProgress2,
                returnFiber,
                renderLanes2
              ), workInProgress2.child;
            case 8:
              return reconcileChildren(
                current2,
                workInProgress2,
                workInProgress2.pendingProps.children,
                renderLanes2
              ), workInProgress2.child;
            case 12:
              return workInProgress2.flags |= 4, workInProgress2.flags |= 2048, returnFiber = workInProgress2.stateNode, returnFiber.effectDuration = -0, returnFiber.passiveEffectDuration = -0, reconcileChildren(
                current2,
                workInProgress2,
                workInProgress2.pendingProps.children,
                renderLanes2
              ), workInProgress2.child;
            case 10:
              return updateContextProvider(current2, workInProgress2, renderLanes2);
            case 9:
              return prevSibling = workInProgress2.type._context, returnFiber = workInProgress2.pendingProps.children, "function" !== typeof returnFiber && console.error(
                "A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."
              ), prepareToReadContext(workInProgress2), prevSibling = readContext(prevSibling), returnFiber = callComponentInDEV(
                returnFiber,
                prevSibling,
                void 0
              ), workInProgress2.flags |= 1, reconcileChildren(
                current2,
                workInProgress2,
                returnFiber,
                renderLanes2
              ), workInProgress2.child;
            case 14:
              return updateMemoComponent(
                current2,
                workInProgress2,
                workInProgress2.type,
                workInProgress2.pendingProps,
                renderLanes2
              );
            case 15:
              return updateSimpleMemoComponent(
                current2,
                workInProgress2,
                workInProgress2.type,
                workInProgress2.pendingProps,
                renderLanes2
              );
            case 19:
              return updateSuspenseListComponent(
                current2,
                workInProgress2,
                renderLanes2
              );
            case 31:
              return updateActivityComponent(current2, workInProgress2, renderLanes2);
            case 22:
              return updateOffscreenComponent(
                current2,
                workInProgress2,
                renderLanes2,
                workInProgress2.pendingProps
              );
            case 24:
              return prepareToReadContext(workInProgress2), returnFiber = readContext(CacheContext), null === current2 ? (prevSibling = peekCacheFromPool(), null === prevSibling && (prevSibling = workInProgressRoot, nextProps = createCache(), prevSibling.pooledCache = nextProps, retainCache(nextProps), null !== nextProps && (prevSibling.pooledCacheLanes |= renderLanes2), prevSibling = nextProps), workInProgress2.memoizedState = {
                parent: returnFiber,
                cache: prevSibling
              }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, prevSibling)) : (0 !== (current2.lanes & renderLanes2) && (cloneUpdateQueue(current2, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), prevSibling = current2.memoizedState, nextProps = workInProgress2.memoizedState, prevSibling.parent !== returnFiber ? (prevSibling = {
                parent: returnFiber,
                cache: returnFiber
              }, workInProgress2.memoizedState = prevSibling, 0 === workInProgress2.lanes && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = prevSibling), pushProvider(workInProgress2, CacheContext, returnFiber)) : (returnFiber = nextProps.cache, pushProvider(workInProgress2, CacheContext, returnFiber), returnFiber !== prevSibling.cache && propagateContextChanges(
                workInProgress2,
                [CacheContext],
                renderLanes2,
                true
              ))), reconcileChildren(
                current2,
                workInProgress2,
                workInProgress2.pendingProps.children,
                renderLanes2
              ), workInProgress2.child;
            case 30:
              return null === workInProgress2.stateNode && (workInProgress2.stateNode = {
                autoName: null,
                paired: null,
                clones: null,
                ref: null
              }), returnFiber = workInProgress2.pendingProps, null != returnFiber.name && "auto" !== returnFiber.name ? workInProgress2.flags |= null === current2 ? 18882560 : 18874368 : isHydrating && pushMaterializedTreeId(workInProgress2), void 0 !== returnFiber.className && (prevSibling = "string" === typeof returnFiber.className ? JSON.stringify(returnFiber.className) : "{...}", didWarnAboutClassNameOnViewTransition[prevSibling] || (didWarnAboutClassNameOnViewTransition[prevSibling] = true, console.error(
                `<ViewTransition> doesn't accept a "className" prop. It has been renamed to "default".
-   <ViewTransition className=%s>
+   <ViewTransition default=%s>`,
                prevSibling,
                prevSibling
              ))), null !== current2 && current2.memoizedProps.name !== returnFiber.name ? workInProgress2.flags |= 4194816 : markRef(current2, workInProgress2), reconcileChildren(
                current2,
                workInProgress2,
                returnFiber.children,
                renderLanes2
              ), workInProgress2.child;
            case 29:
              throw workInProgress2.pendingProps;
          }
          throw Error(
            "Unknown unit of work tag (" + workInProgress2.tag + "). This error is likely caused by a bug in React. Please file an issue."
          );
        }
        function markUpdate(workInProgress2) {
          workInProgress2.flags |= 4;
        }
        function markCloned(workInProgress2) {
          supportsPersistence && (workInProgress2.flags |= 8);
        }
        function doesRequireClone(current2, completedWork) {
          if (null !== current2 && current2.child === completedWork.child) return false;
          if (0 !== (completedWork.flags & 16)) return true;
          for (current2 = completedWork.child; null !== current2; ) {
            if (0 !== (current2.flags & 8218) || 0 !== (current2.subtreeFlags & 8218))
              return true;
            current2 = current2.sibling;
          }
          return false;
        }
        function appendAllChildren(parent, workInProgress2, needsVisibilityToggle, isHidden) {
          if (supportsMutation)
            for (needsVisibilityToggle = workInProgress2.child; null !== needsVisibilityToggle; ) {
              if (5 === needsVisibilityToggle.tag || 6 === needsVisibilityToggle.tag)
                appendInitialChild(parent, needsVisibilityToggle.stateNode);
              else if (!(4 === needsVisibilityToggle.tag || supportsSingletons && 27 === needsVisibilityToggle.tag) && null !== needsVisibilityToggle.child) {
                needsVisibilityToggle.child.return = needsVisibilityToggle;
                needsVisibilityToggle = needsVisibilityToggle.child;
                continue;
              }
              if (needsVisibilityToggle === workInProgress2) break;
              for (; null === needsVisibilityToggle.sibling; ) {
                if (null === needsVisibilityToggle.return || needsVisibilityToggle.return === workInProgress2)
                  return;
                needsVisibilityToggle = needsVisibilityToggle.return;
              }
              needsVisibilityToggle.sibling.return = needsVisibilityToggle.return;
              needsVisibilityToggle = needsVisibilityToggle.sibling;
            }
          else if (supportsPersistence)
            for (var _node = workInProgress2.child; null !== _node; ) {
              if (5 === _node.tag) {
                var instance = _node.stateNode;
                needsVisibilityToggle && isHidden && (instance = cloneHiddenInstance(
                  instance,
                  _node.type,
                  _node.memoizedProps
                ));
                appendInitialChild(parent, instance);
              } else if (6 === _node.tag)
                instance = _node.stateNode, needsVisibilityToggle && isHidden && (instance = cloneHiddenTextInstance(
                  instance,
                  _node.memoizedProps
                )), appendInitialChild(parent, instance);
              else if (4 !== _node.tag) {
                if (22 === _node.tag && null !== _node.memoizedState)
                  instance = _node.child, null !== instance && (instance.return = _node), appendAllChildren(parent, _node, true, true);
                else if (null !== _node.child) {
                  _node.child.return = _node;
                  _node = _node.child;
                  continue;
                }
              }
              if (_node === workInProgress2) break;
              for (; null === _node.sibling; ) {
                if (null === _node.return || _node.return === workInProgress2)
                  return;
                _node = _node.return;
              }
              _node.sibling.return = _node.return;
              _node = _node.sibling;
            }
        }
        function appendAllChildrenToContainer(containerChildSet, workInProgress2, needsVisibilityToggle, isHidden) {
          var hasOffscreenComponentChild = false;
          if (supportsPersistence)
            for (var node = workInProgress2.child; null !== node; ) {
              if (5 === node.tag) {
                var instance = node.stateNode;
                needsVisibilityToggle && isHidden && (instance = cloneHiddenInstance(
                  instance,
                  node.type,
                  node.memoizedProps
                ));
                appendChildToContainerChildSet(containerChildSet, instance);
              } else if (6 === node.tag)
                instance = node.stateNode, needsVisibilityToggle && isHidden && (instance = cloneHiddenTextInstance(
                  instance,
                  node.memoizedProps
                )), appendChildToContainerChildSet(containerChildSet, instance);
              else if (4 !== node.tag) {
                if (22 === node.tag && null !== node.memoizedState)
                  hasOffscreenComponentChild = node.child, null !== hasOffscreenComponentChild && (hasOffscreenComponentChild.return = node), appendAllChildrenToContainer(containerChildSet, node, true, true), hasOffscreenComponentChild = true;
                else if (null !== node.child) {
                  node.child.return = node;
                  node = node.child;
                  continue;
                }
              }
              if (node === workInProgress2) break;
              for (; null === node.sibling; ) {
                if (null === node.return || node.return === workInProgress2)
                  return hasOffscreenComponentChild;
                node = node.return;
              }
              node.sibling.return = node.return;
              node = node.sibling;
            }
          return hasOffscreenComponentChild;
        }
        function updateHostContainer(current2, workInProgress2) {
          if (supportsPersistence && doesRequireClone(current2, workInProgress2)) {
            current2 = workInProgress2.stateNode;
            var container = current2.containerInfo, newChildSet = createContainerChildSet();
            appendAllChildrenToContainer(newChildSet, workInProgress2, false, false);
            current2.pendingChildren = newChildSet;
            markUpdate(workInProgress2);
            finalizeContainerChildren(container, newChildSet);
          }
        }
        function updateHostComponent(current2, workInProgress2, type, newProps) {
          if (supportsMutation)
            current2.memoizedProps !== newProps && markUpdate(workInProgress2);
          else if (supportsPersistence) {
            var currentInstance = current2.stateNode, _oldProps = current2.memoizedProps;
            if ((current2 = doesRequireClone(current2, workInProgress2)) || _oldProps !== newProps) {
              var currentHostContext = getHostContext();
              _oldProps = cloneInstance(
                currentInstance,
                type,
                _oldProps,
                newProps,
                !current2,
                null
              );
              _oldProps === currentInstance ? workInProgress2.stateNode = currentInstance : (markCloned(workInProgress2), finalizeInitialChildren(
                _oldProps,
                type,
                newProps,
                currentHostContext
              ) && markUpdate(workInProgress2), workInProgress2.stateNode = _oldProps, current2 && appendAllChildren(_oldProps, workInProgress2, false, false));
            } else workInProgress2.stateNode = currentInstance;
          }
        }
        function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
          if ((workInProgress2.mode & 32) !== NoMode && (null === oldProps ? maySuspendCommit(type, newProps) : maySuspendCommitOnUpdate(type, oldProps, newProps))) {
            if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2 || maySuspendCommitInSyncRender(type, newProps))
              if (preloadInstance(workInProgress2.stateNode, type, newProps))
                workInProgress2.flags |= 8192;
              else if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
              else
                throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
          } else workInProgress2.flags &= -16777217;
        }
        function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
          if (mayResourceSuspendCommit(resource)) {
            if (workInProgress2.flags |= 16777216, !preloadResource(resource))
              if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
              else
                throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
          } else workInProgress2.flags &= -16777217;
        }
        function scheduleRetryEffect(workInProgress2, retryQueue) {
          null !== retryQueue && (workInProgress2.flags |= 4);
          workInProgress2.flags & 16384 && (retryQueue = 22 !== workInProgress2.tag ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
        }
        function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
          if (!isHydrating)
            switch (renderState.tailMode) {
              case "visible":
                break;
              case "collapsed":
                for (var tailNode = renderState.tail, lastTailNode = null; null !== tailNode; )
                  null !== tailNode.alternate && (lastTailNode = tailNode), tailNode = tailNode.sibling;
                null === lastTailNode ? hasRenderedATailFallback || null === renderState.tail ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode.sibling = null;
                break;
              default:
                hasRenderedATailFallback = renderState.tail;
                for (tailNode = null; null !== hasRenderedATailFallback; )
                  null !== hasRenderedATailFallback.alternate && (tailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
                null === tailNode ? renderState.tail = null : tailNode.sibling = null;
            }
        }
        function bubbleProperties(completedWork) {
          var didBailout = null !== completedWork.alternate && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
          if (didBailout)
            if ((completedWork.mode & 2) !== NoMode) {
              for (var _treeBaseDuration = completedWork.selfBaseDuration, _child2 = completedWork.child; null !== _child2; )
                newChildLanes |= _child2.lanes | _child2.childLanes, subtreeFlags |= _child2.subtreeFlags & 1206910976, subtreeFlags |= _child2.flags & 1206910976, _treeBaseDuration += _child2.treeBaseDuration, _child2 = _child2.sibling;
              completedWork.treeBaseDuration = _treeBaseDuration;
            } else
              for (_treeBaseDuration = completedWork.child; null !== _treeBaseDuration; )
                newChildLanes |= _treeBaseDuration.lanes | _treeBaseDuration.childLanes, subtreeFlags |= _treeBaseDuration.subtreeFlags & 1206910976, subtreeFlags |= _treeBaseDuration.flags & 1206910976, _treeBaseDuration.return = completedWork, _treeBaseDuration = _treeBaseDuration.sibling;
          else if ((completedWork.mode & 2) !== NoMode) {
            _treeBaseDuration = completedWork.actualDuration;
            _child2 = completedWork.selfBaseDuration;
            for (var child = completedWork.child; null !== child; )
              newChildLanes |= child.lanes | child.childLanes, subtreeFlags |= child.subtreeFlags, subtreeFlags |= child.flags, _treeBaseDuration += child.actualDuration, _child2 += child.treeBaseDuration, child = child.sibling;
            completedWork.actualDuration = _treeBaseDuration;
            completedWork.treeBaseDuration = _child2;
          } else
            for (_treeBaseDuration = completedWork.child; null !== _treeBaseDuration; )
              newChildLanes |= _treeBaseDuration.lanes | _treeBaseDuration.childLanes, subtreeFlags |= _treeBaseDuration.subtreeFlags, subtreeFlags |= _treeBaseDuration.flags, _treeBaseDuration.return = completedWork, _treeBaseDuration = _treeBaseDuration.sibling;
          completedWork.subtreeFlags |= subtreeFlags;
          completedWork.childLanes = newChildLanes;
          return didBailout;
        }
        function completeWork(current2, workInProgress2, renderLanes2) {
          var newProps = workInProgress2.pendingProps;
          popTreeContext(workInProgress2);
          switch (workInProgress2.tag) {
            case 16:
            case 15:
            case 0:
            case 11:
            case 7:
            case 8:
            case 12:
            case 9:
            case 14:
              return bubbleProperties(workInProgress2), null;
            case 1:
              return bubbleProperties(workInProgress2), null;
            case 3:
              renderLanes2 = workInProgress2.stateNode;
              newProps = null;
              null !== current2 && (newProps = current2.memoizedState.cache);
              workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048);
              popProvider(CacheContext, workInProgress2);
              popHostContainer(workInProgress2);
              renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null);
              if (null === current2 || null === current2.child)
                popHydrationState(workInProgress2) ? (emitPendingHydrationWarnings(), markUpdate(workInProgress2)) : null === current2 || current2.memoizedState.isDehydrated && 0 === (workInProgress2.flags & 256) || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable());
              updateHostContainer(current2, workInProgress2);
              bubbleProperties(workInProgress2);
              return null;
            case 26:
              if (supportsResources) {
                var type = workInProgress2.type, nextResource = workInProgress2.memoizedState;
                null === current2 ? (markUpdate(workInProgress2), null !== nextResource ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(
                  workInProgress2,
                  nextResource
                )) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
                  workInProgress2,
                  type,
                  null,
                  newProps,
                  renderLanes2
                ))) : nextResource ? nextResource !== current2.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(
                  workInProgress2,
                  nextResource
                )) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (nextResource = current2.memoizedProps, supportsMutation ? nextResource !== newProps && markUpdate(workInProgress2) : updateHostComponent(
                  current2,
                  workInProgress2,
                  type,
                  newProps
                ), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
                  workInProgress2,
                  type,
                  nextResource,
                  newProps,
                  renderLanes2
                ));
                return null;
              }
            case 27:
              if (supportsSingletons) {
                popHostContext(workInProgress2);
                renderLanes2 = requiredContext(rootInstanceStackCursor.current);
                type = workInProgress2.type;
                if (null !== current2 && null != workInProgress2.stateNode)
                  supportsMutation ? current2.memoizedProps !== newProps && markUpdate(workInProgress2) : updateHostComponent(current2, workInProgress2, type, newProps);
                else {
                  if (!newProps) {
                    if (null === workInProgress2.stateNode)
                      throw Error(
                        "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                      );
                    bubbleProperties(workInProgress2);
                    workInProgress2.subtreeFlags &= -33554433;
                    return null;
                  }
                  current2 = getHostContext();
                  popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current2) : (current2 = resolveSingletonInstance(
                    type,
                    newProps,
                    renderLanes2,
                    current2,
                    true
                  ), workInProgress2.stateNode = current2, markUpdate(workInProgress2));
                }
                bubbleProperties(workInProgress2);
                workInProgress2.subtreeFlags &= -33554433;
                return null;
              }
            case 5:
              popHostContext(workInProgress2);
              type = workInProgress2.type;
              if (null !== current2 && null != workInProgress2.stateNode)
                updateHostComponent(current2, workInProgress2, type, newProps);
              else {
                if (!newProps) {
                  if (null === workInProgress2.stateNode)
                    throw Error(
                      "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                    );
                  bubbleProperties(workInProgress2);
                  workInProgress2.subtreeFlags &= -33554433;
                  return null;
                }
                nextResource = getHostContext();
                if (popHydrationState(workInProgress2))
                  prepareToHydrateHostInstance(workInProgress2, nextResource), finalizeHydratedChildren(
                    workInProgress2.stateNode,
                    type,
                    newProps,
                    nextResource
                  ) && (workInProgress2.flags |= 64);
                else {
                  var _rootContainerInstance = requiredContext(
                    rootInstanceStackCursor.current
                  );
                  _rootContainerInstance = createInstance(
                    type,
                    newProps,
                    _rootContainerInstance,
                    nextResource,
                    workInProgress2
                  );
                  markCloned(workInProgress2);
                  appendAllChildren(_rootContainerInstance, workInProgress2, false, false);
                  workInProgress2.stateNode = _rootContainerInstance;
                  finalizeInitialChildren(
                    _rootContainerInstance,
                    type,
                    newProps,
                    nextResource
                  ) && markUpdate(workInProgress2);
                }
              }
              bubbleProperties(workInProgress2);
              workInProgress2.subtreeFlags &= -33554433;
              preloadInstanceAndSuspendIfNeeded(
                workInProgress2,
                workInProgress2.type,
                null === current2 ? null : current2.memoizedProps,
                workInProgress2.pendingProps,
                renderLanes2
              );
              return null;
            case 6:
              if (current2 && null != workInProgress2.stateNode)
                renderLanes2 = current2.memoizedProps, supportsMutation ? renderLanes2 !== newProps && markUpdate(workInProgress2) : supportsPersistence && (renderLanes2 !== newProps ? (current2 = requiredContext(
                  rootInstanceStackCursor.current
                ), renderLanes2 = getHostContext(), markCloned(workInProgress2), workInProgress2.stateNode = createTextInstance(
                  newProps,
                  current2,
                  renderLanes2,
                  workInProgress2
                )) : workInProgress2.stateNode = current2.stateNode);
              else {
                if ("string" !== typeof newProps && null === workInProgress2.stateNode)
                  throw Error(
                    "We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue."
                  );
                current2 = requiredContext(rootInstanceStackCursor.current);
                renderLanes2 = getHostContext();
                if (popHydrationState(workInProgress2)) {
                  if (!supportsHydration)
                    throw Error(
                      "Expected prepareToHydrateHostTextInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                    );
                  current2 = workInProgress2.stateNode;
                  renderLanes2 = workInProgress2.memoizedProps;
                  type = !didSuspendOrErrorDEV;
                  newProps = null;
                  nextResource = hydrationParentFiber;
                  if (null !== nextResource)
                    switch (nextResource.tag) {
                      case 3:
                        type && (type = diffHydratedTextForDevWarnings(
                          current2,
                          renderLanes2,
                          newProps
                        ), null !== type && (buildHydrationDiffNode(workInProgress2, 0).serverProps = type));
                        break;
                      case 27:
                      case 5:
                        newProps = nextResource.memoizedProps, type && (type = diffHydratedTextForDevWarnings(
                          current2,
                          renderLanes2,
                          newProps
                        ), null !== type && (buildHydrationDiffNode(
                          workInProgress2,
                          0
                        ).serverProps = type));
                    }
                  hydrateTextInstance(
                    current2,
                    renderLanes2,
                    workInProgress2,
                    newProps
                  ) || throwOnHydrationMismatch(workInProgress2, true);
                } else
                  markCloned(workInProgress2), workInProgress2.stateNode = createTextInstance(
                    newProps,
                    current2,
                    renderLanes2,
                    workInProgress2
                  );
              }
              bubbleProperties(workInProgress2);
              return null;
            case 31:
              renderLanes2 = workInProgress2.memoizedState;
              if (null === current2 || null !== current2.memoizedState) {
                newProps = popHydrationState(workInProgress2);
                if (null !== renderLanes2) {
                  if (null === current2) {
                    if (!newProps)
                      throw Error(
                        "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
                      );
                    if (!supportsHydration)
                      throw Error(
                        "Expected prepareToHydrateHostActivityInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                      );
                    current2 = workInProgress2.memoizedState;
                    current2 = null !== current2 ? current2.dehydrated : null;
                    if (!current2)
                      throw Error(
                        "Expected to have a hydrated activity instance. This error is likely caused by a bug in React. Please file an issue."
                      );
                    hydrateActivityInstance(current2, workInProgress2);
                    bubbleProperties(workInProgress2);
                    (workInProgress2.mode & 2) !== NoMode && null !== renderLanes2 && (current2 = workInProgress2.child, null !== current2 && (workInProgress2.treeBaseDuration -= current2.treeBaseDuration));
                  } else
                    emitPendingHydrationWarnings(), resetHydrationState(), 0 === (workInProgress2.flags & 128) && (renderLanes2 = workInProgress2.memoizedState = null), workInProgress2.flags |= 4, bubbleProperties(workInProgress2), (workInProgress2.mode & 2) !== NoMode && null !== renderLanes2 && (current2 = workInProgress2.child, null !== current2 && (workInProgress2.treeBaseDuration -= current2.treeBaseDuration));
                  current2 = false;
                } else
                  renderLanes2 = upgradeHydrationErrorsToRecoverable(), null !== current2 && null !== current2.memoizedState && (current2.memoizedState.hydrationErrors = renderLanes2), current2 = true;
                if (!current2) {
                  if (workInProgress2.flags & 256)
                    return popSuspenseHandler(workInProgress2), workInProgress2;
                  popSuspenseHandler(workInProgress2);
                  return null;
                }
                if (0 !== (workInProgress2.flags & 128))
                  throw Error(
                    "Client rendering an Activity suspended it again. This is a bug in React."
                  );
              }
              bubbleProperties(workInProgress2);
              return null;
            case 13:
              newProps = workInProgress2.memoizedState;
              if (null === current2 || null !== current2.memoizedState && null !== current2.memoizedState.dehydrated) {
                type = newProps;
                nextResource = popHydrationState(workInProgress2);
                if (null !== type && null !== type.dehydrated) {
                  if (null === current2) {
                    if (!nextResource)
                      throw Error(
                        "A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React."
                      );
                    if (!supportsHydration)
                      throw Error(
                        "Expected prepareToHydrateHostSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue."
                      );
                    nextResource = workInProgress2.memoizedState;
                    nextResource = null !== nextResource ? nextResource.dehydrated : null;
                    if (!nextResource)
                      throw Error(
                        "Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue."
                      );
                    hydrateSuspenseInstance(nextResource, workInProgress2);
                    bubbleProperties(workInProgress2);
                    (workInProgress2.mode & 2) !== NoMode && null !== type && (type = workInProgress2.child, null !== type && (workInProgress2.treeBaseDuration -= type.treeBaseDuration));
                  } else
                    emitPendingHydrationWarnings(), resetHydrationState(), 0 === (workInProgress2.flags & 128) && (type = workInProgress2.memoizedState = null), workInProgress2.flags |= 4, bubbleProperties(workInProgress2), (workInProgress2.mode & 2) !== NoMode && null !== type && (type = workInProgress2.child, null !== type && (workInProgress2.treeBaseDuration -= type.treeBaseDuration));
                  type = false;
                } else
                  type = upgradeHydrationErrorsToRecoverable(), null !== current2 && null !== current2.memoizedState && (current2.memoizedState.hydrationErrors = type), type = true;
                if (!type) {
                  if (workInProgress2.flags & 256)
                    return popSuspenseHandler(workInProgress2), workInProgress2;
                  popSuspenseHandler(workInProgress2);
                  return null;
                }
              }
              popSuspenseHandler(workInProgress2);
              if (0 !== (workInProgress2.flags & 128))
                return workInProgress2.lanes = renderLanes2, (workInProgress2.mode & 2) !== NoMode && transferActualDuration(workInProgress2), workInProgress2;
              renderLanes2 = null !== newProps;
              current2 = null !== current2 && null !== current2.memoizedState;
              renderLanes2 && (newProps = workInProgress2.child, type = null, null !== newProps.alternate && null !== newProps.alternate.memoizedState && null !== newProps.alternate.memoizedState.cachePool && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, null !== newProps.memoizedState && null !== newProps.memoizedState.cachePool && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
              renderLanes2 !== current2 && renderLanes2 && (workInProgress2.child.flags |= 8192);
              scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue);
              bubbleProperties(workInProgress2);
              (workInProgress2.mode & 2) !== NoMode && renderLanes2 && (current2 = workInProgress2.child, null !== current2 && (workInProgress2.treeBaseDuration -= current2.treeBaseDuration));
              return null;
            case 4:
              return popHostContainer(workInProgress2), updateHostContainer(current2, workInProgress2), null === current2 && preparePortalMount(workInProgress2.stateNode.containerInfo), workInProgress2.flags |= 67108864, bubbleProperties(workInProgress2), null;
            case 10:
              return popProvider(workInProgress2.type, workInProgress2), bubbleProperties(workInProgress2), null;
            case 19:
              popSuspenseListContext(workInProgress2);
              newProps = workInProgress2.memoizedState;
              if (null === newProps) return bubbleProperties(workInProgress2), null;
              type = 0 !== (workInProgress2.flags & 128);
              nextResource = newProps.rendering;
              if (null === nextResource)
                if (type) cutOffTailIfNeeded(newProps, false);
                else {
                  if (workInProgressRootExitStatus !== RootInProgress || null !== current2 && 0 !== (current2.flags & 128))
                    for (current2 = workInProgress2.child; null !== current2; ) {
                      nextResource = findFirstSuspended(current2);
                      if (null !== nextResource) {
                        workInProgress2.flags |= 128;
                        cutOffTailIfNeeded(newProps, false);
                        current2 = nextResource.updateQueue;
                        workInProgress2.updateQueue = current2;
                        scheduleRetryEffect(workInProgress2, current2);
                        workInProgress2.subtreeFlags = 0;
                        current2 = renderLanes2;
                        for (renderLanes2 = workInProgress2.child; null !== renderLanes2; )
                          resetWorkInProgress(renderLanes2, current2), renderLanes2 = renderLanes2.sibling;
                        pushSuspenseListContext(
                          workInProgress2,
                          suspenseStackCursor.current & SubtreeSuspenseContextMask | ForceSuspenseFallback
                        );
                        isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount);
                        return workInProgress2.child;
                      }
                      current2 = current2.sibling;
                    }
                  null !== newProps.tail && now$1() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
                }
              else {
                if (!type)
                  if (current2 = findFirstSuspended(nextResource), null !== current2) {
                    if (workInProgress2.flags |= 128, type = true, current2 = current2.updateQueue, workInProgress2.updateQueue = current2, scheduleRetryEffect(workInProgress2, current2), cutOffTailIfNeeded(newProps, true), null === newProps.tail && "collapsed" !== newProps.tailMode && "visible" !== newProps.tailMode && !nextResource.alternate && !isHydrating)
                      return bubbleProperties(workInProgress2), null;
                  } else
                    2 * now$1() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && 536870912 !== renderLanes2 && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
                newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current2 = newProps.last, null !== current2 ? current2.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
              }
              if (null !== newProps.tail) {
                current2 = newProps.tail;
                a: {
                  for (renderLanes2 = current2; null !== renderLanes2; ) {
                    if (null !== renderLanes2.alternate) {
                      renderLanes2 = false;
                      break a;
                    }
                    renderLanes2 = renderLanes2.sibling;
                  }
                  renderLanes2 = true;
                }
                newProps.rendering = current2;
                newProps.tail = current2.sibling;
                newProps.renderingStartTime = now$1();
                current2.sibling = null;
                nextResource = suspenseStackCursor.current;
                nextResource = type ? nextResource & SubtreeSuspenseContextMask | ForceSuspenseFallback : nextResource & SubtreeSuspenseContextMask;
                "visible" === newProps.tailMode || "collapsed" === newProps.tailMode || !renderLanes2 || isHydrating ? pushSuspenseListContext(workInProgress2, nextResource) : (renderLanes2 = nextResource, push(
                  suspenseHandlerStackCursor,
                  workInProgress2,
                  workInProgress2
                ), push(suspenseStackCursor, renderLanes2, workInProgress2), null === shellBoundary && (shellBoundary = workInProgress2));
                isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount);
                return current2;
              }
              bubbleProperties(workInProgress2);
              return null;
            case 22:
            case 23:
              return popSuspenseHandler(workInProgress2), popHiddenContext(workInProgress2), newProps = null !== workInProgress2.memoizedState, null !== current2 ? null !== current2.memoizedState !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? 0 !== (renderLanes2 & 536870912) && 0 === (workInProgress2.flags & 128) && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, null !== renderLanes2 && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, null !== current2 && null !== current2.memoizedState && null !== current2.memoizedState.cachePool && (renderLanes2 = current2.memoizedState.cachePool.pool), newProps = null, null !== workInProgress2.memoizedState && null !== workInProgress2.memoizedState.cachePool && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), null !== current2 && pop(resumedCache, workInProgress2), null;
            case 24:
              return renderLanes2 = null, null !== current2 && (renderLanes2 = current2.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext, workInProgress2), bubbleProperties(workInProgress2), null;
            case 25:
              return null;
            case 30:
              return workInProgress2.flags |= 33554432, bubbleProperties(workInProgress2), null;
          }
          throw Error(
            "Unknown unit of work tag (" + workInProgress2.tag + "). This error is likely caused by a bug in React. Please file an issue."
          );
        }
        function unwindWork(current2, workInProgress2) {
          popTreeContext(workInProgress2);
          switch (workInProgress2.tag) {
            case 1:
              return current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, (workInProgress2.mode & 2) !== NoMode && transferActualDuration(workInProgress2), workInProgress2) : null;
            case 3:
              return popProvider(CacheContext, workInProgress2), popHostContainer(workInProgress2), current2 = workInProgress2.flags, 0 !== (current2 & 65536) && 0 === (current2 & 128) ? (workInProgress2.flags = current2 & -65537 | 128, workInProgress2) : null;
            case 26:
            case 27:
            case 5:
              return popHostContext(workInProgress2), null;
            case 31:
              if (null !== workInProgress2.memoizedState) {
                popSuspenseHandler(workInProgress2);
                if (null === workInProgress2.alternate)
                  throw Error(
                    "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
                  );
                resetHydrationState();
              }
              current2 = workInProgress2.flags;
              return current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, (workInProgress2.mode & 2) !== NoMode && transferActualDuration(workInProgress2), workInProgress2) : null;
            case 13:
              popSuspenseHandler(workInProgress2);
              current2 = workInProgress2.memoizedState;
              if (null !== current2 && null !== current2.dehydrated) {
                if (null === workInProgress2.alternate)
                  throw Error(
                    "Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue."
                  );
                resetHydrationState();
              }
              current2 = workInProgress2.flags;
              return current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, (workInProgress2.mode & 2) !== NoMode && transferActualDuration(workInProgress2), workInProgress2) : null;
            case 19:
              return popSuspenseListContext(workInProgress2), current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, current2 = workInProgress2.memoizedState, null !== current2 && (current2.rendering = null, current2.tail = null), workInProgress2.flags |= 4, workInProgress2) : null;
            case 4:
              return popHostContainer(workInProgress2), null;
            case 10:
              return popProvider(workInProgress2.type, workInProgress2), null;
            case 22:
            case 23:
              return popSuspenseHandler(workInProgress2), popHiddenContext(workInProgress2), null !== current2 && pop(resumedCache, workInProgress2), current2 = workInProgress2.flags, current2 & 65536 ? (workInProgress2.flags = current2 & -65537 | 128, (workInProgress2.mode & 2) !== NoMode && transferActualDuration(workInProgress2), workInProgress2) : null;
            case 24:
              return popProvider(CacheContext, workInProgress2), null;
            case 25:
              return null;
            default:
              return null;
          }
        }
        function unwindInterruptedWork(current2, interruptedWork) {
          popTreeContext(interruptedWork);
          switch (interruptedWork.tag) {
            case 3:
              popProvider(CacheContext, interruptedWork);
              popHostContainer(interruptedWork);
              break;
            case 26:
            case 27:
            case 5:
              popHostContext(interruptedWork);
              break;
            case 4:
              popHostContainer(interruptedWork);
              break;
            case 31:
              null !== interruptedWork.memoizedState && popSuspenseHandler(interruptedWork);
              break;
            case 13:
              popSuspenseHandler(interruptedWork);
              break;
            case 19:
              popSuspenseListContext(interruptedWork);
              break;
            case 10:
              popProvider(interruptedWork.type, interruptedWork);
              break;
            case 22:
            case 23:
              popSuspenseHandler(interruptedWork);
              popHiddenContext(interruptedWork);
              null !== current2 && pop(resumedCache, interruptedWork);
              break;
            case 24:
              popProvider(CacheContext, interruptedWork);
          }
        }
        function shouldProfile(current2) {
          return (current2.mode & 2) !== NoMode;
        }
        function commitHookLayoutEffects(finishedWork, hookFlags) {
          shouldProfile(finishedWork) ? (startEffectTimer(), commitHookEffectListMount(hookFlags, finishedWork), recordEffectDuration()) : commitHookEffectListMount(hookFlags, finishedWork);
        }
        function commitHookLayoutUnmountEffects(finishedWork, nearestMountedAncestor, hookFlags) {
          shouldProfile(finishedWork) ? (startEffectTimer(), commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
          ), recordEffectDuration()) : commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
          );
        }
        function commitHookEffectListMount(flags, finishedWork) {
          try {
            var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
            if (null !== lastEffect) {
              var firstEffect = lastEffect.next;
              updateQueue = firstEffect;
              do {
                if ((updateQueue.tag & flags) === flags && (lastEffect = void 0, (flags & Insertion) !== NoFlags && (isRunningInsertionEffect = true), lastEffect = runWithFiberInDEV(
                  finishedWork,
                  callCreateInDEV,
                  updateQueue
                ), (flags & Insertion) !== NoFlags && (isRunningInsertionEffect = false), void 0 !== lastEffect && "function" !== typeof lastEffect)) {
                  var hookName = void 0;
                  hookName = 0 !== (updateQueue.tag & Layout) ? "useLayoutEffect" : 0 !== (updateQueue.tag & Insertion) ? "useInsertionEffect" : "useEffect";
                  var addendum = void 0;
                  addendum = null === lastEffect ? " You returned null. If your effect does not require clean up, return undefined (or nothing)." : "function" === typeof lastEffect.then ? "\n\nIt looks like you wrote " + hookName + "(async () => ...) or returned a Promise. Instead, write the async function inside your effect and call it immediately:\n\n" + hookName + "(() => {\n  async function fetchData() {\n    // You can await here\n    const response = await MyAPI.getData(someId);\n    // ...\n  }\n  fetchData();\n}, [someId]); // Or [] if effect doesn't need props or state\n\nLearn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching" : " You returned: " + lastEffect;
                  runWithFiberInDEV(
                    finishedWork,
                    function(n, a) {
                      console.error(
                        "%s must not return anything besides a function, which is used for clean-up.%s",
                        n,
                        a
                      );
                    },
                    hookName,
                    addendum
                  );
                }
                updateQueue = updateQueue.next;
              } while (updateQueue !== firstEffect);
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor) {
          try {
            var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
            if (null !== lastEffect) {
              var firstEffect = lastEffect.next;
              updateQueue = firstEffect;
              do {
                if ((updateQueue.tag & flags) === flags) {
                  var inst = updateQueue.inst, destroy = inst.destroy;
                  void 0 !== destroy && (inst.destroy = void 0, (flags & Insertion) !== NoFlags && (isRunningInsertionEffect = true), lastEffect = finishedWork, runWithFiberInDEV(
                    lastEffect,
                    callDestroyInDEV,
                    lastEffect,
                    nearestMountedAncestor,
                    destroy
                  ), (flags & Insertion) !== NoFlags && (isRunningInsertionEffect = false));
                }
                updateQueue = updateQueue.next;
              } while (updateQueue !== firstEffect);
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function commitHookPassiveMountEffects(finishedWork, hookFlags) {
          shouldProfile(finishedWork) ? (startEffectTimer(), commitHookEffectListMount(hookFlags, finishedWork), recordEffectDuration()) : commitHookEffectListMount(hookFlags, finishedWork);
        }
        function commitHookPassiveUnmountEffects(finishedWork, nearestMountedAncestor, hookFlags) {
          shouldProfile(finishedWork) ? (startEffectTimer(), commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
          ), recordEffectDuration()) : commitHookEffectListUnmount(
            hookFlags,
            finishedWork,
            nearestMountedAncestor
          );
        }
        function commitClassCallbacks(finishedWork) {
          var updateQueue = finishedWork.updateQueue;
          if (null !== updateQueue) {
            var instance = finishedWork.stateNode;
            finishedWork.type.defaultProps || "ref" in finishedWork.memoizedProps || didWarnAboutReassigningProps || (instance.props !== finishedWork.memoizedProps && console.error(
              "Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
              getComponentNameFromFiber(finishedWork) || "instance"
            ), instance.state !== finishedWork.memoizedState && console.error(
              "Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
              getComponentNameFromFiber(finishedWork) || "instance"
            ));
            try {
              runWithFiberInDEV(
                finishedWork,
                commitCallbacks,
                updateQueue,
                instance
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
        }
        function callGetSnapshotBeforeUpdates(instance, prevProps, prevState) {
          return instance.getSnapshotBeforeUpdate(prevProps, prevState);
        }
        function commitClassSnapshot(finishedWork, current2) {
          var prevProps = current2.memoizedProps, prevState = current2.memoizedState;
          current2 = finishedWork.stateNode;
          finishedWork.type.defaultProps || "ref" in finishedWork.memoizedProps || didWarnAboutReassigningProps || (current2.props !== finishedWork.memoizedProps && console.error(
            "Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ), current2.state !== finishedWork.memoizedState && console.error(
            "Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
            getComponentNameFromFiber(finishedWork) || "instance"
          ));
          try {
            var resolvedPrevProps = resolveClassComponentProps(
              finishedWork.type,
              prevProps
            );
            var snapshot = runWithFiberInDEV(
              finishedWork,
              callGetSnapshotBeforeUpdates,
              current2,
              resolvedPrevProps,
              prevState
            );
            prevProps = didWarnAboutUndefinedSnapshotBeforeUpdate;
            void 0 !== snapshot || prevProps.has(finishedWork.type) || (prevProps.add(finishedWork.type), runWithFiberInDEV(finishedWork, function() {
              console.error(
                "%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.",
                getComponentNameFromFiber(finishedWork)
              );
            }));
            current2.__reactInternalSnapshotBeforeUpdate = snapshot;
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function safelyCallComponentWillUnmount(current2, nearestMountedAncestor, instance) {
          instance.props = resolveClassComponentProps(
            current2.type,
            current2.memoizedProps
          );
          instance.state = current2.memoizedState;
          shouldProfile(current2) ? (startEffectTimer(), runWithFiberInDEV(
            current2,
            callComponentWillUnmountInDEV,
            current2,
            nearestMountedAncestor,
            instance
          ), recordEffectDuration()) : runWithFiberInDEV(
            current2,
            callComponentWillUnmountInDEV,
            current2,
            nearestMountedAncestor,
            instance
          );
        }
        function commitAttachRef(finishedWork) {
          var ref = finishedWork.ref;
          if (null !== ref) {
            switch (finishedWork.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = getPublicInstance(finishedWork.stateNode);
                break;
              case 30:
                instanceToUse = finishedWork.stateNode;
                var name = getViewTransitionName(
                  finishedWork.memoizedProps,
                  instanceToUse
                );
                if (null === instanceToUse.ref || instanceToUse.ref.name !== name)
                  instanceToUse.ref = createViewTransitionInstance(name);
                instanceToUse = instanceToUse.ref;
                break;
              case 7:
                null === finishedWork.stateNode && (finishedWork.stateNode = createFragmentInstance(finishedWork));
                instanceToUse = finishedWork.stateNode;
                break;
              default:
                instanceToUse = finishedWork.stateNode;
            }
            if ("function" === typeof ref)
              if (shouldProfile(finishedWork))
                try {
                  startEffectTimer(), finishedWork.refCleanup = ref(instanceToUse);
                } finally {
                  recordEffectDuration();
                }
              else finishedWork.refCleanup = ref(instanceToUse);
            else
              "string" === typeof ref ? console.error("String refs are no longer supported.") : ref.hasOwnProperty("current") || console.error(
                "Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().",
                getComponentNameFromFiber(finishedWork)
              ), ref.current = instanceToUse;
          }
        }
        function safelyAttachRef(current2, nearestMountedAncestor) {
          try {
            runWithFiberInDEV(current2, commitAttachRef, current2);
          } catch (error) {
            captureCommitPhaseError(current2, nearestMountedAncestor, error);
          }
        }
        function safelyDetachRef(current2, nearestMountedAncestor) {
          var ref = current2.ref, refCleanup = current2.refCleanup;
          if (null !== ref)
            if ("function" === typeof refCleanup)
              try {
                if (shouldProfile(current2))
                  try {
                    startEffectTimer(), runWithFiberInDEV(current2, refCleanup);
                  } finally {
                    recordEffectDuration(current2);
                  }
                else runWithFiberInDEV(current2, refCleanup);
              } catch (error) {
                captureCommitPhaseError(current2, nearestMountedAncestor, error);
              } finally {
                current2.refCleanup = null, current2 = current2.alternate, null != current2 && (current2.refCleanup = null);
              }
            else if ("function" === typeof ref)
              try {
                if (shouldProfile(current2))
                  try {
                    startEffectTimer(), runWithFiberInDEV(current2, ref, null);
                  } finally {
                    recordEffectDuration(current2);
                  }
                else runWithFiberInDEV(current2, ref, null);
              } catch (error$3) {
                captureCommitPhaseError(current2, nearestMountedAncestor, error$3);
              }
            else ref.current = null;
        }
        function commitProfiler(finishedWork, current2, commitStartTime2, effectDuration) {
          var _finishedWork$memoize = finishedWork.memoizedProps, id = _finishedWork$memoize.id, onCommit = _finishedWork$memoize.onCommit;
          _finishedWork$memoize = _finishedWork$memoize.onRender;
          current2 = null === current2 ? "mount" : "update";
          currentUpdateIsNested && (current2 = "nested-update");
          "function" === typeof _finishedWork$memoize && _finishedWork$memoize(
            id,
            current2,
            finishedWork.actualDuration,
            finishedWork.treeBaseDuration,
            finishedWork.actualStartTime,
            commitStartTime2
          );
          "function" === typeof onCommit && onCommit(id, current2, effectDuration, commitStartTime2);
        }
        function commitProfilerPostCommitImpl(finishedWork, current2, commitStartTime2, passiveEffectDuration) {
          var _finishedWork$memoize2 = finishedWork.memoizedProps;
          finishedWork = _finishedWork$memoize2.id;
          _finishedWork$memoize2 = _finishedWork$memoize2.onPostCommit;
          current2 = null === current2 ? "mount" : "update";
          currentUpdateIsNested && (current2 = "nested-update");
          "function" === typeof _finishedWork$memoize2 && _finishedWork$memoize2(
            finishedWork,
            current2,
            passiveEffectDuration,
            commitStartTime2
          );
        }
        function pushMutationContext() {
          var prev = viewTransitionMutationContext;
          viewTransitionMutationContext = false;
          return prev;
        }
        function commitNewChildToFragmentInstances(fiber, parentFragmentInstances) {
          if ((5 === fiber.tag || 27 === fiber.tag || 6 === fiber.tag) && null === fiber.alternate && null !== parentFragmentInstances)
            for (var i = 0; i < parentFragmentInstances.length; i++)
              commitNewChildToFragmentInstance(
                fiber.stateNode,
                parentFragmentInstances[i]
              );
        }
        function commitFragmentInstanceInsertionEffects(fiber) {
          for (var parent = fiber.return; null !== parent; ) {
            isFragmentInstanceParent(parent) && commitNewChildToFragmentInstance(fiber.stateNode, parent.stateNode);
            if (isFragmentInstanceHostBoundary(parent)) break;
            parent = parent.return;
          }
        }
        function commitFragmentInstanceDeletionEffects(fiber) {
          for (var parent = fiber.return; null !== parent; ) {
            isFragmentInstanceParent(parent) && deleteChildFromFragmentInstance(fiber.stateNode, parent.stateNode);
            if (isFragmentInstanceHostBoundary(parent)) break;
            parent = parent.return;
          }
        }
        function isFragmentInstanceHostBoundary(fiber) {
          return 5 === fiber.tag || 3 === fiber.tag || (supportsSingletons ? 27 === fiber.tag : false);
        }
        function isFragmentInstanceParent(fiber) {
          return fiber && 7 === fiber.tag && null !== fiber.stateNode;
        }
        function commitHostMount(finishedWork) {
          var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
          try {
            runWithFiberInDEV(
              finishedWork,
              commitMount,
              instance,
              type,
              props,
              finishedWork
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function commitHostUpdate(finishedWork, newProps, oldProps) {
          try {
            runWithFiberInDEV(
              finishedWork,
              commitUpdate,
              finishedWork.stateNode,
              finishedWork.type,
              oldProps,
              newProps,
              finishedWork
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function isHostParent(fiber) {
          return 5 === fiber.tag || 3 === fiber.tag || (supportsResources ? 26 === fiber.tag : false) || (supportsSingletons ? 27 === fiber.tag && isSingletonScope(fiber.type) : false) || 4 === fiber.tag;
        }
        function getHostSibling(fiber) {
          a: for (; ; ) {
            for (; null === fiber.sibling; ) {
              if (null === fiber.return || isHostParent(fiber.return)) return null;
              fiber = fiber.return;
            }
            fiber.sibling.return = fiber.return;
            for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag; ) {
              if (supportsSingletons && 27 === fiber.tag && isSingletonScope(fiber.type))
                continue a;
              if (fiber.flags & 2) continue a;
              if (null === fiber.child || 4 === fiber.tag) continue a;
              else fiber.child.return = fiber, fiber = fiber.child;
            }
            if (!(fiber.flags & 2)) return fiber.stateNode;
          }
        }
        function insertOrAppendPlacementNodeIntoContainer(node, before, parent, parentFragmentInstances) {
          var tag = node.tag;
          if (5 === tag || 6 === tag)
            tag = node.stateNode, before ? insertInContainerBefore(parent, tag, before) : appendChildToContainer(parent, tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = true;
          else if (4 !== tag && (supportsSingletons && 27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode, before = null)), node = node.child, null !== node))
            for (insertOrAppendPlacementNodeIntoContainer(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling; null !== node; )
              insertOrAppendPlacementNodeIntoContainer(
                node,
                before,
                parent,
                parentFragmentInstances
              ), node = node.sibling;
        }
        function insertOrAppendPlacementNode(node, before, parent, parentFragmentInstances) {
          var tag = node.tag;
          if (5 === tag || 6 === tag)
            tag = node.stateNode, before ? insertBefore(parent, tag, before) : appendChild(parent, tag), commitNewChildToFragmentInstances(node, parentFragmentInstances), viewTransitionMutationContext = true;
          else if (4 !== tag && (supportsSingletons && 27 === tag && (commitNewChildToFragmentInstances(node, parentFragmentInstances), parentFragmentInstances = null, isSingletonScope(node.type) && (parent = node.stateNode)), node = node.child, null !== node))
            for (insertOrAppendPlacementNode(
              node,
              before,
              parent,
              parentFragmentInstances
            ), node = node.sibling; null !== node; )
              insertOrAppendPlacementNode(
                node,
                before,
                parent,
                parentFragmentInstances
              ), node = node.sibling;
        }
        function commitPlacement(finishedWork) {
          for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber; ) {
            if (isHostParent(parentFiber)) {
              hostParentFiber = parentFiber;
              break;
            }
            parentFiber = parentFiber.return;
          }
          parentFiber = null;
          for (var parent = finishedWork.return; null !== parent; ) {
            if (isFragmentInstanceParent(parent)) {
              var fragmentInstance = parent.stateNode;
              null === parentFiber ? parentFiber = [fragmentInstance] : parentFiber.push(fragmentInstance);
            }
            if (isFragmentInstanceHostBoundary(parent)) break;
            parent = parent.return;
          }
          if (supportsMutation) {
            if (null == hostParentFiber)
              throw Error(
                "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
              );
            switch (hostParentFiber.tag) {
              case 27:
                if (supportsSingletons) {
                  hostParentFiber = hostParentFiber.stateNode;
                  parent = getHostSibling(finishedWork);
                  insertOrAppendPlacementNode(
                    finishedWork,
                    parent,
                    hostParentFiber,
                    parentFiber
                  );
                  break;
                }
              case 5:
                parent = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (resetTextContent(parent), hostParentFiber.flags &= -33);
                hostParentFiber = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(
                  finishedWork,
                  hostParentFiber,
                  parent,
                  parentFiber
                );
                break;
              case 3:
              case 4:
                hostParentFiber = hostParentFiber.stateNode.containerInfo;
                parent = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(
                  finishedWork,
                  parent,
                  hostParentFiber,
                  parentFiber
                );
                break;
              default:
                throw Error(
                  "Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue."
                );
            }
          } else
            commitImmutablePlacementNodeToFragmentInstances(
              finishedWork,
              parentFiber
            );
        }
        function commitImmutablePlacementNodeToFragmentInstances(finishedWork, parentFragmentInstances) {
          if (5 === finishedWork.tag || supportsSingletons && 27 === finishedWork.tag)
            commitNewChildToFragmentInstances(
              finishedWork,
              parentFragmentInstances
            );
          else if (4 !== finishedWork.tag && (finishedWork = finishedWork.child, null !== finishedWork))
            for (commitImmutablePlacementNodeToFragmentInstances(
              finishedWork,
              parentFragmentInstances
            ), finishedWork = finishedWork.sibling; null !== finishedWork; )
              commitImmutablePlacementNodeToFragmentInstances(
                finishedWork,
                parentFragmentInstances
              ), finishedWork = finishedWork.sibling;
        }
        function commitHostPortalContainerChildren(portal, finishedWork, pendingChildren) {
          portal = portal.containerInfo;
          try {
            runWithFiberInDEV(
              finishedWork,
              replaceContainerChildren,
              portal,
              pendingChildren
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function commitHostSingletonAcquisition(finishedWork) {
          var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
          try {
            runWithFiberInDEV(
              finishedWork,
              acquireSingletonInstance,
              finishedWork.type,
              props,
              singleton,
              finishedWork
            );
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
        function trackEnterViewTransitions(placement) {
          if (30 === placement.tag || 0 !== (placement.subtreeFlags & 33554432))
            shouldStartViewTransition = true;
        }
        function pushViewTransitionCancelableScope() {
          var prevChildren = viewTransitionCancelableChildren;
          viewTransitionCancelableChildren = null;
          return prevChildren;
        }
        function applyViewTransitionToHostInstances(fiber, name, className, collectMeasurements, stopAtNestedViewTransitions) {
          viewTransitionHostInstanceIdx = 0;
          (name = applyViewTransitionToHostInstancesRecursive(
            fiber.child,
            name,
            className,
            collectMeasurements,
            stopAtNestedViewTransitions
          )) && null != fiber._debugTask && null === animatingTask && (animatingTask = fiber._debugTask);
          return name;
        }
        function applyViewTransitionToHostInstancesRecursive(child, name, className, collectMeasurements, stopAtNestedViewTransitions) {
          if (!supportsMutation) return false;
          for (var inViewport = false; null !== child; ) {
            if (5 === child.tag) {
              var _instance = child.stateNode;
              if (null !== collectMeasurements) {
                var measurement = measureInstance(_instance);
                collectMeasurements.push(measurement);
                wasInstanceInViewport(measurement) && (inViewport = true);
              } else
                inViewport || wasInstanceInViewport(measureInstance(_instance)) && (inViewport = true);
              shouldStartViewTransition = true;
              applyViewTransitionName(
                _instance,
                0 === viewTransitionHostInstanceIdx ? name : name + "_" + viewTransitionHostInstanceIdx,
                className
              );
              viewTransitionHostInstanceIdx++;
            } else if (22 !== child.tag || null === child.memoizedState)
              30 === child.tag && stopAtNestedViewTransitions || applyViewTransitionToHostInstancesRecursive(
                child.child,
                name,
                className,
                collectMeasurements,
                stopAtNestedViewTransitions
              ) && (inViewport = true);
            child = child.sibling;
          }
          return inViewport;
        }
        function restoreViewTransitionOnHostInstances(child, stopAtNestedViewTransitions) {
          if (supportsMutation)
            for (; null !== child; ) {
              if (5 === child.tag)
                restoreViewTransitionName(child.stateNode, child.memoizedProps);
              else if (22 !== child.tag || null === child.memoizedState)
                30 === child.tag && stopAtNestedViewTransitions || restoreViewTransitionOnHostInstances(
                  child.child,
                  stopAtNestedViewTransitions
                );
              child = child.sibling;
            }
        }
        function commitAppearingPairViewTransitions(placement) {
          if (0 !== (placement.subtreeFlags & 18874368))
            for (placement = placement.child; null !== placement; ) {
              if (22 !== placement.tag || null === placement.memoizedState) {
                if (commitAppearingPairViewTransitions(placement), 30 === placement.tag && 0 !== (placement.flags & 18874368) && placement.stateNode.paired) {
                  var props = placement.memoizedProps;
                  if (null == props.name || "auto" === props.name)
                    throw Error(
                      "Found a pair with an auto name. This is a bug in React."
                    );
                  var name = props.name;
                  props = getViewTransitionClassName(props.default, props.share);
                  "none" !== props && (applyViewTransitionToHostInstances(
                    placement,
                    name,
                    props,
                    null,
                    false
                  ) || restoreViewTransitionOnHostInstances(placement.child, false));
                }
              }
              placement = placement.sibling;
            }
        }
        function commitEnterViewTransitions(placement, gesture) {
          if (30 === placement.tag) {
            var state = placement.stateNode, props = placement.memoizedProps, name = getViewTransitionName(props, state), className = getViewTransitionClassName(
              props.default,
              state.paired ? props.share : props.enter
            );
            "none" !== className ? applyViewTransitionToHostInstances(
              placement,
              name,
              className,
              null,
              false
            ) ? (commitAppearingPairViewTransitions(placement), state.paired || gesture || scheduleViewTransitionEvent(placement, props.onEnter)) : restoreViewTransitionOnHostInstances(placement.child, false) : commitAppearingPairViewTransitions(placement);
          } else if (0 !== (placement.subtreeFlags & 33554432))
            for (placement = placement.child; null !== placement; )
              commitEnterViewTransitions(placement, gesture), placement = placement.sibling;
          else commitAppearingPairViewTransitions(placement);
        }
        function commitDeletedPairViewTransitions(deletion) {
          if (null !== appearingViewTransitions && 0 !== appearingViewTransitions.size) {
            var pairs = appearingViewTransitions;
            if (0 !== (deletion.subtreeFlags & 18874368))
              for (deletion = deletion.child; null !== deletion; ) {
                if (22 !== deletion.tag || null === deletion.memoizedState) {
                  if (30 === deletion.tag && 0 !== (deletion.flags & 18874368)) {
                    var props = deletion.memoizedProps, name = props.name;
                    if (null != name && "auto" !== name) {
                      var pair = pairs.get(name);
                      if (void 0 !== pair) {
                        var className = getViewTransitionClassName(
                          props.default,
                          props.share
                        );
                        "none" !== className && (applyViewTransitionToHostInstances(
                          deletion,
                          name,
                          className,
                          null,
                          false
                        ) ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, scheduleViewTransitionEvent(deletion, props.onShare)) : restoreViewTransitionOnHostInstances(
                          deletion.child,
                          false
                        ));
                        pairs.delete(name);
                        if (0 === pairs.size) break;
                      }
                    }
                  }
                  commitDeletedPairViewTransitions(deletion);
                }
                deletion = deletion.sibling;
              }
          }
        }
        function commitExitViewTransitions(deletion) {
          if (30 === deletion.tag) {
            var props = deletion.memoizedProps, name = getViewTransitionName(props, deletion.stateNode), pair = null !== appearingViewTransitions ? appearingViewTransitions.get(name) : void 0, className = getViewTransitionClassName(
              props.default,
              void 0 !== pair ? props.share : props.exit
            );
            "none" !== className && (applyViewTransitionToHostInstances(
              deletion,
              name,
              className,
              null,
              false
            ) ? void 0 !== pair ? (className = deletion.stateNode, pair.paired = className, className.paired = pair, appearingViewTransitions.delete(name), scheduleViewTransitionEvent(deletion, props.onShare)) : scheduleViewTransitionEvent(deletion, props.onExit) : restoreViewTransitionOnHostInstances(deletion.child, false));
            null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
          } else if (0 !== (deletion.subtreeFlags & 33554432))
            for (deletion = deletion.child; null !== deletion; )
              commitExitViewTransitions(deletion), deletion = deletion.sibling;
          else
            null !== appearingViewTransitions && commitDeletedPairViewTransitions(deletion);
        }
        function commitNestedViewTransitions(changedParent) {
          for (changedParent = changedParent.child; null !== changedParent; ) {
            if (30 === changedParent.tag) {
              var props = changedParent.memoizedProps, name = getViewTransitionName(props, changedParent.stateNode);
              props = getViewTransitionClassName(props.default, props.update);
              changedParent.flags &= -5;
              "none" !== props && applyViewTransitionToHostInstances(
                changedParent,
                name,
                props,
                changedParent.memoizedState = [],
                false
              );
            } else
              0 !== (changedParent.subtreeFlags & 33554432) && commitNestedViewTransitions(changedParent);
            changedParent = changedParent.sibling;
          }
        }
        function restorePairedViewTransitions(parent) {
          if (0 !== (parent.subtreeFlags & 18874368))
            for (parent = parent.child; null !== parent; ) {
              if (22 !== parent.tag || null === parent.memoizedState) {
                if (30 === parent.tag && 0 !== (parent.flags & 18874368)) {
                  var instance = parent.stateNode;
                  null !== instance.paired && (instance.paired = null, restoreViewTransitionOnHostInstances(parent.child, false));
                }
                restorePairedViewTransitions(parent);
              }
              parent = parent.sibling;
            }
        }
        function restoreEnterOrExitViewTransitions(fiber) {
          if (30 === fiber.tag)
            fiber.stateNode.paired = null, restoreViewTransitionOnHostInstances(fiber.child, false), restorePairedViewTransitions(fiber);
          else if (0 !== (fiber.subtreeFlags & 33554432))
            for (fiber = fiber.child; null !== fiber; )
              restoreEnterOrExitViewTransitions(fiber), fiber = fiber.sibling;
          else restorePairedViewTransitions(fiber);
        }
        function restoreNestedViewTransitions(changedParent) {
          for (changedParent = changedParent.child; null !== changedParent; )
            30 === changedParent.tag ? restoreViewTransitionOnHostInstances(changedParent.child, false) : 0 !== (changedParent.subtreeFlags & 33554432) && restoreNestedViewTransitions(changedParent), changedParent = changedParent.sibling;
        }
        function measureViewTransitionHostInstancesRecursive(parentViewTransition, child, newName, oldName, className, previousMeasurements, stopAtNestedViewTransitions) {
          if (!supportsMutation) return false;
          for (var inViewport = false; null !== child; ) {
            if (5 === child.tag) {
              var _instance2 = child.stateNode;
              if (null !== previousMeasurements && viewTransitionHostInstanceIdx < previousMeasurements.length) {
                var previousMeasurement = previousMeasurements[viewTransitionHostInstanceIdx], nextMeasurement = measureInstance(_instance2);
                if (wasInstanceInViewport(previousMeasurement) || wasInstanceInViewport(nextMeasurement))
                  inViewport = true;
                0 === (parentViewTransition.flags & 4) && hasInstanceChanged(previousMeasurement, nextMeasurement) && (parentViewTransition.flags |= 4);
                hasInstanceAffectedParent(previousMeasurement, nextMeasurement) && (parentViewTransition.flags |= 32);
              } else parentViewTransition.flags |= 32;
              0 !== (parentViewTransition.flags & 4) && applyViewTransitionName(
                _instance2,
                0 === viewTransitionHostInstanceIdx ? newName : newName + "_" + viewTransitionHostInstanceIdx,
                className
              );
              inViewport && 0 !== (parentViewTransition.flags & 4) || (null === viewTransitionCancelableChildren && (viewTransitionCancelableChildren = []), viewTransitionCancelableChildren.push(
                _instance2,
                0 === viewTransitionHostInstanceIdx ? oldName : oldName + "_" + viewTransitionHostInstanceIdx,
                child.memoizedProps
              ));
              viewTransitionHostInstanceIdx++;
            } else if (22 !== child.tag || null === child.memoizedState)
              30 === child.tag && stopAtNestedViewTransitions ? parentViewTransition.flags |= child.flags & 32 : measureViewTransitionHostInstancesRecursive(
                parentViewTransition,
                child.child,
                newName,
                oldName,
                className,
                previousMeasurements,
                stopAtNestedViewTransitions
              ) && (inViewport = true);
            child = child.sibling;
          }
          return inViewport;
        }
        function measureNestedViewTransitions(changedParent, gesture) {
          for (changedParent = changedParent.child; null !== changedParent; ) {
            if (30 === changedParent.tag) {
              var props = changedParent.memoizedProps, state = changedParent.stateNode, name = getViewTransitionName(props, state), className = getViewTransitionClassName(props.default, props.update);
              if (gesture) {
                state = state.clones;
                var previousMeasurements = null === state ? null : state.map(measureClonedInstance);
              } else
                previousMeasurements = changedParent.memoizedState, changedParent.memoizedState = null;
              state = changedParent;
              var child = changedParent.child, newName = name;
              viewTransitionHostInstanceIdx = 0;
              className = measureViewTransitionHostInstancesRecursive(
                state,
                child,
                newName,
                name,
                className,
                previousMeasurements,
                false
              );
              0 !== (changedParent.flags & 4) && className && (gesture || scheduleViewTransitionEvent(changedParent, props.onUpdate));
            } else
              0 !== (changedParent.subtreeFlags & 33554432) && measureNestedViewTransitions(changedParent, gesture);
            changedParent = changedParent.sibling;
          }
        }
        function trackNamedViewTransition(fiber) {
          var name = fiber.memoizedProps.name;
          if (null != name && "auto" !== name) {
            var existing = mountedNamedViewTransitions.get(name);
            if (void 0 !== existing) {
              if (existing !== fiber && existing !== fiber.alternate && !didWarnAboutName[name]) {
                didWarnAboutName[name] = true;
                var stringifiedName = JSON.stringify(name);
                runWithFiberInDEV(fiber, function() {
                  console.error(
                    "There are two <ViewTransition name=%s> components with the same name mounted at the same time. This is not supported and will cause View Transitions to error. Try to use a more unique name e.g. by using a namespace prefix and adding the id of an item to the name.",
                    stringifiedName
                  );
                });
                runWithFiberInDEV(existing, function() {
                  console.error(
                    "The existing <ViewTransition name=%s> duplicate has this stack trace.",
                    stringifiedName
                  );
                });
              }
            } else mountedNamedViewTransitions.set(name, fiber);
          }
        }
        function untrackNamedViewTransition(fiber) {
          var name = fiber.memoizedProps.name;
          if (null != name && "auto" !== name) {
            var existing = mountedNamedViewTransitions.get(name);
            void 0 === existing || existing !== fiber && existing !== fiber.alternate || mountedNamedViewTransitions.delete(name);
          }
        }
        function isHydratingParent(current2, finishedWork) {
          return 31 === finishedWork.tag ? (finishedWork = finishedWork.memoizedState, null !== current2.memoizedState && null === finishedWork) : 13 === finishedWork.tag ? (current2 = current2.memoizedState, finishedWork = finishedWork.memoizedState, null !== current2 && null !== current2.dehydrated && (null === finishedWork || null === finishedWork.dehydrated)) : 3 === finishedWork.tag ? current2.memoizedState.isDehydrated && 0 === (finishedWork.flags & 256) : false;
        }
        function commitBeforeMutationEffects(root2, firstChild, committedLanes) {
          prepareForCommit(root2.containerInfo);
          root2 = (committedLanes & 335544064) === committedLanes;
          nextEffect = firstChild;
          for (firstChild = root2 ? 9270 : 1024; null !== nextEffect; ) {
            committedLanes = nextEffect;
            if (root2) {
              var deletions = committedLanes.deletions;
              if (null !== deletions)
                for (var i = 0; i < deletions.length; i++)
                  root2 && commitExitViewTransitions(deletions[i]);
            }
            if (null === committedLanes.alternate && 0 !== (committedLanes.flags & 2))
              root2 && trackEnterViewTransitions(committedLanes), commitBeforeMutationEffects_complete(root2);
            else {
              if (22 === committedLanes.tag) {
                if (deletions = committedLanes.alternate, null !== committedLanes.memoizedState) {
                  null !== deletions && null === deletions.memoizedState && root2 && commitExitViewTransitions(deletions);
                  commitBeforeMutationEffects_complete(root2);
                  continue;
                } else if (null !== deletions && null !== deletions.memoizedState) {
                  root2 && trackEnterViewTransitions(committedLanes);
                  commitBeforeMutationEffects_complete(root2);
                  continue;
                }
              }
              deletions = committedLanes.child;
              0 !== (committedLanes.subtreeFlags & firstChild) && null !== deletions ? (deletions.return = committedLanes, nextEffect = deletions) : (root2 && commitNestedViewTransitions(committedLanes), commitBeforeMutationEffects_complete(root2));
            }
          }
          appearingViewTransitions = null;
        }
        function commitBeforeMutationEffects_complete(isViewTransitionEligible$jscomp$0) {
          for (; null !== nextEffect; ) {
            var fiber = nextEffect, finishedWork = fiber, isViewTransitionEligible = isViewTransitionEligible$jscomp$0, current2 = finishedWork.alternate, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                0 !== (flags & 1024) && null !== current2 && commitClassSnapshot(finishedWork, current2);
                break;
              case 3:
                0 !== (flags & 1024) && supportsMutation && clearContainer(finishedWork.stateNode.containerInfo);
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              case 30:
                isViewTransitionEligible && null !== current2 && (isViewTransitionEligible = current2, current2 = finishedWork, finishedWork = getViewTransitionName(
                  isViewTransitionEligible.memoizedProps,
                  isViewTransitionEligible.stateNode
                ), current2 = current2.memoizedProps, current2 = getViewTransitionClassName(
                  current2.default,
                  current2.update
                ), "none" !== current2 && applyViewTransitionToHostInstances(
                  isViewTransitionEligible,
                  finishedWork,
                  current2,
                  isViewTransitionEligible.memoizedState = [],
                  true
                ));
                break;
              default:
                if (0 !== (flags & 1024))
                  throw Error(
                    "This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue."
                  );
            }
            isViewTransitionEligible = fiber.sibling;
            if (null !== isViewTransitionEligible) {
              isViewTransitionEligible.return = fiber.return;
              nextEffect = isViewTransitionEligible;
              break;
            }
            nextEffect = fiber.return;
          }
        }
        function commitLayoutEffectOnFiber(finishedRoot, current2, finishedWork) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(), flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              flags & 4 && commitHookLayoutEffects(finishedWork, Layout | HasEffect);
              break;
            case 1:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              if (flags & 4)
                if (finishedRoot = finishedWork.stateNode, null === current2)
                  finishedWork.type.defaultProps || "ref" in finishedWork.memoizedProps || didWarnAboutReassigningProps || (finishedRoot.props !== finishedWork.memoizedProps && console.error(
                    "Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ), finishedRoot.state !== finishedWork.memoizedState && console.error(
                    "Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  )), shouldProfile(finishedWork) ? (startEffectTimer(), runWithFiberInDEV(
                    finishedWork,
                    callComponentDidMountInDEV,
                    finishedWork,
                    finishedRoot
                  ), recordEffectDuration()) : runWithFiberInDEV(
                    finishedWork,
                    callComponentDidMountInDEV,
                    finishedWork,
                    finishedRoot
                  );
                else {
                  var prevProps = resolveClassComponentProps(
                    finishedWork.type,
                    current2.memoizedProps
                  );
                  current2 = current2.memoizedState;
                  finishedWork.type.defaultProps || "ref" in finishedWork.memoizedProps || didWarnAboutReassigningProps || (finishedRoot.props !== finishedWork.memoizedProps && console.error(
                    "Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ), finishedRoot.state !== finishedWork.memoizedState && console.error(
                    "Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.",
                    getComponentNameFromFiber(finishedWork) || "instance"
                  ));
                  shouldProfile(finishedWork) ? (startEffectTimer(), runWithFiberInDEV(
                    finishedWork,
                    callComponentDidUpdateInDEV,
                    finishedWork,
                    finishedRoot,
                    prevProps,
                    current2,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  ), recordEffectDuration()) : runWithFiberInDEV(
                    finishedWork,
                    callComponentDidUpdateInDEV,
                    finishedWork,
                    finishedRoot,
                    prevProps,
                    current2,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
                }
              flags & 64 && commitClassCallbacks(finishedWork);
              flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 3:
              current2 = pushNestedEffectDurations();
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              if (flags & 64 && (flags = finishedWork.updateQueue, null !== flags)) {
                prevProps = null;
                if (null !== finishedWork.child)
                  switch (finishedWork.child.tag) {
                    case 27:
                    case 5:
                      prevProps = getPublicInstance(finishedWork.child.stateNode);
                      break;
                    case 1:
                      prevProps = finishedWork.child.stateNode;
                  }
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitCallbacks,
                    flags,
                    prevProps
                  );
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
              finishedRoot.effectDuration += popNestedEffectDurations(current2);
              break;
            case 27:
              supportsSingletons && null === current2 && flags & 4 && commitHostSingletonAcquisition(finishedWork);
            case 26:
            case 5:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              if (null === current2) {
                if (flags & 4) commitHostMount(finishedWork);
                else if (flags & 64) {
                  finishedRoot = finishedWork.type;
                  current2 = finishedWork.memoizedProps;
                  prevProps = finishedWork.stateNode;
                  try {
                    runWithFiberInDEV(
                      finishedWork,
                      commitHydratedInstance,
                      prevProps,
                      finishedRoot,
                      current2,
                      finishedWork
                    );
                  } catch (error) {
                    captureCommitPhaseError(
                      finishedWork,
                      finishedWork.return,
                      error
                    );
                  }
                }
              }
              flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              if (flags & 4) {
                flags = pushNestedEffectDurations();
                recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
                finishedRoot = finishedWork.stateNode;
                finishedRoot.effectDuration += bubbleNestedEffectDurations(flags);
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitProfiler,
                    finishedWork,
                    current2,
                    commitStartTime,
                    finishedRoot.effectDuration
                  );
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              } else recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              break;
            case 31:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (flags = retryDehydratedSuspenseBoundary.bind(
                null,
                finishedWork
              ), registerSuspenseInstanceRetry(finishedRoot, flags))));
              break;
            case 22:
              flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
              if (!flags) {
                var newOffscreenSubtreeWasHidden = null !== current2 && null !== current2.memoizedState || offscreenSubtreeWasHidden;
                current2 = offscreenSubtreeIsHidden;
                prevProps = offscreenSubtreeWasHidden;
                offscreenSubtreeIsHidden = flags;
                (offscreenSubtreeWasHidden = newOffscreenSubtreeWasHidden) && !prevProps ? (flags = supportsSingletons ? IncludeHostSingletons : NoLayoutEffectTraversalFlags, 0 !== (finishedWork.subtreeFlags & 8772) && (flags |= IncludeWorkInProgressEffects), recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  flags
                ), (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentReappeared(
                  finishedWork,
                  componentEffectStartTime,
                  componentEffectEndTime
                )) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
                offscreenSubtreeIsHidden = current2;
                offscreenSubtreeWasHidden = prevProps;
              }
              break;
            case 30:
              flags & 18874368 && trackNamedViewTransition(finishedWork);
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 7:
              flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          ), null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate && 0.05 < componentEffectEndTime - componentEffectStartTime && (isHydratingParent(
            finishedWork.return.alternate,
            finishedWork.return
          ) || logComponentTrigger(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            "Mount"
          )));
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        }
        function hideOrUnhideAllChildren(parentFiber, isHidden) {
          if (supportsMutation)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              hideOrUnhideAllChildrenOnFiber(parentFiber, isHidden), parentFiber = parentFiber.sibling;
        }
        function hideOrUnhideAllChildrenOnFiber(fiber, isHidden) {
          if (supportsMutation)
            switch (fiber.tag) {
              case 5:
              case 26:
                try {
                  var instance = fiber.stateNode;
                  isHidden ? runWithFiberInDEV(fiber, hideInstance, instance) : runWithFiberInDEV(
                    fiber,
                    unhideInstance,
                    fiber.stateNode,
                    fiber.memoizedProps
                  );
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
                hideOrUnhideNearestPortals(fiber, isHidden);
                break;
              case 6:
                try {
                  var instance$jscomp$0 = fiber.stateNode;
                  isHidden ? runWithFiberInDEV(fiber, hideTextInstance, instance$jscomp$0) : runWithFiberInDEV(
                    fiber,
                    unhideTextInstance,
                    instance$jscomp$0,
                    fiber.memoizedProps
                  );
                  viewTransitionMutationContext = true;
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
                break;
              case 18:
                try {
                  var instance$jscomp$1 = fiber.stateNode;
                  isHidden ? runWithFiberInDEV(
                    fiber,
                    hideDehydratedBoundary,
                    instance$jscomp$1
                  ) : runWithFiberInDEV(
                    fiber,
                    unhideDehydratedBoundary,
                    fiber.stateNode
                  );
                } catch (error) {
                  captureCommitPhaseError(fiber, fiber.return, error);
                }
                break;
              case 22:
              case 23:
                null === fiber.memoizedState && hideOrUnhideAllChildren(fiber, isHidden);
                break;
              default:
                hideOrUnhideAllChildren(fiber, isHidden);
            }
        }
        function hideOrUnhideNearestPortals(parentFiber, isHidden$jscomp$0) {
          if (supportsMutation && parentFiber.subtreeFlags & 67108864)
            for (parentFiber = parentFiber.child; null !== parentFiber; ) {
              var fiber = parentFiber, isHidden = isHidden$jscomp$0;
              if (supportsMutation)
                switch (fiber.tag) {
                  case 4:
                    hideOrUnhideAllChildrenOnFiber(fiber, isHidden);
                    break;
                  case 22:
                    null === fiber.memoizedState && hideOrUnhideNearestPortals(fiber, isHidden);
                    break;
                  default:
                    hideOrUnhideNearestPortals(fiber, isHidden);
                }
              parentFiber = parentFiber.sibling;
            }
        }
        function detachFiberAfterEffects(fiber) {
          var alternate = fiber.alternate;
          null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
          fiber.child = null;
          fiber.deletions = null;
          fiber.sibling = null;
          5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
          fiber.stateNode = null;
          fiber._debugOwner = null;
          fiber.return = null;
          fiber.dependencies = null;
          fiber.memoizedProps = null;
          fiber.memoizedState = null;
          fiber.pendingProps = null;
          fiber.stateNode = null;
          fiber.updateQueue = null;
        }
        function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
          for (parent = parent.child; null !== parent; )
            commitDeletionEffectsOnFiber(
              finishedRoot,
              nearestMountedAncestor,
              parent
            ), parent = parent.sibling;
        }
        function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
          if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
            try {
              injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
            } catch (err) {
              hasLoggedError || (hasLoggedError = true, console.error(
                "React instrumentation encountered an error: %o",
                err
              ));
            }
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
          switch (deletedFiber.tag) {
            case 26:
              if (supportsResources) {
                offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
                recursivelyTraverseDeletionEffects(
                  finishedRoot,
                  nearestMountedAncestor,
                  deletedFiber
                );
                deletedFiber.memoizedState ? releaseResource(deletedFiber.memoizedState) : deletedFiber.stateNode && (offscreenSubtreeWasHidden || unmountHoistable(deletedFiber.stateNode));
                break;
              }
            case 27:
              if (supportsSingletons) {
                offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
                commitFragmentInstanceDeletionEffects(deletedFiber);
                var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
                isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = false);
                recursivelyTraverseDeletionEffects(
                  finishedRoot,
                  nearestMountedAncestor,
                  deletedFiber
                );
                runWithFiberInDEV(
                  deletedFiber,
                  releaseSingletonInstance,
                  deletedFiber.stateNode,
                  deletedFiber.type,
                  deletedFiber.memoizedProps
                );
                hostParent = prevHostParent;
                hostParentIsContainer = prevHostParentIsContainer;
                break;
              }
            case 5:
              offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor), commitFragmentInstanceDeletionEffects(deletedFiber);
            case 6:
              6 === deletedFiber.tag && commitFragmentInstanceDeletionEffects(deletedFiber);
              if (supportsMutation) {
                if (prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = null, recursivelyTraverseDeletionEffects(
                  finishedRoot,
                  nearestMountedAncestor,
                  deletedFiber
                ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer, null !== hostParent)
                  if (hostParentIsContainer)
                    try {
                      runWithFiberInDEV(
                        deletedFiber,
                        removeChildFromContainer,
                        hostParent,
                        deletedFiber.stateNode
                      ), viewTransitionMutationContext = true;
                    } catch (error) {
                      captureCommitPhaseError(
                        deletedFiber,
                        nearestMountedAncestor,
                        error
                      );
                    }
                  else
                    try {
                      runWithFiberInDEV(
                        deletedFiber,
                        removeChild,
                        hostParent,
                        deletedFiber.stateNode
                      ), viewTransitionMutationContext = true;
                    } catch (error) {
                      captureCommitPhaseError(
                        deletedFiber,
                        nearestMountedAncestor,
                        error
                      );
                    }
              } else
                recursivelyTraverseDeletionEffects(
                  finishedRoot,
                  nearestMountedAncestor,
                  deletedFiber
                );
              break;
            case 18:
              supportsMutation && null !== hostParent && (hostParentIsContainer ? clearSuspenseBoundaryFromContainer(
                hostParent,
                deletedFiber.stateNode
              ) : clearSuspenseBoundary(hostParent, deletedFiber.stateNode));
              break;
            case 4:
              supportsMutation ? (prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer, hostParent = deletedFiber.stateNode.containerInfo, hostParentIsContainer = true, recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ), hostParent = prevHostParent, hostParentIsContainer = prevHostParentIsContainer) : (supportsPersistence && commitHostPortalContainerChildren(
                deletedFiber.stateNode,
                deletedFiber,
                createContainerChildSet()
              ), recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              ));
              break;
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(
                Insertion,
                deletedFiber,
                nearestMountedAncestor
              );
              offscreenSubtreeWasHidden || commitHookLayoutUnmountEffects(
                deletedFiber,
                nearestMountedAncestor,
                Layout
              );
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              break;
            case 1:
              offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(
                deletedFiber,
                nearestMountedAncestor,
                prevHostParent
              ));
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              break;
            case 21:
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              break;
            case 22:
              offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              offscreenSubtreeWasHidden = prevHostParent;
              break;
            case 30:
              deletedFiber.flags & 18874368 && untrackNamedViewTransition(deletedFiber);
              safelyDetachRef(deletedFiber, nearestMountedAncestor);
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              break;
            case 7:
              offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
              break;
            default:
              recursivelyTraverseDeletionEffects(
                finishedRoot,
                nearestMountedAncestor,
                deletedFiber
              );
          }
          (deletedFiber.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            deletedFiber,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        }
        function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
          if (supportsHydration && null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
            finishedRoot = finishedRoot.dehydrated;
            try {
              runWithFiberInDEV(
                finishedWork,
                commitHydratedActivityInstance,
                finishedRoot
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
        }
        function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
          if (supportsHydration && null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot))))
            try {
              runWithFiberInDEV(
                finishedWork,
                commitHydratedSuspenseInstance,
                finishedRoot
              );
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
        }
        function getRetryCache(finishedWork) {
          switch (finishedWork.tag) {
            case 31:
            case 13:
            case 19:
              var retryCache = finishedWork.stateNode;
              null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
              return retryCache;
            case 22:
              return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
            default:
              throw Error(
                "Unexpected Suspense handler tag (" + finishedWork.tag + "). This is a bug in React."
              );
          }
        }
        function attachSuspenseRetryListeners(finishedWork, wakeables) {
          var retryCache = getRetryCache(finishedWork);
          wakeables.forEach(function(wakeable) {
            if (!retryCache.has(wakeable)) {
              retryCache.add(wakeable);
              if (isDevToolsPresent)
                if (null !== inProgressLanes && null !== inProgressRoot)
                  restorePendingUpdaters(inProgressRoot, inProgressLanes);
                else
                  throw Error(
                    "Expected finished root and lanes to be set. This is a bug in React."
                  );
              var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
              wakeable.then(retry, retry);
            }
          });
        }
        function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber, lanes) {
          var deletions = parentFiber.deletions;
          if (null !== deletions)
            for (var i = 0; i < deletions.length; i++) {
              var root2 = root$jscomp$0, returnFiber = parentFiber, deletedFiber = deletions[i], prevEffectStart = pushComponentEffectStart();
              if (supportsMutation) {
                var parent = returnFiber;
                a: for (; null !== parent; ) {
                  switch (parent.tag) {
                    case 27:
                      if (supportsSingletons) {
                        if (isSingletonScope(parent.type)) {
                          hostParent = parent.stateNode;
                          hostParentIsContainer = false;
                          break a;
                        }
                        break;
                      }
                    case 5:
                      hostParent = parent.stateNode;
                      hostParentIsContainer = false;
                      break a;
                    case 3:
                    case 4:
                      hostParent = parent.stateNode.containerInfo;
                      hostParentIsContainer = true;
                      break a;
                  }
                  parent = parent.return;
                }
                if (null === hostParent)
                  throw Error(
                    "Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue."
                  );
                commitDeletionEffectsOnFiber(root2, returnFiber, deletedFiber);
                hostParent = null;
                hostParentIsContainer = false;
              } else commitDeletionEffectsOnFiber(root2, returnFiber, deletedFiber);
              (deletedFiber.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
                deletedFiber,
                componentEffectStartTime,
                componentEffectEndTime,
                "Unmount"
              );
              popComponentEffectStart(prevEffectStart);
              root2 = deletedFiber;
              returnFiber = root2.alternate;
              null !== returnFiber && (returnFiber.return = null);
              root2.return = null;
            }
          if (parentFiber.subtreeFlags & 13886)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              commitMutationEffectsOnFiber(parentFiber, root$jscomp$0, lanes), parentFiber = parentFiber.sibling;
        }
        function commitMutationEffectsOnFiber(finishedWork, root2, lanes) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(), current2 = finishedWork.alternate, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              if (flags & 4 && (current2 = finishedWork.updateQueue, current2 = null !== current2 ? current2.events : null, null !== current2))
                for (var ii = 0; ii < current2.length; ii++) {
                  var _eventPayloads$ii2 = current2[ii];
                  _eventPayloads$ii2.ref.impl = _eventPayloads$ii2.nextImpl;
                }
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              flags & 4 && (commitHookEffectListUnmount(
                Insertion | HasEffect,
                finishedWork,
                finishedWork.return
              ), commitHookEffectListMount(Insertion | HasEffect, finishedWork), commitHookLayoutUnmountEffects(
                finishedWork,
                finishedWork.return,
                Layout | HasEffect
              ));
              break;
            case 1:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return));
              flags & 64 && offscreenSubtreeIsHidden && (root2 = finishedWork.updateQueue, null !== root2 && (flags = root2.callbacks, null !== flags && (lanes = root2.shared.hiddenCallbacks, root2.shared.hiddenCallbacks = null === lanes ? flags : lanes.concat(flags))));
              break;
            case 26:
              if (supportsResources) {
                ii = currentHoistableRoot;
                recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return));
                flags & 4 && (lanes = null !== current2 ? current2.memoizedState : null, flags = finishedWork.memoizedState, null === current2 ? null === flags ? null === finishedWork.stateNode ? finishedWork.stateNode = offscreenSubtreeIsHidden ? createHoistableInstance(
                  finishedWork.type,
                  finishedWork.memoizedProps,
                  root2.containerInfo,
                  finishedWork
                ) : hydrateHoistable(
                  ii,
                  finishedWork.type,
                  finishedWork.memoizedProps,
                  finishedWork
                ) : offscreenSubtreeIsHidden || mountHoistable(
                  ii,
                  finishedWork.type,
                  finishedWork.stateNode
                ) : finishedWork.stateNode = acquireResource(
                  ii,
                  flags,
                  finishedWork.memoizedProps
                ) : lanes !== flags ? (null === lanes ? (root2 = current2.stateNode, null === root2 || offscreenSubtreeWasHidden || unmountHoistable(root2)) : releaseResource(lanes), null === flags ? offscreenSubtreeIsHidden || mountHoistable(
                  ii,
                  finishedWork.type,
                  finishedWork.stateNode
                ) : acquireResource(ii, flags, finishedWork.memoizedProps)) : null === flags && null !== finishedWork.stateNode && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current2.memoizedProps
                ));
                break;
              }
            case 27:
              if (supportsSingletons) {
                recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
                commitReconciliationEffects(finishedWork);
                flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return));
                null !== current2 && flags & 4 && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current2.memoizedProps
                );
                break;
              }
            case 5:
              ii = offscreenDirectParentIsHidden;
              offscreenDirectParentIsHidden = false;
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              offscreenDirectParentIsHidden = ii;
              commitReconciliationEffects(finishedWork);
              flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return));
              if (supportsMutation) {
                if (finishedWork.flags & 32) {
                  root2 = finishedWork.stateNode;
                  try {
                    runWithFiberInDEV(finishedWork, resetTextContent, root2), viewTransitionMutationContext = true;
                  } catch (error) {
                    captureCommitPhaseError(
                      finishedWork,
                      finishedWork.return,
                      error
                    );
                  }
                }
                flags & 4 && null != finishedWork.stateNode && (root2 = finishedWork.memoizedProps, commitHostUpdate(
                  finishedWork,
                  root2,
                  null !== current2 ? current2.memoizedProps : root2
                ));
                flags & 1024 && (needsFormReset = true, "form" !== finishedWork.type && console.error(
                  "Unexpected host component type. Expected a form. This is a bug in React."
                ));
              } else
                supportsPersistence && null !== finishedWork.alternate && (finishedWork.alternate.stateNode = finishedWork.stateNode);
              break;
            case 6:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              if (flags & 4 && supportsMutation) {
                if (null === finishedWork.stateNode)
                  throw Error(
                    "This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue."
                  );
                root2 = finishedWork.memoizedProps;
                flags = null !== current2 ? current2.memoizedProps : root2;
                lanes = finishedWork.stateNode;
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitTextUpdate,
                    lanes,
                    flags,
                    root2
                  ), viewTransitionMutationContext = true;
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
              break;
            case 3:
              ii = pushNestedEffectDurations();
              viewTransitionMutationContext = false;
              supportsResources ? (prepareToCommitHoistables(), _eventPayloads$ii2 = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(root2.containerInfo), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), currentHoistableRoot = _eventPayloads$ii2) : recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              if (flags & 4) {
                if (supportsMutation && supportsHydration && null !== current2 && current2.memoizedState.isDehydrated)
                  try {
                    runWithFiberInDEV(
                      finishedWork,
                      commitHydratedContainer,
                      root2.containerInfo
                    );
                  } catch (error) {
                    captureCommitPhaseError(
                      finishedWork,
                      finishedWork.return,
                      error
                    );
                  }
                if (supportsPersistence) {
                  flags = root2.containerInfo;
                  lanes = root2.pendingChildren;
                  try {
                    runWithFiberInDEV(
                      finishedWork,
                      replaceContainerChildren,
                      flags,
                      lanes
                    ), viewTransitionMutationContext = true;
                  } catch (error) {
                    captureCommitPhaseError(
                      finishedWork,
                      finishedWork.return,
                      error
                    );
                  }
                }
              }
              needsFormReset && (needsFormReset = false, recursivelyResetForms(finishedWork));
              root2.effectDuration += popNestedEffectDurations(ii);
              viewTransitionMutationContext = false;
              break;
            case 4:
              current2 = offscreenDirectParentIsHidden;
              offscreenDirectParentIsHidden = offscreenSubtreeIsHidden;
              ii = pushMutationContext();
              supportsResources ? (_eventPayloads$ii2 = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(
                finishedWork.stateNode.containerInfo
              ), recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork), currentHoistableRoot = _eventPayloads$ii2) : (recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork));
              viewTransitionMutationContext && inUpdateViewTransition && (rootViewTransitionAffected = true);
              viewTransitionMutationContext = ii;
              offscreenDirectParentIsHidden = current2;
              flags & 4 && supportsPersistence && commitHostPortalContainerChildren(
                finishedWork.stateNode,
                finishedWork,
                finishedWork.stateNode.pendingChildren
              );
              break;
            case 12:
              flags = pushNestedEffectDurations();
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              finishedWork.stateNode.effectDuration += bubbleNestedEffectDurations(flags);
              break;
            case 31:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
              break;
            case 13:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current2 && null !== current2.memoizedState) && (globalMostRecentFallbackTime = now$1());
              flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
              break;
            case 22:
              ii = null !== finishedWork.memoizedState;
              _eventPayloads$ii2 = null !== current2 && null !== current2.memoizedState;
              var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden, _prevOffscreenDirectParentIsHidden2 = offscreenDirectParentIsHidden;
              offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || ii;
              offscreenDirectParentIsHidden = _prevOffscreenDirectParentIsHidden2 || ii;
              offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || _eventPayloads$ii2;
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
              offscreenDirectParentIsHidden = _prevOffscreenDirectParentIsHidden2;
              offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
              _eventPayloads$ii2 && !ii && !prevOffscreenSubtreeIsHidden && !prevOffscreenSubtreeWasHidden && (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentReappeared(
                finishedWork,
                componentEffectStartTime,
                componentEffectEndTime
              );
              commitReconciliationEffects(finishedWork);
              flags & 8192 && (root2 = finishedWork.stateNode, root2._visibility = ii ? root2._visibility & ~OffscreenVisible : root2._visibility | OffscreenVisible, !ii || null === current2 || _eventPayloads$ii2 || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || (root2 = supportsSingletons ? IncludeHostSingletons : NoLayoutEffectTraversalFlags, lanes = _eventPayloads$ii2 || offscreenSubtreeWasHidden, current2 = offscreenSubtreeIsHidden, _eventPayloads$ii2 = offscreenSubtreeWasHidden, offscreenSubtreeIsHidden = ii || offscreenSubtreeIsHidden, offscreenSubtreeWasHidden = lanes, recursivelyTraverseDisappearLayoutEffects(finishedWork, root2), (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
                finishedWork,
                componentEffectStartTime,
                componentEffectEndTime,
                "Disconnect"
              ), offscreenSubtreeIsHidden = current2, offscreenSubtreeWasHidden = _eventPayloads$ii2), supportsMutation && (ii || !offscreenDirectParentIsHidden) && hideOrUnhideAllChildren(finishedWork, ii));
              flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (flags = root2.retryQueue, null !== flags && (root2.retryQueue = null, attachSuspenseRetryListeners(finishedWork, flags))));
              break;
            case 19:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              flags & 4 && (root2 = finishedWork.updateQueue, null !== root2 && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, root2)));
              break;
            case 30:
              flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return));
              flags = pushMutationContext();
              ii = inUpdateViewTransition;
              _eventPayloads$ii2 = (lanes & 335544064) === lanes;
              prevOffscreenSubtreeIsHidden = finishedWork.memoizedProps;
              inUpdateViewTransition = _eventPayloads$ii2 && "none" !== getViewTransitionClassName(
                prevOffscreenSubtreeIsHidden.default,
                prevOffscreenSubtreeIsHidden.update
              );
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes);
              commitReconciliationEffects(finishedWork);
              _eventPayloads$ii2 && null !== current2 && viewTransitionMutationContext && (finishedWork.flags |= 4);
              inUpdateViewTransition = ii;
              viewTransitionMutationContext = flags;
              break;
            case 21:
              break;
            case 7:
              flags & 512 && (offscreenSubtreeWasHidden || null === current2 || safelyDetachRef(current2, current2.return)), current2 && null !== current2.stateNode && updateFragmentInstanceFiber(finishedWork, current2.stateNode);
            default:
              recursivelyTraverseMutationEffects(root2, finishedWork, lanes), commitReconciliationEffects(finishedWork);
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          ), null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate && 0.05 < componentEffectEndTime - componentEffectStartTime && (isHydratingParent(
            finishedWork.return.alternate,
            finishedWork.return
          ) || logComponentTrigger(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            "Mount"
          )));
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        }
        function commitReconciliationEffects(finishedWork) {
          var flags = finishedWork.flags;
          if (flags & 2) {
            try {
              runWithFiberInDEV(finishedWork, commitPlacement, finishedWork);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
            finishedWork.flags &= -3;
          }
          flags & 4096 && (finishedWork.flags &= -4097);
        }
        function recursivelyResetForms(parentFiber) {
          if (parentFiber.subtreeFlags & 1024)
            for (parentFiber = parentFiber.child; null !== parentFiber; ) {
              var fiber = parentFiber;
              recursivelyResetForms(fiber);
              5 === fiber.tag && fiber.flags & 1024 && resetFormInstance(fiber.stateNode);
              parentFiber = parentFiber.sibling;
            }
        }
        function recursivelyTraverseAfterMutationEffects(root2, parentFiber) {
          if (parentFiber.subtreeFlags & 9270)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              commitAfterMutationEffectsOnFiber(parentFiber, root2), parentFiber = parentFiber.sibling;
          else measureNestedViewTransitions(parentFiber, false);
        }
        function commitAfterMutationEffectsOnFiber(finishedWork, root2) {
          var current2 = finishedWork.alternate;
          if (null === current2) commitEnterViewTransitions(finishedWork, false);
          else
            switch (finishedWork.tag) {
              case 3:
                rootViewTransitionNameCanceled = viewTransitionContextChanged = false;
                pushViewTransitionCancelableScope();
                recursivelyTraverseAfterMutationEffects(root2, finishedWork);
                if (!viewTransitionContextChanged && !rootViewTransitionAffected) {
                  finishedWork = viewTransitionCancelableChildren;
                  if (null !== finishedWork)
                    for (var i = 0; i < finishedWork.length; i += 3)
                      cancelViewTransitionName(
                        finishedWork[i],
                        finishedWork[i + 1],
                        finishedWork[i + 2]
                      );
                  cancelRootViewTransitionName(root2.containerInfo);
                  rootViewTransitionNameCanceled = true;
                }
                viewTransitionCancelableChildren = null;
                break;
              case 5:
                recursivelyTraverseAfterMutationEffects(root2, finishedWork);
                break;
              case 4:
                i = viewTransitionContextChanged;
                viewTransitionContextChanged = false;
                recursivelyTraverseAfterMutationEffects(root2, finishedWork);
                viewTransitionContextChanged && (rootViewTransitionAffected = true);
                viewTransitionContextChanged = i;
                break;
              case 22:
                null === finishedWork.memoizedState && (null !== current2.memoizedState ? commitEnterViewTransitions(finishedWork, false) : recursivelyTraverseAfterMutationEffects(root2, finishedWork));
                break;
              case 30:
                i = viewTransitionContextChanged;
                var prevCancelableChildren = pushViewTransitionCancelableScope();
                viewTransitionContextChanged = false;
                recursivelyTraverseAfterMutationEffects(root2, finishedWork);
                viewTransitionContextChanged && (finishedWork.flags |= 4);
                var props = finishedWork.memoizedProps, state = finishedWork.stateNode;
                root2 = getViewTransitionName(props, state);
                state = getViewTransitionName(current2.memoizedProps, state);
                var className = getViewTransitionClassName(
                  props.default,
                  props.update
                );
                "none" === className ? current2 = false : (props = current2.memoizedState, current2.memoizedState = null, current2 = finishedWork.child, viewTransitionHostInstanceIdx = 0, current2 = measureViewTransitionHostInstancesRecursive(
                  finishedWork,
                  current2,
                  root2,
                  state,
                  className,
                  props,
                  true
                ), viewTransitionHostInstanceIdx !== (null === props ? 0 : props.length) && (finishedWork.flags |= 32));
                0 !== (finishedWork.flags & 4) && current2 ? (scheduleViewTransitionEvent(
                  finishedWork,
                  finishedWork.memoizedProps.onUpdate
                ), viewTransitionCancelableChildren = prevCancelableChildren) : null !== prevCancelableChildren && (prevCancelableChildren.push.apply(
                  prevCancelableChildren,
                  viewTransitionCancelableChildren
                ), viewTransitionCancelableChildren = prevCancelableChildren);
                viewTransitionContextChanged = 0 !== (finishedWork.flags & 32) ? true : i;
                break;
              default:
                recursivelyTraverseAfterMutationEffects(root2, finishedWork);
            }
        }
        function recursivelyTraverseLayoutEffects(root2, parentFiber) {
          if (parentFiber.subtreeFlags & 8772)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
        }
        function disappearLayoutEffects(finishedWork, layoutEffectTraversalFlags) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookLayoutUnmountEffects(
                finishedWork,
                finishedWork.return,
                Layout
              );
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              "function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              );
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 27:
              supportsSingletons && (layoutEffectTraversalFlags & IncludeHostSingletons) !== NoLayoutEffectTraversalFlags && runWithFiberInDEV(
                finishedWork,
                releaseSingletonInstance,
                finishedWork.stateNode,
                finishedWork.type,
                finishedWork.memoizedProps
              );
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return);
              5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceDeletionEffects(finishedWork);
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 6:
              commitFragmentInstanceDeletionEffects(finishedWork);
              break;
            case 26:
              safelyDetachRef(finishedWork, finishedWork.return);
              supportsResources && (instance = finishedWork.stateNode, null !== finishedWork.memoizedState || null === instance || offscreenSubtreeWasHidden || unmountHoistable(instance));
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 30:
              finishedWork.flags & 18874368 && untrackNamedViewTransition(finishedWork);
              safelyDetachRef(finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
              break;
            case 7:
              safelyDetachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseDisappearLayoutEffects(
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        }
        function recursivelyTraverseDisappearLayoutEffects(parentFiber, layoutEffectTraversalFlags) {
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            disappearLayoutEffects(parentFiber, layoutEffectTraversalFlags), parentFiber = parentFiber.sibling;
        }
        function reappearLayoutEffects(finishedRoot, current2, finishedWork, layoutEffectTraversalFlags) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(), flags = finishedWork.flags, includeWorkInProgressEffects = (layoutEffectTraversalFlags & IncludeWorkInProgressEffects) !== NoLayoutEffectTraversalFlags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              commitHookLayoutEffects(finishedWork, Layout);
              break;
            case 1:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              current2 = finishedWork.stateNode;
              "function" === typeof current2.componentDidMount && runWithFiberInDEV(
                finishedWork,
                callComponentDidMountInDEV,
                finishedWork,
                current2
              );
              current2 = finishedWork.updateQueue;
              if (null !== current2) {
                finishedRoot = finishedWork.stateNode;
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitHiddenCallbacks,
                    current2,
                    finishedRoot
                  );
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              supportsSingletons && (layoutEffectTraversalFlags & IncludeHostSingletons) !== NoLayoutEffectTraversalFlags && commitHostSingletonAcquisition(finishedWork);
            case 5:
              5 !== finishedWork.tag && 27 !== finishedWork.tag || commitFragmentInstanceInsertionEffects(finishedWork);
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && null === current2 && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 6:
              commitFragmentInstanceInsertionEffects(finishedWork);
              break;
            case 26:
              if (supportsResources) {
                var instance = finishedWork.stateNode;
                null !== finishedWork.memoizedState || null === instance || offscreenSubtreeIsHidden || mountHoistable(
                  getHoistableRoot(instance.ownerDocument),
                  finishedWork.type,
                  instance
                );
              }
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && null === current2 && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              if (includeWorkInProgressEffects && flags & 4) {
                flags = pushNestedEffectDurations();
                recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  layoutEffectTraversalFlags
                );
                includeWorkInProgressEffects = finishedWork.stateNode;
                includeWorkInProgressEffects.effectDuration += bubbleNestedEffectDurations(flags);
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitProfiler,
                    finishedWork,
                    current2,
                    commitStartTime,
                    includeWorkInProgressEffects.effectDuration
                  );
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              } else
                recursivelyTraverseReappearLayoutEffects(
                  finishedRoot,
                  finishedWork,
                  layoutEffectTraversalFlags
                );
              break;
            case 31:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
              flags & 18874368 && trackNamedViewTransition(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 7:
              safelyAttachRef(finishedWork, finishedWork.return);
            default:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                layoutEffectTraversalFlags
              );
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
        }
        function recursivelyTraverseReappearLayoutEffects(finishedRoot, parentFiber, layoutEffectTraversalFlags) {
          layoutEffectTraversalFlags = 0 !== (parentFiber.subtreeFlags & 8772) ? layoutEffectTraversalFlags : layoutEffectTraversalFlags & ~IncludeWorkInProgressEffects;
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            reappearLayoutEffects(
              finishedRoot,
              parentFiber.alternate,
              parentFiber,
              layoutEffectTraversalFlags
            ), parentFiber = parentFiber.sibling;
        }
        function commitOffscreenPassiveMountEffects(current2, finishedWork) {
          var previousCache = null;
          null !== current2 && null !== current2.memoizedState && null !== current2.memoizedState.cachePool && (previousCache = current2.memoizedState.cachePool.pool);
          current2 = null;
          null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current2 = finishedWork.memoizedState.cachePool.pool);
          current2 !== previousCache && (null != current2 && retainCache(current2), null != previousCache && releaseCache(previousCache));
        }
        function commitCachePassiveMountEffect(current2, finishedWork) {
          current2 = null;
          null !== finishedWork.alternate && (current2 = finishedWork.alternate.memoizedState.cache);
          finishedWork = finishedWork.memoizedState.cache;
          finishedWork !== current2 && (retainCache(finishedWork), null != current2 && releaseCache(current2));
        }
        function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions, endTime) {
          var isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
          if (parentFiber.subtreeFlags & (isViewTransitionEligible ? 10262 : 10256) || 0 !== parentFiber.actualDuration && (null === parentFiber.alternate || parentFiber.alternate.child !== parentFiber.child))
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              isViewTransitionEligible = parentFiber.sibling, commitPassiveMountOnFiber(
                root2,
                parentFiber,
                committedLanes,
                committedTransitions,
                null !== isViewTransitionEligible ? isViewTransitionEligible.actualStartTime : endTime
              ), parentFiber = isViewTransitionEligible;
          else
            isViewTransitionEligible && restoreNestedViewTransitions(parentFiber);
        }
        function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions, endTime) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(), prevDeepEquality = alreadyWarnedForDeepEquality, isViewTransitionEligible = (committedLanes & 335544064) === committedLanes;
          isViewTransitionEligible && null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate && restoreEnterOrExitViewTransitions(finishedWork);
          var flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              (finishedWork.mode & 2) !== NoMode && 0 < finishedWork.actualStartTime && 0 !== (finishedWork.flags & 1) && logComponentRender(
                finishedWork,
                finishedWork.actualStartTime,
                endTime,
                inHydratedSubtree,
                committedLanes
              );
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              flags & 2048 && commitHookPassiveMountEffects(finishedWork, Passive | HasEffect);
              break;
            case 1:
              (finishedWork.mode & 2) !== NoMode && 0 < finishedWork.actualStartTime && (0 !== (finishedWork.flags & 128) ? logComponentErrored(
                finishedWork,
                finishedWork.actualStartTime,
                endTime,
                []
              ) : 0 !== (finishedWork.flags & 1) && logComponentRender(
                finishedWork,
                finishedWork.actualStartTime,
                endTime,
                inHydratedSubtree,
                committedLanes
              ));
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              break;
            case 3:
              var prevProfilerEffectDuration = pushNestedEffectDurations(), wasInHydratedSubtree = inHydratedSubtree;
              inHydratedSubtree = null !== finishedWork.alternate && finishedWork.alternate.memoizedState.isDehydrated && 0 === (finishedWork.flags & 256);
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              inHydratedSubtree = wasInHydratedSubtree;
              isViewTransitionEligible && supportsMutation && rootViewTransitionNameCanceled && restoreRootViewTransitionName(finishedRoot.containerInfo);
              flags & 2048 && (committedLanes = null, null !== finishedWork.alternate && (committedLanes = finishedWork.alternate.memoizedState.cache), committedTransitions = finishedWork.memoizedState.cache, committedTransitions !== committedLanes && (retainCache(committedTransitions), null != committedLanes && releaseCache(committedLanes)));
              finishedRoot.passiveEffectDuration += popNestedEffectDurations(
                prevProfilerEffectDuration
              );
              break;
            case 12:
              if (flags & 2048) {
                flags = pushNestedEffectDurations();
                recursivelyTraversePassiveMountEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions,
                  endTime
                );
                finishedRoot = finishedWork.stateNode;
                finishedRoot.passiveEffectDuration += bubbleNestedEffectDurations(flags);
                try {
                  runWithFiberInDEV(
                    finishedWork,
                    commitProfilerPostCommitImpl,
                    finishedWork,
                    finishedWork.alternate,
                    commitStartTime,
                    finishedRoot.passiveEffectDuration
                  );
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              } else
                recursivelyTraversePassiveMountEffects(
                  finishedRoot,
                  finishedWork,
                  committedLanes,
                  committedTransitions,
                  endTime
                );
              break;
            case 31:
              flags = inHydratedSubtree;
              isViewTransitionEligible = null !== finishedWork.alternate ? finishedWork.alternate.memoizedState : null;
              prevProfilerEffectDuration = finishedWork.memoizedState;
              null !== isViewTransitionEligible && null === prevProfilerEffectDuration ? (prevProfilerEffectDuration = finishedWork.deletions, null !== prevProfilerEffectDuration && 0 < prevProfilerEffectDuration.length && 18 === prevProfilerEffectDuration[0].tag ? (inHydratedSubtree = false, isViewTransitionEligible = isViewTransitionEligible.hydrationErrors, null !== isViewTransitionEligible && logComponentErrored(
                finishedWork,
                finishedWork.actualStartTime,
                endTime,
                isViewTransitionEligible
              )) : inHydratedSubtree = true) : inHydratedSubtree = false;
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              inHydratedSubtree = flags;
              break;
            case 13:
              flags = inHydratedSubtree;
              isViewTransitionEligible = null !== finishedWork.alternate ? finishedWork.alternate.memoizedState : null;
              prevProfilerEffectDuration = finishedWork.memoizedState;
              null === isViewTransitionEligible || null === isViewTransitionEligible.dehydrated || null !== prevProfilerEffectDuration && null !== prevProfilerEffectDuration.dehydrated ? inHydratedSubtree = false : (prevProfilerEffectDuration = finishedWork.deletions, null !== prevProfilerEffectDuration && 0 < prevProfilerEffectDuration.length && 18 === prevProfilerEffectDuration[0].tag ? (inHydratedSubtree = false, isViewTransitionEligible = isViewTransitionEligible.hydrationErrors, null !== isViewTransitionEligible && logComponentErrored(
                finishedWork,
                finishedWork.actualStartTime,
                endTime,
                isViewTransitionEligible
              )) : inHydratedSubtree = true);
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              inHydratedSubtree = flags;
              break;
            case 23:
              break;
            case 22:
              wasInHydratedSubtree = finishedWork.stateNode;
              prevProfilerEffectDuration = finishedWork.alternate;
              null !== finishedWork.memoizedState ? (isViewTransitionEligible && null !== prevProfilerEffectDuration && null === prevProfilerEffectDuration.memoizedState && restoreEnterOrExitViewTransitions(prevProfilerEffectDuration), wasInHydratedSubtree._visibility & OffscreenPassiveEffectsConnected ? recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              )) : (isViewTransitionEligible && null !== prevProfilerEffectDuration && null !== prevProfilerEffectDuration.memoizedState && restoreEnterOrExitViewTransitions(finishedWork), wasInHydratedSubtree._visibility & OffscreenPassiveEffectsConnected ? recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              ) : (wasInHydratedSubtree._visibility |= OffscreenPassiveEffectsConnected, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                0 !== (finishedWork.subtreeFlags & 10256) || 0 !== finishedWork.actualDuration && (null === finishedWork.alternate || finishedWork.alternate.child !== finishedWork.child),
                endTime
              ), (finishedWork.mode & 2) === NoMode || inHydratedSubtree || (finishedRoot = finishedWork.actualStartTime, 0 <= finishedRoot && 0.05 < endTime - finishedRoot && logComponentReappeared(
                finishedWork,
                finishedRoot,
                endTime
              ), 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentReappeared(
                finishedWork,
                componentEffectStartTime,
                componentEffectEndTime
              ))));
              flags & 2048 && commitOffscreenPassiveMountEffects(
                prevProfilerEffectDuration,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            case 30:
              isViewTransitionEligible && (flags = finishedWork.alternate, null !== flags && (restoreViewTransitionOnHostInstances(flags.child, true), restoreViewTransitionOnHostInstances(finishedWork.child, true)));
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
              break;
            default:
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              );
          }
          if ((finishedWork.mode & 2) !== NoMode) {
            if (finishedRoot = !inHydratedSubtree && null === finishedWork.alternate && null !== finishedWork.return && null !== finishedWork.return.alternate)
              committedLanes = finishedWork.actualStartTime, 0 <= committedLanes && 0.05 < endTime - committedLanes && logComponentTrigger(
                finishedWork,
                committedLanes,
                endTime,
                "Mount"
              );
            0 <= componentEffectStartTime && 0 <= componentEffectEndTime && ((componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
              finishedWork,
              componentEffectStartTime,
              componentEffectEndTime,
              componentEffectDuration,
              componentEffectErrors
            ), finishedRoot && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
              finishedWork,
              componentEffectStartTime,
              componentEffectEndTime,
              "Mount"
            ));
          }
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
          alreadyWarnedForDeepEquality = prevDeepEquality;
        }
        function recursivelyTraverseReconnectPassiveEffects(finishedRoot, parentFiber, committedLanes, committedTransitions, includeWorkInProgressEffects, endTime) {
          includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || 0 !== parentFiber.actualDuration && (null === parentFiber.alternate || parentFiber.alternate.child !== parentFiber.child));
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var nextSibling = parentFiber.sibling;
            reconnectPassiveEffects(
              finishedRoot,
              parentFiber,
              committedLanes,
              committedTransitions,
              includeWorkInProgressEffects,
              null !== nextSibling ? nextSibling.actualStartTime : endTime
            );
            parentFiber = nextSibling;
          }
        }
        function reconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects, endTime) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate(), prevDeepEquality = alreadyWarnedForDeepEquality;
          includeWorkInProgressEffects && (finishedWork.mode & 2) !== NoMode && 0 < finishedWork.actualStartTime && 0 !== (finishedWork.flags & 1) && logComponentRender(
            finishedWork,
            finishedWork.actualStartTime,
            endTime,
            inHydratedSubtree,
            committedLanes
          );
          var flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              );
              commitHookPassiveMountEffects(finishedWork, Passive);
              break;
            case 23:
              break;
            case 22:
              var _instance4 = finishedWork.stateNode;
              null !== finishedWork.memoizedState ? _instance4._visibility & OffscreenPassiveEffectsConnected ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                endTime
              ) : (_instance4._visibility |= OffscreenPassiveEffectsConnected, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              ));
              includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
                finishedWork.alternate,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              );
              includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects,
                endTime
              );
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectErrors = prevEffectErrors;
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
          alreadyWarnedForDeepEquality = prevDeepEquality;
        }
        function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, endTime$jscomp$0) {
          if (parentFiber.subtreeFlags & 10256 || 0 !== parentFiber.actualDuration && (null === parentFiber.alternate || parentFiber.alternate.child !== parentFiber.child))
            for (var child = parentFiber.child; null !== child; ) {
              parentFiber = child.sibling;
              var finishedRoot = finishedRoot$jscomp$0, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, endTime = null !== parentFiber ? parentFiber.actualStartTime : endTime$jscomp$0, prevDeepEquality = alreadyWarnedForDeepEquality;
              (child.mode & 2) !== NoMode && 0 < child.actualStartTime && 0 !== (child.flags & 1) && logComponentRender(
                child,
                child.actualStartTime,
                endTime,
                inHydratedSubtree,
                committedLanes
              );
              var flags = child.flags;
              switch (child.tag) {
                case 22:
                  recursivelyTraverseAtomicPassiveEffects(
                    finishedRoot,
                    child,
                    committedLanes,
                    committedTransitions,
                    endTime
                  );
                  flags & 2048 && commitOffscreenPassiveMountEffects(child.alternate, child);
                  break;
                case 24:
                  recursivelyTraverseAtomicPassiveEffects(
                    finishedRoot,
                    child,
                    committedLanes,
                    committedTransitions,
                    endTime
                  );
                  flags & 2048 && commitCachePassiveMountEffect(child.alternate, child);
                  break;
                default:
                  recursivelyTraverseAtomicPassiveEffects(
                    finishedRoot,
                    child,
                    committedLanes,
                    committedTransitions,
                    endTime
                  );
              }
              alreadyWarnedForDeepEquality = prevDeepEquality;
              child = parentFiber;
            }
        }
        function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
          if (parentFiber.subtreeFlags & suspenseyCommitFlag)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              accumulateSuspenseyCommitOnFiber(
                parentFiber,
                committedLanes,
                suspendedState
              ), parentFiber = parentFiber.sibling;
        }
        function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
          switch (fiber.tag) {
            case 26:
              recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
              if (fiber.flags & suspenseyCommitFlag)
                if (null !== fiber.memoizedState)
                  suspendResource(
                    suspendedState,
                    currentHoistableRoot,
                    fiber.memoizedState,
                    fiber.memoizedProps
                  );
                else {
                  var instance = fiber.stateNode, type = fiber.type;
                  fiber = fiber.memoizedProps;
                  ((committedLanes & 335544128) === committedLanes || maySuspendCommitInSyncRender(type, fiber)) && suspendInstance(suspendedState, instance, type, fiber);
                }
              break;
            case 5:
              recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
              fiber.flags & suspenseyCommitFlag && (instance = fiber.stateNode, type = fiber.type, fiber = fiber.memoizedProps, ((committedLanes & 335544128) === committedLanes || maySuspendCommitInSyncRender(type, fiber)) && suspendInstance(suspendedState, instance, type, fiber));
              break;
            case 3:
            case 4:
              supportsResources ? (instance = currentHoistableRoot, currentHoistableRoot = getHoistableRoot(
                fiber.stateNode.containerInfo
              ), recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              ), currentHoistableRoot = instance) : recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
              break;
            case 22:
              null === fiber.memoizedState && (instance = fiber.alternate, null !== instance && null !== instance.memoizedState ? (instance = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              ), suspenseyCommitFlag = instance) : recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              ));
              break;
            case 30:
              0 !== (fiber.flags & suspenseyCommitFlag) && (instance = fiber.memoizedProps.name, null != instance && "auto" !== instance && (type = fiber.stateNode, type.paired = null, null === appearingViewTransitions && (appearingViewTransitions = /* @__PURE__ */ new Map()), appearingViewTransitions.set(instance, type)));
              recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
              break;
            default:
              recursivelyAccumulateSuspenseyCommit(
                fiber,
                committedLanes,
                suspendedState
              );
          }
        }
        function detachAlternateSiblings(parentFiber) {
          var previousFiber = parentFiber.alternate;
          if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
            previousFiber.child = null;
            do
              previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
            while (null !== parentFiber);
          }
        }
        function recursivelyTraversePassiveUnmountEffects(parentFiber) {
          var deletions = parentFiber.deletions;
          if (0 !== (parentFiber.flags & 16)) {
            if (null !== deletions)
              for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i], prevEffectStart = pushComponentEffectStart();
                nextEffect = childToDelete;
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                  childToDelete,
                  parentFiber
                );
                (childToDelete.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
                  childToDelete,
                  componentEffectStartTime,
                  componentEffectEndTime,
                  "Unmount"
                );
                popComponentEffectStart(prevEffectStart);
              }
            detachAlternateSiblings(parentFiber);
          }
          if (parentFiber.subtreeFlags & 10256)
            for (parentFiber = parentFiber.child; null !== parentFiber; )
              commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
        }
        function commitPassiveUnmountOnFiber(finishedWork) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraversePassiveUnmountEffects(finishedWork);
              finishedWork.flags & 2048 && commitHookPassiveUnmountEffects(
                finishedWork,
                finishedWork.return,
                Passive | HasEffect
              );
              break;
            case 3:
              var prevProfilerEffectDuration = pushNestedEffectDurations();
              recursivelyTraversePassiveUnmountEffects(finishedWork);
              finishedWork.stateNode.passiveEffectDuration += popNestedEffectDurations(prevProfilerEffectDuration);
              break;
            case 12:
              prevProfilerEffectDuration = pushNestedEffectDurations();
              recursivelyTraversePassiveUnmountEffects(finishedWork);
              finishedWork.stateNode.passiveEffectDuration += bubbleNestedEffectDurations(prevProfilerEffectDuration);
              break;
            case 22:
              prevProfilerEffectDuration = finishedWork.stateNode;
              null !== finishedWork.memoizedState && prevProfilerEffectDuration._visibility & OffscreenPassiveEffectsConnected && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (prevProfilerEffectDuration._visibility &= ~OffscreenPassiveEffectsConnected, recursivelyTraverseDisconnectPassiveEffects(finishedWork), (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
                finishedWork,
                componentEffectStartTime,
                componentEffectEndTime,
                "Disconnect"
              )) : recursivelyTraversePassiveUnmountEffects(finishedWork);
              break;
            default:
              recursivelyTraversePassiveUnmountEffects(finishedWork);
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
          componentEffectErrors = prevEffectErrors;
        }
        function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
          var deletions = parentFiber.deletions;
          if (0 !== (parentFiber.flags & 16)) {
            if (null !== deletions)
              for (var i = 0; i < deletions.length; i++) {
                var childToDelete = deletions[i], prevEffectStart = pushComponentEffectStart();
                nextEffect = childToDelete;
                commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                  childToDelete,
                  parentFiber
                );
                (childToDelete.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && 0.05 < componentEffectEndTime - componentEffectStartTime && logComponentTrigger(
                  childToDelete,
                  componentEffectStartTime,
                  componentEffectEndTime,
                  "Unmount"
                );
                popComponentEffectStart(prevEffectStart);
              }
            detachAlternateSiblings(parentFiber);
          }
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            disconnectPassiveEffect(parentFiber), parentFiber = parentFiber.sibling;
        }
        function disconnectPassiveEffect(finishedWork) {
          var prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              commitHookPassiveUnmountEffects(
                finishedWork,
                finishedWork.return,
                Passive
              );
              recursivelyTraverseDisconnectPassiveEffects(finishedWork);
              break;
            case 22:
              var instance = finishedWork.stateNode;
              instance._visibility & OffscreenPassiveEffectsConnected && (instance._visibility &= ~OffscreenPassiveEffectsConnected, recursivelyTraverseDisconnectPassiveEffects(finishedWork));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(finishedWork);
          }
          (finishedWork.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
            finishedWork,
            componentEffectStartTime,
            componentEffectEndTime,
            componentEffectDuration,
            componentEffectErrors
          );
          popComponentEffectStart(prevEffectStart);
          popComponentEffectDuration(prevEffectDuration);
          componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
          componentEffectErrors = prevEffectErrors;
        }
        function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor$jscomp$0) {
          for (; null !== nextEffect; ) {
            var fiber = nextEffect, current2 = fiber, nearestMountedAncestor = nearestMountedAncestor$jscomp$0, prevEffectStart = pushComponentEffectStart(), prevEffectDuration = pushComponentEffectDuration(), prevEffectErrors = pushComponentEffectErrors(), prevEffectDidSpawnUpdate = pushComponentEffectDidSpawnUpdate();
            switch (current2.tag) {
              case 0:
              case 11:
              case 15:
                commitHookPassiveUnmountEffects(
                  current2,
                  nearestMountedAncestor,
                  Passive
                );
                break;
              case 23:
              case 22:
                null !== current2.memoizedState && null !== current2.memoizedState.cachePool && (nearestMountedAncestor = current2.memoizedState.cachePool.pool, null != nearestMountedAncestor && retainCache(nearestMountedAncestor));
                break;
              case 24:
                releaseCache(current2.memoizedState.cache);
            }
            (current2.mode & 2) !== NoMode && 0 <= componentEffectStartTime && 0 <= componentEffectEndTime && (componentEffectSpawnedUpdate || 0.05 < componentEffectDuration) && logComponentEffect(
              current2,
              componentEffectStartTime,
              componentEffectEndTime,
              componentEffectDuration,
              componentEffectErrors
            );
            popComponentEffectStart(prevEffectStart);
            popComponentEffectDuration(prevEffectDuration);
            componentEffectSpawnedUpdate = prevEffectDidSpawnUpdate;
            componentEffectErrors = prevEffectErrors;
            current2 = fiber.child;
            if (null !== current2) current2.return = fiber, nextEffect = current2;
            else
              a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
                current2 = nextEffect;
                prevEffectStart = current2.sibling;
                prevEffectDuration = current2.return;
                detachFiberAfterEffects(current2);
                if (current2 === fiber) {
                  nextEffect = null;
                  break a;
                }
                if (null !== prevEffectStart) {
                  prevEffectStart.return = prevEffectDuration;
                  nextEffect = prevEffectStart;
                  break a;
                }
                nextEffect = prevEffectDuration;
              }
          }
        }
        function findFiberRootForHostRoot(hostRoot) {
          var maybeFiber = getInstanceFromNode(hostRoot);
          if (null != maybeFiber) {
            if ("string" !== typeof maybeFiber.memoizedProps["data-testname"])
              throw Error(
                "Invalid host root specified. Should be either a React container or a node with a testname attribute."
              );
            return maybeFiber;
          }
          hostRoot = findFiberRoot(hostRoot);
          if (null === hostRoot)
            throw Error(
              "Could not find React container within specified host subtree."
            );
          return hostRoot.stateNode.current;
        }
        function matchSelector(fiber$jscomp$0, selector) {
          var tag = fiber$jscomp$0.tag;
          switch (selector.$$typeof) {
            case COMPONENT_TYPE:
              if (fiber$jscomp$0.type === selector.value) return true;
              break;
            case HAS_PSEUDO_CLASS_TYPE:
              a: {
                selector = selector.value;
                fiber$jscomp$0 = [fiber$jscomp$0, 0];
                for (tag = 0; tag < fiber$jscomp$0.length; ) {
                  var fiber = fiber$jscomp$0[tag++], tag$jscomp$0 = fiber.tag, selectorIndex = fiber$jscomp$0[tag++], selector$jscomp$0 = selector[selectorIndex];
                  if (5 !== tag$jscomp$0 && 26 !== tag$jscomp$0 && 27 !== tag$jscomp$0 || !isHiddenSubtree(fiber)) {
                    for (; null != selector$jscomp$0 && matchSelector(fiber, selector$jscomp$0); )
                      selectorIndex++, selector$jscomp$0 = selector[selectorIndex];
                    if (selectorIndex === selector.length) {
                      selector = true;
                      break a;
                    } else
                      for (fiber = fiber.child; null !== fiber; )
                        fiber$jscomp$0.push(fiber, selectorIndex), fiber = fiber.sibling;
                  }
                }
                selector = false;
              }
              return selector;
            case ROLE_TYPE:
              if ((5 === tag || 26 === tag || 27 === tag) && matchAccessibilityRole(fiber$jscomp$0.stateNode, selector.value))
                return true;
              break;
            case TEXT_TYPE:
              if (5 === tag || 6 === tag || 26 === tag || 27 === tag) {
                if (fiber$jscomp$0 = getTextContent(fiber$jscomp$0), null !== fiber$jscomp$0 && 0 <= fiber$jscomp$0.indexOf(selector.value))
                  return true;
              }
              break;
            case TEST_NAME_TYPE:
              if (5 === tag || 26 === tag || 27 === tag) {
                if (fiber$jscomp$0 = fiber$jscomp$0.memoizedProps["data-testname"], "string" === typeof fiber$jscomp$0 && fiber$jscomp$0.toLowerCase() === selector.value.toLowerCase())
                  return true;
              }
              break;
            default:
              throw Error("Invalid selector type specified.");
          }
          return false;
        }
        function selectorToString(selector) {
          switch (selector.$$typeof) {
            case COMPONENT_TYPE:
              return "<" + (getComponentNameFromType(selector.value) || "Unknown") + ">";
            case HAS_PSEUDO_CLASS_TYPE:
              return ":has(" + (selectorToString(selector) || "") + ")";
            case ROLE_TYPE:
              return '[role="' + selector.value + '"]';
            case TEXT_TYPE:
              return '"' + selector.value + '"';
            case TEST_NAME_TYPE:
              return '[data-testname="' + selector.value + '"]';
            default:
              throw Error("Invalid selector type specified.");
          }
        }
        function findPaths(root2, selectors) {
          var matchingFibers = [];
          root2 = [root2, 0];
          for (var index = 0; index < root2.length; ) {
            var fiber = root2[index++], tag = fiber.tag, selectorIndex = root2[index++], selector = selectors[selectorIndex];
            if (5 !== tag && 26 !== tag && 27 !== tag || !isHiddenSubtree(fiber)) {
              for (; null != selector && matchSelector(fiber, selector); )
                selectorIndex++, selector = selectors[selectorIndex];
              if (selectorIndex === selectors.length) matchingFibers.push(fiber);
              else
                for (fiber = fiber.child; null !== fiber; )
                  root2.push(fiber, selectorIndex), fiber = fiber.sibling;
            }
          }
          return matchingFibers;
        }
        function findAllNodes(hostRoot, selectors) {
          if (!supportsTestSelectors)
            throw Error("Test selector API is not supported by this renderer.");
          hostRoot = findFiberRootForHostRoot(hostRoot);
          hostRoot = findPaths(hostRoot, selectors);
          selectors = [];
          hostRoot = Array.from(hostRoot);
          for (var index = 0; index < hostRoot.length; ) {
            var node = hostRoot[index++], tag = node.tag;
            if (5 === tag || 26 === tag || 27 === tag)
              isHiddenSubtree(node) || selectors.push(node.stateNode);
            else
              for (node = node.child; null !== node; )
                hostRoot.push(node), node = node.sibling;
          }
          return selectors;
        }
        function onCommitRoot() {
          supportsTestSelectors && commitHooks.forEach(function(commitHook) {
            return commitHook();
          });
        }
        function isConcurrentActEnvironment() {
          var isReactActEnvironmentGlobal = "undefined" !== typeof IS_REACT_ACT_ENVIRONMENT ? IS_REACT_ACT_ENVIRONMENT : void 0;
          isReactActEnvironmentGlobal || null === ReactSharedInternals.actQueue || console.error(
            "The current testing environment is not configured to support act(...)"
          );
          return isReactActEnvironmentGlobal;
        }
        function requestUpdateLane(fiber) {
          if ((executionContext & RenderContext) !== NoContext && 0 !== workInProgressRootRenderLanes)
            return workInProgressRootRenderLanes & -workInProgressRootRenderLanes;
          var transition = ReactSharedInternals.T;
          if (null !== transition)
            return transition._updatedFibers || (transition._updatedFibers = /* @__PURE__ */ new Set()), transition._updatedFibers.add(fiber), null !== lastSuspendedFiber && 2 === resolveUpdatePriority() && (lastSuspendedFiber = null), requestTransitionLane();
          fiber = resolveUpdatePriority();
          2 === fiber && (lastSuspendedFiber = null);
          return fiber;
        }
        function requestDeferredLane() {
          if (0 === workInProgressDeferredLane)
            if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
              var lane = nextTransitionDeferredLane;
              nextTransitionDeferredLane <<= 1;
              0 === (nextTransitionDeferredLane & 3932160) && (nextTransitionDeferredLane = 262144);
              workInProgressDeferredLane = lane;
            } else workInProgressDeferredLane = 536870912;
          lane = suspenseHandlerStackCursor.current;
          null !== lane && (lane.flags |= 32);
          return workInProgressDeferredLane;
        }
        function scheduleViewTransitionEvent(fiber, callback) {
          if (null != callback) {
            var state = fiber.stateNode, instance = state.ref;
            null === instance && (instance = state.ref = createViewTransitionInstance(
              getViewTransitionName(fiber.memoizedProps, state)
            ));
            null === pendingViewTransitionEvents && (pendingViewTransitionEvents = []);
            pendingViewTransitionEvents.push(callback.bind(null, instance));
          }
        }
        function scheduleUpdateOnFiber(root2, fiber, lane) {
          isRunningInsertionEffect && console.error("useInsertionEffect must not schedule updates.");
          isFlushingPassiveEffects && (didScheduleUpdateDuringPassiveEffects = true);
          if (root2 === workInProgressRoot && (workInProgressSuspendedReason === SuspendedOnData || workInProgressSuspendedReason === SuspendedOnAction) || null !== root2.cancelPendingCommit)
            prepareFreshStack(root2, 0), markRootSuspended(
              root2,
              workInProgressRootRenderLanes,
              workInProgressDeferredLane,
              false
            );
          markRootUpdated$1(root2, lane);
          if ((executionContext & RenderContext) !== NoContext && root2 === workInProgressRoot) {
            if (isRendering)
              switch (fiber.tag) {
                case 0:
                case 11:
                case 15:
                  root2 = workInProgress && getComponentNameFromFiber(workInProgress) || "Unknown";
                  didWarnAboutUpdateInRenderForAnotherComponent.has(root2) || (didWarnAboutUpdateInRenderForAnotherComponent.add(root2), fiber = getComponentNameFromFiber(fiber) || "Unknown", console.error(
                    "Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://react.dev/link/setstate-in-render",
                    fiber,
                    root2,
                    root2
                  ));
                  break;
                case 1:
                  didWarnAboutUpdateInRender || (console.error(
                    "Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."
                  ), didWarnAboutUpdateInRender = true);
              }
          } else
            isDevToolsPresent && addFiberToLanesMap(root2, fiber, lane), warnIfUpdatesNotWrappedWithActDEV(fiber), root2 === workInProgressRoot && ((executionContext & RenderContext) === NoContext && (workInProgressRootInterleavedUpdatedLanes |= lane), workInProgressRootExitStatus === RootSuspendedWithDelay && markRootSuspended(
              root2,
              workInProgressRootRenderLanes,
              workInProgressDeferredLane,
              false
            )), ensureRootIsScheduled(root2);
        }
        function performWorkOnRoot(root2, lanes, forceSync) {
          if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
            throw Error("Should not already be working.");
          if (0 !== workInProgressRootRenderLanes && null !== workInProgress) {
            var yieldedFiber = workInProgress, yieldEndTime = now$1();
            switch (yieldReason) {
              case SuspendedOnImmediate:
              case SuspendedOnData:
                var startTime = yieldStartTime;
                supportsUserTiming && ((yieldedFiber = yieldedFiber._debugTask) ? yieldedFiber.run(
                  console.timeStamp.bind(
                    console,
                    "Suspended",
                    startTime,
                    yieldEndTime,
                    "Components \u269B",
                    void 0,
                    "primary-light"
                  )
                ) : console.timeStamp(
                  "Suspended",
                  startTime,
                  yieldEndTime,
                  "Components \u269B",
                  void 0,
                  "primary-light"
                ));
                break;
              case SuspendedOnAction:
                startTime = yieldStartTime;
                supportsUserTiming && ((yieldedFiber = yieldedFiber._debugTask) ? yieldedFiber.run(
                  console.timeStamp.bind(
                    console,
                    "Action",
                    startTime,
                    yieldEndTime,
                    "Components \u269B",
                    void 0,
                    "primary-light"
                  )
                ) : console.timeStamp(
                  "Action",
                  startTime,
                  yieldEndTime,
                  "Components \u269B",
                  void 0,
                  "primary-light"
                ));
                break;
              default:
                supportsUserTiming && (yieldedFiber = yieldEndTime - yieldStartTime, 3 > yieldedFiber || console.timeStamp(
                  "Blocked",
                  yieldStartTime,
                  yieldEndTime,
                  "Components \u269B",
                  void 0,
                  5 > yieldedFiber ? "primary-light" : 10 > yieldedFiber ? "primary" : 100 > yieldedFiber ? "primary-dark" : "error"
                ));
            }
          }
          startTime = (forceSync = !forceSync && 0 === (lanes & 127) && 0 === (lanes & root2.expiredLanes) || checkIfRootIsPrerendering(root2, lanes)) ? renderRootConcurrent(root2, lanes) : renderRootSync(root2, lanes, true);
          var renderWasConcurrent = forceSync;
          do {
            if (startTime === RootInProgress) {
              workInProgressRootIsPrerendering && !forceSync && markRootSuspended(root2, lanes, 0, false);
              lanes = workInProgressSuspendedReason;
              yieldStartTime = now();
              yieldReason = lanes;
              break;
            } else {
              yieldedFiber = now$1();
              yieldEndTime = root2.current.alternate;
              if (renderWasConcurrent && !isRenderConsistentWithExternalStores(yieldEndTime)) {
                setCurrentTrackFromLanes(lanes);
                yieldEndTime = renderStartTime;
                startTime = yieldedFiber;
                !supportsUserTiming || startTime <= yieldEndTime || (workInProgressUpdateTask ? workInProgressUpdateTask.run(
                  console.timeStamp.bind(
                    console,
                    "Teared Render",
                    yieldEndTime,
                    startTime,
                    currentTrack,
                    "Scheduler \u269B",
                    "error"
                  )
                ) : console.timeStamp(
                  "Teared Render",
                  yieldEndTime,
                  startTime,
                  currentTrack,
                  "Scheduler \u269B",
                  "error"
                ));
                finalizeRender(lanes, yieldedFiber);
                startTime = renderRootSync(root2, lanes, false);
                renderWasConcurrent = false;
                continue;
              }
              if (startTime === RootErrored) {
                renderWasConcurrent = lanes;
                if (root2.errorRecoveryDisabledLanes & renderWasConcurrent)
                  var errorRetryLanes = 0;
                else
                  errorRetryLanes = root2.pendingLanes & -536870913, errorRetryLanes = 0 !== errorRetryLanes ? errorRetryLanes : errorRetryLanes & 536870912 ? 536870912 : 0;
                if (0 !== errorRetryLanes) {
                  setCurrentTrackFromLanes(lanes);
                  logErroredRenderPhase(
                    renderStartTime,
                    yieldedFiber,
                    lanes,
                    workInProgressUpdateTask
                  );
                  finalizeRender(lanes, yieldedFiber);
                  lanes = errorRetryLanes;
                  a: {
                    yieldedFiber = root2;
                    startTime = renderWasConcurrent;
                    renderWasConcurrent = workInProgressRootConcurrentErrors;
                    var wasRootDehydrated = supportsHydration && yieldedFiber.current.memoizedState.isDehydrated;
                    wasRootDehydrated && (prepareFreshStack(yieldedFiber, errorRetryLanes).flags |= 256);
                    errorRetryLanes = renderRootSync(
                      yieldedFiber,
                      errorRetryLanes,
                      false
                    );
                    if (errorRetryLanes !== RootErrored && errorRetryLanes !== RootSuspendedAtTheShell) {
                      if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
                        yieldedFiber.errorRecoveryDisabledLanes |= startTime;
                        workInProgressRootInterleavedUpdatedLanes |= startTime;
                        startTime = RootSuspendedWithDelay;
                        break a;
                      }
                      yieldedFiber = workInProgressRootRecoverableErrors;
                      workInProgressRootRecoverableErrors = renderWasConcurrent;
                      null !== yieldedFiber && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = yieldedFiber : workInProgressRootRecoverableErrors.push.apply(
                        workInProgressRootRecoverableErrors,
                        yieldedFiber
                      ));
                    }
                    startTime = errorRetryLanes;
                  }
                  renderWasConcurrent = false;
                  if (startTime !== RootErrored) continue;
                  else yieldedFiber = now$1();
                }
              }
              if (startTime === RootFatalErrored) {
                setCurrentTrackFromLanes(lanes);
                logErroredRenderPhase(
                  renderStartTime,
                  yieldedFiber,
                  lanes,
                  workInProgressUpdateTask
                );
                finalizeRender(lanes, yieldedFiber);
                prepareFreshStack(root2, 0);
                markRootSuspended(root2, lanes, 0, true);
                break;
              }
              a: {
                forceSync = root2;
                switch (startTime) {
                  case RootInProgress:
                  case RootFatalErrored:
                    throw Error("Root did not complete. This is a bug in React.");
                  case RootSuspendedWithDelay:
                    if ((lanes & 4194048) !== lanes && (lanes & 62914560) !== lanes)
                      break;
                  case RootSuspendedAtTheShell:
                    setCurrentTrackFromLanes(lanes);
                    logSuspendedRenderPhase(
                      renderStartTime,
                      yieldedFiber,
                      lanes,
                      workInProgressUpdateTask
                    );
                    finalizeRender(lanes, yieldedFiber);
                    yieldEndTime = lanes;
                    0 !== (yieldEndTime & 127) ? blockingSuspendedTime = yieldedFiber : 0 !== (yieldEndTime & 4194048) && (transitionSuspendedTime = yieldedFiber);
                    markRootSuspended(
                      forceSync,
                      lanes,
                      workInProgressDeferredLane,
                      !workInProgressRootDidSkipSuspendedSiblings
                    );
                    break a;
                  case RootErrored:
                    workInProgressRootRecoverableErrors = null;
                    break;
                  case RootSuspended:
                  case RootCompleted:
                    break;
                  default:
                    throw Error("Unknown root exit status.");
                }
                if (null !== ReactSharedInternals.actQueue)
                  completeRoot(
                    forceSync,
                    yieldEndTime,
                    lanes,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    startTime,
                    null,
                    null,
                    renderStartTime,
                    yieldedFiber
                  );
                else {
                  if ((lanes & 62914560) === lanes && (renderWasConcurrent = globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now$1(), 10 < renderWasConcurrent)) {
                    markRootSuspended(
                      forceSync,
                      lanes,
                      workInProgressDeferredLane,
                      !workInProgressRootDidSkipSuspendedSiblings
                    );
                    if (0 !== getNextLanes(forceSync, 0, true)) break a;
                    pendingEffectsLanes = lanes;
                    forceSync.timeoutHandle = scheduleTimeout(
                      completeRootWhenReady.bind(
                        null,
                        forceSync,
                        yieldEndTime,
                        workInProgressRootRecoverableErrors,
                        workInProgressTransitions,
                        workInProgressRootDidIncludeRecursiveRenderUpdate,
                        lanes,
                        workInProgressDeferredLane,
                        workInProgressRootInterleavedUpdatedLanes,
                        workInProgressSuspendedRetryLanes,
                        workInProgressRootDidSkipSuspendedSiblings,
                        startTime,
                        "Throttled",
                        renderStartTime,
                        yieldedFiber
                      ),
                      renderWasConcurrent
                    );
                    break a;
                  }
                  completeRootWhenReady(
                    forceSync,
                    yieldEndTime,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    lanes,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    startTime,
                    null,
                    renderStartTime,
                    yieldedFiber
                  );
                }
              }
            }
            break;
          } while (1);
          ensureRootIsScheduled(root2);
        }
        function completeRootWhenReady(root2, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
          root2.timeoutHandle = noTimeout;
          var subtreeFlags = finishedWork.subtreeFlags, isViewTransitionEligible = (lanes & 335544064) === lanes, suspendedState = null;
          if (isViewTransitionEligible || subtreeFlags & 8192 || 16785408 === (subtreeFlags & 16785408)) {
            if (suspendedState = startSuspendingCommit(), appearingViewTransitions = null, accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedState), isViewTransitionEligible && suspendOnActiveViewTransition(suspendedState, root2.containerInfo), subtreeFlags = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now$1() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now$1() : 0, subtreeFlags = waitForCommitToBeReady(suspendedState, subtreeFlags), null !== subtreeFlags) {
              pendingEffectsLanes = lanes;
              root2.cancelPendingCommit = subtreeFlags(
                completeRoot.bind(
                  null,
                  root2,
                  finishedWork,
                  lanes,
                  recoverableErrors,
                  transitions,
                  didIncludeRenderPhaseUpdate,
                  spawnedLane,
                  updatedLanes,
                  suspendedRetryLanes,
                  didSkipSuspendedSiblings,
                  exitStatus,
                  suspendedState,
                  getSuspendedCommitReason(suspendedState, root2.containerInfo),
                  completedRenderStartTime,
                  completedRenderEndTime
                )
              );
              markRootSuspended(
                root2,
                lanes,
                spawnedLane,
                !didSkipSuspendedSiblings
              );
              return;
            }
          }
          completeRoot(
            root2,
            finishedWork,
            lanes,
            recoverableErrors,
            transitions,
            didIncludeRenderPhaseUpdate,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes,
            didSkipSuspendedSiblings,
            exitStatus,
            suspendedState,
            suspendedCommitReason,
            completedRenderStartTime,
            completedRenderEndTime
          );
        }
        function isRenderConsistentWithExternalStores(finishedWork) {
          for (var node = finishedWork; ; ) {
            var tag = node.tag;
            if ((0 === tag || 11 === tag || 15 === tag) && node.flags & 16384 && (tag = node.updateQueue, null !== tag && (tag = tag.stores, null !== tag)))
              for (var i = 0; i < tag.length; i++) {
                var check = tag[i], getSnapshot = check.getSnapshot;
                check = check.value;
                try {
                  if (!objectIs(getSnapshot(), check)) return false;
                } catch (error) {
                  return false;
                }
              }
            tag = node.child;
            if (node.subtreeFlags & 16384 && null !== tag)
              tag.return = node, node = tag;
            else {
              if (node === finishedWork) break;
              for (; null === node.sibling; ) {
                if (null === node.return || node.return === finishedWork) return true;
                node = node.return;
              }
              node.sibling.return = node.return;
              node = node.sibling;
            }
          }
          return true;
        }
        function markRootSuspended(root2, suspendedLanes, spawnedLane, didAttemptEntireTree) {
          suspendedLanes = getEntangledLanes(root2, suspendedLanes);
          suspendedLanes &= ~workInProgressRootPingedLanes;
          suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
          root2.suspendedLanes |= suspendedLanes;
          root2.pingedLanes &= ~suspendedLanes;
          didAttemptEntireTree && (root2.warmLanes |= suspendedLanes);
          didAttemptEntireTree = root2.expirationTimes;
          for (var lanes = suspendedLanes; 0 < lanes; ) {
            var index = 31 - clz32(lanes), lane = 1 << index;
            didAttemptEntireTree[index] = -1;
            lanes &= ~lane;
          }
          0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, suspendedLanes);
        }
        function flushSyncWork() {
          return (executionContext & (RenderContext | CommitContext)) === NoContext ? (flushSyncWorkAcrossRoots_impl(0, false), false) : true;
        }
        function isAlreadyRendering() {
          return (executionContext & (RenderContext | CommitContext)) !== NoContext;
        }
        function resetWorkInProgressStack() {
          if (null !== workInProgress) {
            if (workInProgressSuspendedReason === NotSuspended)
              var interruptedWork = workInProgress.return;
            else
              interruptedWork = workInProgress, resetContextDependencies(), resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
            for (; null !== interruptedWork; )
              unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
            workInProgress = null;
          }
        }
        function finalizeRender(lanes, finalizationTime) {
          0 !== (lanes & 127) && (blockingClampTime = finalizationTime);
          0 !== (lanes & 4194048) && (transitionClampTime = finalizationTime);
          0 !== (lanes & 62914560) && (retryClampTime = finalizationTime);
          0 !== (lanes & 2080374784) && (idleClampTime = finalizationTime);
        }
        function prepareFreshStack(root2, lanes) {
          supportsUserTiming && (console.timeStamp(
            "Blocking Track",
            3e-3,
            3e-3,
            "Blocking",
            "Scheduler \u269B",
            "primary-light"
          ), console.timeStamp(
            "Transition Track",
            3e-3,
            3e-3,
            "Transition",
            "Scheduler \u269B",
            "primary-light"
          ), console.timeStamp(
            "Suspense Track",
            3e-3,
            3e-3,
            "Suspense",
            "Scheduler \u269B",
            "primary-light"
          ), console.timeStamp(
            "Idle Track",
            3e-3,
            3e-3,
            "Idle",
            "Scheduler \u269B",
            "primary-light"
          ));
          var previousRenderStartTime = renderStartTime;
          renderStartTime = now();
          if (0 !== workInProgressRootRenderLanes && 0 < previousRenderStartTime) {
            setCurrentTrackFromLanes(workInProgressRootRenderLanes);
            if (workInProgressRootExitStatus === RootSuspended || workInProgressRootExitStatus === RootSuspendedWithDelay)
              logSuspendedRenderPhase(
                previousRenderStartTime,
                renderStartTime,
                lanes,
                workInProgressUpdateTask
              );
            else {
              var endTime = renderStartTime, debugTask = workInProgressUpdateTask;
              if (supportsUserTiming && !(endTime <= previousRenderStartTime)) {
                var color = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", label = (lanes & 536870912) === lanes ? "Prewarm" : (lanes & 201326741) === lanes ? "Interrupted Hydration" : "Interrupted Render";
                debugTask ? debugTask.run(
                  console.timeStamp.bind(
                    console,
                    label,
                    previousRenderStartTime,
                    endTime,
                    currentTrack,
                    "Scheduler \u269B",
                    color
                  )
                ) : console.timeStamp(
                  label,
                  previousRenderStartTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269B",
                  color
                );
              }
            }
            finalizeRender(workInProgressRootRenderLanes, renderStartTime);
          }
          previousRenderStartTime = workInProgressUpdateTask;
          workInProgressUpdateTask = null;
          if (0 !== (lanes & 127)) {
            workInProgressUpdateTask = blockingUpdateTask;
            debugTask = 0 <= blockingUpdateTime && blockingUpdateTime < blockingClampTime ? blockingClampTime : blockingUpdateTime;
            endTime = 0 <= blockingEventTime && blockingEventTime < blockingClampTime ? blockingClampTime : blockingEventTime;
            color = 0 <= endTime ? endTime : 0 <= debugTask ? debugTask : renderStartTime;
            0 <= blockingSuspendedTime ? (setCurrentTrackFromLanes(2), logSuspendedWithDelayPhase(
              blockingSuspendedTime,
              color,
              lanes,
              previousRenderStartTime
            )) : 0 !== (animatingLanes & 127) && (setCurrentTrackFromLanes(2), logAnimatingPhase(blockingClampTime, color, animatingTask));
            previousRenderStartTime = debugTask;
            var eventTime = endTime, eventType = blockingEventType, eventIsRepeat = 0 < blockingEventRepeatTime, isSpawnedUpdate = 1 === blockingUpdateType, isPingedUpdate = 2 === blockingUpdateType;
            debugTask = renderStartTime;
            endTime = blockingUpdateTask;
            color = blockingUpdateMethodName;
            label = blockingUpdateComponentName;
            if (supportsUserTiming) {
              currentTrack = "Blocking";
              0 < previousRenderStartTime ? previousRenderStartTime > debugTask && (previousRenderStartTime = debugTask) : previousRenderStartTime = debugTask;
              0 < eventTime ? eventTime > previousRenderStartTime && (eventTime = previousRenderStartTime) : eventTime = previousRenderStartTime;
              if (null !== eventType && previousRenderStartTime > eventTime) {
                var color$jscomp$0 = eventIsRepeat ? "secondary-light" : "warning";
                endTime ? endTime.run(
                  console.timeStamp.bind(
                    console,
                    eventIsRepeat ? "Consecutive" : "Event: " + eventType,
                    eventTime,
                    previousRenderStartTime,
                    currentTrack,
                    "Scheduler \u269B",
                    color$jscomp$0
                  )
                ) : console.timeStamp(
                  eventIsRepeat ? "Consecutive" : "Event: " + eventType,
                  eventTime,
                  previousRenderStartTime,
                  currentTrack,
                  "Scheduler \u269B",
                  color$jscomp$0
                );
              }
              debugTask > previousRenderStartTime && (eventTime = isSpawnedUpdate ? "error" : (lanes & 738197653) === lanes ? "tertiary-light" : "primary-light", isSpawnedUpdate = isPingedUpdate ? "Promise Resolved" : isSpawnedUpdate ? "Cascading Update" : 5 < debugTask - previousRenderStartTime ? "Update Blocked" : "Update", isPingedUpdate = [], null != label && isPingedUpdate.push(["Component name", label]), null != color && isPingedUpdate.push(["Method name", color]), previousRenderStartTime = {
                start: previousRenderStartTime,
                end: debugTask,
                detail: {
                  devtools: {
                    properties: isPingedUpdate,
                    track: currentTrack,
                    trackGroup: "Scheduler \u269B",
                    color: eventTime
                  }
                }
              }, endTime ? endTime.run(
                performance.measure.bind(
                  performance,
                  isSpawnedUpdate,
                  previousRenderStartTime
                )
              ) : performance.measure(isSpawnedUpdate, previousRenderStartTime), performance.clearMeasures(isSpawnedUpdate));
            }
            blockingUpdateTime = -1.1;
            blockingUpdateType = 0;
            blockingUpdateComponentName = blockingUpdateMethodName = null;
            blockingSuspendedTime = -1.1;
            blockingEventRepeatTime = blockingEventTime;
            blockingEventTime = -1.1;
            blockingClampTime = now();
          }
          0 !== (lanes & 4194048) && (workInProgressUpdateTask = transitionUpdateTask, debugTask = 0 <= transitionStartTime && transitionStartTime < transitionClampTime ? transitionClampTime : transitionStartTime, previousRenderStartTime = 0 <= transitionUpdateTime && transitionUpdateTime < transitionClampTime ? transitionClampTime : transitionUpdateTime, endTime = 0 <= transitionEventTime && transitionEventTime < transitionClampTime ? transitionClampTime : transitionEventTime, color = 0 <= endTime ? endTime : 0 <= previousRenderStartTime ? previousRenderStartTime : renderStartTime, 0 <= transitionSuspendedTime ? (setCurrentTrackFromLanes(256), logSuspendedWithDelayPhase(
            transitionSuspendedTime,
            color,
            lanes,
            workInProgressUpdateTask
          )) : 0 !== (animatingLanes & 4194048) && (setCurrentTrackFromLanes(256), logAnimatingPhase(transitionClampTime, color, animatingTask)), isPingedUpdate = endTime, eventTime = transitionEventType, eventType = 0 < transitionEventRepeatTime, eventIsRepeat = 2 === transitionUpdateType, color = renderStartTime, endTime = transitionUpdateTask, label = transitionUpdateMethodName, isSpawnedUpdate = transitionUpdateComponentName, supportsUserTiming && (currentTrack = "Transition", 0 < previousRenderStartTime ? previousRenderStartTime > color && (previousRenderStartTime = color) : previousRenderStartTime = color, 0 < debugTask ? debugTask > previousRenderStartTime && (debugTask = previousRenderStartTime) : debugTask = previousRenderStartTime, 0 < isPingedUpdate ? isPingedUpdate > debugTask && (isPingedUpdate = debugTask) : isPingedUpdate = debugTask, debugTask > isPingedUpdate && null !== eventTime && (color$jscomp$0 = eventType ? "secondary-light" : "warning", endTime ? endTime.run(
            console.timeStamp.bind(
              console,
              eventType ? "Consecutive" : "Event: " + eventTime,
              isPingedUpdate,
              debugTask,
              currentTrack,
              "Scheduler \u269B",
              color$jscomp$0
            )
          ) : console.timeStamp(
            eventType ? "Consecutive" : "Event: " + eventTime,
            isPingedUpdate,
            debugTask,
            currentTrack,
            "Scheduler \u269B",
            color$jscomp$0
          )), previousRenderStartTime > debugTask && (endTime ? endTime.run(
            console.timeStamp.bind(
              console,
              "Action",
              debugTask,
              previousRenderStartTime,
              currentTrack,
              "Scheduler \u269B",
              "primary-dark"
            )
          ) : console.timeStamp(
            "Action",
            debugTask,
            previousRenderStartTime,
            currentTrack,
            "Scheduler \u269B",
            "primary-dark"
          )), color > previousRenderStartTime && (debugTask = eventIsRepeat ? "Promise Resolved" : 5 < color - previousRenderStartTime ? "Update Blocked" : "Update", isPingedUpdate = [], null != isSpawnedUpdate && isPingedUpdate.push(["Component name", isSpawnedUpdate]), null != label && isPingedUpdate.push(["Method name", label]), previousRenderStartTime = {
            start: previousRenderStartTime,
            end: color,
            detail: {
              devtools: {
                properties: isPingedUpdate,
                track: currentTrack,
                trackGroup: "Scheduler \u269B",
                color: "primary-light"
              }
            }
          }, endTime ? endTime.run(
            performance.measure.bind(
              performance,
              debugTask,
              previousRenderStartTime
            )
          ) : performance.measure(debugTask, previousRenderStartTime), performance.clearMeasures(debugTask))), transitionUpdateTime = transitionStartTime = -1.1, transitionUpdateType = 0, transitionSuspendedTime = -1.1, transitionEventRepeatTime = transitionEventTime, transitionEventTime = -1.1, transitionClampTime = now());
          0 !== (lanes & 62914560) && 0 !== (animatingLanes & 62914560) && (setCurrentTrackFromLanes(4194304), logAnimatingPhase(retryClampTime, renderStartTime, animatingTask));
          0 !== (lanes & 2080374784) && 0 !== (animatingLanes & 2080374784) && (setCurrentTrackFromLanes(268435456), logAnimatingPhase(idleClampTime, renderStartTime, animatingTask));
          previousRenderStartTime = root2.timeoutHandle;
          previousRenderStartTime !== noTimeout && (root2.timeoutHandle = noTimeout, cancelTimeout(previousRenderStartTime));
          previousRenderStartTime = root2.cancelPendingCommit;
          null !== previousRenderStartTime && (root2.cancelPendingCommit = null, previousRenderStartTime());
          pendingEffectsLanes = 0;
          resetWorkInProgressStack();
          workInProgressRoot = root2;
          workInProgress = previousRenderStartTime = createWorkInProgress(
            root2.current,
            null
          );
          workInProgressRootRenderLanes = lanes;
          workInProgressSuspendedReason = NotSuspended;
          workInProgressThrownValue = null;
          workInProgressRootDidSkipSuspendedSiblings = false;
          workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root2, lanes);
          workInProgressRootDidAttachPingListener = false;
          workInProgressRootExitStatus = RootInProgress;
          workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = 0;
          workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
          workInProgressRootDidIncludeRecursiveRenderUpdate = false;
          entangledRenderLanes = getEntangledLanes(root2, lanes);
          finishQueueingConcurrentUpdates();
          root2 = getCurrentTime();
          1e3 < root2 - lastResetTime && (ReactSharedInternals.recentlyCreatedOwnerStacks = 0, lastResetTime = root2);
          ReactStrictModeWarnings.discardPendingWarnings();
          return previousRenderStartTime;
        }
        function handleThrow(root2, thrownValue) {
          currentlyRenderingFiber = null;
          ReactSharedInternals.H = ContextOnlyDispatcher;
          ReactSharedInternals.getCurrentStack = null;
          isRendering = false;
          current = null;
          thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = SuspendedOnImmediate) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = SuspendedOnInstance) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? SuspendedOnHydration : null !== thrownValue && "object" === typeof thrownValue && "function" === typeof thrownValue.then ? SuspendedOnDeprecatedThrowPromise : SuspendedOnError;
          workInProgressThrownValue = thrownValue;
          var erroredWork = workInProgress;
          null === erroredWork ? (workInProgressRootExitStatus = RootFatalErrored, logUncaughtError(
            root2,
            createCapturedValueAtFiber(thrownValue, root2.current)
          )) : erroredWork.mode & 2 && stopProfilerTimerIfRunningAndRecordDuration(erroredWork);
        }
        function shouldRemainOnPreviousScreen() {
          var handler = suspenseHandlerStackCursor.current;
          return null === handler ? true : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? null === shellBoundary ? true : false : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || 0 !== (workInProgressRootRenderLanes & 536870912) ? handler === shellBoundary : false;
        }
        function pushDispatcher() {
          var prevDispatcher = ReactSharedInternals.H;
          ReactSharedInternals.H = ContextOnlyDispatcher;
          return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
        }
        function pushAsyncDispatcher() {
          var prevAsyncDispatcher = ReactSharedInternals.A;
          ReactSharedInternals.A = DefaultAsyncDispatcher;
          return prevAsyncDispatcher;
        }
        function markRenderDerivedCause(fiber) {
          null === workInProgressUpdateTask && (workInProgressUpdateTask = null == fiber._debugTask ? null : fiber._debugTask);
        }
        function renderDidSuspendDelayIfPossible() {
          workInProgressRootExitStatus = RootSuspendedWithDelay;
          workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && null !== suspenseHandlerStackCursor.current || (workInProgressRootIsPrerendering = true);
          0 === (workInProgressRootSkippedLanes & 134217727) && 0 === (workInProgressRootInterleavedUpdatedLanes & 134217727) || null === workInProgressRoot || markRootSuspended(
            workInProgressRoot,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            false
          );
        }
        function renderRootSync(root2, lanes, shouldYieldForPrerendering) {
          var prevExecutionContext = executionContext;
          executionContext |= RenderContext;
          var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
          if (workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes) {
            if (isDevToolsPresent) {
              var memoizedUpdaters = root2.memoizedUpdaters;
              0 < memoizedUpdaters.size && (restorePendingUpdaters(root2, workInProgressRootRenderLanes), memoizedUpdaters.clear());
              movePendingFibersToMemoized(root2, lanes);
            }
            workInProgressTransitions = null;
            prepareFreshStack(root2, lanes);
          }
          lanes = false;
          memoizedUpdaters = workInProgressRootExitStatus;
          a: do
            try {
              if (workInProgressSuspendedReason !== NotSuspended && null !== workInProgress) {
                var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
                switch (workInProgressSuspendedReason) {
                  case SuspendedOnHydration:
                    resetWorkInProgressStack();
                    memoizedUpdaters = RootSuspendedAtTheShell;
                    break a;
                  case SuspendedOnImmediate:
                  case SuspendedOnData:
                  case SuspendedOnAction:
                  case SuspendedOnDeprecatedThrowPromise:
                    null === suspenseHandlerStackCursor.current && (lanes = true);
                    var reason = workInProgressSuspendedReason;
                    workInProgressSuspendedReason = NotSuspended;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
                    if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
                      memoizedUpdaters = RootInProgress;
                      break a;
                    }
                    break;
                  default:
                    reason = workInProgressSuspendedReason, workInProgressSuspendedReason = NotSuspended, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
                }
              }
              workLoopSync();
              memoizedUpdaters = workInProgressRootExitStatus;
              break;
            } catch (thrownValue$4) {
              handleThrow(root2, thrownValue$4);
            }
          while (1);
          lanes && root2.shellSuspendCounter++;
          resetContextDependencies();
          executionContext = prevExecutionContext;
          ReactSharedInternals.H = prevDispatcher;
          ReactSharedInternals.A = prevAsyncDispatcher;
          null === workInProgress && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
          return memoizedUpdaters;
        }
        function workLoopSync() {
          for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
        }
        function renderRootConcurrent(root2, lanes) {
          var prevExecutionContext = executionContext;
          executionContext |= RenderContext;
          var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
          if (workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes) {
            if (isDevToolsPresent) {
              var memoizedUpdaters = root2.memoizedUpdaters;
              0 < memoizedUpdaters.size && (restorePendingUpdaters(root2, workInProgressRootRenderLanes), memoizedUpdaters.clear());
              movePendingFibersToMemoized(root2, lanes);
            }
            workInProgressTransitions = null;
            workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS;
            prepareFreshStack(root2, lanes);
          } else
            workInProgressRootIsPrerendering = checkIfRootIsPrerendering(
              root2,
              lanes
            );
          a: do
            try {
              if (workInProgressSuspendedReason !== NotSuspended && null !== workInProgress)
                b: switch (lanes = workInProgress, memoizedUpdaters = workInProgressThrownValue, workInProgressSuspendedReason) {
                  case SuspendedOnError:
                    workInProgressSuspendedReason = NotSuspended;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(
                      root2,
                      lanes,
                      memoizedUpdaters,
                      SuspendedOnError
                    );
                    break;
                  case SuspendedOnData:
                  case SuspendedOnAction:
                    if (isThenableResolved(memoizedUpdaters)) {
                      workInProgressSuspendedReason = NotSuspended;
                      workInProgressThrownValue = null;
                      replaySuspendedUnitOfWork(lanes);
                      break;
                    }
                    lanes = function() {
                      workInProgressSuspendedReason !== SuspendedOnData && workInProgressSuspendedReason !== SuspendedOnAction || workInProgressRoot !== root2 || (workInProgressSuspendedReason = SuspendedAndReadyToContinue);
                      ensureRootIsScheduled(root2);
                    };
                    memoizedUpdaters.then(lanes, lanes);
                    break a;
                  case SuspendedOnImmediate:
                    workInProgressSuspendedReason = SuspendedAndReadyToContinue;
                    break a;
                  case SuspendedOnInstance:
                    workInProgressSuspendedReason = SuspendedOnInstanceAndReadyToContinue;
                    break a;
                  case SuspendedAndReadyToContinue:
                    isThenableResolved(memoizedUpdaters) ? (workInProgressSuspendedReason = NotSuspended, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = NotSuspended, workInProgressThrownValue = null, throwAndUnwindWorkLoop(
                      root2,
                      lanes,
                      memoizedUpdaters,
                      SuspendedAndReadyToContinue
                    ));
                    break;
                  case SuspendedOnInstanceAndReadyToContinue:
                    var resource = null;
                    switch (workInProgress.tag) {
                      case 26:
                        resource = workInProgress.memoizedState;
                      case 5:
                      case 27:
                        var hostFiber = workInProgress, type = hostFiber.type, props = hostFiber.pendingProps;
                        if (resource ? preloadResource(resource) : preloadInstance(hostFiber.stateNode, type, props)) {
                          workInProgressSuspendedReason = NotSuspended;
                          workInProgressThrownValue = null;
                          var sibling = hostFiber.sibling;
                          if (null !== sibling) workInProgress = sibling;
                          else {
                            var returnFiber = hostFiber.return;
                            null !== returnFiber ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
                          }
                          break b;
                        }
                        break;
                      default:
                        console.error(
                          "Unexpected type of fiber triggered a suspensey commit. This is a bug in React."
                        );
                    }
                    workInProgressSuspendedReason = NotSuspended;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(
                      root2,
                      lanes,
                      memoizedUpdaters,
                      SuspendedOnInstanceAndReadyToContinue
                    );
                    break;
                  case SuspendedOnDeprecatedThrowPromise:
                    workInProgressSuspendedReason = NotSuspended;
                    workInProgressThrownValue = null;
                    throwAndUnwindWorkLoop(
                      root2,
                      lanes,
                      memoizedUpdaters,
                      SuspendedOnDeprecatedThrowPromise
                    );
                    break;
                  case SuspendedOnHydration:
                    resetWorkInProgressStack();
                    workInProgressRootExitStatus = RootSuspendedAtTheShell;
                    break a;
                  default:
                    throw Error(
                      "Unexpected SuspendedReason. This is a bug in React."
                    );
                }
              null !== ReactSharedInternals.actQueue ? workLoopSync() : workLoopConcurrentByScheduler();
              break;
            } catch (thrownValue$5) {
              handleThrow(root2, thrownValue$5);
            }
          while (1);
          resetContextDependencies();
          ReactSharedInternals.H = prevDispatcher;
          ReactSharedInternals.A = prevAsyncDispatcher;
          executionContext = prevExecutionContext;
          if (null !== workInProgress) return RootInProgress;
          workInProgressRoot = null;
          workInProgressRootRenderLanes = 0;
          finishQueueingConcurrentUpdates();
          return workInProgressRootExitStatus;
        }
        function workLoopConcurrentByScheduler() {
          for (; null !== workInProgress && !shouldYield(); )
            performUnitOfWork(workInProgress);
        }
        function performUnitOfWork(unitOfWork) {
          var current2 = unitOfWork.alternate;
          (unitOfWork.mode & 2) !== NoMode ? (startProfilerTimer(unitOfWork), current2 = runWithFiberInDEV(
            unitOfWork,
            beginWork,
            current2,
            unitOfWork,
            entangledRenderLanes
          ), stopProfilerTimerIfRunningAndRecordDuration(unitOfWork)) : current2 = runWithFiberInDEV(
            unitOfWork,
            beginWork,
            current2,
            unitOfWork,
            entangledRenderLanes
          );
          unitOfWork.memoizedProps = unitOfWork.pendingProps;
          null === current2 ? completeUnitOfWork(unitOfWork) : workInProgress = current2;
        }
        function replaySuspendedUnitOfWork(unitOfWork) {
          var next = runWithFiberInDEV(unitOfWork, replayBeginWork, unitOfWork);
          unitOfWork.memoizedProps = unitOfWork.pendingProps;
          null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
        }
        function replayBeginWork(unitOfWork) {
          var current2 = unitOfWork.alternate, isProfilingMode = (unitOfWork.mode & 2) !== NoMode;
          isProfilingMode && startProfilerTimer(unitOfWork);
          switch (unitOfWork.tag) {
            case 15:
            case 0:
              current2 = replayFunctionComponent(
                current2,
                unitOfWork,
                unitOfWork.pendingProps,
                unitOfWork.type,
                void 0,
                workInProgressRootRenderLanes
              );
              break;
            case 11:
              current2 = replayFunctionComponent(
                current2,
                unitOfWork,
                unitOfWork.pendingProps,
                unitOfWork.type.render,
                unitOfWork.ref,
                workInProgressRootRenderLanes
              );
              break;
            case 5:
              resetHooksOnUnwind(unitOfWork);
              var fiber = unitOfWork;
              supportsHydration && fiber === hydrationParentFiber && (isHydrating ? (popToNextHostParent(fiber), 5 === fiber.tag && null != fiber.stateNode && (nextHydratableInstance = fiber.stateNode)) : (popToNextHostParent(fiber), isHydrating = true));
            default:
              unwindInterruptedWork(current2, unitOfWork), unitOfWork = workInProgress = resetWorkInProgress(unitOfWork, entangledRenderLanes), current2 = beginWork(current2, unitOfWork, entangledRenderLanes);
          }
          isProfilingMode && stopProfilerTimerIfRunningAndRecordDuration(unitOfWork);
          return current2;
        }
        function throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, suspendedReason) {
          resetContextDependencies();
          resetHooksOnUnwind(unitOfWork);
          thenableState$1 = null;
          thenableIndexCounter$1 = 0;
          var returnFiber = unitOfWork.return;
          try {
            if (throwException(
              root2,
              returnFiber,
              unitOfWork,
              thrownValue,
              workInProgressRootRenderLanes
            )) {
              workInProgressRootExitStatus = RootFatalErrored;
              logUncaughtError(
                root2,
                createCapturedValueAtFiber(thrownValue, root2.current)
              );
              workInProgress = null;
              return;
            }
          } catch (error) {
            if (null !== returnFiber) throw workInProgress = returnFiber, error;
            workInProgressRootExitStatus = RootFatalErrored;
            logUncaughtError(
              root2,
              createCapturedValueAtFiber(thrownValue, root2.current)
            );
            workInProgress = null;
            return;
          }
          if (unitOfWork.flags & 32768) {
            if (isHydrating || suspendedReason === SuspendedOnError) root2 = true;
            else if (workInProgressRootIsPrerendering || 0 !== (workInProgressRootRenderLanes & 536870912))
              root2 = false;
            else if (workInProgressRootDidSkipSuspendedSiblings = root2 = true, suspendedReason === SuspendedOnData || suspendedReason === SuspendedOnAction || suspendedReason === SuspendedOnImmediate || suspendedReason === SuspendedOnDeprecatedThrowPromise)
              suspendedReason = suspenseHandlerStackCursor.current, null !== suspendedReason && 13 === suspendedReason.tag && (suspendedReason.flags |= 16384);
            unwindUnitOfWork(unitOfWork, root2);
          } else completeUnitOfWork(unitOfWork);
        }
        function completeUnitOfWork(unitOfWork) {
          var completedWork = unitOfWork;
          do {
            if (0 !== (completedWork.flags & 32768)) {
              unwindUnitOfWork(
                completedWork,
                workInProgressRootDidSkipSuspendedSiblings
              );
              return;
            }
            var current2 = completedWork.alternate;
            unitOfWork = completedWork.return;
            startProfilerTimer(completedWork);
            current2 = runWithFiberInDEV(
              completedWork,
              completeWork,
              current2,
              completedWork,
              entangledRenderLanes
            );
            (completedWork.mode & 2) !== NoMode && stopProfilerTimerIfRunningAndRecordIncompleteDuration(completedWork);
            if (null !== current2) {
              workInProgress = current2;
              return;
            }
            completedWork = completedWork.sibling;
            if (null !== completedWork) {
              workInProgress = completedWork;
              return;
            }
            workInProgress = completedWork = unitOfWork;
          } while (null !== completedWork);
          workInProgressRootExitStatus === RootInProgress && (workInProgressRootExitStatus = RootCompleted);
        }
        function unwindUnitOfWork(unitOfWork, skipSiblings) {
          do {
            var next = unwindWork(unitOfWork.alternate, unitOfWork);
            if (null !== next) {
              next.flags &= 32767;
              workInProgress = next;
              return;
            }
            if ((unitOfWork.mode & 2) !== NoMode) {
              stopProfilerTimerIfRunningAndRecordIncompleteDuration(unitOfWork);
              next = unitOfWork.actualDuration;
              for (var child = unitOfWork.child; null !== child; )
                next += child.actualDuration, child = child.sibling;
              unitOfWork.actualDuration = next;
            }
            next = unitOfWork.return;
            null !== next && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
            if (!skipSiblings && (unitOfWork = unitOfWork.sibling, null !== unitOfWork)) {
              workInProgress = unitOfWork;
              return;
            }
            workInProgress = unitOfWork = next;
          } while (null !== unitOfWork);
          workInProgressRootExitStatus = RootSuspendedAtTheShell;
          workInProgress = null;
        }
        function completeRoot(root2, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedState, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
          root2.cancelPendingCommit = null;
          do
            flushPendingEffects();
          while (pendingEffectsStatus !== NO_PENDING_EFFECTS);
          ReactStrictModeWarnings.flushLegacyContextWarning();
          ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
          if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
            throw Error("Should not already be working.");
          setCurrentTrackFromLanes(lanes);
          if (exitStatus === RootErrored)
            logErroredRenderPhase(
              completedRenderStartTime,
              completedRenderEndTime,
              lanes,
              workInProgressUpdateTask
            );
          else if (null !== recoverableErrors) {
            if (didSkipSuspendedSiblings = null !== finishedWork && null !== finishedWork.alternate && finishedWork.alternate.memoizedState.isDehydrated && 0 !== (finishedWork.flags & 256), didIncludeRenderPhaseUpdate = workInProgressUpdateTask, supportsUserTiming && !(completedRenderEndTime <= completedRenderStartTime)) {
              exitStatus = [];
              for (var i = 0; i < recoverableErrors.length; i++) {
                var error = recoverableErrors[i].value;
                exitStatus.push([
                  "Recoverable Error",
                  "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
                ]);
              }
              completedRenderStartTime = {
                start: completedRenderStartTime,
                end: completedRenderEndTime,
                detail: {
                  devtools: {
                    color: "primary-dark",
                    track: currentTrack,
                    trackGroup: "Scheduler \u269B",
                    tooltipText: didSkipSuspendedSiblings ? "Hydration Failed" : "Recovered after Error",
                    properties: exitStatus
                  }
                }
              };
              didIncludeRenderPhaseUpdate ? didIncludeRenderPhaseUpdate.run(
                performance.measure.bind(
                  performance,
                  "Recovered",
                  completedRenderStartTime
                )
              ) : performance.measure("Recovered", completedRenderStartTime);
              performance.clearMeasures("Recovered");
            }
          } else
            didIncludeRenderPhaseUpdate = workInProgressUpdateTask, !supportsUserTiming || completedRenderEndTime <= completedRenderStartTime || (didSkipSuspendedSiblings = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", exitStatus = (lanes & 536870912) === lanes ? "Prepared" : (lanes & 201326741) === lanes ? "Hydrated" : "Render", didIncludeRenderPhaseUpdate ? didIncludeRenderPhaseUpdate.run(
              console.timeStamp.bind(
                console,
                exitStatus,
                completedRenderStartTime,
                completedRenderEndTime,
                currentTrack,
                "Scheduler \u269B",
                didSkipSuspendedSiblings
              )
            ) : console.timeStamp(
              exitStatus,
              completedRenderStartTime,
              completedRenderEndTime,
              currentTrack,
              "Scheduler \u269B",
              didSkipSuspendedSiblings
            ));
          if (null !== finishedWork) {
            0 === lanes && console.error(
              "finishedLanes should not be empty during a commit. This is a bug in React."
            );
            if (finishedWork === root2.current)
              throw Error(
                "Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue."
              );
            root2 === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
            pendingFinishedWork = finishedWork;
            pendingEffectsRoot = root2;
            pendingEffectsLanes = lanes;
            pendingPassiveTransitions = transitions;
            pendingRecoverableErrors = recoverableErrors;
            pendingEffectsRenderEndTime = completedRenderEndTime;
            pendingSuspendedCommitReason = suspendedCommitReason;
            pendingDelayedCommitReason = IMMEDIATE_COMMIT;
            pendingSuspendedViewTransitionReason = null;
            commitRoot(
              root2,
              finishedWork,
              lanes,
              spawnedLane,
              updatedLanes,
              suspendedRetryLanes,
              suspendedState,
              suspendedCommitReason,
              completedRenderEndTime
            );
          }
        }
        function commitRoot(root2, finishedWork, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, suspendedState, suspendedCommitReason, completedRenderEndTime) {
          var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
          pendingEffectsRemainingLanes = remainingLanes;
          remainingLanes |= concurrentlyUpdatedLanes;
          markRootFinished(
            root2,
            lanes,
            remainingLanes,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes
          );
          pendingViewTransitionEvents = null;
          (lanes & 335544064) === lanes ? (pendingTransitionTypes = claimQueuedTransitionTypes(root2), spawnedLane = 10262) : (pendingTransitionTypes = null, spawnedLane = 10256);
          0 !== finishedWork.actualDuration || 0 !== (finishedWork.subtreeFlags & spawnedLane) || 0 !== (finishedWork.flags & spawnedLane) ? (root2.callbackNode = null, root2.callbackPriority = 0, scheduleCallback(NormalPriority$1, function() {
            trackSchedulerEvent();
            pendingDelayedCommitReason === IMMEDIATE_COMMIT && (pendingDelayedCommitReason = DELAYED_PASSIVE_COMMIT);
            flushPassiveEffects();
            return null;
          })) : (root2.callbackNode = null, root2.callbackPriority = 0);
          commitErrors = null;
          commitStartTime = now();
          null !== suspendedCommitReason && logSuspendedCommitPhase(
            completedRenderEndTime,
            commitStartTime,
            suspendedCommitReason,
            workInProgressUpdateTask
          );
          shouldStartViewTransition = false;
          suspendedCommitReason = 0 !== (finishedWork.flags & 13878);
          if (0 !== (finishedWork.subtreeFlags & 13878) || suspendedCommitReason) {
            suspendedCommitReason = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            completedRenderEndTime = getCurrentUpdatePriority();
            setCurrentUpdatePriority(2);
            spawnedLane = executionContext;
            executionContext |= CommitContext;
            try {
              commitBeforeMutationEffects(root2, finishedWork, lanes);
            } finally {
              executionContext = spawnedLane, setCurrentUpdatePriority(completedRenderEndTime), ReactSharedInternals.T = suspendedCommitReason;
            }
          }
          pendingEffectsStatus = PENDING_MUTATION_PHASE;
          shouldStartViewTransition ? (animatingLanes |= lanes, animatingTask = null, pendingViewTransition = startViewTransition(
            suspendedState,
            root2.containerInfo,
            pendingTransitionTypes,
            flushMutationEffects,
            flushLayoutEffects,
            flushAfterMutationEffects,
            flushSpawnedWork,
            flushPassiveEffects,
            reportViewTransitionError,
            suspendedViewTransition,
            finishedViewTransition.bind(null, lanes)
          )) : (flushMutationEffects(), flushLayoutEffects(), flushSpawnedWork());
        }
        function reportViewTransitionError(error) {
          if (pendingEffectsStatus !== NO_PENDING_EFFECTS) {
            var onRecoverableError = pendingEffectsRoot.onRecoverableError;
            onRecoverableError(error, makeErrorInfo(null));
          }
        }
        function suspendedViewTransition(reason) {
          commitEndTime = now();
          logCommitPhase(
            null === pendingSuspendedCommitReason ? pendingEffectsRenderEndTime : commitStartTime,
            commitEndTime,
            commitErrors,
            pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT,
            workInProgressUpdateTask
          );
          pendingSuspendedCommitReason = pendingSuspendedViewTransitionReason = reason;
        }
        function finishedViewTransition(lanes) {
          if (0 !== (animatingLanes & lanes)) {
            var task = animatingTask;
            animatingLanes &= ~lanes;
            animatingTask = null;
            0 !== (lanes & 4194048) && 0 === (workInProgressRootRenderLanes & 4194048) && 0 === (pendingEffectsLanes & 4194048) && (setCurrentTrackFromLanes(256), logAnimatingPhase(transitionClampTime, now$1(), task));
            0 !== (lanes & 62914560) && 0 === (workInProgressRootRenderLanes & 62914560) && 0 === (pendingEffectsLanes & 62914560) && (setCurrentTrackFromLanes(4194304), logAnimatingPhase(retryClampTime, now$1(), task));
            0 !== (lanes & 2080374784) && 0 === (workInProgressRootRenderLanes & 2080374784) && 0 === (pendingEffectsLanes & 2080374784) && (setCurrentTrackFromLanes(268435456), logAnimatingPhase(idleClampTime, now$1(), task));
          }
        }
        function flushAfterMutationEffects() {
          pendingEffectsStatus === PENDING_AFTER_MUTATION_PHASE && (pendingEffectsStatus = NO_PENDING_EFFECTS, commitAfterMutationEffectsOnFiber(
            pendingFinishedWork,
            pendingEffectsRoot
          ), pendingEffectsStatus = PENDING_SPAWNED_WORK);
        }
        function flushMutationEffects() {
          if (pendingEffectsStatus === PENDING_MUTATION_PHASE) {
            pendingEffectsStatus = NO_PENDING_EFFECTS;
            var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
            if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
              rootMutationHasEffect = ReactSharedInternals.T;
              ReactSharedInternals.T = null;
              var previousPriority = getCurrentUpdatePriority();
              setCurrentUpdatePriority(2);
              var prevExecutionContext = executionContext;
              executionContext |= CommitContext;
              try {
                inProgressLanes = lanes, inProgressRoot = root2, inUpdateViewTransition = rootViewTransitionAffected = false, resetComponentEffectTimers(), commitMutationEffectsOnFiber(finishedWork, root2, lanes), inProgressRoot = inProgressLanes = null, resetAfterCommit(root2.containerInfo);
              } finally {
                executionContext = prevExecutionContext, setCurrentUpdatePriority(previousPriority), ReactSharedInternals.T = rootMutationHasEffect;
              }
            }
            root2.current = finishedWork;
            pendingEffectsStatus = PENDING_LAYOUT_PHASE;
          }
        }
        function flushLayoutEffects() {
          if (pendingEffectsStatus === PENDING_LAYOUT_PHASE) {
            pendingEffectsStatus = NO_PENDING_EFFECTS;
            var suspendedViewTransitionReason = pendingSuspendedViewTransitionReason;
            if (null !== suspendedViewTransitionReason) {
              commitStartTime = now();
              var startTime = commitEndTime, endTime = commitStartTime;
              !supportsUserTiming || endTime <= startTime || (animatingTask ? animatingTask.run(
                console.timeStamp.bind(
                  console,
                  suspendedViewTransitionReason,
                  startTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269B",
                  "secondary-light"
                )
              ) : console.timeStamp(
                suspendedViewTransitionReason,
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269B",
                "secondary-light"
              ));
            }
            suspendedViewTransitionReason = pendingEffectsRoot;
            startTime = pendingFinishedWork;
            endTime = pendingEffectsLanes;
            var rootHasLayoutEffect = 0 !== (startTime.flags & 8772);
            if (0 !== (startTime.subtreeFlags & 8772) || rootHasLayoutEffect) {
              rootHasLayoutEffect = ReactSharedInternals.T;
              ReactSharedInternals.T = null;
              var _previousPriority = getCurrentUpdatePriority();
              setCurrentUpdatePriority(2);
              var _prevExecutionContext = executionContext;
              executionContext |= CommitContext;
              try {
                inProgressLanes = endTime, inProgressRoot = suspendedViewTransitionReason, resetComponentEffectTimers(), commitLayoutEffectOnFiber(
                  suspendedViewTransitionReason,
                  startTime.alternate,
                  startTime
                ), inProgressRoot = inProgressLanes = null;
              } finally {
                executionContext = _prevExecutionContext, setCurrentUpdatePriority(_previousPriority), ReactSharedInternals.T = rootHasLayoutEffect;
              }
            }
            suspendedViewTransitionReason = pendingEffectsRenderEndTime;
            startTime = pendingSuspendedCommitReason;
            commitEndTime = now();
            logCommitPhase(
              null === startTime ? suspendedViewTransitionReason : commitStartTime,
              commitEndTime,
              commitErrors,
              pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT,
              workInProgressUpdateTask
            );
            pendingEffectsStatus = PENDING_AFTER_MUTATION_PHASE;
          }
        }
        function flushSpawnedWork() {
          if (pendingEffectsStatus === PENDING_SPAWNED_WORK || pendingEffectsStatus === PENDING_AFTER_MUTATION_PHASE) {
            if (pendingEffectsStatus === PENDING_SPAWNED_WORK) {
              var startViewTransitionStartTime = commitEndTime;
              commitEndTime = now();
              var endTime = commitEndTime, abortedViewTransition = pendingDelayedCommitReason === ABORTED_VIEW_TRANSITION_COMMIT;
              !supportsUserTiming || endTime <= startViewTransitionStartTime || (animatingTask ? animatingTask.run(
                console.timeStamp.bind(
                  console,
                  abortedViewTransition ? "Interrupted View Transition" : "Starting Animation",
                  startViewTransitionStartTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269B",
                  abortedViewTransition ? "error" : "secondary-light"
                )
              ) : console.timeStamp(
                abortedViewTransition ? "Interrupted View Transition" : "Starting Animation",
                startViewTransitionStartTime,
                endTime,
                currentTrack,
                "Scheduler \u269B",
                abortedViewTransition ? " error" : "secondary-light"
              ));
              pendingDelayedCommitReason !== ABORTED_VIEW_TRANSITION_COMMIT && (pendingDelayedCommitReason = ANIMATION_STARTED_COMMIT);
            }
            pendingEffectsStatus = NO_PENDING_EFFECTS;
            startViewTransitionStartTime = pendingViewTransition;
            pendingViewTransition = null;
            requestPaint();
            endTime = pendingEffectsRoot;
            var finishedWork = pendingFinishedWork;
            abortedViewTransition = pendingEffectsLanes;
            var recoverableErrors = pendingRecoverableErrors, passiveSubtreeMask = (abortedViewTransition & 335544064) === abortedViewTransition ? 10262 : 10256;
            (passiveSubtreeMask = 0 !== finishedWork.actualDuration || 0 !== (finishedWork.subtreeFlags & passiveSubtreeMask) || 0 !== (finishedWork.flags & passiveSubtreeMask)) ? pendingEffectsStatus = PENDING_PASSIVE_PHASE : (pendingEffectsStatus = NO_PENDING_EFFECTS, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(endTime, endTime.pendingLanes), nestedPassiveUpdateCount = 0, rootWithPassiveNestedUpdates = null);
            var remainingLanes = endTime.pendingLanes;
            0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
            passiveSubtreeMask || commitDoubleInvokeEffectsInDEV(endTime);
            remainingLanes = lanesToEventPriority(abortedViewTransition);
            finishedWork = finishedWork.stateNode;
            if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
              try {
                var didError = 128 === (finishedWork.current.flags & 128);
                switch (remainingLanes) {
                  case 2:
                    var schedulerPriority = ImmediatePriority;
                    break;
                  case 8:
                    schedulerPriority = UserBlockingPriority;
                    break;
                  case 32:
                    schedulerPriority = NormalPriority$1;
                    break;
                  case 268435456:
                    schedulerPriority = IdlePriority;
                    break;
                  default:
                    schedulerPriority = NormalPriority$1;
                }
                injectedHook.onCommitFiberRoot(
                  rendererID,
                  finishedWork,
                  schedulerPriority,
                  didError
                );
              } catch (err) {
                hasLoggedError || (hasLoggedError = true, console.error(
                  "React instrumentation encountered an error: %o",
                  err
                ));
              }
            isDevToolsPresent && endTime.memoizedUpdaters.clear();
            onCommitRoot();
            if (null !== recoverableErrors) {
              didError = ReactSharedInternals.T;
              schedulerPriority = getCurrentUpdatePriority();
              setCurrentUpdatePriority(2);
              ReactSharedInternals.T = null;
              try {
                var onRecoverableError = endTime.onRecoverableError;
                for (finishedWork = 0; finishedWork < recoverableErrors.length; finishedWork++) {
                  var recoverableError = recoverableErrors[finishedWork], errorInfo = makeErrorInfo(recoverableError.stack);
                  runWithFiberInDEV(
                    recoverableError.source,
                    onRecoverableError,
                    recoverableError.value,
                    errorInfo
                  );
                }
              } finally {
                ReactSharedInternals.T = didError, setCurrentUpdatePriority(schedulerPriority);
              }
            }
            onRecoverableError = pendingViewTransitionEvents;
            recoverableError = pendingTransitionTypes;
            pendingTransitionTypes = null;
            if (null !== onRecoverableError && (pendingViewTransitionEvents = null, null === recoverableError && (recoverableError = []), null !== startViewTransitionStartTime))
              for (errorInfo = 0; errorInfo < onRecoverableError.length; errorInfo++)
                recoverableErrors = (0, onRecoverableError[errorInfo])(
                  recoverableError
                ), void 0 !== recoverableErrors && addViewTransitionFinishedListener(
                  startViewTransitionStartTime,
                  recoverableErrors
                );
            0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
            ensureRootIsScheduled(endTime);
            remainingLanes = endTime.pendingLanes;
            0 !== (abortedViewTransition & 261930) && 0 !== (remainingLanes & 42) ? (nestedUpdateScheduled = true, endTime === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = endTime)) : (nestedUpdateCount = 0, rootWithNestedUpdates = null);
            passiveSubtreeMask || finalizeRender(abortedViewTransition, commitEndTime);
            supportsHydration && flushHydrationEvents();
            flushSyncWorkAcrossRoots_impl(0, false);
          }
        }
        function makeErrorInfo(componentStack) {
          componentStack = { componentStack };
          Object.defineProperty(componentStack, "digest", {
            get: function() {
              console.error(
                'You are accessing "digest" from the errorInfo object passed to onRecoverableError. This property is no longer provided as part of errorInfo but can be accessed as a property of the Error instance itself.'
              );
            }
          });
          return componentStack;
        }
        function releaseRootPooledCache(root2, remainingLanes) {
          0 === (root2.pooledCacheLanes &= remainingLanes) && (remainingLanes = root2.pooledCache, null != remainingLanes && (root2.pooledCache = null, releaseCache(remainingLanes)));
        }
        function flushPendingEffects() {
          null !== pendingViewTransition && (stopViewTransition(pendingViewTransition), didWarnAboutInterruptedViewTransitions || (didWarnAboutInterruptedViewTransitions = true, console.warn(
            "A flushSync update cancelled a View Transition because it was called while the View Transition was still preparing. To preserve the synchronous semantics, React had to skip the View Transition. If you can, try to avoid flushSync() in a scenario that's likely to interfere."
          )), pendingViewTransition = null, pendingDelayedCommitReason = ABORTED_VIEW_TRANSITION_COMMIT);
          flushMutationEffects();
          flushLayoutEffects();
          flushSpawnedWork();
          return flushPassiveEffects();
        }
        function flushPassiveEffects() {
          if (pendingEffectsStatus !== PENDING_PASSIVE_PHASE) return false;
          var root2 = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
          pendingEffectsRemainingLanes = 0;
          var renderPriority = lanesToEventPriority(pendingEffectsLanes), priority = 32 > renderPriority ? 32 : renderPriority;
          renderPriority = ReactSharedInternals.T;
          var previousPriority = getCurrentUpdatePriority();
          try {
            setCurrentUpdatePriority(priority);
            ReactSharedInternals.T = null;
            var transitions = pendingPassiveTransitions;
            pendingPassiveTransitions = null;
            priority = pendingEffectsRoot;
            var lanes = pendingEffectsLanes;
            pendingEffectsStatus = NO_PENDING_EFFECTS;
            pendingFinishedWork = pendingEffectsRoot = null;
            pendingEffectsLanes = 0;
            if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
              throw Error("Cannot flush passive effects while already rendering.");
            setCurrentTrackFromLanes(lanes);
            isFlushingPassiveEffects = true;
            didScheduleUpdateDuringPassiveEffects = false;
            var passiveEffectStartTime = 0;
            commitErrors = null;
            passiveEffectStartTime = now$1();
            if (pendingDelayedCommitReason === ANIMATION_STARTED_COMMIT)
              logAnimatingPhase(
                commitEndTime,
                passiveEffectStartTime,
                animatingTask
              );
            else {
              var startTime = commitEndTime, endTime = passiveEffectStartTime, delayedUntilPaint = pendingDelayedCommitReason === DELAYED_PASSIVE_COMMIT;
              !supportsUserTiming || endTime <= startTime || (workInProgressUpdateTask ? workInProgressUpdateTask.run(
                console.timeStamp.bind(
                  console,
                  delayedUntilPaint ? "Waiting for Paint" : "Waiting",
                  startTime,
                  endTime,
                  currentTrack,
                  "Scheduler \u269B",
                  "secondary-light"
                )
              ) : console.timeStamp(
                delayedUntilPaint ? "Waiting for Paint" : "Waiting",
                startTime,
                endTime,
                currentTrack,
                "Scheduler \u269B",
                "secondary-light"
              ));
            }
            startTime = executionContext;
            executionContext |= CommitContext;
            var finishedWork = priority.current;
            resetComponentEffectTimers();
            commitPassiveUnmountOnFiber(finishedWork);
            var finishedWork$jscomp$0 = priority.current;
            finishedWork = pendingEffectsRenderEndTime;
            resetComponentEffectTimers();
            commitPassiveMountOnFiber(
              priority,
              finishedWork$jscomp$0,
              lanes,
              transitions,
              finishedWork
            );
            commitDoubleInvokeEffectsInDEV(priority);
            executionContext = startTime;
            var passiveEffectsEndTime = now$1();
            finishedWork$jscomp$0 = passiveEffectStartTime;
            finishedWork = workInProgressUpdateTask;
            null !== commitErrors ? logCommitErrored(
              finishedWork$jscomp$0,
              passiveEffectsEndTime,
              commitErrors,
              true,
              finishedWork
            ) : !supportsUserTiming || passiveEffectsEndTime <= finishedWork$jscomp$0 || (finishedWork ? finishedWork.run(
              console.timeStamp.bind(
                console,
                "Remaining Effects",
                finishedWork$jscomp$0,
                passiveEffectsEndTime,
                currentTrack,
                "Scheduler \u269B",
                "secondary-dark"
              )
            ) : console.timeStamp(
              "Remaining Effects",
              finishedWork$jscomp$0,
              passiveEffectsEndTime,
              currentTrack,
              "Scheduler \u269B",
              "secondary-dark"
            ));
            finalizeRender(lanes, passiveEffectsEndTime);
            flushSyncWorkAcrossRoots_impl(0, false);
            didScheduleUpdateDuringPassiveEffects ? priority === rootWithPassiveNestedUpdates ? nestedPassiveUpdateCount++ : (nestedPassiveUpdateCount = 0, rootWithPassiveNestedUpdates = priority) : nestedPassiveUpdateCount = 0;
            didScheduleUpdateDuringPassiveEffects = isFlushingPassiveEffects = false;
            if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot)
              try {
                injectedHook.onPostCommitFiberRoot(rendererID, priority);
              } catch (err) {
                hasLoggedError || (hasLoggedError = true, console.error(
                  "React instrumentation encountered an error: %o",
                  err
                ));
              }
            var stateNode = priority.current.stateNode;
            stateNode.effectDuration = 0;
            stateNode.passiveEffectDuration = 0;
            return true;
          } finally {
            setCurrentUpdatePriority(previousPriority), ReactSharedInternals.T = renderPriority, releaseRootPooledCache(root2, remainingLanes);
          }
        }
        function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
          sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
          recordEffectError(sourceFiber);
          sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
          rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
          null !== rootFiber && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
        }
        function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
          isRunningInsertionEffect = false;
          if (3 === sourceFiber.tag)
            captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
          else {
            for (; null !== nearestMountedAncestor; ) {
              if (3 === nearestMountedAncestor.tag) {
                captureCommitPhaseErrorOnRoot(
                  nearestMountedAncestor,
                  sourceFiber,
                  error
                );
                return;
              }
              if (1 === nearestMountedAncestor.tag) {
                var instance = nearestMountedAncestor.stateNode;
                if ("function" === typeof nearestMountedAncestor.type.getDerivedStateFromError || "function" === typeof instance.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
                  sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
                  recordEffectError(sourceFiber);
                  error = createClassErrorUpdate(2);
                  instance = enqueueUpdate(nearestMountedAncestor, error, 2);
                  null !== instance && (initializeClassErrorUpdate(
                    error,
                    instance,
                    nearestMountedAncestor,
                    sourceFiber
                  ), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
                  return;
                }
              }
              nearestMountedAncestor = nearestMountedAncestor.return;
            }
            console.error(
              "Internal React error: Attempted to capture a commit phase error inside a detached tree. This indicates a bug in React. Potential causes include deleting the same fiber more than once, committing an already-finished tree, or an inconsistent return pointer.\n\nError message:\n\n%s",
              error
            );
          }
        }
        function attachPingListener(root2, wakeable, lanes) {
          var pingCache = root2.pingCache;
          if (null === pingCache) {
            pingCache = root2.pingCache = new PossiblyWeakMap();
            var threadIDs = /* @__PURE__ */ new Set();
            pingCache.set(wakeable, threadIDs);
          } else
            threadIDs = pingCache.get(wakeable), void 0 === threadIDs && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
          threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = true, threadIDs.add(lanes), pingCache = pingSuspendedRoot.bind(null, root2, wakeable, lanes), isDevToolsPresent && restorePendingUpdaters(root2, lanes), wakeable.then(pingCache, pingCache));
        }
        function pingSuspendedRoot(root2, wakeable, pingedLanes) {
          var pingCache = root2.pingCache;
          null !== pingCache && pingCache.delete(wakeable);
          root2.pingedLanes |= root2.suspendedLanes & pingedLanes;
          root2.warmLanes &= ~pingedLanes;
          0 !== (pingedLanes & 127) ? 0 > blockingUpdateTime && (blockingClampTime = blockingUpdateTime = now(), blockingUpdateTask = createTask("Promise Resolved"), blockingUpdateType = 2) : 0 !== (pingedLanes & 4194048) && 0 > transitionUpdateTime && (transitionClampTime = transitionUpdateTime = now(), transitionUpdateTask = createTask("Promise Resolved"), transitionUpdateType = 2);
          isConcurrentActEnvironment() && null === ReactSharedInternals.actQueue && console.error(
            "A suspended resource finished loading inside a test, but the event was not wrapped in act(...).\n\nWhen testing, code that resolves suspended data should be wrapped into act(...):\n\nact(() => {\n  /* finish loading suspended data */\n});\n/* assert on the output */\n\nThis ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act"
          );
          workInProgressRoot === root2 && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (workInProgressRootExitStatus === RootSuspendedWithDelay || workInProgressRootExitStatus === RootSuspended && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && now$1() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS ? (executionContext & RenderContext) === NoContext ? prepareFreshStack(root2, 0) : workInProgressRootPingedLanes |= pingedLanes : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
          ensureRootIsScheduled(root2);
        }
        function retryTimedOutBoundary(boundaryFiber, retryLane) {
          0 === retryLane && (retryLane = claimNextRetryLane());
          boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
          null !== boundaryFiber && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
        }
        function retryDehydratedSuspenseBoundary(boundaryFiber) {
          var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
          null !== suspenseState && (retryLane = suspenseState.retryLane);
          retryTimedOutBoundary(boundaryFiber, retryLane);
        }
        function resolveRetryWakeable(boundaryFiber, wakeable) {
          var retryLane = 0;
          switch (boundaryFiber.tag) {
            case 31:
            case 13:
              var retryCache = boundaryFiber.stateNode;
              var suspenseState = boundaryFiber.memoizedState;
              null !== suspenseState && (retryLane = suspenseState.retryLane);
              break;
            case 19:
              retryCache = boundaryFiber.stateNode;
              break;
            case 22:
              retryCache = boundaryFiber.stateNode._retryCache;
              break;
            default:
              throw Error(
                "Pinged unknown suspense boundary type. This is probably a bug in React."
              );
          }
          null !== retryCache && retryCache.delete(wakeable);
          retryTimedOutBoundary(boundaryFiber, retryLane);
        }
        function recursivelyTraverseAndDoubleInvokeEffectsInDEV(root$jscomp$0, parentFiber, isInStrictMode) {
          if (0 !== (parentFiber.subtreeFlags & 134225920))
            for (parentFiber = parentFiber.child; null !== parentFiber; ) {
              var root2 = root$jscomp$0, fiber = parentFiber, isStrictModeFiber = fiber.type === REACT_STRICT_MODE_TYPE;
              isStrictModeFiber = isInStrictMode || isStrictModeFiber;
              22 !== fiber.tag ? fiber.flags & 134217728 ? isStrictModeFiber && runWithFiberInDEV(
                fiber,
                doubleInvokeEffectsOnFiber,
                root2,
                fiber
              ) : recursivelyTraverseAndDoubleInvokeEffectsInDEV(
                root2,
                fiber,
                isStrictModeFiber
              ) : null === fiber.memoizedState && (isStrictModeFiber && fiber.flags & 134225920 ? runWithFiberInDEV(
                fiber,
                doubleInvokeEffectsOnFiber,
                root2,
                fiber
              ) : fiber.subtreeFlags & 134217728 && runWithFiberInDEV(
                fiber,
                recursivelyTraverseAndDoubleInvokeEffectsInDEV,
                root2,
                fiber,
                isStrictModeFiber
              ));
              parentFiber = parentFiber.sibling;
            }
        }
        function doubleInvokeEffectsOnFiber(root2, fiber) {
          setIsStrictModeForDevtools(true);
          try {
            disappearLayoutEffects(fiber, NoLayoutEffectTraversalFlags), disconnectPassiveEffect(fiber), reappearLayoutEffects(
              root2,
              fiber.alternate,
              fiber,
              NoLayoutEffectTraversalFlags
            ), reconnectPassiveEffects(root2, fiber, 0, null, false, 0);
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
        function commitDoubleInvokeEffectsInDEV(root2) {
          var doubleInvokeEffects = true;
          root2.current.mode & 24 || (doubleInvokeEffects = false);
          recursivelyTraverseAndDoubleInvokeEffectsInDEV(
            root2,
            root2.current,
            doubleInvokeEffects
          );
        }
        function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
          if ((executionContext & RenderContext) === NoContext) {
            var tag = fiber.tag;
            if (3 === tag || 1 === tag || 0 === tag || 11 === tag || 14 === tag || 15 === tag) {
              tag = getComponentNameFromFiber(fiber) || "ReactComponent";
              if (null !== didWarnStateUpdateForNotYetMountedComponent) {
                if (didWarnStateUpdateForNotYetMountedComponent.has(tag)) return;
                didWarnStateUpdateForNotYetMountedComponent.add(tag);
              } else didWarnStateUpdateForNotYetMountedComponent = /* @__PURE__ */ new Set([tag]);
              runWithFiberInDEV(fiber, function() {
                console.error(
                  "Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously tries to update the component. Move this work to useEffect instead."
                );
              });
            }
          }
        }
        function restorePendingUpdaters(root2, lanes) {
          isDevToolsPresent && root2.memoizedUpdaters.forEach(function(schedulingFiber) {
            addFiberToLanesMap(root2, schedulingFiber, lanes);
          });
        }
        function scheduleCallback(priorityLevel, callback) {
          var actQueue = ReactSharedInternals.actQueue;
          return null !== actQueue ? (actQueue.push(callback), fakeActCallbackNode) : scheduleCallback$3(priorityLevel, callback);
        }
        function warnIfUpdatesNotWrappedWithActDEV(fiber) {
          isConcurrentActEnvironment() && null === ReactSharedInternals.actQueue && runWithFiberInDEV(fiber, function() {
            console.error(
              "An update to %s inside a test was not wrapped in act(...).\n\nWhen testing, code that causes React state updates should be wrapped into act(...):\n\nact(() => {\n  /* fire events that update state */\n});\n/* assert on the output */\n\nThis ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act",
              getComponentNameFromFiber(fiber)
            );
          });
        }
        function resolveTypeForHotReloading(type) {
          if (null === resolveFamily) return type;
          var family = resolveFamily(type);
          return void 0 === family ? type : family.current;
        }
        function isCompatibleFamilyForHotReloading(fiber, element) {
          if (null === resolveFamily) return false;
          var resolve = resolveFamily, prevType = fiber.elementType;
          element = element.type;
          var needsCompareFamilies = false, $$typeofNextType = "object" === typeof element && null !== element ? element.$$typeof : null;
          switch (fiber.tag) {
            case 1:
              "function" === typeof element && (needsCompareFamilies = true);
              break;
            case 0:
              "function" === typeof element ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
              break;
            case 11:
              $$typeofNextType === REACT_FORWARD_REF_TYPE ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
              break;
            case 14:
            case 15:
              $$typeofNextType === REACT_MEMO_TYPE ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
              break;
            default:
              return false;
          }
          return needsCompareFamilies && (fiber = resolve(prevType), void 0 !== fiber && fiber === resolve(element)) ? true : false;
        }
        function markFailedErrorBoundaryForHotReloading(fiber) {
          null !== resolveFamily && "function" === typeof WeakSet && (null === failedBoundaries && (failedBoundaries = /* @__PURE__ */ new WeakSet()), failedBoundaries.add(fiber));
        }
        function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {
          do {
            var _fiber = fiber, alternate = _fiber.alternate, child = _fiber.child, sibling = _fiber.sibling, tag = _fiber.tag, type = _fiber.type, elementType = _fiber.elementType, candidateType = null;
            _fiber = null;
            switch (tag) {
              case 0:
              case 1:
                candidateType = type;
                break;
              case 15:
                candidateType = type;
                _fiber = elementType;
                break;
              case 14:
                _fiber = elementType;
                break;
              case 11:
                candidateType = type.render, _fiber = elementType;
            }
            if (null === resolveFamily)
              throw Error("Expected resolveFamily to be set during hot reload.");
            var resolve = resolveFamily;
            type = elementType = false;
            null !== candidateType && (candidateType = resolve(candidateType), void 0 !== candidateType && (staleFamilies.has(candidateType) ? type = true : updatedFamilies.has(candidateType) && (1 === tag ? type = true : elementType = true)));
            type || null === _fiber || (tag = resolve(_fiber), void 0 !== tag && staleFamilies.has(tag) ? type = true : "object" === typeof _fiber && _fiber.$$typeof === REACT_LAZY_TYPE && (tag = _fiber._payload, 1 === tag._status && (tag = resolve(tag._result.default), void 0 !== tag && staleFamilies.has(tag) && (type = true))));
            null !== failedBoundaries && (failedBoundaries.has(fiber) || null !== alternate && failedBoundaries.has(alternate)) && (type = true);
            type && (fiber._debugNeedsRemount = true);
            if (type || elementType)
              alternate = enqueueConcurrentRenderForLane(fiber, 2), null !== alternate && scheduleUpdateOnFiber(alternate, fiber, 2);
            null === child || type || scheduleFibersWithFamiliesRecursively(
              child,
              updatedFamilies,
              staleFamilies
            );
            if (null === sibling) break;
            fiber = sibling;
          } while (1);
        }
        function FiberNode(tag, pendingProps, key, mode) {
          this.tag = tag;
          this.key = key;
          this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
          this.index = 0;
          this.refCleanup = this.ref = null;
          this.pendingProps = pendingProps;
          this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
          this.mode = mode;
          this.subtreeFlags = this.flags = 0;
          this.deletions = null;
          this.childLanes = this.lanes = 0;
          this.alternate = null;
          this.actualDuration = -0;
          this.actualStartTime = -1.1;
          this.treeBaseDuration = this.selfBaseDuration = -0;
          this._debugTask = this._debugStack = this._debugOwner = this._debugInfo = null;
          this._debugNeedsRemount = false;
          this._debugHookTypes = null;
          hasBadMapPolyfill || "function" !== typeof Object.preventExtensions || Object.preventExtensions(this);
        }
        function shouldConstruct(Component) {
          Component = Component.prototype;
          return !(!Component || !Component.isReactComponent);
        }
        function createWorkInProgress(current2, pendingProps) {
          var workInProgress2 = current2.alternate;
          null === workInProgress2 ? (workInProgress2 = createFiber(
            current2.tag,
            pendingProps,
            current2.key,
            current2.mode
          ), workInProgress2.elementType = current2.elementType, workInProgress2.type = current2.type, workInProgress2.stateNode = current2.stateNode, workInProgress2._debugOwner = current2._debugOwner, workInProgress2._debugStack = current2._debugStack, workInProgress2._debugTask = current2._debugTask, workInProgress2._debugHookTypes = current2._debugHookTypes, workInProgress2.alternate = current2, current2.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current2.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.actualDuration = -0, workInProgress2.actualStartTime = -1.1);
          workInProgress2.flags = current2.flags & 1206910976;
          workInProgress2.childLanes = current2.childLanes;
          workInProgress2.lanes = current2.lanes;
          workInProgress2.child = current2.child;
          workInProgress2.memoizedProps = current2.memoizedProps;
          workInProgress2.memoizedState = current2.memoizedState;
          workInProgress2.updateQueue = current2.updateQueue;
          pendingProps = current2.dependencies;
          workInProgress2.dependencies = null === pendingProps ? null : {
            lanes: pendingProps.lanes,
            firstContext: pendingProps.firstContext,
            _debugThenableState: pendingProps._debugThenableState
          };
          workInProgress2.sibling = current2.sibling;
          workInProgress2.index = current2.index;
          workInProgress2.ref = current2.ref;
          workInProgress2.refCleanup = current2.refCleanup;
          workInProgress2.selfBaseDuration = current2.selfBaseDuration;
          workInProgress2.treeBaseDuration = current2.treeBaseDuration;
          workInProgress2._debugInfo = current2._debugInfo;
          workInProgress2._debugNeedsRemount = current2._debugNeedsRemount;
          switch (workInProgress2.tag) {
            case 0:
            case 15:
            case 14:
            case 1:
            case 11:
              workInProgress2.type = resolveTypeForHotReloading(current2.type);
          }
          return workInProgress2;
        }
        function resetWorkInProgress(workInProgress2, renderLanes2) {
          workInProgress2.flags &= 1206910978;
          var current2 = workInProgress2.alternate;
          null === current2 ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null, workInProgress2.selfBaseDuration = 0, workInProgress2.treeBaseDuration = 0) : (workInProgress2.childLanes = current2.childLanes, workInProgress2.lanes = current2.lanes, workInProgress2.child = current2.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current2.memoizedProps, workInProgress2.memoizedState = current2.memoizedState, workInProgress2.updateQueue = current2.updateQueue, workInProgress2.type = current2.type, renderLanes2 = current2.dependencies, workInProgress2.dependencies = null === renderLanes2 ? null : {
            lanes: renderLanes2.lanes,
            firstContext: renderLanes2.firstContext,
            _debugThenableState: renderLanes2._debugThenableState
          }, workInProgress2.selfBaseDuration = current2.selfBaseDuration, workInProgress2.treeBaseDuration = current2.treeBaseDuration);
          return workInProgress2;
        }
        function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
          var fiberTag = 0;
          var resolvedType = resolveTypeForHotReloading(type);
          if ("function" === typeof resolvedType)
            shouldConstruct(resolvedType) && (fiberTag = 1);
          else if ("string" === typeof resolvedType)
            supportsResources && supportsSingletons ? (fiberTag = getHostContext(), fiberTag = isHostHoistableType(type, pendingProps, fiberTag) ? 26 : isHostSingletonType(type) ? 27 : 5) : supportsResources ? (fiberTag = getHostContext(), fiberTag = isHostHoistableType(type, pendingProps, fiberTag) ? 26 : 5) : fiberTag = supportsSingletons ? isHostSingletonType(type) ? 27 : 5 : 5;
          else
            a: switch (resolvedType) {
              case REACT_ACTIVITY_TYPE:
                return key = createFiber(31, pendingProps, key, mode), key.elementType = REACT_ACTIVITY_TYPE, key.lanes = lanes, key;
              case REACT_FRAGMENT_TYPE:
                return createFiberFromFragment(
                  pendingProps.children,
                  mode,
                  lanes,
                  key
                );
              case REACT_STRICT_MODE_TYPE:
                fiberTag = 8;
                mode |= 24;
                break;
              case REACT_PROFILER_TYPE:
                return type = pendingProps, owner = mode, "string" !== typeof type.id && console.error(
                  'Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.',
                  typeof type.id
                ), key = createFiber(12, type, key, owner | 2), key.elementType = REACT_PROFILER_TYPE, key.lanes = lanes, key.stateNode = { effectDuration: 0, passiveEffectDuration: 0 }, key;
              case REACT_SUSPENSE_TYPE:
                return key = createFiber(13, pendingProps, key, mode), key.elementType = REACT_SUSPENSE_TYPE, key.lanes = lanes, key;
              case REACT_SUSPENSE_LIST_TYPE:
                return key = createFiber(19, pendingProps, key, mode), key.elementType = REACT_SUSPENSE_LIST_TYPE, key.lanes = lanes, key;
              case REACT_LEGACY_HIDDEN_TYPE:
              case REACT_VIEW_TRANSITION_TYPE:
                return type = mode | 32, key = createFiber(30, pendingProps, key, type), key.elementType = REACT_VIEW_TRANSITION_TYPE, key.lanes = lanes, key.stateNode = {
                  autoName: null,
                  paired: null,
                  clones: null,
                  ref: null
                }, key;
              default:
                if ("object" === typeof resolvedType && null !== resolvedType)
                  switch (resolvedType.$$typeof) {
                    case REACT_CONTEXT_TYPE:
                      fiberTag = 10;
                      break a;
                    case REACT_CONSUMER_TYPE:
                      fiberTag = 9;
                      break a;
                    case REACT_FORWARD_REF_TYPE:
                      fiberTag = 11;
                      break a;
                    case REACT_MEMO_TYPE:
                      fiberTag = 14;
                      break a;
                    case REACT_LAZY_TYPE:
                      fiberTag = 16;
                      resolvedType = null;
                      break a;
                  }
                pendingProps = "";
                if (void 0 === type || "object" === typeof type && null !== type && 0 === Object.keys(type).length)
                  pendingProps += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
                null === type ? resolvedType = "null" : isArrayImpl(type) ? resolvedType = "array" : void 0 !== type && type.$$typeof === REACT_ELEMENT_TYPE ? (resolvedType = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />", pendingProps = " Did you accidentally export a JSX literal instead of a component?") : resolvedType = typeof type;
                fiberTag = owner ? "number" === typeof owner.tag ? getComponentNameFromFiber(owner) : "string" === typeof owner.name ? owner.name : null : null;
                fiberTag && (pendingProps += "\n\nCheck the render method of `" + fiberTag + "`.");
                fiberTag = 29;
                pendingProps = Error(
                  "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (resolvedType + "." + pendingProps)
                );
                resolvedType = null;
            }
          key = createFiber(fiberTag, pendingProps, key, mode);
          key.elementType = type;
          key.type = resolvedType;
          key.lanes = lanes;
          key._debugOwner = owner;
          return key;
        }
        function createFiberFromElement(element, mode, lanes) {
          mode = createFiberFromTypeAndProps(
            element.type,
            element.key,
            element.props,
            element._owner,
            mode,
            lanes
          );
          mode._debugOwner = element._owner;
          mode._debugStack = element._debugStack;
          mode._debugTask = element._debugTask;
          return mode;
        }
        function createFiberFromFragment(elements, mode, lanes, key) {
          elements = createFiber(7, elements, key, mode);
          elements.lanes = lanes;
          return elements;
        }
        function createFiberFromText(content, mode, lanes) {
          content = createFiber(6, content, null, mode);
          content.lanes = lanes;
          return content;
        }
        function createFiberFromDehydratedFragment(dehydratedNode) {
          var fiber = createFiber(18, null, null, NoMode);
          fiber.stateNode = dehydratedNode;
          return fiber;
        }
        function createFiberFromPortal(portal, mode, lanes) {
          mode = createFiber(
            4,
            null !== portal.children ? portal.children : [],
            portal.key,
            mode
          );
          mode.lanes = lanes;
          mode.stateNode = {
            containerInfo: portal.containerInfo,
            pendingChildren: null,
            implementation: portal.implementation
          };
          return mode;
        }
        function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
          this.tag = 1;
          this.containerInfo = containerInfo;
          this.pingCache = this.current = this.pendingChildren = null;
          this.timeoutHandle = noTimeout;
          this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
          this.callbackPriority = 0;
          this.expirationTimes = createLaneMap(-1);
          this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
          this.entanglements = createLaneMap(0);
          this.hiddenUpdates = createLaneMap(null);
          this.identifierPrefix = identifierPrefix;
          this.onUncaughtError = onUncaughtError;
          this.onCaughtError = onCaughtError;
          this.onRecoverableError = onRecoverableError;
          this.pooledCache = null;
          this.pooledCacheLanes = 0;
          this.formState = formState;
          this.transitionTypes = null;
          this.incompleteTransitions = /* @__PURE__ */ new Map();
          this.passiveEffectDuration = this.effectDuration = -0;
          this.memoizedUpdaters = /* @__PURE__ */ new Set();
          containerInfo = this.pendingUpdatersLaneMap = [];
          for (tag = 0; 31 > tag; tag++) containerInfo.push(/* @__PURE__ */ new Set());
          this._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
        }
        function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
          containerInfo = new FiberRootNode(
            containerInfo,
            tag,
            hydrate,
            identifierPrefix,
            onUncaughtError,
            onCaughtError,
            onRecoverableError,
            onDefaultTransitionIndicator,
            formState
          );
          tag = 1;
          true === isStrictMode && (tag |= 24);
          isStrictMode = createFiber(3, null, null, tag | 2);
          containerInfo.current = isStrictMode;
          isStrictMode.stateNode = containerInfo;
          tag = createCache();
          retainCache(tag);
          containerInfo.pooledCache = tag;
          retainCache(tag);
          isStrictMode.memoizedState = {
            element: initialChildren,
            isDehydrated: hydrate,
            cache: tag
          };
          initializeUpdateQueue(isStrictMode);
          return containerInfo;
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function getContextForSubtree(parentComponent) {
          if (!parentComponent) return emptyContextObject;
          parentComponent = emptyContextObject;
          return parentComponent;
        }
        function updateContainerSync(element, container, parentComponent, callback) {
          updateContainerImpl(
            container.current,
            2,
            element,
            container,
            parentComponent,
            callback
          );
          return 2;
        }
        function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
          if (injectedHook && "function" === typeof injectedHook.onScheduleFiberRoot)
            try {
              injectedHook.onScheduleFiberRoot(rendererID, container, element);
            } catch (err) {
              hasLoggedError || (hasLoggedError = true, console.error(
                "React instrumentation encountered an error: %o",
                err
              ));
            }
          parentComponent = getContextForSubtree(parentComponent);
          null === container.context ? container.context = parentComponent : container.pendingContext = parentComponent;
          isRendering && null !== current && !didWarnAboutNestedUpdates && (didWarnAboutNestedUpdates = true, console.error(
            "Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.\n\nCheck the render method of %s.",
            getComponentNameFromFiber(current) || "Unknown"
          ));
          container = createUpdate(lane);
          container.payload = { element };
          callback = void 0 === callback ? null : callback;
          null !== callback && ("function" !== typeof callback && console.error(
            "Expected the last optional `callback` argument to be a function. Instead received: %s.",
            callback
          ), container.callback = callback);
          element = enqueueUpdate(rootFiber, container, lane);
          null !== element && (startUpdateTimerByLane(lane, "root.render()", null), scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
        }
        function markRetryLaneImpl(fiber, retryLane) {
          fiber = fiber.memoizedState;
          if (null !== fiber && null !== fiber.dehydrated) {
            var a = fiber.retryLane;
            fiber.retryLane = 0 !== a && a < retryLane ? a : retryLane;
          }
        }
        function markRetryLaneIfNotHydrated(fiber, retryLane) {
          markRetryLaneImpl(fiber, retryLane);
          (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
        }
        function getCurrentFiberForDevTools() {
          return current;
        }
        var exports2 = {};
        "use strict";
        var React2 = require_react(), Scheduler = require_scheduler(), assign = Object.assign, REACT_LEGACY_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.element"), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
        /* @__PURE__ */ Symbol.for("react.scope");
        var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_LEGACY_HIDDEN_TYPE = /* @__PURE__ */ Symbol.for("react.legacy_hidden");
        /* @__PURE__ */ Symbol.for("react.tracing_marker");
        var REACT_MEMO_CACHE_SENTINEL = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, REACT_OPTIMISTIC_KEY = /* @__PURE__ */ Symbol.for("react.optimistic_key"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), isArrayImpl = Array.isArray, ReactSharedInternals = React2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, rendererVersion = $$$config.rendererVersion, rendererPackageName = $$$config.rendererPackageName, extraDevToolsConfig = $$$config.extraDevToolsConfig, getPublicInstance = $$$config.getPublicInstance, getRootHostContext = $$$config.getRootHostContext, getChildHostContext = $$$config.getChildHostContext, prepareForCommit = $$$config.prepareForCommit, resetAfterCommit = $$$config.resetAfterCommit, createInstance = $$$config.createInstance;
        $$$config.cloneMutableInstance;
        var appendInitialChild = $$$config.appendInitialChild, finalizeInitialChildren = $$$config.finalizeInitialChildren, shouldSetTextContent = $$$config.shouldSetTextContent, createTextInstance = $$$config.createTextInstance;
        $$$config.cloneMutableTextInstance;
        var scheduleTimeout = $$$config.scheduleTimeout, cancelTimeout = $$$config.cancelTimeout, noTimeout = $$$config.noTimeout, isPrimaryRenderer = $$$config.isPrimaryRenderer;
        $$$config.warnsIfNotActing;
        var supportsMutation = $$$config.supportsMutation, supportsPersistence = $$$config.supportsPersistence, supportsHydration = $$$config.supportsHydration, getInstanceFromNode = $$$config.getInstanceFromNode;
        $$$config.beforeActiveInstanceBlur;
        var preparePortalMount = $$$config.preparePortalMount;
        $$$config.prepareScopeUpdate;
        $$$config.getInstanceFromScope;
        var setCurrentUpdatePriority = $$$config.setCurrentUpdatePriority, getCurrentUpdatePriority = $$$config.getCurrentUpdatePriority, resolveUpdatePriority = $$$config.resolveUpdatePriority, trackSchedulerEvent = $$$config.trackSchedulerEvent, resolveEventType = $$$config.resolveEventType, resolveEventTimeStamp = $$$config.resolveEventTimeStamp, shouldAttemptEagerTransition = $$$config.shouldAttemptEagerTransition, detachDeletedInstance = $$$config.detachDeletedInstance;
        $$$config.requestPostPaintCallback;
        var maySuspendCommit = $$$config.maySuspendCommit, maySuspendCommitOnUpdate = $$$config.maySuspendCommitOnUpdate, maySuspendCommitInSyncRender = $$$config.maySuspendCommitInSyncRender, preloadInstance = $$$config.preloadInstance, startSuspendingCommit = $$$config.startSuspendingCommit, suspendInstance = $$$config.suspendInstance, suspendOnActiveViewTransition = $$$config.suspendOnActiveViewTransition, waitForCommitToBeReady = $$$config.waitForCommitToBeReady, getSuspendedCommitReason = $$$config.getSuspendedCommitReason, NotPendingTransition = $$$config.NotPendingTransition, HostTransitionContext = $$$config.HostTransitionContext, resetFormInstance = $$$config.resetFormInstance, bindToConsole = $$$config.bindToConsole, supportsMicrotasks = $$$config.supportsMicrotasks, scheduleMicrotask = $$$config.scheduleMicrotask, supportsTestSelectors = $$$config.supportsTestSelectors, findFiberRoot = $$$config.findFiberRoot, getBoundingRect = $$$config.getBoundingRect, getTextContent = $$$config.getTextContent, isHiddenSubtree = $$$config.isHiddenSubtree, matchAccessibilityRole = $$$config.matchAccessibilityRole, setFocusIfFocusable = $$$config.setFocusIfFocusable, setupIntersectionObserver = $$$config.setupIntersectionObserver, appendChild = $$$config.appendChild, appendChildToContainer = $$$config.appendChildToContainer, commitTextUpdate = $$$config.commitTextUpdate, commitMount = $$$config.commitMount, commitUpdate = $$$config.commitUpdate, insertBefore = $$$config.insertBefore, insertInContainerBefore = $$$config.insertInContainerBefore, removeChild = $$$config.removeChild, removeChildFromContainer = $$$config.removeChildFromContainer, resetTextContent = $$$config.resetTextContent, hideInstance = $$$config.hideInstance, hideTextInstance = $$$config.hideTextInstance, unhideInstance = $$$config.unhideInstance, unhideTextInstance = $$$config.unhideTextInstance, applyViewTransitionName = $$$config.applyViewTransitionName, restoreViewTransitionName = $$$config.restoreViewTransitionName, cancelViewTransitionName = $$$config.cancelViewTransitionName, cancelRootViewTransitionName = $$$config.cancelRootViewTransitionName, restoreRootViewTransitionName = $$$config.restoreRootViewTransitionName;
        $$$config.cloneRootViewTransitionContainer;
        $$$config.removeRootViewTransitionClone;
        var measureInstance = $$$config.measureInstance, measureClonedInstance = $$$config.measureClonedInstance, wasInstanceInViewport = $$$config.wasInstanceInViewport, hasInstanceChanged = $$$config.hasInstanceChanged, hasInstanceAffectedParent = $$$config.hasInstanceAffectedParent, startViewTransition = $$$config.startViewTransition;
        $$$config.startGestureTransition;
        var stopViewTransition = $$$config.stopViewTransition, addViewTransitionFinishedListener = $$$config.addViewTransitionFinishedListener;
        $$$config.getCurrentGestureOffset;
        var createViewTransitionInstance = $$$config.createViewTransitionInstance, clearContainer = $$$config.clearContainer, createFragmentInstance = $$$config.createFragmentInstance, updateFragmentInstanceFiber = $$$config.updateFragmentInstanceFiber, commitNewChildToFragmentInstance = $$$config.commitNewChildToFragmentInstance, deleteChildFromFragmentInstance = $$$config.deleteChildFromFragmentInstance, cloneInstance = $$$config.cloneInstance, createContainerChildSet = $$$config.createContainerChildSet, appendChildToContainerChildSet = $$$config.appendChildToContainerChildSet, finalizeContainerChildren = $$$config.finalizeContainerChildren, replaceContainerChildren = $$$config.replaceContainerChildren, cloneHiddenInstance = $$$config.cloneHiddenInstance, cloneHiddenTextInstance = $$$config.cloneHiddenTextInstance, isSuspenseInstancePending = $$$config.isSuspenseInstancePending, isSuspenseInstanceFallback = $$$config.isSuspenseInstanceFallback, getSuspenseInstanceFallbackErrorDetails = $$$config.getSuspenseInstanceFallbackErrorDetails, registerSuspenseInstanceRetry = $$$config.registerSuspenseInstanceRetry, canHydrateFormStateMarker = $$$config.canHydrateFormStateMarker, isFormStateMarkerMatching = $$$config.isFormStateMarkerMatching, getNextHydratableSibling = $$$config.getNextHydratableSibling, getNextHydratableSiblingAfterSingleton = $$$config.getNextHydratableSiblingAfterSingleton, getFirstHydratableChild = $$$config.getFirstHydratableChild, getFirstHydratableChildWithinContainer = $$$config.getFirstHydratableChildWithinContainer, getFirstHydratableChildWithinActivityInstance = $$$config.getFirstHydratableChildWithinActivityInstance, getFirstHydratableChildWithinSuspenseInstance = $$$config.getFirstHydratableChildWithinSuspenseInstance, getFirstHydratableChildWithinSingleton = $$$config.getFirstHydratableChildWithinSingleton, canHydrateInstance = $$$config.canHydrateInstance, canHydrateTextInstance = $$$config.canHydrateTextInstance, canHydrateActivityInstance = $$$config.canHydrateActivityInstance, canHydrateSuspenseInstance = $$$config.canHydrateSuspenseInstance, hydrateInstance = $$$config.hydrateInstance, hydrateTextInstance = $$$config.hydrateTextInstance, hydrateActivityInstance = $$$config.hydrateActivityInstance, hydrateSuspenseInstance = $$$config.hydrateSuspenseInstance, getNextHydratableInstanceAfterActivityInstance = $$$config.getNextHydratableInstanceAfterActivityInstance, getNextHydratableInstanceAfterSuspenseInstance = $$$config.getNextHydratableInstanceAfterSuspenseInstance, commitHydratedInstance = $$$config.commitHydratedInstance, commitHydratedContainer = $$$config.commitHydratedContainer, commitHydratedActivityInstance = $$$config.commitHydratedActivityInstance, commitHydratedSuspenseInstance = $$$config.commitHydratedSuspenseInstance, finalizeHydratedChildren = $$$config.finalizeHydratedChildren, flushHydrationEvents = $$$config.flushHydrationEvents;
        $$$config.clearActivityBoundary;
        var clearSuspenseBoundary = $$$config.clearSuspenseBoundary;
        $$$config.clearActivityBoundaryFromContainer;
        var clearSuspenseBoundaryFromContainer = $$$config.clearSuspenseBoundaryFromContainer, hideDehydratedBoundary = $$$config.hideDehydratedBoundary, unhideDehydratedBoundary = $$$config.unhideDehydratedBoundary, shouldDeleteUnhydratedTailInstances = $$$config.shouldDeleteUnhydratedTailInstances, diffHydratedPropsForDevWarnings = $$$config.diffHydratedPropsForDevWarnings, diffHydratedTextForDevWarnings = $$$config.diffHydratedTextForDevWarnings, describeHydratableInstanceForDevWarnings = $$$config.describeHydratableInstanceForDevWarnings, validateHydratableInstance = $$$config.validateHydratableInstance, validateHydratableTextInstance = $$$config.validateHydratableTextInstance, supportsResources = $$$config.supportsResources, isHostHoistableType = $$$config.isHostHoistableType, getHoistableRoot = $$$config.getHoistableRoot, getResource = $$$config.getResource, acquireResource = $$$config.acquireResource, releaseResource = $$$config.releaseResource, hydrateHoistable = $$$config.hydrateHoistable, mountHoistable = $$$config.mountHoistable, unmountHoistable = $$$config.unmountHoistable, createHoistableInstance = $$$config.createHoistableInstance, prepareToCommitHoistables = $$$config.prepareToCommitHoistables, mayResourceSuspendCommit = $$$config.mayResourceSuspendCommit, preloadResource = $$$config.preloadResource, suspendResource = $$$config.suspendResource, supportsSingletons = $$$config.supportsSingletons, resolveSingletonInstance = $$$config.resolveSingletonInstance, acquireSingletonInstance = $$$config.acquireSingletonInstance, releaseSingletonInstance = $$$config.releaseSingletonInstance, isHostSingletonType = $$$config.isHostSingletonType, isSingletonScope = $$$config.isSingletonScope, valueStack = [];
        var fiberStack = [];
        var index$jscomp$0 = -1, emptyContextObject = {};
        Object.freeze(emptyContextObject);
        var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log$1 = Math.log, LN2 = Math.LN2, nextTransitionUpdateLane = 256, nextTransitionDeferredLane = 262144, nextRetryLane = 4194304, scheduleCallback$3 = Scheduler.unstable_scheduleCallback, cancelCallback$1 = Scheduler.unstable_cancelCallback, shouldYield = Scheduler.unstable_shouldYield, requestPaint = Scheduler.unstable_requestPaint, now$1 = Scheduler.unstable_now, ImmediatePriority = Scheduler.unstable_ImmediatePriority, UserBlockingPriority = Scheduler.unstable_UserBlockingPriority, NormalPriority$1 = Scheduler.unstable_NormalPriority, IdlePriority = Scheduler.unstable_IdlePriority, log = Scheduler.log, unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue, rendererID = null, injectedHook = null, hasLoggedError = false, isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__, globalClientIdCounter$1 = 0, lastResetTime = 0;
        if ("object" === typeof performance && "function" === typeof performance.now) {
          var localPerformance = performance;
          var getCurrentTime = function() {
            return localPerformance.now();
          };
        } else {
          var localDate = Date;
          getCurrentTime = function() {
            return localDate.now();
          };
        }
        var objectIs = "function" === typeof Object.is ? Object.is : is, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
          if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
            var event = new window.ErrorEvent("error", {
              bubbles: true,
              cancelable: true,
              message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
              error
            });
            if (!window.dispatchEvent(event)) return;
          } else if ("object" === typeof process && "function" === typeof process.emit) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        }, hasOwnProperty = Object.prototype.hasOwnProperty, supportsUserTiming = "undefined" !== typeof console && "function" === typeof console.timeStamp && "undefined" !== typeof performance && "function" === typeof performance.measure, currentTrack = "Blocking", alreadyWarnedForDeepEquality = false, reusableComponentDevToolDetails = {
          color: "primary",
          properties: null,
          tooltipText: "",
          track: "Components \u269B"
        }, reusableComponentOptions = {
          start: -0,
          end: -0,
          detail: { devtools: reusableComponentDevToolDetails }
        }, reusableChangedPropsEntry = ["Changed Props", ""], reusableDeeplyEqualPropsEntry = [
          "Changed Props",
          "This component received deeply equal props. It might benefit from useMemo or the React Compiler in its owner."
        ], disabledDepth = 0, prevLog, prevInfo, prevWarn, prevError, prevGroup, prevGroupCollapsed, prevGroupEnd;
        disabledLog.__reactDisabledLog = true;
        var prefix, suffix, reentry = false;
        var componentFrameCache = new ("function" === typeof WeakMap ? WeakMap : Map)();
        var CapturedStacks = /* @__PURE__ */ new WeakMap(), forkStack = [], forkStackIndex = 0, treeForkProvider = null, treeForkCount = 0, idStack = [], idStackIndex = 0, treeContextProvider = null, treeContextId = 1, treeContextOverflow = "", contextStackCursor = createCursor(null), contextFiberStackCursor = createCursor(null), rootInstanceStackCursor = createCursor(null), hostTransitionProviderCursor = createCursor(null), needsEscaping = /["'&<>\n\t]|^\s|\s$/, current = null, isRendering = false, hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = false, didSuspendOrErrorDEV = false, hydrationDiffRootDEV = null, hydrationErrors = null, rootOrSingletonContext = false, HydrationMismatchException = Error(
          "Hydration Mismatch Exception: This is not a real error, and should not leak into userspace. If you're seeing this, it's likely a bug in React."
        ), NoMode = 0, valueCursor = createCursor(null);
        var rendererCursorDEV = createCursor(null);
        var renderer2CursorDEV = createCursor(null);
        var rendererSigil = {};
        var currentlyRenderingFiber$1 = null, lastContextDependency = null, isDisallowedContextReadInDEV = false, AbortControllerLocal = "undefined" !== typeof AbortController ? AbortController : function() {
          var listeners2 = [], signal = this.signal = {
            aborted: false,
            addEventListener: function(type, listener) {
              listeners2.push(listener);
            }
          };
          this.abort = function() {
            signal.aborted = true;
            listeners2.forEach(function(listener) {
              return listener();
            });
          };
        }, scheduleCallback$2 = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority, CacheContext = {
          $$typeof: REACT_CONTEXT_TYPE,
          Consumer: null,
          Provider: null,
          _currentValue: null,
          _currentValue2: null,
          _threadCount: 0,
          _currentRenderer: null,
          _currentRenderer2: null
        }, entangledTransitionTypes = null, now = Scheduler.unstable_now, createTask = console.createTask ? console.createTask : function() {
          return null;
        }, renderStartTime = -0, commitStartTime = -0, commitEndTime = -0, commitErrors = null, profilerStartTime = -1.1, profilerEffectDuration = -0, componentEffectDuration = -0, componentEffectStartTime = -1.1, componentEffectEndTime = -1.1, componentEffectErrors = null, componentEffectSpawnedUpdate = false, blockingClampTime = -0, blockingUpdateTime = -1.1, blockingUpdateTask = null, blockingUpdateType = 0, blockingUpdateMethodName = null, blockingUpdateComponentName = null, blockingEventTime = -1.1, blockingEventType = null, blockingEventRepeatTime = -1.1, blockingSuspendedTime = -1.1, transitionClampTime = -0, transitionStartTime = -1.1, transitionUpdateTime = -1.1, transitionUpdateType = 0, transitionUpdateTask = null, transitionUpdateMethodName = null, transitionUpdateComponentName = null, transitionEventTime = -1.1, transitionEventType = null, transitionEventRepeatTime = -1.1, transitionSuspendedTime = -1.1, retryClampTime = -0, idleClampTime = -0, animatingLanes = 0, animatingTask = null, yieldReason = 0, yieldStartTime = -1.1, currentUpdateIsNested = false, nestedUpdateScheduled = false, firstScheduledRoot = null, lastScheduledRoot = null, didScheduleMicrotask = false, didScheduleMicrotask_act = false, mightHavePendingSyncWork = false, isFlushingWork = false, currentEventTransitionLane = 0, fakeActCallbackNode$1 = {}, currentEntangledListeners = null, currentEntangledPendingCount = 0, currentEntangledLane = 0, currentEntangledActionThenable = null, prevOnStartTransitionFinish = ReactSharedInternals.S;
        ReactSharedInternals.S = function(transition, returnValue) {
          globalMostRecentTransitionTime = now$1();
          if ("object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then) {
            if (0 > transitionStartTime && 0 > transitionUpdateTime) {
              transitionStartTime = now();
              var newEventTime = resolveEventTimeStamp(), newEventType = resolveEventType();
              if (newEventTime !== transitionEventRepeatTime || newEventType !== transitionEventType)
                transitionEventRepeatTime = -1.1;
              transitionEventTime = newEventTime;
              transitionEventType = newEventType;
            }
            entangleAsyncAction(transition, returnValue);
          }
          if (null !== entangledTransitionTypes)
            for (newEventTime = firstScheduledRoot; null !== newEventTime; )
              queueTransitionTypes(newEventTime, entangledTransitionTypes), newEventTime = newEventTime.next;
          newEventTime = transition.types;
          if (null !== newEventTime) {
            for (newEventType = firstScheduledRoot; null !== newEventType; )
              queueTransitionTypes(newEventType, newEventTime), newEventType = newEventType.next;
            if (0 !== currentEntangledLane) {
              newEventType = entangledTransitionTypes;
              null === newEventType && (newEventType = entangledTransitionTypes = []);
              for (var i = 0; i < newEventTime.length; i++) {
                var transitionType = newEventTime[i];
                -1 === newEventType.indexOf(transitionType) && newEventType.push(transitionType);
              }
            }
          }
          null !== prevOnStartTransitionFinish && prevOnStartTransitionFinish(transition, returnValue);
        };
        var resumedCache = createCursor(null), ReactStrictModeWarnings = {
          recordUnsafeLifecycleWarnings: function() {
          },
          flushPendingUnsafeLifecycleWarnings: function() {
          },
          recordLegacyContextWarning: function() {
          },
          flushLegacyContextWarning: function() {
          },
          discardPendingWarnings: function() {
          }
        }, pendingComponentWillMountWarnings = [], pendingUNSAFE_ComponentWillMountWarnings = [], pendingComponentWillReceivePropsWarnings = [], pendingUNSAFE_ComponentWillReceivePropsWarnings = [], pendingComponentWillUpdateWarnings = [], pendingUNSAFE_ComponentWillUpdateWarnings = [], didWarnAboutUnsafeLifecycles = /* @__PURE__ */ new Set();
        ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function(fiber, instance) {
          didWarnAboutUnsafeLifecycles.has(fiber.type) || ("function" === typeof instance.componentWillMount && true !== instance.componentWillMount.__suppressDeprecationWarning && pendingComponentWillMountWarnings.push(fiber), fiber.mode & 8 && "function" === typeof instance.UNSAFE_componentWillMount && pendingUNSAFE_ComponentWillMountWarnings.push(fiber), "function" === typeof instance.componentWillReceiveProps && true !== instance.componentWillReceiveProps.__suppressDeprecationWarning && pendingComponentWillReceivePropsWarnings.push(fiber), fiber.mode & 8 && "function" === typeof instance.UNSAFE_componentWillReceiveProps && pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber), "function" === typeof instance.componentWillUpdate && true !== instance.componentWillUpdate.__suppressDeprecationWarning && pendingComponentWillUpdateWarnings.push(fiber), fiber.mode & 8 && "function" === typeof instance.UNSAFE_componentWillUpdate && pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber));
        };
        ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function() {
          var componentWillMountUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingComponentWillMountWarnings.length && (pendingComponentWillMountWarnings.forEach(function(fiber) {
            componentWillMountUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }), pendingComponentWillMountWarnings = []);
          var UNSAFE_componentWillMountUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingUNSAFE_ComponentWillMountWarnings.length && (pendingUNSAFE_ComponentWillMountWarnings.forEach(function(fiber) {
            UNSAFE_componentWillMountUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }), pendingUNSAFE_ComponentWillMountWarnings = []);
          var componentWillReceivePropsUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingComponentWillReceivePropsWarnings.length && (pendingComponentWillReceivePropsWarnings.forEach(function(fiber) {
            componentWillReceivePropsUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }), pendingComponentWillReceivePropsWarnings = []);
          var UNSAFE_componentWillReceivePropsUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingUNSAFE_ComponentWillReceivePropsWarnings.length && (pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(
            function(fiber) {
              UNSAFE_componentWillReceivePropsUniqueNames.add(
                getComponentNameFromFiber(fiber) || "Component"
              );
              didWarnAboutUnsafeLifecycles.add(fiber.type);
            }
          ), pendingUNSAFE_ComponentWillReceivePropsWarnings = []);
          var componentWillUpdateUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingComponentWillUpdateWarnings.length && (pendingComponentWillUpdateWarnings.forEach(function(fiber) {
            componentWillUpdateUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }), pendingComponentWillUpdateWarnings = []);
          var UNSAFE_componentWillUpdateUniqueNames = /* @__PURE__ */ new Set();
          0 < pendingUNSAFE_ComponentWillUpdateWarnings.length && (pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function(fiber) {
            UNSAFE_componentWillUpdateUniqueNames.add(
              getComponentNameFromFiber(fiber) || "Component"
            );
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          }), pendingUNSAFE_ComponentWillUpdateWarnings = []);
          if (0 < UNSAFE_componentWillMountUniqueNames.size) {
            var sortedNames = setToSortedString(
              UNSAFE_componentWillMountUniqueNames
            );
            console.error(
              "Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n\nPlease update the following components: %s",
              sortedNames
            );
          }
          0 < UNSAFE_componentWillReceivePropsUniqueNames.size && (sortedNames = setToSortedString(
            UNSAFE_componentWillReceivePropsUniqueNames
          ), console.error(
            "Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n\nPlease update the following components: %s",
            sortedNames
          ));
          0 < UNSAFE_componentWillUpdateUniqueNames.size && (sortedNames = setToSortedString(
            UNSAFE_componentWillUpdateUniqueNames
          ), console.error(
            "Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n\nPlease update the following components: %s",
            sortedNames
          ));
          0 < componentWillMountUniqueNames.size && (sortedNames = setToSortedString(componentWillMountUniqueNames), console.warn(
            "componentWillMount has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move code with side effects to componentDidMount, and set initial state in the constructor.\n* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
            sortedNames
          ));
          0 < componentWillReceivePropsUniqueNames.size && (sortedNames = setToSortedString(
            componentWillReceivePropsUniqueNames
          ), console.warn(
            "componentWillReceiveProps has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://react.dev/link/derived-state\n* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
            sortedNames
          ));
          0 < componentWillUpdateUniqueNames.size && (sortedNames = setToSortedString(componentWillUpdateUniqueNames), console.warn(
            "componentWillUpdate has been renamed, and is not recommended for use. See https://react.dev/link/unsafe-component-lifecycles for details.\n\n* Move data fetching code or side effects to componentDidUpdate.\n* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run `npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n\nPlease update the following components: %s",
            sortedNames
          ));
        };
        var pendingLegacyContextWarning = /* @__PURE__ */ new Map(), didWarnAboutLegacyContext = /* @__PURE__ */ new Set();
        ReactStrictModeWarnings.recordLegacyContextWarning = function(fiber, instance) {
          var strictRoot = null;
          for (var node = fiber; null !== node; )
            node.mode & 8 && (strictRoot = node), node = node.return;
          null === strictRoot ? console.error(
            "Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue."
          ) : !didWarnAboutLegacyContext.has(fiber.type) && (node = pendingLegacyContextWarning.get(strictRoot), null != fiber.type.contextTypes || null != fiber.type.childContextTypes || null !== instance && "function" === typeof instance.getChildContext) && (void 0 === node && (node = [], pendingLegacyContextWarning.set(strictRoot, node)), node.push(fiber));
        };
        ReactStrictModeWarnings.flushLegacyContextWarning = function() {
          pendingLegacyContextWarning.forEach(function(fiberArray) {
            if (0 !== fiberArray.length) {
              var firstFiber = fiberArray[0], uniqueNames = /* @__PURE__ */ new Set();
              fiberArray.forEach(function(fiber) {
                uniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
                didWarnAboutLegacyContext.add(fiber.type);
              });
              var sortedNames = setToSortedString(uniqueNames);
              runWithFiberInDEV(firstFiber, function() {
                console.error(
                  "Legacy context API has been detected within a strict-mode tree.\n\nThe old API will be supported in all 16.x releases, but applications using it should migrate to the new version.\n\nPlease update the following components: %s\n\nLearn more about this warning here: https://react.dev/link/legacy-context",
                  sortedNames
                );
              });
            }
          });
        };
        ReactStrictModeWarnings.discardPendingWarnings = function() {
          pendingComponentWillMountWarnings = [];
          pendingUNSAFE_ComponentWillMountWarnings = [];
          pendingComponentWillReceivePropsWarnings = [];
          pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
          pendingComponentWillUpdateWarnings = [];
          pendingUNSAFE_ComponentWillUpdateWarnings = [];
          pendingLegacyContextWarning = /* @__PURE__ */ new Map();
        };
        var REACT_RECOVERABLE_DIGEST = "", callComponent = {
          react_stack_bottom_frame: function(Component, props, secondArg) {
            var wasRendering = isRendering;
            isRendering = true;
            try {
              return Component(props, secondArg);
            } finally {
              isRendering = wasRendering;
            }
          }
        }, callComponentInDEV = callComponent.react_stack_bottom_frame.bind(callComponent), callRender = {
          react_stack_bottom_frame: function(instance) {
            var wasRendering = isRendering;
            isRendering = true;
            try {
              return instance.render();
            } finally {
              isRendering = wasRendering;
            }
          }
        }, callRenderInDEV = callRender.react_stack_bottom_frame.bind(callRender), callComponentDidMount = {
          react_stack_bottom_frame: function(finishedWork, instance) {
            try {
              instance.componentDidMount();
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
        }, callComponentDidMountInDEV = callComponentDidMount.react_stack_bottom_frame.bind(
          callComponentDidMount
        ), callComponentDidUpdate = {
          react_stack_bottom_frame: function(finishedWork, instance, prevProps, prevState, snapshot) {
            try {
              instance.componentDidUpdate(prevProps, prevState, snapshot);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
        }, callComponentDidUpdateInDEV = callComponentDidUpdate.react_stack_bottom_frame.bind(
          callComponentDidUpdate
        ), callComponentDidCatch = {
          react_stack_bottom_frame: function(instance, errorInfo) {
            var stack = errorInfo.stack;
            instance.componentDidCatch(errorInfo.value, {
              componentStack: null !== stack ? stack : ""
            });
          }
        }, callComponentDidCatchInDEV = callComponentDidCatch.react_stack_bottom_frame.bind(
          callComponentDidCatch
        ), callComponentWillUnmount = {
          react_stack_bottom_frame: function(current2, nearestMountedAncestor, instance) {
            try {
              instance.componentWillUnmount();
            } catch (error) {
              captureCommitPhaseError(current2, nearestMountedAncestor, error);
            }
          }
        }, callComponentWillUnmountInDEV = callComponentWillUnmount.react_stack_bottom_frame.bind(
          callComponentWillUnmount
        ), callCreate = {
          react_stack_bottom_frame: function(effect) {
            var create = effect.create;
            effect = effect.inst;
            create = create();
            return effect.destroy = create;
          }
        }, callCreateInDEV = callCreate.react_stack_bottom_frame.bind(callCreate), callDestroy = {
          react_stack_bottom_frame: function(current2, nearestMountedAncestor, destroy) {
            try {
              destroy();
            } catch (error) {
              captureCommitPhaseError(current2, nearestMountedAncestor, error);
            }
          }
        }, callDestroyInDEV = callDestroy.react_stack_bottom_frame.bind(callDestroy), callLazyInit = {
          react_stack_bottom_frame: function(lazy) {
            var init = lazy._init;
            return init(lazy._payload);
          }
        }, callLazyInitInDEV = callLazyInit.react_stack_bottom_frame.bind(callLazyInit), SuspenseException = Error(
          "Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`."
        ), SuspenseyCommitException = Error(
          "Suspense Exception: This is not a real error, and should not leak into userspace. If you're seeing this, it's likely a bug in React."
        ), SuspenseActionException = Error(
          "Suspense Exception: This is not a real error! It's an implementation detail of `useActionState` to interrupt the current render. You must either rethrow it immediately, or move the `useActionState` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary."
        ), noopSuspenseyCommitThenable = {
          then: function() {
            console.error(
              'Internal React error: A listener was unexpectedly attached to a "noop" thenable. This is a bug in React. Please file an issue.'
            );
          }
        }, lastSuspendedFiber = null, lastSuspendedStack = null, didIssueUseWarning = false, suspendedThenable = null, needsToResetSuspendedThenableDEV = false, thenableState$1 = null, thenableIndexCounter$1 = 0, currentDebugInfo = null, didWarnAboutMaps;
        var didWarnAboutGenerators = didWarnAboutMaps = false;
        var ownerHasKeyUseWarning = {};
        var ownerHasFunctionTypeWarning = {};
        var ownerHasSymbolTypeWarning = {};
        warnForMissingKey = function(returnFiber, workInProgress2, child) {
          if (null !== child && "object" === typeof child && child._store && (!child._store.validated && null == child.key || 2 === child._store.validated)) {
            if ("object" !== typeof child._store)
              throw Error(
                "React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue."
              );
            child._store.validated = 1;
            var componentName2 = getComponentNameFromFiber(returnFiber), componentKey = componentName2 || "null";
            if (!ownerHasKeyUseWarning[componentKey]) {
              ownerHasKeyUseWarning[componentKey] = true;
              child = child._owner;
              returnFiber = returnFiber._debugOwner;
              var currentComponentErrorInfo = "";
              returnFiber && "number" === typeof returnFiber.tag && (componentKey = getComponentNameFromFiber(returnFiber)) && (currentComponentErrorInfo = "\n\nCheck the render method of `" + componentKey + "`.");
              currentComponentErrorInfo || componentName2 && (currentComponentErrorInfo = "\n\nCheck the top-level render call using <" + componentName2 + ">.");
              var childOwnerAppendix = "";
              null != child && returnFiber !== child && (componentName2 = null, "number" === typeof child.tag ? componentName2 = getComponentNameFromFiber(child) : "string" === typeof child.name && (componentName2 = child.name), componentName2 && (childOwnerAppendix = " It was passed a child from " + componentName2 + "."));
              runWithFiberInDEV(workInProgress2, function() {
                console.error(
                  'Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.',
                  currentComponentErrorInfo,
                  childOwnerAppendix
                );
              });
            }
          }
        };
        var reconcileChildFibers = createChildReconciler(true), mountChildFibers = createChildReconciler(false), OffscreenVisible = 1, OffscreenPassiveEffectsConnected = 2, concurrentQueues = [], concurrentQueuesIndex = 0, concurrentlyUpdatedLanes = 0, UpdateState = 0, ReplaceState = 1, ForceUpdate = 2, CaptureUpdate = 3, hasForceUpdate = false;
        var didWarnUpdateInsideUpdate = false;
        var currentlyProcessingQueue = null;
        var didReadFromEntangledAsyncAction = false, currentTreeHiddenStackCursor = createCursor(null), prevEntangledRenderLanesCursor = createCursor(0), suspenseHandlerStackCursor = createCursor(null), shellBoundary = null, SubtreeSuspenseContextMask = 1, ForceSuspenseFallback = 2, suspenseStackCursor = createCursor(0), NoFlags = 0, HasEffect = 1, Insertion = 2, Layout = 4, Passive = 8, didWarnUncachedGetSnapshot;
        var didWarnAboutMismatchedHooksForComponent = /* @__PURE__ */ new Set();
        var didWarnAboutUseWrappedInTryCatch = /* @__PURE__ */ new Set();
        var didWarnAboutAsyncClientComponent = /* @__PURE__ */ new Set();
        var didWarnAboutUseFormState = /* @__PURE__ */ new Set();
        var renderLanes = 0, currentlyRenderingFiber = null, currentHook = null, workInProgressHook = null, didScheduleRenderPhaseUpdate = false, didScheduleRenderPhaseUpdateDuringThisPass = false, shouldDoubleInvokeUserFnsInHooksDEV = false, localIdCounter = 0, thenableIndexCounter = 0, thenableState = null, globalClientIdCounter = 0, RE_RENDER_LIMIT = 25, currentHookNameInDev = null, hookTypesDev = null, hookTypesUpdateIndexDev = -1, ignorePreviousDependencies = false, ContextOnlyDispatcher = {
          readContext,
          use,
          useCallback: throwInvalidHookError,
          useContext: throwInvalidHookError,
          useEffect: throwInvalidHookError,
          useImperativeHandle: throwInvalidHookError,
          useLayoutEffect: throwInvalidHookError,
          useInsertionEffect: throwInvalidHookError,
          useMemo: throwInvalidHookError,
          useReducer: throwInvalidHookError,
          useRef: throwInvalidHookError,
          useState: throwInvalidHookError,
          useDebugValue: throwInvalidHookError,
          useDeferredValue: throwInvalidHookError,
          useTransition: throwInvalidHookError,
          useSyncExternalStore: throwInvalidHookError,
          useId: throwInvalidHookError,
          useHostTransitionStatus: throwInvalidHookError,
          useFormState: throwInvalidHookError,
          useActionState: throwInvalidHookError,
          useOptimistic: throwInvalidHookError,
          useMemoCache: throwInvalidHookError,
          useCacheRefresh: throwInvalidHookError,
          useEffectEvent: throwInvalidHookError
        }, HooksDispatcherOnMountInDEV = null, HooksDispatcherOnMountWithHookTypesInDEV = null, HooksDispatcherOnUpdateInDEV = null, HooksDispatcherOnRerenderInDEV = null, InvalidNestedHooksDispatcherOnMountInDEV = null, InvalidNestedHooksDispatcherOnUpdateInDEV = null, InvalidNestedHooksDispatcherOnRerenderInDEV = null;
        HooksDispatcherOnMountInDEV = {
          readContext: function(context) {
            return readContext(context);
          },
          use,
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return mountCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            mountHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return mountEffect(create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return mountImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            mountEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            return mountLayoutEffect(create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            mountHookTypesDev();
            checkDepsAreArrayDev(deps);
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            mountHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function(initialValue) {
            currentHookNameInDev = "useRef";
            mountHookTypesDev();
            return mountRef(initialValue);
          },
          useState: function(initialState) {
            currentHookNameInDev = "useState";
            mountHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountState(initialState);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            mountHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            mountHookTypesDev();
            return mountDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            mountHookTypesDev();
            return mountTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            mountHookTypesDev();
            return mountSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            mountHookTypesDev();
            return mountId();
          },
          useFormState: function(action, initialState) {
            currentHookNameInDev = "useFormState";
            mountHookTypesDev();
            warnOnUseFormStateInDev();
            return mountActionState(action, initialState);
          },
          useActionState: function(action, initialState) {
            currentHookNameInDev = "useActionState";
            mountHookTypesDev();
            return mountActionState(action, initialState);
          },
          useOptimistic: function(passthrough) {
            currentHookNameInDev = "useOptimistic";
            mountHookTypesDev();
            return mountOptimistic(passthrough);
          },
          useHostTransitionStatus,
          useMemoCache,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return mountRefresh();
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            mountHookTypesDev();
            return mountEvent(callback);
          }
        };
        HooksDispatcherOnMountWithHookTypesInDEV = {
          readContext: function(context) {
            return readContext(context);
          },
          use,
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            updateHookTypesDev();
            return mountCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            updateHookTypesDev();
            return mountEffect(create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return mountImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            mountEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return mountLayoutEffect(create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function(initialValue) {
            currentHookNameInDev = "useRef";
            updateHookTypesDev();
            return mountRef(initialValue);
          },
          useState: function(initialState) {
            currentHookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountState(initialState);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            updateHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return mountDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            updateHookTypesDev();
            return mountTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return mountSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            updateHookTypesDev();
            return mountId();
          },
          useActionState: function(action, initialState) {
            currentHookNameInDev = "useActionState";
            updateHookTypesDev();
            return mountActionState(action, initialState);
          },
          useFormState: function(action, initialState) {
            currentHookNameInDev = "useFormState";
            updateHookTypesDev();
            warnOnUseFormStateInDev();
            return mountActionState(action, initialState);
          },
          useOptimistic: function(passthrough) {
            currentHookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return mountOptimistic(passthrough);
          },
          useHostTransitionStatus,
          useMemoCache,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return mountRefresh();
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return mountEvent(callback);
          }
        };
        HooksDispatcherOnUpdateInDEV = {
          readContext: function(context) {
            return readContext(context);
          },
          use,
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            updateHookTypesDev();
            return updateCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            updateHookTypesDev();
            updateEffectImpl(2048, Passive, create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return updateImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return updateEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return updateEffectImpl(4, Layout, create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function() {
            currentHookNameInDev = "useRef";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useState: function() {
            currentHookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateReducer(basicStateReducer);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            updateHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return updateDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            updateHookTypesDev();
            return updateTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return updateSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useFormState: function(action) {
            currentHookNameInDev = "useFormState";
            updateHookTypesDev();
            warnOnUseFormStateInDev();
            return updateActionState(action);
          },
          useActionState: function(action) {
            currentHookNameInDev = "useActionState";
            updateHookTypesDev();
            return updateActionState(action);
          },
          useOptimistic: function(passthrough, reducer) {
            currentHookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return updateOptimistic(passthrough, reducer);
          },
          useHostTransitionStatus,
          useMemoCache,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return updateEvent(callback);
          }
        };
        HooksDispatcherOnRerenderInDEV = {
          readContext: function(context) {
            return readContext(context);
          },
          use,
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            updateHookTypesDev();
            return updateCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            updateHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            updateHookTypesDev();
            updateEffectImpl(2048, Passive, create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            updateHookTypesDev();
            return updateImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            updateHookTypesDev();
            return updateEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            updateHookTypesDev();
            return updateEffectImpl(4, Layout, create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
            try {
              return updateMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
            try {
              return rerenderReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function() {
            currentHookNameInDev = "useRef";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useState: function() {
            currentHookNameInDev = "useState";
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnRerenderInDEV;
            try {
              return rerenderReducer(basicStateReducer);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            updateHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            updateHookTypesDev();
            return rerenderDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            updateHookTypesDev();
            return rerenderTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            updateHookTypesDev();
            return updateSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useFormState: function(action) {
            currentHookNameInDev = "useFormState";
            updateHookTypesDev();
            warnOnUseFormStateInDev();
            return rerenderActionState(action);
          },
          useActionState: function(action) {
            currentHookNameInDev = "useActionState";
            updateHookTypesDev();
            return rerenderActionState(action);
          },
          useOptimistic: function(passthrough, reducer) {
            currentHookNameInDev = "useOptimistic";
            updateHookTypesDev();
            return rerenderOptimistic(passthrough, reducer);
          },
          useHostTransitionStatus,
          useMemoCache,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            updateHookTypesDev();
            return updateEvent(callback);
          }
        };
        InvalidNestedHooksDispatcherOnMountInDEV = {
          readContext: function(context) {
            warnInvalidContextAccess();
            return readContext(context);
          },
          use: function(usable) {
            warnInvalidHookAccess();
            return use(usable);
          },
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountEffect(create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            mountEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountLayoutEffect(create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            warnInvalidHookAccess();
            mountHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            warnInvalidHookAccess();
            mountHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function(initialValue) {
            currentHookNameInDev = "useRef";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountRef(initialValue);
          },
          useState: function(initialState) {
            currentHookNameInDev = "useState";
            warnInvalidHookAccess();
            mountHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnMountInDEV;
            try {
              return mountState(initialState);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            mountHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountId();
          },
          useFormState: function(action, initialState) {
            currentHookNameInDev = "useFormState";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountActionState(action, initialState);
          },
          useActionState: function(action, initialState) {
            currentHookNameInDev = "useActionState";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountActionState(action, initialState);
          },
          useOptimistic: function(passthrough) {
            currentHookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountOptimistic(passthrough);
          },
          useMemoCache: function(size) {
            warnInvalidHookAccess();
            return useMemoCache(size);
          },
          useHostTransitionStatus,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            mountHookTypesDev();
            return mountRefresh();
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            mountHookTypesDev();
            return mountEvent(callback);
          }
        };
        InvalidNestedHooksDispatcherOnUpdateInDEV = {
          readContext: function(context) {
            warnInvalidContextAccess();
            return readContext(context);
          },
          use: function(usable) {
            warnInvalidHookAccess();
            return use(usable);
          },
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            updateEffectImpl(2048, Passive, create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffectImpl(4, Layout, create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function() {
            currentHookNameInDev = "useRef";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useState: function() {
            currentHookNameInDev = "useState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateReducer(basicStateReducer);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useFormState: function(action) {
            currentHookNameInDev = "useFormState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateActionState(action);
          },
          useActionState: function(action) {
            currentHookNameInDev = "useActionState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateActionState(action);
          },
          useOptimistic: function(passthrough, reducer) {
            currentHookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateOptimistic(passthrough, reducer);
          },
          useMemoCache: function(size) {
            warnInvalidHookAccess();
            return useMemoCache(size);
          },
          useHostTransitionStatus,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEvent(callback);
          }
        };
        InvalidNestedHooksDispatcherOnRerenderInDEV = {
          readContext: function(context) {
            warnInvalidContextAccess();
            return readContext(context);
          },
          use: function(usable) {
            warnInvalidHookAccess();
            return use(usable);
          },
          useCallback: function(callback, deps) {
            currentHookNameInDev = "useCallback";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateCallback(callback, deps);
          },
          useContext: function(context) {
            currentHookNameInDev = "useContext";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return readContext(context);
          },
          useEffect: function(create, deps) {
            currentHookNameInDev = "useEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            updateEffectImpl(2048, Passive, create, deps);
          },
          useImperativeHandle: function(ref, create, deps) {
            currentHookNameInDev = "useImperativeHandle";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateImperativeHandle(ref, create, deps);
          },
          useInsertionEffect: function(create, deps) {
            currentHookNameInDev = "useInsertionEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffectImpl(4, Insertion, create, deps);
          },
          useLayoutEffect: function(create, deps) {
            currentHookNameInDev = "useLayoutEffect";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEffectImpl(4, Layout, create, deps);
          },
          useMemo: function(create, deps) {
            currentHookNameInDev = "useMemo";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return updateMemo(create, deps);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useReducer: function(reducer, initialArg, init) {
            currentHookNameInDev = "useReducer";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return rerenderReducer(reducer, initialArg, init);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useRef: function() {
            currentHookNameInDev = "useRef";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useState: function() {
            currentHookNameInDev = "useState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            var prevDispatcher = ReactSharedInternals.H;
            ReactSharedInternals.H = InvalidNestedHooksDispatcherOnUpdateInDEV;
            try {
              return rerenderReducer(basicStateReducer);
            } finally {
              ReactSharedInternals.H = prevDispatcher;
            }
          },
          useDebugValue: function() {
            currentHookNameInDev = "useDebugValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
          },
          useDeferredValue: function(value, initialValue) {
            currentHookNameInDev = "useDeferredValue";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderDeferredValue(value, initialValue);
          },
          useTransition: function() {
            currentHookNameInDev = "useTransition";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderTransition();
          },
          useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
            currentHookNameInDev = "useSyncExternalStore";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateSyncExternalStore(
              subscribe,
              getSnapshot,
              getServerSnapshot
            );
          },
          useId: function() {
            currentHookNameInDev = "useId";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useFormState: function(action) {
            currentHookNameInDev = "useFormState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderActionState(action);
          },
          useActionState: function(action) {
            currentHookNameInDev = "useActionState";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderActionState(action);
          },
          useOptimistic: function(passthrough, reducer) {
            currentHookNameInDev = "useOptimistic";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return rerenderOptimistic(passthrough, reducer);
          },
          useMemoCache: function(size) {
            warnInvalidHookAccess();
            return useMemoCache(size);
          },
          useHostTransitionStatus,
          useCacheRefresh: function() {
            currentHookNameInDev = "useCacheRefresh";
            updateHookTypesDev();
            return updateWorkInProgressHook().memoizedState;
          },
          useEffectEvent: function(callback) {
            currentHookNameInDev = "useEffectEvent";
            warnInvalidHookAccess();
            updateHookTypesDev();
            return updateEvent(callback);
          }
        };
        var fakeInternalInstance = {};
        var didWarnAboutStateAssignmentForComponent = /* @__PURE__ */ new Set();
        var didWarnAboutUninitializedState = /* @__PURE__ */ new Set();
        var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = /* @__PURE__ */ new Set();
        var didWarnAboutLegacyLifecyclesAndDerivedState = /* @__PURE__ */ new Set();
        var didWarnAboutDirectlyAssigningPropsToState = /* @__PURE__ */ new Set();
        var didWarnAboutUndefinedDerivedState = /* @__PURE__ */ new Set();
        var didWarnAboutContextTypes$1 = /* @__PURE__ */ new Set();
        var didWarnAboutChildContextTypes = /* @__PURE__ */ new Set();
        var didWarnAboutInvalidateContextType = /* @__PURE__ */ new Set();
        var didWarnOnInvalidCallback = /* @__PURE__ */ new Set();
        Object.freeze(fakeInternalInstance);
        var classComponentUpdater = {
          enqueueSetState: function(inst, payload, callback) {
            inst = inst._reactInternals;
            var lane = requestUpdateLane(inst), update = createUpdate(lane);
            update.payload = payload;
            void 0 !== callback && null !== callback && (warnOnInvalidCallback(callback), update.callback = callback);
            payload = enqueueUpdate(inst, update, lane);
            null !== payload && (startUpdateTimerByLane(lane, "this.setState()", inst), scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
          },
          enqueueReplaceState: function(inst, payload, callback) {
            inst = inst._reactInternals;
            var lane = requestUpdateLane(inst), update = createUpdate(lane);
            update.tag = ReplaceState;
            update.payload = payload;
            void 0 !== callback && null !== callback && (warnOnInvalidCallback(callback), update.callback = callback);
            payload = enqueueUpdate(inst, update, lane);
            null !== payload && (startUpdateTimerByLane(lane, "this.replaceState()", inst), scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
          },
          enqueueForceUpdate: function(inst, callback) {
            inst = inst._reactInternals;
            var lane = requestUpdateLane(inst), update = createUpdate(lane);
            update.tag = ForceUpdate;
            void 0 !== callback && null !== callback && (warnOnInvalidCallback(callback), update.callback = callback);
            callback = enqueueUpdate(inst, update, lane);
            null !== callback && (startUpdateTimerByLane(lane, "this.forceUpdate()", inst), scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
          }
        }, componentName = null, errorBoundaryName = null, SelectiveHydrationException = Error(
          "This is not a real error. It's an implementation detail of React's selective hydration feature. If this leaks into userspace, it's a bug in React. Please file an issue."
        ), didReceiveUpdate = false;
        var didWarnAboutBadClass = {};
        var didWarnAboutContextTypeOnFunctionComponent = {};
        var didWarnAboutContextTypes = {};
        var didWarnAboutGetDerivedStateOnFunctionComponent = {};
        var didWarnAboutReassigningProps = false;
        var didWarnAboutRevealOrder = {};
        var didWarnAboutTailOptions = {};
        var didWarnAboutClassNameOnViewTransition = {};
        var SUSPENDED_MARKER = {
          dehydrated: null,
          treeContext: null,
          retryLane: 0,
          hydrationErrors: null
        }, hasWarnedAboutUsingNoValuePropOnContextProvider = false, didWarnAboutUndefinedSnapshotBeforeUpdate = null;
        didWarnAboutUndefinedSnapshotBeforeUpdate = /* @__PURE__ */ new Set();
        var viewTransitionMutationContext = false, shouldStartViewTransition = false, appearingViewTransitions = null, viewTransitionCancelableChildren = null, viewTransitionHostInstanceIdx = 0, mountedNamedViewTransitions = /* @__PURE__ */ new Map(), didWarnAboutName = {}, NoLayoutEffectTraversalFlags = 0, IncludeWorkInProgressEffects = 1, IncludeHostSingletons = 2, offscreenSubtreeIsHidden = false, offscreenSubtreeWasHidden = false, offscreenDirectParentIsHidden = false, needsFormReset = false, PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set, nextEffect = null, inProgressLanes = null, inProgressRoot = null, viewTransitionContextChanged = false, inUpdateViewTransition = false, rootViewTransitionAffected = false, rootViewTransitionNameCanceled = false, hostParent = null, hostParentIsContainer = false, currentHoistableRoot = null, inHydratedSubtree = false, suspenseyCommitFlag = 8192, DefaultAsyncDispatcher = {
          getCacheForType: function(resourceType) {
            var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
            void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
            return cacheForType;
          },
          cacheSignal: function() {
            return readContext(CacheContext).controller.signal;
          },
          getOwner: function() {
            return current;
          }
        }, COMPONENT_TYPE = 0, HAS_PSEUDO_CLASS_TYPE = 1, ROLE_TYPE = 2, TEST_NAME_TYPE = 3, TEXT_TYPE = 4;
        if ("function" === typeof Symbol && Symbol.for) {
          var symbolFor = Symbol.for;
          COMPONENT_TYPE = symbolFor("selector.component");
          HAS_PSEUDO_CLASS_TYPE = symbolFor("selector.has_pseudo_class");
          ROLE_TYPE = symbolFor("selector.role");
          TEST_NAME_TYPE = symbolFor("selector.test_id");
          TEXT_TYPE = symbolFor("selector.text");
        }
        var commitHooks = [], PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map, NoContext = 0, RenderContext = 2, CommitContext = 4, RootInProgress = 0, RootFatalErrored = 1, RootErrored = 2, RootSuspended = 3, RootSuspendedWithDelay = 4, RootSuspendedAtTheShell = 6, RootCompleted = 5, executionContext = NoContext, workInProgressRoot = null, workInProgress = null, workInProgressRootRenderLanes = 0, NotSuspended = 0, SuspendedOnError = 1, SuspendedOnData = 2, SuspendedOnImmediate = 3, SuspendedOnInstance = 4, SuspendedOnInstanceAndReadyToContinue = 5, SuspendedOnDeprecatedThrowPromise = 6, SuspendedAndReadyToContinue = 7, SuspendedOnHydration = 8, SuspendedOnAction = 9, workInProgressSuspendedReason = NotSuspended, workInProgressThrownValue = null, workInProgressRootDidSkipSuspendedSiblings = false, workInProgressRootIsPrerendering = false, workInProgressRootDidAttachPingListener = false, entangledRenderLanes = 0, workInProgressRootExitStatus = RootInProgress, workInProgressRootSkippedLanes = 0, workInProgressRootInterleavedUpdatedLanes = 0, workInProgressRootPingedLanes = 0, workInProgressDeferredLane = 0, workInProgressSuspendedRetryLanes = 0, workInProgressRootConcurrentErrors = null, workInProgressRootRecoverableErrors = null, workInProgressRootDidIncludeRecursiveRenderUpdate = false, globalMostRecentFallbackTime = 0, globalMostRecentTransitionTime = 0, FALLBACK_THROTTLE_MS = 300, workInProgressRootRenderTargetTime = Infinity, RENDER_TIMEOUT_MS = 500, workInProgressTransitions = null, workInProgressUpdateTask = null, legacyErrorBoundariesThatAlreadyFailed = null, IMMEDIATE_COMMIT = 0, ABORTED_VIEW_TRANSITION_COMMIT = 1, DELAYED_PASSIVE_COMMIT = 2, ANIMATION_STARTED_COMMIT = 3, NO_PENDING_EFFECTS = 0, PENDING_MUTATION_PHASE = 1, PENDING_LAYOUT_PHASE = 2, PENDING_AFTER_MUTATION_PHASE = 3, PENDING_SPAWNED_WORK = 4, PENDING_PASSIVE_PHASE = 5, pendingEffectsStatus = 0, pendingEffectsRoot = null, pendingFinishedWork = null, pendingEffectsLanes = 0, pendingEffectsRemainingLanes = 0, pendingEffectsRenderEndTime = -0, pendingPassiveTransitions = null, pendingRecoverableErrors = null, pendingViewTransition = null, pendingViewTransitionEvents = null, pendingTransitionTypes = null, pendingSuspendedCommitReason = null, pendingDelayedCommitReason = IMMEDIATE_COMMIT, pendingSuspendedViewTransitionReason = null, NESTED_UPDATE_LIMIT = 50, nestedUpdateCount = 0, rootWithNestedUpdates = null, isFlushingPassiveEffects = false, didScheduleUpdateDuringPassiveEffects = false, NESTED_PASSIVE_UPDATE_LIMIT = 50, nestedPassiveUpdateCount = 0, rootWithPassiveNestedUpdates = null, isRunningInsertionEffect = false, didWarnAboutInterruptedViewTransitions = false, didWarnStateUpdateForNotYetMountedComponent = null, didWarnAboutUpdateInRender = false;
        var didWarnAboutUpdateInRenderForAnotherComponent = /* @__PURE__ */ new Set();
        var fakeActCallbackNode = {}, resolveFamily = null, failedBoundaries = null;
        var hasBadMapPolyfill = false;
        try {
          var nonExtensibleObject = Object.preventExtensions({});
          /* @__PURE__ */ new Map([[nonExtensibleObject, null]]);
          /* @__PURE__ */ new Set([nonExtensibleObject]);
        } catch (e) {
          hasBadMapPolyfill = true;
        }
        var didWarnAboutNestedUpdates = false;
        var didWarnAboutFindNodeInStrictMode = {};
        var overrideHookState = null, overrideHookStateDeletePath = null, overrideHookStateRenamePath = null, overrideProps = null, overridePropsDeletePath = null, overridePropsRenamePath = null, scheduleUpdate = null, scheduleRetry = null, setErrorHandler = null, setSuspenseHandler = null;
        overrideHookState = function(fiber, id, path, value) {
          id = findHook(fiber, id);
          null !== id && (path = copyWithSetImpl(id.memoizedState, path, 0, value), id.memoizedState = path, id.baseState = path, fiber.memoizedProps = assign({}, fiber.memoizedProps), path = enqueueConcurrentRenderForLane(fiber, 2), null !== path && scheduleUpdateOnFiber(path, fiber, 2));
        };
        overrideHookStateDeletePath = function(fiber, id, path) {
          id = findHook(fiber, id);
          null !== id && (path = copyWithDeleteImpl(id.memoizedState, path, 0), id.memoizedState = path, id.baseState = path, fiber.memoizedProps = assign({}, fiber.memoizedProps), path = enqueueConcurrentRenderForLane(fiber, 2), null !== path && scheduleUpdateOnFiber(path, fiber, 2));
        };
        overrideHookStateRenamePath = function(fiber, id, oldPath, newPath) {
          id = findHook(fiber, id);
          null !== id && (oldPath = copyWithRename(id.memoizedState, oldPath, newPath), id.memoizedState = oldPath, id.baseState = oldPath, fiber.memoizedProps = assign({}, fiber.memoizedProps), oldPath = enqueueConcurrentRenderForLane(fiber, 2), null !== oldPath && scheduleUpdateOnFiber(oldPath, fiber, 2));
        };
        overrideProps = function(fiber, path, value) {
          fiber.pendingProps = copyWithSetImpl(fiber.memoizedProps, path, 0, value);
          fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
          path = enqueueConcurrentRenderForLane(fiber, 2);
          null !== path && scheduleUpdateOnFiber(path, fiber, 2);
        };
        overridePropsDeletePath = function(fiber, path) {
          fiber.pendingProps = copyWithDeleteImpl(fiber.memoizedProps, path, 0);
          fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
          path = enqueueConcurrentRenderForLane(fiber, 2);
          null !== path && scheduleUpdateOnFiber(path, fiber, 2);
        };
        overridePropsRenamePath = function(fiber, oldPath, newPath) {
          fiber.pendingProps = copyWithRename(
            fiber.memoizedProps,
            oldPath,
            newPath
          );
          fiber.alternate && (fiber.alternate.pendingProps = fiber.pendingProps);
          oldPath = enqueueConcurrentRenderForLane(fiber, 2);
          null !== oldPath && scheduleUpdateOnFiber(oldPath, fiber, 2);
        };
        scheduleUpdate = function(fiber) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 2);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2);
        };
        scheduleRetry = function(fiber) {
          var lane = claimNextRetryLane(), root2 = enqueueConcurrentRenderForLane(fiber, lane);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, lane);
        };
        setErrorHandler = function(newShouldErrorImpl) {
          shouldErrorImpl = newShouldErrorImpl;
        };
        setSuspenseHandler = function(newShouldSuspendImpl) {
          shouldSuspendImpl = newShouldSuspendImpl;
        };
        exports2.attemptContinuousHydration = function(fiber) {
          if (13 === fiber.tag || 31 === fiber.tag) {
            var root2 = enqueueConcurrentRenderForLane(fiber, 67108864);
            null !== root2 && scheduleUpdateOnFiber(root2, fiber, 67108864);
            markRetryLaneIfNotHydrated(fiber, 67108864);
          }
        };
        exports2.attemptHydrationAtCurrentPriority = function(fiber) {
          if (13 === fiber.tag || 31 === fiber.tag) {
            var lane = requestUpdateLane(fiber);
            lane = getBumpedLaneForHydrationByLane(lane);
            var root2 = enqueueConcurrentRenderForLane(fiber, lane);
            null !== root2 && scheduleUpdateOnFiber(root2, fiber, lane);
            markRetryLaneIfNotHydrated(fiber, lane);
          }
        };
        exports2.attemptSynchronousHydration = function(fiber) {
          switch (fiber.tag) {
            case 3:
              fiber = fiber.stateNode;
              if (fiber.current.memoizedState.isDehydrated) {
                var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                if (0 !== lanes) {
                  fiber.pendingLanes |= 2;
                  for (fiber.entangledLanes |= 2; lanes; ) {
                    var lane = 1 << 31 - clz32(lanes);
                    fiber.entanglements[1] |= lane;
                    lanes &= ~lane;
                  }
                  ensureRootIsScheduled(fiber);
                  (executionContext & (RenderContext | CommitContext)) === NoContext && (workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS, flushSyncWorkAcrossRoots_impl(0, false));
                }
              }
              break;
            case 31:
            case 13:
              lanes = enqueueConcurrentRenderForLane(fiber, 2), null !== lanes && scheduleUpdateOnFiber(lanes, fiber, 2), flushSyncWork(), markRetryLaneIfNotHydrated(fiber, 2);
          }
        };
        exports2.batchedUpdates = function(fn, a) {
          return fn(a);
        };
        exports2.createComponentSelector = function(component) {
          return { $$typeof: COMPONENT_TYPE, value: component };
        };
        exports2.createContainer = function(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
          return createFiberRoot(
            containerInfo,
            tag,
            false,
            null,
            hydrationCallbacks,
            isStrictMode,
            identifierPrefix,
            null,
            onUncaughtError,
            onCaughtError,
            onRecoverableError,
            onDefaultTransitionIndicator
          );
        };
        exports2.createHasPseudoClassSelector = function(selectors) {
          return { $$typeof: HAS_PSEUDO_CLASS_TYPE, value: selectors };
        };
        exports2.createHydrationContainer = function(initialChildren, callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, transitionCallbacks, formState) {
          initialChildren = createFiberRoot(
            containerInfo,
            tag,
            true,
            initialChildren,
            hydrationCallbacks,
            isStrictMode,
            identifierPrefix,
            formState,
            onUncaughtError,
            onCaughtError,
            onRecoverableError,
            onDefaultTransitionIndicator
          );
          initialChildren.context = getContextForSubtree(null);
          containerInfo = initialChildren.current;
          tag = requestUpdateLane(containerInfo);
          tag = getBumpedLaneForHydrationByLane(tag);
          hydrationCallbacks = createUpdate(tag);
          hydrationCallbacks.callback = void 0 !== callback && null !== callback ? callback : null;
          enqueueUpdate(containerInfo, hydrationCallbacks, tag);
          startUpdateTimerByLane(tag, "hydrateRoot()", null);
          callback = tag;
          initialChildren.current.lanes = callback;
          markRootUpdated$1(initialChildren, callback);
          ensureRootIsScheduled(initialChildren);
          return initialChildren;
        };
        exports2.createPortal = function(children, containerInfo, implementation) {
          var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
          if (null == key) key = null;
          else if (key === REACT_OPTIMISTIC_KEY) key = REACT_OPTIMISTIC_KEY;
          else {
            try {
              testStringCoercion(key);
              var JSCompiler_inline_result = false;
            } catch (e$6) {
              JSCompiler_inline_result = true;
            }
            JSCompiler_inline_result && (console.error(
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"
            ), testStringCoercion(key));
            key = "" + key;
          }
          return {
            $$typeof: REACT_PORTAL_TYPE,
            key,
            children,
            containerInfo,
            implementation
          };
        };
        exports2.createRoleSelector = function(role) {
          return { $$typeof: ROLE_TYPE, value: role };
        };
        exports2.createTestNameSelector = function(id) {
          return { $$typeof: TEST_NAME_TYPE, value: id };
        };
        exports2.createTextSelector = function(text) {
          return { $$typeof: TEXT_TYPE, value: text };
        };
        exports2.defaultOnCaughtError = function(error) {
          var componentNameMessage = componentName ? "The above error occurred in the <" + componentName + "> component." : "The above error occurred in one of your React components.", recreateMessage = "React will try to recreate this component tree from scratch using the error boundary you provided, " + ((errorBoundaryName || "Anonymous") + ".");
          "object" === typeof error && null !== error && "string" === typeof error.environmentName ? bindToConsole(
            "error",
            ["%o\n\n%s\n\n%s\n", error, componentNameMessage, recreateMessage],
            error.environmentName
          )() : console.error(
            "%o\n\n%s\n\n%s\n",
            error,
            componentNameMessage,
            recreateMessage
          );
        };
        exports2.defaultOnRecoverableError = function(error) {
          reportGlobalError(error);
        };
        exports2.defaultOnUncaughtError = function(error) {
          reportGlobalError(error);
          console.warn(
            "%s\n\n%s\n",
            componentName ? "An error occurred in the <" + componentName + "> component." : "An error occurred in one of your React components.",
            "Consider adding an error boundary to your tree to customize error handling behavior.\nVisit https://react.dev/link/error-boundaries to learn more about error boundaries."
          );
        };
        exports2.deferredUpdates = function(fn) {
          var prevTransition = ReactSharedInternals.T, previousPriority = getCurrentUpdatePriority();
          try {
            return setCurrentUpdatePriority(32), ReactSharedInternals.T = null, fn();
          } finally {
            setCurrentUpdatePriority(previousPriority), ReactSharedInternals.T = prevTransition;
          }
        };
        exports2.discreteUpdates = function(fn, a, b, c, d) {
          var prevTransition = ReactSharedInternals.T, previousPriority = getCurrentUpdatePriority();
          try {
            return setCurrentUpdatePriority(2), ReactSharedInternals.T = null, fn(a, b, c, d);
          } finally {
            setCurrentUpdatePriority(previousPriority), ReactSharedInternals.T = prevTransition, executionContext === NoContext && (workInProgressRootRenderTargetTime = now$1() + RENDER_TIMEOUT_MS);
          }
        };
        exports2.findAllNodes = findAllNodes;
        exports2.findBoundingRects = function(hostRoot, selectors) {
          if (!supportsTestSelectors)
            throw Error("Test selector API is not supported by this renderer.");
          selectors = findAllNodes(hostRoot, selectors);
          hostRoot = [];
          for (var i = 0; i < selectors.length; i++)
            hostRoot.push(getBoundingRect(selectors[i]));
          for (selectors = hostRoot.length - 1; 0 < selectors; selectors--) {
            i = hostRoot[selectors];
            for (var targetLeft = i.x, targetRight = targetLeft + i.width, targetTop = i.y, targetBottom = targetTop + i.height, j = selectors - 1; 0 <= j; j--)
              if (selectors !== j) {
                var otherRect = hostRoot[j], otherLeft = otherRect.x, otherRight = otherLeft + otherRect.width, otherTop = otherRect.y, otherBottom = otherTop + otherRect.height;
                if (targetLeft >= otherLeft && targetTop >= otherTop && targetRight <= otherRight && targetBottom <= otherBottom) {
                  hostRoot.splice(selectors, 1);
                  break;
                } else if (!(targetLeft !== otherLeft || i.width !== otherRect.width || otherBottom < targetTop || otherTop > targetBottom)) {
                  otherTop > targetTop && (otherRect.height += otherTop - targetTop, otherRect.y = targetTop);
                  otherBottom < targetBottom && (otherRect.height = targetBottom - otherTop);
                  hostRoot.splice(selectors, 1);
                  break;
                } else if (!(targetTop !== otherTop || i.height !== otherRect.height || otherRight < targetLeft || otherLeft > targetRight)) {
                  otherLeft > targetLeft && (otherRect.width += otherLeft - targetLeft, otherRect.x = targetLeft);
                  otherRight < targetRight && (otherRect.width = targetRight - otherLeft);
                  hostRoot.splice(selectors, 1);
                  break;
                }
              }
          }
          return hostRoot;
        };
        exports2.findHostInstance = function(component) {
          var fiber = component._reactInternals;
          if (void 0 === fiber) {
            if ("function" === typeof component.render)
              throw Error("Unable to find node on an unmounted component.");
            component = Object.keys(component).join(",");
            throw Error(
              "Argument appears to not be a ReactComponent. Keys: " + component
            );
          }
          component = findCurrentHostFiber(fiber);
          return null === component ? null : getPublicInstance(component.stateNode);
        };
        exports2.findHostInstanceWithNoPortals = function(fiber) {
          fiber = findCurrentFiberUsingSlowPath(fiber);
          fiber = null !== fiber ? findCurrentHostFiberWithNoPortalsImpl(fiber) : null;
          return null === fiber ? null : getPublicInstance(fiber.stateNode);
        };
        exports2.findHostInstanceWithWarning = function(component, methodName) {
          var fiber = component._reactInternals;
          if (void 0 === fiber) {
            if ("function" === typeof component.render)
              throw Error("Unable to find node on an unmounted component.");
            component = Object.keys(component).join(",");
            throw Error(
              "Argument appears to not be a ReactComponent. Keys: " + component
            );
          }
          component = findCurrentHostFiber(fiber);
          if (null === component) return null;
          if (component.mode & 8) {
            var componentName2 = getComponentNameFromFiber(fiber) || "Component";
            didWarnAboutFindNodeInStrictMode[componentName2] || (didWarnAboutFindNodeInStrictMode[componentName2] = true, runWithFiberInDEV(component, function() {
              fiber.mode & 8 ? console.error(
                "%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://react.dev/link/strict-mode-find-node",
                methodName,
                methodName,
                componentName2
              ) : console.error(
                "%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://react.dev/link/strict-mode-find-node",
                methodName,
                methodName,
                componentName2
              );
            }));
          }
          return getPublicInstance(component.stateNode);
        };
        exports2.flushPassiveEffects = flushPendingEffects;
        exports2.flushSyncFromReconciler = function(fn) {
          var prevExecutionContext = executionContext;
          executionContext |= 1;
          var prevTransition = ReactSharedInternals.T, previousPriority = getCurrentUpdatePriority();
          try {
            if (setCurrentUpdatePriority(2), ReactSharedInternals.T = null, fn)
              return fn();
          } finally {
            setCurrentUpdatePriority(previousPriority), ReactSharedInternals.T = prevTransition, executionContext = prevExecutionContext, (executionContext & (RenderContext | CommitContext)) === NoContext && flushSyncWorkAcrossRoots_impl(0, false);
          }
        };
        exports2.flushSyncWork = flushSyncWork;
        exports2.focusWithin = function(hostRoot, selectors) {
          if (!supportsTestSelectors)
            throw Error("Test selector API is not supported by this renderer.");
          hostRoot = findFiberRootForHostRoot(hostRoot);
          selectors = findPaths(hostRoot, selectors);
          selectors = Array.from(selectors);
          for (hostRoot = 0; hostRoot < selectors.length; ) {
            var fiber = selectors[hostRoot++], tag = fiber.tag;
            if (!isHiddenSubtree(fiber)) {
              if ((5 === tag || 26 === tag || 27 === tag) && setFocusIfFocusable(fiber.stateNode))
                return true;
              for (fiber = fiber.child; null !== fiber; )
                selectors.push(fiber), fiber = fiber.sibling;
            }
          }
          return false;
        };
        exports2.getFindAllNodesFailureDescription = function(hostRoot, selectors) {
          if (!supportsTestSelectors)
            throw Error("Test selector API is not supported by this renderer.");
          var maxSelectorIndex = 0, matchedNames = [];
          hostRoot = [findFiberRootForHostRoot(hostRoot), 0];
          for (var index = 0; index < hostRoot.length; ) {
            var fiber = hostRoot[index++], tag = fiber.tag, selectorIndex = hostRoot[index++], selector = selectors[selectorIndex];
            if (5 !== tag && 26 !== tag && 27 !== tag || !isHiddenSubtree(fiber)) {
              if (matchSelector(fiber, selector) && (matchedNames.push(selectorToString(selector)), selectorIndex++, selectorIndex > maxSelectorIndex && (maxSelectorIndex = selectorIndex)), selectorIndex < selectors.length)
                for (fiber = fiber.child; null !== fiber; )
                  hostRoot.push(fiber, selectorIndex), fiber = fiber.sibling;
            }
          }
          if (maxSelectorIndex < selectors.length) {
            for (hostRoot = []; maxSelectorIndex < selectors.length; maxSelectorIndex++)
              hostRoot.push(selectorToString(selectors[maxSelectorIndex]));
            return "findAllNodes was able to match part of the selector:\n  " + (matchedNames.join(" > ") + "\n\nNo matching component was found for:\n  ") + hostRoot.join(" > ");
          }
          return null;
        };
        exports2.getPublicRootInstance = function(container) {
          container = container.current;
          if (!container.child) return null;
          switch (container.child.tag) {
            case 27:
            case 5:
              return getPublicInstance(container.child.stateNode);
            default:
              return container.child.stateNode;
          }
        };
        exports2.injectIntoDevTools = function() {
          var internals = {
            bundleType: 1,
            version: rendererVersion,
            rendererPackageName,
            currentDispatcherRef: ReactSharedInternals,
            reconcilerVersion: "19.3.0"
          };
          null !== extraDevToolsConfig && (internals.rendererConfig = extraDevToolsConfig);
          internals.overrideHookState = overrideHookState;
          internals.overrideHookStateDeletePath = overrideHookStateDeletePath;
          internals.overrideHookStateRenamePath = overrideHookStateRenamePath;
          internals.overrideProps = overrideProps;
          internals.overridePropsDeletePath = overridePropsDeletePath;
          internals.overridePropsRenamePath = overridePropsRenamePath;
          internals.scheduleUpdate = scheduleUpdate;
          internals.scheduleRetry = scheduleRetry;
          internals.setErrorHandler = setErrorHandler;
          internals.setSuspenseHandler = setSuspenseHandler;
          internals.scheduleRefresh = scheduleRefresh;
          internals.scheduleRoot = scheduleRoot;
          internals.setRefreshHandler = setRefreshHandler;
          internals.getCurrentFiber = getCurrentFiberForDevTools;
          return injectInternals(internals);
        };
        exports2.isAlreadyRendering = isAlreadyRendering;
        exports2.observeVisibleRects = function(hostRoot, selectors, callback, options) {
          function commitHook() {
            var nextInstanceRoots = findAllNodes(hostRoot, selectors);
            instanceRoots.forEach(function(target) {
              0 > nextInstanceRoots.indexOf(target) && unobserve(target);
            });
            nextInstanceRoots.forEach(function(target) {
              0 > instanceRoots.indexOf(target) && observe(target);
            });
          }
          if (!supportsTestSelectors)
            throw Error("Test selector API is not supported by this renderer.");
          var instanceRoots = findAllNodes(hostRoot, selectors);
          callback = setupIntersectionObserver(instanceRoots, callback, options);
          var disconnect = callback.disconnect, observe = callback.observe, unobserve = callback.unobserve;
          commitHooks.push(commitHook);
          return {
            disconnect: function() {
              var index = commitHooks.indexOf(commitHook);
              0 <= index && commitHooks.splice(index, 1);
              disconnect();
            }
          };
        };
        exports2.shouldError = function(fiber) {
          return shouldErrorImpl(fiber);
        };
        exports2.shouldSuspend = function(fiber) {
          return shouldSuspendImpl(fiber);
        };
        exports2.startHostTransition = function(formFiber, pendingState, action, formData) {
          if (5 !== formFiber.tag)
            throw Error(
              "Expected the form instance to be a HostComponent. This is a bug in React."
            );
          var queue = ensureFormComponentIsStateful(formFiber).queue;
          startHostActionTimer(formFiber);
          startTransition(
            formFiber,
            queue,
            pendingState,
            NotPendingTransition,
            null === action ? noop : function() {
              null === ReactSharedInternals.T && console.error(
                "requestFormReset was called outside a transition or action. To fix, move to an action, or wrap with startTransition."
              );
              var stateHook = ensureFormComponentIsStateful(formFiber);
              null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
              dispatchSetStateInternal(
                formFiber,
                stateHook.next.queue,
                {},
                requestUpdateLane(formFiber)
              );
              return action(formData);
            }
          );
        };
        exports2.updateContainer = function(element, container, parentComponent, callback) {
          var current2 = container.current, lane = requestUpdateLane(current2);
          updateContainerImpl(
            current2,
            lane,
            element,
            container,
            parentComponent,
            callback
          );
          return lane;
        };
        exports2.updateContainerSync = updateContainerSync;
        return exports2;
      }, module.exports.default = module.exports, Object.defineProperty(module.exports, "__esModule", { value: true });
    }
  });

  // node_modules/react-reconciler/index.js
  var require_react_reconciler = __commonJS({
    "node_modules/react-reconciler/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_reconciler_development();
      }
    }
  });

  // node_modules/react-reconciler/cjs/react-reconciler-constants.development.js
  var require_react_reconciler_constants_development = __commonJS({
    "node_modules/react-reconciler/cjs/react-reconciler-constants.development.js"(exports) {
      "use strict";
      exports.ConcurrentRoot = 1, exports.ContinuousEventPriority = 8, exports.DefaultEventPriority = 32, exports.DiscreteEventPriority = 2, exports.IdleEventPriority = 268435456, exports.LegacyRoot = 0, exports.NoEventPriority = 0;
    }
  });

  // node_modules/react-reconciler/constants.js
  var require_constants = __commonJS({
    "node_modules/react-reconciler/constants.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_reconciler_constants_development();
      }
    }
  });

  // js/web/events.ts
  var DOMException = class extends Error {
    constructor(message = "", name = "Error") {
      super(message);
      this.name = name;
    }
  };
  var Event = class {
    constructor(type, init = {}) {
      this.timeStamp = performance.now();
      this.defaultPrevented = false;
      this.target = null;
      this.currentTarget = null;
      /** @internal */
      this._stopped = false;
      if (arguments.length === 0) throw new TypeError("Event constructor: 1 argument required");
      this.type = String(type);
      this.bubbles = !!init.bubbles;
      this.cancelable = !!init.cancelable;
      this.composed = !!init.composed;
    }
    preventDefault() {
      if (this.cancelable) this.defaultPrevented = true;
    }
    stopPropagation() {
    }
    stopImmediatePropagation() {
      this._stopped = true;
    }
  };
  var CustomEvent = class extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.detail = init.detail;
    }
  };
  var listeners = /* @__PURE__ */ Symbol("listeners");
  var _a;
  _a = listeners;
  var EventTarget = class {
    constructor() {
      this[_a] = /* @__PURE__ */ new Map();
    }
    addEventListener(type, listener, options) {
      if (!listener) return;
      const opts = typeof options === "boolean" ? {
        capture: options
      } : options ?? {};
      if (opts.signal?.aborted) return;
      const capture = !!opts.capture;
      const list = this[listeners].get(type) ?? [];
      if (list.some((e) => e.listener === listener && e.capture === capture)) return;
      list.push({
        listener,
        once: !!opts.once,
        capture
      });
      this[listeners].set(type, list);
      opts.signal?.addEventListener("abort", () => this.removeEventListener(type, listener, {
        capture
      }));
    }
    removeEventListener(type, listener, options) {
      const capture = typeof options === "boolean" ? options : !!options?.capture;
      const list = this[listeners].get(type);
      if (!list) return;
      const index = list.findIndex((e) => e.listener === listener && e.capture === capture);
      if (index >= 0) list.splice(index, 1);
    }
    dispatchEvent(event) {
      event.target ?? (event.target = this);
      event.currentTarget = this;
      for (const entry of [...this[listeners].get(event.type) ?? []]) {
        if (entry.once) this.removeEventListener(event.type, entry.listener, {
          capture: entry.capture
        });
        try {
          if (typeof entry.listener === "function") entry.listener.call(this, event);
          else entry.listener.handleEvent(event);
        } catch (error) {
          reportError2(error);
        }
        if (event._stopped) break;
      }
      const handler = this["on" + event.type];
      if (typeof handler === "function") handler.call(this, event);
      event.currentTarget = null;
      return !event.defaultPrevented;
    }
  };
  function reportError2(error) {
    console.error(error instanceof Error ? `${error.message}
${error.stack}` : String(error));
  }
  var AbortSignal = class _AbortSignal extends EventTarget {
    constructor() {
      super(...arguments);
      this.aborted = false;
      this.reason = void 0;
      this.onabort = null;
    }
    throwIfAborted() {
      if (this.aborted) throw this.reason;
    }
    /** @internal */
    _abort(reason) {
      if (this.aborted) return;
      this.aborted = true;
      this.reason = reason === void 0 ? new DOMException("This operation was aborted", "AbortError") : reason;
      this.dispatchEvent(new Event("abort"));
    }
    static abort(reason) {
      const signal = new _AbortSignal();
      signal._abort(reason);
      return signal;
    }
    static timeout(ms) {
      const signal = new _AbortSignal();
      setTimeout(() => signal._abort(new DOMException("The operation timed out.", "TimeoutError")), ms);
      return signal;
    }
    static any(signals) {
      const signal = new _AbortSignal();
      for (const s of signals) {
        if (s.aborted) {
          signal._abort(s.reason);
          break;
        }
        s.addEventListener("abort", () => signal._abort(s.reason), {
          once: true
        });
      }
      return signal;
    }
  };
  var AbortController2 = class {
    constructor() {
      this.signal = new AbortSignal();
    }
    abort(reason) {
      this.signal._abort(reason);
    }
  };

  // js/web/encoding.ts
  var TextEncoder = class {
    constructor() {
      this.encoding = "utf-8";
    }
    encode(input = "") {
      return __web.encodeUTF8(String(input));
    }
    encodeInto(input, destination) {
      const bytes = this.encode(input);
      if (bytes.length <= destination.length) {
        destination.set(bytes);
        return {
          read: input.length,
          written: bytes.length
        };
      }
      let read = 0;
      let written = 0;
      for (const char of input) {
        const size = this.encode(char).length;
        if (written + size > destination.length) break;
        destination.set(this.encode(char), written);
        written += size;
        read += char.length;
      }
      return {
        read,
        written
      };
    }
  };
  var TextDecoder = class {
    constructor(label = "utf-8", options = {}) {
      this.encoding = "utf-8";
      const name = String(label).trim().toLowerCase();
      if (name !== "utf-8" && name !== "utf8" && name !== "unicode-1-1-utf-8") {
        throw new RangeError(`TextDecoder: only UTF-8 is supported, not "${label}"`);
      }
      this.fatal = !!options.fatal;
      this.ignoreBOM = !!options.ignoreBOM;
    }
    decode(input, _options) {
      if (input === void 0) return "";
      const bytes = input instanceof DataView ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : input;
      const text = __web.decodeUTF8(bytes, this.fatal);
      if (text === null) throw new TypeError("TextDecoder: the encoded data was not valid UTF-8");
      return !this.ignoreBOM && text.charCodeAt(0) === 65279 ? text.slice(1) : text;
    }
  };
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function btoa(data) {
    const s = String(data);
    let out = "";
    for (let i = 0; i < s.length; i += 3) {
      const a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2);
      if (a > 255 || b > 255 || c > 255) throw new DOMExceptionLike("The string contains characters outside of the Latin1 range.", "InvalidCharacterError");
      const n = a << 16 | (b || 0) << 8 | (c || 0);
      out += alphabet[n >> 18 & 63] + alphabet[n >> 12 & 63] + (i + 1 < s.length ? alphabet[n >> 6 & 63] : "=") + (i + 2 < s.length ? alphabet[n & 63] : "=");
    }
    return out;
  }
  function atob(data) {
    let s = String(data).replace(/[\t\n\f\r ]/g, "");
    if (s.length % 4 === 0) s = s.replace(/==?$/, "");
    if (s.length % 4 === 1 || /[^A-Za-z0-9+/]/.test(s)) {
      throw new DOMExceptionLike("The string to be decoded is not correctly encoded.", "InvalidCharacterError");
    }
    let out = "";
    let buffer = 0, bits = 0;
    for (const char of s) {
      buffer = buffer << 6 | alphabet.indexOf(char);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out += String.fromCharCode(buffer >> bits & 255);
      }
    }
    return out;
  }
  var DOMExceptionLike = class extends Error {
    constructor(message, name) {
      super(message);
      this.name = name;
    }
  };

  // js/web/url.ts
  var encode = (s) => encodeURIComponent(s).replace(/%20/g, "+").replace(/[!'()~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  var decode = (s) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
      return s;
    }
  };
  var URLSearchParams = class _URLSearchParams {
    constructor(init = "") {
      /** @internal */
      this._list = [];
      /** @internal */
      this._url = null;
      if (typeof init === "string") this._parse(init);
      else if (init instanceof _URLSearchParams) this._list = init._list.map(([k, v]) => [k, v]);
      else if (init && typeof init[Symbol.iterator] === "function") {
        for (const pair of init) {
          const [k, v] = [...pair];
          if (v === void 0) throw new TypeError("URLSearchParams: each pair needs a name and a value");
          this._list.push([String(k), String(v)]);
        }
      } else if (init && typeof init === "object") {
        for (const key of Object.keys(init)) this._list.push([key, String(init[key])]);
      }
    }
    /** @internal */
    _parse(query) {
      this._list = [];
      for (const part of query.replace(/^\?/, "").split("&")) {
        if (!part) continue;
        const eq = part.indexOf("=");
        this._list.push(eq < 0 ? [decode(part), ""] : [decode(part.slice(0, eq)), decode(part.slice(eq + 1))]);
      }
    }
    _changed() {
      if (this._url) this._url._setSearch(this.toString());
    }
    get size() {
      return this._list.length;
    }
    append(name, value) {
      this._list.push([String(name), String(value)]);
      this._changed();
    }
    delete(name, value) {
      this._list = this._list.filter(([k, v]) => k !== name || value !== void 0 && v !== String(value));
      this._changed();
    }
    get(name) {
      return this._list.find(([k]) => k === name)?.[1] ?? null;
    }
    getAll(name) {
      return this._list.filter(([k]) => k === name).map(([, v]) => v);
    }
    has(name, value) {
      return this._list.some(([k, v]) => k === name && (value === void 0 || v === String(value)));
    }
    set(name, value) {
      const index = this._list.findIndex(([k]) => k === name);
      if (index < 0) this._list.push([String(name), String(value)]);
      else {
        this._list[index] = [String(name), String(value)];
        this._list = this._list.filter(([k], i) => k !== name || i === index);
      }
      this._changed();
    }
    sort() {
      this._list.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      this._changed();
    }
    forEach(callback, thisArg) {
      for (const [k, v] of this._list) callback.call(thisArg, v, k, this);
    }
    *entries() {
      for (const [k, v] of this._list) yield [k, v];
    }
    *keys() {
      for (const [k] of this._list) yield k;
    }
    *values() {
      for (const [, v] of this._list) yield v;
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    toString() {
      return this._list.map(([k, v]) => encode(k) + "=" + encode(v)).join("&");
    }
  };
  var URL = class _URL {
    constructor(url, base) {
      this._params = new URLSearchParams();
      const parts = __web.parseURL(String(url), base === void 0 ? void 0 : String(base));
      if (!parts) throw new TypeError(`Invalid URL: ${String(url)}`);
      this._parts = parts;
      this._params._parse(parts.search);
      this._params._url = this;
    }
    static canParse(url, base) {
      return __web.parseURL(String(url), base === void 0 ? void 0 : String(base)) !== null;
    }
    static parse(url, base) {
      return _URL.canParse(url, base) ? new _URL(url, base) : null;
    }
    /** @internal */
    _setSearch(query) {
      this._parts.search = query ? "?" + query : "";
    }
    _reparse(href) {
      const parts = __web.parseURL(href);
      if (!parts) throw new TypeError(`Invalid URL: ${href}`);
      this._parts = parts;
      this._params._parse(parts.search);
    }
    get href() {
      const p = this._parts;
      const auth = p.username ? p.username + (p.password ? ":" + p.password : "") + "@" : "";
      const authority = p.special || p.hostname ? "//" + auth + this.host : "";
      return p.protocol + authority + p.pathname + p.search + p.hash;
    }
    set href(value) {
      this._reparse(value);
    }
    get origin() {
      return this._parts.special && this._parts.protocol !== "file:" ? this.protocol + "//" + this.host : "null";
    }
    get protocol() {
      return this._parts.protocol;
    }
    set protocol(value) {
      this._reparse(value.replace(/:?$/, ":") + this.href.slice(this.protocol.length));
    }
    get username() {
      return this._parts.username;
    }
    set username(value) {
      this._parts.username = encodeURIComponent(value);
    }
    get password() {
      return this._parts.password;
    }
    set password(value) {
      this._parts.password = encodeURIComponent(value);
    }
    get host() {
      return this._parts.hostname + (this._parts.port ? ":" + this._parts.port : "");
    }
    set host(value) {
      const [hostname, port = ""] = value.split(":");
      this._parts.hostname = hostname.toLowerCase();
      this._parts.port = port;
    }
    get hostname() {
      return this._parts.hostname;
    }
    set hostname(value) {
      this._parts.hostname = value.toLowerCase();
    }
    get port() {
      return this._parts.port;
    }
    set port(value) {
      this._parts.port = String(value);
    }
    get pathname() {
      return this._parts.pathname;
    }
    set pathname(value) {
      this._reparse(this.protocol + (this._parts.special || this.hostname ? "//" + this.host : "") + (value.startsWith("/") ? "" : "/") + value + this.search + this.hash);
    }
    get search() {
      return this._parts.search === "?" ? "" : this._parts.search;
    }
    set search(value) {
      const query = String(value).replace(/^\?/, "");
      this._parts.search = query ? "?" + query : "";
      this._params._parse(query);
    }
    get searchParams() {
      return this._params;
    }
    get hash() {
      return this._parts.hash === "#" ? "" : this._parts.hash;
    }
    set hash(value) {
      const fragment = String(value).replace(/^#/, "");
      this._parts.hash = fragment ? "#" + fragment : "";
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
  };

  // js/web/fetch.ts
  var Headers = class _Headers {
    constructor(init) {
      this._map = /* @__PURE__ */ new Map();
      if (init instanceof _Headers) init.forEach((v, k) => this.append(k, v));
      else if (init && typeof init[Symbol.iterator] === "function") {
        for (const [k, v] of init) this.append(k, v);
      } else if (init) for (const k of Object.keys(init)) this.append(k, init[k]);
    }
    append(name, value) {
      const key = name.toLowerCase();
      const existing = this._map.get(key);
      this._map.set(key, existing === void 0 ? String(value).trim() : `${existing}, ${String(value).trim()}`);
    }
    set(name, value) {
      this._map.set(name.toLowerCase(), String(value).trim());
    }
    get(name) {
      return this._map.get(name.toLowerCase()) ?? null;
    }
    getSetCookie() {
      return this.get("set-cookie")?.split(/,\s*(?=[^;,]+=)/) ?? [];
    }
    has(name) {
      return this._map.has(name.toLowerCase());
    }
    delete(name) {
      this._map.delete(name.toLowerCase());
    }
    forEach(callback, thisArg) {
      for (const [k, v] of this.entries()) callback.call(thisArg, v, k, this);
    }
    *entries() {
      yield* [...this._map.entries()].sort(([a], [b]) => a < b ? -1 : 1);
    }
    *keys() {
      for (const [k] of this.entries()) yield k;
    }
    *values() {
      for (const [, v] of this.entries()) yield v;
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
  var Blob = class _Blob {
    constructor(parts = [], options = {}) {
      const chunks = parts.map(toBytes);
      this._bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        this._bytes.set(chunk, offset);
        offset += chunk.length;
      }
      this.type = (options.type ?? "").toLowerCase();
    }
    get size() {
      return this._bytes.length;
    }
    async text() {
      return __web.decodeUTF8(this._bytes, false);
    }
    async arrayBuffer() {
      return this._bytes.slice().buffer;
    }
    async bytes() {
      return this._bytes.slice();
    }
    slice(start, end, type) {
      return new _Blob([this._bytes.slice(start, end)], {
        type
      });
    }
  };
  function toBytes(part) {
    if (typeof part === "string") return __web.encodeUTF8(part);
    if (part instanceof Blob) return part._bytes;
    if (part instanceof ArrayBuffer) return new Uint8Array(part);
    return new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
  }
  function extractBody(body) {
    if (body == null) return {
      data: null,
      type: null
    };
    if (typeof body === "string") return {
      data: body,
      type: "text/plain;charset=UTF-8"
    };
    if (body instanceof URLSearchParams) return {
      data: body.toString(),
      type: "application/x-www-form-urlencoded;charset=UTF-8"
    };
    if (body instanceof Blob) return {
      data: body._bytes,
      type: body.type || null
    };
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return {
      data: toBytes(body),
      type: null
    };
    const FormData = globalThis.FormData;
    if (FormData && body instanceof FormData) {
      throw new TypeError("fetch: FormData bodies aren't supported yet");
    }
    return {
      data: String(body),
      type: "text/plain;charset=UTF-8"
    };
  }
  var Body = class {
    constructor() {
      /** @internal */
      this._data = null;
      this.bodyUsed = false;
    }
    get body() {
      return null;
    }
    _consume() {
      if (this.bodyUsed) throw new TypeError("Body has already been consumed.");
      this.bodyUsed = true;
      return this._data;
    }
    async text() {
      const data = this._consume();
      return data === null ? "" : typeof data === "string" ? data : __web.decodeUTF8(data, false);
    }
    async json() {
      return JSON.parse(await this.text());
    }
    async bytes() {
      const data = this._consume();
      return data === null ? new Uint8Array() : typeof data === "string" ? __web.encodeUTF8(data) : data.slice();
    }
    async arrayBuffer() {
      return (await this.bytes()).buffer;
    }
    async blob() {
      return new Blob([await this.bytes()], {
        type: this.headers.get("content-type") ?? ""
      });
    }
    async formData() {
      throw new TypeError("formData() isn't supported yet");
    }
  };
  var Request = class _Request extends Body {
    constructor(input, init = {}) {
      super();
      const source = input instanceof _Request ? input : null;
      let url = source ? source.url : String(input);
      try {
        url = new globalThis.URL(url).href;
      } catch {
        throw new TypeError(`fetch: "${url}" isn't an absolute URL (there's no page to resolve it against)`);
      }
      this.url = url;
      this.method = (init.method ?? source?.method ?? "GET").toUpperCase();
      this.headers = new Headers(init.headers ?? source?.headers);
      this.signal = init.signal ?? source?.signal ?? new AbortSignal();
      const {
        data,
        type
      } = extractBody(init.body !== void 0 ? init.body : source?._data ?? null);
      if (data !== null && (this.method === "GET" || this.method === "HEAD")) {
        throw new TypeError("Request with GET/HEAD method cannot have body.");
      }
      this._data = data;
      if (type && !this.headers.has("content-type")) this.headers.set("content-type", type);
    }
    clone() {
      return new _Request(this);
    }
  };
  var Response = class _Response extends Body {
    constructor(body = null, init = {}) {
      super();
      this.type = "basic";
      this.url = "";
      this.redirected = false;
      this.status = init.status ?? 200;
      if (this.status < 200 || this.status > 599) throw new RangeError(`Invalid status ${this.status}`);
      this.statusText = init.statusText ?? "";
      this.headers = new Headers(init.headers);
      const {
        data,
        type
      } = extractBody(body);
      this._data = data;
      if (type && !this.headers.has("content-type")) this.headers.set("content-type", type);
    }
    get ok() {
      return this.status >= 200 && this.status < 300;
    }
    clone() {
      if (this.bodyUsed) throw new TypeError("Response.clone: Body has already been consumed.");
      const copy = new _Response(null, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
      copy._data = this._data;
      copy.url = this.url;
      copy.redirected = this.redirected;
      return copy;
    }
    static json(data, init = {}) {
      const headers = new Headers(init.headers);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      return new _Response(JSON.stringify(data), {
        ...init,
        headers
      });
    }
    static error() {
      const response = new _Response(null, {
        status: 200
      });
      response.type = "error";
      return response;
    }
    static redirect(url, status = 302) {
      return new _Response(null, {
        status,
        headers: {
          location: String(url)
        }
      });
    }
  };
  var nextFetch = 1;
  var pending = /* @__PURE__ */ new Map();
  function fetch(input, init) {
    return new Promise((resolve, reject) => {
      const request = new Request(input, init);
      const {
        signal
      } = request;
      if (signal.aborted) return reject(signal.reason);
      const id = nextFetch++;
      pending.set(id, {
        resolve,
        reject,
        signal
      });
      signal.addEventListener("abort", () => __web.abort(id), {
        once: true
      });
      const body = request._data;
      __web.fetch(id, {
        method: request.method,
        url: request.url,
        headers: [...request.headers.entries()],
        ...body === null ? {} : {
          body
        }
      });
    });
  }
  globalThis.__swiftjsx_fetchDone = (id, error, info, body) => {
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    if (error) {
      request.reject(error.name === "AbortError" ? request.signal.reason ?? new DOMException(error.message, "AbortError") : new TypeError(error.message));
      return;
    }
    const response = new Response(null, {
      status: info.status,
      statusText: info.statusText,
      headers: info.headers
    });
    response._data = new Uint8Array(body);
    response.url = info.url;
    response.redirected = info.redirected;
    request.resolve(response);
  };

  // js/web/index.ts
  var g = globalThis;
  var integerArrays = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array];
  var crypto = {
    getRandomValues(array) {
      if (!integerArrays.some((type) => array instanceof type)) {
        throw new DOMException("getRandomValues: the array must be an integer typed array", "TypeMismatchError");
      }
      if (array.byteLength > 65536) throw new DOMException("getRandomValues: more than 65536 bytes", "QuotaExceededError");
      __web.randomFill(array);
      return array;
    },
    randomUUID() {
      return __web.randomUUID();
    }
  };
  var Storage = class {
    constructor(backing) {
      this.backing = backing;
    }
    getItem(key) {
      return this.backing.get(String(key));
    }
    setItem(key, value) {
      this.backing.set(String(key), String(value));
    }
    removeItem(key) {
      this.backing.remove(String(key));
    }
    clear() {
      this.backing.clear();
    }
    key(index) {
      return this.backing.keys()[index] ?? null;
    }
    get length() {
      return this.backing.keys().length;
    }
  };
  var localStorage = new Storage({
    get: (k) => __web.storage("get", k),
    set: (k, v) => __web.storage("set", k, v),
    remove: (k) => __web.storage("remove", k),
    clear: () => __web.storage("clear"),
    keys: () => __web.storage("keys")
  });
  var session = /* @__PURE__ */ new Map();
  var sessionStorage = new Storage({
    get: (k) => session.get(k) ?? null,
    set: (k, v) => void session.set(k, v),
    remove: (k) => void session.delete(k),
    clear: () => session.clear(),
    keys: () => [...session.keys()]
  });
  function structuredClone(value, seen = /* @__PURE__ */ new Map()) {
    if (value === null || typeof value !== "object") {
      if (typeof value === "function" || typeof value === "symbol") {
        throw new DOMException(`${String(value)} could not be cloned.`, "DataCloneError");
      }
      return value;
    }
    if (seen.has(value)) return seen.get(value);
    const v = value;
    let copy;
    if (v instanceof Date) copy = new Date(v.getTime());
    else if (v instanceof RegExp) copy = new RegExp(v.source, v.flags);
    else if (v instanceof ArrayBuffer) copy = v.slice(0);
    else if (ArrayBuffer.isView(v)) {
      const buffer = structuredClone(v.buffer, seen);
      copy = v instanceof DataView ? new DataView(buffer, v.byteOffset, v.byteLength) : new v.constructor(buffer, v.byteOffset, v.length);
    } else if (v instanceof Map) {
      copy = /* @__PURE__ */ new Map();
      seen.set(value, copy);
      v.forEach((val, key) => copy.set(structuredClone(key, seen), structuredClone(val, seen)));
      return copy;
    } else if (v instanceof Set) {
      copy = /* @__PURE__ */ new Set();
      seen.set(value, copy);
      v.forEach((val) => copy.add(structuredClone(val, seen)));
      return copy;
    } else if (v instanceof Error) {
      copy = new v.constructor(v.message);
      copy.stack = v.stack;
    } else if (Array.isArray(v)) {
      copy = [];
      seen.set(value, copy);
      v.forEach((item, i) => copy[i] = structuredClone(item, seen));
      return copy;
    } else {
      copy = {};
      seen.set(value, copy);
      for (const key of Object.keys(v)) copy[key] = structuredClone(v[key], seen);
      return copy;
    }
    seen.set(value, copy);
    return copy;
  }
  var globals = {
    Event,
    CustomEvent,
    EventTarget,
    DOMException,
    AbortController: AbortController2,
    AbortSignal,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    URL,
    URLSearchParams,
    fetch,
    Headers,
    Request,
    Response,
    Blob,
    crypto,
    localStorage,
    sessionStorage,
    structuredClone: (value) => structuredClone(value),
    navigator: {
      userAgent: __web.userAgent,
      language: __web.languages[0] ?? "en-US",
      languages: __web.languages,
      onLine: true,
      product: "SwiftJSX"
    },
    // Many packages read process.env.* (esbuild replaces NODE_ENV in app code).
    process: {
      env: {
        NODE_ENV: "development"
      },
      browser: true,
      nextTick: (fn, ...args) => queueMicrotask(() => fn(...args))
    }
  };
  for (const name of Object.keys(globals)) {
    if (g[name] === void 0) g[name] = globals[name];
  }
  g.window = g.self = g.global = g;
  var windowEvents = new EventTarget();
  g.addEventListener = windowEvents.addEventListener.bind(windowEvents);
  g.removeEventListener = windowEvents.removeEventListener.bind(windowEvents);
  g.dispatchEvent = windowEvents.dispatchEvent.bind(windowEvents);
  g.__swiftjsx_windowEvent = (type) => {
    if (type === "online" || type === "offline") g.navigator.onLine = type === "online";
    windowEvents.dispatchEvent(new Event(type));
  };

  // js/refresh-setup.ts
  var RefreshRuntime = __toESM(require_runtime(), 1);
  RefreshRuntime.injectIntoGlobalHook(globalThis);
  globalThis.__swiftjsx_refresh = {
    register: RefreshRuntime.register,
    signature: RefreshRuntime.createSignatureFunctionForTransform
  };
  globalThis.__swiftjsx_hotUpdate = () => {
    RefreshRuntime.performReactRefresh();
  };

  // js/runtime-entry.ts
  var React = __toESM(require_react(), 1);
  var JSXRuntime = __toESM(require_jsx_runtime(), 1);
  var JSXDevRuntime = __toESM(require_jsx_dev_runtime(), 1);
  var CompilerRuntime = __toESM(require_compiler_runtime(), 1);

  // js/index.ts
  var index_exports = {};
  __export(index_exports, {
    Alert: () => Alert,
    Button: () => Button,
    ConfirmationDialog: () => ConfirmationDialog,
    Divider: () => Divider,
    Form: () => Form,
    HStack: () => HStack,
    HostInstance: () => HostInstance,
    Image: () => Image,
    Label: () => Label,
    LazyHStack: () => LazyHStack,
    LazyVGrid: () => LazyVGrid,
    LazyVStack: () => LazyVStack,
    List: () => List,
    NavigationPage: () => NavigationPage,
    NavigationSplitView: () => NavigationSplitView,
    NavigationSplitViewHost: () => NavigationSplitViewHost,
    NavigationStack: () => NavigationStack,
    Navigator: () => Navigator,
    Picker: () => Picker,
    ProgressView: () => ProgressView,
    Screen: () => Screen,
    ScrollView: () => ScrollView,
    Section: () => Section,
    Sheet: () => Sheet,
    Slider: () => Slider,
    Spacer: () => Spacer,
    SplitColumn: () => SplitColumn,
    Stepper: () => Stepper,
    Tab: () => Tab,
    TabView: () => TabView,
    Text: () => Text,
    TextField: () => TextField,
    Toggle: () => Toggle,
    ToolbarItem: () => ToolbarItem,
    VStack: () => VStack,
    VirtualList: () => VirtualList,
    ZStack: () => ZStack,
    isNativeAvailable: () => isNativeAvailable,
    makeMutable: () => makeMutable,
    native: () => native,
    onMain: () => onMain,
    openURL: () => openURL,
    render: () => render,
    runOnJS: () => runOnJS,
    useAnimatedStyle: () => useAnimatedStyle,
    useNativeValue: () => useNativeValue,
    useNavigation: () => useNavigation,
    useSharedValue: () => useSharedValue,
    withAnimation: () => withAnimation,
    withSpring: () => withSpring,
    withTiming: () => withTiming
  });

  // js/renderer.ts
  var import_react_reconciler = __toESM(require_react_reconciler(), 1);
  var import_constants = __toESM(require_constants(), 1);
  var import_react2 = __toESM(require_react(), 1);

  // js/worklets.ts
  var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  var import_react = __toESM(require_react(), 1);
  globalThis.__swiftjsx_worklet = (fn, code, closure) => {
    fn.__worklet = {
      code,
      closure
    };
    return fn;
  };
  var send = (message) => __native.command(0, "worklet", message, 0);
  var Shared = class {
    constructor(__shared, _value) {
      this.__shared = __shared;
      this._value = _value;
    }
    get value() {
      return this._value;
    }
    /** Assign a value, or an animation (`withSpring(…)`, `withTiming(…)`). */
    set value(v) {
      this._value = isAnimation(v) ? v.to : v;
      send({
        type: "set",
        id: this.__shared,
        value: v
      });
    }
    get() {
      return this.value;
    }
    set(v) {
      this.value = v;
    }
  };
  var nextShared = 1;
  var live = /* @__PURE__ */ new Map();
  function makeMutable(initial) {
    const shared = new Shared(nextShared++, initial);
    live.set(shared.__shared, shared);
    send({
      type: "set",
      id: shared.__shared,
      value: initial
    });
    return shared;
  }
  function useSharedValue(initial) {
    const $ = (0, import_compiler_runtime.c)(6);
    if ($[0] !== "1d93727551b85d34ac23171b46cea1d617eafcf519449a0bb63dfa7415cb92ed") {
      for (let $i = 0; $i < 6; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "1d93727551b85d34ac23171b46cea1d617eafcf519449a0bb63dfa7415cb92ed";
    }
    let t0;
    if ($[1] !== initial) {
      t0 = () => makeMutable(initial);
      $[1] = initial;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    const [shared] = (0, import_react.useState)(t0);
    let t1;
    let t2;
    if ($[3] !== shared) {
      t1 = () => {
        live.set(shared.__shared, shared);
        send({
          type: "set",
          id: shared.__shared,
          value: shared._value
        });
        return () => {
          live.delete(shared.__shared);
          send({
            type: "delete",
            id: shared.__shared
          });
        };
      };
      t2 = [shared];
      $[3] = shared;
      $[4] = t1;
      $[5] = t2;
    } else {
      t1 = $[4];
      t2 = $[5];
    }
    (0, import_react.useEffect)(t1, t2);
    return shared;
  }
  globalThis.__swiftjsx_sharedValues = (values) => {
    for (const id in values) {
      const shared = live.get(Number(id));
      if (shared) shared._value = values[id];
    }
  };
  var isAnimation = (v) => !!v && typeof v === "object" && v.__animate === true;
  function builtin(name, fn) {
    fn.__builtin = name;
    return fn;
  }
  var withSpring = builtin("withSpring", (to, config) => ({
    __animate: true,
    to,
    animation: {
      type: "spring",
      ...config
    }
  }));
  var withTiming = builtin("withTiming", (to, config = {}) => ({
    __animate: true,
    to,
    animation: {
      type: config.easing ?? "easeInOut",
      duration: config.duration ?? 0.3,
      delay: config.delay
    }
  }));
  var runOnJS = builtin("runOnJS", (fn) => fn);
  function useAnimatedStyle(fn) {
    if (!fn.__worklet) {
      throw new Error("useAnimatedStyle: the callback wasn't compiled as a worklet. Build with scripts/build.mjs, which runs the worklets Babel pass.");
    }
    return {
      __animatedStyle: fn
    };
  }
  var jsFunctions = /* @__PURE__ */ new Map();
  var functionIds = /* @__PURE__ */ new WeakMap();
  var functionRefs = /* @__PURE__ */ new Map();
  var nextFunction = 1;
  function isWorkletProp(v) {
    return typeof v === "function" && !!v.__worklet || !!v && typeof v === "object" && "__animatedStyle" in v;
  }
  function serializeWorkletProp(v, ids) {
    const fn = typeof v === "function" ? v : v.__animatedStyle;
    const {
      code,
      closure
    } = fn.__worklet;
    const out = {};
    for (const key in closure) out[key] = serializeCaptured(closure[key], ids);
    return {
      __worklet: {
        code,
        closure: out
      }
    };
  }
  function serializeCaptured(v, ids) {
    if (v instanceof Shared) return {
      __shared: v.__shared
    };
    if (typeof v === "function") {
      const fn = v;
      if (fn.__builtin) return {
        __builtin: fn.__builtin
      };
      if (fn.__worklet) return serializeWorkletProp(fn, ids);
      let id = functionIds.get(fn);
      if (id === void 0) functionIds.set(fn, id = nextFunction++);
      jsFunctions.set(id, fn);
      ids.add(id);
      return {
        __jsFunction: id
      };
    }
    if (Array.isArray(v)) return v.map((x) => serializeCaptured(x, ids));
    if (v && typeof v === "object") {
      if (Object.getPrototypeOf(v) !== Object.prototype) {
        throw new Error(`A worklet captured a ${v.constructor?.name ?? "non-plain"} object; worklets can capture plain data, shared values and functions.`);
      }
      const out = {};
      for (const key in v) out[key] = serializeCaptured(v[key], ids);
      return out;
    }
    return v;
  }
  function retainFunctions(previous, next) {
    for (const id of next) functionRefs.set(id, (functionRefs.get(id) ?? 0) + 1);
    for (const id of previous ?? []) {
      const refs = (functionRefs.get(id) ?? 1) - 1;
      if (refs > 0) functionRefs.set(id, refs);
      else {
        functionRefs.delete(id);
        jsFunctions.delete(id);
      }
    }
  }
  function jsFunction(id) {
    return jsFunctions.get(id);
  }

  // js/renderer.ts
  var HostInstance = class _HostInstance {
    constructor(id, type, props) {
      this.id = id;
      this.type = type;
      this.props = props;
    }
    /** Focus a TextField. */
    focus() {
      __native.command(this.id, "focus", null, 0);
    }
    blur() {
      __native.command(this.id, "blur", null, 0);
    }
    /**
     * Scroll a ScrollView / VirtualList. `target` is a ref to a descendant, a
     * row index (VirtualList), or "top" / "end".
     */
    scrollTo(target, options = {}) {
      const resolved = target instanceof _HostInstance ? {
        node: target.id
      } : typeof target === "number" ? {
        index: target
      } : {
        edge: target
      };
      __native.command(this.id, "scrollTo", {
        ...resolved,
        animated: options.animated ?? true,
        anchor: options.anchor ?? null
      }, 0);
    }
    /** Frame in window coordinates, after the last layout. */
    measure() {
      return new Promise((resolve) => {
        const cb = nextCallback++;
        callbacks.set(cb, resolve);
        __native.command(this.id, "measure", null, cb);
      });
    }
  };
  var nextId = 1;
  var nextCallback = 1;
  var pending2 = [];
  var instances = /* @__PURE__ */ new Map();
  var callbacks = /* @__PURE__ */ new Map();
  function serialize(inst, props) {
    const out = {};
    for (const key in props) {
      if (key === "children" || key === "key" || key === "ref") continue;
      const v = props[key];
      if (v === void 0 || isWorkletProp(v)) continue;
      out[key] = typeof v === "function" ? true : v;
    }
    Object.assign(out, serializeWorklets(inst, props));
    if (props.ref != null) out.__ref = true;
    return out;
  }
  function serializeWorklets(inst, props) {
    const ids = /* @__PURE__ */ new Set();
    const changed = {};
    const json = /* @__PURE__ */ new Map();
    for (const key in props) {
      if (!isWorkletProp(props[key])) continue;
      const value = serializeWorkletProp(props[key], ids);
      const text = JSON.stringify(value);
      json.set(key, text);
      if (inst.worklets?.get(key) !== text) changed[key] = value;
    }
    if (ids.size || inst.functionIds?.size) retainFunctions(inst.functionIds, ids);
    inst.functionIds = ids;
    inst.worklets = json.size ? json : void 0;
    return changed;
  }
  function same(a, b) {
    if (a === b) return true;
    if (typeof a === "function" && typeof b === "function") return true;
    if (a && b && typeof a === "object" && typeof b === "object") {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }
    return false;
  }
  function shallowDiff(inst, oldProps, newProps) {
    const changed = serializeWorklets(inst, newProps);
    let any = Object.keys(changed).length > 0;
    for (const key in newProps) {
      if (key === "children" || key === "ref" || isWorkletProp(newProps[key])) continue;
      if (!same(oldProps[key], newProps[key]) || isWorkletProp(oldProps[key])) {
        const v = newProps[key];
        changed[key] = typeof v === "function" ? true : v === void 0 ? null : v;
        any = true;
      }
    }
    for (const key in oldProps) {
      if (key === "children" || key === "ref") continue;
      if (!(key in newProps)) {
        changed[key] = null;
        any = true;
      }
    }
    if (oldProps.ref != null !== (newProps.ref != null)) {
      changed.__ref = newProps.ref != null ? true : null;
      any = true;
    }
    return any ? changed : null;
  }
  var currentPriority = import_constants.NoEventPriority;
  var hostConfig = {
    rendererPackageName: "swiftjsx",
    rendererVersion: "0.1.0",
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,
    supportsMicrotasks: true,
    scheduleMicrotask: (fn) => Promise.resolve().then(fn),
    scheduleTimeout: (fn, ms) => setTimeout(fn, ms),
    cancelTimeout: (id) => clearTimeout(id),
    noTimeout: -1,
    warnsIfNotActing: false,
    createInstance(type, props) {
      const inst = new HostInstance(nextId++, type, props);
      instances.set(inst.id, inst);
      pending2.push({
        op: "create",
        id: inst.id,
        type,
        props: serialize(inst, props)
      });
      return inst;
    },
    createTextInstance(text) {
      const inst = {
        id: nextId++,
        text
      };
      pending2.push({
        op: "text",
        id: inst.id,
        text
      });
      return inst;
    },
    appendInitialChild(parent, child) {
      pending2.push({
        op: "append",
        parent: parent.id,
        child: child.id
      });
    },
    appendChild(parent, child) {
      pending2.push({
        op: "append",
        parent: parent.id,
        child: child.id
      });
    },
    appendChildToContainer(_, child) {
      pending2.push({
        op: "append",
        parent: 0,
        child: child.id
      });
    },
    insertBefore(parent, child, before) {
      pending2.push({
        op: "insert",
        parent: parent.id,
        child: child.id,
        before: before.id
      });
    },
    insertInContainerBefore(_, child, before) {
      pending2.push({
        op: "insert",
        parent: 0,
        child: child.id,
        before: before.id
      });
    },
    removeChild(parent, child) {
      pending2.push({
        op: "remove",
        parent: parent.id,
        child: child.id
      });
    },
    removeChildFromContainer(_, child) {
      pending2.push({
        op: "remove",
        parent: 0,
        child: child.id
      });
    },
    commitUpdate(inst, _type, oldProps, newProps) {
      inst.props = newProps;
      const diff = shallowDiff(inst, oldProps, newProps);
      if (!diff) return;
      if (inst.eventSeq !== void 0) diff.__seq = inst.ackedSeq = inst.eventSeq;
      pending2.push({
        op: "update",
        id: inst.id,
        props: diff
      });
    },
    commitTextUpdate(inst, _old, text) {
      inst.text = text;
      pending2.push({
        op: "setText",
        id: inst.id,
        text
      });
    },
    detachDeletedInstance(inst) {
      instances.delete(inst.id);
      if (inst.functionIds?.size) retainFunctions(inst.functionIds, /* @__PURE__ */ new Set());
    },
    clearContainer() {
    },
    resetTextContent() {
    },
    shouldSetTextContent: () => false,
    finalizeInitialChildren: () => false,
    getRootHostContext: () => ({}),
    getChildHostContext: (ctx) => ctx,
    getPublicInstance: (inst) => inst,
    prepareForCommit: () => null,
    resetAfterCommit() {
      const ops = pending2;
      pending2 = [];
      if (ops.length) __native.commit(ops, commitAnimation);
    },
    preparePortalMount() {
    },
    hideInstance(inst) {
      pending2.push({
        op: "update",
        id: inst.id,
        props: {
          hidden: true
        }
      });
    },
    unhideInstance(inst) {
      pending2.push({
        op: "update",
        id: inst.id,
        props: {
          hidden: null
        }
      });
    },
    hideTextInstance() {
    },
    unhideTextInstance() {
    },
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur() {
    },
    afterActiveInstanceBlur() {
    },
    prepareScopeUpdate() {
    },
    getInstanceFromScope: () => null,
    // Update priorities: native events are "discrete" (like a click on the web),
    // so state updates from them render before the event handler returns.
    setCurrentUpdatePriority(p) {
      currentPriority = p;
    },
    getCurrentUpdatePriority: () => currentPriority,
    resolveUpdatePriority: () => currentPriority || import_constants.DefaultEventPriority,
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    trackSchedulerEvent() {
    },
    shouldAttemptEagerTransition: () => false,
    requestPostPaintCallback() {
    },
    // Suspense-y commit hooks: we never suspend a commit.
    maySuspendCommit: () => false,
    maySuspendCommitOnUpdate: () => false,
    maySuspendCommitInSyncRender: () => false,
    preloadInstance: () => true,
    startSuspendingCommit() {
    },
    suspendInstance() {
    },
    waitForCommitToBeReady: () => null,
    getSuspendedCommitReason: () => null,
    NotPendingTransition: null,
    HostTransitionContext: (0, import_react2.createContext)(null),
    resetFormInstance() {
    },
    bindToConsole: (methodName, args) => console[methodName].bind(console, ...args)
  };
  var reconciler = (0, import_react_reconciler.default)(hostConfig);
  var commitAnimation;
  function withAnimation(animation, fn) {
    const previous = commitAnimation;
    commitAnimation = animation;
    try {
      return reconciler.flushSyncFromReconciler(fn);
    } finally {
      commitAnimation = previous;
    }
  }
  reconciler.injectIntoDevTools();
  globalThis.__dispatch = (id, event, payload, seq, callback) => {
    const inst = instances.get(id);
    const handler = inst?.props[event];
    if (seq != null && inst) {
      inst.eventSeq = seq;
      acknowledgeLater(inst, seq);
      if (event === "onChange" && typeof payload === "string") payload = rebase(inst, payload);
    }
    const done = () => callback != null && __native.command(0, "eventDone", {
      callback
    }, 0);
    if (typeof handler !== "function") return done();
    const prev = currentPriority;
    currentPriority = import_constants.DiscreteEventPriority;
    let result;
    try {
      result = handler(payload);
    } catch (error) {
      done();
      throw error;
    } finally {
      currentPriority = prev;
    }
    if (callback != null) Promise.resolve(result).then(done, (error) => {
      done();
      console.error(error instanceof Error ? `${error.message}
${error.stack}` : String(error));
    });
  };
  function openURL(url, options = {}) {
    __native.command(0, "openURL", {
      url: String(url),
      inApp: !!options.inApp
    }, 0);
  }
  function rebase(inst, text) {
    const shown = inst.nativeText;
    const value = inst.props.value;
    inst.nativeText = text;
    if (shown === void 0 || typeof value !== "string" || shown === value || !text.startsWith(shown)) return text;
    return value + text.slice(shown.length);
  }
  function acknowledgeLater(inst, seq) {
    Promise.resolve().then(() => {
      if (!instances.has(inst.id) || inst.eventSeq !== seq || (inst.ackedSeq ?? 0) >= seq) return;
      inst.ackedSeq = seq;
      __native.commit([{
        op: "update",
        id: inst.id,
        props: {
          __seq: seq
        }
      }]);
    });
  }
  globalThis.__swiftjsx_callJS = (id, args) => {
    const fn = jsFunction(id);
    if (!fn) return;
    const prev = currentPriority;
    currentPriority = import_constants.DiscreteEventPriority;
    try {
      fn(...args);
    } finally {
      currentPriority = prev;
    }
  };
  globalThis.__resolveCommand = (cb, value) => {
    callbacks.get(cb)?.(value);
    callbacks.delete(cb);
  };
  var describe = (e) => e instanceof Error ? `${e.message}
${e.stack}` : String(e);
  var onUncaught = (e) => __native.fatal(describe(e));
  var onCaught = (e) => console.error(describe(e));
  var root = null;
  function render(element) {
    if (root) return;
    root = reconciler.createContainer(
      {
        id: 0
      },
      1,
      // ConcurrentRoot
      null,
      false,
      null,
      "",
      onUncaught,
      onCaught,
      onCaught,
      () => {
      }
    );
    reconciler.updateContainerSync(element, root, null, null);
    reconciler.flushSyncWork();
  }

  // js/components.ts
  var host = (tag) => tag;
  var VStack = host("VStack");
  var HStack = host("HStack");
  var ZStack = host("ZStack");
  var ScrollView = host("ScrollView");
  var List = host("List");
  var Form = host("Form");
  var Section = host("Section");
  var Text = host("Text");
  var Image = host("Image");
  var Label = host("Label");
  var Spacer = host("Spacer");
  var Divider = host("Divider");
  var ProgressView = host("ProgressView");
  var Button = host("Button");
  var TextField = host("TextField");
  var Toggle = host("Toggle");
  var Slider = host("Slider");
  var Stepper = host("Stepper");
  var Picker = host("Picker");
  var LazyVStack = host("LazyVStack");
  var LazyHStack = host("LazyHStack");
  var LazyVGrid = host("LazyVGrid");
  var NavigationStack = host("NavigationStack");
  var TabView = host("TabView");
  var Tab = host("Tab");
  var NavigationPage = host("NavigationPage");
  var SplitColumn = host("SplitColumn");
  var NavigationSplitViewHost = host("NavigationSplitView");
  var Screen = host("Screen");
  var ToolbarItem = host("ToolbarItem");
  var Sheet = host("Sheet");
  var Alert = host("Alert");
  var ConfirmationDialog = host("ConfirmationDialog");

  // js/navigation.tsx
  var import_compiler_runtime2 = __toESM(require_compiler_runtime(), 1);
  var import_react3 = __toESM(require_react(), 1);
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
  var NavigationContext = (0, import_react3.createContext)(null);
  function Navigator(t0) {
    const $ = (0, import_compiler_runtime2.c)(22);
    if ($[0] !== "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c") {
      for (let $i = 0; $i < 22; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c";
    }
    let children;
    let modifiers;
    if ($[1] !== t0) {
      ({
        children,
        ...modifiers
      } = t0);
      $[1] = t0;
      $[2] = children;
      $[3] = modifiers;
    } else {
      children = $[2];
      modifiers = $[3];
    }
    let t1;
    if ($[4] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
      t1 = [];
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const [stack, setStack] = (0, import_react3.useState)(t1);
    const lastKey = (0, import_react3.useRef)(0);
    let t2;
    let t3;
    let t4;
    if ($[5] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
      t2 = (screen) => {
        const key = lastKey.current = lastKey.current + 1;
        setStack((s) => [...s, {
          key,
          screen
        }]);
      };
      t3 = () => setStack(_temp);
      t4 = () => setStack([]);
      $[5] = t2;
      $[6] = t3;
      $[7] = t4;
    } else {
      t2 = $[5];
      t3 = $[6];
      t4 = $[7];
    }
    let t5;
    if ($[8] !== stack.length) {
      t5 = {
        push: t2,
        pop: t3,
        popToRoot: t4,
        depth: stack.length
      };
      $[8] = stack.length;
      $[9] = t5;
    } else {
      t5 = $[9];
    }
    const nav = t5;
    let t6;
    if ($[10] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
      t6 = (depth) => setStack((s_1) => s_1.slice(0, depth));
      $[10] = t6;
    } else {
      t6 = $[10];
    }
    let t7;
    if ($[11] !== children) {
      t7 = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationPage, { children });
      $[11] = children;
      $[12] = t7;
    } else {
      t7 = $[12];
    }
    let t8;
    if ($[13] !== stack) {
      t8 = stack.map(_temp2);
      $[13] = stack;
      $[14] = t8;
    } else {
      t8 = $[14];
    }
    let t9;
    if ($[15] !== modifiers || $[16] !== t7 || $[17] !== t8) {
      t9 = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavigationStack, { ...modifiers, onPathChange: t6, children: [
        t7,
        t8
      ] });
      $[15] = modifiers;
      $[16] = t7;
      $[17] = t8;
      $[18] = t9;
    } else {
      t9 = $[18];
    }
    let t10;
    if ($[19] !== nav || $[20] !== t9) {
      t10 = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationContext.Provider, { value: nav, children: t9 });
      $[19] = nav;
      $[20] = t9;
      $[21] = t10;
    } else {
      t10 = $[21];
    }
    return t10;
  }
  function _temp2(entry) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationPage, { children: entry.screen }, entry.key);
  }
  function _temp(s_0) {
    return s_0.slice(0, -1);
  }
  function useNavigation() {
    const $ = (0, import_compiler_runtime2.c)(1);
    if ($[0] !== "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c") {
      for (let $i = 0; $i < 1; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c";
    }
    const nav = (0, import_react3.useContext)(NavigationContext);
    if (!nav) {
      throw new Error("useNavigation() must be used inside <Navigator>");
    }
    return nav;
  }
  function NavigationSplitView(t0) {
    const $ = (0, import_compiler_runtime2.c)(22);
    if ($[0] !== "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c") {
      for (let $i = 0; $i < 22; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "73510154d725a3cf6cddb02dc6353023f3f480eb79c2a694712a9a481471156c";
    }
    let content;
    let detail;
    let props;
    let sidebar;
    if ($[1] !== t0) {
      ({
        sidebar,
        content,
        detail,
        ...props
      } = t0);
      $[1] = t0;
      $[2] = content;
      $[3] = detail;
      $[4] = props;
      $[5] = sidebar;
    } else {
      content = $[2];
      detail = $[3];
      props = $[4];
      sidebar = $[5];
    }
    let t1;
    if ($[6] !== sidebar) {
      t1 = ["sidebar", sidebar];
      $[6] = sidebar;
      $[7] = t1;
    } else {
      t1 = $[7];
    }
    let t2;
    if ($[8] !== content) {
      t2 = ["content", content];
      $[8] = content;
      $[9] = t2;
    } else {
      t2 = $[9];
    }
    let t3;
    if ($[10] !== detail) {
      t3 = ["detail", detail];
      $[10] = detail;
      $[11] = t3;
    } else {
      t3 = $[11];
    }
    let t4;
    if ($[12] !== t1 || $[13] !== t2 || $[14] !== t3) {
      t4 = [t1, t2, t3];
      $[12] = t1;
      $[13] = t2;
      $[14] = t3;
      $[15] = t4;
    } else {
      t4 = $[15];
    }
    const columns = t4;
    let t5;
    if ($[16] !== columns || $[17] !== content) {
      t5 = columns.map((t62) => {
        const [column, children] = t62;
        return column === "content" && content === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplitColumn, { column, children }, column);
      });
      $[16] = columns;
      $[17] = content;
      $[18] = t5;
    } else {
      t5 = $[18];
    }
    let t6;
    if ($[19] !== props || $[20] !== t5) {
      t6 = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationSplitViewHost, { ...props, children: t5 });
      $[19] = props;
      $[20] = t5;
      $[21] = t6;
    } else {
      t6 = $[21];
    }
    return t6;
  }

  // js/virtual-list.tsx
  var import_compiler_runtime3 = __toESM(require_compiler_runtime(), 1);
  var import_react4 = __toESM(require_react(), 1);
  var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  var VirtualListHost = "VirtualList";
  var VirtualRow = "VirtualRow";
  function VirtualList(t0) {
    const $ = (0, import_compiler_runtime3.c)(29);
    if ($[0] !== "209aadb1143c41a3709414ea132b16b328b6d7ff6154138af6c5e9da993d4109") {
      for (let $i = 0; $i < 29; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "209aadb1143c41a3709414ea132b16b328b6d7ff6154138af6c5e9da993d4109";
    }
    let data;
    let keyExtractor;
    let onEndReached;
    let renderItem;
    let rest;
    let t1;
    let t2;
    let t3;
    if ($[1] !== t0) {
      ({
        data,
        renderItem,
        keyExtractor,
        estimatedItemHeight: t1,
        overscan: t2,
        onEndReached,
        onEndReachedThreshold: t3,
        ...rest
      } = t0);
      $[1] = t0;
      $[2] = data;
      $[3] = keyExtractor;
      $[4] = onEndReached;
      $[5] = renderItem;
      $[6] = rest;
      $[7] = t1;
      $[8] = t2;
      $[9] = t3;
    } else {
      data = $[2];
      keyExtractor = $[3];
      onEndReached = $[4];
      renderItem = $[5];
      rest = $[6];
      t1 = $[7];
      t2 = $[8];
      t3 = $[9];
    }
    const estimatedItemHeight = t1 === void 0 ? 44 : t1;
    const overscan = t2 === void 0 ? 10 : t2;
    const onEndReachedThreshold = t3 === void 0 ? 10 : t3;
    const t4 = Math.min(data.length, overscan * 4);
    let t5;
    if ($[10] !== t4) {
      t5 = {
        start: 0,
        end: t4
      };
      $[10] = t4;
      $[11] = t5;
    } else {
      t5 = $[11];
    }
    const [range, setRange] = (0, import_react4.useState)(t5);
    const previousFirst = (0, import_react4.useRef)(0);
    const endReachedAt = (0, import_react4.useRef)(-1);
    let t6;
    if ($[12] !== data.length || $[13] !== onEndReached || $[14] !== onEndReachedThreshold || $[15] !== overscan) {
      t6 = (t72) => {
        const {
          first,
          last
        } = t72;
        if (onEndReached && last >= data.length - 1 - onEndReachedThreshold && endReachedAt.current !== data.length) {
          endReachedAt.current = data.length;
          onEndReached();
        }
        const down = first >= previousFirst.current;
        previousFirst.current = first;
        setRange((r) => {
          const ahead = Math.max(overscan, 2 * (last - first + 1));
          const behind = overscan;
          const leadBelow = r.end - 1 - last;
          const leadAbove = first - r.start;
          const visibleOutside = first < r.start || last >= r.end;
          const runningOut = down ? r.end < data.length && leadBelow < ahead / 2 : r.start > 0 && leadAbove < ahead / 2;
          if (!visibleOutside && !runningOut) {
            return r;
          }
          return down ? {
            start: Math.max(0, first - behind),
            end: Math.min(data.length, last + ahead + 1)
          } : {
            start: Math.max(0, first - ahead),
            end: Math.min(data.length, last + behind + 1)
          };
        });
      };
      $[12] = data.length;
      $[13] = onEndReached;
      $[14] = onEndReachedThreshold;
      $[15] = overscan;
      $[16] = t6;
    } else {
      t6 = $[16];
    }
    const onRangeChange = t6;
    let rows;
    if ($[17] !== data || $[18] !== keyExtractor || $[19] !== range.end || $[20] !== range.start || $[21] !== renderItem) {
      rows = [];
      const end = Math.min(range.end, data.length);
      for (let i = range.start; i < end; i++) {
        rows.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(VirtualRow, { index: i, children: renderItem(data[i], i) }, keyExtractor ? keyExtractor(data[i], i) : i));
      }
      $[17] = data;
      $[18] = keyExtractor;
      $[19] = range.end;
      $[20] = range.start;
      $[21] = renderItem;
      $[22] = rows;
    } else {
      rows = $[22];
    }
    let t7;
    if ($[23] !== data.length || $[24] !== estimatedItemHeight || $[25] !== onRangeChange || $[26] !== rest || $[27] !== rows) {
      t7 = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(VirtualListHost, { ...rest, count: data.length, estimatedItemHeight, onRangeChange, children: rows });
      $[23] = data.length;
      $[24] = estimatedItemHeight;
      $[25] = onRangeChange;
      $[26] = rest;
      $[27] = rows;
      $[28] = t7;
    } else {
      t7 = $[28];
    }
    return t7;
  }

  // js/native.ts
  var import_compiler_runtime4 = __toESM(require_compiler_runtime(), 1);
  var import_react5 = __toESM(require_react(), 1);
  var host2 = globalThis;
  function isNativeAvailable() {
    return host2.native != null;
  }
  var native = new Proxy({}, {
    get(_target, key) {
      const n = host2.native;
      if (n == null) {
        throw new Error(`native.${String(key)}: the native backend is off. Create the runtime with JSXRuntime(\u2026, native: NativeOptions(addonURL: \u2026)) (iOS: NativeOptions.embedded).`);
      }
      return n[key];
    },
    has(_target, key) {
      return host2.native != null && key in host2.native;
    }
  });
  function onMain(fn) {
    const hop = host2.__swiftjsx_mainHop;
    if (typeof hop !== "function") {
      return Promise.reject(new Error("onMain() needs the native backend (JSXRuntime(\u2026, native: \u2026))"));
    }
    return new Promise((resolve, reject) => {
      hop(() => {
        try {
          return {
            ok: true,
            value: fn()
          };
        } catch (error) {
          return {
            ok: false,
            error
          };
        }
      }, (result) => result.ok ? resolve(result.value) : reject(result.error));
    });
  }
  function useNativeValue(read, t0) {
    const $ = (0, import_compiler_runtime4.c)(18);
    if ($[0] !== "fcb0f4a58da0d33f9f8e7799a34358983f1d8341f1e6562b16f6363200fcacb2") {
      for (let $i = 0; $i < 18; $i += 1) {
        $[$i] = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      }
      $[0] = "fcb0f4a58da0d33f9f8e7799a34358983f1d8341f1e6562b16f6363200fcacb2";
    }
    let t1;
    if ($[1] !== t0) {
      t1 = t0 === void 0 ? {} : t0;
      $[1] = t0;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    const options = t1;
    const {
      notifications,
      poll,
      mainThread: t2
    } = options;
    const mainThread = t2 === void 0 ? true : t2;
    const [value, setValue] = (0, import_react5.useState)(void 0);
    let t3;
    if ($[3] !== notifications) {
      t3 = notifications == null ? [] : Array.isArray(notifications) ? notifications : [notifications];
      $[3] = notifications;
      $[4] = t3;
    } else {
      t3 = $[4];
    }
    const names = t3;
    let t4;
    if ($[5] !== names) {
      t4 = names.join("|");
      $[5] = names;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    const key = t4;
    let t5;
    if ($[7] !== read) {
      t5 = () => read();
      $[7] = read;
      $[8] = t5;
    } else {
      t5 = $[8];
    }
    const readNow = (0, import_react5.useEffectEvent)(t5);
    let t6;
    if ($[9] !== mainThread || $[10] !== names || $[11] !== poll || $[12] !== readNow) {
      t6 = () => {
        let live2 = true;
        const refresh = () => {
          const result = mainThread ? onMain(readNow) : Promise.resolve().then(readNow);
          result.then((v) => live2 && setValue(() => v)).catch(_temp3);
        };
        refresh();
        const center = native.NSNotificationCenter.defaultCenter;
        const tokens = names.map((name) => center.addObserverForNameObjectQueueUsingBlock(name, null, null, () => setTimeout(refresh, 0)));
        const timer = poll ? setInterval(refresh, poll) : void 0;
        return () => {
          live2 = false;
          tokens.forEach((t) => center.removeObserver(t));
          if (timer) {
            clearInterval(timer);
          }
        };
      };
      $[9] = mainThread;
      $[10] = names;
      $[11] = poll;
      $[12] = readNow;
      $[13] = t6;
    } else {
      t6 = $[13];
    }
    let t7;
    if ($[14] !== key || $[15] !== mainThread || $[16] !== poll) {
      t7 = [key, poll, mainThread];
      $[14] = key;
      $[15] = mainThread;
      $[16] = poll;
      $[17] = t7;
    } else {
      t7 = $[17];
    }
    (0, import_react5.useEffect)(t6, t7);
    return value;
  }
  function _temp3(e) {
    return console.error(e);
  }

  // js/runtime-entry.ts
  globalThis.__swiftjsx_modules = {
    react: React,
    "react/jsx-runtime": JSXRuntime,
    "react/jsx-dev-runtime": JSXDevRuntime,
    // Memo cache used by React Compiler output.
    "react/compiler-runtime": CompilerRuntime,
    swiftjsx: index_exports
  };
})();
