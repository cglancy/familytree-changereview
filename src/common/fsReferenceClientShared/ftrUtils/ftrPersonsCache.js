(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrPersonsCache', function (_, $q, fsApi, fsCurrentUserCache, $window, $firebase, FIREBASE_URL) {

      var rootRef = new $window.Firebase(FIREBASE_URL);
      var personsCache = {};
      var userId;
      var userPersonIds;

      fsCurrentUserCache.getUser().then(function(user) {
        userId = user.treeUserId;
        userPersonIds = $firebase(rootRef.child('/agents/' + userId + '/persons')).$asArray();
        userPersonIds.$loaded().then(function() {
          userPersonIds.$watch(function(event) {
            if (event.key in personsCache) {
              updatePerson(event.key);            
            }
          });
        });
      });

      function updatePerson(personId) {
        if (personId in personsCache) {
          fsApi.getPerson(personId).then(function(response) {
            var person = response.getPerson();
            _.merge(personsCache[personId], person);
          });
        }
      }

      return {
        clear: function() {
          personsCache = {};
        },

        getPerson: function(personId) {
          var deferred = $q.defer();

          if (personId in personsCache) {
            var person = personsCache[personId];
            deferred.resolve(person);
          }
          else {
            fsApi.getPerson(personId).then(function(response) {
              var person = response.getPerson();
              personsCache[personId] = person;
              deferred.resolve(person);
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