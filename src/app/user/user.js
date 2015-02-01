(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('user', {
        url: '/user/:userId',
        controller: 'UserController',
        templateUrl: 'user/user.tpl.html',
        data: { pageTitle: 'User' },
          resolve: {
          user: ['$stateParams','ftrAgentsCache', function($stateParams, ftrAgentsCache) {
            return ftrAgentsCache.getAgent($stateParams.userId).then(function (u) {
              return u;
            });
          }]
        }
      });
    })
    .controller('UserController', function ($scope, user) {

      $scope.user = user;

      $scope.name = user.$getName();
      $scope.accountName = user.$getAccountName();
      $scope.email = user.$getEmail();
    });
})();
