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
    .controller('HomeController', function ($scope, $rootScope, fsCurrentUserCache, $firebase, $window) {

      $scope.filterType = 'tree';
      $scope.requestedCount = 0;
      $scope.myChangesCount = 0;
      $scope.personUrl = 'https://sandbox.familysearch.org/tree/#view=ancestor&person=';
  
      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
      var globalChangesRef = rootRef.child('/changes');
      $scope.changes = $firebase(globalChangesRef).$asArray();

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userDisplayName = user.displayName;
        $scope.agentId = user.treeUserId;

        $scope.userChanges = $firebase(rootRef.child('/agents/' +$scope.agentId+ '/changes')).$asObject();
        var userApprovalsRef = rootRef.child('/agents/' +$scope.agentId+ '/approvals');
        $scope.userApprovals = $firebase(userApprovalsRef).$asObject();
      }); 

      $scope.changes.$watch(function() {

        $scope.userChangeCount = 0;
        $scope.requestedCount = 0;
        $scope.myChangesCount = 0;

        for (var i = 0, len = $scope.changes.length; i < len; i++) {
          if ($scope.changes[i].requested === true) {
            $scope.requestedCount++;
          }

          if ($scope.changes[i].agentId === $scope.agentId) {
            $scope.myChangesCount++;
          }

          if ($scope.changes.$keyAt(i) in $scope.userChanges) {
            $scope.userChangeCount++;
          }
        }
      });

      $scope.filterType = 'tree';

      $scope.setFilter = function(filterType) {
        $scope.filterType = filterType;
      };

      $scope.filterFunction = function(change) {

        if ($scope.filterType === 'mine') {
          if (change.agentId === $scope.agentId) {
            return true;
          }
        }
        else if ($scope.filterType === 'requested') {
          if (change.requested === true) {
            return true;
          }
        }
        else if ($scope.userChanges) { // tree
          if (change.id in $scope.userChanges) {
            return true;
          }
        }

        return false;
      };
      
      $scope.isApproved = function(change) {
        if (change.id in $scope.userApprovals) {
          return true;
        }
        
        return false;
      };

      $scope.approvalsCount = function(change) {
        if (change.approvals) {
          return Object.keys(change.approvals).length;
        }

        return 0;
      };

      $scope.approve = function(changeId, approveState) {

        var approvalsRef = rootRef.child('/changes/' + changeId + '/approvals/' + $scope.agentId);
        var fbApprovalsRef = $firebase(approvalsRef);

        var userApprovalsRef = rootRef.child('/agents/' +$scope.agentId+ '/approvals/' + changeId);
        var fbUserApprovalsRef = $firebase(userApprovalsRef);

        if (approveState === true) {
          console.log('approved change ' + changeId);

          fbApprovalsRef.$set(true);
          fbUserApprovalsRef.$set(true);
        }
        else {
          console.log('disapproved change ' + changeId);

          fbApprovalsRef.$remove();
          fbUserApprovalsRef.$remove();
        }
      };

      $scope.addComment = function(change) {

        console.log('comment text = ' + change.commentText);

        if (change.commentText && change.commentText.length > 0) {

          var commentsRef = rootRef.child('/changes/' + change.id + '/comments');
          var fbCommentsRef = $firebase(commentsRef).$asArray();

          var userName = $scope.userDisplayName;

          var commentObj = {
            user: 1,
            by: userName,
            text: change.commentText,
            timestamp: 0 
          };

          fbCommentsRef.$add(commentObj);
          change.commentText = '';
        }
      };

      $scope.isRequested = function(change) {
          var changeRef = $firebase(rootRef.child('/changes/' + change.id)).$asObject();
          if (changeRef.requested === true) {
            return true;
          }

          return false;
      };

      $scope.requestReview = function(change, requestState) {
          var changeRef = $firebase(rootRef.child('/changes/' + change.id));

          if (requestState === true) {
            changeRef.$update({requested: true});
          }
          else {
            changeRef.$update({requested: false});
          }
      };

    });
})();
