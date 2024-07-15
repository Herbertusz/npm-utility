import { ReactElement, ReactNode } from 'react';
import { Route, RouteProps } from 'react-router-dom';

interface LoopProps {
    for?: number;
    forEach?: unknown[];
    forOf?: Iterable<unknown>;
    forIn?: Record<string, unknown>;
    children: (...args: any[]) => ReactNode;
}

/**
 * Ciklusvezérlő komponens
 * @param {LoopProps} props - bejárandó objektum vagy ismétlések száma
 * @return {ReactElement}
 * @example
 *  <Loop for={5}>
 *      {n => (
 *          <li key={n}>{n}</li>
 *      )}
 *  </Loop>
 *  <Loop forEach={array}>
 *      {(item, index) => (
 *          <li key={item.id}>{item}</li>
 *      )}
 *  </Loop>
 *  <Loop forOf={iterable}>
 *      {item => (
 *          <li key={item.id}>{item}</li>
 *      )}
 *  </Loop>
 *  <Loop forIn={object}>
 *      {(value, key) => (
 *          <li key={key}>{key}: {value}</li>
 *      )}
 *  </Loop>
 */
export const Loop = function(props: LoopProps): ReactElement {
    const items = [];
    if (props.for) {
        for (let i = 0; i < props.for; i++) {
            items.push(props.children(i));
        }
    }
    else if (props.forEach) {
        props.forEach.forEach(
            (item, index) => {
                items.push(props.children(item, index));
            }
        );
    }
    else if (props.forOf) {
        for (const item of props.forOf) {
            items.push(props.children(item));
        }
    }
    else if (props.forIn) {
        for (const key in props.forIn) {
            items.push(props.children(props.forIn[key], key));
        }
    }
    return <>{items}</>;
};

/**
 * Inline HTML kód beszúrása
 * @param {object} props
 * @return {ReactElement}
 * @example
 *  <div><Html>{htmlCode}</Html></div>
 *  <div><Html className="big" title="text">{htmlCode}</Html></div>
 */
export const Html = function(props: React.HTMLAttributes<Element>): ReactElement {
    return <span dangerouslySetInnerHTML={{ __html: props.children as string }} {...omit(props, 'children')}></span>;
};

/**
 * Blokkos HTML kód beszúrása
 * @param {object} props
 * @return {ReactElement}
 * @example
 *  <div><HtmlBlock>{htmlCode}</HtmlBlock></div>
 *  <div><HtmlBlock className="big" title="text">{htmlCode}</HtmlBlock></div>
 */
export const HtmlBlock = function(props: React.HTMLAttributes<Element>): ReactElement {
    return <div dangerouslySetInnerHTML={{ __html: props.children as string }} {...omit(props, 'children')}></div>;
};

/**
 * Segédfüggvény css class-ok hozzáadásához
 * @param {...string} classList - class-ok
 * @return {string} szóközökkel összefűzött lista
 * @example
 *  <div className={cx(css.logo, css.big, 'col-1')}>
 */
export const cx = function(...classList: Array<string | false | undefined | null>): string {
    return classList.filter(element => !!element).join(' ');
};

/**
 *
 * @param param
 * @return
 */
export const GuardedRoute = function({
    component, auth, ...rest
}: {
    component: JSX.Element, auth: boolean, rest: RouteProps
}) {
    return (
        <Route {...rest} element={auth ? component : <NotFound/>} />
    );
};
