import { cloneDeep, isEqual, isFunction, isString, pick, round, times, uniqBy } from 'lodash';

/**
 * Switch szerkezet funkcionális megfelelője (elsősorban értékadáshoz)
 * @param {*} variable - változó
 * @param {object} relations - változó különböző értékeihez rendelt visszatérési értékek
 * @param {*} [defaultValue=null] - alapértelmezett érték (default)
 * @return {*}
 * @example
 *  control = switching(key, {
 *      'W': 'accelerate',
 *      'A': 'turnLeft',
 *      'S': 'brake',
 *      'D': 'turnRight'
 *  }, null);
 * Ezzel egyenértékű:
 *  switch(key) {
 *      case 'W': control = 'accelerate'; break;
 *      case 'A': control = 'turnLeft'; break;
 *      case 'S': control = 'brake'; break;
 *      case 'D': control = 'turnRight'; break;
 *      default: control = null;
 *  }
 * Ha csak akkor futhat le az ág ha teljesül a feltétel:
 *  calculated = switching(name, {
 *      'Nationality': () => toCustomString(name),
 *      'FootID': 'foot',
 *      'TeamID': 'team'
 *  ]
 */
export const switching = function<T, U>(
    variable: T, relations: Record<string, U | (() => U)>, defaultValue: U = null as U
): U {
    let index: string;
    for (index in relations) {
        if (String(variable) === index) {
            if (isFunction(relations[index])) {
                return (relations[index] as () => U)();
            }
            else {
                return relations[index] as U;
            }
        }
    }
    return defaultValue;
};

/**
 * Elágazás funkcionális megfelelője (elsősorban értékadáshoz)
 * @param {array} construct - feltételes szerkezetet leíró tömb
 * @return {*}
 * @example
 *  variable = condition([
 *      [alert_date < alert_date, 1],
 *      [alert_date > alert_date, -1],
 *      [uniqueId > uniqueId, 1],
 *      [uniqueId < uniqueId, -1],
 *      [true, 0]
 *  ]);
 * Ezzel egyenértékű:
 *  if (alert_date < alert_date) {
 *      variable = 1;
 *  }
 *  else if (alert_date > alert_date) {
 *      variable = -1;
 *  }
 *  else if (uniqueId > uniqueId) {
 *      variable = 1;
 *  }
 *  else {
 *      variable = -1;
 *  }
 * @example
 *  condition([
 *      [input.type === 'checkbox', () => {
 *          statement A;
 *      }],
 *      [input.type === 'select', () => {
 *          statement B;
 *      }],
 *      [true, () => {
 *          statement C;
 *      }]
 *  ])();
 * Ezzel egyenértékű:
 *  if (input.type === 'checkbox') {
 *      statement A;
 *  }
 *  else if (input.type === 'select') {
 *      statement B;
 *  }
 *  else {
 *      statement C;
 *  }
 * @example
 *  const variable = condition([
 *      [(data >= sector), size],
 *      [(sector - data) < size, size - (sector - data)],
 *      [true, 0]
 *  ]);
 * Ezzel egyenértékű:
 *  const variable = (data >= sector)
 *      ? size
 *      : (sector - data) < size
 *          ? size - (sector - data)
 *          : 0;
 */
export const condition = function<T>(construct: [boolean, T][]): T {
    return (construct.find(branch => branch[0]) as T[])[1];
};

/**
 * Promisify-olt setTimeout
 * @param {number} timeout - késleltetés
 * @param {*} [resolvedValue=null] - továbbított érték
 * @return {Promise}
 */
export const delay = function<T>(timeout: number, resolvedValue: T = null!): Promise<T> {
    return new Promise((resolve: (value: T) => void) => {
        window.setTimeout(() => {
            resolve(resolvedValue);
        }, timeout);
    });
};

