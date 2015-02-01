(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
  .factory('ftrFeedLists', function (_, $q, $interval, fsApi, fsCurrentUserCache, ftrPersonsCache, ftrPersonChangesCache, ftrLocation, fsChangeUtils, $window, $firebase, FIREBASE_URL) {

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
      userChanges = $firebase(rootRef.child('/users/' + userId + '/changes').orderByPriority()).$asArray();
      userChanges.$loaded().then(function() {

        updateCounts();
        _loadList('all', 10);

        userChanges.$watch(function(event) {
          
          if (event.event === 'child_changed') {
            console.log('updating ' + event.key);
            _updateItem(event.key);
          }
          else if (event.event === 'child_added') {
            console.log('adding ' + event.key);
            addItem(event.key);
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
        loadItem(userChanges.$getRecord(changeId)).then(function(newItem) {
          var oldItem = itemsCache[changeId];
          _.assign(oldItem, newItem);
          delayedUpdate();
        });
      }
    }

    function addItem(changeId) {
      loadItem(userChanges.$getRecord(changeId)).then(function(newItem) {
        itemsCache[changeId] = newItem;
        delayedUpdate();
      });
    }

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

    // function getItem(userChange) {
    //   var deferred = $q.defer();
    //   if (userChange.$id in itemsCache) {
    //     deferred.resolve(itemsCache[userChange.$id]);
    //   }
    //   else {
    //     deferred.resolve(loadItem(userChange));
    //   }

    //   return deferred.promise;
    // }

    function loadItem(userChange) {
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

              var updatedDate = new Date(change.updated).toLocaleDateString();
              var subjectDisplay = person.display.name;
              var agentName = change.$getAgentName();

              var agentUrl = change.$getAgentUrl();
              var n = agentUrl.lastIndexOf('/');
              var agentId = agentUrl.substring(n + 1);

              var typeStr = fsChangeUtils.getType(change);
              n = typeStr.lastIndexOf('/');
              var type = typeStr.substring(n + 1);

              var subjectUrl = ftrLocation.getPersonUrl(person.id);
              var userUrl = ftrLocation.getUserUrl(agentId);

              var approvalCount = 0;
              angular.forEach(globalChange.approvals, function() {
                approvalCount++;
              });

              var viewItem = {
                id: change.id,
                order: -userChange.updated,
                title: change.title,
                type: type,
                subjectDisplay: subjectDisplay,
                subjectUrl: subjectUrl,
                agentName: agentName,
                agentId: agentId,
                agentUrl: userUrl,
                updatedDate: updatedDate,
                reason: reason,
                approved: userChange.approved,
                approvalCount: approvalCount,
                reviewing: userChange.reviewing,
                mine: userChange.mine,
                commentCount: 0,
                comments: []
              };

              angular.forEach(globalChange.comments, function(comment) {

                viewItem.commentCount++;

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
              // TODO: need to set priority!!
            }
          });
        }
      });
    }

    function loadListItem(userChange) {
      var loadingItem = {
        id: userChange.$id,
        loading: true
      };

      itemsCache[userChange.$id] = loadingItem;

      loadItem(userChange).then(function(item) {

        itemsCache[item.id] = item;

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
    }

    function _loadList(list, count) {

      console.log('loading ' + count + ' items for the list = ' + list);

      var loaded = 0;

      angular.forEach(userChanges, function(userChange) {

        if (!(userChange.$id in itemsCache) && loaded < count) {

          if (!userChange.approved && list === 'unapproved') {
            loaded++;
            loadListItem(userChange);
          }
          else if (userChange.reviewing && list === 'review') {
            loaded++;
            loadListItem(userChange);
          }
          else if(userChange.mine && list === 'mine') {
            loaded++;
            loadListItem(userChange);
          }
          else {
            loaded++;
            loadListItem(userChange);         
          }
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
      loadList: function(list, count) {
        _loadList(list, count);
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