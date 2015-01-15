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
    .controller('HomeController', function ($scope, fsCurrentUserCache, $firebase, $window) {

      fsCurrentUserCache.getUser().then(function(user) {
        $scope.userName = user.displayName;
      });

      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
      var userChangesRef = rootRef.child('/users/1/changes');
      $scope.changes = $firebase(userChangesRef).$asObject();

    });
})();