/**
 * Promise-ok szekvenciális végrehajtása (Promise.all mintájára)
 * @param promiseFactories - promise-t visszaadó függvények tömbje
 * @return {Promise}
 * @example
 *  promiseSequence([
 *      () => delay(1000, 1).then(() => 1),
 *      (value) => delay(2000, value).then((val) => val + 1),
 *      (value) => delay(1000, value).then((val) => val + 1)
 *  ]).then(
 *      (value) => console.info(value)
 *  ).catch(
 *      (error) => console.warn(error)
 *  );
 */
export const promiseSequence = function<T>(
    promiseFactories: ((previousValue: T) => Promise<T>)[]
): Promise<T> {
    return promiseFactories.reduce(
        (acc: Promise<any>, curr: (value: T) => Promise<T>) => acc.then(
            (value: T) => curr(value)
        ),
        Promise.resolve()
    );
};

/**
 * Promise-ok szekvenciális lefuttatása (Promise.allSettled mintájára)
 * @param factories - promise factory-k tömbje
 * @return visszatérési értékek tömbje
 * @todo megszakítási lehetöség
 * @exampe
 *   promiseSettledSequence<number>([
 *       ()     => { return Promise.resolve(1); },
 *       (prev) => { console.info(prev); return Promise.reject(2); },
 *       (prev) => { console.info(prev); return Promise.resolve(3); },
 *       (prev) => { console.info(prev); return Promise.reject(4); },
 *       (prev) => { console.info(prev); return Promise.resolve(5); },
 *   ]).then(
 *       values => {
 *           console.info(values);
 *       }
 *   ).catch(
 *       values => {
 *           console.info(values);
 *       }
 *   );
 */
export const promiseSettledSequence = function<T>(
    factories: ((previousValue: T) => Promise<T>)[]
): Promise<PromiseSettledResult<T>[]> {
    let result = Promise.resolve(null as T);
    const values: PromiseSettledResult<T>[] = [];
    factories.forEach(
        (factory) => {
            result = result.then(
                (currentValue: T) => {
                    if (currentValue !== undefined) {
                        values.push({ status: 'fulfilled', value: currentValue });
                    }
                    return factory(currentValue);
                }
            ).catch(
                (currentReason: T) => {
                    values.push({ status: 'rejected', reason: currentReason });
                }
            ) as Promise<Awaited<T>>;
        }
    );
    return result.then(
        (currentValue: T) => {
            values.shift();
            if (currentValue !== undefined) {
                values.push({ status: 'fulfilled', value: currentValue });
            }
            return values;
        }
    ).catch(
        (currentReason: T) => {
            values.shift();
            values.push({ status: 'rejected', reason: currentReason });
            return values;
        }
    );
};

/**
 * Fetch újrapróbalása amíg nem 2xx a response status code, legfeljebb times alkalommal
 * @param {Object} param
 * @return {Promise}
 */
export const tryRequest = function({
    times, url, options = { }
}: {
    times: number, url: string, options?: RequestInit
}): Promise<Response> {
    const repeat = (response: Response): Promise<any> | Response => {
        if (response.ok) {
            return response;
        }
        else {
            return fetch(url, options);
        }
    };

    return promiseSequence<Response>([
        () => fetch(url, options),
        ...new Array(times - 1).fill(repeat)
    ]).then(
        (response: Response) => {
            if (response.ok) {
                return response;
            }
            else {
                throw response;
            }
        }
    ).catch(
        (error: Error) => {
            throw error;
        }
    );
};

/**
 * Függvény lefuttatása macrotask-ként
 * @param callback
 */
export const macrotask = function<T>(callback: () => T): Promise<T> {
    return new Promise((resolve: (value: T) => void) => {
        window.setTimeout(() => {
            resolve(callback());
        }, 0);
    });
};

/**
 * Tömb egy elemének billegtetése (objektumok tömbjére is működik)
 * @param {array} array
 * @param {*} item
 * @return {array}
 */
export const toggleArray = function<Item>(array: Item[], item: Item): Item[] {
    const arrayCopy = cloneDeep(array);
    const index = arrayCopy.findIndex(
        (currentItem: Item) => isEqual(currentItem, item)
    );
    if (index > -1) {
        arrayCopy.splice(index, 1);
    }
    else {
        arrayCopy.push(item);
    }
    return arrayCopy;
};

