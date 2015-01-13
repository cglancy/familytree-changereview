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
    .controller('LoginController', function ($scope, $state, $rootScope, fsApi) {
      $scope.signIn = function() {
        fsApi.getAccessToken().then(function() {
          $rootScope.$emit('newSession');
          $state.go('home');
        });
      };

    });
})();
