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

      $scope.filterType = 'review';
      $scope.changes = [];

      $scope.countTotals = ftrFeedLists.getCountTotals();
      $scope.allChangesList = ftrFeedLists.getAllChangesList();
      $scope.reviewChangesList = ftrFeedLists.getReviewChangesList();
      $scope.myChangesList = ftrFeedLists.getMyChangesList();

      $scope.setFilter = function(filterType) {
        $scope.filterType = filterType;

        switch(filterType) {
          case 'review':
            $scope.changes = $scope.reviewChangesList;
            break;
          case 'mine':
            $scope.changes = $scope.myChangesList;
            break;
          case 'all':
            $scope.changes = $scope.allChangesList;
            break;
        }

        $scope.loadMore();
      };
      
      $scope.loadMore = function() {
        console.log('loadMore');
        ftrFeedLists.loadList($scope.filterType, 5);
      };

      $scope.setFilter($scope.filterType);

      ftrReviewerList.getList().then(function(list) {
        $scope.reviewerList0 = list;
      });

      $scope.reviewerList = [
        {userId:0, name:'Erv Bushke', email: 'null@example.com'}, 
        {userId:1, name:'Elmer Fudd', email: 'null@example.com'},
        {userId:2, name:'Edwin Moses', email: 'null@example.com'}
      ];

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