export enum SortDirection {
    asc = 'asc',
    desc = 'desc'
}

/**
 * Sorrendezést definiáló függvény (Array.prototype.sort metódushoz)
 * @param {*} a - elem
 * @param {*} b - elem
 * @param {'asc'|'desc'} [order='asc'] - sorrend iránya
 * @return 1 | 0 | -1
 * @example
 *  array.sort(
 *      (a, b) => sortDescriptor(order(a), order(b), SortDirection.desc)
 *  );
 */
export const sortDescriptor = function<T>(a: T, b: T, order: SortDirection = SortDirection.asc): number {
    if (typeof a === 'string' && typeof b === 'string') {
        const coll = new Intl.Collator('hu').compare(a, b);
        return condition([
            [order === SortDirection.asc, coll],
            [order === SortDirection.desc, -coll],
            [true, 0]
        ]);
    }
    else {
        return condition([
            [order === SortDirection.asc && a > b, 1],
            [order === SortDirection.asc && a < b, -1],
            [order === SortDirection.asc && a === b, 0],
            [order === SortDirection.desc && a > b, -1],
            [order === SortDirection.desc && a < b, 1],
            [order === SortDirection.desc && a === b, 0],
            [true, 0]
        ]);
    }
};

/**
 * Százalékos érték kiszámítása
 * @param {number} value - érték
 * @param {number} of - alap
 * @param {number} [rounding=1] - kerekítés
 * @return {number}
 */
export const getPercentage = function(value: number, of: number, rounding: number = 1): number {
    return round((value / of) * 100, rounding);
};

/**
 * Szám aránytartó átalakítása két skála között
 * @param number - Átalakítandó szám
 * @param fromRange - Jelenlegi skála
 * @param toRange - Új skála
 * @return Átalakított szám
 * @example
 *  ratioRange(6, [3, 9], [0, 100]) => 50
 *  ratioRange(12, [10, 20], [1, 2]) => 1.2
 *  ratioRange(20, [0, 10], [0, 100]) => 200
 */
export const ratioRange = function(
    number: number, fromRange: [number, number], toRange: [number, number]
): number {
    return (number - fromRange[0]) * (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]) + toRange[0];
};

/**
 * Két intervalum metszete
 * @param {array} interval1 - intervallum
 * @param {array} interval2 - intervallum
 * @return {array} metszet
 */
export const intersectionIntervals = function(
    interval1: [number, number], interval2: [number, number]
): [number, number] | null {
    const start = Math.max(interval1[0], interval2[0]);
    const end = Math.min(interval1[1], interval2[1]);

    if (start <= end) {
        return [start, end];
    } else {
        return null;
    }
};

/**
 * Számokkal definiált intervallumok merge-elése
 * @param {array} intervals - Intervallumok
 * @return {array}
 * @example
 *  mergeIntervals([[6, 8], [1, 7], [2, 4], [9, 10]]) => [[1, 8], [9, 10]]
 */
export const unionIntervals = function(intervals: [number, number][]): [number, number][] {
    const stack: [number, number][] = [];

    intervals.sort(
        (a, b) => sortDescriptor(a[0], b[0])
    );

    intervals.forEach(
        (interval, i) => {
            if (i === 0) {
                stack.push(interval);
            }
            else {
                const top = stack[stack.length - 1];
                if (top[1] < interval[0]) {
                    // ha a jelenlegi intervallum nincs átfedésben a stack tetején lévővel
                    stack.push(interval);
                }
                else if (top[1] < interval[1]) {
                    // ha átfedésben van és a jelenlegi később végződik, akkor módosítsuk a legfelső végét
                    top[1] = interval[1];
                    stack.pop();
                    stack.push(top);
                }
            }
        }
    );

    return stack;
};

/**
 * Intervallumok komplementere egy adott intervallumon (domain) belül
 * @param {array} domain - Főintervallum
 * @param {array} intervals - Intervallumok
 * @return {array}
 * @example
 *  complementMultiIntervals([1, 10], [[3, 5], [6, 8]]) => [[1, 3], [5, 6], [8, 10]]
 */
