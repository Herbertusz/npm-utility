// smooth scroll

interface Options {
    action: (value: number) => void,
    delay: number;
    range: [number, number];
    easing: string;
}

/**
 * Animációk kezelése
 * @type {Object}
 * @example
 *  animation.run('scroll', {
 *      action: n => {
 *          window.scrollTo(0, fromY + n * (toY - fromY));
 *      },
 *      delay: 1000,
 *      range: [0, 1],
 *      easing: 'swing'
 *  }).then(
 *      _n => {
 *          window.scrollTo(0, toY);
 *      }
 *  ).catch(
 *      error => {
 *          console.error(error);
 *      }
 *  );
 */
export const animation = {

    /**
     * Timeout ID-k
     * @type {Object}
     * @desc timers = {
     *     <ID>: Number,
     *     ...
     * }
     */
    timers: { } as Record<string, number>,

    /**
     * Aktulási animációs értékek
     * @type {Object}
     * @desc values = {
     *     <ID>: Number,
     *     ...
     * }
     */
    values: { } as Record<string, number>,

    /**
     * Animáció lefutási görbéjét meghatározó függvények
     * @type {Object}
     * @desc easings = {
     *     <name>: Function,
     *     ...
     * }
     */
    easings: {

        /**
         * Easing függvény (továbbiak: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js)
         * @param {Number} t - független változó (idő)
         * @param {Number} b - kezdeti érték y(t0)
         * @param {Number} c - érték változása y(t1) - y(t0)
         * @param {Number} d - időtartam (t1 - t0)
         * @return {Number} függvény értéke y(t)
         */
        linear: (t: number, b: number, c: number, d: number): number =>
            c * t / d + b,

        swing: (t: number, b: number, c: number, d: number): number =>
            ((-Math.cos(t * Math.PI / d) / 2) + 0.5) * c + b

    } as Record<string, (t: number, b: number, c: number, d: number) => number>,

    /**
     * Animáció futtatása
     * @param {String} ID - animáció azonosítója (ajánlott minden elemre egyedi ID)
     * @param {Object} options - beállítások
     * @desc options = {
     *     action: Function    // minden lépésnél meghívott függvény (megkapja az animáció értékét): (Number) => {}
     *     delay: Number       // animáció hossza (ms): 1000
     *     range: Array        // animációs érték tartománya: [0, 1]
     *     easing: String      // animációs függvény: 'swing'
     * }
     */
    run: function(ID: string, options: Options): Promise<number> {
        options = Object.assign({
            action: () => {},
            delay: 1000,
            range: [0, 1],
            easing: 'swing'
        }, options);

        const startTime = Date.now();

        return new Promise((resolve, _reject) => {
            (function makeStep() {
                const currentTime = Date.now() - startTime;
                animation.values[ID] = animation.easings[options.easing](
                    currentTime, options.range[0], options.range[1] - options.range[0], options.delay
                );
                options.action(animation.values[ID]);
                if (currentTime >= options.delay) {
                    delete animation.timers[ID];
                    resolve(animation.values[ID]);
                } else {
                    animation.timers[ID] = requestAnimationFrame(makeStep);
                }
            })();
        });

    },

    /**
     * Animáció megállítása
     * @param {Number} timeoutID - timeout ID
     * @return {Number} animáció utolsó értéke
     */
    stop: function(timeoutID: number): number | null {
        if (Object.hasOwn(animation.timers, 'timeoutID')) {
            cancelAnimationFrame(animation.timers[timeoutID]);
            return animation.values[timeoutID];
        } else {
            return null;
        }
    }

};

/**
 * Element.prototype.scrollIntoView polyfill
 * @param element
 * @param block
 * @param offsetY
 */
export const smoothScrollToElement = function(
    element: HTMLElement,
    block: ScrollLogicalPosition = 'center',
    offsetY: number = 0
) {
    if (offsetY === 0 && 'scrollBehavior' in document.documentElement.style) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: block,
            inline: 'center'
        });
        return;
    }
    // offset lehetőség nincs a natív-ban ezért ha meg van adva, akkor a polyfill megy
    const fromY = window.pageYOffset;
    const rect = element.getBoundingClientRect();
    const pos = {
        x: rect.left + window.pageXOffset,
        y: rect.top + window.pageYOffset,
        w: rect.width,
        h: rect.height
    };
    let toY = offsetY;
    if (block === 'center') {
        toY = Math.round(pos.y + (pos.h / 2) - (window.innerHeight / 2) + offsetY);
    }
    if (block === 'start') {
        toY = pos.y + offsetY;
    }
    if (block === 'end') {
        toY = pos.y + pos.h - window.innerHeight + offsetY;
    }

    if (toY < 0) {
        toY = 0;
    }
    if (toY >= document.body.offsetHeight - window.innerHeight) {
        toY = document.body.offsetHeight - window.innerHeight;
    }

    animation.run('scroll', {
        action: n => {
            window.scrollTo(0, fromY + n * (toY - fromY));
        },
        delay: 1000,
        range: [0, 1],
        easing: 'swing'
    }).then(
        _n => {
            window.scrollTo(0, toY);
        }
    ).catch(
        error => {
            console.error(error);
        }
    );
};
