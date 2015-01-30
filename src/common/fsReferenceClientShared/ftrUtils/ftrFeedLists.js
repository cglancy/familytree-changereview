(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
  .factory('ftrFeedLists', function (_, $q, $interval, fsApi, fsCurrentUserCache, ftrPersonsCache, ftrPersonChangesCache, $window, $firebase, FIREBASE_URL) {

    var rootRef = new $window.Firebase(FIREBASE_URL);
    var userId;
    var userChanges;

    var itemsCache = {};
    var allChangesList = [];
    var unapprovedChangesList = [];
    var approvedChangesList = [];
    var reviewChangesList = [];
    var myChangesList = [];

    var countTotals = {
      all: 0,
      approved: 0,
      unapproved: 0,
      reviewing: 0,
      mine: 0
    };

    fsCurrentUserCache.getUser().then(function(user) {
      userId = user.treeUserId;
      userChanges = $firebase(rootRef.child('/users/' + userId + '/changes').orderByChild('updated')).$asArray();
      userChanges.$loaded().then(function() {

        updateCounts();
        buildLists();

        userChanges.$watch(function(event) {
          
          if (event.event === 'child_changed') {
            console.log('updating ' + event.key);
            _updateItem(event.key);
          }
          else if (event.event === 'child_added') {
            console.log('adding ' + event.key);
            // this is causing data to be out of date with firebase
            //addItem(event.key);
          }
          else if (event.event === 'child_removed') {
            console.log('deleting ' + event.key);
            delete itemsCache[event.key];
            delayedUpdate();
          }
          else if (event.event === 'child_moved') {
            console.log('child_moved!');
          }
        });
      });
    });

    function _updateItem(changeId) {
      if (changeId in itemsCache) {
        getItem(userChanges.$getRecord(changeId)).then(function(newItem) {
          var oldItem = itemsCache[changeId];
          _.assign(oldItem, newItem);
          delayedUpdate();
        });
      }
    }

    // function addItem(changeId) {
    //   getItem(userChanges.$getRecord(changeId)).then(function(newItem) {
    //     itemsCache[changeId] = newItem;
    //     delayedUpdate();
    //   });
    // }

    var timer;

    function doUpdate() {
      $interval.cancel(timer);
      timer = undefined;
      console.log('delayed update');
      updateListsAndCounts();    
    }

    function delayedUpdate() {
      if (angular.isDefined(timer)) {
        $interval.cancel(timer);
        timer = $interval(doUpdate, 500);
      }
      else {
       timer = $interval(doUpdate, 500);
      }
    }

    function updateCounts() {

      countTotals.all = userChanges.length;
      countTotals.approved = 0;
      countTotals.unapproved = userChanges.length;      
      countTotals.reviewing = 0;
      countTotals.mine = 0;

      angular.forEach(userChanges, function(userChange) {
        if (userChange.approved) {
          countTotals.approved++;
          countTotals.unapproved--;
        }

        if (userChange.reviewing) {
          countTotals.reviewing++;
        }

        if (userChange.mine) {
          countTotals.mine++;
        }
      });
    }

    function clearList(list) {
      while (list.length > 0) {
        list.pop();
      }      
    }

    function updateListsAndCounts() {

      console.log('updateListsAndCounts');

      clearList(allChangesList);
      clearList(unapprovedChangesList);
      clearList(approvedChangesList);
      clearList(reviewChangesList);
      clearList(myChangesList);

      angular.forEach(itemsCache, function(item) {

        var userChange = userChanges.$getRecord(item.id);

        allChangesList.push(item);

        if (userChange.approved) {
          approvedChangesList.push(item);
        }
        else {
          unapprovedChangesList.push(item);
        }

        if (userChange.reviewing) {
          reviewChangesList.push(item);
        }

        if (userChange.mine) {
          myChangesList.push(item);
        }        
      });

      updateCounts();
    }

    function buildLists() {
      angular.forEach(userChanges, function(userChange) {
        getItem(userChange).then(function(viewItem) {

          itemsCache[viewItem.id] = viewItem;

          allChangesList.push(viewItem);

          if (viewItem.approved) {
            approvedChangesList.push(viewItem);
          }
          else {
            unapprovedChangesList.push(viewItem);
          }

          if (viewItem.reviewing) {
            reviewChangesList.push(viewItem);
          }

          if (viewItem.mine) {
            myChangesList.push(viewItem);
          } 
        });
      });       
    }

    function getItem(userChange) {
      var deferred = $q.defer();

      var changeId = userChange.$id;
      var globalChangeRef = rootRef.child('/changes/' + changeId);
      globalChangeRef.once('value', function(snapshot) {
        var globalChange = snapshot.val();
        if (globalChange && globalChange.subjectType === 'person') {
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

              var approvalCount = 0;
              angular.forEach(globalChange.approvals, function() {
                approvalCount++;
              });

              var viewItem = {
                id: change.id,
                order: -userChange.updated,
                title: change.title,
                subjectDisplay: subjectDisplay,
                agentName: agentName,
                agentId: agentId,
                updatedDate: updatedDate,
                reason: reason,
                approved: userChange.approved,
                approvalCount: approvalCount,
                reviewing: userChange.reviewing,
                mine: userChange.mine,
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

              deferred.resolve(viewItem);
            });
          });
        }
      });

      return deferred.promise;
    }

    function _approveAll() {
      var promises = [];   
        
      angular.forEach(userChanges, function(userChange) {

        var changeId = userChange.$id;

        if (!userChange.approved) {
          var approvalsUserRef = $firebase(rootRef.child('/changes/' + changeId + '/approvals/' + userId));
          promises.push(approvalsUserRef.$set(true));          
          var userChangeRef = $firebase(rootRef.child('/users/' + userId + '/changes/' + changeId));
          promises.push(userChangeRef.$update({approved: true}));
        }
      });

      return $q.all(promises);
    }

    function _touchOtherWatchers(changeId) {
      var changeUsersRef = rootRef.child('/changes/' + changeId + '/users');
      changeUsersRef.once('value', function(snapshot) {
        var users = snapshot.val();
        if (users) {
          angular.forEach(users, function(user, id) {
            if (id !== userId) {
              var userChangeRef = rootRef.child('/users/' + id + '/changes/' + changeId);
              userChangeRef.update({updated: Firebase.ServerValue.TIMESTAMP});
            }
          });
        }
      });
    }

    return {

      getCountTotals: function() {
        return countTotals;
      },
      getAllChangesList: function() {
        return allChangesList;
      },
      getApprovedChangesList: function() {
        return approvedChangesList;
      },
      getUnapprovedChangesList: function() {
        return unapprovedChangesList;
      },
      getReviewChangesList: function() {
        return reviewChangesList;
      },
      getMyChangesList: function() {
        return myChangesList;
      },
      approveAll: function() {
        _approveAll();
      },
      updateItem: function(changeId) {
        _updateItem(changeId);
      },
      touchOtherWatchers: function(changeId) {
        _touchOtherWatchers(changeId);
      }
    };
  });
})();