export const complementMultiIntervals = function(
    domain: [number, number], intervals: [number, number][]
): [number, number][] {
    const complements: [number, number][] = [];
    const mergedIntervals = unionIntervals(intervals);

    times(mergedIntervals.length + 1).forEach(
        (i) => {
            let toBePushed: [number, number];
            if (i === 0) {
                toBePushed = [domain[0], mergedIntervals[i]?.[0] ?? domain[1]];
            }
            else if (i === mergedIntervals.length) {
                toBePushed = [mergedIntervals[i - 1][1], domain[1]];
            }
            else {
                toBePushed = [mergedIntervals[i - 1][1], mergedIntervals[i][0]];
            }
            if (toBePushed[0] < toBePushed[1]) {
                complements.push(toBePushed);
            }
        }
    );

    return complements;
};

/**
 * Intervallumok egy adott intervallummal (domain) való metszete
 * @param {array} domain - Főintervallum
 * @param {array} intervals - Intervallumok
 * @return {array}
 * @example
 *  intersectionMultiIntervals([3, 10], [[1, 5], [1, 4], [8, 9], [12, 15]]) => [[3, 5], [8, 9]]
 */
export const intersectionMultiIntervals = function(
    domain: [number, number], intervals: [number, number][]
): [number, number][] {
    const intersections: [number, number][] = [];
    const mergedIntervals = unionIntervals(intervals);

    mergedIntervals.forEach(
        (int) => {
            const currentIntersection = intersectionIntervals(int, domain);
            if (currentIntersection) {
                intersections.push(currentIntersection);
            }
        }
    );

    return intersections;
};

/**
 * Tömb Map-pé alakítása (tömbindex lesz a key)
 * @param {array} array - tömb
 * @return {Map}
 */
export const arrayToMap = function<T>(array: T[]): Map<number, T> {
    return new Map(
        array.map(
            (elem, index) => [index, elem]
        )
    );
};

/**
 * Objektumokból álló tömbök kezelése
 */
