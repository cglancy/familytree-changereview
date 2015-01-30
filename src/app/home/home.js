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
    .controller('HomeController', function (_, $scope, $rootScope, fsCurrentUserCache, $firebase, $window, 
      $q, FIREBASE_URL, fsApi, $interval, ftrFindPersons, ftrPollingForChanges, FS_URL, ftrPersonChangesCache,
      fsChangeUtils, ftrPersonsCache, ftrFeedLists) {

      var rootRef = new $window.Firebase(FIREBASE_URL);

      fsCurrentUserCache.getUser().then(function(user) {
        $scope.userDisplayName = user.displayName;
        $scope.userId = user.treeUserId;
      });

      $scope.filterType = 'all';
      $scope.personUrl = FS_URL + '/tree/#view=ancestor&person=';
      $scope.changes = [];

      $scope.countTotals = ftrFeedLists.getCountTotals();
      $scope.allChangesList = ftrFeedLists.getAllChangesList();
      $scope.unapprovedChangesList = ftrFeedLists.getUnapprovedChangesList();
      $scope.myChangesList = ftrFeedLists.getMyChangesList();

      $scope.changes = $scope.allChangesList;

      $scope.setFilter = function(filterType) {
        $scope.filterType = filterType;

        switch(filterType) {
          case 'all':
            $scope.changes = $scope.allChangesList;
            break;
          case 'unapproved':
            $scope.changes = $scope.unapprovedChangesList;
            break;
          case 'mine':
            $scope.changes = $scope.myChangesList;
            break;
        }
      };

      $scope.approve = function(change, approveState) {

        var approvalsRef = $firebase(rootRef.child('/changes/' + change.id + '/approvals/' + $scope.userId));
        var userChangeRef = $firebase(rootRef.child('/users/' + $scope.userId + '/changes/' + change.id));

        if (approveState === true) {
          console.log('approved change ' + change.id);

          approvalsRef.$set(true);
          userChangeRef.$update({approved: true});
        }
        else {
          console.log('disapproved change ' + change.id);

          approvalsRef.$remove();
          userChangeRef.$update({approved: false});
        }

        ftrFeedLists.touchOtherWatchers(change.id);
      };

      $scope.approveAll = function() {
        ftrFeedLists.approveAll();
      };

      $scope.addComment = function(change) {

        console.log('adding comment \"' + change.commentText + '\" to change ' + change.id);

        if (change.commentText && change.commentText.length > 0) {

          var commentsRef = $firebase(rootRef.child('/changes/' + change.id + '/comments'));

          var commentObj = {
            userId: $scope.userId,
            by: $scope.userDisplayName,
            text: change.commentText,
            t: $window.Firebase.ServerValue.TIMESTAMP
          };

          commentsRef.$push(commentObj);

          ftrFeedLists.updateItem(change.id);         
          ftrFeedLists.touchOtherWatchers(change.id);

          change.commentText = '';
        }
      };

      $scope.requestReview = function(change, requestState) {

        var reviewersRef = $firebase(rootRef.child('/changes/' + change.id + '/reviewers/' + $scope.userId));
        var userChangeRef = $firebase(rootRef.child('/users/' + $scope.userId + '/changes/' + change.id));

        if (requestState === true) {
          reviewersRef.$set(true);
          userChangeRef.$update({reviewing: true});
        }
        else {
          reviewersRef.$remove();
          userChangeRef.$update({reviewing: false});
        }

        ftrFeedLists.touchOtherWatchers(change.id);
      };

      $scope.pendingChanges = false;

      //ftrPollingForChanges.startPolling();

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
