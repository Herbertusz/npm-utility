/**
 * @example
 *  const status1 = document.getElementById('status1');
 *  const status2 = document.getElementById('status2');
 *  
 *  const idle = idleHandler(3000);
 *  const observer1 = idle.subscribe(
 *      (active) => {
 *          status1?.classList.add(active ? 'active' : 'inactive');
 *          status1?.classList.remove(active ? 'inactive' : 'active');
 *      }
 *  );
 *  const observer2 = idle.subscribe(
 *      (active) => {
 *          status2?.classList.add(active ? 'active' : 'inactive');
 *          status2?.classList.remove(active ? 'inactive' : 'active');
 *      }
 *  );
 *  setTimeout(() => {
 *      idle.unsubscribe(observer1);
 *      status1?.classList.remove('active', 'inactive');
 *  }, 20000);
 */
export const idleHandler = function(timeout: number) {

    let timer = 0;
    let timerRunning = false;
    const observers: ((status: boolean) => void)[] = [];
    let active = false;

    waiting();
    ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart', 'touchmove'].forEach(
        (eventName) => {
            document.addEventListener(eventName, (_event) => {
                if (!active) {
                    active = true;
                    notify(true);
                }
                clearTimeout(timer);
                timerRunning = false;
                waiting();
            });
        }
    );

    function waiting() {
        if (!timerRunning) {
            timerRunning = true;
            timer = window.setTimeout(() => {
                active = false;
                notify(false);
            }, timeout);
        }
    }

    function notify(status: boolean) {
        observers.forEach(
            (observer) => {
                if (typeof observer === 'function') {
                    observer(status);
                }
            }
        );
    }

    return {

        subscribe(statusHandler: (status: boolean) => void) {
            observers.push(statusHandler);
            statusHandler(active);
            return observers.length - 1;
        },

        unsubscribe(observerIndex: number) {
            delete observers[observerIndex];
        }

    };

};
