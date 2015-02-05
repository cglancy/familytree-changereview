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

      $scope.filterType = 'all';
      $scope.changes = [];

      $scope.countTotals = ftrFeedLists.getCountTotals();
      $scope.allChangesList = ftrFeedLists.getAllChangesList();
      $scope.unapprovedChangesList = ftrFeedLists.getUnapprovedChangesList();
      $scope.reviewChangesList = ftrFeedLists.getReviewChangesList();
      $scope.myChangesList = ftrFeedLists.getMyChangesList();

      $scope.changes = $scope.allChangesList;

      $scope.reviewerList2 = ftrReviewerList.getList();
      $scope.reviewerList = [{userId:0, name:'User1'}, {userId:1, name:'User2'}, {userId:2, name:'User3'}];

      $scope.setFilter = function(filterType) {
        $scope.filterType = filterType;

        switch(filterType) {
          case 'all':
            $scope.changes = $scope.allChangesList;
            break;
          case 'unapproved':
            $scope.changes = $scope.unapprovedChangesList;
            break;
          case 'review':
            $scope.changes = $scope.reviewChangesList;
            break;
          case 'mine':
            $scope.changes = $scope.myChangesList;
            break;
        }
      };

      $scope.loadMore = function() {
        console.log('loadMore');
        ftrFeedLists.loadList($scope.filterType, 5);
      };

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

      $scope.onReviewerSelect = function (change, item) {
        console.log('onReviewerSelect', item);

        if (item) {
          change.reviewers.push(item);
        }

        change.reviewerText = '';
      };

      $scope.addReviewer = function(change) {
        if (change.reviewerText && change.reviewerText.length) {
          change.reviewers.push(change.reviewerText);
        }

        change.reviewerText = '';
      };

      $scope.requestReview = function(change, requestState) {
        ftrChangeUtils.requestReview($scope.userId, change.id, requestState);
      };

      $scope.pendingChanges = false;

      ftrPollingForChanges.startPolling();

      $rootScope.$on('personChanged', function() {
        console.log('personChanged');
        $scope.pendingChanges = true;
      });

      $scope.getPendingChanges = function() {
        $scope.pendingChanges = false;
        var personIds = ftrPollingForChanges.getChangedPersonIds();
        fsCurrentUserCache.getUser().then(function(user) {
          angular.forEach(personIds, function(id) {
            console.log('updating person = ' + id);
            ftrFindPersons.updatePerson(user.treeUserId, id);
          });
        });
      };

      $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        ftrPollingForChanges.stopPolling();
      });

    });
})();
