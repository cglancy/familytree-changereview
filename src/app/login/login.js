(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('login', {
        url: '/',
        controller: 'LoginController',
        templateUrl: 'login/login.tpl.html',
        data: { pageTitle: 'Login' }
      });
    })
    .controller('LoginController', function ($scope, $state, $rootScope, fsApi, fsCurrentUserCache) {
      $scope.signIn = function() {
        fsApi.getAccessToken().then(function() {
          $rootScope.$emit('newSession');
          $state.go('home');

          fsCurrentUserCache.getUser().then(function(user) {
            $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
          });        
        });
      };

    });
})();
