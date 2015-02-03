(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrPersonChangesCache', function (_, $q, fsApi) {

      var changesCache = {};

      return {

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
              angular.forEach(changes, function(change) {
                if (change.id in changesCache) {
                  _.assign(changesCache[change.id], change);
                }
                else {
                  changesCache[change.id] = change;                  
                }

                if (change.id === changeId) {
                  targetChange = change;
                }
              });

              if (targetChange) {
                deferred.resolve(targetChange);
              }
              else {
                var msg = 'Error: Person change not found for id = ' + changeId;
                console.log(msg);
                deferred.reject(msg);
              }
            },
            function(error) {
              deferred.reject(error);
            });
          }

          return deferred.promise;
        },

        updatePersonChanges: function(personId) {
          fsApi.getPersonChanges(personId).then(function(response) {
            var changes = response.getChanges();
            angular.forEach(changes, function(change) {
              _.assign(changesCache[change.id], change);
            });
          });
        }

      };
    });
})();