export const ArrayOfObjects = {

    /**
     * Objektumokból álló tömb létrehozása id-k tömbjéből (egy property-vel való bővítés)
     * @param {object} param - paraméterek
     * @return {array} létrehozott tömb
     */
    expand: function<T>({
        from,
        source,
        plusProp,
        plusPropName = plusProp as string,
        identityProp = 'id' as keyof T
    } : {
        from: number[],
        source: T[],
        plusProp: keyof T,
        plusPropName?: string,
        identityProp?: keyof T
    }): { [key: string]: number | Partial<T> | null }[] {
        return from.map(
            (id: number) => ({
                [identityProp]: id,
                [plusPropName]: source.find((toItem: T) => toItem[identityProp] === id)?.[plusProp] ?? null
            })
        );
    },

    /**
     * Property-k szűkítése objektumokból álló tömbben
     * @param {array} fromArray - bemeneti tömb
     * @param {array<string>} remainingProps - megmaradó property-k
     * @return {array} létrehozott tömb
     */
    tight: function<T>(fromArray: T[], remainingProps: (keyof T)[]): Partial<T>[] {
        return fromArray.map(
            (item: T) => pick(item, remainingProps)
        );
    },

    /**
     * Egy adott property-ből álló tömb létrehozása objektumokból álló tömbből
     * @param {array} fromArray - bemeneti tömb
     * @param {string} remainingProp - megmaradó property
     * @return {array} létrehozott tömb
     */
    take: function<T>(fromArray: T[], remainingProp: keyof T): T[keyof T][] {
        return fromArray.map(
            (item: T) => item[remainingProp]
        );
    },

    /**
     * Egy adott property-ből álló tömb létrehozása objektumokból álló tömbből, ha az objektumnak csak egy property-je van
     * @param {array} fromArray - bemeneti tömb
     * @return {array} létrehozott tömb
     */
    takeOne: function<T, U>(fromArray: T[]): U[] {
        if (Array.isArray(fromArray) && fromArray.length > 0) {
            const remainingProp = Object.keys(fromArray[0] as Record<string, unknown>)[0];
            return fromArray.map(
                (item: T) => item[remainingProp as keyof T] as U
            );
        }
        else {
            return [];
        }
    },

    /**
     * A takeOne fordítottja
     * @param {array} fromArray - bemeneti tömb
     * @param {string} propName - lértehozandó property
     * @return {array} létrehozott tömb
     */
    reverseTakeOne: function<T>(fromArray: T[], propName: string): Record<typeof propName, T>[] {
        if (Array.isArray(fromArray) && fromArray.length > 0) {
            return fromArray.map(
                (item: T) => ({
                    [propName]: item
                })
            );
        }
        else {
            return [];
        }
    },

    /**
     * Sorrendezés property alapján
     * @param {array} fromArray - bemeneti tömb
     * @param {string} propName - rendezés alapja
     * @param {string} order - rendezés iránya
     * @return {array} létrehozott tömb
     */
    sort: function<T>(fromArray: T[], propName: keyof T, order: SortDirection = SortDirection.asc): T[] {
        return fromArray.sort(
            (item1, item2) => sortDescriptor(
                item1[propName], item2[propName], order
            )
        );
    },
    
    /**
     * Sorrendezés kiszámított érték alapján
     * @param {array} fromArray - bemeneti tömb
     * @param {function} calc - rendezés alapja
     * @param {string} order - rendezés iránya
     * @return {array} létrehozott tömb
     */
    sortByValue: function<T, U>(fromArray: T[], calc: (value: T) => U, order: SortDirection = SortDirection.asc): T[] {
        return fromArray.sort(
            (item1, item2) => sortDescriptor(
                calc(item1), calc(item2), order
            )
        );
    },

    /**
     * Keresés (elsö elemet adja vissza)
     * @param fromArray - bemeneti tömb
     * @param propName - keresés alapja
     * @param propValue - keresett érték
     * @return talált elem
     */
    find: function<T>(fromArray: T[], propName: keyof T, propValue: T[keyof T]): T | null {
        const result = fromArray.find(
            item => item[propName] === propValue
        );
        return result ?? null;
    },
    
    /**
     * Keresés (összes elemet visszaadja)
     * @param fromArray - bemeneti tömb
     * @param propName - keresés alapja
     * @param propValue - keresett érték
     * @return talált elem
     */
    findAll: function<T>(fromArray: T[], propName: keyof T, propValue: T[keyof T]): T[] {
        const founds: T[] = [];
        fromArray.forEach(
            item => {
                if (item[propName] === propValue) {
                    founds.push(item);
                }
            }
        );
        return founds;
    },

    /**
     * Duplikált elemek kiszedése (ahol a megadott property azonos)
     * @param {array} fromArray - bemeneti tömb
     * @param {number} propName - duplikálást definiáló property
     * @return {array} létrehozott tömb
     */
    unique: function<T>(fromArray: T[], propName: keyof T): T[] {
        return Array.from(new Map(fromArray.map(item => [item[propName], item])).values());
    },

    /**
     * Uniq tetszöleges számú property alapján
     * @param {array} fromArray - bemeneti tömb
     * @param {array} props - azonosságot jelölö property-k
     * @return {array} létrehozott tömb
     */
    multiUnique: function<T>(fromArray: T[], ...props: (keyof T)[]): T[] {
        return uniqBy(
            fromArray,
            (val) => props.reduce(
                (acc, curr) => acc += val[curr] + '|',
                ''
            )
        );
    },

    /**
     * Duplikált elemek összeszedése (ahol a megadott property azonos)
     * @param {array} fromArray - bemeneti tömb
     * @param {number} propName - duplikálást definiáló property
     * @return {array} létrehozott tömb
     */
    duplicatedElements: function<T>(fromArray: T[], propName: keyof T): T[] {
        type PropDataType = { index: number, value: T[keyof T] };
        const duplicates: T[] = [];
        const props: PropDataType[] = [];
        const foundIndexes: number[] = [];
        fromArray.forEach(
            (item, index) => {
                const foundIndexData = ArrayOfObjects.find<PropDataType>(props, 'value', item[propName]);
                if (foundIndexData) {
                    if (!foundIndexes.includes(foundIndexData.index)) {
                        foundIndexes.push(foundIndexData.index);
                        duplicates.push(fromArray[foundIndexData.index]);
                    }
                    duplicates.push(item);
                }
                props.push({ index, value: item[propName] });
            }
        );
        return duplicates;
    },

    /**
     * Duplikált elemek összeszedése (ahol a megadott property azonos)
     * // TODO: deprecated
     * @param list - bemeneti tömb
     * @param propName - azonosságot jelölö property
     * @return duplikált elemek tömbje
     * @deprecated helyette: ArrayOfObject.duplicatedElements()
     */
    _duplicatedElements: function<T>(fromArray: T[], propName: keyof T): T[keyof T][] {
        const uniqueElements: T[] = [];
        const duplicatedElementProps: T[keyof T][] = [];

        for (let i = 0; i < fromArray.length; i++) {
            const item = uniqueElements.find(element => element[propName] === fromArray[i][propName]);
            if (!item) {
                uniqueElements.push(fromArray[i]);
            } else {
                duplicatedElementProps.push(fromArray[i][propName]);
            }
        }

        return duplicatedElementProps;
    }

};

