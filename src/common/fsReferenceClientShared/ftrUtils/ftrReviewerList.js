(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrReviewerList', function ($q, fsApi, FIREBASE_URL, $firebase, $window, ftrAgentsCache, fsCurrentUserCache) {

      var rootRef = new $window.Firebase(FIREBASE_URL);

      function readUsers() {
        var deferred = $q.defer();
        var usersRef = rootRef.child('users');
        usersRef.once('value', function(snapshot) {
          var users = snapshot.val();
          deferred.resolve(users);
        });
        return deferred.promise;
      }

      function getAgentName(agent) {
        var name = '';
        if (agent.names.length === 2) {
          name = agent.names[0].value + ' ' + agent.names[1].value;
        }
        else {
          name = agent.$getName();
        }

        if (!name) {
          name = agent.$getAccountName();
          if (!name) {
            name = agent.id;
          }
        }

        return name;
      }

      function getAgentData(userId, users) {
        var deferred = $q.defer();
        var promises = [];
        var list = [];

        angular.forEach(users, function(user, key) {
          if (userId !== key) {
            promises.push(ftrAgentsCache.getAgent(key).then(function(agent) {

              var name = getAgentName(agent);
              var email = agent.$getEmail();
              if (!email) {
                email = '';
              }
              list.push({id: key, name: name, email:email});
            }));
          }
        });

        $q.all(promises).then(function() {
          deferred.resolve(list);              
        });          

        return deferred.promise;
      }

      return {
        getList: function() {
          var deferred = $q.defer();

          fsCurrentUserCache.getUser().then(function(user) {
            var userId = user.treeUserId;
            readUsers().then(function(users) {
              getAgentData(userId, users).then(function(list) {
                deferred.resolve(list);
              });
            });
          });

          return deferred.promise;
        }

      };
    });
})();