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

    function uidFactory() {
        let id = 0;
        return () => {
            const temp = id;
            id += 1;
            return temp;
        };
    }

    function getMouse(e) {
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    function add(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
        };
    }
    function sub(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
        };
    }

    function translate(elem, {x, y}) {
        elem.setAttribute("transform", `translate(${x} ${y})`);
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
            let nb = create("rect", false, {
                class: "node-body",
                x: -opts.width/2, 
                y: -opts.height/2,
                width: opts.width,
                height: opts.height
            });
            g.appendChild(nb);

            const in_spacing  = state.const.connect_spacing[opts.in - 1];
            const out_spacing = state.const.connect_spacing[opts.out - 1];

            // Inputs
            const c_in = [];
            for (let i = 0; i < opts.in; i++) {
                let c = create("circle", false, {
                    class: "in-connect",
                    cx: -opts.width/2, 
                    cy: in_spacing[i],
                    r: state.const.connect_rad
                });
                c_in.push(c);
                g.appendChild(c);
            }

            // Outputs
            const c_out = [];
            for (let i = 0; i < opts.out; i++) {
                let c = create("circle", false, {
                    class: "out-connect",
                    cx: opts.width/2, 
                    cy: out_spacing[i],
                    r: state.const.connect_rad
                });
                c_out.push(c);
                g.appendChild(c);
            }

            return {g, nb, c_in, c_out};
        };
    }

    function render(state) {

        // For each node 
        for (let k in state.nodes) {
            let ns = state.nodes[k];

            // Create if necessary
            if (ns.ref === null) {
                const {g, nb, c_in, c_out} = state.helper.createNode(false, ns.opts);
                ns.ref = g;
                for (let conn of c_in) {
                    let cid = state.uid();
                    ns.in[cid] = {ref: conn};
                }
                for (let conn of c_out) {
                    let cid = state.uid();
                    ns.out[cid] = {ref: conn};
                }
                nb.addEventListener("mousedown", () => {
                    ns.mousedown(state, k);
                });
                nb.addEventListener("mouseup", () => {
                    ns.mouseup(state);
                });
                state.svg.appendChild(g);
            }

            // Sync node positon
            translate(ns.ref, {x: ns.opts.x, y: ns.opts.y});
        }
    }

    function main() {
        const height = document.body.clientHeight;
        const width  = document.body.clientWidth;

        const svg = qs("svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewport", `0 0 ${width} ${height}`);

        const connect_rad = 20;
        const uid = uidFactory();
        const state = {
            /* 
            nodes: {
                key: {
                    opts: {},
                    in: {key: {state:, ref: null}},
                    out: {key: {state:, ref: null}},
                    ref: null
                }
            } */
            nodes: {},
            mouse: null,
            selected_node: null,
            selected_offset: {x: null, y: null},
            uid: uid,
            const: {
                node_width: 250,
                node_height: 250,
                connect_rad: connect_rad,
                connect_spacing: [
                    [0],
                    [-3 * connect_rad, 3 * connect_rad],
                    [-3 * connect_rad, 0, 3 * connect_rad]
                ]
            },
            svg: svg
        };

        const create     = createFactory(state, svg);
        const createNode = createNodeFactory(state, create);
        state.helper = {create, createNode};

        press("c", () => {
            const m = state.mouse;
            if (m !== null) {
                const nid = state.uid();
                state.nodes[nid] = {
                    opts: {
                        x: m.x,
                        y: m.y,
                        in: 1,
                        out: 2
                    },
                    in: {},
                    out: {},
                    ref: null,
                    mousedown: (state, nid) => {
                        const m = state.mouse;
                        const opts = state.nodes[nid].opts;
                        state.selected_node = nid;
                        state.selected_offset = sub({x: opts.x, y: opts.y}, m);
                    },
                    mouseup: (state) => {
                        state.selected_node = null;
                        state.selected_offset = null;
                    }
                };
                render(state);
            }
        });

        window.addEventListener("mousemove", (e) => {
            state.mouse = getMouse(e);

            if (state.selected_node !== null) {
                const opts = state.nodes[state.selected_node].opts;
                const newPos = add(state.mouse, state.selected_offset);
                opts.x = newPos.x;
                opts.y = newPos.y;
            }

            render(state);
        });

        // init
        render(state);
    }

    main();
})();