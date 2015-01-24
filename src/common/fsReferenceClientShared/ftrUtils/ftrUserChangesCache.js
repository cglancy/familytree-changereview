(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrUserChangesCache', function ($q, fsApi, fsCurrentUserCache, ftrUserPersonsCache, $window, $firebase, FIREBASE_URL, fsChangeUtils) {

      var rootRef = new $window.Firebase(FIREBASE_URL);
      var changesCache = {};
      var userId;

      fsCurrentUserCache.getUser().then(function(user) {
        userId = user.treeUserId;
        var userChangeIds = $firebase(rootRef.child('/agents/' + userId + '/changes')).$asArray();
        userChangeIds.$loaded().then(function() {
          userChangeIds.$watch(function(event) {
            if (event.key in changesCache) {
              delete changesCache[event.key];              
            }
          });
        });
      });

      return {
        clear: function() {
          changesCache = {};
        },

        invalidateChange: function(changeId) {
          if (changeId in changesCache) {
            delete changesCache[changeId];
          }
        },

        getChange: function(changeId) {
          var deferred = $q.defer();

          if (changeId in changesCache) {
            var change = changesCache[changeId];
            deferred.resolve(change);
          }
          else {
            var changeRef = $firebase(rootRef.child('/changes/' + changeId)).$asObject();
            changeRef.$loaded().then(function(globalChange) {

              if (globalChange.subjectType === 'person') {

                ftrUserPersonsCache.getPerson(globalChange.subjectId).then(function(person) {

                  fsApi.getPersonChanges(globalChange.subjectId).then(function(response) {

                    var resultChange = {};
                    var changes = response.getChanges();

                    for (var i = 0, len = changes.length; i < len; i++) {

                      var fsChange = changes[i];

                      var reason = fsChange.$getChangeReason();
                      if (!reason) {
                        reason = '';
                      }
                      var type = fsChangeUtils.getType(fsChange);
                      var updatedDate = new Date(fsChange.updated).toLocaleDateString();
                      var subjectDisplay = person.display.name;
                      var agentName = fsChange.$getAgentName();

                      var agentUrl = fsChange.$getAgentUrl();
                      var n = agentUrl.lastIndexOf('/');
                      var agentId = agentUrl.substring(n + 1);

                      var details = {
                        id: fsChange.id,
                        title: fsChange.title,
                        type: type,
                        subjectDisplay: subjectDisplay,
                        agentName: agentName,
                        agentId: agentId,
                        updatedDate: updatedDate,
                        reason: reason
                      };

                      if (fsChange.id in changesCache) {
                        changesCache[fsChange.id].details = details;
                      }
                      else
                      {
                        var changeObj = {
                          subjectType: 'person',
                          subjectId: person.id,
                          updated: fsChange.updated
                        };
                        changeObj.details = details;
                        changesCache[fsChange.id] = changeObj;

                        if (fsChange.id === changeId) {
                          resultChange = changeObj;
                        }
                      }
                    }

                    deferred.resolve(resultChange);
                  });
                });
              }
            });
          }

          return deferred.promise;
        }

      };
    });
})();