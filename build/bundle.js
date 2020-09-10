
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
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

    const file = "src/Home.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let h20;
    	let t5;
    	let p1;
    	let p2;
    	let t7;
    	let p3;
    	let p4;
    	let t9;
    	let pre;
    	let code;
    	let t11;
    	let p5;
    	let i0;
    	let t13;
    	let p6;
    	let t15;
    	let img;
    	let img_src_value;
    	let t16;
    	let h21;
    	let t18;
    	let p7;
    	let t20;
    	let p8;
    	let i1;
    	let t22;
    	let h22;
    	let t24;
    	let p9;
    	let t25;
    	let a;
    	let t27;
    	let h23;
    	let t29;
    	let p10;
    	let t30;
    	let i2;
    	let t32;
    	let i3;
    	let t34;
    	let t35;
    	let p11;
    	let t37;
    	let p12;
    	let t39;
    	let br;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Design basics";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "The basic number of any design is 12 (not 10), since it is divisible not only by 4 without a remainder, but, which is more important, by 3, so the golden ratio could be applied.";
    			t3 = space();
    			h20 = element("h2");
    			h20.textContent = "Text";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "According to numerous researches, measured reading speed, article width should be around 700px (~18cm), containing 50-80 letters per line. Also, line height should be 3/2 of font size (in practice, that's not strictly true for all fonts, sometimes line height needs to be slightly higher).";
    			p2 = element("p");
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Knowing that and considering 12 as the basic layout number, following CSS rules are obtained:";
    			p4 = element("p");
    			t9 = space();
    			pre = element("pre");
    			code = element("code");

    			code.textContent = `${`p {
    width: 720px;
    padding: 0 24px;
    font-size: 20px;
    line-height: 33px;
}`}`;

    			t11 = space();
    			p5 = element("p");
    			i0 = element("i");
    			i0.textContent = "Since that, it's interesting, that iPad mini's portrait width is already 768px, which is 720px width with 24px padding around.";
    			t13 = space();
    			p6 = element("p");
    			p6.textContent = "But, that does not mean, that images, tables or charts should match that same 720px width. That's an another type of data.";
    			t15 = space();
    			img = element("img");
    			t16 = space();
    			h21 = element("h2");
    			h21.textContent = "Buttons";
    			t18 = space();
    			p7 = element("p");
    			p7.textContent = "Volume, roundness, font and overall size, text, presence of an icon - have a very strong effect on conversion. Especially colors influence different behaviour depending even on user gender.";
    			t20 = space();
    			p8 = element("p");
    			i1 = element("i");
    			i1.textContent = "Each CSS rule of a \"call to action\" button must be accurately tested on each specific project.";
    			t22 = space();
    			h22 = element("h2");
    			h22.textContent = "Colors";
    			t24 = space();
    			p9 = element("p");
    			t25 = text("Colors are harmonious only when built with natural RYB model (Red Yellow Blue), not RGB. Nice app to try: ");
    			a = element("a");
    			a.textContent = "https://bahamas10.github.io/ryb/";
    			t27 = space();
    			h23 = element("h2");
    			h23.textContent = "Notes";
    			t29 = space();
    			p10 = element("p");
    			t30 = text("Heading links must stay ");
    			i2 = element("i");
    			i2.textContent = "display: inline";
    			t32 = text(", but have ");
    			i3 = element("i");
    			i3.textContent = "padding: 0.1em 0;";
    			t34 = text(", so there will never be empty but clickable space.");
    			t35 = space();
    			p11 = element("p");
    			p11.textContent = "For floating elements with white background (header, \"go top\" button), it is better to add 1px grey translucent shadow instead of opaque grey border, to avoid strange contrast with colored content.";
    			t37 = space();
    			p12 = element("p");
    			p12.textContent = "Modal window's scroll must stay global, not inside content block.";
    			t39 = space();
    			br = element("br");
    			add_location(h1, file, 0, 0, 0);
    			add_location(p0, file, 2, 0, 24);
    			add_location(h20, file, 5, 0, 319);
    			add_location(p1, file, 7, 0, 334);
    			add_location(p2, file, 7, 292, 626);
    			add_location(p3, file, 8, 0, 631);
    			add_location(p4, file, 8, 96, 727);
    			add_location(code, file, 9, 5, 737);
    			add_location(pre, file, 9, 0, 732);
    			add_location(i0, file, 15, 3, 852);
    			add_location(p5, file, 15, 0, 849);
    			add_location(p6, file, 17, 0, 991);
    			if (img.src !== (img_src_value = "/images/nature.jpg")) attr_dev(img, "src", img_src_value);
    			set_style(img, "margin", "0 auto");
    			add_location(img, file, 19, 0, 1122);
    			add_location(h21, file, 21, 0, 1178);
    			add_location(p7, file, 23, 0, 1196);
    			add_location(i1, file, 24, 3, 1396);
    			add_location(p8, file, 24, 0, 1393);
    			add_location(h22, file, 26, 0, 1503);
    			attr_dev(a, "href", "https://bahamas10.github.io/ryb/");
    			add_location(a, file, 28, 109, 1629);
    			add_location(p9, file, 28, 0, 1520);
    			add_location(h23, file, 32, 0, 1763);
    			add_location(i2, file, 34, 27, 1806);
    			add_location(i3, file, 34, 60, 1839);
    			add_location(p10, file, 34, 0, 1779);
    			add_location(p11, file, 35, 0, 1919);
    			add_location(p12, file, 36, 0, 2124);
    			add_location(br, file, 38, 0, 2198);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, i0);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, p8, anchor);
    			append_dev(p8, i1);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, p9, anchor);
    			append_dev(p9, t25);
    			append_dev(p9, a);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, p10, anchor);
    			append_dev(p10, t30);
    			append_dev(p10, i2);
    			append_dev(p10, t32);
    			append_dev(p10, i3);
    			append_dev(p10, t34);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, p11, anchor);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, p12, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(p12);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(br);
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

    const file$1 = "src/Buttons.svelte";

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let code0;
    	let a0;
    	let br;
    	let t4;
    	let code1;
    	let a1;
    	let t7;
    	let h20;
    	let t9;
    	let pre;
    	let code2;
    	let t11;
    	let h21;
    	let t13;
    	let p1;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let button2;
    	let t19;
    	let button3;
    	let t21;
    	let h22;
    	let t23;
    	let p2;
    	let button4;
    	let t25;
    	let button5;
    	let t27;
    	let button6;
    	let t29;
    	let button7;
    	let t31;
    	let button8;
    	let t33;
    	let button9;
    	let t35;
    	let p3;
    	let button10;
    	let t37;
    	let button11;
    	let t39;
    	let button12;
    	let t41;
    	let button13;
    	let t43;
    	let button14;
    	let t45;
    	let button15;
    	let t47;
    	let h23;
    	let t49;
    	let p4;
    	let button16;
    	let html_tag;
    	let t50;
    	let t51;
    	let button17;
    	let html_tag_1;
    	let t52;
    	let t53;
    	let button18;
    	let html_tag_2;
    	let t54;
    	let t55;
    	let p5;
    	let button19;
    	let t56;
    	let html_tag_3;
    	let t57;
    	let button20;
    	let t58;
    	let html_tag_4;
    	let t59;
    	let button21;
    	let t60;
    	let html_tag_5;
    	let t61;
    	let h24;
    	let t63;
    	let p6;
    	let button22;
    	let t65;
    	let button23;
    	let t67;
    	let button24;
    	let t69;
    	let button25;
    	let html_tag_6;
    	let t70;
    	let t71;
    	let button26;
    	let t73;
    	let button27;
    	let t75;
    	let p7;
    	let button28;
    	let t77;
    	let button29;
    	let t79;
    	let button30;
    	let t81;
    	let button31;
    	let html_tag_7;
    	let t82;
    	let t83;
    	let button32;
    	let t85;
    	let button33;
    	let t87;
    	let p8;
    	let button34;
    	let t89;
    	let button35;
    	let t91;
    	let button36;
    	let t93;
    	let button37;
    	let html_tag_8;
    	let t94;
    	let t95;
    	let button38;
    	let t97;
    	let button39;
    	let t99;
    	let p9;
    	let button40;
    	let t101;
    	let button41;
    	let t103;
    	let button42;
    	let t105;
    	let button43;
    	let html_tag_9;
    	let t106;
    	let t107;
    	let button44;
    	let t109;
    	let button45;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "buttons.css";
    			t1 = space();
    			p0 = element("p");
    			code0 = element("code");
    			code0.textContent = "GIT: ";
    			a0 = element("a");
    			a0.textContent = "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/buttons.css";
    			br = element("br");
    			t4 = space();
    			code1 = element("code");
    			code1.textContent = "CDN: ";
    			a1 = element("a");
    			a1.textContent = "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/buttons.css";
    			t7 = space();
    			h20 = element("h2");
    			h20.textContent = "Classes";
    			t9 = space();
    			pre = element("pre");
    			code2 = element("code");

    			code2.textContent = `${`<button [disabled] class="button
  [large|big|regular|medium|small|tiny]
  [red|green|blue]
  [outlined]
  [pending]
  [icon-left|icon-right]
  [on-dark]">Button</button>`}`;

    			t11 = space();
    			h21 = element("h2");
    			h21.textContent = "States";
    			t13 = space();
    			p1 = element("p");
    			button0 = element("button");
    			button0.textContent = "Default";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "Current";
    			t17 = space();
    			button2 = element("button");
    			button2.textContent = "Disabled";
    			t19 = space();
    			button3 = element("button");
    			button3.textContent = "Pending";
    			t21 = space();
    			h22 = element("h2");
    			h22.textContent = "Sizes";
    			t23 = space();
    			p2 = element("p");
    			button4 = element("button");
    			button4.textContent = "Large";
    			t25 = space();
    			button5 = element("button");
    			button5.textContent = "Big";
    			t27 = space();
    			button6 = element("button");
    			button6.textContent = "Regular";
    			t29 = space();
    			button7 = element("button");
    			button7.textContent = "Medium";
    			t31 = space();
    			button8 = element("button");
    			button8.textContent = "Small";
    			t33 = space();
    			button9 = element("button");
    			button9.textContent = "Tiny";
    			t35 = space();
    			p3 = element("p");
    			button10 = element("button");
    			button10.textContent = "Large";
    			t37 = space();
    			button11 = element("button");
    			button11.textContent = "Big";
    			t39 = space();
    			button12 = element("button");
    			button12.textContent = "Regular";
    			t41 = space();
    			button13 = element("button");
    			button13.textContent = "Medium";
    			t43 = space();
    			button14 = element("button");
    			button14.textContent = "Small";
    			t45 = space();
    			button15 = element("button");
    			button15.textContent = "Tiny";
    			t47 = space();
    			h23 = element("h2");
    			h23.textContent = "Icons";
    			t49 = space();
    			p4 = element("p");
    			button16 = element("button");
    			t50 = text("Default");
    			t51 = space();
    			button17 = element("button");
    			t52 = text("Colored");
    			t53 = space();
    			button18 = element("button");
    			t54 = text("Outlined");
    			t55 = space();
    			p5 = element("p");
    			button19 = element("button");
    			t56 = text("Default");
    			t57 = space();
    			button20 = element("button");
    			t58 = text("Colored");
    			t59 = space();
    			button21 = element("button");
    			t60 = text("Outlined");
    			t61 = space();
    			h24 = element("h2");
    			h24.textContent = "Styles";
    			t63 = space();
    			p6 = element("p");
    			button22 = element("button");
    			button22.textContent = "Red";
    			t65 = space();
    			button23 = element("button");
    			button23.textContent = "Green";
    			t67 = space();
    			button24 = element("button");
    			button24.textContent = "Blue";
    			t69 = space();
    			button25 = element("button");
    			t70 = text("Icon");
    			t71 = space();
    			button26 = element("button");
    			button26.textContent = "Disabled";
    			t73 = space();
    			button27 = element("button");
    			button27.textContent = "Pending";
    			t75 = space();
    			p7 = element("p");
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
    			p8 = element("p");
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
    			t99 = space();
    			p9 = element("p");
    			button40 = element("button");
    			button40.textContent = "Red";
    			t101 = space();
    			button41 = element("button");
    			button41.textContent = "Green";
    			t103 = space();
    			button42 = element("button");
    			button42.textContent = "Blue";
    			t105 = space();
    			button43 = element("button");
    			t106 = text("Icon");
    			t107 = space();
    			button44 = element("button");
    			button44.textContent = "Disabled";
    			t109 = space();
    			button45 = element("button");
    			button45.textContent = "Pending";
    			attr_dev(h1, "class", "svelte-1rrq9pt");
    			add_location(h1, file$1, 11, 0, 596);
    			add_location(code0, file$1, 14, 4, 667);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/buttons.css");
    			add_location(a0, file$1, 14, 22, 685);
    			add_location(br, file$1, 14, 201, 864);
    			add_location(code1, file$1, 15, 4, 873);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/buttons.css");
    			add_location(a1, file$1, 15, 22, 891);
    			set_style(p0, "font-size", "18px");
    			set_style(p0, "line-height", "27px");
    			attr_dev(p0, "class", "svelte-1rrq9pt");
    			add_location(p0, file$1, 13, 0, 618);
    			attr_dev(h20, "class", "svelte-1rrq9pt");
    			add_location(h20, file$1, 18, 0, 1085);
    			attr_dev(code2, "class", "html");
    			add_location(code2, file$1, 20, 5, 1108);
    			attr_dev(pre, "class", "svelte-1rrq9pt");
    			add_location(pre, file$1, 20, 0, 1103);
    			attr_dev(h21, "class", "svelte-1rrq9pt");
    			add_location(h21, file$1, 30, 0, 1318);
    			attr_dev(button0, "class", "button svelte-1rrq9pt");
    			add_location(button0, file$1, 33, 1, 1356);
    			attr_dev(button1, "class", "current button svelte-1rrq9pt");
    			add_location(button1, file$1, 34, 1, 1397);
    			button2.disabled = true;
    			attr_dev(button2, "class", "button svelte-1rrq9pt");
    			add_location(button2, file$1, 35, 1, 1446);
    			button3.disabled = true;
    			attr_dev(button3, "class", "pending button svelte-1rrq9pt");
    			add_location(button3, file$1, 36, 1, 1497);
    			attr_dev(p1, "class", "buttons svelte-1rrq9pt");
    			add_location(p1, file$1, 32, 0, 1335);
    			attr_dev(h22, "class", "svelte-1rrq9pt");
    			add_location(h22, file$1, 39, 0, 1560);
    			attr_dev(button4, "class", "large button svelte-1rrq9pt");
    			add_location(button4, file$1, 42, 1, 1597);
    			attr_dev(button5, "class", "big button svelte-1rrq9pt");
    			add_location(button5, file$1, 43, 1, 1642);
    			attr_dev(button6, "class", "regular button svelte-1rrq9pt");
    			add_location(button6, file$1, 44, 1, 1683);
    			attr_dev(button7, "class", "medium button svelte-1rrq9pt");
    			add_location(button7, file$1, 45, 1, 1732);
    			attr_dev(button8, "class", "small button svelte-1rrq9pt");
    			add_location(button8, file$1, 46, 1, 1779);
    			attr_dev(button9, "class", "tiny button svelte-1rrq9pt");
    			add_location(button9, file$1, 47, 1, 1824);
    			attr_dev(p2, "class", "buttons svelte-1rrq9pt");
    			add_location(p2, file$1, 41, 0, 1576);
    			attr_dev(button10, "class", "blue large button svelte-1rrq9pt");
    			add_location(button10, file$1, 50, 1, 1892);
    			attr_dev(button11, "class", "blue big button svelte-1rrq9pt");
    			add_location(button11, file$1, 51, 1, 1942);
    			attr_dev(button12, "class", "blue regular button svelte-1rrq9pt");
    			add_location(button12, file$1, 52, 1, 1988);
    			attr_dev(button13, "class", "blue medium button svelte-1rrq9pt");
    			add_location(button13, file$1, 53, 1, 2042);
    			attr_dev(button14, "class", "blue small button svelte-1rrq9pt");
    			add_location(button14, file$1, 54, 1, 2094);
    			attr_dev(button15, "class", "blue tiny button svelte-1rrq9pt");
    			add_location(button15, file$1, 55, 1, 2144);
    			attr_dev(p3, "class", "buttons svelte-1rrq9pt");
    			add_location(p3, file$1, 49, 0, 1871);
    			attr_dev(h23, "class", "svelte-1rrq9pt");
    			add_location(h23, file$1, 58, 0, 2197);
    			html_tag = new HtmlTag(t50);
    			attr_dev(button16, "class", "button icon-left svelte-1rrq9pt");
    			add_location(button16, file$1, 61, 1, 2234);
    			html_tag_1 = new HtmlTag(t52);
    			attr_dev(button17, "class", "blue button icon-left svelte-1rrq9pt");
    			add_location(button17, file$1, 62, 1, 2294);
    			html_tag_2 = new HtmlTag(t54);
    			attr_dev(button18, "class", "outlined blue button icon-left svelte-1rrq9pt");
    			add_location(button18, file$1, 63, 1, 2359);
    			attr_dev(p4, "class", "buttons svelte-1rrq9pt");
    			add_location(p4, file$1, 60, 0, 2213);
    			html_tag_3 = new HtmlTag(null);
    			attr_dev(button19, "class", "button icon-right svelte-1rrq9pt");
    			add_location(button19, file$1, 66, 4, 2462);
    			html_tag_4 = new HtmlTag(null);
    			attr_dev(button20, "class", "blue button icon-right svelte-1rrq9pt");
    			add_location(button20, file$1, 67, 1, 2523);
    			html_tag_5 = new HtmlTag(null);
    			attr_dev(button21, "class", "outlined blue button icon-right svelte-1rrq9pt");
    			add_location(button21, file$1, 68, 1, 2589);
    			attr_dev(p5, "class", "buttons svelte-1rrq9pt");
    			add_location(p5, file$1, 65, 0, 2438);
    			attr_dev(h24, "class", "svelte-1rrq9pt");
    			add_location(h24, file$1, 71, 0, 2670);
    			attr_dev(button22, "class", "red button svelte-1rrq9pt");
    			add_location(button22, file$1, 74, 1, 2708);
    			attr_dev(button23, "class", "green button svelte-1rrq9pt");
    			add_location(button23, file$1, 75, 1, 2749);
    			attr_dev(button24, "class", "blue button svelte-1rrq9pt");
    			add_location(button24, file$1, 76, 1, 2794);
    			html_tag_6 = new HtmlTag(t70);
    			attr_dev(button25, "class", "icon-left red button svelte-1rrq9pt");
    			add_location(button25, file$1, 78, 4, 2841);
    			attr_dev(button26, "class", "green button svelte-1rrq9pt");
    			button26.disabled = true;
    			add_location(button26, file$1, 79, 1, 2902);
    			attr_dev(button27, "class", "blue button pending svelte-1rrq9pt");
    			button27.disabled = true;
    			add_location(button27, file$1, 80, 1, 2959);
    			attr_dev(p6, "class", "buttons svelte-1rrq9pt");
    			add_location(p6, file$1, 73, 0, 2687);
    			attr_dev(button28, "class", "outlined red button svelte-1rrq9pt");
    			add_location(button28, file$1, 84, 4, 3051);
    			attr_dev(button29, "class", "outlined green button svelte-1rrq9pt");
    			add_location(button29, file$1, 85, 1, 3101);
    			attr_dev(button30, "class", "outlined blue button svelte-1rrq9pt");
    			add_location(button30, file$1, 86, 1, 3155);
    			html_tag_7 = new HtmlTag(t82);
    			attr_dev(button31, "class", "outlined icon-left red button svelte-1rrq9pt");
    			add_location(button31, file$1, 87, 4, 3210);
    			attr_dev(button32, "class", "outlined green button svelte-1rrq9pt");
    			button32.disabled = true;
    			add_location(button32, file$1, 88, 1, 3280);
    			attr_dev(button33, "class", "outlined blue button pending svelte-1rrq9pt");
    			button33.disabled = true;
    			add_location(button33, file$1, 89, 1, 3346);
    			attr_dev(p7, "class", "buttons svelte-1rrq9pt");
    			add_location(p7, file$1, 83, 0, 3027);
    			attr_dev(button34, "class", "on-dark red button svelte-1rrq9pt");
    			add_location(button34, file$1, 93, 1, 3449);
    			attr_dev(button35, "class", "on-dark green button svelte-1rrq9pt");
    			add_location(button35, file$1, 94, 1, 3498);
    			attr_dev(button36, "class", "on-dark blue button svelte-1rrq9pt");
    			add_location(button36, file$1, 95, 1, 3551);
    			html_tag_8 = new HtmlTag(t94);
    			attr_dev(button37, "class", "on-dark icon-left red button svelte-1rrq9pt");
    			add_location(button37, file$1, 97, 4, 3606);
    			attr_dev(button38, "class", "on-dark green button svelte-1rrq9pt");
    			button38.disabled = true;
    			add_location(button38, file$1, 98, 1, 3675);
    			attr_dev(button39, "class", "on-dark blue button pending svelte-1rrq9pt");
    			button39.disabled = true;
    			add_location(button39, file$1, 99, 1, 3740);
    			attr_dev(p8, "class", "buttons dark svelte-1rrq9pt");
    			add_location(p8, file$1, 92, 0, 3423);
    			attr_dev(button40, "class", "outlined on-dark red button svelte-1rrq9pt");
    			add_location(button40, file$1, 103, 1, 3878);
    			attr_dev(button41, "class", "outlined on-dark green button svelte-1rrq9pt");
    			add_location(button41, file$1, 104, 1, 3936);
    			attr_dev(button42, "class", "outlined on-dark blue button svelte-1rrq9pt");
    			add_location(button42, file$1, 105, 1, 3998);
    			html_tag_9 = new HtmlTag(t106);
    			attr_dev(button43, "class", "outlined on-dark icon-left red button svelte-1rrq9pt");
    			add_location(button43, file$1, 107, 4, 4062);
    			attr_dev(button44, "class", "outlined on-dark green button svelte-1rrq9pt");
    			button44.disabled = true;
    			add_location(button44, file$1, 108, 1, 4140);
    			attr_dev(button45, "class", "outlined on-dark blue button pending svelte-1rrq9pt");
    			button45.disabled = true;
    			add_location(button45, file$1, 109, 1, 4214);
    			attr_dev(p9, "class", "buttons dark svelte-1rrq9pt");
    			set_style(p9, "margin-top", "0");
    			set_style(p9, "padding-top", "0");
    			add_location(p9, file$1, 102, 0, 3816);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, code0);
    			append_dev(p0, a0);
    			append_dev(p0, br);
    			append_dev(p0, t4);
    			append_dev(p0, code1);
    			append_dev(p0, a1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code2);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, button0);
    			append_dev(p1, t15);
    			append_dev(p1, button1);
    			append_dev(p1, t17);
    			append_dev(p1, button2);
    			append_dev(p1, t19);
    			append_dev(p1, button3);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, button4);
    			append_dev(p2, t25);
    			append_dev(p2, button5);
    			append_dev(p2, t27);
    			append_dev(p2, button6);
    			append_dev(p2, t29);
    			append_dev(p2, button7);
    			append_dev(p2, t31);
    			append_dev(p2, button8);
    			append_dev(p2, t33);
    			append_dev(p2, button9);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, button10);
    			append_dev(p3, t37);
    			append_dev(p3, button11);
    			append_dev(p3, t39);
    			append_dev(p3, button12);
    			append_dev(p3, t41);
    			append_dev(p3, button13);
    			append_dev(p3, t43);
    			append_dev(p3, button14);
    			append_dev(p3, t45);
    			append_dev(p3, button15);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, button16);
    			html_tag.m(/*i*/ ctx[0], button16);
    			append_dev(button16, t50);
    			append_dev(p4, t51);
    			append_dev(p4, button17);
    			html_tag_1.m(/*i*/ ctx[0], button17);
    			append_dev(button17, t52);
    			append_dev(p4, t53);
    			append_dev(p4, button18);
    			html_tag_2.m(/*i*/ ctx[0], button18);
    			append_dev(button18, t54);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, button19);
    			append_dev(button19, t56);
    			html_tag_3.m(/*i*/ ctx[0], button19);
    			append_dev(p5, t57);
    			append_dev(p5, button20);
    			append_dev(button20, t58);
    			html_tag_4.m(/*i*/ ctx[0], button20);
    			append_dev(p5, t59);
    			append_dev(p5, button21);
    			append_dev(button21, t60);
    			html_tag_5.m(/*i*/ ctx[0], button21);
    			insert_dev(target, t61, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t63, anchor);
    			insert_dev(target, p6, anchor);
    			append_dev(p6, button22);
    			append_dev(p6, t65);
    			append_dev(p6, button23);
    			append_dev(p6, t67);
    			append_dev(p6, button24);
    			append_dev(p6, t69);
    			append_dev(p6, button25);
    			html_tag_6.m(/*i*/ ctx[0], button25);
    			append_dev(button25, t70);
    			append_dev(p6, t71);
    			append_dev(p6, button26);
    			append_dev(p6, t73);
    			append_dev(p6, button27);
    			insert_dev(target, t75, anchor);
    			insert_dev(target, p7, anchor);
    			append_dev(p7, button28);
    			append_dev(p7, t77);
    			append_dev(p7, button29);
    			append_dev(p7, t79);
    			append_dev(p7, button30);
    			append_dev(p7, t81);
    			append_dev(p7, button31);
    			html_tag_7.m(/*i*/ ctx[0], button31);
    			append_dev(button31, t82);
    			append_dev(p7, t83);
    			append_dev(p7, button32);
    			append_dev(p7, t85);
    			append_dev(p7, button33);
    			insert_dev(target, t87, anchor);
    			insert_dev(target, p8, anchor);
    			append_dev(p8, button34);
    			append_dev(p8, t89);
    			append_dev(p8, button35);
    			append_dev(p8, t91);
    			append_dev(p8, button36);
    			append_dev(p8, t93);
    			append_dev(p8, button37);
    			html_tag_8.m(/*i*/ ctx[0], button37);
    			append_dev(button37, t94);
    			append_dev(p8, t95);
    			append_dev(p8, button38);
    			append_dev(p8, t97);
    			append_dev(p8, button39);
    			insert_dev(target, t99, anchor);
    			insert_dev(target, p9, anchor);
    			append_dev(p9, button40);
    			append_dev(p9, t101);
    			append_dev(p9, button41);
    			append_dev(p9, t103);
    			append_dev(p9, button42);
    			append_dev(p9, t105);
    			append_dev(p9, button43);
    			html_tag_9.m(/*i*/ ctx[0], button43);
    			append_dev(button43, t106);
    			append_dev(p9, t107);
    			append_dev(p9, button44);
    			append_dev(p9, t109);
    			append_dev(p9, button45);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t61);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t63);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t75);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t87);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t99);
    			if (detaching) detach_dev(p9);
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

    /* src/Populate.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/Populate.svelte";

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let div0;
    	let code0;
    	let a0;
    	let br;
    	let t6;
    	let code1;
    	let a1;
    	let t9;
    	let h20;
    	let t11;
    	let p1;
    	let t13;
    	let pre0;
    	let code2;
    	let t15;
    	let p2;
    	let t16;
    	let b0;
    	let t18;
    	let t19;
    	let pre1;
    	let code3;
    	let t21;
    	let h21;
    	let t23;
    	let div4;
    	let div3;
    	let div1;
    	let b1;
    	let t25;
    	let span0;
    	let t27;
    	let b2;
    	let t29;
    	let button0;
    	let t31;
    	let button1;
    	let t33;
    	let div2;
    	let b3;
    	let t35;
    	let span1;
    	let t37;
    	let b4;
    	let t39;
    	let input0;
    	let t40;
    	let pre2;
    	let code4;
    	let t42;
    	let h22;
    	let t44;
    	let div8;
    	let div5;
    	let b5;
    	let t46;
    	let span2;
    	let t48;
    	let span3;
    	let t50;
    	let t51;
    	let div6;
    	let b6;
    	let t53;
    	let span4;
    	let t55;
    	let span5;
    	let t57;
    	let t58;
    	let div7;
    	let b7;
    	let t60;
    	let span6;
    	let t62;
    	let span7;
    	let t64;
    	let t65;
    	let form;
    	let b8;
    	let t67;
    	let input1;
    	let t68;
    	let select;
    	let option0;
    	let option1;
    	let t71;
    	let button2;
    	let t73;
    	let pre3;
    	let code5;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "populate.js";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Simple script that builds JS-model based on data retrieved from HTML";
    			t3 = space();
    			div0 = element("div");
    			code0 = element("code");
    			code0.textContent = "GIT: ";
    			a0 = element("a");
    			a0.textContent = "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/libs/populate.js";
    			br = element("br");
    			t6 = space();
    			code1 = element("code");
    			code1.textContent = "CDN: ";
    			a1 = element("a");
    			a1.textContent = "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/libs/populate.js";
    			t9 = space();
    			h20 = element("h2");
    			h20.textContent = "How it works";
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "Just describe JS-model and it will be populated with data from HTML";
    			t13 = space();
    			pre0 = element("pre");
    			code2 = element("code");

    			code2.textContent = `${`<!DOCTYPE html>
<html>
<head></head>
<body>

    <span data-model="user.name">John</span>
    <span data-model="user.balance">0</span>

    <script src="https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/libs/populate.js"></script>

    <script>
    const user = new Model('user', {
        name: 'string',
        balance: 'number',
    });
    </script>

</body>
</html>`}`;

    			t15 = space();
    			p2 = element("p");
    			t16 = text("Now, global object ");
    			b0 = element("b");
    			b0.textContent = "user";
    			t18 = text(" can be easily managed (UI will be instantly synced):");
    			t19 = space();
    			pre1 = element("pre");
    			code3 = element("code");

    			code3.textContent = `${`>>> user.name
'John'
>>> user.balance = 10
10`}`;

    			t21 = space();
    			h21 = element("h2");
    			h21.textContent = "Example";
    			t23 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			b1 = element("b");
    			b1.textContent = "Balance";
    			t25 = space();
    			span0 = element("span");
    			span0.textContent = "0";
    			t27 = space();
    			b2 = element("b");
    			b2.textContent = "Add balance";
    			t29 = space();
    			button0 = element("button");
    			button0.textContent = "Add +10";
    			t31 = space();
    			button1 = element("button");
    			button1.textContent = "Subtract -10";
    			t33 = space();
    			div2 = element("div");
    			b3 = element("b");
    			b3.textContent = "Name";
    			t35 = space();
    			span1 = element("span");
    			span1.textContent = "John";
    			t37 = space();
    			b4 = element("b");
    			b4.textContent = "Change name";
    			t39 = space();
    			input0 = element("input");
    			t40 = space();
    			pre2 = element("pre");
    			code4 = element("code");

    			code4.textContent = `${`<b>Balance</b>
<span data-model="user.balance">0</span>

<b>Add balance</b>
<button onclick="user.changeBalance(10)">Add +10</button>
<button onclick="user.changeBalance(-10)">Subtract -10</button>

<b>Name</b>
<span data-model="user.name">John</span>

<b>Change name</b>
<input type="text" data-model="user.name" value="John">

<script>
    const user = new Model('user', {
            name: 'string',
            balance: 'number',
        }, {
            changeBalance(amount) {
                this.balance += amount
            }
        }
    );
</script>`}`;

    			t42 = space();
    			h22 = element("h2");
    			h22.textContent = "Multiple objects";
    			t44 = space();
    			div8 = element("div");
    			div5 = element("div");
    			b5 = element("b");
    			b5.textContent = "Samsung";
    			t46 = text("\n        $");
    			span2 = element("span");
    			span2.textContent = "10";
    			t48 = text("\n        (");
    			span3 = element("span");
    			span3.textContent = "Android";
    			t50 = text(")");
    			t51 = space();
    			div6 = element("div");
    			b6 = element("b");
    			b6.textContent = "Nokia";
    			t53 = text("\n        $");
    			span4 = element("span");
    			span4.textContent = "15";
    			t55 = text("\n        (");
    			span5 = element("span");
    			span5.textContent = "Android";
    			t57 = text(")");
    			t58 = space();
    			div7 = element("div");
    			b7 = element("b");
    			b7.textContent = "iPhone";
    			t60 = text("\n        $");
    			span6 = element("span");
    			span6.textContent = "30";
    			t62 = text("\n        (");
    			span7 = element("span");
    			span7.textContent = "IOS";
    			t64 = text(")");
    			t65 = space();
    			form = element("form");
    			b8 = element("b");
    			b8.textContent = "Set new price";
    			t67 = text(" $");
    			input1 = element("input");
    			t68 = text("\n    to all\n    ");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Android phones";
    			option1 = element("option");
    			option1.textContent = "IOS phones";
    			t71 = space();
    			button2 = element("button");
    			button2.textContent = "Update prices";
    			t73 = space();
    			pre3 = element("pre");
    			code5 = element("code");

    			code5.textContent = `${`<div data-list="product" data-id="1">
    <b data-list="scope.name">Samsung</b>
    $<span data-list="scope.price">10</span>
    (<span data-list="scope.os">Android</span>)
</div>

<div data-list="product" data-id="2">
    <b data-list="scope.name">Nokia</b>
    $<span data-list="scope.price">15</span>
    (<span data-list="scope.os">Android</span>)
</div>

<div data-list="product" data-id="3">
    <b data-list="scope.name">iPhone</b>
    $<span data-list="scope.price">30</span>
    (<span data-list="scope.os">IOS</span>)
</div>

<form onsubmit="products.setPrice(this, event, os.value, Number(price.value))">
    <b>Set new price</b> $<input type="number" name="price" required>
    to all
    <select name="os">
        <option value="IOS" selected>IOS phones</option>
        <option value="Android">Android phones</option>
    </select>
    <button>Update prices</button>
</form>

<script>
const products = new List('product', {
        id: 'number',
        os: 'string',
        name: 'string',
        price: 'number',
    }, {
        setPrice(form, e, os, price) {
            form.price.value='';
            e.preventDefault();
            products.select({os: os}).update({price: price});
        }
    }
);
</script>`}`;

    			add_location(h1, file$2, 14, 0, 299);
    			add_location(p0, file$2, 16, 0, 321);
    			add_location(code0, file$2, 19, 4, 459);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/libs/populate.js");
    			add_location(a0, file$2, 19, 22, 477);
    			add_location(br, file$2, 19, 211, 666);
    			add_location(code1, file$2, 20, 4, 675);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/libs/populate.js");
    			add_location(a1, file$2, 20, 22, 693);
    			attr_dev(div0, "class", "p");
    			set_style(div0, "font-size", "16px");
    			set_style(div0, "line-height", "24px");
    			add_location(div0, file$2, 18, 0, 398);
    			add_location(h20, file$2, 23, 0, 899);
    			add_location(p1, file$2, 25, 0, 922);
    			attr_dev(code2, "class", "html");
    			add_location(code2, file$2, 27, 5, 1003);
    			attr_dev(pre0, "class", "svelte-1o09svi");
    			add_location(pre0, file$2, 27, 0, 998);
    			add_location(b0, file$2, 47, 22, 1451);
    			add_location(p2, file$2, 47, 0, 1429);
    			attr_dev(code3, "class", "javascript");
    			add_location(code3, file$2, 48, 5, 1525);
    			attr_dev(pre1, "class", "svelte-1o09svi");
    			add_location(pre1, file$2, 48, 0, 1520);
    			add_location(h21, file$2, 53, 0, 1614);
    			attr_dev(b1, "class", "svelte-1o09svi");
    			add_location(b1, file$2, 60, 6, 1725);
    			attr_dev(span0, "data-model", "user.balance");
    			add_location(span0, file$2, 61, 6, 1746);
    			attr_dev(b2, "class", "svelte-1o09svi");
    			add_location(b2, file$2, 63, 3, 1915);
    			attr_dev(button0, "onclick", "user.changeBalance(10)");
    			attr_dev(button0, "class", "svelte-1o09svi");
    			add_location(button0, file$2, 64, 6, 1940);
    			attr_dev(button1, "onclick", "user.changeBalance(-10)");
    			attr_dev(button1, "class", "svelte-1o09svi");
    			add_location(button1, file$2, 65, 6, 2004);
    			set_style(div1, "margin-right", "24px");
    			add_location(div1, file$2, 59, 2, 1686);
    			attr_dev(b3, "class", "svelte-1o09svi");
    			add_location(b3, file$2, 69, 6, 2119);
    			attr_dev(span1, "data-model", "user.name");
    			add_location(span1, file$2, 70, 6, 2137);
    			attr_dev(b4, "class", "svelte-1o09svi");
    			add_location(b4, file$2, 71, 3, 2181);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "data-model", "user.name");
    			input0.value = "John";
    			set_style(input0, "width", "240px");
    			attr_dev(input0, "class", "svelte-1o09svi");
    			add_location(input0, file$2, 72, 3, 2203);
    			set_style(div2, "margin-right", "24px");
    			add_location(div2, file$2, 68, 2, 2080);
    			set_style(div3, "display", "flex");
    			add_location(div3, file$2, 57, 1, 1655);
    			attr_dev(div4, "class", "form p svelte-1o09svi");
    			add_location(div4, file$2, 55, 0, 1632);
    			attr_dev(code4, "class", "html");
    			add_location(code4, file$2, 79, 5, 2312);
    			attr_dev(pre2, "class", "svelte-1o09svi");
    			add_location(pre2, file$2, 79, 0, 2307);
    			add_location(h22, file$2, 104, 0, 2912);
    			attr_dev(b5, "data-list", "scope.name");
    			attr_dev(b5, "class", "svelte-1o09svi");
    			add_location(b5, file$2, 109, 8, 3079);
    			attr_dev(span2, "data-list", "scope.price");
    			add_location(span2, file$2, 110, 9, 3126);
    			attr_dev(span3, "data-list", "scope.os");
    			add_location(span3, file$2, 111, 9, 3175);
    			attr_dev(div5, "data-list", "product");
    			attr_dev(div5, "data-id", "1");
    			set_style(div5, "margin-right", "24px");
    			add_location(div5, file$2, 108, 4, 3006);
    			attr_dev(b6, "data-list", "scope.name");
    			attr_dev(b6, "class", "svelte-1o09svi");
    			add_location(b6, file$2, 115, 8, 3307);
    			attr_dev(span4, "data-list", "scope.price");
    			add_location(span4, file$2, 116, 9, 3352);
    			attr_dev(span5, "data-list", "scope.os");
    			add_location(span5, file$2, 117, 9, 3401);
    			attr_dev(div6, "data-list", "product");
    			attr_dev(div6, "data-id", "2");
    			set_style(div6, "margin-right", "24px");
    			add_location(div6, file$2, 114, 4, 3234);
    			attr_dev(b7, "data-list", "scope.name");
    			attr_dev(b7, "class", "svelte-1o09svi");
    			add_location(b7, file$2, 124, 8, 3719);
    			attr_dev(span6, "data-list", "scope.price");
    			add_location(span6, file$2, 125, 9, 3765);
    			attr_dev(span7, "data-list", "scope.os");
    			add_location(span7, file$2, 126, 9, 3814);
    			attr_dev(div7, "data-list", "product");
    			attr_dev(div7, "data-id", "3");
    			set_style(div7, "margin-right", "24px");
    			add_location(div7, file$2, 123, 1, 3646);
    			attr_dev(div8, "class", "form p svelte-1o09svi");
    			set_style(div8, "display", "flex");
    			set_style(div8, "margin-bottom", "24px");
    			add_location(div8, file$2, 106, 0, 2939);
    			add_location(b8, file$2, 132, 4, 3957);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "price");
    			input1.value = "20";
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1o09svi");
    			add_location(input1, file$2, 132, 26, 3979);
    			option0.__value = "Android";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$2, 135, 8, 4076);
    			option1.__value = "IOS";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 136, 8, 4141);
    			attr_dev(select, "name", "os");
    			attr_dev(select, "class", "svelte-1o09svi");
    			add_location(select, file$2, 134, 4, 4049);
    			attr_dev(button2, "class", "svelte-1o09svi");
    			add_location(button2, file$2, 138, 4, 4199);
    			attr_dev(form, "onsubmit", "products.setPrice(this, event, os.value, Number(price.value))");
    			attr_dev(form, "class", "svelte-1o09svi");
    			add_location(form, file$2, 131, 0, 3873);
    			attr_dev(code5, "class", "html");
    			add_location(code5, file$2, 143, 5, 4346);
    			attr_dev(pre3, "class", "svelte-1o09svi");
    			add_location(pre3, file$2, 143, 0, 4341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, code0);
    			append_dev(div0, a0);
    			append_dev(div0, br);
    			append_dev(div0, t6);
    			append_dev(div0, code1);
    			append_dev(div0, a1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, pre0, anchor);
    			append_dev(pre0, code2);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t16);
    			append_dev(p2, b0);
    			append_dev(p2, t18);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, pre1, anchor);
    			append_dev(pre1, code3);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, b1);
    			append_dev(div1, t25);
    			append_dev(div1, span0);
    			append_dev(div1, t27);
    			append_dev(div1, b2);
    			append_dev(div1, t29);
    			append_dev(div1, button0);
    			append_dev(div1, t31);
    			append_dev(div1, button1);
    			append_dev(div3, t33);
    			append_dev(div3, div2);
    			append_dev(div2, b3);
    			append_dev(div2, t35);
    			append_dev(div2, span1);
    			append_dev(div2, t37);
    			append_dev(div2, b4);
    			append_dev(div2, t39);
    			append_dev(div2, input0);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, pre2, anchor);
    			append_dev(pre2, code4);
    			insert_dev(target, t42, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t44, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div5);
    			append_dev(div5, b5);
    			append_dev(div5, t46);
    			append_dev(div5, span2);
    			append_dev(div5, t48);
    			append_dev(div5, span3);
    			append_dev(div5, t50);
    			append_dev(div8, t51);
    			append_dev(div8, div6);
    			append_dev(div6, b6);
    			append_dev(div6, t53);
    			append_dev(div6, span4);
    			append_dev(div6, t55);
    			append_dev(div6, span5);
    			append_dev(div6, t57);
    			append_dev(div8, t58);
    			append_dev(div8, div7);
    			append_dev(div7, b7);
    			append_dev(div7, t60);
    			append_dev(div7, span6);
    			append_dev(div7, t62);
    			append_dev(div7, span7);
    			append_dev(div7, t64);
    			insert_dev(target, t65, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, b8);
    			append_dev(form, t67);
    			append_dev(form, input1);
    			append_dev(form, t68);
    			append_dev(form, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(form, t71);
    			append_dev(form, button2);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, pre3, anchor);
    			append_dev(pre3, code5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t42);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t44);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t65);
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(pre3);
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
    	afterUpdate(() => populate());
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Populate> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Populate", $$slots, []);
    	$$self.$capture_state = () => ({ afterUpdate });
    	return [];
    }

    class Populate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Populate",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Select.svelte generated by Svelte v3.24.1 */
    const file$3 = "src/Select.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let div0;
    	let code0;
    	let a0;
    	let br0;
    	let t6;
    	let code1;
    	let a1;
    	let t9;
    	let div3;
    	let label0;
    	let b0;
    	let t11;
    	let select0;
    	let option0;
    	let optgroup0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let option9;
    	let option10;
    	let optgroup1;
    	let option11;
    	let option12;
    	let option13;
    	let option14;
    	let option15;
    	let option16;
    	let option17;
    	let option18;
    	let option19;
    	let option20;
    	let t33;
    	let div1;
    	let t34;
    	let label1;
    	let b1;
    	let t36;
    	let select1;
    	let option21;
    	let optgroup2;
    	let option22;
    	let option23;
    	let option24;
    	let option25;
    	let option26;
    	let option27;
    	let option28;
    	let option29;
    	let option30;
    	let option31;
    	let optgroup3;
    	let option32;
    	let option33;
    	let option34;
    	let option35;
    	let option36;
    	let option37;
    	let option38;
    	let option39;
    	let option40;
    	let option41;
    	let t58;
    	let div2;
    	let t59;
    	let label2;
    	let b2;
    	let t61;
    	let select2;
    	let optgroup4;
    	let option42;
    	let option43;
    	let option44;
    	let option45;
    	let option46;
    	let option47;
    	let option48;
    	let option49;
    	let option50;
    	let option51;
    	let optgroup5;
    	let option52;
    	let option53;
    	let option54;
    	let option55;
    	let option56;
    	let option57;
    	let option58;
    	let option59;
    	let option60;
    	let option61;
    	let t82;
    	let h20;
    	let t84;
    	let pre0;
    	let code2;
    	let t86;
    	let h21;
    	let t88;
    	let pre1;
    	let code3;
    	let t90;
    	let h22;
    	let t92;
    	let pre2;
    	let code4;
    	let t94;
    	let br1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "select.js";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Simple mobile-friendly jQuery plugin for select boxes";
    			t3 = space();
    			div0 = element("div");
    			code0 = element("code");
    			code0.textContent = "GIT: ";
    			a0 = element("a");
    			a0.textContent = "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/libs/select.js";
    			br0 = element("br");
    			t6 = space();
    			code1 = element("code");
    			code1.textContent = "CDN: ";
    			a1 = element("a");
    			a1.textContent = "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/libs/select.js";
    			t9 = space();
    			div3 = element("div");
    			label0 = element("label");
    			b0 = element("b");
    			b0.textContent = "Default";
    			t11 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Choose country";
    			optgroup0 = element("optgroup");
    			option1 = element("option");
    			option1.textContent = "United States";
    			option2 = element("option");
    			option2.textContent = "China";
    			option3 = element("option");
    			option3.textContent = "Japan";
    			option4 = element("option");
    			option4.textContent = "Germany";
    			option5 = element("option");
    			option5.textContent = "United Kingdom";
    			option6 = element("option");
    			option6.textContent = "France";
    			option7 = element("option");
    			option7.textContent = "Italy";
    			option8 = element("option");
    			option8.textContent = "Canada";
    			option9 = element("option");
    			option9.textContent = "Russia";
    			option10 = element("option");
    			option10.textContent = "Spain";
    			optgroup1 = element("optgroup");
    			option11 = element("option");
    			option11.textContent = "Indonesia";
    			option12 = element("option");
    			option12.textContent = "Turkey";
    			option13 = element("option");
    			option13.textContent = "Switzerland";
    			option14 = element("option");
    			option14.textContent = "Saudi Arabia";
    			option15 = element("option");
    			option15.textContent = "Argentina";
    			option16 = element("option");
    			option16.textContent = "Taiwan Province of China";
    			option17 = element("option");
    			option17.textContent = "Sweden";
    			option18 = element("option");
    			option18.textContent = "Belgium";
    			option19 = element("option");
    			option19.textContent = "Poland";
    			option20 = element("option");
    			option20.textContent = "Nigeria";
    			t33 = space();
    			div1 = element("div");
    			t34 = space();
    			label1 = element("label");
    			b1 = element("b");
    			b1.textContent = "Search";
    			t36 = space();
    			select1 = element("select");
    			option21 = element("option");
    			option21.textContent = "Choose country";
    			optgroup2 = element("optgroup");
    			option22 = element("option");
    			option22.textContent = "United States";
    			option23 = element("option");
    			option23.textContent = "China";
    			option24 = element("option");
    			option24.textContent = "Japan";
    			option25 = element("option");
    			option25.textContent = "Germany";
    			option26 = element("option");
    			option26.textContent = "United Kingdom";
    			option27 = element("option");
    			option27.textContent = "France";
    			option28 = element("option");
    			option28.textContent = "Italy";
    			option29 = element("option");
    			option29.textContent = "Canada";
    			option30 = element("option");
    			option30.textContent = "Russia";
    			option31 = element("option");
    			option31.textContent = "Spain";
    			optgroup3 = element("optgroup");
    			option32 = element("option");
    			option32.textContent = "Indonesia";
    			option33 = element("option");
    			option33.textContent = "Turkey";
    			option34 = element("option");
    			option34.textContent = "Switzerland";
    			option35 = element("option");
    			option35.textContent = "Saudi Arabia";
    			option36 = element("option");
    			option36.textContent = "Argentina";
    			option37 = element("option");
    			option37.textContent = "Taiwan Province of China";
    			option38 = element("option");
    			option38.textContent = "Sweden";
    			option39 = element("option");
    			option39.textContent = "Belgium";
    			option40 = element("option");
    			option40.textContent = "Poland";
    			option41 = element("option");
    			option41.textContent = "Nigeria";
    			t58 = space();
    			div2 = element("div");
    			t59 = space();
    			label2 = element("label");
    			b2 = element("b");
    			b2.textContent = "Multiple";
    			t61 = space();
    			select2 = element("select");
    			optgroup4 = element("optgroup");
    			option42 = element("option");
    			option42.textContent = "United States";
    			option43 = element("option");
    			option43.textContent = "China";
    			option44 = element("option");
    			option44.textContent = "Japan";
    			option45 = element("option");
    			option45.textContent = "Germany";
    			option46 = element("option");
    			option46.textContent = "United Kingdom";
    			option47 = element("option");
    			option47.textContent = "France";
    			option48 = element("option");
    			option48.textContent = "Italy";
    			option49 = element("option");
    			option49.textContent = "Canada";
    			option50 = element("option");
    			option50.textContent = "Russia";
    			option51 = element("option");
    			option51.textContent = "Spain";
    			optgroup5 = element("optgroup");
    			option52 = element("option");
    			option52.textContent = "Indonesia";
    			option53 = element("option");
    			option53.textContent = "Turkey";
    			option54 = element("option");
    			option54.textContent = "Switzerland";
    			option55 = element("option");
    			option55.textContent = "Saudi Arabia";
    			option56 = element("option");
    			option56.textContent = "Argentina";
    			option57 = element("option");
    			option57.textContent = "Taiwan Province of China";
    			option58 = element("option");
    			option58.textContent = "Sweden";
    			option59 = element("option");
    			option59.textContent = "Belgium";
    			option60 = element("option");
    			option60.textContent = "Poland";
    			option61 = element("option");
    			option61.textContent = "Nigeria";
    			t82 = space();
    			h20 = element("h2");
    			h20.textContent = "Quick start";
    			t84 = space();
    			pre0 = element("pre");
    			code2 = element("code");
    			code2.textContent = `${`$('.select').select();`}`;
    			t86 = space();
    			h21 = element("h2");
    			h21.textContent = "Settings";
    			t88 = space();
    			pre1 = element("pre");
    			code3 = element("code");

    			code3.textContent = `${`{
  placeholder: 'Choose value',
  noResults: 'Not found',
  cssClass: 'select-default',
  search: true
}`}`;

    			t90 = space();
    			h22 = element("h2");
    			h22.textContent = "Reinit";
    			t92 = space();
    			pre2 = element("pre");
    			code4 = element("code");
    			code4.textContent = `${`$('#my-select').data('select').init();`}`;
    			t94 = space();
    			br1 = element("br");
    			add_location(h1, file$3, 5, 0, 81);
    			add_location(p, file$3, 6, 0, 100);
    			add_location(code0, file$3, 8, 4, 222);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://github.com/maxcoredev/maxcoredev.github.io/blob/master/libs/select.js");
    			add_location(a0, file$3, 8, 22, 240);
    			add_location(br0, file$3, 8, 207, 425);
    			add_location(code1, file$3, 9, 4, 434);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://cdn.jsdelivr.net/gh/maxcoredev/maxcoredev.github.io@master/libs/select.js");
    			add_location(a1, file$3, 9, 22, 452);
    			attr_dev(div0, "class", "p");
    			set_style(div0, "font-size", "16px");
    			set_style(div0, "line-height", "24px");
    			add_location(div0, file$3, 7, 0, 161);
    			add_location(b0, file$3, 13, 0, 677);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 15, 1, 726);
    			option1.__value = "1";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 17, 2, 799);
    			option2.__value = "2";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 18, 2, 842);
    			option3.__value = "3";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 19, 2, 877);
    			option4.__value = "4";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 20, 2, 912);
    			option5.__value = "5";
    			option5.value = option5.__value;
    			add_location(option5, file$3, 21, 2, 949);
    			option6.__value = "6";
    			option6.value = option6.__value;
    			add_location(option6, file$3, 22, 2, 993);
    			option7.__value = "7";
    			option7.value = option7.__value;
    			add_location(option7, file$3, 23, 2, 1029);
    			option8.__value = "8";
    			option8.value = option8.__value;
    			add_location(option8, file$3, 24, 2, 1064);
    			option9.__value = "9";
    			option9.value = option9.__value;
    			add_location(option9, file$3, 25, 2, 1100);
    			option10.__value = "10";
    			option10.value = option10.__value;
    			add_location(option10, file$3, 26, 2, 1136);
    			attr_dev(optgroup0, "label", "First ten");
    			add_location(optgroup0, file$3, 16, 1, 768);
    			option11.__value = "11";
    			option11.value = option11.__value;
    			add_location(option11, file$3, 29, 2, 1218);
    			option12.__value = "12";
    			option12.value = option12.__value;
    			add_location(option12, file$3, 30, 2, 1258);
    			option13.__value = "13";
    			option13.value = option13.__value;
    			add_location(option13, file$3, 31, 2, 1295);
    			option14.__value = "14";
    			option14.value = option14.__value;
    			add_location(option14, file$3, 32, 2, 1337);
    			option15.__value = "15";
    			option15.value = option15.__value;
    			add_location(option15, file$3, 33, 2, 1380);
    			option16.__value = "16";
    			option16.value = option16.__value;
    			add_location(option16, file$3, 34, 2, 1420);
    			option17.__value = "17";
    			option17.value = option17.__value;
    			add_location(option17, file$3, 35, 2, 1475);
    			option18.__value = "18";
    			option18.value = option18.__value;
    			add_location(option18, file$3, 36, 2, 1512);
    			option19.__value = "19";
    			option19.value = option19.__value;
    			add_location(option19, file$3, 37, 2, 1550);
    			option20.__value = "20";
    			option20.value = option20.__value;
    			add_location(option20, file$3, 38, 2, 1587);
    			attr_dev(optgroup1, "label", "First twenty");
    			add_location(optgroup1, file$3, 28, 1, 1184);
    			attr_dev(select0, "name", "b");
    			attr_dev(select0, "class", "select");
    			add_location(select0, file$3, 14, 0, 692);
    			add_location(label0, file$3, 12, 0, 669);
    			set_style(div1, "height", "12px");
    			add_location(div1, file$3, 42, 0, 1655);
    			add_location(b1, file$3, 44, 0, 1695);
    			option21.__value = "";
    			option21.value = option21.__value;
    			add_location(option21, file$3, 46, 1, 1752);
    			option22.__value = "1";
    			option22.value = option22.__value;
    			add_location(option22, file$3, 48, 2, 1825);
    			option23.__value = "2";
    			option23.value = option23.__value;
    			add_location(option23, file$3, 49, 2, 1868);
    			option24.__value = "3";
    			option24.value = option24.__value;
    			add_location(option24, file$3, 50, 2, 1903);
    			option25.__value = "4";
    			option25.value = option25.__value;
    			add_location(option25, file$3, 51, 2, 1938);
    			option26.__value = "5";
    			option26.value = option26.__value;
    			add_location(option26, file$3, 52, 2, 1975);
    			option27.__value = "6";
    			option27.value = option27.__value;
    			add_location(option27, file$3, 53, 2, 2019);
    			option28.__value = "7";
    			option28.value = option28.__value;
    			add_location(option28, file$3, 54, 2, 2055);
    			option29.__value = "8";
    			option29.value = option29.__value;
    			add_location(option29, file$3, 55, 2, 2090);
    			option30.__value = "9";
    			option30.value = option30.__value;
    			add_location(option30, file$3, 56, 2, 2126);
    			option31.__value = "10";
    			option31.value = option31.__value;
    			add_location(option31, file$3, 57, 2, 2162);
    			attr_dev(optgroup2, "label", "First ten");
    			add_location(optgroup2, file$3, 47, 1, 1794);
    			option32.__value = "11";
    			option32.value = option32.__value;
    			add_location(option32, file$3, 60, 2, 2244);
    			option33.__value = "12";
    			option33.value = option33.__value;
    			add_location(option33, file$3, 61, 2, 2284);
    			option34.__value = "13";
    			option34.value = option34.__value;
    			add_location(option34, file$3, 62, 2, 2321);
    			option35.__value = "14";
    			option35.value = option35.__value;
    			add_location(option35, file$3, 63, 2, 2363);
    			option36.__value = "15";
    			option36.value = option36.__value;
    			add_location(option36, file$3, 64, 2, 2406);
    			option37.__value = "16";
    			option37.value = option37.__value;
    			add_location(option37, file$3, 65, 2, 2446);
    			option38.__value = "17";
    			option38.value = option38.__value;
    			add_location(option38, file$3, 66, 2, 2501);
    			option39.__value = "18";
    			option39.value = option39.__value;
    			add_location(option39, file$3, 67, 2, 2538);
    			option40.__value = "19";
    			option40.value = option40.__value;
    			add_location(option40, file$3, 68, 2, 2576);
    			option41.__value = "20";
    			option41.value = option41.__value;
    			add_location(option41, file$3, 69, 2, 2613);
    			attr_dev(optgroup3, "label", "First twenty");
    			add_location(optgroup3, file$3, 59, 1, 2210);
    			attr_dev(select1, "name", "a");
    			attr_dev(select1, "class", "select");
    			select1.required = true;
    			add_location(select1, file$3, 45, 0, 1709);
    			add_location(label1, file$3, 43, 0, 1687);
    			set_style(div2, "height", "12px");
    			add_location(div2, file$3, 73, 0, 2681);
    			add_location(b2, file$3, 75, 0, 2721);
    			option42.__value = "1";
    			option42.value = option42.__value;
    			add_location(option42, file$3, 78, 2, 2811);
    			option43.__value = "2";
    			option43.value = option43.__value;
    			add_location(option43, file$3, 79, 2, 2854);
    			option44.__value = "3";
    			option44.value = option44.__value;
    			add_location(option44, file$3, 80, 2, 2889);
    			option45.__value = "4";
    			option45.value = option45.__value;
    			add_location(option45, file$3, 81, 2, 2924);
    			option46.__value = "5";
    			option46.value = option46.__value;
    			add_location(option46, file$3, 82, 2, 2961);
    			option47.__value = "6";
    			option47.value = option47.__value;
    			add_location(option47, file$3, 83, 2, 3005);
    			option48.__value = "7";
    			option48.value = option48.__value;
    			add_location(option48, file$3, 84, 2, 3041);
    			option49.__value = "8";
    			option49.value = option49.__value;
    			add_location(option49, file$3, 85, 2, 3076);
    			option50.__value = "9";
    			option50.value = option50.__value;
    			add_location(option50, file$3, 86, 2, 3112);
    			option51.__value = "10";
    			option51.value = option51.__value;
    			add_location(option51, file$3, 87, 2, 3148);
    			attr_dev(optgroup4, "label", "First ten");
    			add_location(optgroup4, file$3, 77, 1, 2780);
    			option52.__value = "11";
    			option52.value = option52.__value;
    			add_location(option52, file$3, 90, 2, 3230);
    			option53.__value = "12";
    			option53.value = option53.__value;
    			add_location(option53, file$3, 91, 2, 3270);
    			option54.__value = "13";
    			option54.value = option54.__value;
    			add_location(option54, file$3, 92, 2, 3307);
    			option55.__value = "14";
    			option55.value = option55.__value;
    			add_location(option55, file$3, 93, 2, 3349);
    			option56.__value = "15";
    			option56.value = option56.__value;
    			add_location(option56, file$3, 94, 2, 3392);
    			option57.__value = "16";
    			option57.value = option57.__value;
    			add_location(option57, file$3, 95, 2, 3432);
    			option58.__value = "17";
    			option58.value = option58.__value;
    			add_location(option58, file$3, 96, 2, 3487);
    			option59.__value = "18";
    			option59.value = option59.__value;
    			add_location(option59, file$3, 97, 2, 3524);
    			option60.__value = "19";
    			option60.value = option60.__value;
    			add_location(option60, file$3, 98, 2, 3562);
    			option61.__value = "20";
    			option61.value = option61.__value;
    			add_location(option61, file$3, 99, 2, 3599);
    			attr_dev(optgroup5, "label", "First twenty");
    			add_location(optgroup5, file$3, 89, 1, 3196);
    			attr_dev(select2, "name", "c");
    			select2.multiple = true;
    			attr_dev(select2, "class", "select");
    			add_location(select2, file$3, 76, 0, 2737);
    			add_location(label2, file$3, 74, 0, 2713);
    			attr_dev(div3, "class", "p");
    			add_location(div3, file$3, 11, 0, 653);
    			add_location(h20, file$3, 105, 0, 3675);
    			add_location(code2, file$3, 106, 5, 3701);
    			add_location(pre0, file$3, 106, 0, 3696);
    			add_location(h21, file$3, 108, 0, 3748);
    			add_location(code3, file$3, 110, 5, 3772);
    			add_location(pre1, file$3, 110, 0, 3767);
    			add_location(h22, file$3, 117, 0, 3902);
    			add_location(code4, file$3, 119, 5, 3924);
    			add_location(pre2, file$3, 119, 0, 3919);
    			add_location(br1, file$3, 120, 0, 3986);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, code0);
    			append_dev(div0, a0);
    			append_dev(div0, br0);
    			append_dev(div0, t6);
    			append_dev(div0, code1);
    			append_dev(div0, a1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label0);
    			append_dev(label0, b0);
    			append_dev(label0, t11);
    			append_dev(label0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, optgroup0);
    			append_dev(optgroup0, option1);
    			append_dev(optgroup0, option2);
    			append_dev(optgroup0, option3);
    			append_dev(optgroup0, option4);
    			append_dev(optgroup0, option5);
    			append_dev(optgroup0, option6);
    			append_dev(optgroup0, option7);
    			append_dev(optgroup0, option8);
    			append_dev(optgroup0, option9);
    			append_dev(optgroup0, option10);
    			append_dev(select0, optgroup1);
    			append_dev(optgroup1, option11);
    			append_dev(optgroup1, option12);
    			append_dev(optgroup1, option13);
    			append_dev(optgroup1, option14);
    			append_dev(optgroup1, option15);
    			append_dev(optgroup1, option16);
    			append_dev(optgroup1, option17);
    			append_dev(optgroup1, option18);
    			append_dev(optgroup1, option19);
    			append_dev(optgroup1, option20);
    			append_dev(div3, t33);
    			append_dev(div3, div1);
    			append_dev(div3, t34);
    			append_dev(div3, label1);
    			append_dev(label1, b1);
    			append_dev(label1, t36);
    			append_dev(label1, select1);
    			append_dev(select1, option21);
    			append_dev(select1, optgroup2);
    			append_dev(optgroup2, option22);
    			append_dev(optgroup2, option23);
    			append_dev(optgroup2, option24);
    			append_dev(optgroup2, option25);
    			append_dev(optgroup2, option26);
    			append_dev(optgroup2, option27);
    			append_dev(optgroup2, option28);
    			append_dev(optgroup2, option29);
    			append_dev(optgroup2, option30);
    			append_dev(optgroup2, option31);
    			append_dev(select1, optgroup3);
    			append_dev(optgroup3, option32);
    			append_dev(optgroup3, option33);
    			append_dev(optgroup3, option34);
    			append_dev(optgroup3, option35);
    			append_dev(optgroup3, option36);
    			append_dev(optgroup3, option37);
    			append_dev(optgroup3, option38);
    			append_dev(optgroup3, option39);
    			append_dev(optgroup3, option40);
    			append_dev(optgroup3, option41);
    			append_dev(div3, t58);
    			append_dev(div3, div2);
    			append_dev(div3, t59);
    			append_dev(div3, label2);
    			append_dev(label2, b2);
    			append_dev(label2, t61);
    			append_dev(label2, select2);
    			append_dev(select2, optgroup4);
    			append_dev(optgroup4, option42);
    			append_dev(optgroup4, option43);
    			append_dev(optgroup4, option44);
    			append_dev(optgroup4, option45);
    			append_dev(optgroup4, option46);
    			append_dev(optgroup4, option47);
    			append_dev(optgroup4, option48);
    			append_dev(optgroup4, option49);
    			append_dev(optgroup4, option50);
    			append_dev(optgroup4, option51);
    			append_dev(select2, optgroup5);
    			append_dev(optgroup5, option52);
    			append_dev(optgroup5, option53);
    			append_dev(optgroup5, option54);
    			append_dev(optgroup5, option55);
    			append_dev(optgroup5, option56);
    			append_dev(optgroup5, option57);
    			append_dev(optgroup5, option58);
    			append_dev(optgroup5, option59);
    			append_dev(optgroup5, option60);
    			append_dev(optgroup5, option61);
    			insert_dev(target, t82, anchor);
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t84, anchor);
    			insert_dev(target, pre0, anchor);
    			append_dev(pre0, code2);
    			insert_dev(target, t86, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t88, anchor);
    			insert_dev(target, pre1, anchor);
    			append_dev(pre1, code3);
    			insert_dev(target, t90, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t92, anchor);
    			insert_dev(target, pre2, anchor);
    			append_dev(pre2, code4);
    			insert_dev(target, t94, anchor);
    			insert_dev(target, br1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t82);
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t84);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t86);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t88);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t90);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t92);
    			if (detaching) detach_dev(pre2);
    			if (detaching) detach_dev(t94);
    			if (detaching) detach_dev(br1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	onMount(() => select());
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Select", $$slots, []);
    	$$self.$capture_state = () => ({ onMount });
    	return [];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Table.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/Table.svelte";

    function create_fragment$4(ctx) {
    	let style;
    	let t1;
    	let div56;
    	let div0;
    	let div1;
    	let div2;
    	let div3;
    	let t6;
    	let div4;
    	let div5;
    	let div6;
    	let div7;
    	let t11;
    	let div8;
    	let div9;
    	let div10;
    	let div11;
    	let t16;
    	let div12;
    	let div13;
    	let div14;
    	let div15;
    	let t21;
    	let div16;
    	let div17;
    	let div18;
    	let div19;
    	let t26;
    	let div20;
    	let div21;
    	let div22;
    	let div23;
    	let t31;
    	let div24;
    	let div25;
    	let div26;
    	let div27;
    	let t36;
    	let div28;
    	let div29;
    	let div30;
    	let div31;
    	let t41;
    	let div32;
    	let div33;
    	let div34;
    	let div35;
    	let t46;
    	let div36;
    	let div37;
    	let div38;
    	let div39;
    	let t51;
    	let div40;
    	let div41;
    	let div42;
    	let div43;
    	let t56;
    	let div44;
    	let div45;
    	let div46;
    	let div47;
    	let t61;
    	let div48;
    	let div49;
    	let div50;
    	let div51;
    	let t66;
    	let div52;
    	let div53;
    	let div54;
    	let div55;
    	let t71;
    	let div66;
    	let div59;
    	let div58;
    	let b;
    	let t73;
    	let div57;
    	let t75;
    	let a0;
    	let t77;
    	let div60;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t78;
    	let th1;
    	let t80;
    	let tr1;
    	let th2;
    	let t82;
    	let th3;
    	let t84;
    	let th4;
    	let t86;
    	let tbody;
    	let tr2;
    	let td0;
    	let td1;
    	let td2;
    	let t90;
    	let tr3;
    	let td3;
    	let td4;
    	let td5;
    	let t94;
    	let tr4;
    	let td6;
    	let td7;
    	let td8;
    	let t98;
    	let tr5;
    	let td9;
    	let td10;
    	let td11;
    	let t102;
    	let tr6;
    	let td12;
    	let td13;
    	let td14;
    	let t106;
    	let tr7;
    	let td15;
    	let td16;
    	let td17;
    	let t110;
    	let tr8;
    	let td18;
    	let td19;
    	let td20;
    	let t114;
    	let tr9;
    	let td21;
    	let td22;
    	let td23;
    	let t118;
    	let tr10;
    	let td24;
    	let td25;
    	let td26;
    	let t122;
    	let tr11;
    	let td27;
    	let td28;
    	let td29;
    	let t126;
    	let tr12;
    	let td30;
    	let td31;
    	let td32;
    	let t130;
    	let tr13;
    	let td33;
    	let td34;
    	let td35;
    	let t134;
    	let tr14;
    	let td36;
    	let td37;
    	let td38;
    	let t138;
    	let tr15;
    	let td39;
    	let td40;
    	let td41;
    	let t142;
    	let tr16;
    	let td42;
    	let td43;
    	let td44;
    	let t146;
    	let tr17;
    	let td45;
    	let td46;
    	let td47;
    	let t150;
    	let tr18;
    	let td48;
    	let td49;
    	let td50;
    	let t154;
    	let tr19;
    	let td51;
    	let td52;
    	let td53;
    	let t158;
    	let tr20;
    	let td54;
    	let td55;
    	let td56;
    	let t162;
    	let tr21;
    	let td57;
    	let td58;
    	let td59;
    	let t166;
    	let tr22;
    	let td60;
    	let td61;
    	let td62;
    	let t170;
    	let tr23;
    	let td63;
    	let td64;
    	let td65;
    	let t174;
    	let tr24;
    	let td66;
    	let td67;
    	let td68;
    	let t178;
    	let tr25;
    	let td69;
    	let td70;
    	let td71;
    	let t182;
    	let tr26;
    	let td72;
    	let td73;
    	let td74;
    	let t186;
    	let tr27;
    	let td75;
    	let td76;
    	let td77;
    	let t190;
    	let tr28;
    	let td78;
    	let td79;
    	let td80;
    	let t194;
    	let tr29;
    	let td81;
    	let td82;
    	let td83;
    	let t198;
    	let tr30;
    	let td84;
    	let td85;
    	let td86;
    	let t202;
    	let tr31;
    	let td87;
    	let td88;
    	let td89;
    	let t206;
    	let tr32;
    	let td90;
    	let td91;
    	let td92;
    	let t210;
    	let tr33;
    	let td93;
    	let td94;
    	let td95;
    	let t214;
    	let tr34;
    	let td96;
    	let td97;
    	let td98;
    	let t218;
    	let tr35;
    	let td99;
    	let td100;
    	let td101;
    	let t222;
    	let tr36;
    	let td102;
    	let td103;
    	let td104;
    	let t226;
    	let tr37;
    	let td105;
    	let td106;
    	let td107;
    	let t230;
    	let tr38;
    	let td108;
    	let td109;
    	let td110;
    	let t234;
    	let tr39;
    	let td111;
    	let td112;
    	let td113;
    	let t238;
    	let tr40;
    	let td114;
    	let td115;
    	let td116;
    	let t242;
    	let tr41;
    	let td117;
    	let td118;
    	let td119;
    	let t246;
    	let tr42;
    	let td120;
    	let td121;
    	let td122;
    	let t250;
    	let tr43;
    	let td123;
    	let td124;
    	let td125;
    	let t254;
    	let tr44;
    	let td126;
    	let td127;
    	let td128;
    	let t258;
    	let tr45;
    	let td129;
    	let td130;
    	let td131;
    	let t262;
    	let tr46;
    	let td132;
    	let td133;
    	let td134;
    	let t266;
    	let tr47;
    	let td135;
    	let td136;
    	let td137;
    	let t270;
    	let tr48;
    	let td138;
    	let td139;
    	let td140;
    	let t274;
    	let tr49;
    	let td141;
    	let td142;
    	let td143;
    	let t278;
    	let tr50;
    	let td144;
    	let td145;
    	let td146;
    	let t282;
    	let tr51;
    	let td147;
    	let td148;
    	let td149;
    	let t286;
    	let tr52;
    	let td150;
    	let td151;
    	let td152;
    	let t290;
    	let tr53;
    	let td153;
    	let td154;
    	let td155;
    	let t294;
    	let tr54;
    	let td156;
    	let td157;
    	let td158;
    	let t298;
    	let tr55;
    	let td159;
    	let td160;
    	let td161;
    	let t302;
    	let tr56;
    	let td162;
    	let td163;
    	let td164;
    	let t306;
    	let tr57;
    	let td165;
    	let td166;
    	let td167;
    	let t310;
    	let tr58;
    	let td168;
    	let td169;
    	let td170;
    	let t314;
    	let tfoot;
    	let tr59;
    	let th5;
    	let t316;
    	let th6;
    	let t318;
    	let th7;
    	let t320;
    	let div61;
    	let t322;
    	let div65;
    	let div63;
    	let div62;
    	let t324;
    	let a1;
    	let t326;
    	let div64;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "html, body, main {\n            height:100%;\n        }\n        main {display:flex;flex:1;overflow:hidden;font-size:14px;line-height:21px;}";
    			t1 = space();
    			div56 = element("div");
    			div0 = element("div");
    			div0.textContent = "Filter field";
    			div1 = element("div");
    			div1.textContent = "Filter field";
    			div2 = element("div");
    			div2.textContent = "Filter field";
    			div3 = element("div");
    			div3.textContent = "Filter field";
    			t6 = space();
    			div4 = element("div");
    			div4.textContent = "Filter field";
    			div5 = element("div");
    			div5.textContent = "Filter field";
    			div6 = element("div");
    			div6.textContent = "Filter field";
    			div7 = element("div");
    			div7.textContent = "Filter field";
    			t11 = space();
    			div8 = element("div");
    			div8.textContent = "Filter field";
    			div9 = element("div");
    			div9.textContent = "Filter field";
    			div10 = element("div");
    			div10.textContent = "Filter field";
    			div11 = element("div");
    			div11.textContent = "Filter field";
    			t16 = space();
    			div12 = element("div");
    			div12.textContent = "Filter field";
    			div13 = element("div");
    			div13.textContent = "Filter field";
    			div14 = element("div");
    			div14.textContent = "Filter field";
    			div15 = element("div");
    			div15.textContent = "Filter field";
    			t21 = space();
    			div16 = element("div");
    			div16.textContent = "Filter field";
    			div17 = element("div");
    			div17.textContent = "Filter field";
    			div18 = element("div");
    			div18.textContent = "Filter field";
    			div19 = element("div");
    			div19.textContent = "Filter field";
    			t26 = space();
    			div20 = element("div");
    			div20.textContent = "Filter field";
    			div21 = element("div");
    			div21.textContent = "Filter field";
    			div22 = element("div");
    			div22.textContent = "Filter field";
    			div23 = element("div");
    			div23.textContent = "Filter field";
    			t31 = space();
    			div24 = element("div");
    			div24.textContent = "Filter field";
    			div25 = element("div");
    			div25.textContent = "Filter field";
    			div26 = element("div");
    			div26.textContent = "Filter field";
    			div27 = element("div");
    			div27.textContent = "Filter field";
    			t36 = space();
    			div28 = element("div");
    			div28.textContent = "Filter field";
    			div29 = element("div");
    			div29.textContent = "Filter field";
    			div30 = element("div");
    			div30.textContent = "Filter field";
    			div31 = element("div");
    			div31.textContent = "Filter field";
    			t41 = space();
    			div32 = element("div");
    			div32.textContent = "Filter field";
    			div33 = element("div");
    			div33.textContent = "Filter field";
    			div34 = element("div");
    			div34.textContent = "Filter field";
    			div35 = element("div");
    			div35.textContent = "Filter field";
    			t46 = space();
    			div36 = element("div");
    			div36.textContent = "Filter field";
    			div37 = element("div");
    			div37.textContent = "Filter field";
    			div38 = element("div");
    			div38.textContent = "Filter field";
    			div39 = element("div");
    			div39.textContent = "Filter field";
    			t51 = space();
    			div40 = element("div");
    			div40.textContent = "Filter field";
    			div41 = element("div");
    			div41.textContent = "Filter field";
    			div42 = element("div");
    			div42.textContent = "Filter field";
    			div43 = element("div");
    			div43.textContent = "Filter field";
    			t56 = space();
    			div44 = element("div");
    			div44.textContent = "Filter field";
    			div45 = element("div");
    			div45.textContent = "Filter field";
    			div46 = element("div");
    			div46.textContent = "Filter field";
    			div47 = element("div");
    			div47.textContent = "Filter field";
    			t61 = space();
    			div48 = element("div");
    			div48.textContent = "Filter field";
    			div49 = element("div");
    			div49.textContent = "Filter field";
    			div50 = element("div");
    			div50.textContent = "Filter field";
    			div51 = element("div");
    			div51.textContent = "Filter field";
    			t66 = space();
    			div52 = element("div");
    			div52.textContent = "Filter field";
    			div53 = element("div");
    			div53.textContent = "Filter field";
    			div54 = element("div");
    			div54.textContent = "Filter field";
    			div55 = element("div");
    			div55.textContent = "Filter field";
    			t71 = space();
    			div66 = element("div");
    			div59 = element("div");
    			div58 = element("div");
    			b = element("b");
    			b.textContent = "System table";
    			t73 = space();
    			div57 = element("div");
    			div57.textContent = "With fixed column, header, footer and content opening at the bottom";
    			t75 = space();
    			a0 = element("a");
    			a0.textContent = "Add";
    			t77 = space();
    			div60 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			t78 = space();
    			th1 = element("th");
    			th1.textContent = "Data";
    			t80 = space();
    			tr1 = element("tr");
    			th2 = element("th");
    			th2.textContent = "№";
    			t82 = space();
    			th3 = element("th");
    			th3.textContent = "Price";
    			t84 = space();
    			th4 = element("th");
    			th4.textContent = "Qty";
    			t86 = space();
    			tbody = element("tbody");
    			tr2 = element("tr");
    			td0 = element("td");
    			td0.textContent = "1";
    			td1 = element("td");
    			td1.textContent = "2";
    			td2 = element("td");
    			td2.textContent = "3";
    			t90 = space();
    			tr3 = element("tr");
    			td3 = element("td");
    			td3.textContent = "2";
    			td4 = element("td");
    			td4.textContent = "2";
    			td5 = element("td");
    			td5.textContent = "3";
    			t94 = space();
    			tr4 = element("tr");
    			td6 = element("td");
    			td6.textContent = "3";
    			td7 = element("td");
    			td7.textContent = "2";
    			td8 = element("td");
    			td8.textContent = "3";
    			t98 = space();
    			tr5 = element("tr");
    			td9 = element("td");
    			td9.textContent = "4";
    			td10 = element("td");
    			td10.textContent = "2";
    			td11 = element("td");
    			td11.textContent = "3";
    			t102 = space();
    			tr6 = element("tr");
    			td12 = element("td");
    			td12.textContent = "5";
    			td13 = element("td");
    			td13.textContent = "2";
    			td14 = element("td");
    			td14.textContent = "3";
    			t106 = space();
    			tr7 = element("tr");
    			td15 = element("td");
    			td15.textContent = "6";
    			td16 = element("td");
    			td16.textContent = "2";
    			td17 = element("td");
    			td17.textContent = "3";
    			t110 = space();
    			tr8 = element("tr");
    			td18 = element("td");
    			td18.textContent = "7";
    			td19 = element("td");
    			td19.textContent = "2";
    			td20 = element("td");
    			td20.textContent = "3";
    			t114 = space();
    			tr9 = element("tr");
    			td21 = element("td");
    			td21.textContent = "8";
    			td22 = element("td");
    			td22.textContent = "2";
    			td23 = element("td");
    			td23.textContent = "3";
    			t118 = space();
    			tr10 = element("tr");
    			td24 = element("td");
    			td24.textContent = "9";
    			td25 = element("td");
    			td25.textContent = "2";
    			td26 = element("td");
    			td26.textContent = "3";
    			t122 = space();
    			tr11 = element("tr");
    			td27 = element("td");
    			td27.textContent = "10";
    			td28 = element("td");
    			td28.textContent = "2";
    			td29 = element("td");
    			td29.textContent = "3";
    			t126 = space();
    			tr12 = element("tr");
    			td30 = element("td");
    			td30.textContent = "11";
    			td31 = element("td");
    			td31.textContent = "2";
    			td32 = element("td");
    			td32.textContent = "3";
    			t130 = space();
    			tr13 = element("tr");
    			td33 = element("td");
    			td33.textContent = "12";
    			td34 = element("td");
    			td34.textContent = "2";
    			td35 = element("td");
    			td35.textContent = "3";
    			t134 = space();
    			tr14 = element("tr");
    			td36 = element("td");
    			td36.textContent = "13";
    			td37 = element("td");
    			td37.textContent = "2";
    			td38 = element("td");
    			td38.textContent = "3";
    			t138 = space();
    			tr15 = element("tr");
    			td39 = element("td");
    			td39.textContent = "14";
    			td40 = element("td");
    			td40.textContent = "2";
    			td41 = element("td");
    			td41.textContent = "3";
    			t142 = space();
    			tr16 = element("tr");
    			td42 = element("td");
    			td42.textContent = "15";
    			td43 = element("td");
    			td43.textContent = "2";
    			td44 = element("td");
    			td44.textContent = "3";
    			t146 = space();
    			tr17 = element("tr");
    			td45 = element("td");
    			td45.textContent = "16";
    			td46 = element("td");
    			td46.textContent = "2";
    			td47 = element("td");
    			td47.textContent = "3";
    			t150 = space();
    			tr18 = element("tr");
    			td48 = element("td");
    			td48.textContent = "17";
    			td49 = element("td");
    			td49.textContent = "2";
    			td50 = element("td");
    			td50.textContent = "3";
    			t154 = space();
    			tr19 = element("tr");
    			td51 = element("td");
    			td51.textContent = "18";
    			td52 = element("td");
    			td52.textContent = "2";
    			td53 = element("td");
    			td53.textContent = "3";
    			t158 = space();
    			tr20 = element("tr");
    			td54 = element("td");
    			td54.textContent = "19";
    			td55 = element("td");
    			td55.textContent = "2";
    			td56 = element("td");
    			td56.textContent = "3";
    			t162 = space();
    			tr21 = element("tr");
    			td57 = element("td");
    			td57.textContent = "20";
    			td58 = element("td");
    			td58.textContent = "2";
    			td59 = element("td");
    			td59.textContent = "3";
    			t166 = space();
    			tr22 = element("tr");
    			td60 = element("td");
    			td60.textContent = "21";
    			td61 = element("td");
    			td61.textContent = "2";
    			td62 = element("td");
    			td62.textContent = "3";
    			t170 = space();
    			tr23 = element("tr");
    			td63 = element("td");
    			td63.textContent = "22";
    			td64 = element("td");
    			td64.textContent = "2";
    			td65 = element("td");
    			td65.textContent = "3";
    			t174 = space();
    			tr24 = element("tr");
    			td66 = element("td");
    			td66.textContent = "23";
    			td67 = element("td");
    			td67.textContent = "2";
    			td68 = element("td");
    			td68.textContent = "3";
    			t178 = space();
    			tr25 = element("tr");
    			td69 = element("td");
    			td69.textContent = "24";
    			td70 = element("td");
    			td70.textContent = "2";
    			td71 = element("td");
    			td71.textContent = "3";
    			t182 = space();
    			tr26 = element("tr");
    			td72 = element("td");
    			td72.textContent = "25";
    			td73 = element("td");
    			td73.textContent = "2";
    			td74 = element("td");
    			td74.textContent = "3";
    			t186 = space();
    			tr27 = element("tr");
    			td75 = element("td");
    			td75.textContent = "26";
    			td76 = element("td");
    			td76.textContent = "2";
    			td77 = element("td");
    			td77.textContent = "3";
    			t190 = space();
    			tr28 = element("tr");
    			td78 = element("td");
    			td78.textContent = "27";
    			td79 = element("td");
    			td79.textContent = "2";
    			td80 = element("td");
    			td80.textContent = "3";
    			t194 = space();
    			tr29 = element("tr");
    			td81 = element("td");
    			td81.textContent = "28";
    			td82 = element("td");
    			td82.textContent = "2";
    			td83 = element("td");
    			td83.textContent = "3";
    			t198 = space();
    			tr30 = element("tr");
    			td84 = element("td");
    			td84.textContent = "29";
    			td85 = element("td");
    			td85.textContent = "2";
    			td86 = element("td");
    			td86.textContent = "3";
    			t202 = space();
    			tr31 = element("tr");
    			td87 = element("td");
    			td87.textContent = "30";
    			td88 = element("td");
    			td88.textContent = "2";
    			td89 = element("td");
    			td89.textContent = "3";
    			t206 = space();
    			tr32 = element("tr");
    			td90 = element("td");
    			td90.textContent = "31";
    			td91 = element("td");
    			td91.textContent = "2";
    			td92 = element("td");
    			td92.textContent = "3";
    			t210 = space();
    			tr33 = element("tr");
    			td93 = element("td");
    			td93.textContent = "32";
    			td94 = element("td");
    			td94.textContent = "2";
    			td95 = element("td");
    			td95.textContent = "3";
    			t214 = space();
    			tr34 = element("tr");
    			td96 = element("td");
    			td96.textContent = "33";
    			td97 = element("td");
    			td97.textContent = "2";
    			td98 = element("td");
    			td98.textContent = "3";
    			t218 = space();
    			tr35 = element("tr");
    			td99 = element("td");
    			td99.textContent = "34";
    			td100 = element("td");
    			td100.textContent = "2";
    			td101 = element("td");
    			td101.textContent = "3";
    			t222 = space();
    			tr36 = element("tr");
    			td102 = element("td");
    			td102.textContent = "35";
    			td103 = element("td");
    			td103.textContent = "2";
    			td104 = element("td");
    			td104.textContent = "3";
    			t226 = space();
    			tr37 = element("tr");
    			td105 = element("td");
    			td105.textContent = "36";
    			td106 = element("td");
    			td106.textContent = "2";
    			td107 = element("td");
    			td107.textContent = "3";
    			t230 = space();
    			tr38 = element("tr");
    			td108 = element("td");
    			td108.textContent = "37";
    			td109 = element("td");
    			td109.textContent = "2";
    			td110 = element("td");
    			td110.textContent = "3";
    			t234 = space();
    			tr39 = element("tr");
    			td111 = element("td");
    			td111.textContent = "38";
    			td112 = element("td");
    			td112.textContent = "2";
    			td113 = element("td");
    			td113.textContent = "3";
    			t238 = space();
    			tr40 = element("tr");
    			td114 = element("td");
    			td114.textContent = "39";
    			td115 = element("td");
    			td115.textContent = "2";
    			td116 = element("td");
    			td116.textContent = "3";
    			t242 = space();
    			tr41 = element("tr");
    			td117 = element("td");
    			td117.textContent = "40";
    			td118 = element("td");
    			td118.textContent = "2";
    			td119 = element("td");
    			td119.textContent = "3";
    			t246 = space();
    			tr42 = element("tr");
    			td120 = element("td");
    			td120.textContent = "41";
    			td121 = element("td");
    			td121.textContent = "2";
    			td122 = element("td");
    			td122.textContent = "3";
    			t250 = space();
    			tr43 = element("tr");
    			td123 = element("td");
    			td123.textContent = "42";
    			td124 = element("td");
    			td124.textContent = "2";
    			td125 = element("td");
    			td125.textContent = "3";
    			t254 = space();
    			tr44 = element("tr");
    			td126 = element("td");
    			td126.textContent = "43";
    			td127 = element("td");
    			td127.textContent = "2";
    			td128 = element("td");
    			td128.textContent = "3";
    			t258 = space();
    			tr45 = element("tr");
    			td129 = element("td");
    			td129.textContent = "44";
    			td130 = element("td");
    			td130.textContent = "2";
    			td131 = element("td");
    			td131.textContent = "3";
    			t262 = space();
    			tr46 = element("tr");
    			td132 = element("td");
    			td132.textContent = "45";
    			td133 = element("td");
    			td133.textContent = "2";
    			td134 = element("td");
    			td134.textContent = "3";
    			t266 = space();
    			tr47 = element("tr");
    			td135 = element("td");
    			td135.textContent = "46";
    			td136 = element("td");
    			td136.textContent = "2";
    			td137 = element("td");
    			td137.textContent = "3";
    			t270 = space();
    			tr48 = element("tr");
    			td138 = element("td");
    			td138.textContent = "47";
    			td139 = element("td");
    			td139.textContent = "2";
    			td140 = element("td");
    			td140.textContent = "3";
    			t274 = space();
    			tr49 = element("tr");
    			td141 = element("td");
    			td141.textContent = "48";
    			td142 = element("td");
    			td142.textContent = "2";
    			td143 = element("td");
    			td143.textContent = "3";
    			t278 = space();
    			tr50 = element("tr");
    			td144 = element("td");
    			td144.textContent = "49";
    			td145 = element("td");
    			td145.textContent = "2";
    			td146 = element("td");
    			td146.textContent = "3";
    			t282 = space();
    			tr51 = element("tr");
    			td147 = element("td");
    			td147.textContent = "50";
    			td148 = element("td");
    			td148.textContent = "2";
    			td149 = element("td");
    			td149.textContent = "3";
    			t286 = space();
    			tr52 = element("tr");
    			td150 = element("td");
    			td150.textContent = "51";
    			td151 = element("td");
    			td151.textContent = "2";
    			td152 = element("td");
    			td152.textContent = "3";
    			t290 = space();
    			tr53 = element("tr");
    			td153 = element("td");
    			td153.textContent = "52";
    			td154 = element("td");
    			td154.textContent = "2";
    			td155 = element("td");
    			td155.textContent = "3";
    			t294 = space();
    			tr54 = element("tr");
    			td156 = element("td");
    			td156.textContent = "53";
    			td157 = element("td");
    			td157.textContent = "2";
    			td158 = element("td");
    			td158.textContent = "3";
    			t298 = space();
    			tr55 = element("tr");
    			td159 = element("td");
    			td159.textContent = "54";
    			td160 = element("td");
    			td160.textContent = "2";
    			td161 = element("td");
    			td161.textContent = "3";
    			t302 = space();
    			tr56 = element("tr");
    			td162 = element("td");
    			td162.textContent = "55";
    			td163 = element("td");
    			td163.textContent = "2";
    			td164 = element("td");
    			td164.textContent = "3";
    			t306 = space();
    			tr57 = element("tr");
    			td165 = element("td");
    			td165.textContent = "56";
    			td166 = element("td");
    			td166.textContent = "2";
    			td167 = element("td");
    			td167.textContent = "3";
    			t310 = space();
    			tr58 = element("tr");
    			td168 = element("td");
    			td168.textContent = "57";
    			td169 = element("td");
    			td169.textContent = "2";
    			td170 = element("td");
    			td170.textContent = "3";
    			t314 = space();
    			tfoot = element("tfoot");
    			tr59 = element("tr");
    			th5 = element("th");
    			th5.textContent = "Total";
    			t316 = space();
    			th6 = element("th");
    			th6.textContent = "3";
    			t318 = space();
    			th7 = element("th");
    			th7.textContent = "4";
    			t320 = space();
    			div61 = element("div");
    			div61.textContent = "1 of 2";
    			t322 = space();
    			div65 = element("div");
    			div63 = element("div");
    			div62 = element("div");
    			div62.textContent = "Order №1";
    			t324 = space();
    			a1 = element("a");
    			a1.textContent = "×";
    			t326 = space();
    			div64 = element("div");
    			div64.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    			add_location(style, file$4, 1, 4, 18);
    			attr_dev(div0, "class", "input svelte-xnawbe");
    			add_location(div0, file$4, 48, 4, 2050);
    			attr_dev(div1, "class", "input svelte-xnawbe");
    			add_location(div1, file$4, 48, 41, 2087);
    			attr_dev(div2, "class", "input svelte-xnawbe");
    			add_location(div2, file$4, 48, 78, 2124);
    			attr_dev(div3, "class", "input svelte-xnawbe");
    			add_location(div3, file$4, 48, 115, 2161);
    			attr_dev(div4, "class", "input svelte-xnawbe");
    			add_location(div4, file$4, 49, 4, 2203);
    			attr_dev(div5, "class", "input svelte-xnawbe");
    			add_location(div5, file$4, 49, 41, 2240);
    			attr_dev(div6, "class", "input svelte-xnawbe");
    			add_location(div6, file$4, 49, 78, 2277);
    			attr_dev(div7, "class", "input svelte-xnawbe");
    			add_location(div7, file$4, 49, 115, 2314);
    			attr_dev(div8, "class", "input svelte-xnawbe");
    			add_location(div8, file$4, 50, 4, 2356);
    			attr_dev(div9, "class", "input svelte-xnawbe");
    			add_location(div9, file$4, 50, 41, 2393);
    			attr_dev(div10, "class", "input svelte-xnawbe");
    			add_location(div10, file$4, 50, 78, 2430);
    			attr_dev(div11, "class", "input svelte-xnawbe");
    			add_location(div11, file$4, 50, 115, 2467);
    			attr_dev(div12, "class", "input svelte-xnawbe");
    			add_location(div12, file$4, 51, 4, 2509);
    			attr_dev(div13, "class", "input svelte-xnawbe");
    			add_location(div13, file$4, 51, 41, 2546);
    			attr_dev(div14, "class", "input svelte-xnawbe");
    			add_location(div14, file$4, 51, 78, 2583);
    			attr_dev(div15, "class", "input svelte-xnawbe");
    			add_location(div15, file$4, 51, 115, 2620);
    			attr_dev(div16, "class", "input svelte-xnawbe");
    			add_location(div16, file$4, 52, 4, 2662);
    			attr_dev(div17, "class", "input svelte-xnawbe");
    			add_location(div17, file$4, 52, 41, 2699);
    			attr_dev(div18, "class", "input svelte-xnawbe");
    			add_location(div18, file$4, 52, 78, 2736);
    			attr_dev(div19, "class", "input svelte-xnawbe");
    			add_location(div19, file$4, 52, 115, 2773);
    			attr_dev(div20, "class", "input svelte-xnawbe");
    			add_location(div20, file$4, 53, 4, 2815);
    			attr_dev(div21, "class", "input svelte-xnawbe");
    			add_location(div21, file$4, 53, 41, 2852);
    			attr_dev(div22, "class", "input svelte-xnawbe");
    			add_location(div22, file$4, 53, 78, 2889);
    			attr_dev(div23, "class", "input svelte-xnawbe");
    			add_location(div23, file$4, 53, 115, 2926);
    			attr_dev(div24, "class", "input svelte-xnawbe");
    			add_location(div24, file$4, 54, 4, 2968);
    			attr_dev(div25, "class", "input svelte-xnawbe");
    			add_location(div25, file$4, 54, 41, 3005);
    			attr_dev(div26, "class", "input svelte-xnawbe");
    			add_location(div26, file$4, 54, 78, 3042);
    			attr_dev(div27, "class", "input svelte-xnawbe");
    			add_location(div27, file$4, 54, 115, 3079);
    			attr_dev(div28, "class", "input svelte-xnawbe");
    			add_location(div28, file$4, 55, 4, 3121);
    			attr_dev(div29, "class", "input svelte-xnawbe");
    			add_location(div29, file$4, 55, 41, 3158);
    			attr_dev(div30, "class", "input svelte-xnawbe");
    			add_location(div30, file$4, 55, 78, 3195);
    			attr_dev(div31, "class", "input svelte-xnawbe");
    			add_location(div31, file$4, 55, 115, 3232);
    			attr_dev(div32, "class", "input svelte-xnawbe");
    			add_location(div32, file$4, 56, 4, 3274);
    			attr_dev(div33, "class", "input svelte-xnawbe");
    			add_location(div33, file$4, 56, 41, 3311);
    			attr_dev(div34, "class", "input svelte-xnawbe");
    			add_location(div34, file$4, 56, 78, 3348);
    			attr_dev(div35, "class", "input svelte-xnawbe");
    			add_location(div35, file$4, 56, 115, 3385);
    			attr_dev(div36, "class", "input svelte-xnawbe");
    			add_location(div36, file$4, 57, 4, 3427);
    			attr_dev(div37, "class", "input svelte-xnawbe");
    			add_location(div37, file$4, 57, 41, 3464);
    			attr_dev(div38, "class", "input svelte-xnawbe");
    			add_location(div38, file$4, 57, 78, 3501);
    			attr_dev(div39, "class", "input svelte-xnawbe");
    			add_location(div39, file$4, 57, 115, 3538);
    			attr_dev(div40, "class", "input svelte-xnawbe");
    			add_location(div40, file$4, 58, 4, 3580);
    			attr_dev(div41, "class", "input svelte-xnawbe");
    			add_location(div41, file$4, 58, 41, 3617);
    			attr_dev(div42, "class", "input svelte-xnawbe");
    			add_location(div42, file$4, 58, 78, 3654);
    			attr_dev(div43, "class", "input svelte-xnawbe");
    			add_location(div43, file$4, 58, 115, 3691);
    			attr_dev(div44, "class", "input svelte-xnawbe");
    			add_location(div44, file$4, 59, 4, 3733);
    			attr_dev(div45, "class", "input svelte-xnawbe");
    			add_location(div45, file$4, 59, 41, 3770);
    			attr_dev(div46, "class", "input svelte-xnawbe");
    			add_location(div46, file$4, 59, 78, 3807);
    			attr_dev(div47, "class", "input svelte-xnawbe");
    			add_location(div47, file$4, 59, 115, 3844);
    			attr_dev(div48, "class", "input svelte-xnawbe");
    			add_location(div48, file$4, 60, 4, 3886);
    			attr_dev(div49, "class", "input svelte-xnawbe");
    			add_location(div49, file$4, 60, 41, 3923);
    			attr_dev(div50, "class", "input svelte-xnawbe");
    			add_location(div50, file$4, 60, 78, 3960);
    			attr_dev(div51, "class", "input svelte-xnawbe");
    			add_location(div51, file$4, 60, 115, 3997);
    			attr_dev(div52, "class", "input svelte-xnawbe");
    			add_location(div52, file$4, 61, 4, 4039);
    			attr_dev(div53, "class", "input svelte-xnawbe");
    			add_location(div53, file$4, 61, 41, 4076);
    			attr_dev(div54, "class", "input svelte-xnawbe");
    			add_location(div54, file$4, 61, 78, 4113);
    			attr_dev(div55, "class", "input svelte-xnawbe");
    			add_location(div55, file$4, 61, 115, 4150);
    			attr_dev(div56, "class", "column svelte-xnawbe");
    			add_location(div56, file$4, 47, 0, 2025);
    			add_location(b, file$4, 68, 12, 4273);
    			add_location(div57, file$4, 69, 12, 4305);
    			add_location(div58, file$4, 67, 8, 4255);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "medium blue button");
    			set_style(a0, "margin-left", "auto");
    			add_location(a0, file$4, 71, 8, 4407);
    			attr_dev(div59, "class", "heading svelte-xnawbe");
    			add_location(div59, file$4, 66, 4, 4225);
    			attr_dev(th0, "class", "svelte-xnawbe");
    			add_location(th0, file$4, 79, 20, 4644);
    			attr_dev(th1, "colspan", "2");
    			attr_dev(th1, "class", "svelte-xnawbe");
    			add_location(th1, file$4, 80, 20, 4674);
    			attr_dev(tr0, "class", "svelte-xnawbe");
    			add_location(tr0, file$4, 78, 16, 4619);
    			attr_dev(th2, "class", "svelte-xnawbe");
    			add_location(th2, file$4, 83, 20, 4763);
    			attr_dev(th3, "class", "svelte-xnawbe");
    			add_location(th3, file$4, 84, 20, 4794);
    			attr_dev(th4, "class", "svelte-xnawbe");
    			add_location(th4, file$4, 85, 20, 4829);
    			attr_dev(tr1, "class", "svelte-xnawbe");
    			add_location(tr1, file$4, 82, 16, 4738);
    			add_location(thead, file$4, 77, 12, 4595);
    			attr_dev(td0, "class", "text-right svelte-xnawbe");
    			add_location(td0, file$4, 89, 78, 4983);
    			attr_dev(td1, "class", "text-right svelte-xnawbe");
    			add_location(td1, file$4, 89, 107, 5012);
    			attr_dev(td2, "class", "text-right svelte-xnawbe");
    			add_location(td2, file$4, 89, 136, 5041);
    			attr_dev(tr2, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr2, "class", "svelte-xnawbe");
    			add_location(tr2, file$4, 89, 16, 4921);
    			attr_dev(td3, "class", "text-right svelte-xnawbe");
    			add_location(td3, file$4, 90, 78, 5155);
    			attr_dev(td4, "class", "text-right svelte-xnawbe");
    			add_location(td4, file$4, 90, 107, 5184);
    			attr_dev(td5, "class", "text-right svelte-xnawbe");
    			add_location(td5, file$4, 90, 136, 5213);
    			attr_dev(tr3, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr3, "class", "svelte-xnawbe");
    			add_location(tr3, file$4, 90, 16, 5093);
    			attr_dev(td6, "class", "text-right svelte-xnawbe");
    			add_location(td6, file$4, 91, 78, 5327);
    			attr_dev(td7, "class", "text-right svelte-xnawbe");
    			add_location(td7, file$4, 91, 107, 5356);
    			attr_dev(td8, "class", "text-right svelte-xnawbe");
    			add_location(td8, file$4, 91, 136, 5385);
    			attr_dev(tr4, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr4, "class", "svelte-xnawbe");
    			add_location(tr4, file$4, 91, 16, 5265);
    			attr_dev(td9, "class", "text-right svelte-xnawbe");
    			add_location(td9, file$4, 92, 78, 5499);
    			attr_dev(td10, "class", "text-right svelte-xnawbe");
    			add_location(td10, file$4, 92, 107, 5528);
    			attr_dev(td11, "class", "text-right svelte-xnawbe");
    			add_location(td11, file$4, 92, 136, 5557);
    			attr_dev(tr5, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr5, "class", "svelte-xnawbe");
    			add_location(tr5, file$4, 92, 16, 5437);
    			attr_dev(td12, "class", "text-right svelte-xnawbe");
    			add_location(td12, file$4, 93, 78, 5671);
    			attr_dev(td13, "class", "text-right svelte-xnawbe");
    			add_location(td13, file$4, 93, 107, 5700);
    			attr_dev(td14, "class", "text-right svelte-xnawbe");
    			add_location(td14, file$4, 93, 136, 5729);
    			attr_dev(tr6, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr6, "class", "svelte-xnawbe");
    			add_location(tr6, file$4, 93, 16, 5609);
    			attr_dev(td15, "class", "text-right svelte-xnawbe");
    			add_location(td15, file$4, 94, 78, 5843);
    			attr_dev(td16, "class", "text-right svelte-xnawbe");
    			add_location(td16, file$4, 94, 107, 5872);
    			attr_dev(td17, "class", "text-right svelte-xnawbe");
    			add_location(td17, file$4, 94, 136, 5901);
    			attr_dev(tr7, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr7, "class", "svelte-xnawbe");
    			add_location(tr7, file$4, 94, 16, 5781);
    			attr_dev(td18, "class", "text-right svelte-xnawbe");
    			add_location(td18, file$4, 95, 78, 6015);
    			attr_dev(td19, "class", "text-right svelte-xnawbe");
    			add_location(td19, file$4, 95, 107, 6044);
    			attr_dev(td20, "class", "text-right svelte-xnawbe");
    			add_location(td20, file$4, 95, 136, 6073);
    			attr_dev(tr8, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr8, "class", "svelte-xnawbe");
    			add_location(tr8, file$4, 95, 16, 5953);
    			attr_dev(td21, "class", "text-right svelte-xnawbe");
    			add_location(td21, file$4, 96, 78, 6187);
    			attr_dev(td22, "class", "text-right svelte-xnawbe");
    			add_location(td22, file$4, 96, 107, 6216);
    			attr_dev(td23, "class", "text-right svelte-xnawbe");
    			add_location(td23, file$4, 96, 136, 6245);
    			attr_dev(tr9, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr9, "class", "svelte-xnawbe");
    			add_location(tr9, file$4, 96, 16, 6125);
    			attr_dev(td24, "class", "text-right svelte-xnawbe");
    			add_location(td24, file$4, 97, 78, 6359);
    			attr_dev(td25, "class", "text-right svelte-xnawbe");
    			add_location(td25, file$4, 97, 107, 6388);
    			attr_dev(td26, "class", "text-right svelte-xnawbe");
    			add_location(td26, file$4, 97, 136, 6417);
    			attr_dev(tr10, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr10, "class", "svelte-xnawbe");
    			add_location(tr10, file$4, 97, 16, 6297);
    			attr_dev(td27, "class", "text-right svelte-xnawbe");
    			add_location(td27, file$4, 98, 78, 6531);
    			attr_dev(td28, "class", "text-right svelte-xnawbe");
    			add_location(td28, file$4, 98, 108, 6561);
    			attr_dev(td29, "class", "text-right svelte-xnawbe");
    			add_location(td29, file$4, 98, 137, 6590);
    			attr_dev(tr11, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr11, "class", "svelte-xnawbe");
    			add_location(tr11, file$4, 98, 16, 6469);
    			attr_dev(td30, "class", "text-right svelte-xnawbe");
    			add_location(td30, file$4, 99, 78, 6703);
    			attr_dev(td31, "class", "text-right svelte-xnawbe");
    			add_location(td31, file$4, 99, 108, 6733);
    			attr_dev(td32, "class", "text-right svelte-xnawbe");
    			add_location(td32, file$4, 99, 137, 6762);
    			attr_dev(tr12, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr12, "class", "svelte-xnawbe");
    			add_location(tr12, file$4, 99, 16, 6641);
    			attr_dev(td33, "class", "text-right svelte-xnawbe");
    			add_location(td33, file$4, 100, 78, 6875);
    			attr_dev(td34, "class", "text-right svelte-xnawbe");
    			add_location(td34, file$4, 100, 108, 6905);
    			attr_dev(td35, "class", "text-right svelte-xnawbe");
    			add_location(td35, file$4, 100, 137, 6934);
    			attr_dev(tr13, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr13, "class", "svelte-xnawbe");
    			add_location(tr13, file$4, 100, 16, 6813);
    			attr_dev(td36, "class", "text-right svelte-xnawbe");
    			add_location(td36, file$4, 101, 78, 7047);
    			attr_dev(td37, "class", "text-right svelte-xnawbe");
    			add_location(td37, file$4, 101, 108, 7077);
    			attr_dev(td38, "class", "text-right svelte-xnawbe");
    			add_location(td38, file$4, 101, 137, 7106);
    			attr_dev(tr14, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr14, "class", "svelte-xnawbe");
    			add_location(tr14, file$4, 101, 16, 6985);
    			attr_dev(td39, "class", "text-right svelte-xnawbe");
    			add_location(td39, file$4, 102, 78, 7219);
    			attr_dev(td40, "class", "text-right svelte-xnawbe");
    			add_location(td40, file$4, 102, 108, 7249);
    			attr_dev(td41, "class", "text-right svelte-xnawbe");
    			add_location(td41, file$4, 102, 137, 7278);
    			attr_dev(tr15, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr15, "class", "svelte-xnawbe");
    			add_location(tr15, file$4, 102, 16, 7157);
    			attr_dev(td42, "class", "text-right svelte-xnawbe");
    			add_location(td42, file$4, 103, 78, 7391);
    			attr_dev(td43, "class", "text-right svelte-xnawbe");
    			add_location(td43, file$4, 103, 108, 7421);
    			attr_dev(td44, "class", "text-right svelte-xnawbe");
    			add_location(td44, file$4, 103, 137, 7450);
    			attr_dev(tr16, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr16, "class", "svelte-xnawbe");
    			add_location(tr16, file$4, 103, 16, 7329);
    			attr_dev(td45, "class", "text-right svelte-xnawbe");
    			add_location(td45, file$4, 104, 78, 7563);
    			attr_dev(td46, "class", "text-right svelte-xnawbe");
    			add_location(td46, file$4, 104, 108, 7593);
    			attr_dev(td47, "class", "text-right svelte-xnawbe");
    			add_location(td47, file$4, 104, 137, 7622);
    			attr_dev(tr17, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr17, "class", "svelte-xnawbe");
    			add_location(tr17, file$4, 104, 16, 7501);
    			attr_dev(td48, "class", "text-right svelte-xnawbe");
    			add_location(td48, file$4, 105, 78, 7735);
    			attr_dev(td49, "class", "text-right svelte-xnawbe");
    			add_location(td49, file$4, 105, 108, 7765);
    			attr_dev(td50, "class", "text-right svelte-xnawbe");
    			add_location(td50, file$4, 105, 137, 7794);
    			attr_dev(tr18, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr18, "class", "svelte-xnawbe");
    			add_location(tr18, file$4, 105, 16, 7673);
    			attr_dev(td51, "class", "text-right svelte-xnawbe");
    			add_location(td51, file$4, 106, 78, 7907);
    			attr_dev(td52, "class", "text-right svelte-xnawbe");
    			add_location(td52, file$4, 106, 108, 7937);
    			attr_dev(td53, "class", "text-right svelte-xnawbe");
    			add_location(td53, file$4, 106, 137, 7966);
    			attr_dev(tr19, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr19, "class", "svelte-xnawbe");
    			add_location(tr19, file$4, 106, 16, 7845);
    			attr_dev(td54, "class", "text-right svelte-xnawbe");
    			add_location(td54, file$4, 107, 78, 8079);
    			attr_dev(td55, "class", "text-right svelte-xnawbe");
    			add_location(td55, file$4, 107, 108, 8109);
    			attr_dev(td56, "class", "text-right svelte-xnawbe");
    			add_location(td56, file$4, 107, 137, 8138);
    			attr_dev(tr20, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr20, "class", "svelte-xnawbe");
    			add_location(tr20, file$4, 107, 16, 8017);
    			attr_dev(td57, "class", "text-right svelte-xnawbe");
    			add_location(td57, file$4, 108, 78, 8251);
    			attr_dev(td58, "class", "text-right svelte-xnawbe");
    			add_location(td58, file$4, 108, 108, 8281);
    			attr_dev(td59, "class", "text-right svelte-xnawbe");
    			add_location(td59, file$4, 108, 137, 8310);
    			attr_dev(tr21, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr21, "class", "svelte-xnawbe");
    			add_location(tr21, file$4, 108, 16, 8189);
    			attr_dev(td60, "class", "text-right svelte-xnawbe");
    			add_location(td60, file$4, 109, 78, 8423);
    			attr_dev(td61, "class", "text-right svelte-xnawbe");
    			add_location(td61, file$4, 109, 108, 8453);
    			attr_dev(td62, "class", "text-right svelte-xnawbe");
    			add_location(td62, file$4, 109, 137, 8482);
    			attr_dev(tr22, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr22, "class", "svelte-xnawbe");
    			add_location(tr22, file$4, 109, 16, 8361);
    			attr_dev(td63, "class", "text-right svelte-xnawbe");
    			add_location(td63, file$4, 110, 78, 8595);
    			attr_dev(td64, "class", "text-right svelte-xnawbe");
    			add_location(td64, file$4, 110, 108, 8625);
    			attr_dev(td65, "class", "text-right svelte-xnawbe");
    			add_location(td65, file$4, 110, 137, 8654);
    			attr_dev(tr23, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr23, "class", "svelte-xnawbe");
    			add_location(tr23, file$4, 110, 16, 8533);
    			attr_dev(td66, "class", "text-right svelte-xnawbe");
    			add_location(td66, file$4, 111, 78, 8767);
    			attr_dev(td67, "class", "text-right svelte-xnawbe");
    			add_location(td67, file$4, 111, 108, 8797);
    			attr_dev(td68, "class", "text-right svelte-xnawbe");
    			add_location(td68, file$4, 111, 137, 8826);
    			attr_dev(tr24, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr24, "class", "svelte-xnawbe");
    			add_location(tr24, file$4, 111, 16, 8705);
    			attr_dev(td69, "class", "text-right svelte-xnawbe");
    			add_location(td69, file$4, 112, 78, 8939);
    			attr_dev(td70, "class", "text-right svelte-xnawbe");
    			add_location(td70, file$4, 112, 108, 8969);
    			attr_dev(td71, "class", "text-right svelte-xnawbe");
    			add_location(td71, file$4, 112, 137, 8998);
    			attr_dev(tr25, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr25, "class", "svelte-xnawbe");
    			add_location(tr25, file$4, 112, 16, 8877);
    			attr_dev(td72, "class", "text-right svelte-xnawbe");
    			add_location(td72, file$4, 113, 78, 9111);
    			attr_dev(td73, "class", "text-right svelte-xnawbe");
    			add_location(td73, file$4, 113, 108, 9141);
    			attr_dev(td74, "class", "text-right svelte-xnawbe");
    			add_location(td74, file$4, 113, 137, 9170);
    			attr_dev(tr26, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr26, "class", "svelte-xnawbe");
    			add_location(tr26, file$4, 113, 16, 9049);
    			attr_dev(td75, "class", "text-right svelte-xnawbe");
    			add_location(td75, file$4, 114, 78, 9283);
    			attr_dev(td76, "class", "text-right svelte-xnawbe");
    			add_location(td76, file$4, 114, 108, 9313);
    			attr_dev(td77, "class", "text-right svelte-xnawbe");
    			add_location(td77, file$4, 114, 137, 9342);
    			attr_dev(tr27, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr27, "class", "svelte-xnawbe");
    			add_location(tr27, file$4, 114, 16, 9221);
    			attr_dev(td78, "class", "text-right svelte-xnawbe");
    			add_location(td78, file$4, 115, 78, 9455);
    			attr_dev(td79, "class", "text-right svelte-xnawbe");
    			add_location(td79, file$4, 115, 108, 9485);
    			attr_dev(td80, "class", "text-right svelte-xnawbe");
    			add_location(td80, file$4, 115, 137, 9514);
    			attr_dev(tr28, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr28, "class", "svelte-xnawbe");
    			add_location(tr28, file$4, 115, 16, 9393);
    			attr_dev(td81, "class", "text-right svelte-xnawbe");
    			add_location(td81, file$4, 116, 78, 9627);
    			attr_dev(td82, "class", "text-right svelte-xnawbe");
    			add_location(td82, file$4, 116, 108, 9657);
    			attr_dev(td83, "class", "text-right svelte-xnawbe");
    			add_location(td83, file$4, 116, 137, 9686);
    			attr_dev(tr29, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr29, "class", "svelte-xnawbe");
    			add_location(tr29, file$4, 116, 16, 9565);
    			attr_dev(td84, "class", "text-right svelte-xnawbe");
    			add_location(td84, file$4, 117, 78, 9799);
    			attr_dev(td85, "class", "text-right svelte-xnawbe");
    			add_location(td85, file$4, 117, 108, 9829);
    			attr_dev(td86, "class", "text-right svelte-xnawbe");
    			add_location(td86, file$4, 117, 137, 9858);
    			attr_dev(tr30, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr30, "class", "svelte-xnawbe");
    			add_location(tr30, file$4, 117, 16, 9737);
    			attr_dev(td87, "class", "text-right svelte-xnawbe");
    			add_location(td87, file$4, 118, 78, 9971);
    			attr_dev(td88, "class", "text-right svelte-xnawbe");
    			add_location(td88, file$4, 118, 108, 10001);
    			attr_dev(td89, "class", "text-right svelte-xnawbe");
    			add_location(td89, file$4, 118, 137, 10030);
    			attr_dev(tr31, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr31, "class", "svelte-xnawbe");
    			add_location(tr31, file$4, 118, 16, 9909);
    			attr_dev(td90, "class", "text-right svelte-xnawbe");
    			add_location(td90, file$4, 119, 78, 10143);
    			attr_dev(td91, "class", "text-right svelte-xnawbe");
    			add_location(td91, file$4, 119, 108, 10173);
    			attr_dev(td92, "class", "text-right svelte-xnawbe");
    			add_location(td92, file$4, 119, 137, 10202);
    			attr_dev(tr32, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr32, "class", "svelte-xnawbe");
    			add_location(tr32, file$4, 119, 16, 10081);
    			attr_dev(td93, "class", "text-right svelte-xnawbe");
    			add_location(td93, file$4, 120, 78, 10315);
    			attr_dev(td94, "class", "text-right svelte-xnawbe");
    			add_location(td94, file$4, 120, 108, 10345);
    			attr_dev(td95, "class", "text-right svelte-xnawbe");
    			add_location(td95, file$4, 120, 137, 10374);
    			attr_dev(tr33, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr33, "class", "svelte-xnawbe");
    			add_location(tr33, file$4, 120, 16, 10253);
    			attr_dev(td96, "class", "text-right svelte-xnawbe");
    			add_location(td96, file$4, 121, 78, 10487);
    			attr_dev(td97, "class", "text-right svelte-xnawbe");
    			add_location(td97, file$4, 121, 108, 10517);
    			attr_dev(td98, "class", "text-right svelte-xnawbe");
    			add_location(td98, file$4, 121, 137, 10546);
    			attr_dev(tr34, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr34, "class", "svelte-xnawbe");
    			add_location(tr34, file$4, 121, 16, 10425);
    			attr_dev(td99, "class", "text-right svelte-xnawbe");
    			add_location(td99, file$4, 122, 78, 10659);
    			attr_dev(td100, "class", "text-right svelte-xnawbe");
    			add_location(td100, file$4, 122, 108, 10689);
    			attr_dev(td101, "class", "text-right svelte-xnawbe");
    			add_location(td101, file$4, 122, 137, 10718);
    			attr_dev(tr35, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr35, "class", "svelte-xnawbe");
    			add_location(tr35, file$4, 122, 16, 10597);
    			attr_dev(td102, "class", "text-right svelte-xnawbe");
    			add_location(td102, file$4, 123, 78, 10831);
    			attr_dev(td103, "class", "text-right svelte-xnawbe");
    			add_location(td103, file$4, 123, 108, 10861);
    			attr_dev(td104, "class", "text-right svelte-xnawbe");
    			add_location(td104, file$4, 123, 137, 10890);
    			attr_dev(tr36, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr36, "class", "svelte-xnawbe");
    			add_location(tr36, file$4, 123, 16, 10769);
    			attr_dev(td105, "class", "text-right svelte-xnawbe");
    			add_location(td105, file$4, 124, 78, 11003);
    			attr_dev(td106, "class", "text-right svelte-xnawbe");
    			add_location(td106, file$4, 124, 108, 11033);
    			attr_dev(td107, "class", "text-right svelte-xnawbe");
    			add_location(td107, file$4, 124, 137, 11062);
    			attr_dev(tr37, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr37, "class", "svelte-xnawbe");
    			add_location(tr37, file$4, 124, 16, 10941);
    			attr_dev(td108, "class", "text-right svelte-xnawbe");
    			add_location(td108, file$4, 125, 78, 11175);
    			attr_dev(td109, "class", "text-right svelte-xnawbe");
    			add_location(td109, file$4, 125, 108, 11205);
    			attr_dev(td110, "class", "text-right svelte-xnawbe");
    			add_location(td110, file$4, 125, 137, 11234);
    			attr_dev(tr38, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr38, "class", "svelte-xnawbe");
    			add_location(tr38, file$4, 125, 16, 11113);
    			attr_dev(td111, "class", "text-right svelte-xnawbe");
    			add_location(td111, file$4, 126, 78, 11347);
    			attr_dev(td112, "class", "text-right svelte-xnawbe");
    			add_location(td112, file$4, 126, 108, 11377);
    			attr_dev(td113, "class", "text-right svelte-xnawbe");
    			add_location(td113, file$4, 126, 137, 11406);
    			attr_dev(tr39, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr39, "class", "svelte-xnawbe");
    			add_location(tr39, file$4, 126, 16, 11285);
    			attr_dev(td114, "class", "text-right svelte-xnawbe");
    			add_location(td114, file$4, 127, 78, 11519);
    			attr_dev(td115, "class", "text-right svelte-xnawbe");
    			add_location(td115, file$4, 127, 108, 11549);
    			attr_dev(td116, "class", "text-right svelte-xnawbe");
    			add_location(td116, file$4, 127, 137, 11578);
    			attr_dev(tr40, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr40, "class", "svelte-xnawbe");
    			add_location(tr40, file$4, 127, 16, 11457);
    			attr_dev(td117, "class", "text-right svelte-xnawbe");
    			add_location(td117, file$4, 128, 78, 11691);
    			attr_dev(td118, "class", "text-right svelte-xnawbe");
    			add_location(td118, file$4, 128, 108, 11721);
    			attr_dev(td119, "class", "text-right svelte-xnawbe");
    			add_location(td119, file$4, 128, 137, 11750);
    			attr_dev(tr41, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr41, "class", "svelte-xnawbe");
    			add_location(tr41, file$4, 128, 16, 11629);
    			attr_dev(td120, "class", "text-right svelte-xnawbe");
    			add_location(td120, file$4, 129, 78, 11863);
    			attr_dev(td121, "class", "text-right svelte-xnawbe");
    			add_location(td121, file$4, 129, 108, 11893);
    			attr_dev(td122, "class", "text-right svelte-xnawbe");
    			add_location(td122, file$4, 129, 137, 11922);
    			attr_dev(tr42, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr42, "class", "svelte-xnawbe");
    			add_location(tr42, file$4, 129, 16, 11801);
    			attr_dev(td123, "class", "text-right svelte-xnawbe");
    			add_location(td123, file$4, 130, 78, 12035);
    			attr_dev(td124, "class", "text-right svelte-xnawbe");
    			add_location(td124, file$4, 130, 108, 12065);
    			attr_dev(td125, "class", "text-right svelte-xnawbe");
    			add_location(td125, file$4, 130, 137, 12094);
    			attr_dev(tr43, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr43, "class", "svelte-xnawbe");
    			add_location(tr43, file$4, 130, 16, 11973);
    			attr_dev(td126, "class", "text-right svelte-xnawbe");
    			add_location(td126, file$4, 131, 78, 12207);
    			attr_dev(td127, "class", "text-right svelte-xnawbe");
    			add_location(td127, file$4, 131, 108, 12237);
    			attr_dev(td128, "class", "text-right svelte-xnawbe");
    			add_location(td128, file$4, 131, 137, 12266);
    			attr_dev(tr44, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr44, "class", "svelte-xnawbe");
    			add_location(tr44, file$4, 131, 16, 12145);
    			attr_dev(td129, "class", "text-right svelte-xnawbe");
    			add_location(td129, file$4, 132, 78, 12379);
    			attr_dev(td130, "class", "text-right svelte-xnawbe");
    			add_location(td130, file$4, 132, 108, 12409);
    			attr_dev(td131, "class", "text-right svelte-xnawbe");
    			add_location(td131, file$4, 132, 137, 12438);
    			attr_dev(tr45, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr45, "class", "svelte-xnawbe");
    			add_location(tr45, file$4, 132, 16, 12317);
    			attr_dev(td132, "class", "text-right svelte-xnawbe");
    			add_location(td132, file$4, 133, 78, 12551);
    			attr_dev(td133, "class", "text-right svelte-xnawbe");
    			add_location(td133, file$4, 133, 108, 12581);
    			attr_dev(td134, "class", "text-right svelte-xnawbe");
    			add_location(td134, file$4, 133, 137, 12610);
    			attr_dev(tr46, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr46, "class", "svelte-xnawbe");
    			add_location(tr46, file$4, 133, 16, 12489);
    			attr_dev(td135, "class", "text-right svelte-xnawbe");
    			add_location(td135, file$4, 134, 78, 12723);
    			attr_dev(td136, "class", "text-right svelte-xnawbe");
    			add_location(td136, file$4, 134, 108, 12753);
    			attr_dev(td137, "class", "text-right svelte-xnawbe");
    			add_location(td137, file$4, 134, 137, 12782);
    			attr_dev(tr47, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr47, "class", "svelte-xnawbe");
    			add_location(tr47, file$4, 134, 16, 12661);
    			attr_dev(td138, "class", "text-right svelte-xnawbe");
    			add_location(td138, file$4, 135, 78, 12895);
    			attr_dev(td139, "class", "text-right svelte-xnawbe");
    			add_location(td139, file$4, 135, 108, 12925);
    			attr_dev(td140, "class", "text-right svelte-xnawbe");
    			add_location(td140, file$4, 135, 137, 12954);
    			attr_dev(tr48, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr48, "class", "svelte-xnawbe");
    			add_location(tr48, file$4, 135, 16, 12833);
    			attr_dev(td141, "class", "text-right svelte-xnawbe");
    			add_location(td141, file$4, 136, 78, 13067);
    			attr_dev(td142, "class", "text-right svelte-xnawbe");
    			add_location(td142, file$4, 136, 108, 13097);
    			attr_dev(td143, "class", "text-right svelte-xnawbe");
    			add_location(td143, file$4, 136, 137, 13126);
    			attr_dev(tr49, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr49, "class", "svelte-xnawbe");
    			add_location(tr49, file$4, 136, 16, 13005);
    			attr_dev(td144, "class", "text-right svelte-xnawbe");
    			add_location(td144, file$4, 137, 78, 13239);
    			attr_dev(td145, "class", "text-right svelte-xnawbe");
    			add_location(td145, file$4, 137, 108, 13269);
    			attr_dev(td146, "class", "text-right svelte-xnawbe");
    			add_location(td146, file$4, 137, 137, 13298);
    			attr_dev(tr50, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr50, "class", "svelte-xnawbe");
    			add_location(tr50, file$4, 137, 16, 13177);
    			attr_dev(td147, "class", "text-right svelte-xnawbe");
    			add_location(td147, file$4, 138, 78, 13411);
    			attr_dev(td148, "class", "text-right svelte-xnawbe");
    			add_location(td148, file$4, 138, 108, 13441);
    			attr_dev(td149, "class", "text-right svelte-xnawbe");
    			add_location(td149, file$4, 138, 137, 13470);
    			attr_dev(tr51, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr51, "class", "svelte-xnawbe");
    			add_location(tr51, file$4, 138, 16, 13349);
    			attr_dev(td150, "class", "text-right svelte-xnawbe");
    			add_location(td150, file$4, 139, 78, 13583);
    			attr_dev(td151, "class", "text-right svelte-xnawbe");
    			add_location(td151, file$4, 139, 108, 13613);
    			attr_dev(td152, "class", "text-right svelte-xnawbe");
    			add_location(td152, file$4, 139, 137, 13642);
    			attr_dev(tr52, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr52, "class", "svelte-xnawbe");
    			add_location(tr52, file$4, 139, 16, 13521);
    			attr_dev(td153, "class", "text-right svelte-xnawbe");
    			add_location(td153, file$4, 140, 78, 13755);
    			attr_dev(td154, "class", "text-right svelte-xnawbe");
    			add_location(td154, file$4, 140, 108, 13785);
    			attr_dev(td155, "class", "text-right svelte-xnawbe");
    			add_location(td155, file$4, 140, 137, 13814);
    			attr_dev(tr53, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr53, "class", "svelte-xnawbe");
    			add_location(tr53, file$4, 140, 16, 13693);
    			attr_dev(td156, "class", "text-right svelte-xnawbe");
    			add_location(td156, file$4, 141, 78, 13927);
    			attr_dev(td157, "class", "text-right svelte-xnawbe");
    			add_location(td157, file$4, 141, 108, 13957);
    			attr_dev(td158, "class", "text-right svelte-xnawbe");
    			add_location(td158, file$4, 141, 137, 13986);
    			attr_dev(tr54, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr54, "class", "svelte-xnawbe");
    			add_location(tr54, file$4, 141, 16, 13865);
    			attr_dev(td159, "class", "text-right svelte-xnawbe");
    			add_location(td159, file$4, 142, 78, 14099);
    			attr_dev(td160, "class", "text-right svelte-xnawbe");
    			add_location(td160, file$4, 142, 108, 14129);
    			attr_dev(td161, "class", "text-right svelte-xnawbe");
    			add_location(td161, file$4, 142, 137, 14158);
    			attr_dev(tr55, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr55, "class", "svelte-xnawbe");
    			add_location(tr55, file$4, 142, 16, 14037);
    			attr_dev(td162, "class", "text-right svelte-xnawbe");
    			add_location(td162, file$4, 143, 78, 14271);
    			attr_dev(td163, "class", "text-right svelte-xnawbe");
    			add_location(td163, file$4, 143, 108, 14301);
    			attr_dev(td164, "class", "text-right svelte-xnawbe");
    			add_location(td164, file$4, 143, 137, 14330);
    			attr_dev(tr56, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr56, "class", "svelte-xnawbe");
    			add_location(tr56, file$4, 143, 16, 14209);
    			attr_dev(td165, "class", "text-right svelte-xnawbe");
    			add_location(td165, file$4, 144, 78, 14443);
    			attr_dev(td166, "class", "text-right svelte-xnawbe");
    			add_location(td166, file$4, 144, 108, 14473);
    			attr_dev(td167, "class", "text-right svelte-xnawbe");
    			add_location(td167, file$4, 144, 137, 14502);
    			attr_dev(tr57, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr57, "class", "svelte-xnawbe");
    			add_location(tr57, file$4, 144, 16, 14381);
    			attr_dev(td168, "class", "text-right svelte-xnawbe");
    			add_location(td168, file$4, 145, 78, 14615);
    			attr_dev(td169, "class", "text-right svelte-xnawbe");
    			add_location(td169, file$4, 145, 108, 14645);
    			attr_dev(td170, "class", "text-right svelte-xnawbe");
    			add_location(td170, file$4, 145, 137, 14674);
    			attr_dev(tr58, "onclick", "document.querySelector('.details').hidden=false");
    			attr_dev(tr58, "class", "svelte-xnawbe");
    			add_location(tr58, file$4, 145, 16, 14553);
    			add_location(tbody, file$4, 88, 12, 4897);
    			attr_dev(th5, "class", "svelte-xnawbe");
    			add_location(th5, file$4, 149, 20, 14791);
    			attr_dev(th6, "class", "text-right svelte-xnawbe");
    			add_location(th6, file$4, 150, 20, 14826);
    			attr_dev(th7, "class", "text-right svelte-xnawbe");
    			add_location(th7, file$4, 151, 20, 14876);
    			attr_dev(tr59, "class", "svelte-xnawbe");
    			add_location(tr59, file$4, 148, 16, 14766);
    			add_location(tfoot, file$4, 147, 12, 14742);
    			attr_dev(table, "class", "desk svelte-xnawbe");
    			add_location(table, file$4, 76, 8, 4562);
    			attr_dev(div60, "class", "content svelte-xnawbe");
    			add_location(div60, file$4, 74, 4, 4531);
    			attr_dev(div61, "class", "pagination svelte-xnawbe");
    			add_location(div61, file$4, 157, 4, 14982);
    			attr_dev(div62, "class", "details-title svelte-xnawbe");
    			add_location(div62, file$4, 160, 12, 15102);
    			attr_dev(a1, "class", "details-close svelte-xnawbe");
    			attr_dev(a1, "href", "javascript:;");
    			attr_dev(a1, "onclick", "document.querySelector('.details').hidden=true");
    			add_location(a1, file$4, 161, 12, 15156);
    			attr_dev(div63, "class", "details-heading svelte-xnawbe");
    			add_location(div63, file$4, 159, 8, 15060);
    			attr_dev(div64, "class", "details-content svelte-xnawbe");
    			add_location(div64, file$4, 163, 8, 15287);
    			attr_dev(div65, "class", "details svelte-xnawbe");
    			div65.hidden = true;
    			add_location(div65, file$4, 158, 4, 15023);
    			attr_dev(div66, "class", "container svelte-xnawbe");
    			add_location(div66, file$4, 64, 0, 4196);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, style);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div56, anchor);
    			append_dev(div56, div0);
    			append_dev(div56, div1);
    			append_dev(div56, div2);
    			append_dev(div56, div3);
    			append_dev(div56, t6);
    			append_dev(div56, div4);
    			append_dev(div56, div5);
    			append_dev(div56, div6);
    			append_dev(div56, div7);
    			append_dev(div56, t11);
    			append_dev(div56, div8);
    			append_dev(div56, div9);
    			append_dev(div56, div10);
    			append_dev(div56, div11);
    			append_dev(div56, t16);
    			append_dev(div56, div12);
    			append_dev(div56, div13);
    			append_dev(div56, div14);
    			append_dev(div56, div15);
    			append_dev(div56, t21);
    			append_dev(div56, div16);
    			append_dev(div56, div17);
    			append_dev(div56, div18);
    			append_dev(div56, div19);
    			append_dev(div56, t26);
    			append_dev(div56, div20);
    			append_dev(div56, div21);
    			append_dev(div56, div22);
    			append_dev(div56, div23);
    			append_dev(div56, t31);
    			append_dev(div56, div24);
    			append_dev(div56, div25);
    			append_dev(div56, div26);
    			append_dev(div56, div27);
    			append_dev(div56, t36);
    			append_dev(div56, div28);
    			append_dev(div56, div29);
    			append_dev(div56, div30);
    			append_dev(div56, div31);
    			append_dev(div56, t41);
    			append_dev(div56, div32);
    			append_dev(div56, div33);
    			append_dev(div56, div34);
    			append_dev(div56, div35);
    			append_dev(div56, t46);
    			append_dev(div56, div36);
    			append_dev(div56, div37);
    			append_dev(div56, div38);
    			append_dev(div56, div39);
    			append_dev(div56, t51);
    			append_dev(div56, div40);
    			append_dev(div56, div41);
    			append_dev(div56, div42);
    			append_dev(div56, div43);
    			append_dev(div56, t56);
    			append_dev(div56, div44);
    			append_dev(div56, div45);
    			append_dev(div56, div46);
    			append_dev(div56, div47);
    			append_dev(div56, t61);
    			append_dev(div56, div48);
    			append_dev(div56, div49);
    			append_dev(div56, div50);
    			append_dev(div56, div51);
    			append_dev(div56, t66);
    			append_dev(div56, div52);
    			append_dev(div56, div53);
    			append_dev(div56, div54);
    			append_dev(div56, div55);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, div66, anchor);
    			append_dev(div66, div59);
    			append_dev(div59, div58);
    			append_dev(div58, b);
    			append_dev(div58, t73);
    			append_dev(div58, div57);
    			append_dev(div59, t75);
    			append_dev(div59, a0);
    			append_dev(div66, t77);
    			append_dev(div66, div60);
    			append_dev(div60, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t78);
    			append_dev(tr0, th1);
    			append_dev(thead, t80);
    			append_dev(thead, tr1);
    			append_dev(tr1, th2);
    			append_dev(tr1, t82);
    			append_dev(tr1, th3);
    			append_dev(tr1, t84);
    			append_dev(tr1, th4);
    			append_dev(table, t86);
    			append_dev(table, tbody);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td0);
    			append_dev(tr2, td1);
    			append_dev(tr2, td2);
    			append_dev(tbody, t90);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td3);
    			append_dev(tr3, td4);
    			append_dev(tr3, td5);
    			append_dev(tbody, t94);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td6);
    			append_dev(tr4, td7);
    			append_dev(tr4, td8);
    			append_dev(tbody, t98);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td9);
    			append_dev(tr5, td10);
    			append_dev(tr5, td11);
    			append_dev(tbody, t102);
    			append_dev(tbody, tr6);
    			append_dev(tr6, td12);
    			append_dev(tr6, td13);
    			append_dev(tr6, td14);
    			append_dev(tbody, t106);
    			append_dev(tbody, tr7);
    			append_dev(tr7, td15);
    			append_dev(tr7, td16);
    			append_dev(tr7, td17);
    			append_dev(tbody, t110);
    			append_dev(tbody, tr8);
    			append_dev(tr8, td18);
    			append_dev(tr8, td19);
    			append_dev(tr8, td20);
    			append_dev(tbody, t114);
    			append_dev(tbody, tr9);
    			append_dev(tr9, td21);
    			append_dev(tr9, td22);
    			append_dev(tr9, td23);
    			append_dev(tbody, t118);
    			append_dev(tbody, tr10);
    			append_dev(tr10, td24);
    			append_dev(tr10, td25);
    			append_dev(tr10, td26);
    			append_dev(tbody, t122);
    			append_dev(tbody, tr11);
    			append_dev(tr11, td27);
    			append_dev(tr11, td28);
    			append_dev(tr11, td29);
    			append_dev(tbody, t126);
    			append_dev(tbody, tr12);
    			append_dev(tr12, td30);
    			append_dev(tr12, td31);
    			append_dev(tr12, td32);
    			append_dev(tbody, t130);
    			append_dev(tbody, tr13);
    			append_dev(tr13, td33);
    			append_dev(tr13, td34);
    			append_dev(tr13, td35);
    			append_dev(tbody, t134);
    			append_dev(tbody, tr14);
    			append_dev(tr14, td36);
    			append_dev(tr14, td37);
    			append_dev(tr14, td38);
    			append_dev(tbody, t138);
    			append_dev(tbody, tr15);
    			append_dev(tr15, td39);
    			append_dev(tr15, td40);
    			append_dev(tr15, td41);
    			append_dev(tbody, t142);
    			append_dev(tbody, tr16);
    			append_dev(tr16, td42);
    			append_dev(tr16, td43);
    			append_dev(tr16, td44);
    			append_dev(tbody, t146);
    			append_dev(tbody, tr17);
    			append_dev(tr17, td45);
    			append_dev(tr17, td46);
    			append_dev(tr17, td47);
    			append_dev(tbody, t150);
    			append_dev(tbody, tr18);
    			append_dev(tr18, td48);
    			append_dev(tr18, td49);
    			append_dev(tr18, td50);
    			append_dev(tbody, t154);
    			append_dev(tbody, tr19);
    			append_dev(tr19, td51);
    			append_dev(tr19, td52);
    			append_dev(tr19, td53);
    			append_dev(tbody, t158);
    			append_dev(tbody, tr20);
    			append_dev(tr20, td54);
    			append_dev(tr20, td55);
    			append_dev(tr20, td56);
    			append_dev(tbody, t162);
    			append_dev(tbody, tr21);
    			append_dev(tr21, td57);
    			append_dev(tr21, td58);
    			append_dev(tr21, td59);
    			append_dev(tbody, t166);
    			append_dev(tbody, tr22);
    			append_dev(tr22, td60);
    			append_dev(tr22, td61);
    			append_dev(tr22, td62);
    			append_dev(tbody, t170);
    			append_dev(tbody, tr23);
    			append_dev(tr23, td63);
    			append_dev(tr23, td64);
    			append_dev(tr23, td65);
    			append_dev(tbody, t174);
    			append_dev(tbody, tr24);
    			append_dev(tr24, td66);
    			append_dev(tr24, td67);
    			append_dev(tr24, td68);
    			append_dev(tbody, t178);
    			append_dev(tbody, tr25);
    			append_dev(tr25, td69);
    			append_dev(tr25, td70);
    			append_dev(tr25, td71);
    			append_dev(tbody, t182);
    			append_dev(tbody, tr26);
    			append_dev(tr26, td72);
    			append_dev(tr26, td73);
    			append_dev(tr26, td74);
    			append_dev(tbody, t186);
    			append_dev(tbody, tr27);
    			append_dev(tr27, td75);
    			append_dev(tr27, td76);
    			append_dev(tr27, td77);
    			append_dev(tbody, t190);
    			append_dev(tbody, tr28);
    			append_dev(tr28, td78);
    			append_dev(tr28, td79);
    			append_dev(tr28, td80);
    			append_dev(tbody, t194);
    			append_dev(tbody, tr29);
    			append_dev(tr29, td81);
    			append_dev(tr29, td82);
    			append_dev(tr29, td83);
    			append_dev(tbody, t198);
    			append_dev(tbody, tr30);
    			append_dev(tr30, td84);
    			append_dev(tr30, td85);
    			append_dev(tr30, td86);
    			append_dev(tbody, t202);
    			append_dev(tbody, tr31);
    			append_dev(tr31, td87);
    			append_dev(tr31, td88);
    			append_dev(tr31, td89);
    			append_dev(tbody, t206);
    			append_dev(tbody, tr32);
    			append_dev(tr32, td90);
    			append_dev(tr32, td91);
    			append_dev(tr32, td92);
    			append_dev(tbody, t210);
    			append_dev(tbody, tr33);
    			append_dev(tr33, td93);
    			append_dev(tr33, td94);
    			append_dev(tr33, td95);
    			append_dev(tbody, t214);
    			append_dev(tbody, tr34);
    			append_dev(tr34, td96);
    			append_dev(tr34, td97);
    			append_dev(tr34, td98);
    			append_dev(tbody, t218);
    			append_dev(tbody, tr35);
    			append_dev(tr35, td99);
    			append_dev(tr35, td100);
    			append_dev(tr35, td101);
    			append_dev(tbody, t222);
    			append_dev(tbody, tr36);
    			append_dev(tr36, td102);
    			append_dev(tr36, td103);
    			append_dev(tr36, td104);
    			append_dev(tbody, t226);
    			append_dev(tbody, tr37);
    			append_dev(tr37, td105);
    			append_dev(tr37, td106);
    			append_dev(tr37, td107);
    			append_dev(tbody, t230);
    			append_dev(tbody, tr38);
    			append_dev(tr38, td108);
    			append_dev(tr38, td109);
    			append_dev(tr38, td110);
    			append_dev(tbody, t234);
    			append_dev(tbody, tr39);
    			append_dev(tr39, td111);
    			append_dev(tr39, td112);
    			append_dev(tr39, td113);
    			append_dev(tbody, t238);
    			append_dev(tbody, tr40);
    			append_dev(tr40, td114);
    			append_dev(tr40, td115);
    			append_dev(tr40, td116);
    			append_dev(tbody, t242);
    			append_dev(tbody, tr41);
    			append_dev(tr41, td117);
    			append_dev(tr41, td118);
    			append_dev(tr41, td119);
    			append_dev(tbody, t246);
    			append_dev(tbody, tr42);
    			append_dev(tr42, td120);
    			append_dev(tr42, td121);
    			append_dev(tr42, td122);
    			append_dev(tbody, t250);
    			append_dev(tbody, tr43);
    			append_dev(tr43, td123);
    			append_dev(tr43, td124);
    			append_dev(tr43, td125);
    			append_dev(tbody, t254);
    			append_dev(tbody, tr44);
    			append_dev(tr44, td126);
    			append_dev(tr44, td127);
    			append_dev(tr44, td128);
    			append_dev(tbody, t258);
    			append_dev(tbody, tr45);
    			append_dev(tr45, td129);
    			append_dev(tr45, td130);
    			append_dev(tr45, td131);
    			append_dev(tbody, t262);
    			append_dev(tbody, tr46);
    			append_dev(tr46, td132);
    			append_dev(tr46, td133);
    			append_dev(tr46, td134);
    			append_dev(tbody, t266);
    			append_dev(tbody, tr47);
    			append_dev(tr47, td135);
    			append_dev(tr47, td136);
    			append_dev(tr47, td137);
    			append_dev(tbody, t270);
    			append_dev(tbody, tr48);
    			append_dev(tr48, td138);
    			append_dev(tr48, td139);
    			append_dev(tr48, td140);
    			append_dev(tbody, t274);
    			append_dev(tbody, tr49);
    			append_dev(tr49, td141);
    			append_dev(tr49, td142);
    			append_dev(tr49, td143);
    			append_dev(tbody, t278);
    			append_dev(tbody, tr50);
    			append_dev(tr50, td144);
    			append_dev(tr50, td145);
    			append_dev(tr50, td146);
    			append_dev(tbody, t282);
    			append_dev(tbody, tr51);
    			append_dev(tr51, td147);
    			append_dev(tr51, td148);
    			append_dev(tr51, td149);
    			append_dev(tbody, t286);
    			append_dev(tbody, tr52);
    			append_dev(tr52, td150);
    			append_dev(tr52, td151);
    			append_dev(tr52, td152);
    			append_dev(tbody, t290);
    			append_dev(tbody, tr53);
    			append_dev(tr53, td153);
    			append_dev(tr53, td154);
    			append_dev(tr53, td155);
    			append_dev(tbody, t294);
    			append_dev(tbody, tr54);
    			append_dev(tr54, td156);
    			append_dev(tr54, td157);
    			append_dev(tr54, td158);
    			append_dev(tbody, t298);
    			append_dev(tbody, tr55);
    			append_dev(tr55, td159);
    			append_dev(tr55, td160);
    			append_dev(tr55, td161);
    			append_dev(tbody, t302);
    			append_dev(tbody, tr56);
    			append_dev(tr56, td162);
    			append_dev(tr56, td163);
    			append_dev(tr56, td164);
    			append_dev(tbody, t306);
    			append_dev(tbody, tr57);
    			append_dev(tr57, td165);
    			append_dev(tr57, td166);
    			append_dev(tr57, td167);
    			append_dev(tbody, t310);
    			append_dev(tbody, tr58);
    			append_dev(tr58, td168);
    			append_dev(tr58, td169);
    			append_dev(tr58, td170);
    			append_dev(table, t314);
    			append_dev(table, tfoot);
    			append_dev(tfoot, tr59);
    			append_dev(tr59, th5);
    			append_dev(tr59, t316);
    			append_dev(tr59, th6);
    			append_dev(tr59, t318);
    			append_dev(tr59, th7);
    			append_dev(div66, t320);
    			append_dev(div66, div61);
    			append_dev(div66, t322);
    			append_dev(div66, div65);
    			append_dev(div65, div63);
    			append_dev(div63, div62);
    			append_dev(div63, t324);
    			append_dev(div63, a1);
    			append_dev(div65, t326);
    			append_dev(div65, div64);

    			if (!mounted) {
    				dispose = listen_dev(a0, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(style);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div56);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(div66);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const click_handler = e => e.preventDefault();

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Table", $$slots, []);
    	return [];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Omgdrop.svelte generated by Svelte v3.24.1 */

    const file$5 = "src/Omgdrop.svelte";

    function create_fragment$5(ctx) {
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let h31;
    	let t6;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let h32;
    	let t9;
    	let div2;
    	let img2;
    	let img2_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "omgdrop.com";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "Dashboard";
    			t3 = space();
    			div0 = element("div");
    			img0 = element("img");
    			t4 = space();
    			h31 = element("h3");
    			h31.textContent = "Управление ботами";
    			t6 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t7 = space();
    			h32 = element("h3");
    			h32.textContent = "Закупка";
    			t9 = space();
    			div2 = element("div");
    			img2 = element("img");
    			add_location(h1, file$5, 5, 0, 218);
    			add_location(h30, file$5, 6, 0, 239);
    			if (img0.src !== (img0_src_value = "/screens/matematika.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-1hqei8m");
    			add_location(img0, file$5, 7, 5, 263);
    			attr_dev(div0, "class", "svelte-1hqei8m");
    			add_location(div0, file$5, 7, 0, 258);
    			add_location(h31, file$5, 8, 0, 305);
    			if (img1.src !== (img1_src_value = "/screens/items.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-1hqei8m");
    			add_location(img1, file$5, 9, 5, 337);
    			attr_dev(div1, "class", "svelte-1hqei8m");
    			add_location(div1, file$5, 9, 0, 332);
    			add_location(h32, file$5, 10, 0, 374);
    			if (img2.src !== (img2_src_value = "/screens/zakupka.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "svelte-1hqei8m");
    			add_location(img2, file$5, 11, 5, 396);
    			attr_dev(div2, "class", "svelte-1hqei8m");
    			add_location(div2, file$5, 11, 0, 391);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Omgdrop> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Omgdrop", $$slots, []);
    	return [];
    }

    class Omgdrop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Omgdrop",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$6 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	let header;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let a4;
    	let t9;
    	let a5;
    	let t10;
    	let html_tag;
    	let t11;
    	let main;
    	let switch_instance;
    	let t12;
    	let footer;
    	let div;
    	let t13;
    	let html_tag_1;
    	let raw1_value = new Date().getFullYear() + "";
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
    			header = element("header");
    			a0 = element("a");
    			a0.textContent = "maxcoredev";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Buttons";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Populate";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "Select";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "Table";
    			t9 = space();
    			a5 = element("a");
    			t10 = text("GitHub ");
    			t11 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t12 = space();
    			footer = element("footer");
    			div = element("div");
    			t13 = text("© ");
    			attr_dev(a0, "class", "logo svelte-7gtsyl");
    			attr_dev(a0, "href", "/");
    			toggle_class(a0, "current", /*hash*/ ctx[1] === "/about");
    			add_location(a0, file$6, 70, 1, 2032);
    			attr_dev(a1, "class", "item svelte-7gtsyl");
    			attr_dev(a1, "href", "/#buttons");
    			set_style(a1, "margin-left", "auto");
    			toggle_class(a1, "current", /*hash*/ ctx[1] === "#buttons");
    			add_location(a1, file$6, 71, 1, 2109);
    			attr_dev(a2, "class", "item svelte-7gtsyl");
    			attr_dev(a2, "href", "/#populate");
    			toggle_class(a2, "current", /*hash*/ ctx[1] === "#populate");
    			add_location(a2, file$6, 72, 1, 2219);
    			attr_dev(a3, "class", "item svelte-7gtsyl");
    			attr_dev(a3, "href", "/#select");
    			toggle_class(a3, "current", /*hash*/ ctx[1] === "#select");
    			add_location(a3, file$6, 73, 1, 2306);
    			attr_dev(a4, "class", "item svelte-7gtsyl");
    			attr_dev(a4, "href", "/#table");
    			toggle_class(a4, "current", /*hash*/ ctx[1] === "#table");
    			add_location(a4, file$6, 74, 1, 2387);
    			html_tag = new HtmlTag(null);
    			attr_dev(a5, "class", "item svelte-7gtsyl");
    			attr_dev(a5, "href", "https://github.com/maxcoredev?tab=repositories");
    			attr_dev(a5, "target", "_blank");
    			add_location(a5, file$6, 75, 1, 2465);
    			attr_dev(header, "class", "header svelte-7gtsyl");
    			add_location(header, file$6, 69, 0, 2007);
    			add_location(main, file$6, 78, 0, 2585);
    			html_tag_1 = new HtmlTag(null);
    			attr_dev(div, "class", "copyright svelte-7gtsyl");
    			add_location(div, file$6, 83, 4, 2667);
    			attr_dev(footer, "class", "footer svelte-7gtsyl");
    			add_location(footer, file$6, 82, 0, 2639);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, a0);
    			append_dev(header, t1);
    			append_dev(header, a1);
    			append_dev(header, t3);
    			append_dev(header, a2);
    			append_dev(header, t5);
    			append_dev(header, a3);
    			append_dev(header, t7);
    			append_dev(header, a4);
    			append_dev(header, t9);
    			append_dev(header, a5);
    			append_dev(a5, t10);
    			html_tag.m(/*out*/ ctx[2], a5);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			insert_dev(target, t12, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, t13);
    			html_tag_1.m(raw1_value, div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hash*/ 2) {
    				toggle_class(a0, "current", /*hash*/ ctx[1] === "/about");
    			}

    			if (dirty & /*hash*/ 2) {
    				toggle_class(a1, "current", /*hash*/ ctx[1] === "#buttons");
    			}

    			if (dirty & /*hash*/ 2) {
    				toggle_class(a2, "current", /*hash*/ ctx[1] === "#populate");
    			}

    			if (dirty & /*hash*/ 2) {
    				toggle_class(a3, "current", /*hash*/ ctx[1] === "#select");
    			}

    			if (dirty & /*hash*/ 2) {
    				toggle_class(a4, "current", /*hash*/ ctx[1] === "#table");
    			}

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
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let component;
    	let hash;

    	function route() {
    		$$invalidate(1, hash = location.hash);

    		if (hash === "") {
    			$$invalidate(0, component = Home);
    		} else if (hash === "#buttons") {
    			$$invalidate(0, component = Buttons);
    		} else if (hash === "#populate") {
    			$$invalidate(0, component = Populate);
    		} else if (hash === "#select") {
    			$$invalidate(0, component = Select);
    		} else if (hash === "#table") {
    			$$invalidate(0, component = Table);
    		} else if (hash === "#omgdrop") {
    			$$invalidate(0, component = Omgdrop);
    		}
    	}

    	afterUpdate(() => {
    		hljs.initHighlighting.called = false;
    		hljs.initHighlighting();
    	});

    	route();

    	function goto() {
    		window.scroll(0, 0);
    		route();
    	}

    	window.addEventListener("hashchange", goto);
    	let out = "<svg viewBox=\"0 0 24 24\"><path d=\"M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z\"/></svg>";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		Home,
    		Buttons,
    		Populate,
    		Select,
    		Table,
    		Omgdrop,
    		component,
    		hash,
    		route,
    		goto,
    		out
    	});

    	$$self.$inject_state = $$props => {
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("hash" in $$props) $$invalidate(1, hash = $$props.hash);
    		if ("out" in $$props) $$invalidate(2, out = $$props.out);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [component, hash, out];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
