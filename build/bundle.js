
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
    	let h20;
    	let t1;
    	let pre;
    	let code;
    	let t3;
    	let h21;
    	let t5;
    	let section0;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let button2;
    	let t11;
    	let button3;
    	let t13;
    	let button4;
    	let t15;
    	let button5;
    	let t17;
    	let button6;
    	let t19;
    	let section1;
    	let button7;
    	let t21;
    	let button8;
    	let t23;
    	let button9;
    	let t25;
    	let button10;
    	let t27;
    	let button11;
    	let t29;
    	let button12;
    	let t31;
    	let button13;
    	let t33;
    	let h22;
    	let t35;
    	let section2;
    	let button14;
    	let t37;
    	let button15;
    	let t39;
    	let button16;
    	let t41;
    	let button17;
    	let t43;
    	let button18;
    	let t45;
    	let button19;
    	let t47;
    	let h23;
    	let t49;
    	let section3;
    	let button20;
    	let t51;
    	let button21;
    	let t53;
    	let button22;
    	let t55;
    	let button23;

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Classes";
    			t1 = space();
    			pre = element("pre");
    			code = element("code");

    			code.textContent = `${`<button [disabled] class="button
  [large|big|regular|medium|small|tiny]
  [red|green|blue]
  [outlined]
  [pending]
  [on-dark]">Button</button>`}`;

    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Colors";
    			t5 = space();
    			section0 = element("section");
    			button0 = element("button");
    			button0.textContent = "Default";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Red";
    			t9 = space();
    			button2 = element("button");
    			button2.textContent = "Green";
    			t11 = space();
    			button3 = element("button");
    			button3.textContent = "Blue";
    			t13 = space();
    			button4 = element("button");
    			button4.textContent = "Red";
    			t15 = space();
    			button5 = element("button");
    			button5.textContent = "Green";
    			t17 = space();
    			button6 = element("button");
    			button6.textContent = "Blue";
    			t19 = space();
    			section1 = element("section");
    			button7 = element("button");
    			button7.textContent = "Default";
    			t21 = space();
    			button8 = element("button");
    			button8.textContent = "Red";
    			t23 = space();
    			button9 = element("button");
    			button9.textContent = "Green";
    			t25 = space();
    			button10 = element("button");
    			button10.textContent = "Blue";
    			t27 = space();
    			button11 = element("button");
    			button11.textContent = "Red";
    			t29 = space();
    			button12 = element("button");
    			button12.textContent = "Green";
    			t31 = space();
    			button13 = element("button");
    			button13.textContent = "Blue";
    			t33 = space();
    			h22 = element("h2");
    			h22.textContent = "Sizes";
    			t35 = space();
    			section2 = element("section");
    			button14 = element("button");
    			button14.textContent = "Large";
    			t37 = space();
    			button15 = element("button");
    			button15.textContent = "Big";
    			t39 = space();
    			button16 = element("button");
    			button16.textContent = "Regular";
    			t41 = space();
    			button17 = element("button");
    			button17.textContent = "Medium";
    			t43 = space();
    			button18 = element("button");
    			button18.textContent = "Small";
    			t45 = space();
    			button19 = element("button");
    			button19.textContent = "Tiny";
    			t47 = space();
    			h23 = element("h2");
    			h23.textContent = "States";
    			t49 = space();
    			section3 = element("section");
    			button20 = element("button");
    			button20.textContent = "Default";
    			t51 = space();
    			button21 = element("button");
    			button21.textContent = "Current";
    			t53 = space();
    			button22 = element("button");
    			button22.textContent = "Disabled";
    			t55 = space();
    			button23 = element("button");
    			button23.textContent = "Pending";
    			attr_dev(h20, "class", "heading svelte-1l38wwf");
    			add_location(h20, file, 7, 0, 314);
    			attr_dev(code, "class", "css");
    			add_location(code, file, 9, 23, 371);
    			attr_dev(pre, "class", "dark code svelte-1l38wwf");
    			add_location(pre, file, 9, 0, 348);
    			attr_dev(h21, "class", "heading svelte-1l38wwf");
    			add_location(h21, file, 18, 0, 555);
    			attr_dev(button0, "class", "button svelte-1l38wwf");
    			add_location(button0, file, 21, 1, 615);
    			attr_dev(button1, "class", "red button svelte-1l38wwf");
    			add_location(button1, file, 22, 1, 656);
    			attr_dev(button2, "class", "green button svelte-1l38wwf");
    			add_location(button2, file, 23, 1, 697);
    			attr_dev(button3, "class", "blue button svelte-1l38wwf");
    			add_location(button3, file, 24, 1, 742);
    			attr_dev(button4, "class", "outlined red button svelte-1l38wwf");
    			add_location(button4, file, 26, 1, 786);
    			attr_dev(button5, "class", "outlined green button svelte-1l38wwf");
    			add_location(button5, file, 27, 1, 836);
    			attr_dev(button6, "class", "outlined blue button svelte-1l38wwf");
    			add_location(button6, file, 28, 1, 890);
    			attr_dev(section0, "class", "buttons svelte-1l38wwf");
    			add_location(section0, file, 20, 0, 588);
    			attr_dev(button7, "class", "on-dark button svelte-1l38wwf");
    			add_location(button7, file, 32, 1, 985);
    			attr_dev(button8, "class", "on-dark red button svelte-1l38wwf");
    			add_location(button8, file, 33, 1, 1034);
    			attr_dev(button9, "class", "on-dark green button svelte-1l38wwf");
    			add_location(button9, file, 34, 1, 1083);
    			attr_dev(button10, "class", "on-dark blue button svelte-1l38wwf");
    			add_location(button10, file, 35, 1, 1136);
    			attr_dev(button11, "class", "outlined on-dark red button svelte-1l38wwf");
    			add_location(button11, file, 37, 1, 1188);
    			attr_dev(button12, "class", "outlined on-dark green button svelte-1l38wwf");
    			add_location(button12, file, 38, 1, 1246);
    			attr_dev(button13, "class", "outlined on-dark blue button svelte-1l38wwf");
    			add_location(button13, file, 39, 1, 1308);
    			attr_dev(section1, "class", "buttons dark svelte-1l38wwf");
    			add_location(section1, file, 31, 0, 953);
    			attr_dev(h22, "class", "heading svelte-1l38wwf");
    			add_location(h22, file, 42, 0, 1379);
    			attr_dev(button14, "class", "large button svelte-1l38wwf");
    			add_location(button14, file, 45, 1, 1438);
    			attr_dev(button15, "class", "big button svelte-1l38wwf");
    			add_location(button15, file, 46, 1, 1483);
    			attr_dev(button16, "class", "regular button svelte-1l38wwf");
    			add_location(button16, file, 47, 1, 1524);
    			attr_dev(button17, "class", "medium button svelte-1l38wwf");
    			add_location(button17, file, 48, 1, 1573);
    			attr_dev(button18, "class", "small button svelte-1l38wwf");
    			add_location(button18, file, 49, 1, 1620);
    			attr_dev(button19, "class", "tiny button svelte-1l38wwf");
    			add_location(button19, file, 50, 1, 1665);
    			attr_dev(section2, "class", "buttons svelte-1l38wwf");
    			add_location(section2, file, 44, 0, 1411);
    			attr_dev(h23, "class", "heading svelte-1l38wwf");
    			add_location(h23, file, 53, 0, 1719);
    			attr_dev(button20, "class", "button svelte-1l38wwf");
    			add_location(button20, file, 56, 1, 1779);
    			attr_dev(button21, "class", "current button svelte-1l38wwf");
    			add_location(button21, file, 57, 1, 1820);
    			button22.disabled = true;
    			attr_dev(button22, "class", "button svelte-1l38wwf");
    			add_location(button22, file, 58, 1, 1869);
    			button23.disabled = true;
    			attr_dev(button23, "class", "pending button svelte-1l38wwf");
    			add_location(button23, file, 59, 1, 1920);
    			attr_dev(section3, "class", "buttons svelte-1l38wwf");
    			add_location(section3, file, 55, 0, 1752);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, button0);
    			append_dev(section0, t7);
    			append_dev(section0, button1);
    			append_dev(section0, t9);
    			append_dev(section0, button2);
    			append_dev(section0, t11);
    			append_dev(section0, button3);
    			append_dev(section0, t13);
    			append_dev(section0, button4);
    			append_dev(section0, t15);
    			append_dev(section0, button5);
    			append_dev(section0, t17);
    			append_dev(section0, button6);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, button7);
    			append_dev(section1, t21);
    			append_dev(section1, button8);
    			append_dev(section1, t23);
    			append_dev(section1, button9);
    			append_dev(section1, t25);
    			append_dev(section1, button10);
    			append_dev(section1, t27);
    			append_dev(section1, button11);
    			append_dev(section1, t29);
    			append_dev(section1, button12);
    			append_dev(section1, t31);
    			append_dev(section1, button13);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, button14);
    			append_dev(section2, t37);
    			append_dev(section2, button15);
    			append_dev(section2, t39);
    			append_dev(section2, button16);
    			append_dev(section2, t41);
    			append_dev(section2, button17);
    			append_dev(section2, t43);
    			append_dev(section2, button18);
    			append_dev(section2, t45);
    			append_dev(section2, button19);
    			insert_dev(target, t47, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, button20);
    			append_dev(section3, t51);
    			append_dev(section3, button21);
    			append_dev(section3, t53);
    			append_dev(section3, button22);
    			append_dev(section3, t55);
    			append_dev(section3, button23);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t47);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(section3);
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

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", $$slots, []);
    	return [];
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
    			add_location(link, file$1, 25, 4, 531);
    			add_location(main, file$1, 28, 0, 667);
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
