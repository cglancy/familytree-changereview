(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('home', {
        url: '/home',
        controller: 'HomeController',
        templateUrl: 'home/home.tpl.html',
        data: { pageTitle: 'Home' }
      });
    })
    .controller('HomeController', function ($scope, fsCurrentUserCache) {
          fsCurrentUserCache.getUser().then(function(user) {
            $scope.userName = user.displayName;
          });
    });
})();
