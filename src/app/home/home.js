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
      $scope.changeList = [];
      $scope.changes = [];
      $scope.scrollDisabled = true;
  
      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/sandbox');

      function updateChange(changeId) {

        // var changeRef = rootRef.child('changes').child(changeId);
        // changeRef.on('value', function(c) {
        //   $timeout(function() {
        //     var change = c.val();
        //     $scope.changes.push(change);

        //     if (change.requested === true) {
        //       $scope.requestedCount++;
        //     }

        //     if (change.agentId === $scope.agentId) {
        //       $scope.myChangesCount++;
        //     }
        //   });
        // });


        var change = $firebase(rootRef.child('changes').child(changeId)).$asObject();
        change.$loaded().then(function() {

          $scope.changeList.push(change);

          if (change.requested === true) {
            $scope.requestedCount++;
          }

          if (change.agentId === $scope.agentId) {
            $scope.myChangesCount++;
          }

          if ($scope.changeList.length > 10) {
            $scope.scrollDisabled = false;
          }
        });
      }

      function updateChanges() {

        console.log('updateChanges(), scrollDisabled = ' + $scope.scrollDisabled);

        $scope.scrollDisabled = true;
        $scope.changeList = [];

        $scope.requestedCount = 0;
        $scope.myChangesCount = 0;

        for (var i = 0, len = $scope.userChanges.length; i < len; i++) {
          var changeId = $scope.userChanges.$keyAt(i);
          updateChange(changeId);
        }
     }

      $scope.loadMore = function() {
        var length = $scope.changes.length;
        console.log('loadMore, length = ' + length);
        for (var i = 0; i < 10; i++) {
          var index = length + i;
          if (index < $scope.changeList.length) {
            $scope.changes.push($scope.changeList[index]);
          }
        }
      };

      // function initialLoad() {
      //   return $q(function(resolve) {
      //     resolve('done');
      //   });
      // }

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userDisplayName = user.displayName;
        $scope.agentId = user.treeUserId;

        $scope.userChanges = $firebase(rootRef.child('/agents/' +$scope.agentId+ '/changes')).$asArray();
        var userApprovalsRef = rootRef.child('/agents/' +$scope.agentId+ '/approvals');
        $scope.userApprovals = $firebase(userApprovalsRef).$asObject();

        $scope.userChanges.$loaded().then(function() {
          $scope.userChangeCount = $scope.userChanges.length;
          updateChanges();
          // initialLoad().then(function() {
          //   $scope.scrollDisabled = false;
          // });
        });
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
        else if ($scope.filterType === 'tree') {
          return true;
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
