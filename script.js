(() => {

    function qs(selector) {
        return document.querySelector(selector);
    }

    function press(key, func) {
        window.addEventListener("keypress", (e) => {
            if (key === e.key) {
                func(e);
            }
        });
    }

    function createFactory(svg) {
        return (name, add, opts) => {
            const ns = "http://www.w3.org/2000/svg";
            const elem = document.createElementNS(ns, name);
            for (let k in opts) {
                elem.setAttribute(k, opts[k]);
            }
            if (add) {
                svg.appendChild(elem);
            }
        }
    }

    function main() {
        const height = document.body.clientHeight;
        const width = document.body.clientWidth;

        const svg = qs("svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewport", `0 0 ${width} ${height}`);

        const create = createFactory(svg);

        press("c", (e) => {
            create("rect", true, {
                x: 50, 
                y: 50,
                width: 100,
                height: 100,
                fill: "salmon"
            });
        });
    }

    main();
})();