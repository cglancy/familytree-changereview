(function(){
  'use strict';
  angular.module('fsReferenceClient')
    .config(function ($stateProvider) {
      $stateProvider.state('settings', {
        url: '/settings',
        controller: 'SettingsController',
        templateUrl: 'settings/settings.tpl.html',
        data: { pageTitle: 'Settings' }
      });
    })
    .controller('SettingsController', function ($scope, $rootScope, fsApi, fsCurrentUserCache) {

        fsCurrentUserCache.getUser().then(function(user) {
          $scope.userName = user.displayName;
        });

        function findChanges(personId) {
          fsApi.getPersonChanges(personId).then(function(response) {

            var changes = response.getChanges();
            for (var i = 0, len = changes.length; i < len; i++) {
              $rootScope.changes.push(changes[i]);
            }

          });
        }

        function findAncestors(personId, gens) {

          console.log('finding ancestors for id = ' + personId);

          fsApi.getAncestry(personId, {
            generations: gens,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var persons = response.getPersons();
            for (var i = 0, len = persons.length; i < len; i++) {

              var person = persons[i];
              $rootScope.persons.push(person);
              findChanges(person.id);

            }

          });

        }

        $scope.getTree = function(generations) {

          $rootScope.persons = [];
          $rootScope.changes = [];

          fsCurrentUserCache.getUser().then(function(user) {
            findAncestors(user.personId, generations);
          });

        };

    });
})();