/**
 * SVG-k kezelése
 */
export const SVG = {

    /**
     * SVG elem létrehozasa url-ből
     * @param {object} svgUrl - svg url-je
     * @return {Promise<SVGSVGElement>}
     */
    urlToElement: function(svgUrl: string): Promise<SVGSVGElement | void> {
        const svgContainer = document.createElement('div');
        return fetch(
            svgUrl
        ).then(
            (response: Response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            }
        ).then(
            (svgCode: string) => {
                svgContainer.innerHTML = svgCode;
                return svgContainer.querySelector('svg') as SVGSVGElement;
            }
        ).catch(
            (error: Error) => {
                console.warn(error);
            }
        );
    },

    /**
     * SVG kód konvertálása SVG elemmé
     * @param {string} svgCode - svg elem kódja
     * @return {SVGSVGElement}
     */
    codeToElement: function(svgCode: string): SVGSVGElement {
        if (!svgCode) {
            throw 'SVG.codeToElement argument is null';
        }
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = svgCode;
        return svgContainer.querySelector('svg') as SVGSVGElement;
    },

    /**
     * SVG elem konvertálása base64 string-gé
     * @param {SVGSVGElement} svg - svg elem
     * @return {string} base64 kód
     */
    elementToBase64: function(svg: SVGSVGElement): string {
        // const encode = (str: string): string => Buffer.from(str, 'utf8').toString('base64');
        const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
        const base64SVG = encode(new XMLSerializer().serializeToString(svg));
        return `data:image/svg+xml;base64,${base64SVG}`;
    },

    /**
     * SVG elem konvertálása string-gé (nem base64)
     * @param {SVGSVGElement} svg - svg elem
     * @return {string} data url
     */
    elementToDataUrl: function(svg: SVGSVGElement): string {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg.outerHTML)}`;
    },

    /**
     * SVG data url konvertálása base64-el kódolt PNG-vé
     * @param {string} svgDataUrl - kódolt svg
     * @param {number} width - png szélessége
     * @return {Promise<string>} png data url
     */
    dataUrlToPng: function(svgDataUrl: string, width: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = function(): void {
                document.body.appendChild(img);
                const ratio = (img.clientWidth / img.clientHeight) || 1;
                document.body.removeChild(img);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = width / ratio;
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const data = canvas.toDataURL('image/png');
                resolve(data);
            };
            img.onerror = function(error: string | Event): void {
                reject(error);
            };
            img.src = svgDataUrl;
        });
    },

    /**
     * SVG elem konvertálása base64-el kódolt PNG-vé
     * @param {SVGSVGElement} svg - svg elem
     * @param {number} width - png szélessége
     * @return {Promise<string>} png data url
     * @async
     */
    elementToPng: function(svg: SVGSVGElement, width: number): Promise<string> {
        return new Promise((resolve, reject) => {
            // const { width, height } = svg.getBBox();
            const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
            if (!clonedSvg.getAttribute('xmlns')) {
                clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
            if (!clonedSvg.getAttribute('xmlns:xlink')) {
                clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            }
            const outerHTML = clonedSvg.outerHTML.replace(/aria-label=".*?"/g, 'aria-label=""');
            const blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' });
            const blobURL = URL.createObjectURL(blob);

            const img = document.createElement('img');
            img.onload = () => {
                document.body.appendChild(img);
                const ratio = (img.clientWidth / img.clientHeight) || 1;
                document.body.removeChild(img);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = width / ratio;
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const data = canvas.toDataURL('image/png');
                resolve(data);
            };
            img.onerror = function(error: string | Event): void {
                reject(error);
            };
            img.src = blobURL;
        });
    }

};

/**
 * Képek kezelése
 */
export const IMG = {

    /**
     * Kép url konvertalása base64-el kódolt képpé
     * @param {string} url - URL
     * @return {Promise<string>} data url
     */
    urlToBase64: function(url: string): Promise<string> {
        return new Promise(
            (resolve, reject) => {
                const img = document.createElement('img');
                img.onload = (_event: Event) => {
                    resolve(IMG.elementToBase64(img));
                };
                img.onerror = (event: string | Event) => {
                    reject(event);
                };
                img.src = url;
            }
        );
    },

    /**
     * IMG elem konvertálása base64 string-gé (png)
     * @param {HTMLImageElement} img - kép
     * @return {string} data url
     */
    elementToBase64: function(img: HTMLImageElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    },

    /**
     * Base64-gyel kódolt kép keparánya
     * @param {string} dataUrl - kódolt kép
     * @return {Promise<number>} képarány (w/h)
     */
    getRatio: function(dataUrl: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = function(): void {
                document.body.appendChild(img);
                const ratio = (img.clientWidth / img.clientHeight) || 1;
                document.body.removeChild(img);
                resolve(ratio);
            };
            img.onerror = function(error: string | Event): void {
                reject(error);
            };
            img.src = dataUrl;
        });
    },

    /**
     * Szín hexaérték -> rgb érték
     * @param {string} hex - hexaértek pl: '#0033ff' (röviddel is müködik, pl: '#03f')
     * @return {array<number>} rgb érték pl: [0, 51, 255]
     */
    hexToRgb: function(hex: string): [number, number, number] {
        return (
            hex
                .replace(
                    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
                    (_m, r, g, b) => '#' + r + r + g + g + b + b
                )
                .substring(1)
                .match(/.{2}/g) as string[]
        ).map(x => parseInt(x, 16)) as [number, number, number];
    },

    /**
     * Szín invertálása
     * @param {string} hex - szín
     * @param {boolean} bw - viszatérési érték csak fekete vagy fehér lehet
     * @return {string} invertált szín
     */
    invertColor: function(hex: string, bw: boolean): string {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        const [r, g, b] = [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ];
        if (bw) {
            // https://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000000' : '#FFFFFF';
        }
        const rStr = (255 - r).toString(16);
        const gStr = (255 - g).toString(16);
        const bStr = (255 - b).toString(16);
        return '#' + rStr.padStart(2, '0') + gStr.padStart(2, '0') + bStr.padStart(2, '0');
    }    

};

/**
 * Fájlok kezelése
 */
export const FILE = {

    /**
     *
     * @param {string} base64
     * @return {Blob}
     */
    base64ToBlob: function(base64: string): Blob {
        const binaryString = Buffer.from(base64, 'base64');
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        [...binaryString].forEach(
            (_char, i) => {
                bytes[i] = binaryString[i];
            }
        );
        return new Blob([bytes]);
    },

    /**
     * Fájl létrehozása és letöltés kényszerítése
     * @param {Blob | MediaSource} fileContent - fájl tartalma
     * @param {string} fileName - fájl neve
     */
    download: function(fileContent: Blob | MediaSource | string, fileName: string) {
        const link = document.createElement('a');
        link.href = isString(fileContent) ? fileContent : URL.createObjectURL(fileContent);
        link.download = fileName;
        link.click();
        link.remove();
    }

};

/**
 * Random string generálása (csak hexadecimális karaktereket generál)
 * @param {number} length - hossz
 * @return {string}
 */
export const generateString = function(length: number): string {
    const arr = new Uint8Array(length / 2);
    crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => dec.toString(16).padStart(2, '0')).join('');
};

/**
 * Típusos Object.keys()
 * @param obj
 * @return
 */
export const objectKeys = function<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
};

/**
 * Típusos Object.entries()
 * @param obj
 * @return
 */
export const objectEntries = function<K extends string | number | symbol, V>(
    obj: Record<K, V>
): [K, V][] {
    return Object.entries<V>(obj) as [K, V][];
};

/**
 * A haystack tömb tartalmazza-e a needle összes elemét
 * @param {array} haystack
 * @param {array} needle
 * @return
 */
export const includesAll = function<T>(haystack: T[], needle: T[]): boolean {
    return needle.every(
        item => haystack.includes(item)
    );
};

/**
 * Array.propotype.splice törlési funkciójának immutable változata
 * @param {array} array - tömb
 * @param {number} index - törlendő elem indexe
 * @return tömb az elem nélkül
 */
export const removeAt = function<T>(array: T[], index: number): T[] {
    const copied = [...array];
    copied.splice(index, 1);
    return copied;
};

/**
 * Objektum kulcsainak map-pelése (a mapObject value-ja lesz az új kulcs)
 * @param {object} raw - eredeti objektum
 * @param {object} mapObject - új kulcsok
 * @return {object} map-pelt objektum
 */
export const mapper = function<From, To>(raw: From, mapObject: Record<string, string>): To {
    return Object.entries(mapObject).reduce(
        (acc: Partial<To>, [key, value]: [string, string]) => ({
            ...acc,
            [value]: raw[key as keyof From]
        }), { }
    ) as To;
};

/**
 * Objektum kulcsainak map-pelése fordított irányba (a mapObject key-e lesz az új kulcs)
 * @param {object} raw - eredeti objektum
 * @param {object} mapObject - új kulcsok
 * @return {object} map-pelt objektum
 */
export const reverseMapper = function<From, To>(raw: From, mapObject: Record<string, string>): To {
    return Object.entries(mapObject).reduce(
        (acc: Partial<To>, [key, value]: [string, string]) => ({
            ...acc,
            [key]: raw[value as keyof From]
        }), { }
    ) as To;
};

/**
 * Animáció futtatása
 * @param {number} speed - animáció sebessége (px/sec)
 * @param {function} operation - animáció minden lépésében lefutó függvény, ha false a visszatérési értéke, az animáció leáll
 * @example
 *  animate(200, current => {
 *      ctx.clearRect(0, 0, canvas.width, canvas.height);
 *      ctx.fillRect(current, 20, 100, 100);
 *      return current < 500;
 *  }).then(
 *      current => {
 *          console.info(current);
 *      }
 *  ).catch(
 *      error => {
 *          console.error(error);
 *      }
 *  );
 */
export const animate = function(speed: number, operation: (count: number) => boolean): Promise<number> {
    let start: number | null = null;
    let id: number;

    return new Promise((resolve) =>{
        const step = (timeStamp: number) => {
            if (!start) {
                start = timeStamp;
            }
            const elapsed = timeStamp - start;
            const count = speed / 1000 * elapsed;

            const continueAnimation = operation(count);

            if (continueAnimation) {
                id = requestAnimationFrame(step);
            }
            else {
                cancelAnimationFrame(id);
                resolve(count);
            }
        };

        id = requestAnimationFrame(step);
    });
};
