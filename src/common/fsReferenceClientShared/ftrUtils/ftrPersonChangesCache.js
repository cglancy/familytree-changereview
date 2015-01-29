(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrPersonChangesCache', function (_, $q, fsApi, fsCurrentUserCache, $window, $firebase, FIREBASE_URL) {

      var rootRef = new $window.Firebase(FIREBASE_URL);
      var changesCache = {};
      var userId;
      var userPersonIds;

      fsCurrentUserCache.getUser().then(function(user) {
        userId = user.treeUserId;
        userPersonIds = $firebase(rootRef.child('/users/' + userId + '/persons')).$asArray();
        userPersonIds.$loaded().then(function() {
          userPersonIds.$watch(function(event) {
            updatePersonChanges(event.key);
          });
        });
      });

      function updatePersonChanges(personId) {
        fsApi.getPersonChanges(personId).then(function(response) {
          var changes = response.getChanges();
          for (var i = 0, len = changes.length; i < len; i++) {
            var change = changes[i];
            _.merge(changesCache[change.id], change);
          }
        });
      }

      return {
        clear: function() {
          changesCache = {};
        },

        getPersonChange: function(personId, changeId) {
          var deferred = $q.defer();

          if (changeId in changesCache) {
            var change = changesCache[changeId];
            deferred.resolve(change);
          }
          else {
            fsApi.getPersonChanges(personId).then(function(response) {
              var targetChange;
              var changes = response.getChanges();
              for (var i = 0, len = changes.length; i < len; i++) {
                var change = changes[i];
                if (change.id in changesCache) {
                  _.merge(changesCache[change.id], change);
                }
                else {
                  changesCache[change.id] = change;                  
                }

                if (change.id === changeId) {
                  targetChange = change;
                }
              }

              deferred.resolve(targetChange);
            },
            function(error) {
              deferred.reject(error);
            });
          }

          return deferred.promise;
        }

      };
    });
})();