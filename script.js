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

    function wireGetNotNull(state, wid) {
        if (wid in state.wires) {
            const w = state.wires[wid];
            return (w.from_out === null) ? w.to_in : w.from_out;    
        }
        return null;
    }

    function createNodeFactory(state, create) {
        return (add, nodeState) => {
            const opts = {...nodeState.opts, ...{
                    width: state.const.node_width, 
                    height: state.const.node_height
                }
            };
            
            // Node group (container)
            let g = create("g", add, {
                transform: `translate(${opts.x} ${opts.y})`
            });
            nodeState.ref = g;

            // Node background
            let nb = create("rect", false, {
                class: "node-body",
                x: -opts.width/2, 
                y: -opts.height/2,
                width: opts.width,
                height: opts.height
            });
            nb.addEventListener("mousedown", () => {
                const m = state.mouse;
                const uid = nodeState.uid;
                state.selected_node = uid;
                state.selected_offset = sub(
                    {
                        x: state.nodes[uid].opts.x, 
                        y: state.nodes[uid].opts.y}, 
                    m
                );
            });
            nb.addEventListener("mouseup", () => {
                state.selected_node = null;
                state.selected_offset = null;
            });
            g.appendChild(nb);

            const in_spacing  = state.const.connect_spacing[opts.in - 1];
            const out_spacing = state.const.connect_spacing[opts.out - 1];

            nodeState.in = {};
            nodeState.out = {};

            // Inputs
            const c_in = [];
            for (let i = 0; i < opts.in; i++) {
                const cid = state.helper.getUid();
                let c = create("circle", false, {
                    class: "in-connect",
                    cx: -opts.width/2, 
                    cy: in_spacing[i],
                    r: state.const.connect_rad
                });
                nodeState.in[cid] = {ref: c};
                c.addEventListener("mousedown", () => {
                    const wid = state.helper.getUid();
                    state.selected_node = wid;
                    state.wires[wid] = {
                        uid: wid,
                        from_out: null,
                        to_in: cid
                    };
                });
                c.addEventListener("mouseup", () => {
                    if (state.selected_node !== null) {
                        const at = nodeType(
                            state, 
                            wireGetNotNull(state, state.selected_node)
                        );
                        if (at === "IN" || at === "OUT") {
                            const wid = state.selected_node;
                            const bt = nodeType(state, cid);
                            if (at !== bt) {
                                state.wires[wid].to_in = cid;
                            }
                        }
                        state.selected_node = null;
                    }
                });
                g.appendChild(c);
            }

            // Outputs
            const c_out = {};
            for (let i = 0; i < opts.out; i++) {
                const cid = state.helper.getUid();
                let c = create("circle", false, {
                    class: "out-connect",
                    cx: opts.width/2, 
                    cy: out_spacing[i],
                    r: state.const.connect_rad
                });
                nodeState.out[cid] = {ref: c};
                c.addEventListener("mousedown", () => {
                    const wid = state.helper.getUid();
                    state.selected_node = wid;
                    state.wires[wid] = {
                        uid: wid,
                        from_out: cid,
                        to_in: null
                    };
                });
                c.addEventListener("mouseup", () => {
                    if (state.selected_node !== null) {
                        const at = nodeType(
                            state, 
                            wireGetNotNull(state, state.selected_node)
                        ); 
                        if (at === "IN" || at === "OUT") {
                            const wid = state.selected_node;
                            const bt = nodeType(state, cid);
                            if (at !== bt) {
                                state.wires[wid].from_out = cid;
                            }
                        }
                        state.selected_node = null;
                    }
                });
                g.appendChild(c);
            }

            return g;
        };
    }

    function posFromConnect(cRef) {
        return {
            x: parseFloat(cRef.getAttribute("cx")),
            y: parseFloat(cRef.getAttribute("cy"))
        };
    }

    function getWirePos(state, cid) {
        for (let k in state.nodes) {
            const n = state.nodes[k];
            const nid = n.uid;
            if (cid in n.in) {
                const cPos = add(
                   {x: n.opts.x, y: n.opts.y},
                   posFromConnect(n.in[cid].ref)
                );
                return cPos;
            }
            if (cid in n.out) {
                const cPos = add(
                   {x: n.opts.x, y: n.opts.y},
                   posFromConnect(n.out[cid].ref)
                );
                return cPos;
            }
        }
        const m = state.mouse;
        return m;
    }

    function createWireFactory(state, create) {
        return (add, wireState) => {

            const fromOutPos = getWirePos(state, wireState.from_out);
            const toInPos    = getWirePos(state, wireState.to_in);

            const w = create("line", add, {
                class: "wire",
                x1: fromOutPos.x,
                y1: fromOutPos.y,
                x2: toInPos.x,
                y2: toInPos.y
            });
            wireState.ref = w;
            return w;
        };
    }

    function render(state) {

        // For each node 
        for (let k in state.nodes) {
            let ns = state.nodes[k];

            // Create
            if (!("ref" in ns)) {
                const g = state.helper.createNode(false, ns);
                state.svg.appendChild(g);
            }

            // Sync
            translate(ns.ref, {x: ns.opts.x, y: ns.opts.y});
        }

        for (let k in state.wires) {
            let ws = state.wires[k];

            // Create
            if (!("ref" in ws)) {
                const w = state.helper.createWire(false, ws);
                state.svg.appendChild(w);
            }

            // Sync
            const fromOutPos = getWirePos(state, ws.from_out);
            const toInPos    = getWirePos(state, ws.to_in);
            ws.ref.setAttribute("x1", fromOutPos.x);
            ws.ref.setAttribute("y1", fromOutPos.y);
            ws.ref.setAttribute("x2", toInPos.x);
            ws.ref.setAttribute("y2", toInPos.y);
        }
    }

    function nodeType(state, uid) {
        if (uid in state.nodes) {
            return "NODE";
        
        } else {
            for (let n in state.nodes) {
                const c_in = state.nodes[n].in;
                const c_out = state.nodes[n].out;
                if (uid in c_in) {
                    return "IN";

                } else if (uid in c_out) {
                    return "OUT";
                }
            }
        }
        return null;
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
            
            /*
            wires: {
                key: {
                    ref: null,
                    from_out: key,
                    to_in: key
                }
            } */
            wires: {},

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
        const createWire = createWireFactory(state, create);
        state.helper = {createWire, createNode, getUid: uid};

        press("c", () => {
            const m = state.mouse;
            if (m !== null) {
                const nid = state.helper.getUid();
                state.nodes[nid] = {
                    uid: nid,
                    opts: {
                        x: m.x,
                        y: m.y,
                        in: 1,
                        out: 2
                    }
                };
                render(state);
            }
        });

        window.addEventListener("mousemove", (e) => {
            state.mouse = getMouse(e);
            
            if (state.selected_node !== null) {
                if (nodeType(state, state.selected_node) === "NODE") {
                    const opts = state.nodes[state.selected_node].opts;
                        const newPos = add(state.mouse, state.selected_offset);
                        opts.x = newPos.x;
                        opts.y = newPos.y;
                }
            }

            render(state);
        });

        // init
        render(state);
    }

    main();
})();