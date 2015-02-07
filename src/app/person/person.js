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
     fsCurrentUserCache, FS_URL, $sce, ftrCheckForChanges, ftrFindPersons) {

      $scope.person = person;
      $scope.personUrl = FS_URL + '/tree/#view=ancestor&person=' + $stateParams.personId;

      fsCurrentUserCache.getUser().then(function(user) {
        $scope.userDisplayName = user.displayName;
        $scope.userId = user.treeUserId;
      });

      $scope.loadMore = function() {
        ftrFeedLists.loadSubjectOrUserList(20);
      };

      $scope.renderHtml = function(html) {
        return $sce.trustAsHtml(html);
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
