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

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userName = user.displayName;
      }); 

      var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
      var globalChangesRef = rootRef.child('/changes');
      $scope.changes = $firebase(globalChangesRef).$asArray();

      $scope.userChanges = $firebase(rootRef.child('/users/1/changes')).$asObject();

      var userApprovalsRef = rootRef.child('/users/1/approvals');
      $scope.userApprovals = $firebase(userApprovalsRef).$asObject();

      // function addToChangesArray(ref) {
      //   // ref.once('value', function(snap) {
      //   //   $timeout(function() {
      //   //     $scope.changes.push(snap.val());
      //   //   });
      //   // });      
      //     ref.$on('value', function(change) {
      //       console.log('change = ' + change.id);
      //     });
      // }

      // userChanges.$watch(function() {

      //   $scope.changes = [];

      //   for (var i = 0, len = userChanges.length; i < len; i++) {
      //     var changeId = userChanges.$keyAt(i);
      //     //addToChangesArray(globalChangesRef.child('/' + changeId));
      //     addToChangesArray($globalChanges.$child('/' + changeId));
      //   }
      // });

      $scope.filterFunction = function(change) {
        if (change.id in $scope.userChanges) {
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

      $scope.comment = function(changeId, text) {
        console.log('comment for change ' + changeId + ': ' + text);
       
        var commentsRef = rootRef.child('/changes/' + changeId + '/comments');
        var fbCommentsRef = $firebase(commentsRef);
        fbCommentsRef.$add({ user: 1, by: $scope.userName, text: text });
      };

    });
})();
