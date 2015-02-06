(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrFirebaseUtils', function($q, $window, $firebase, FIREBASE_URL, fsCurrentUserCache) {

      var factory = {};
      var rootRef = new $window.Firebase(FIREBASE_URL);
      var userId;

      function writeTimestamp() {
        var deferred = $q.defer();
        var timeRef = rootRef.child('/users/' + userId + '/updated');
        timeRef.set(Firebase.ServerValue.TIMESTAMP, function() {
          deferred.resolve();
        });
        return deferred.promise;
      }

      function readTimestamp() {
        var deferred = $q.defer();
        var timeRef = rootRef.child('/users/' + userId + '/updated');
        timeRef.once('value', function(snapshot) {
          deferred.resolve(snapshot.val());
        });
        return deferred.promise;
      }

      factory.getServerTimestamp = function() {
        return fsCurrentUserCache.getUser()
        .then(function(user) {
          userId = user.treeUserId;
        })
        .then(writeTimestamp)
        .then(readTimestamp);
      };

      return factory;
    });
})();