(function(){
  'use strict';
  angular.module('fsReferenceClientShared')
    .factory('ftcrChangeFeed', function($q, $rootScope, fsApi, ChangeFeedItem) {
      var persons = [];
      var changeFeedItems = [];

      $rootScope.$on('newSession', function() {
        persons = [];
        changeFeedItems = [];
      });

      function findChanges(personId) {
        fsApi.getPersonChanges(personId).then(function(response) {

          var personChanges = response.getChanges();
          for (var i = 0, len = personChanges.length; i < len; i++) {
            changeFeedItems.push(new ChangeFeedItem(personChanges[i]));
          }

        });
      }

      function setPersons(list) {
        persons = list;

        for (var i = 0, len = persons.length; i < len; i++) {
          findChanges(persons[i]);
        }
      }

      function getChangeItems() {
        return changeFeedItems;
      }

      return {
        getChangeItems: getChangeItems,
        setPersons: setPersons
      };
    });
})();