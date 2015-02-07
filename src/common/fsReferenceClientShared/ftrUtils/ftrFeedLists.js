(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
  .factory('ftrFeedLists', function (_, $q, $interval, fsApi, fsCurrentUserCache, ftrPersonsCache, ftrPersonChangesCache, ftrLocation, fsChangeUtils, $window, $firebase, FIREBASE_URL) {

    var rootRef = new $window.Firebase(FIREBASE_URL);
    var userId;
    var userChanges;
    var subjectIdFilter;
    var userIdFilter;
    var currentListType = 'review';

    var itemsCache = {};
    var allChangesList = [];
    var reviewChangesList = [];
    var myChangesList = [];
    var subjectList = [];
    var userList = [];

    var countTotals = {
      all: 0,
      reviewing: 0,
      mine: 0
    };

    function debugCheckOrder() {
      var lastUpdated;
      var lastPriority;
      angular.forEach(userChanges, function(userChange) {
        var updated = parseInt(userChange.updated, 10);
        if (lastUpdated && lastUpdated < updated) {
          console.log('Out of order at id = ', userChange.$id);
        }
        var priority = userChange.$priority;
        if (lastPriority && lastPriority > priority) {
          console.log('Priority out of order at id = ', userChange.$id);
        }       
        lastUpdated = updated;
        lastPriority = priority;
      });
    }

    fsCurrentUserCache.getUser().then(function(user) {
      userId = user.treeUserId;
      userChanges = $firebase(rootRef.child('/users/' + userId + '/changes').orderByPriority()).$asArray();
      userChanges.$loaded().then(function() {

        debugCheckOrder();

        updateCounts();
        _loadList(currentListType, 10);

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
      console.log('starting addItem for ' + changeId);

      var userChange = userChanges.$getRecord(changeId);
      var loadingItem = {
        id: changeId,
        order: parseInt(-userChange.updated, 10),
        loaded: false
      };

      itemsCache[changeId] = loadingItem;
      delayedUpdate();
      loadLater(changeId);
    }

    var loadTimer;
    var loadList = [];

    function doLoad() {
      $interval.cancel(loadTimer);
      loadTimer = undefined;

      var workingList = loadList;
      loadList = [];

      angular.forEach(workingList, function(changeId) {
        var userChange = userChanges.$getRecord(changeId);

        loadItem(userChange).then(function(newItem) {
          var oldItem = itemsCache[changeId];
          _.assign(oldItem, newItem);
          console.log('loadItem finished for ' + changeId);
        },
        function(error) {
          console.log('loadItem failed for ' + changeId);
          console.log(error);
          loadLater(changeId);
        });
      });
    }

    function loadLater(changeId) {
      if (!(changeId in loadList)) {
        loadList.push(changeId);        
      }

      if (!angular.isDefined(loadTimer)) {
       loadTimer = $interval(doLoad, 1000);
      }
    }

    var updateTimer;

    function doUpdate() {
      $interval.cancel(updateTimer);
      updateTimer = undefined;
      console.log('delayed update');
      updateListsAndCounts();    
    }

    function delayedUpdate() {
      if (angular.isDefined(updateTimer)) {
        $interval.cancel(updateTimer);
        updateTimer = $interval(doUpdate, 500);
      }
      else {
       updateTimer = $interval(doUpdate, 500);
      }
    }

    function updateCounts() {

      if (!userChanges) {
        return;
      }

      countTotals.all = userChanges.length;
      countTotals.reviewing = 0;
      countTotals.mine = 0;

      angular.forEach(userChanges, function(userChange) {
        if (userChange.state === 'reviewing') {
          countTotals.reviewing++;
        }
        else if (userChange.state === 'mine') {
          countTotals.mine++;
        }
      });
    }

    function clearList(list) {
      while (list.length > 0) {
        list.pop();
      }      
    }

    function itemSort(a, b) {
      if (a.order > b.order) {
        return 1;
      }
      else if (a.order < b.order) {
        return -1;
      }
      else {
        return 0;
      }
    }    

    function updateListsAndCounts() {

      console.log('updateListsAndCounts');

      clearList(allChangesList);
      clearList(reviewChangesList);
      clearList(myChangesList);

      angular.forEach(itemsCache, function(item) {

        var userChange = userChanges.$getRecord(item.id);

        allChangesList.push(item);

        if (userChange.state === 'reviewing') {
          reviewChangesList.push(item);
        }
        else if (userChange.state === 'mine') {
          myChangesList.push(item);
        }        
      });

      allChangesList.sort(itemSort);
      reviewChangesList.sort(itemSort);
      myChangesList.sort(itemSort);

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
                loaded: true,
                order: parseInt(-userChange.updated, 10),
                title: change.title,
                type: type,
                subjectId: globalChange.subjectId,
                subjectDisplay: subjectDisplay,
                subjectUrl: subjectUrl,
                agentName: agentName,
                agentId: agentId,
                agentUrl: userUrl,
                updatedDate: updatedDate,
                reason: reason,
                state: userChange.state,
                approvalCount: approvalCount,
                commentCount: 0,
                comments: [],
                reviewers: []
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
        else if (!globalChange) {
          var msg = 'Global change is undefined';
          console.log(msg);
          deferred.reject(msg);
        }
      },
      function(error) {
        console.log('No global change for ' + changeId);
        console.log(error);
      });

      return deferred.promise;
    }

    function _approveAll() {
      var promises = [];   
        
      angular.forEach(userChanges, function(userChange) {

        var changeId = userChange.$id;

        if (userChange.state !== 'approved') {
          var approvalsUserRef = $firebase(rootRef.child('/changes/' + changeId + '/approvals/' + userId));
          promises.push(approvalsUserRef.$set(true));          
          var userChangeRef = $firebase(rootRef.child('/users/' + userId + '/changes/' + changeId));
          promises.push(userChangeRef.$update({state: 'approved'}));
        }
      });

      return $q.all(promises);
    }

    function loadListItem(userChange) {
      var loadingItem = {
        id: userChange.$id,
        order: parseInt(-userChange.updated, 10),
        loaded: false
      };

      itemsCache[userChange.$id] = loadingItem;

      allChangesList.push(loadingItem);

      if (userChange.state === 'reviewing') {
        reviewChangesList.push(loadingItem);
      }
      else if (userChange.state === 'mine') {
        myChangesList.push(loadingItem);
      }

      loadItem(userChange).then(function(newItem) {

        var oldItem = itemsCache[newItem.id];
        _.assign(oldItem, newItem);
      });
    }

    function _loadList(list, count) {

      console.log('loading ' + count + ' items for the list = ' + list);

      var loaded = 0;

      angular.forEach(userChanges, function(userChange) {

        if (!(userChange.$id in itemsCache) && loaded < count) {

          if (userChange.state === 'reviewing' && list === 'review') {
            loaded++;
            loadListItem(userChange);
          }
          else if (userChange.state === 'mine' && list === 'mine') {
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

    function updateSubjectList() {
      clearList(subjectList);

      angular.forEach(itemsCache, function(item) {
        if (item.subjectId === subjectIdFilter) {
          subjectList.push(item);
        }
      });

      subjectList.sort(itemSort);
    }

    function updateUserList() {
      clearList(userList);

      angular.forEach(itemsCache, function(item) {
        if (item.agentId === userIdFilter) {
          userList.push(item);
        }
      });

      userList.sort(itemSort);
    }

    function _loadSubjectOrUserList(count) {

      console.log('loading ' + count + ' items for the user/subject list');

      var loaded = 0;

      angular.forEach(userChanges, function(userChange) {

        if (!(userChange.$id in itemsCache) && loaded < count) {

          loaded++;

          var loadingItem = {
            id: userChange.$id,
            order: parseInt(-userChange.updated, 10),
            loaded: false
          };

          itemsCache[userChange.$id] = loadingItem;

          loadItem(userChange).then(function(newItem) {

            var oldItem = itemsCache[newItem.id];
            _.assign(oldItem, newItem);

            if (newItem.subjectId === subjectIdFilter) {
              subjectList.push(newItem);
            }

            if (newItem.agentId === userIdFilter) {
              userList.push(newItem);
            }
          });
        }
      });

      subjectList.sort(itemSort);
      userList.sort(itemSort);
      updateListsAndCounts();
    }

    return {
      setCurrentListType: function(listType) {
        if (listType === 'review' || 
            listType === 'mine' || 
            listType === 'all') {
          currentListType = listType;
        }
        else {
          console.log('Error: Unknown list type = ' + listType);
        }
      },
      getCurrentListType: function() {
        return currentListType;
      },
      getCurrentList: function() {
        var list = [];
        switch(currentListType) {
          default:
          case 'review':
            list = reviewChangesList;
            break;
          case 'mine':
            list = myChangesList;
            break;
          case 'all':
            list = allChangesList;
            break;
        }
        return list;
      },
      getCountTotals: function() {
        return countTotals;
      },
      getAllChangesList: function() {
        return allChangesList;
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
      getSubjectList: function(subjectId) {
        subjectIdFilter = subjectId;
        updateSubjectList();
        return subjectList;
      },
      loadSubjectOrUserList: function(count) {
        return _loadSubjectOrUserList(count);
      },
      getUserList: function(userId) {
        userIdFilter = userId;
        updateUserList();
        return userList;
      },
      approveAll: function() {
        _approveAll();
      },
      updateItem: function(changeId) {
        _updateItem(changeId);
      }
    };
  });
})();