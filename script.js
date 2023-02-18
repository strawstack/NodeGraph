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

    function createFactory(state, svg) {
        return (name, add, opts) => {
            const ns = "http://www.w3.org/2000/svg";
            const elem = document.createElementNS(ns, name);
            for (let k in opts) {
                elem.setAttribute(k, opts[k]);
            }
            if (add) {
                svg.appendChild(elem);
            }
            return elem;
        }
    }

    function createNodeFactory(state, create) {
        return (add, opts) => {
            opts = {...opts, ...{
                    width: state.const.node_width, 
                    height: state.const.node_height
                }
            };
            
            // Node group (container)
            let g = create("g", add, {
                transform: `translate(${opts.x} ${opts.y})`
            });

            // Node background
            let r = create("rect", false, {
                class: "node-body",
                x: -opts.width/2, 
                y: -opts.height/2,
                width: opts.width,
                height: opts.height
            });
            g.appendChild(r);

            const in_spacing = state.const.connect_spacing[opts.in - 1];
            const out_spacing = state.const.connect_spacing[opts.out - 1];

            // Inputs
            for (let i = 0; i < opts.in; i++) {
                let c = create("circle", false, {
                    class: "in-connect",
                    cx: -opts.width/2, 
                    cy: in_spacing[i],
                    r: state.const.connect_rad
                });
                g.appendChild(c);
            }

            // Outputs
            for (let i = 0; i < opts.out; i++) {
                let c = create("circle", false, {
                    class: "out-connect",
                    cx: opts.width/2, 
                    cy: out_spacing[i],
                    r: state.const.connect_rad
                });
                g.appendChild(c);
            }

            
        };
    }

    function main() {
        const height = document.body.clientHeight;
        const width  = document.body.clientWidth;

        const svg = qs("svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewport", `0 0 ${width} ${height}`);

        const connect_rad = 20;
        const state = {
            const: {
                node_width: 250,
                node_height: 250,
                connect_rad: connect_rad,
                connect_spacing: [
                    [0],
                    [-3 * connect_rad, 3 * connect_rad],
                    [-3 * connect_rad, 0, 3 * connect_rad]
                ]
            }
        };

        const create     = createFactory(state, svg);
        const createNode = createNodeFactory(state, create);

        press("c", (e) => {
            /*
            createNode(true, {
                x: 100,
                y: 100
            }); */
        });

        createNode(true, {
            x: 284,
            y: 321,
            in: 1,
            out: 2
        });
    }

    main();
})();