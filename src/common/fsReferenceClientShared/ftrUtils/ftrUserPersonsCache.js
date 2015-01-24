(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrUserPersonsCache', function ($q, fsApi, fsCurrentUserCache, $window, $firebase, FIREBASE_URL) {

      var rootRef = new $window.Firebase(FIREBASE_URL);
      var personsCache = {};
      var userId;

      fsCurrentUserCache.getUser().then(function(user) {
        userId = user.treeUserId;
        var userPersonIds = $firebase(rootRef.child('/agents/' + userId + '/persons')).$asArray();
        userPersonIds.$loaded().then(function() {
          userPersonIds.$watch(function(event) {
            if (event.key in personsCache) {
              delete personsCache[event.key];              
            }
          });
        });
      });

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