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
    .controller('UserController', function ($scope, $stateParams, user, ftrFeedLists, ftrChangeUtils, $sce, 
      ftrCheckForChanges, ftrFindPersons, ftrAgentUtils) {

      $scope.user = user;
      $scope.userId = user.treeUserId;
      $scope.userDisplayName = ftrAgentUtils.getAgentName(user);

      $scope.loadMore = function() {
        ftrFeedLists.loadSubjectOrUserList(20);
      };

      $scope.renderHtml = function(html) {
        return $sce.trustAsHtml(html);
      };

      $scope.changes = ftrFeedLists.getUserList($stateParams.userId);
      $scope.loadMore();

      $scope.approve = function(change, approveState) {
        ftrChangeUtils.approve($scope.userId, change.id, approveState);
      };

      $scope.addComment = function(change) {
        ftrChangeUtils.addComment($scope.userId, $scope.userDisplayName, change.id, change.commentText);
        change.commentText = '';
      };

      $scope.addReviewer = function(change, reviewer) {
        ftrChangeUtils.addReviewer($scope.userId, change, reviewer);
        change.reviewerText = '';
      };

      $scope.checkForChanges = function() {
        ftrCheckForChanges.getChangedPersonIds($scope.userId).then(function(personIds) {
          console.log('change count = ' + personIds.length);
          angular.forEach(personIds, function(id) {
            console.log('updating person = ' + id);
            ftrFindPersons.updatePerson($scope.userId, id);
          });
        });
      };  
    });
})();
