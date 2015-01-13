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
          agent: ['$stateParams','fsApi',function($stateParams, fsApi) {
            return fsApi.getAgent($stateParams.userId).then(function (response) {
              return response.getAgent();
            });
          }]
        }
      });
    })
    .controller('UserController', function ($scope, agent, fsCurrentUserCache) {
          $scope.agentId = agent.id;
          $scope.agentName = agent.$getName();

          fsCurrentUserCache.getUser().then(function(user) {
            $scope.userName = user.displayName;
          });
    });
})();
