(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrAgentsCache', function ($q, fsApi) {

      var agentsCache = {};

      return {
        clear: function() {
          agentsCache = {};
        },

        getAgent: function(agentId) {
          var deferred = $q.defer();

          if (agentId in agentsCache) {
            var agent = agentsCache[agentId];
            deferred.resolve(agent);
          }
          else {
            fsApi.getAgent(agentId).then(function(response) {
              var agent = response.getAgent();
              agentsCache[agentId] = agent;
              deferred.resolve(agent);
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