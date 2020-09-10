;(function($, window, document, undefined) {

    var $window = $(window);
    var $document = $(document);
    var $body = $('body');

    $.expr[':'].selectXsearch = function(n, i, m) {
        return jQuery(n).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    var Utils = new function() { var self = this;

        self.getScrollBarWidth = function() {
            var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body');
            var widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
            $outer.remove();
            return 100 - widthWithScroll;
        };

        self.hasScrollBar = function(el) {
            return el.get(0).scrollHeight > el.height();
        };

    };

    var SelectManager = new function() { var self = this;

        self.objects = [];

        $document.on('mouseup', function(e) {
            $.each(self.objects, function(index, object) {
                object.search.off('focusout').on('focusout', function() {
                    object.blur();
                });
                if ($(e.target).closest(object.selectX).length == 0) {
                    object.search.trigger('focusout');
                }
            });
        });

    };

    var defaults = {
        placeholder: 'Choose value',
        noResults: 'Not found',
        cssClass: 'select-default',
        search: true
    };

    var Select = function(element, options) { var self = this;

        self.selectX = $();
        self.opts = $.extend({}, defaults, options);
        self.searchCss = (self.opts.search) ? 'select-has-search' : 'select-no-search';

        self.select = $(element);
        self.is_multiple = self.select.is('[multiple]');
        self.opts.search = self.opts.search || self.is_multiple;

        self.init();

    };

    Select.prototype.init = function() { var self = this;

        self.select.css('position', '').removeClass('select').removeAttr('tabindex');

        self.selectX.remove();

        self.selectX = $(self.select.prop('outerHTML')
            .replace(/value/ig, 'data-value')
            .replace(/<select/ig, '<div class="select-select select-no-value ' + self.searchCss + ' ' + self.opts.cssClass + '">' +
            '<div class="select-shadow"></div>' +
            '<div class="select-selection">' +
            '<span class="select-placeholder">' + self.opts.placeholder + '</span>' +
            '<span class="select-tags"></span>' +
            '<input type="text" class="select-search-tags">' +
            '</div>' +
            '<input type="text" class="select-search">' +
            '<div class="select-dropdown">' +
            '<div class="select-no-results">' + self.opts.noResults + '</div>' +
            '<div class="select-results" tabindex="-1"')
            .replace(/<optgroup/ig, '<div class="select-optgroup">' +
            '<div class="select-options"')
            .replace(/<option/ig, '<div class="select-option"')
            .replace(/<\/option>/ig, '</div>')
            .replace(/<\/optgroup>/ig, '</div>' +
            '</div>')
            .replace(/<\/select>/ig, '</div>' +
            '</div>' +
            '</div>'));

        self.selection = self.selectX.find('.select-selection');
        self.shadow = self.selectX.find('.select-shadow');
        self.placeholder = self.selectX.find('.select-placeholder');
        self.optgroups = self.selectX.find('.select-optgroup');
        self.optionsWrappers = self.selectX.find('.select-options');
        self.options = self.selectX.find('.select-option').removeAttr('selected');
        self.dropdown = self.selectX.find('.select-dropdown');
        self.results = self.selectX.find('.select-results').removeAttr('name required');
        self.tags = self.selectX.find('.select-tags');
        self.opened = false;
        self.mouseenter = false;

        self.optionsWrappers.each(function() { // Create optgroup label tag
            var optionsWrapper = $(this);
            var label = optionsWrapper.attr('label');
            if (label) optionsWrapper.before('<div class="select-optgroup-label">' + label + '</div>');
            optionsWrapper.removeAttr('label');
        });

        if (self.is_multiple) {
            self.selectX.addClass('select-multiple');
            self.selectX.find('.select-search').remove();
            self.search = self.selectX.find('.select-search-tags');
        } else {
            self.tags.add(self.placeholder).remove();
            self.selectX.addClass('select-single');
            self.selectX.find('.select-search-tags').remove();
            self.search = self.selectX.find('.select-search');
        }

        self.select.css('position', 'absolute').addClass('select').attr('tabindex', '-1').off('DOMNodeInserted DOMNodeRemoved change').on('DOMNodeInserted DOMNodeRemoved change', function() {
            self.init();
        }).closest('label').off('click').on('click', function(e) {
            e.preventDefault();
        });

        self.select.after(self.selectX);
        self.select.css('width', self.selectX.width());

        self.renderSelection();
        self.setEvents();

    };

    Select.prototype.setPlaceholder = function(condition) { var self = this;
        if (self.is_multiple) {
            if (condition) {
                self.placeholder.hide();
                self.selectX.removeClass('select-no-value').addClass('select-has-value');
            } else {
                self.placeholder.show();
                self.selectX.addClass('select-no-value').removeClass('select-has-value');
            }
        } else {
            if (condition) {
                self.selectX.removeClass('select-no-value').addClass('select-has-value');
            } else {
                self.selectX.addClass('select-no-value').removeClass('select-has-value');
            }
        }
    };

    Select.prototype.renderSelection = function() { var self = this;
        self.options.removeClass('select-option-selected');
        if (self.is_multiple) {
            self.tags.html('');
            var hasVal = self.select.val().length > 0;
            if (hasVal) {
                $.each(self.select.val(), function() {
                    var val = this;
                    var text = self.options.filter('[data-value="' + val + '"]').addClass('select-option-selected').text();
                    var tag = $('<span class="select-tag">' +
                        '<span class="select-tag-remove" data-value="' + val + '">×</span>' +
                        '<span class="select-tag-title">' + text + '</span>' +
                        '</span>');
                    self.tags.append(tag);
                });
                self.placeholder.hide();
                self.selectX.removeClass('select-no-value').addClass('select-has-value');
            }
            self.setPlaceholder(hasVal);
            self.select.css('height', self.selection.outerHeight());
        } else {
            var val = self.select.val();
            var text = self.select.find(':selected').text();
            self.options.filter('[data-value="' + val + '"]').addClass('select-option-selected');
            self.selection.text(text);
            self.setPlaceholder(val);
        }
    };

    Select.prototype.setSelection = function(option) { var self = this;
        var value = option.data('value').toString() || '';
        if (self.is_multiple) {
            var values = self.select.val();
            if ($.inArray(value, values) > -1) {
                var index = values.indexOf(value);
                if (index != -1) values.splice(index, 1);
                self.select.val(values);
            } else {
                self.select.val(values.concat([value]));
            }
        } else {
            self.select.val(value);
        }
        self.renderSelection();
        self.clearSearch();
        self.close();
    };

    Select.prototype.setEvents = function() { var self = this;

        self.selection.on('click', function(e) {
            if ($(e.target).closest('.select-tag-remove').length == 0 && $(e.target).closest(self.tags).length == 0) {
                self.toggle();
            }
        });

        self.selectX.on('mousedown', function() {
            self.search.off('focusout');
        }).on('mouseup', function() {
            self.search.focus();
        });

        self.selectX.on('mouseenter', function() {
            self.mouseenter = true;
            self.toggleScroll();
        }).on('mouseleave', function() {
            self.mouseenter = false;
            self.enableScroll();
        });

        self.options.on('mouseenter', function() {
            self.setHovered($(this));
        }).on('click', function() {
            self.setSelection($(this));
        });

        self.search.on('focus', function() {
            self.selectX.addClass('select-focused');
        }).on('focusout', function() {
            self.blur();
        }).on('input', function() {
            if (self.opts.search) {
                self.open();
                self.find();
                self.results.scrollTop(0);
                if (self.is_multiple && (self.search.val() || !jQuery.isEmptyObject(self.select.val()))) {
                    self.placeholder.hide();
                } else {
                    self.placeholder.show();
                }
                self.setSearchWidth();
                self.setShadowHeight();
            }
        }).on('keydown', function(e) {
            if (e.keyCode == 13) { // Enter
                e.preventDefault();
                if (self.opened) {
                    self.setSelection(self.hovered);
                    self.search.trigger('focus');
                } else {
                    self.open();
                }
            } else if (e.keyCode == 27) { // Esc
                self.close();
            } else if (e.keyCode == 40 || e.keyCode == 38) {
                e.preventDefault();
                if (self.opened && self.options.filter(':visible').length) {
                    var offset = self.results.offset().top;
                    var index = self.options.filter(':visible').index(self.hovered);
                    var elementHeight = self.options.first().outerHeight();
                    var resultsHeight = self.results.outerHeight();
                    if (e.keyCode == 40) { // Down
                        if (index + 1 < self.options.filter(':visible').length) {
                            self.setHovered($(self.options.filter(':visible').get(index + 1)));
                            if (self.hovered.offset().top - offset + elementHeight > resultsHeight) {
                                self.results.scrollTop(self.hovered.offset().top - offset - resultsHeight + elementHeight + self.results.scrollTop());
                            }
                        } else {
                            self.results.scrollTop(resultsHeight + self.results.scrollTop());
                        }
                    } else if (e.keyCode == 38) { // Up
                        if (index > 0) {
                            self.setHovered($(self.options.filter(':visible').get(index - 1)));
                            if (self.hovered.offset().top - offset + self.results.scrollTop() < self.results.scrollTop()) {
                                self.results.scrollTop(self.hovered.offset().top - offset + self.results.scrollTop());
                            }
                        } else {
                            self.results.scrollTop(0);
                        }
                    }
                } else {
                    self.open(e);
                }
            }
        });

        self.tags.on('click', '.select-tag-remove', function(e) {
            self.setSelection($(this));
        });

    };

    Select.prototype.open = function() { var self = this;
        self.selectX.addClass('select-opened');
        self.opened = true;
        self.setShadowHeight();
        if (!self.hovered) {
            self.setHovered(self.options.filter(':visible').first());
        }
        if (self.mouseenter) {
            self.toggleScroll();
        }
    };

    Select.prototype.close = function() { var self = this;
        self.selectX.removeClass('select-opened');
        self.opened = false;
        self.mouseenter = false;
        self.clearShadowHeight();
        self.enableScroll();
    };

    Select.prototype.toggle = function() { var self = this;
        (self.opened) ? self.close() : self.open();
    };

    Select.prototype.setShadowHeight = function() { var self = this;
        self.shadow.css('min-height', self.dropdown.outerHeight() + self.selection.outerHeight());
    };

    Select.prototype.clearShadowHeight = function() { var self = this;
        self.shadow.css('min-height', self.selection.outerHeight());
    };

    Select.prototype.blur = function() { var self = this;
        self.close();
        self.clearSearch();
        self.selectX.removeClass('select-focused');
        self.results.scrollTop(0);
    };

    Select.prototype.setHovered = function(element) { var self = this;
        self.options.removeClass('select-option-hovered');
        self.hovered = element.addClass('select-option-hovered');
    };

    Select.prototype.find = function() { var self = this;

        var q = $.trim(self.search.val().replace(/\\/g, ''));
        var regex = new RegExp( '(' + q + ')', 'i' );

        self.optgroups.add(self.options).hide();

        self.clearMatch();

        self.options.filter(':selectXsearch(' + q + ')').filter(function() {return !q || $(this).data('value'); }).show().closest(self.optgroups).show();

        self.options.each(function() {
            var option = $(this);
            var text = option.text().replace(regex, '<u class="select-match">$1</u>');
            option.html(text);
        });

        self.setHovered(self.options.filter(':visible').first());

    };

    Select.prototype.clearMatch = function() { var self = this;
        self.options.each(function() {
            var option = $(this);
            option.text(option.text());
        });
    };

    Select.prototype.clearSearch = function() { var self = this;
        if (self.is_multiple)
            self.setPlaceholder(self.select.val().length > 0);
        self.search.val('');
        self.optgroups.add(self.options).show();
        self.clearMatch();
        self.setSearchWidth();
    };

    Select.prototype.toggleScroll = function() { var self = this;
        if (self.opened) {
            if (Utils.hasScrollBar(self.results)) {
                self.disableScroll();
            } else {
                self.enableScroll();
            }
        }
    };

    Select.prototype.disableScroll = function() { var self = this;
        $body.css({'padding-right': Utils.getScrollBarWidth(), 'overflow-y': 'hidden'});
    };

    Select.prototype.enableScroll = function() { var self = this;
        $body.css({'padding-right': '', 'overflow-y': ''});
    };

    Select.prototype.setSearchWidth = function() { var self = this;
        if (self.is_multiple) {
            self.search.css('width', 1).css('width', self.search.prop('scrollWidth'))
        }
    };

    $.fn.select = function(options) {
        return this.each(function() {
            if (!$.data(this, 'select')) {
                var newSelect = new Select(this, options);
                SelectManager.objects.push(newSelect);
                $.data(this, 'select', newSelect);
            }
        });
    }

})(jQuery, window, document);
