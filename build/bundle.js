
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Home.svelte generated by Svelte v3.24.1 */

    function create_fragment(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Home");
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Buttons.svelte generated by Svelte v3.24.1 */

    const file = "src/Buttons.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let code0;
    	let a0;
    	let t2;
    	let div1;
    	let code1;
    	let a1;
    	let t5;
    	let h20;
    	let t7;
    	let pre;
    	let code2;
    	let t9;
    	let h21;
    	let t11;
    	let div3;
    	let button0;
    	let t13;
    	let button1;
    	let t15;
    	let button2;
    	let t17;
    	let button3;
    	let t19;
    	let button4;
    	let t21;
    	let button5;
    	let t23;
    	let h22;
    	let t25;
    	let div4;
    	let button6;
    	let html_tag;
    	let t26;
    	let t27;
    	let button7;
    	let html_tag_1;
    	let t28;
    	let t29;
    	let button8;
    	let html_tag_2;
    	let t30;
    	let t31;
    	let div5;
    	let button9;
    	let t32;
    	let html_tag_3;
    	let t33;
    	let button10;
    	let t34;
    	let html_tag_4;
    	let t35;
    	let button11;
    	let t36;
    	let html_tag_5;
    	let t37;
    	let h23;
    	let t39;
    	let div6;
    	let button12;
    	let t41;
    	let button13;
    	let t43;
    	let button14;
    	let t45;
    	let button15;
    	let t47;
    	let h24;
    	let t49;
    	let div7;
    	let button16;
    	let t51;
    	let button17;
    	let t53;
    	let button18;
    	let t55;
    	let button19;
    	let html_tag_6;
    	let t56;
    	let t57;
    	let button20;
    	let t59;
    	let button21;
    	let t61;
    	let div8;
    	let button22;
    	let t63;
    	let button23;
    	let t65;
    	let button24;
    	let t67;
    	let button25;
    	let html_tag_7;
    	let t68;
    	let t69;
    	let button26;
    	let t71;
    	let button27;
    	let t73;
    	let h25;
    	let t75;
    	let div9;
    	let button28;
    	let t77;
    	let button29;
    	let t79;
    	let button30;
    	let t81;
    	let button31;
    	let html_tag_8;
    	let t82;
    	let t83;
    	let button32;
    	let t85;
    	let button33;
    	let t87;
    	let div10;
    	let button34;
    	let t89;
    	let button35;
    	let t91;
    	let button36;
    	let t93;
    	let button37;
    	let html_tag_9;
    	let t94;
    	let t95;
    	let button38;
    	let t97;
    	let button39;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			code0 = element("code");
    			code0.textContent = "GIT: ";
    			a0 = element("a");
    			a0.textContent = "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/buttons.css";
    			t2 = space();
    			div1 = element("div");
    			code1 = element("code");
    			code1.textContent = "CDN: ";
    			a1 = element("a");
    			a1.textContent = "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/buttons.css";
    			t5 = space();
    			h20 = element("h2");
    			h20.textContent = "Classes";
    			t7 = space();
    			pre = element("pre");
    			code2 = element("code");

    			code2.textContent = `${`<button [disabled] class="button
  [large|big|regular|medium|small|tiny]
  [red|green|blue]
  [outlined]
  [pending]
  [icon-left|icon-right]
  [on-dark]">Button</button>`}`;

    			t9 = space();
    			h21 = element("h2");
    			h21.textContent = "Sizes";
    			t11 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Large";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Big";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "Regular";
    			t17 = space();
    			button3 = element("button");
    			button3.textContent = "Medium";
    			t19 = space();
    			button4 = element("button");
    			button4.textContent = "Small";
    			t21 = space();
    			button5 = element("button");
    			button5.textContent = "Tiny";
    			t23 = space();
    			h22 = element("h2");
    			h22.textContent = "Icons";
    			t25 = space();
    			div4 = element("div");
    			button6 = element("button");
    			t26 = text("Default");
    			t27 = space();
    			button7 = element("button");
    			t28 = text("Colored");
    			t29 = space();
    			button8 = element("button");
    			t30 = text("Outlined");
    			t31 = space();
    			div5 = element("div");
    			button9 = element("button");
    			t32 = text("Default");
    			t33 = space();
    			button10 = element("button");
    			t34 = text("Colored");
    			t35 = space();
    			button11 = element("button");
    			t36 = text("Outlined");
    			t37 = space();
    			h23 = element("h2");
    			h23.textContent = "States";
    			t39 = space();
    			div6 = element("div");
    			button12 = element("button");
    			button12.textContent = "Default";
    			t41 = space();
    			button13 = element("button");
    			button13.textContent = "Current";
    			t43 = space();
    			button14 = element("button");
    			button14.textContent = "Disabled";
    			t45 = space();
    			button15 = element("button");
    			button15.textContent = "Pending";
    			t47 = space();
    			h24 = element("h2");
    			h24.textContent = "Colors";
    			t49 = space();
    			div7 = element("div");
    			button16 = element("button");
    			button16.textContent = "Red";
    			t51 = space();
    			button17 = element("button");
    			button17.textContent = "Green";
    			t53 = space();
    			button18 = element("button");
    			button18.textContent = "Blue";
    			t55 = space();
    			button19 = element("button");
    			t56 = text("Icon");
    			t57 = space();
    			button20 = element("button");
    			button20.textContent = "Disabled";
    			t59 = space();
    			button21 = element("button");
    			button21.textContent = "Pending";
    			t61 = space();
    			div8 = element("div");
    			button22 = element("button");
    			button22.textContent = "Red";
    			t63 = space();
    			button23 = element("button");
    			button23.textContent = "Green";
    			t65 = space();
    			button24 = element("button");
    			button24.textContent = "Blue";
    			t67 = space();
    			button25 = element("button");
    			t68 = text("Icon");
    			t69 = space();
    			button26 = element("button");
    			button26.textContent = "Disabled";
    			t71 = space();
    			button27 = element("button");
    			button27.textContent = "Pending";
    			t73 = space();
    			h25 = element("h2");
    			h25.textContent = "Outline";
    			t75 = space();
    			div9 = element("div");
    			button28 = element("button");
    			button28.textContent = "Red";
    			t77 = space();
    			button29 = element("button");
    			button29.textContent = "Green";
    			t79 = space();
    			button30 = element("button");
    			button30.textContent = "Blue";
    			t81 = space();
    			button31 = element("button");
    			t82 = text("Icon");
    			t83 = space();
    			button32 = element("button");
    			button32.textContent = "Disabled";
    			t85 = space();
    			button33 = element("button");
    			button33.textContent = "Pending";
    			t87 = space();
    			div10 = element("div");
    			button34 = element("button");
    			button34.textContent = "Red";
    			t89 = space();
    			button35 = element("button");
    			button35.textContent = "Green";
    			t91 = space();
    			button36 = element("button");
    			button36.textContent = "Blue";
    			t93 = space();
    			button37 = element("button");
    			t94 = text("Icon");
    			t95 = space();
    			button38 = element("button");
    			button38.textContent = "Disabled";
    			t97 = space();
    			button39 = element("button");
    			button39.textContent = "Pending";
    			add_location(code0, file, 11, 9, 604);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/buttons.css");
    			add_location(a0, file, 11, 27, 622);
    			add_location(div0, file, 11, 4, 599);
    			add_location(code1, file, 12, 9, 817);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/buttons.css");
    			add_location(a1, file, 12, 27, 835);
    			add_location(div1, file, 12, 4, 812);
    			attr_dev(div2, "class", "svelte-dx1exw");
    			add_location(div2, file, 10, 0, 589);
    			attr_dev(h20, "class", "heading svelte-dx1exw");
    			add_location(h20, file, 14, 0, 1036);
    			attr_dev(code2, "class", "css");
    			add_location(code2, file, 16, 23, 1093);
    			attr_dev(pre, "class", "dark code svelte-dx1exw");
    			add_location(pre, file, 16, 0, 1070);
    			attr_dev(h21, "class", "heading svelte-dx1exw");
    			add_location(h21, file, 26, 0, 1302);
    			attr_dev(button0, "class", "large button svelte-dx1exw");
    			add_location(button0, file, 29, 1, 1357);
    			attr_dev(button1, "class", "big button svelte-dx1exw");
    			add_location(button1, file, 30, 1, 1402);
    			attr_dev(button2, "class", "regular button svelte-dx1exw");
    			add_location(button2, file, 31, 1, 1443);
    			attr_dev(button3, "class", "medium button svelte-dx1exw");
    			add_location(button3, file, 32, 1, 1492);
    			attr_dev(button4, "class", "small button svelte-dx1exw");
    			add_location(button4, file, 33, 1, 1539);
    			attr_dev(button5, "class", "tiny button svelte-dx1exw");
    			add_location(button5, file, 34, 1, 1584);
    			attr_dev(div3, "class", "buttons svelte-dx1exw");
    			add_location(div3, file, 28, 0, 1334);
    			attr_dev(h22, "class", "heading svelte-dx1exw");
    			add_location(h22, file, 37, 0, 1634);
    			html_tag = new HtmlTag(t26);
    			attr_dev(button6, "class", "button icon-left svelte-dx1exw");
    			add_location(button6, file, 40, 1, 1689);
    			html_tag_1 = new HtmlTag(t28);
    			attr_dev(button7, "class", "blue button icon-left svelte-dx1exw");
    			add_location(button7, file, 41, 1, 1749);
    			html_tag_2 = new HtmlTag(t30);
    			attr_dev(button8, "class", "outlined blue button icon-left svelte-dx1exw");
    			add_location(button8, file, 42, 1, 1814);
    			attr_dev(div4, "class", "buttons svelte-dx1exw");
    			add_location(div4, file, 39, 0, 1666);
    			html_tag_3 = new HtmlTag(null);
    			attr_dev(button9, "class", "button icon-right svelte-dx1exw");
    			add_location(button9, file, 45, 4, 1921);
    			html_tag_4 = new HtmlTag(null);
    			attr_dev(button10, "class", "blue button icon-right svelte-dx1exw");
    			add_location(button10, file, 46, 1, 1982);
    			html_tag_5 = new HtmlTag(null);
    			attr_dev(button11, "class", "outlined blue button icon-right svelte-dx1exw");
    			add_location(button11, file, 47, 1, 2048);
    			attr_dev(div5, "class", "buttons svelte-dx1exw");
    			add_location(div5, file, 44, 0, 1895);
    			attr_dev(h23, "class", "heading svelte-dx1exw");
    			add_location(h23, file, 50, 0, 2131);
    			attr_dev(button12, "class", "button svelte-dx1exw");
    			add_location(button12, file, 53, 1, 2187);
    			attr_dev(button13, "class", "current button svelte-dx1exw");
    			add_location(button13, file, 54, 1, 2228);
    			button14.disabled = true;
    			attr_dev(button14, "class", "button svelte-dx1exw");
    			add_location(button14, file, 55, 1, 2277);
    			button15.disabled = true;
    			attr_dev(button15, "class", "pending button svelte-dx1exw");
    			add_location(button15, file, 56, 1, 2328);
    			attr_dev(div6, "class", "buttons svelte-dx1exw");
    			add_location(div6, file, 52, 0, 2164);
    			attr_dev(h24, "class", "heading svelte-dx1exw");
    			add_location(h24, file, 60, 0, 2394);
    			attr_dev(button16, "class", "red button svelte-dx1exw");
    			add_location(button16, file, 63, 1, 2450);
    			attr_dev(button17, "class", "green button svelte-dx1exw");
    			add_location(button17, file, 64, 1, 2491);
    			attr_dev(button18, "class", "blue button svelte-dx1exw");
    			add_location(button18, file, 65, 1, 2536);
    			html_tag_6 = new HtmlTag(t56);
    			attr_dev(button19, "class", "icon-left red button svelte-dx1exw");
    			add_location(button19, file, 67, 4, 2583);
    			attr_dev(button20, "class", "green button svelte-dx1exw");
    			button20.disabled = true;
    			add_location(button20, file, 68, 1, 2644);
    			attr_dev(button21, "class", "blue button pending svelte-dx1exw");
    			button21.disabled = true;
    			add_location(button21, file, 69, 1, 2701);
    			attr_dev(div7, "class", "buttons svelte-dx1exw");
    			add_location(div7, file, 62, 0, 2427);
    			attr_dev(button22, "class", "on-dark red button svelte-dx1exw");
    			add_location(button22, file, 73, 1, 2799);
    			attr_dev(button23, "class", "on-dark green button svelte-dx1exw");
    			add_location(button23, file, 74, 1, 2848);
    			attr_dev(button24, "class", "on-dark blue button svelte-dx1exw");
    			add_location(button24, file, 75, 1, 2901);
    			html_tag_7 = new HtmlTag(t68);
    			attr_dev(button25, "class", "on-dark icon-left red button svelte-dx1exw");
    			add_location(button25, file, 77, 4, 2956);
    			attr_dev(button26, "class", "on-dark green button svelte-dx1exw");
    			button26.disabled = true;
    			add_location(button26, file, 78, 1, 3025);
    			attr_dev(button27, "class", "on-dark blue button pending svelte-dx1exw");
    			button27.disabled = true;
    			add_location(button27, file, 79, 1, 3090);
    			attr_dev(div8, "class", "buttons dark svelte-dx1exw");
    			add_location(div8, file, 72, 0, 2771);
    			attr_dev(h25, "class", "heading svelte-dx1exw");
    			add_location(h25, file, 82, 0, 3168);
    			attr_dev(button28, "class", "outlined red button svelte-dx1exw");
    			add_location(button28, file, 85, 4, 3228);
    			attr_dev(button29, "class", "outlined green button svelte-dx1exw");
    			add_location(button29, file, 86, 1, 3278);
    			attr_dev(button30, "class", "outlined blue button svelte-dx1exw");
    			add_location(button30, file, 87, 1, 3332);
    			html_tag_8 = new HtmlTag(t82);
    			attr_dev(button31, "class", "outlined icon-left red button svelte-dx1exw");
    			add_location(button31, file, 88, 4, 3387);
    			attr_dev(button32, "class", "outlined green button svelte-dx1exw");
    			button32.disabled = true;
    			add_location(button32, file, 89, 1, 3457);
    			attr_dev(button33, "class", "outlined blue button pending svelte-dx1exw");
    			button33.disabled = true;
    			add_location(button33, file, 90, 1, 3523);
    			attr_dev(div9, "class", "buttons svelte-dx1exw");
    			add_location(div9, file, 84, 0, 3202);
    			attr_dev(button34, "class", "outlined on-dark red button svelte-dx1exw");
    			add_location(button34, file, 94, 1, 3630);
    			attr_dev(button35, "class", "outlined on-dark green button svelte-dx1exw");
    			add_location(button35, file, 95, 1, 3688);
    			attr_dev(button36, "class", "outlined on-dark blue button svelte-dx1exw");
    			add_location(button36, file, 96, 1, 3750);
    			html_tag_9 = new HtmlTag(t94);
    			attr_dev(button37, "class", "outlined on-dark icon-left red button svelte-dx1exw");
    			add_location(button37, file, 98, 4, 3814);
    			attr_dev(button38, "class", "outlined on-dark green button svelte-dx1exw");
    			button38.disabled = true;
    			add_location(button38, file, 99, 1, 3892);
    			attr_dev(button39, "class", "outlined on-dark blue button pending svelte-dx1exw");
    			button39.disabled = true;
    			add_location(button39, file, 100, 1, 3966);
    			attr_dev(div10, "class", "buttons dark svelte-dx1exw");
    			add_location(div10, file, 93, 0, 3602);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, code0);
    			append_dev(div0, a0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, code1);
    			append_dev(div1, a1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code2);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, button0);
    			append_dev(div3, t13);
    			append_dev(div3, button1);
    			append_dev(div3, t15);
    			append_dev(div3, button2);
    			append_dev(div3, t17);
    			append_dev(div3, button3);
    			append_dev(div3, t19);
    			append_dev(div3, button4);
    			append_dev(div3, t21);
    			append_dev(div3, button5);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, button6);
    			html_tag.m(/*i*/ ctx[0], button6);
    			append_dev(button6, t26);
    			append_dev(div4, t27);
    			append_dev(div4, button7);
    			html_tag_1.m(/*i*/ ctx[0], button7);
    			append_dev(button7, t28);
    			append_dev(div4, t29);
    			append_dev(div4, button8);
    			html_tag_2.m(/*i*/ ctx[0], button8);
    			append_dev(button8, t30);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, button9);
    			append_dev(button9, t32);
    			html_tag_3.m(/*i*/ ctx[0], button9);
    			append_dev(div5, t33);
    			append_dev(div5, button10);
    			append_dev(button10, t34);
    			html_tag_4.m(/*i*/ ctx[0], button10);
    			append_dev(div5, t35);
    			append_dev(div5, button11);
    			append_dev(button11, t36);
    			html_tag_5.m(/*i*/ ctx[0], button11);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, button12);
    			append_dev(div6, t41);
    			append_dev(div6, button13);
    			append_dev(div6, t43);
    			append_dev(div6, button14);
    			append_dev(div6, t45);
    			append_dev(div6, button15);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, button16);
    			append_dev(div7, t51);
    			append_dev(div7, button17);
    			append_dev(div7, t53);
    			append_dev(div7, button18);
    			append_dev(div7, t55);
    			append_dev(div7, button19);
    			html_tag_6.m(/*i*/ ctx[0], button19);
    			append_dev(button19, t56);
    			append_dev(div7, t57);
    			append_dev(div7, button20);
    			append_dev(div7, t59);
    			append_dev(div7, button21);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, button22);
    			append_dev(div8, t63);
    			append_dev(div8, button23);
    			append_dev(div8, t65);
    			append_dev(div8, button24);
    			append_dev(div8, t67);
    			append_dev(div8, button25);
    			html_tag_7.m(/*i*/ ctx[0], button25);
    			append_dev(button25, t68);
    			append_dev(div8, t69);
    			append_dev(div8, button26);
    			append_dev(div8, t71);
    			append_dev(div8, button27);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, h25, anchor);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, button28);
    			append_dev(div9, t77);
    			append_dev(div9, button29);
    			append_dev(div9, t79);
    			append_dev(div9, button30);
    			append_dev(div9, t81);
    			append_dev(div9, button31);
    			html_tag_8.m(/*i*/ ctx[0], button31);
    			append_dev(button31, t82);
    			append_dev(div9, t83);
    			append_dev(div9, button32);
    			append_dev(div9, t85);
    			append_dev(div9, button33);
    			insert_dev(target, t87, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, button34);
    			append_dev(div10, t89);
    			append_dev(div10, button35);
    			append_dev(div10, t91);
    			append_dev(div10, button36);
    			append_dev(div10, t93);
    			append_dev(div10, button37);
    			html_tag_9.m(/*i*/ ctx[0], button37);
    			append_dev(button37, t94);
    			append_dev(div10, t95);
    			append_dev(div10, button38);
    			append_dev(div10, t97);
    			append_dev(div10, button39);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t87);
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let i = "<svg viewBox=\"0 0 24 24\"><path d=\"M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z\"/></svg>";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", $$slots, []);
    	$$self.$capture_state = () => ({ i });

    	$$self.$inject_state = $$props => {
    		if ("i" in $$props) $$invalidate(0, i = $$props.i);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [i];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let link;
    	let t;
    	let main;
    	let switch_instance;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$1, 24, 4, 484);
    			add_location(main, file$1, 27, 0, 620);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let component;

    	if (location.hash === "") {
    		component = Home;
    	} else if (location.hash === "#buttons") {
    		component = Buttons;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Home, Buttons, component });

    	$$self.$inject_state = $$props => {
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
