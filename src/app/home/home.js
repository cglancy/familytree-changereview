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
      fsChangeUtils, ftrPersonsCache) {

      $scope.filterType = 'tree';
      $scope.requestedCount = 0;
      $scope.unapprovedCount = 0;
      $scope.myChangesCount = 0;
      $scope.personUrl = FS_URL + '/tree/#view=ancestor&person=';
      $scope.changes = [];
  
      var rootRef = new $window.Firebase(FIREBASE_URL);

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userDisplayName = user.displayName;
        $scope.agentId = user.treeUserId;

        $scope.userChanges = $firebase(rootRef.child('/users/' +$scope.agentId+ '/changes').orderByPriority()).$asArray();
        $scope.userApprovals = $firebase(rootRef.child('/users/' +$scope.agentId+ '/approvals')).$asArray();
        $scope.userReviewing = $firebase(rootRef.child('/users/' +$scope.agentId+ '/reviewing')).$asArray();

        $scope.userChanges.$loaded().then(function() {
          updateCounts();
          buildViewList();

          $scope.userChanges.$watch(function() {
            updateCounts();
          });
        });

        $scope.userApprovals.$loaded().then(function() {
          updateCounts();
          $scope.userApprovals.$watch(function() {
            updateCounts();
          });
        });

        $scope.userReviewing.$loaded().then(function() {
          updateCounts();
          $scope.userReviewing.$watch(function() {
            updateCounts();
          });
        });
      }); 

      function updateCounts() {
        $scope.userChangeCount = $scope.userChanges.length;
        $scope.unapprovedCount = $scope.userChanges.length - $scope.userApprovals.length;
        $scope.requestedCount = $scope.userReviewing.length;

        // $scope.myChangesCount = 0;
        // angular.forEach($scope.changes, function(change) {
        //   if (change.agentId === $scope.agentId) {
        //     $scope.myChangesCount++;
        //   }
        // });
      }

      function buildViewList() {
        for (var i = 0, len = $scope.userChanges.length; i < len; i++) {
          updateViewItem(i, $scope.agentId, $scope.userChanges.$keyAt(i));
        }         
      }

      function updateViewItem(index, userId, changeId) {
        var globalChangeObj = $firebase(rootRef.child('/changes/' + changeId)).$asObject();
        globalChangeObj.$loaded().then(function(globalChange) {
          if (globalChange.subjectType === 'person') {
            ftrPersonsCache.getPerson(globalChange.subjectId).then(function(person) {
              ftrPersonChangesCache.getPersonChange(person.id, changeId).then(function(change) {

                var reason = change.$getChangeReason();
                if (!reason) {
                  reason = '';
                }
                //var type = fsChangeUtils.getType(change);
                var updatedDate = new Date(change.updated).toLocaleDateString();
                var subjectDisplay = person.display.name;
                var agentName = change.$getAgentName();

                var agentUrl = change.$getAgentUrl();
                var n = agentUrl.lastIndexOf('/');
                var agentId = agentUrl.substring(n + 1);

                var approved = false;
                var approvalCount = 0;
                angular.forEach(globalChange.approvals, function(value, key) {
                  approvalCount++;
                  if (key === userId) {
                    approved = true;
                  }
                });

                var reviewing = false;
                angular.forEach(globalChange.reviewers, function(value, key) {
                  if (key === userId) {
                    reviewing = true;
                  }
                });

                var viewItem = {
                  id: change.id,
                  index: index,
                  title: change.title,
                  subjectDisplay: subjectDisplay,
                  agentName: agentName,
                  agentId: agentId,
                  updatedDate: updatedDate,
                  reason: reason,
                  approved: approved,
                  approvalCount: approvalCount,
                  reviewing: reviewing,
                  comments: []
                };

                angular.forEach(globalChange.comments, function(comment) {

                  var commentObj = {
                    userId: comment.userId,
                    by: comment.by,
                    text: comment.text,
                    t: comment.t
                  };

                  viewItem.comments.push(commentObj);
                });

                $scope.changes.push(viewItem);

                globalChangeObj.$destroy();        
              });
            });
          }
        });
      }

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
        else if ($scope.filterType === 'unapproved') {
          if (!change.approved) {
            return true;
          }
        }
        else if ($scope.filterType === 'tree') {
          return true;
        }

        return false;
      };

      $scope.approve = function(change, approveState) {

        var approvalsRef = rootRef.child('/changes/' + change.id + '/approvals/' + $scope.agentId);
        var fbApprovalsRef = $firebase(approvalsRef);

        var userApprovalsRef = rootRef.child('/users/' + $scope.agentId + '/approvals/' + change.id);
        var fbUserApprovalsRef = $firebase(userApprovalsRef);

        if (approveState === true) {
          console.log('approved change ' + change.id);

          change.approved = true;
          change.approvalCount++;
          fbApprovalsRef.$set(true);
          fbUserApprovalsRef.$set(true);
        }
        else {
          console.log('disapproved change ' + change.id);

          change.approved = false;
          change.approvalCount--;
          fbApprovalsRef.$remove();
          fbUserApprovalsRef.$remove();
        }
      };

      $scope.addComment = function(change) {

        console.log('adding comment \"' + change.commentText + '\" to change ' + change.id);

        if (change.commentText && change.commentText.length > 0) {

          var commentsRef = rootRef.child('/changes/' + change.id + '/comments');
          var fbCommentsRef = $firebase(commentsRef);

          var userName = $scope.userDisplayName;

          var commentObj = {
            userId: $scope.agentId,
            by: userName,
            text: change.commentText,
            t: $window.Firebase.ServerValue.TIMESTAMP
          };

          fbCommentsRef.$push(commentObj);

          if ('comments' in change) {
            change.comments.push(commentObj);  
          }          

          change.commentText = '';
        }
      };

      $scope.requestReview = function(change, requestState) {

          var changeId = $scope.userChanges.$keyAt(change);
          var changeRef = $firebase(rootRef.child('/changes/' + changeId));
          var userChangeRef = $firebase(rootRef.child('/users/' + $scope.agentId + '/changes/' + changeId));

          if (requestState === true) {
            changeRef.$update({requested: true});
            userChangeRef.$update({requested: true});
          }
          else {
            changeRef.$update({requested: false});
            userChangeRef.$update({requested: false});
          }
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
