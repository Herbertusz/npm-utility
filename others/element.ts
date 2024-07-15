interface Coord {
    x: number;
    y: number;
}

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Egér pozíciója egy elemhez képest
 * @param {Event} event - egérhez kapcsolódó esemény
 * @param {HTMLElement} [elem=document.body] - egy DOM elem
 * @return {Coord} egérpozíció
 * @description
 *  return = {
 *      x: Number,
 *      y: Number
 *  }
 */
export const getMousePosition = function(
    event: MouseEvent, elem: HTMLElement | null | undefined = document.body
): Coord {
    const offset = {
        x: elem?.offsetLeft && !Number.isNaN(elem?.offsetLeft) ? elem?.offsetLeft : 0,
        y: elem?.offsetLeft && !Number.isNaN(elem?.offsetTop) ? elem?.offsetTop : 0
    };

    while ((elem = elem?.offsetParent as HTMLElement)) {
        offset.x += !Number.isNaN(elem.offsetLeft) ? elem.offsetLeft : 0;
        offset.y += !Number.isNaN(elem.offsetTop) ? elem.offsetTop : 0;
    }

    return {
        x: event.pageX - offset.x,
        y: event.pageY - offset.y
    };
};

/**
 * Elem mérete és pozíciója a document-hez képest
 * @param {String} [type='border'] - a box-model elemeinek beleszámítása ('content'|'padding'|'border'|'margin')
 * @param {Boolean} [calculateRotate=false] - elforgatás esetén a befoglaló téglalap adatainak visszaadása
 * @return {Rect} pozíció és méret
 * @description
 *  return = {
 *      x: Number,
 *      y: Number,
 *      w: Number,
 *      h: Number
 *  }
 */
export const getDimensions = function({
    element,
    type = 'border',
    calculateScroll = false,
    calculateRotate = false
}: {
    element: HTMLElement,
    type: 'content' | 'padding' | 'border' | 'margin',
    calculateScroll: boolean,
    calculateRotate: boolean
}): Rect {
    let rect;
    let offset = { x: 0, y: 0 };
    if (calculateScroll){
        offset = {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }
    if (calculateRotate){
        rect = element.getBoundingClientRect();
    }
    else {
        rect = element.getBoundingClientRect();
        rect = {
            left: element.offsetLeft,
            top: element.offsetTop,
            width: element.offsetWidth,
            height: element.offsetHeight
        };
    }
    const getStyle = function(prop: string): number {
        const size = window.getComputedStyle(element).getPropertyValue(prop);
        if (/^\d+px$/.test(size)) {
            return Number(size.substring(0, size.length - 2));
        }
        else {
            return 0;
        }
    };
    const result = {
        content: {
            x: rect.left + offset.x + getStyle('border-left') + getStyle('padding-left'),
            y: rect.top + offset.y + getStyle('border-top') + getStyle('padding-top'),
            w: rect.width - getStyle('border-left') - getStyle('border-right') -
                getStyle('padding-left') - getStyle('padding-right'),
            h: rect.height - getStyle('border-top') - getStyle('border-bottom') -
                getStyle('padding-top') - getStyle('padding-bottom')
        },
        padding: {
            x: rect.left + offset.x + getStyle('border-left'),
            y: rect.top + offset.y + getStyle('border-top'),
            w: rect.width - getStyle('border-left') - getStyle('border-right'),
            h: rect.height - getStyle('border-top') - getStyle('border-bottom')
        },
        border: {
            x: rect.left + offset.x,
            y: rect.top + offset.y,
            w: rect.width,
            h: rect.height
        },
        margin: {
            x: rect.left + offset.x - getStyle('margin-left'),
            y: rect.top + offset.y - getStyle('margin-top'),
            w: rect.width + getStyle('margin-left') + getStyle('margin-right'),
            h: rect.height + getStyle('margin-top') + getStyle('margin-bottom')
        }
    };
    return result[type];
};

/**
 * Jobb gomb tiltása egy adott elemen
 * @param {HTMLElement} element - az adott elem
 */
export const rightClickProtection = function(element: HTMLElement) {
    element.addEventListener('mouseup', (event) => {
        if (event.button === 2) {
            event.preventDefault();
            event.stopPropagation();
        }
    });
    element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
};

/**
 * Kijelölés tiltása egy adott elemen
 * @param {HTMLElement} element - az adott elem
 */
export const selectProtection = function(element: HTMLElement) {
    element.addEventListener('selectstart', (event) => {
        event.preventDefault();
    });
    element.setAttribute('unselectable', 'on');
    element.style.userSelect = 'none';
};
