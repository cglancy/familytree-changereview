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
    .controller('HomeController', function ($scope, $rootScope, fsCurrentUserCache, $firebase, $window) {

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        console.log('logged in = ?');
      }); 

      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
      var userChangesRef = rootRef.child('/users/1/changes');
      $scope.changes = $firebase(userChangesRef).$asArray();

    });
})();
