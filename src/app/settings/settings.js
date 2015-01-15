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
    .controller('SettingsController', function ($scope, fsApi, fsCurrentUserCache, fsChangeUtils, $firebase, $window) {
        
        fsCurrentUserCache.getUser().then(function(user) {
          $scope.userName = user.displayName;
        });

        var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');

        function findPersonChanges(person) {
          fsApi.getPersonChanges(person.id).then(function(response) {

            var changes = response.getChanges();
            var changesRef = rootRef.child('/changes');
            var userChangesRef = rootRef.child('/users/1/changes');

            for (var i = 0, len = changes.length; i < len; i++) {

              var change = changes[i];
              var reason = change.$getChangeReason();
              if (!reason) {
                reason = '';
              }
              var type = fsChangeUtils.getType(change);
              var updatedDate = new Date(change.updated).toLocaleDateString();
              var subjectUrl = person.$getPersonUrl();
              var subjectDisplay = person.display.name;
              var agentName = change.$getAgentName();
              //var changeUrl = 'https://familysearch.org/tree/#view=personChangeLog&person=' + person.id;

              var changeObj = {
                title: change.title,
                type: type,
                subjectType: 'person',
                subjectDisplay: subjectDisplay,
                subjectUrl: subjectUrl,
                agentName: agentName,
                updated: change.updated,
                updatedDate: updatedDate,
                reason: reason
              };

              $firebase(changesRef.child(change.id)).$set(changeObj);
              $firebase(userChangesRef.child(change.id)).$set(changeObj).$priority = -change.updated;
            }

          });
        }

        function findAncestors(user, gens) {

          console.log('finding ancestors for id = ' + user.personId);

          fsApi.getAncestry(user.personId, {
            generations: gens,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var personsRef = rootRef.child('/persons');
            var userPersonsRef = rootRef.child('/users/1/persons');

            var persons = response.getPersons();

            for (var i = 0, len = persons.length; i < len; i++) {
              var person = persons[i];

              // we must not display or store living persons
              if (!person.display.living) {
                $scope.persons.push(person);

                $firebase(personsRef.child(person.id)).$set(true);
                $firebase(userPersonsRef.child(person.id)).$set(true);

                findPersonChanges(person);
              }
              else {
                console.log('Skipping living person ' + person.display.name);
              }
            }

          });

        }

        $scope.getTree = function(generations) {

          $scope.persons = [];

          fsCurrentUserCache.getUser().then(function(user) {
            findAncestors(user, generations);
          });

        };
    });
})();
