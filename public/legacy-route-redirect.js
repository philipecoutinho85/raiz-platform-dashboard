(function () {
  'use strict';

  var normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/how-it-works') {
    window.location.replace('/como-funciona' + window.location.search + window.location.hash);
  }
})();
