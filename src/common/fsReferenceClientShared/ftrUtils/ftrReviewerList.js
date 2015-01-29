(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrReviewerList', function ($q, fsApi, FIREBASE_URL, $firebase, $window, ftrAgentsCache) {

      var rootRef = new $window.Firebase(FIREBASE_URL);

      return {
        getList: function() {
          var deferred = $q.defer();
          var promises = [];
          var list = [];

          var users = $firebase(rootRef.child('users')).$asObject();
          users.$loaded().then(function() {
            angular.forEach(users, function(user, key) {
              if (user.reviewer) {
                promises.push(ftrAgentsCache.getAgent(key).then(function(agent) {
                  var name = agent.$getAccountName();
                  list.push({userId: key, name: name});
                }));
              }
            });
          });

          $q.all(promises).then(function() {
            deferred.resolve(list);              
          });          

          return deferred;
        }

      };
    });
})();