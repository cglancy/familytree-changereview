(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'about/about.tpl.html',
        data: { pageTitle: 'About' }
      });
    })
    .controller('AboutController', function () {

    });
})();
