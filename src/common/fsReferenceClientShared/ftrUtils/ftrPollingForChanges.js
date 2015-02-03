(function(){
  'use strict';
  angular.module('fsReferenceClientShared')

    .factory('ftrPollingForChanges', function($rootScope, fsCurrentUserCache, ftrCheckForChanges, $interval) {

      var changedPersonIds = [];
      var stop;

      return {

        startPolling: function() {
          if ( angular.isDefined(stop) ) {
            return;
          }

          stop = $interval(function() {
            console.log('poll');
            fsCurrentUserCache.getUser().then(function(user) {
              ftrCheckForChanges.getChangedPersonIds(user.treeUserId).then(function(changedIds) {
                changedPersonIds = changedIds;
                if (changedIds.length) {
                  $rootScope.$emit('personChanged');

                  console.log('Changes = ', changedIds);
                }
              });
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