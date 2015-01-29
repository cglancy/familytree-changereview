(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
  .factory('ftrUserChangesCache', function (_, $q, fsApi, fsCurrentUserCache, ftrPersonsCache, ftrPersonChangesCache, $window, $firebase, FIREBASE_URL) {

    var rootRef = new $window.Firebase(FIREBASE_URL);
    var changesCache = {};
    var userId;
    var userChangeIds;

    fsCurrentUserCache.getUser().then(function(user) {
      userId = user.treeUserId;
      userChangeIds = $firebase(rootRef.child('/users/' + userId + '/changes')).$asArray();
      userChangeIds.$loaded().then(function() {
        userChangeIds.$watch(function(event) {
          if (event.key in changesCache) {
            updateChange(event.key);          
          }
        });
      });
    });

    function updateChange(changeId) {

      if (changeId in changesCache) {
          var changeRef = $firebase(rootRef.child('/changes/' + changeId)).$asObject();
          changeRef.$loaded().then(function(change) {
            _.merge(changesCache[changeId], change);             
          });
        }
    }

    // function getDetails(fsChange, person) { 
    //   var reason = fsChange.$getChangeReason();
    //   if (!reason) {
    //     reason = '';
    //   }
    //   var type = fsChangeUtils.getType(fsChange);
    //   var updatedDate = new Date(fsChange.updated).toLocaleDateString();
    //   var subjectDisplay = person.display.name;
    //   var agentName = fsChange.$getAgentName();

    //   var agentUrl = fsChange.$getAgentUrl();
    //   var n = agentUrl.lastIndexOf('/');
    //   var agentId = agentUrl.substring(n + 1);

    //   var details = {
    //     id: fsChange.id,
    //     title: fsChange.title,
    //     type: type,
    //     subjectDisplay: subjectDisplay,
    //     agentName: agentName,
    //     agentId: agentId,
    //     updatedDate: updatedDate,
    //     reason: reason
    //   };

    //   return details;
    // }

    return {
      clear: function() {
        changesCache = {};
      },

      getChange: function(changeId) {
        var deferred = $q.defer();

        if (changeId in changesCache) {
          var change = changesCache[changeId];
          deferred.resolve(change);
        }
        else {
          var changeRef = $firebase(rootRef.child('/changes/' + changeId)).$asObject();
          changeRef.$loaded().then(function(change) {
            changesCache[changeId] = change;
            deferred.resolve(change);
          });
        }

        return deferred.promise;
      }

    };
  });
})();