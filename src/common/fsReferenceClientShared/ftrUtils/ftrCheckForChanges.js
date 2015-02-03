(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrCheckForChanges', function($q, $rootScope, $window, $firebase, FIREBASE_URL, ftrUtils) {

      var factory = {};

      function isPersonChanged(personId, fbTimestamp) {
        var deferred = $q.defer();

        ftrUtils.getPersonLastModified(personId).then(function(lastModified) {
          var timestamp = Date.parse(lastModified);

          if (timestamp !== fbTimestamp) {
            console.log('person id = ' + personId + ' is out of date.');
            deferred.resolve(true);
          }
          else {
            deferred.resolve(false);
          }
        });

        return deferred.promise;
      }

      function getUserPersons(userId) {
        var deferred = $q.defer();
        var rootRef = new $window.Firebase(FIREBASE_URL);
        var userPersonsRef = rootRef.child('/users/' + userId + '/persons');
        userPersonsRef.once('value', function(snapshot) {
          deferred.resolve(snapshot.val());
        });
        return deferred.promise;
      }

      function getChangedIds(userPersons) {
        var deferred = $q.defer();
        var promises = [];
        var changedPersonIds = [];
        angular.forEach(userPersons, function(timestamp, id) {
          promises.push(isPersonChanged(id, timestamp).then(function(changed) {
            if (changed) {
              changedPersonIds.push(id);
            }
          }));
        });
        $q.all(promises).then(function() {
          deferred.resolve(changedPersonIds);
        });
        return deferred.promise;
      }

      factory.getChangedPersonIds = function(userId) {
        var deferred = $q.defer();
        getUserPersons(userId).then(function(userPersons) {
          getChangedIds(userPersons).then(function(changedIds) {
            deferred.resolve(changedIds);
          });
        });
        return deferred.promise;
      };

      return factory;
    });
})();