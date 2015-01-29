(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
  .factory('ftrFeedLists', function (_, $q, fsApi, fsCurrentUserCache, ftrPersonsCache, ftrPersonChangesCache, $window, $firebase, FIREBASE_URL) {

    var rootRef = new $window.Firebase(FIREBASE_URL);
    var userId;
    var userChanges;

    var changesCache = {};
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
        buildLists();

        userChanges.$watch(function(event) {
          updateCounts();
          
          if (event.key in changesCache) {
            updateChange(event.key);          
          }
        });
      });
    });

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

    function buildLists() {
      for (var i = 0, len = userChanges.length; i < len; i++) {
        loadItem(userChanges[i]);
      }         
    }

    function loadItem(userChange) {
      var changeId = userChange.$id;
      var globalChangeRef = rootRef.child('/changes/' + changeId);
      globalChangeRef.once('value', function(snapshot) {
        var globalChange = snapshot.val();
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

              var approvalCount = globalChange.approvals ? globalChange.approvals.length : 0;

              var order = userChange.touched ? -userChange.touched : -userChange.updated;

              var viewItem = {
                id: change.id,
                order: order,
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

              if (viewItem.agentId === userId) {
                myChangesList.push(viewItem);
              }
            });
          });
        }
      });
    }

    function updateChange(changeId) {
      console.log('updating ' + changeId);
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
      }
    };
  });
})();