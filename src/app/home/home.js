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
    .controller('HomeController', function ($scope, $rootScope, fsCurrentUserCache, $firebase, $window, ftcrCommentModal) {

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userName = user.displayName;
        $scope.agentId = user.treeUserId;
      }); 

      $scope.filterType = 'tree';
      $scope.requestedCount = 0;
      $scope.myChangesCount = 0;

      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
      var globalChangesRef = rootRef.child('/changes');
      $scope.changes = $firebase(globalChangesRef).$asArray();

      $scope.userChanges = $firebase(rootRef.child('/users/1/changes')).$asObject();

      var userApprovalsRef = rootRef.child('/users/1/approvals');
      $scope.userApprovals = $firebase(userApprovalsRef).$asObject();

      $scope.changes.$watch(function() {

        $scope.requestedCount = 0;
        $scope.myChangesCount = 0;

        for (var i = 0, len = $scope.changes.length; i < len; i++) {
          if ($scope.changes[i].requested === true) {
            $scope.requestedCount++;
          }

          if ($scope.changes[i].agentId === $scope.agentId) {
            $scope.myChangesCount++;
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
        else { // treee
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

        var approvalsRef = rootRef.child('/changes/' + changeId + '/approvals/1');
        var fbApprovalsRef = $firebase(approvalsRef);

        var userApprovalsRef = rootRef.child('/users/1/approvals/' + changeId);
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
        ftcrCommentModal.open().then(function(text) {
          console.log('comment text = ' + text);

          var commentsRef = rootRef.child('/changes/' + change.id + '/comments');
          var fbCommentsRef = $firebase(commentsRef).$asArray();

          var userName = $scope.userName;

          var commentObj = {
            user: 1,
            by: userName,
            text: text,
            timestamp: 0 
          };

          fbCommentsRef.$add(commentObj);
        });
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
