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
    .controller('UserController', function ($scope, $stateParams, user, ftrFeedLists, ftrChangeUtils) {

      $scope.user = user;

      $scope.loadMore = function() {
        ftrFeedLists.loadSubjectOrUserList(20);
      };

      console.log('user id = ' + $stateParams.userId);
      $scope.changes = ftrFeedLists.getUserList($stateParams.userId);
      $scope.loadMore();

      $scope.approve = function(change, approveState) {
        ftrChangeUtils.approve($scope.userId, change.id, approveState);
      };

      $scope.addComment = function(change) {
        ftrChangeUtils.addComment($scope.userId, $scope.userDisplayName, change.id, change.commentText);
        change.commentText = '';
      };

      $scope.requestReview = function(change, requestState) {
        ftrChangeUtils.requestReview($scope.userId, change.id, requestState);
      };  
    });
})();
