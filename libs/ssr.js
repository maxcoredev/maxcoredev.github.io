const SSRUtils = new class {

    parseJSON(string) {
        string = string.trim();
        try {
            let json = JSON.parse(string);
            if (json && typeof json == 'object')
                return json;
        } catch (e) {}
        if (string == '') {
            return '';
        } else if (!isNaN(string) && !string.includes('.')) {  // floats are ignored because they can be decimals
            return parseInt(string);
        } else if (string === 'true') {
            return true;
        } else if (string === 'false') {
            return false;
        } else {
            return string;
        }
    }

    parse(value, type) {
        if (type == 'number') {
            return Number(value)
        } else if (type == 'boolean') {
            return value == 'true'
        } else if (type == 'string') {
            return value
        }
    }

    sub(root, select, ignore) {
        let selected = Array.prototype.slice.call(root.querySelectorAll(select), 0);
        let ignored = root.querySelectorAll(ignore);
        for (let i = 0; i < ignored.length; i++) {
            let pos = selected.indexOf(ignored[i]);
            if (pos !== -1)
                selected.splice(pos, 1);
        }
        return selected;
    }

}

const SSR = new class {

    constructor() {

        this.li = '[data-list][data-id]:not([data-list*="."])';
        this.attributes = ['hidden', 'disabled', 'required'];

        this.modules = {model: {}, list: {}};
        this.influencers = {model: {}, list: {}};

        this.affecteds = {};
        for (let attribute of this.attributes)
            this.affecteds[attribute] = document.querySelectorAll('[data-' + attribute + ']');

    }

    setInfluencers(scope, affecteds, attribute, properties, type, name, id) {
        for (let affected of affecteds) {
            let condition = affected.getAttribute('data-' + attribute);
            for (let property in properties) {
                let variable = new RegExp('\\b' + scope + '\\.' + property + '\\b');
                if (variable.test(condition)) {
                    if (!this.influencers[type][name]) this.influencers[type][name] = {};
                    if (id && !this.influencers[type][name][id]) this.influencers[type][name][id] = {};
                    let influencer = id ? this.influencers[type][name][id] : this.influencers[type][name];
                    if (!influencer[property]) influencer[property] = {};
                    if (!influencer[property][attribute]) influencer[property][attribute] = [];
                    influencer[property][attribute].push(affected);
                }
            }
        }
    }

    setListInfluencers(root, attribute, properties, type, name, model) {
        let depth = 0;
        let loop = root => {
            let scope = 'scope' + '\\.[\\w$]+'.repeat(depth);
            let affecteds = SSRUtils.sub(root, `[data-${attribute}]`, `:scope ${this.li} [data-${attribute}]`);
            this.setInfluencers(scope, affecteds, attribute, properties, type, name, model.id);
            for (let affected of affecteds)
                affected.SSRSCOPE = model;
            if (root.querySelectorAll(`${this.li}`).length) {
                depth++;
                for (let list of SSRUtils.sub(root, `${this.li}`, `:scope ${this.li} ${this.li}`))
                    loop(list);
            }
        }
        loop(root);
    }

    add(name, properties, model, type) {

        model.types = {};
        model.elements = {};

        for (let property in properties) {

            model.types[property] = properties[property]

            let variableType = model.types[property]

            if (model.element)
                for (let property in model.element.dataset)
                    model[property] = SSRUtils.parse(model.element.dataset[property], variableType);

            if (type == 'list') {
                model.elements[property] = SSRUtils.sub(model.element, `[data-list="scope.${property}"]`, `:scope ${this.li} [data-list="scope.${property}"]`);
            } else {
                model.elements[property] = document.querySelectorAll(`[data-model="${name}.${property}"]`);
            }

            if (!model[property] && model.elements[property].length) {
                for (let element of model.elements[property]) {
                    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
                        if (element.type == 'checkbox') {
                            if (!model[property])
                                model[property] = [];
                            if (element.checked)
                                model[property].push(element.value);
                        } else if (element.type == 'radio') {
                            if (element.checked)
                                model[property] = element.value;
                        } else if (element.type == 'select-multiple') {
                            model[property] = [...element.options].filter(x => x.selected).map(x => x.value);
                        } else {
                            model[property] = SSRUtils.parse(element.value, variableType);
                        }
                    } else {
                        model[property] = SSRUtils.parse(element.innerHTML, variableType);
                    }
                }
            }

        }

        for (let attribute of this.attributes) {
            if (type == 'list') {
                this.setListInfluencers(model.element, attribute, properties, type, name, model);
            } else {
                let scope = name;
                let affecteds = this.affecteds[attribute];
                this.setInfluencers(scope, affecteds, attribute, properties, type, name);
            }
        }

        model = new Proxy(model, {
            set(model, property, value) {
                model[property] = SSRUtils.parse(value, model.types[property]);;
                if (model.element && property in model.element.dataset)
                    model.element.dataset[property] = value;
                if (property in model.elements) {
                    for (let element of model.elements[property]) {
                        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
                            if (element.type == 'checkbox') {
                                element.checked = value.includes(element.value);
                            } else if (element.type == 'radio') {
                                element.checked = value == element.value;
                            } else if (element.type == 'select-multiple') {
                                for (let option of element.options)
                                    option.selected = model[property].includes(option.value);
                            } else {
                                if (element.value != value)
                                    element.value = value;
                            }
                        } else {
                            element.innerHTML = value;
                        }
                    }
                }
                if (SSR.influencers[type][name])
                    SSR.draw(type, name, property, value, type == 'list' ? model : null);
                return true;
            }
        });

        if (type == 'list') {
            if (!this.modules.list[name])
                this.modules.list[name] = {};
            this.modules.list[name][model.id] = model;
        } else {
            this.modules.model[name] = model;
        }

        if (type == 'list') {
            let ancestor = model.element.parentNode.closest('[data-list]');
            if (ancestor) {
                let module = ancestor.getAttribute('data-list');
                let id = ancestor.getAttribute('data-id');
                model[module] = this.modules.list[module][id];
                if (!this.modules.list[module][id][name + '_set'])
                    this.modules.list[module][id][name + '_set'] = new QuerySet();
                this.modules.list[module][id][name + '_set'].push(model);
            }
        }

        for (let property in model.elements) {
            for (let element of model.elements[property]) {
                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
                    let event = ['checkbox', 'radio', 'select', 'select-multiple'].includes(element.type) ? 'change' : 'input';
                    element.addEventListener(event, this.trigger.bind(model, property));
                }
            }
        }

        return model;

    }

    draw(type, name, property, value, model) {
        let influencer = model ? this.influencers[type][name][model.id] : this.influencers[type][name];
        for (let attribute in influencer[property]) {
            for (let element of influencer[property][attribute]) {
                let scope = element.SSRSCOPE;
                element[attribute] = eval(element.getAttribute('data-' + attribute)) ? true : false;
            }
        }
    }

    trigger(property, e) {
        if (e.target.type == 'checkbox') {
            e.target.checked ? this[property].push(e.target.value) : this[property].pop(e.target.value);
            this[property] = this[property]; // Since checkboxes are arrays - trigger model Proxy change by simply redefining it
        } else if (e.target.type == 'select-multiple') {
            this[property] = [...e.target.options].filter(x => x.selected).map(x => x.value);
        } else {
            this[property] = e.target.value;
        }
    }

}

class QuerySet extends Array {

    get(id) {
        return this.find(x => x.id == id);
    }

    select(params) {
        return this.filter(item => {
            for (let param in params)
                if (item[param] != params[param])
                    return false;
            return true;
        });
    }

    update(params) {
        return this.map(item => {
            for (let param in params)
                item[param] = params[param];
            return item;
        });
    }

}

class Model {

    constructor(name, properties, methods) {
        for (let method in methods)
            this[method] = methods[method];
        this.element = document.querySelector('[data-model="' + name + '"]');
        return SSR.add(name, properties, this, 'model');
    }

}

class List extends QuerySet {

    constructor(name, properties, methods) {
        super();
        for (let method in methods)
            this[method] = methods[method];
        for (let element of document.querySelectorAll('[data-list="' + name + '"]'))
            this.push(SSR.add(name, properties, {element: element}, 'list'));
    }

}