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
    .controller('HomeController', function ($scope, $rootScope, fsCurrentUserCache, 
      ftrFindPersons, ftrPollingForChanges, ftrFeedLists, ftrChangeUtils, ftrReviewerList) {

      fsCurrentUserCache.getUser().then(function(user) {
        $scope.userDisplayName = user.displayName;
        $scope.userId = user.treeUserId;
      });

      $scope.countTotals = ftrFeedLists.getCountTotals();
      $scope.currentListType = ftrFeedLists.getCurrentListType();
      $scope.changes = ftrFeedLists.getCurrentList();

      $scope.setFilter = function(filterType) {
        ftrFeedLists.setCurrentListType(filterType);
        $scope.currentListType = ftrFeedLists.getCurrentListType();
        $scope.changes = ftrFeedLists.getCurrentList();
        $scope.loadMore();
      };
      
      $scope.loadMore = function() {
        console.log('loadMore');
        ftrFeedLists.loadList($scope.filterType, 5);
      };

      $scope.setFilter($scope.filterType);

      ftrReviewerList.getList().then(function(list) {
        $scope.reviewerList = list;
      });

      $scope.approve = function(change, approveState) {
        ftrChangeUtils.approve($scope.userId, change.id, approveState);
      };

      $scope.approveAll = function() {
        ftrFeedLists.approveAll();
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
        var personIds = ftrPollingForChanges.getChangedPersonIds();
        fsCurrentUserCache.getUser().then(function(user) {
          angular.forEach(personIds, function(id) {
            console.log('updating person = ' + id);
            ftrFindPersons.updatePerson(user.treeUserId, id);
          });
        });
      };

    });
})();
