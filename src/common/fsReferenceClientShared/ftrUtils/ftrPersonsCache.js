(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrPersonsCache', function (_, $q, fsApi) {

      var personsCache = {};

      return {

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
        },

        updatePerson: function(personId) {
          var deferred = $q.defer();

          if (personId in personsCache) {
            fsApi.getPerson(personId).then(function(response) {
              var person = response.getPerson();
              _.assign(personsCache[personId], person);
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