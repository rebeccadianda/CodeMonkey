window.theme.data = {
  _status: '',
  _callbacks: []
};

window.theme.data.onFetched = function(callback) {
  if (window.theme.data._status === 'SUCCESS') {
    runCallback(callback);
  }
  else {
    window.theme.data._callbacks.push(callback);
  }
};

function runCallback(callback) {
  callback({
    categories: window.theme.data.categories,
    sections: window.theme.data.sections,
    articles: window.theme.data.articles
  });
}

function dataFetcher() {

  if (!window.theme.data._status) {
    window.theme.data._status = 'PENDING';
    fetchData();
  }

  function getApiURL(name, page) {
    return '/api/v2/help_center/' + window.theme.locale + '/' + name + '?per_page=100&draft=false&page=' + page;
  }

  function fetchData() {
    return Promise
      .all([
        fetchAllDataByName('articles'),
        fetchAllDataByName('sections'),
        fetchAllDataByName('categories')
      ])
      .then(function(responses) {
        window.theme.data.articles = responses[0];

        var sectionIDs = [[]];
        var categoryIDs = [];

        function pushParentSectionIDs() {
          var childIDs = sectionIDs[sectionIDs.length - 1];
          var IDs = sectionIDs[sectionIDs.length] = [];

          responses[1].forEach(function(section) {
            if (childIDs.indexOf(section.id) !== -1 && section.parent_section_id) {
              IDs.push(section.parent_section_id);
            }
          });

          if (IDs.length) {
            pushParentSectionIDs();
          }
        }

        window.theme.data.articles.forEach(function(article) {
          if (sectionIDs[0].indexOf(article.section_id) === -1) {
            sectionIDs[0].push(article.section_id);
          }
        });

        if (sectionIDs[0].length && responses[1].length !== sectionIDs[0].length) {
          pushParentSectionIDs();
        }

        sectionIDs = Array.from(new Set(sectionIDs.flat()));

        window.theme.data.sections = responses[1].filter(function(section) {
          if (sectionIDs.indexOf(section.id) !== -1) {
            if (categoryIDs.indexOf(section.category_id) === -1) {
              categoryIDs.push(section.category_id);
            }
            return true;
          }
          return false;
        });

        if (responses[2].length === categoryIDs.length) {
          window.theme.data.categories = responses[2];
        }
        else {
          window.theme.data.categories = responses[2].filter(function(category) {
            return categoryIDs.indexOf(category.id) !== -1;
          });
        }

        window.theme.data._status = 'SUCCESS';
        window.theme.data._callbacks.forEach(runCallback);
      })
      .catch(function() {
        window.theme.data._status = 'ERROR';
      });
  }

  function fetchAllDataByName(name) {
    return new $$.Request({cacheLifetime: 0})
      .fetch(getApiURL(name, 1))
      .then(function(response) {
        var dataArr = response[name];
        var requests = [];

        if (response.page_count === 1) {
          return dataArr;
        }

        for (var i = 2; i < response.page_count + 1; i++) {
          requests.push(getApiURL(name, i));
        }

        return Promise
          .all(requests.map(function(request) {
            return new $$.Request().fetch(request);
          }))
          .then(function(responses) {
            responses.forEach(function(response) {
              dataArr = [].concat(dataArr, response[name]);
            });

            return dataArr;
          });
      })
      .catch(function() {
        window.theme.data._status = 'ERROR';
      });
  }
}

dataFetcher();
