(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrPollingForChanges', function($rootScope, $window, $firebase, FIREBASE_URL, fsCurrentUserCache, ftrUtils, $interval) {

      var changedPersonIds = [];
      var stop;

      function isPersonChanged(personId, fbTimestamp) {

        ftrUtils.getPersonLastModified(personId).then(function(lastModified) {
          var timestamp = Date.parse(lastModified);

          if (timestamp !== fbTimestamp) {
            console.log('person id = ' + personId + ' is out of date.');
            changedPersonIds.push(personId);
            $rootScope.$emit('personChanged');
          }
        });
      }

      function getChangedPersonIdsForUser(userId) {

        var rootRef = new $window.Firebase(FIREBASE_URL);
        var userPersonsIds = $firebase(rootRef.child('/users/' + userId + '/persons')).$asArray();

        userPersonsIds.$loaded().then(function() {
          for (var i = 0, len = userPersonsIds.length; i < len; i++) {
            isPersonChanged(userPersonsIds.$keyAt(i), userPersonsIds[i].$value);
          }
        });
      }

      return {

        startPolling: function() {
          if ( angular.isDefined(stop) ) {
            return;
          }

          stop = $interval(function() {
            console.log('poll');
            fsCurrentUserCache.getUser().then(function(user) {
              getChangedPersonIdsForUser(user.treeUserId);
            });
          }, 30000);
        },

        stopPolling: function() {
          if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
          }
        },

        getChangedPersonIds: function() {
          return changedPersonIds;
        },

        clearChanges: function() {
          changedPersonIds = [];
        }
      };
    });
})();