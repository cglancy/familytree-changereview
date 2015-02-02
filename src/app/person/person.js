(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('person', {
        url: '/person/:personId',
        controller: 'PersonController',
        templateUrl: 'person/person.tpl.html',
        data: { pageTitle: 'Person' },
          resolve: {
          person: ['$stateParams','ftrPersonsCache',function($stateParams, ftrPersonsCache) {
            return ftrPersonsCache.getPerson($stateParams.personId).then(function (p) {
              return p;
            });
          }]
        }
      });
    })
    .controller('PersonController', function ($scope, $stateParams, person, ftrFeedLists, ftrChangeUtils,
     fsCurrentUserCache, FS_URL) {

      $scope.person = person;
      $scope.personUrl = FS_URL + '/tree/#view=ancestor&person=' + $stateParams.personId;

      fsCurrentUserCache.getUser().then(function(user) {
        $scope.userDisplayName = user.displayName;
        $scope.userId = user.treeUserId;
      });

      $scope.loadMore = function() {
        ftrFeedLists.loadSubjectOrUserList(20);
      };

      $scope.changes = ftrFeedLists.getSubjectList($stateParams.personId);
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
