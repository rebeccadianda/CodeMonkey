const modalWrapperTemplate = (children) => `
    <div>
        <a href="#sidenav-modal" tabindex="0" class="btn btn--primary btn--full-width-xs is-hidden--lg-up">
            Open sidenav
        </a>
        <div id="sidenav-modal" data-plugin-make-modal='{"devices": ["mobile", "tablet"], "position": "right"}'>
            ${children}
        </div>
    </div>
`;

const containerTemplate = (name, children = '') => `
    <ul class="sidenav__list sidenav__list--${name}">${children}</ul>
`;

const categoriesTemplate = (categories, activeIds, isUrl) => categories.map(category => `
        <li class="sidenav__item sidenav__item--category" data-category-id="${category.id}" ${!isUrl ? `data-plugin-spoiler='{"open": ${activeIds.indexOf(
  category.id) !== -1}}'` : ''}>
            <a href="${isUrl ? category.html_url : ''}" class="${!isUrl ? `sidenav__item__category js-spoiler-toggle` : activeIds.indexOf(
  category.id) !== -1 ? 'is-active js-active-sidenav-item' : ''}">
                ${category.name}
            </a>
            ${!isUrl ? `<div class="sidenav__container js-spoiler"></div>` : ''}
        </li>
    `).join('');

const sectionsTemplate = (sections, activeIds, isUrl) => sections.map(section => `
        <li class="sidenav__item sidenav__item--section" data-section-id="${section.id}" ${!isUrl ? `data-plugin-spoiler='{"open": ${activeIds.indexOf(
  section.id) !== -1}}'` : ''}>
            <a href="${isUrl ? section.html_url : ''}" class="${!isUrl ? `sidenav__item__section js-spoiler-toggle` : activeIds.indexOf(
  section.id) !== -1 ? 'is-active js-active-sidenav-item' : ''}">${section.name}</a>
             ${!isUrl ? `<div class="sidenav__container js-spoiler"></div>` : ''}
        </li>
    `).join('');

const articlesTemplate = (articles, activeIds) => articles.map(article => `
        <li class="sidenav__item sidenav__item--article" data-article-id="${article.id}">
            <a href="${article.html_url}" class="sidenav__item__article ${activeIds.indexOf(
  article.id) !== -1 ? 'is-active js-active-sidenav-item' : ''}">
                ${article.title}
            </a>
        </li>
    `).join('');

const loadMoreButtonTemplate = (url) => `
    <div class="sidenav__more">
        <button class="btn btn--xs btn--gray js-load-more" data-url="${url}">
            <span>Load more</span>
            <i class="fas fa-chevron-down"></i>
        </button>
    </div>
`;

$$.jqueryPlugin('sidenav', {
  defaultOptions: {
    levels: 10,
    showModal: false
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.isKnowledgeBase = $$.page.isCategoryPage() || $$.page.isSectionPage() || $$.page.isArticlePage();
      this.activeIDs = [];

      if (this.isKnowledgeBase) {
        this.activeIDs.push($$.page.getPageId());

        $('.breadcrumbs a').each((i, element) => {
          let pageID = $$.page.getPageId($(element).attr('href'));
          if (pageID) this.activeIDs.push(pageID);
        });
      }

      this.$container = $container.addClass('sidenav');

      window.theme.data.onFetched(this.handleDataFetched.bind(this));
    },

    handleDataFetched: function(data) {
      this.data = data;

      let html = containerTemplate('categories',
        categoriesTemplate(data.categories, this.activeIDs, this.options.levels === 1));

      if (this.options.showModal) {
        this.$container.html(modalWrapperTemplate(html));
      }
      else {
        this.$container.html(html);
      }

      this.levelSections = [];

      if (this.options.levels > 1) {
        data.categories.forEach(category => {
          let $category = $(`[data-category-id="${category.id}"]`);
          let $spoiler = $category.find('.js-spoiler');

          let categorySections = this.filterSectionsByCategoryId(category.id);
          this.levelSections = this.levelSections.concat(categorySections);

          $spoiler.html(
            containerTemplate('sections',
              sectionsTemplate(categorySections, this.activeIDs, this.options.levels === 2)));
        });
      }

      if (this.options.levels > 2) {
        this.currentLevel = 3;
        this.createSubLevels();
      }

      if (this.options.levels > 1) {
        $$.initPlugins(this.$container);
      }
    },

    filterSectionsByCategoryId: function(categoryId) {
      return this.data.sections.filter(section => section.category_id === categoryId && !section.parent_section_id);
    },

    filterSectionsBySectionId: function(sectionId) {
      return this.data.sections.filter(section => section.parent_section_id === sectionId);
    },

    filterArticlesBySectionId: function(sectionId) {
      return this.data.articles.filter(article => article.section_id === sectionId);
    },

    createSubLevels: function() {
      let newLevelSections = [];

      this.levelSections.forEach(section => {
        let $section = $(`[data-section-id="${section.id}"]`);
        let $spoiler = $section.find('.js-spoiler');

        let currentLevelSections = this.filterSectionsBySectionId(section.id);
        let articles = this.filterArticlesBySectionId(section.id);

        let template = '';

        if (this.levelSections.length) {
          template += containerTemplate('sections',
            sectionsTemplate(currentLevelSections, this.activeIDs, this.options.levels === this.currentLevel));
        }
        if (articles.length) {
          template += containerTemplate('articles', articlesTemplate(articles, this.activeIDs));
        }

        $spoiler.html(template);
        newLevelSections = newLevelSections.concat(currentLevelSections);
      });

      this.currentLevel++;

      if (newLevelSections.length && this.currentLevel <= this.options.levels) {
        this.levelSections = newLevelSections;
        this.createSubLevels();
      }
    }
  }
});
