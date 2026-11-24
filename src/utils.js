export function waitForElement(selector, callback) {
    const exisitng = document.querySelector(selector);

    if (exisitng) {
        callback(exisitng);
        return;
    }

    const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);

        if (element) {
            observer.disconnect();
            callback(element);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}