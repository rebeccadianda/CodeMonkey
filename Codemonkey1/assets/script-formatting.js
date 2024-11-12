'use strict';

$$.jqueryPlugin('formatting', {
  methods: {
    init: function init(uid, options, $container) {
      this.$container = $container;

      if (!$container[0].hasAttribute('data-plugin-article-body')) {
        this.createIframe();
        this.createTable();
      }

      $container.find('table.tabs').each(function (i, element) {
        this.tabs($(element), 'tabs-' + uid + i);
      }.bind(this));
      $container.find('table.accordion').each(function (i, element) {
        this.accordions($(element));
      }.bind(this));
    },
    createIframe: function createIframe() {
      this.$container.find('iframe').each(function (i, element) {
        var $iframe = $(element);
        var height = $iframe.height() / $iframe.width() * 100;
        $iframe.wrap('<div class="iframe"></div>').parent().css('padding-bottom', height + '%');
      });
    },
    createTable: function createTable() {
      this.$container.find('table').each(function (i, element) {
        var $table = $(element);

        if (!$table.hasClass('tabs') && !$table.hasClass('accordion') && !$table.hasClass('table')) {
          var $tableContainer = $('<div class="table-container"></div>');
          $table.after($tableContainer);
          $tableContainer.append($table);
        }
      });
    },
    tabs: function tabs($element, id) {
      var $tab = $('<div class="' + $element.attr('class') + '"></div>');
      var $tabLinks = $('<div class="tabs__links js-tabs-links"></div>');
      var $tabContainers = $('<div class="tabs__containers js-tabs-containers"></div>');
      $element.children('tbody').children('tr').eq(0).children('td').each(function (i, element) {
        var $td = $(element);
        var tabId = id + i;
        $tabLinks.append('<a href="#' + tabId + '" tabindex="0">' + $td.text().trim() + '</a>');
      });
      $element.children('tbody').children('tr').eq(1).children('td').each(function (i, element) {
        var $td = $(element);
        var tabId = id + i;
        var $tabTextContainer = $('<div id="' + tabId + '" class="tabs__container"></div>'); // $tabContainers.append('<div id="' + tabId + '" class="tabs__container">' + $element.html() + '</div>');

        var $childElements = $td.children('*');

        if ($childElements.length) {
          $childElements.each(function (i, element) {
            $tabTextContainer.append($(element));
          });
        } else {
          $tabTextContainer.append($td.text().trim());
        }

        $tabContainers.append($tabTextContainer);
      });
      $tab.append($tabLinks).append($tabContainers);
      $element.after($tab);
      $element.remove();
      $tab.tabs();
    },
    accordions: function accordions($element) {
      var $accordion = $('<div class="' + $element.attr('class') + '"></div>');
      $element.after($accordion);
      $element.children('tbody').children('tr').children('td').each(function (i, element) {
        var $td = $(element);
        var $title = $td.children('h1, h2, h3, h4, h5').first();
        var title = $title.text();
        $title.remove();
        var $spoiler = $('<div class="spoiler" data-plugin-spoiler></div>');
        var $spoilerTitle = $('<a class="spoiler__title js-spoiler-toggle" role="button" tabindex="0"></a>');
        var $spoilerText = $('<div class="spoiler__text js-spoiler" aria-hidden="true"></div>');
        $spoiler.append($spoilerTitle);
        $spoiler.append($spoilerText);
        $spoilerTitle.text(title);
        $td.children('*').each(function (i, element) {
          $spoilerText.append($(element));
        });
        $accordion.append($spoiler);
        $td.remove();
      });
      $element.remove();
      var $spoilers = $accordion.children('[data-plugin-spoiler]');
      $spoilers.on('spoiler:open', function (event, spoiler) {
        spoiler.$container.siblings('[data-plugin-spoiler]').each(function (i, element) {
          $(element).spoiler('close');
        });
      });
    }
  }
});
