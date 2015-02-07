(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftrAgentUtils', function () {

      return {

        getAgentName: function(agent) {
          var name = '';
          if (agent.names.length === 2) {
            name = agent.names[0].value + ' ' + agent.names[1].value;
          }
          else {
            name = agent.$getName();
          }

          return name;
        }
      };
    });
})();