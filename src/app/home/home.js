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
    .controller('HomeController', function ($scope, $rootScope, fsCurrentUserCache, $firebase, $window, 
      $q, FIREBASE_URL, fsApi, ftrUserChangesCache, $interval, ftrFindPersons, ftrPollingForChanges, FS_URL) {

      $scope.filterType = 'tree';
      $scope.requestedCount = 0;
      $scope.myChangesCount = 0;
      $scope.personUrl = FS_URL + '/tree/#view=ancestor&person=';
      $scope.changes = [];
      $scope.scrollDisabled = true;
      $scope.nextToLoad = 0;
  
      var rootRef = new $window.Firebase(FIREBASE_URL);

      function loadChange(changeId) {
        var deferred = $q.defer();

        ftrUserChangesCache.getChange(changeId).then(function(change) {
          $scope.changes.push(change);
          deferred.resolve(change);          
        });

        return deferred.promise;
      }

      $scope.loadMore = function() {
        if ($scope.loading) {
          return;
        }

        $scope.loading = true;
        var defer = $q.defer();
        var promises = [];

        console.log('loadMore, nextToLoad = ' + $scope.nextToLoad);

        for (var i = 0; i < 10; i++) {
          var index = $scope.nextToLoad + i;
          if (index < $scope.userChanges.length) {
            var promise = loadChange($scope.userChanges.$keyAt(index));
            promises.push(promise);
          }
        }

        $q.all(promises).then(function() {
          $scope.nextToLoad += 10;
          $scope.loading = false;
        });

        return defer;
      };

      function initialLoad() {
        var defer = $q.defer();
        var promises = [];
        var count = $scope.userChanges.length < 10 ? $scope.userChanges.length : 10;
        for (var i = 0; i < count; i++) {
          var promise = loadChange($scope.userChanges.$keyAt(i));
          promises.push(promise);
        }

        $q.all(promises).then(function() {
          $scope.nextToLoad = 10;
          $scope.scrollDisabled = false;
        });

        return defer;
      }

      fsCurrentUserCache.getUser().then(function(user) {
        $rootScope.loggedInStatus = 'Logged in as ' + user.displayName;
        $scope.userDisplayName = user.displayName;
        $scope.agentId = user.treeUserId;

        $scope.userChanges = $firebase(rootRef.child('/agents/' +$scope.agentId+ '/changes').orderByPriority()).$asArray();
        var userApprovalsRef = rootRef.child('/agents/' +$scope.agentId+ '/approvals');
        $scope.userApprovals = $firebase(userApprovalsRef).$asObject();

        $scope.userChanges.$loaded().then(function() {
          $scope.userChangeCount = $scope.userChanges.length;
          initialLoad();

          $scope.userChanges.$watch(function(event) {
            if (event.event === 'child_added') {

              var index = $scope.userChanges.$indexFor(event.key);
              console.log('inserting change ' + event.key + ' at index ' + index);

              ftrUserChangesCache.getChange(event.key).then(function(change) {
                $scope.changes.splice(index, 0, change);

                if (index <= $scope.nextToLoad) {
                  $scope.nextToLoad++;
                }
              });
            }
          });
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
      
      $scope.isApproved = function(changeId) {
        if (changeId in $scope.userApprovals) {
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

        if (!!changeId) {
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
        }
      };

      $scope.addComment = function(change) {

        console.log('comment text = ' + change.commentText);

        if (change.commentText && change.commentText.length > 0) {

          var commentsRef = rootRef.child('/changes/' + change.id + '/comments');
          var fbCommentsRef = $firebase(commentsRef).$asArray();

          var userName = $scope.userDisplayName;

          var commentObj = {
            userId: $scope.agentId,
            by: userName,
            text: change.commentText,
            t: $window.Firebase.ServerValue.TIMESTAMP
          };

          fbCommentsRef.$add(commentObj);
          // if ('comments' in change) {
          //   change.comments.push(commentObj);            
          // }
          // else {
          //   change['comments'] = [];
          //   change.comments.push(commentObj); 
          // }

          change.commentText = '';
        }
      };

      $scope.isRequested = function(change) {
          if (change.requested === true) {
            return true;
          }

          return false;
      };

      $scope.requestReview = function(change, requestState) {
          var changeRef = $firebase(rootRef.child('/changes/' + change.id));

          if (requestState === true) {
            change.requested = true;
            changeRef.$update({requested: true});
          }
          else {
            change.requested = false;
            changeRef.$update({requested: false});
          }
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
