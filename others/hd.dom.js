/**
 * HD-keret DOM v1.3.1
 * 2018.09.13
 *
 * @description DOM-kezelő
 * @example
 *  DOM('.class').event('click', function(target, event) {...});
 *  DOM('.class').descendants('button').data('clickable', 'true').trigger('click');
 *  const cloneElement = DOM('.class').filter('[data-disabled]').clone(true).elem();
 */

/**
 * DOM elemek kezelését segítő objektum (Module minta)
 * @param {String|Array|HTMLElement|NodeList} identifier
 * @return {Object}
 */
const DOM = function(identifier) {

    /**
     * Konstruktornak átadott elem vizsgálata
     * @param {Object} ident
     * @return {Boolean} HTMLElement | document | window -> true
     * @private
     */
    const acceptableObject = function(ident) {
        if (typeof ident === 'object' && ident !== null) {
            if (
                typeof ident.nodeType === 'number' &&
                (ident.nodeType === Node.ELEMENT_NODE || ident.nodeType === Node.DOCUMENT_NODE)
            ) {
                // HTMLElement | document
                return true;
            }
            else if (typeof ident.self !== 'undefined' && ident.self === ident) {
                // window
                return true;
            }
        }
        return false;
    };

    /**
     * Egy elemhez csatolt eseménykezelők
     * @param {HTMLElement} element
     * @param {String} [eventName]
     * @return {Array.<Object>}
     * @private
     */
    const getHandlers = function(element, eventName) {
        if (typeof eventName === 'string') {
            return DOM.internal.eventListeners.filter(
                listener => listener.target === element && listener.eventName === eventName
            );
        }
        else {
            return DOM.internal.eventListeners.filter(
                listener => listener.target === element
            );
        }
    };

    return {

        /**
         * A kiválasztott elemek tárolása
         * @type {Array.<HTMLElement>}
         */
        elements: (function(ident) {
            if (typeof ident === 'string') {
                if (ident.indexOf('<') > -1) {
                    // HTML kód
                    const div = document.createElement('div');
                    div.innerHTML = ident;
                    return [...div.children];
                }
                else {
                    // Szelektor
                    return [...document.querySelectorAll(ident)];
                }
            }
            else if (acceptableObject(ident)) {
                // HTMLElement | document | window
                return [ident];
            }
            else if (typeof ident === 'object') {
                if (ident instanceof Array) {
                    // Tömb
                    const accept = ident.every(elem => acceptableObject(elem));
                    if (accept) {
                        return ident;
                    }
                    else {
                        throw Error('DOM(): Nem támogatott objektum típusok találhatók a tömbben.');
                    }
                }
                else if (ident instanceof NodeList || ident instanceof HTMLCollection) {
                    // Elemlista
                    return [...ident];
                }
                else if (ident === null) {
                    // null
                    return [];
                }
                else {
                    throw Error('DOM(): Nem támogatott objektum típus.');
                }
            }
            else {
                throw Error(`DOM(): Nem támogatott típus (${typeof ident}).`);
            }
        })(identifier),

        /**
         * Első elem lekérése
         * @return {HTMLElement|null}
         */
        elem: function() {
            if (typeof this.elements[0] !== 'undefined') {
                return this.elements[0];
            }
            else {
                return null;
            }
        },

        /**
         * Keresés a leszármazott elemek közt
         * @param {String} selector
         * @return {Object}
         */
        descendants: function(selector) {
            let elements = [];

            this.elements.forEach(elem => {
                elements = elements.concat([...elem.querySelectorAll(selector)]);
            });
            return DOM(elements);
        },

        /**
         * Keresés a szülő elemek közt
         * @param {String} selector
         * @return {Object}
         */
        ancestors: function(selector) {
            const elements = [];
            let parent = this.elem().parentNode;

            while (parent.nodeType !== Node.DOCUMENT_NODE) {
                if (parent.matches(selector)) {
                    elements.push(parent);
                }
                parent = parent.parentNode;
            }
            return DOM(elements);
        },

        /**
         * Keresés a környező elemek közt
         * @param {String} ancestorSelector
         * @param {String} descendantSelector
         * @return {Object}
         */
        neighbours: function(ancestorSelector, descendantSelector) {
            return this.ancestors(ancestorSelector).descendants(descendantSelector);
        },

        /**
         * Elemek szűrése
         * @param {String} selector
         * @return {Object}
         */
        filter: function(selector) {
            const elements = this.elements.filter(elem => elem.matches(selector));
            return DOM(elements);
        },

        /**
         * Elemek szűrése kapcsolt adat alapján
         * @param {String} name
         * @param {String} [value]
         * @return {Object}
         */
        filterByData: function(name, value) {
            let elements;

            if (typeof value === 'undefined') {
                elements = this.filter(`[data-${name}]`);
            }
            else {
                elements = this.filter(`[data-${name}="${value}"]`);
            }
            return elements;
        },

        /**
         * Elemhez kapcsolt string adat lekérdezése / módosítása
         * @param {String} name
         * @param {String} [value]
         * @return {String|DOM}
         */
        data: function(name, value) {
            if (typeof value === 'undefined') {
                // getter
                if (this.elem().hasAttribute(`data-${name}`)) {
                    return this.elem().getAttribute(`data-${name}`);
                }
                else {
                    return null;
                }
            }
            else {
                // setter
                this.elements.forEach(elem => {
                    elem.setAttribute(`data-${name}`, value);
                });
                return this;
            }
        },

        /**
         * Elemhez kapcsolt logikai adat lekérdezése / módosítása
         * @param {String} name
         * @param {Boolean} [value]
         * @return {Boolean|DOM}
         */
        dataBool: function(name, value) {
            if (typeof value === 'undefined') {
                // getter
                const data = this.data(name);
                return !(
                    data === null ||
                    data === '' ||
                    data === '0' ||
                    data === 'false' ||
                    data === 'null' ||
                    data === 'undefined'
                );
            }
            else {
                // setter
                if (value) {
                    this.data(name, 'true');
                }
                else {
                    this.removeData(name);
                }
                return this;
            }
        },

        /**
         * Elemhez kapcsolt numerikus adat lekérdezése / módosítása
         * @param {String} name
         * @param {Number} [value]
         * @return {Number|DOM}
         */
        dataNum: function(name, value) {
            if (typeof value === 'undefined') {
                // getter
                const data = this.data(name);
                return Number(data);
            }
            else {
                // setter
                this.data(name, String(value));
                return this;
            }
        },

        /**
         * Elemhez kapcsolt objektum adat lekérdezése / módosítása
         * @param {String} name
         * @param {Object} [value]
         * @return {Object|DOM}
         */
        dataObj: function(name, value) {
            if (typeof value === 'undefined') {
                // getter
                let obj;
                const data = this.data(name);

                try {
                    obj = JSON.parse(data);
                }
                catch (error) {
                    if (!data) {
                        obj = {};
                    }
                    else {
                        throw error;
                    }
                }
                return obj;
            }
            else {
                // setter
                this.data(name, JSON.stringify(value));
                return this;
            }
        },

        /**
         * Elemhez kapcsolt adat törlése
         * @param {String} name
         * @return {DOM}
         */
        removeData: function(name) {
            // setter
            this.elements.forEach(elem => {
                elem.removeAttribute(`data-${name}`);
            });
            return this;
        },

        /**
         * Elem tulajdonságának lekérdezése / módosítása
         * @param {String} property
         * @param {Boolean} value
         * @return {Boolean|DOM}
         */
        prop: function(property, value) {
            if (typeof value === 'undefined') {
                // getter
                return this.elem()[property];
            }
            else {
                // setter
                this.elements.forEach(elem => {
                    elem[property] = value;
                });
                return this;
            }
        },

        /**
         * Osztálylista módosítása
         * @param {String} operation - 'add'|'remove'|'toggle'
         * @param {String} classNames
         * @return {DOM}
         */
        class: function(operation, ...classNames) {
            this.elements.forEach(elem => {
                elem.classList[operation](...classNames);
            });
            return this;
        },

        /**
         * CSS-tulajdonságok lekérdezése / módosítása
         * @param {String|Object} properties
         * @return {String|DOM}
         */
        css: function(properties) {
            if (typeof properties === 'string') {
                // getter
                return window.getComputedStyle(this.elem()).getPropertyValue(properties);
            }
            else {
                // setter
                this.elements.forEach(elem => {
                    Object.keys(properties).forEach(prop => {
                        prop = prop.replace(/^-/, '').replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
                        elem.style[prop] = properties[prop];
                    });
                });
                return this;
            }
        },

        /**
         * Elem klónozása
         * @param {Boolean} [withEvents=false] - eseménykezelők másolása
         * @return {DOM}
         */
        clone: function(withEvents = false) {
            const elementClone = this.elem().cloneNode(true);

            if (withEvents) {
                let elem, elemClone, listeners;
                const iterator = document.createNodeIterator(this.elem(), NodeFilter.SHOW_ELEMENT);
                const iteratorClone = document.createNodeIterator(elementClone, NodeFilter.SHOW_ELEMENT);
                const addEvent = function(listener) {
                    DOM(elemClone).event(listener.eventName, listener.handler);
                };

                while ((elem = iterator.nextNode())) {
                    listeners = getHandlers(elem);
                    while ((elemClone = iteratorClone.nextNode())) {
                        if (elem.isEqualNode(elemClone)) {
                            listeners.forEach(addEvent);
                            break;
                        }
                    }
                }
            }
            return DOM(elementClone);
        },

        /**
         * Elem rekurzív másolása eseménykezelőkkel együtt és beszúrása egy másik elem elejére
         * @param {HTMLElement} insert - beszúrás helye
         * @param {Boolean} [withEvents=false] - eseménykezelők másolása
         * @return {DOM} az elem másolata
         */
        copyPasteFront: function(insert, withEvents = false) {
            const Clone = this.clone(withEvents);

            insert.insertBefore(Clone.elem(), insert.firstChild);
            return Clone;
        },

        /**
         * Elem rekurzív másolása eseménykezelőkkel együtt és beszúrása egy másik elem végére
         * @param {HTMLElement} insert - beszúrás helyeú
         * @param {Boolean} [withEvents=false] - eseménykezelők másolása
         * @return {DOM} az elem másolata
         */
        copyPasteEnd: function(insert, withEvents = false) {
            const Clone = this.clone(withEvents);

            insert.appendChild(Clone.elem());
            return Clone;
        },

        /**
         * Elemek eltávolítása
         * @return {DOM}
         */
        remove: function() {
            this.elements.forEach(elem => {
                elem.parentNode.removeChild(elem);
            });
            return this;
        },

        /**
         * Eseménykezelő csatolása
         * @param {String} eventNames
         * @param {Function} handler
         * @return {DOM}
         */
        event: function(eventNames, handler) {
            this.elements.forEach(target => {
                eventNames.split(' ').forEach(eventName => {
                    target.addEventListener(eventName, event => {
                        handler.call(target, target, event);
                    }, false);
                    DOM.internal.eventListeners.push({
                        target: target,
                        eventName: eventName,
                        handler: handler
                    });
                });
            });
            return this;
        },

        /**
         * Eseménykezelők meghívása
         * @param {String} eventName
         * @return {DOM}
         */
        trigger: function(eventName) {
            let handlers, eventObj;

            if (typeof Event === 'function') {
                eventObj = new Event(eventName, {
                    bubbles: true,
                    cancelable: true
                });
            }
            else {
                eventObj = document.createEvent('Event');
                eventObj.initEvent(eventName, true, true);
            }
            this.elements.forEach(target => {
                handlers = getHandlers(target, eventName);
                handlers.forEach(handlerObj => {
                    handlerObj.handler.call(target, target, eventObj);
                });
                if (!eventObj.isDefaultPrevented && typeof target[eventName] === 'function') {
                    target[eventName]();
                }
            });
            return this;
        },

        /**
         * Esemény kiváltása
         * @param {String} eventName
         * @return {DOM}
         */
        dispatch: function(eventName) {
            let eventObj;

            eventObj = new Event(eventName, {
                bubbles: true,
                cancelable: true
            });
            this.elements.forEach(target => {
                target.dispatchEvent(eventObj);
            });
            return this;
        }

    };

};

DOM.internal = {

    /**
     * Csatolt eseménykezelők belső tárolása
     * @type {Array.<Object>}
     * @description
     *  eventListeners = [
     *      {
     *          target: HTMLElement,
     *          eventName: String,
     *          handler: Function
     *      },
     *      ...
     *  ]
     */
    eventListeners: [],

    /**
     * Csatolt adatok típusainak belső tárolása
     * @type {Array.<Object>}
     * @description
     *  dataObjects = [
     *      {
     *          element: HTMLElement,
     *          type: String,
     *          name: String,
     *          value: any
     *      },
     *      ...
     *  ]
     */
    dataObjects: []

};

export default DOM;
