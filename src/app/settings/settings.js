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
        
        $scope.treeGenerations = 8;

        fsCurrentUserCache.getUser().then(function(user) {
          $scope.agentId = user.treeUserId;
        });

        var rootRef = new $window.Firebase('https://shining-heat-1351.firebaseio.com/ftcr');
        var changesRef = rootRef.child('/changes');
        var fbChangesRef = $firebase(changesRef);
        //$scope.userPersons = $firebase(rootRef.child('/agents/' + $scope.agentId + '/persons')).$asArray();

        function findPersonChanges(person) {

          var userChangesRef = rootRef.child('/agents/' + $scope.agentId + '/changes');
          var fbUserChangesRef = $firebase(userChangesRef);
          
          fsApi.getPersonChanges(person.id).then(function(response) {

            var changes = response.getChanges();

            for (var i = 0, len = changes.length; i < len; i++) {

              var change = changes[i];
              var reason = change.$getChangeReason();
              if (!reason) {
                reason = '';
              }
              var type = fsChangeUtils.getType(change);
              var updatedDate = new Date(change.updated).toLocaleDateString();
              var subjectDisplay = person.display.name;
              var agentName = change.$getAgentName();
              var order = -change.updated;

              var agentUrl = change.$getAgentUrl();
              var n = agentUrl.lastIndexOf('/');
              var agentId = agentUrl.substring(n + 1);

              //var changeUrl = 'https://familysearch.org/tree/#view=personChangeLog&person=' + person.id;

              var changeObj = {
                id: change.id,
                title: change.title,
                type: type,
                subjectType: 'person',
                subjectId: person.id,
                subjectDisplay: subjectDisplay,
                agentName: agentName,
                agentId: agentId,
                order: order,
                updatedDate: updatedDate,
                reason: reason
              };

              fbUserChangesRef.$set(change.id, true);
              fbChangesRef.$update(change.id, changeObj);
            }

          });
        }

        function findAncestors(user, gens) {

          console.log('finding ' + gens + ' generations of ancestors for id = ' + user.personId);

          fsApi.getAncestry(user.personId, {
            generations: gens,
            personDetails: false,
            marriageDetails: false
          }).then(function(response) {

            var personsRef = rootRef.child('/persons');
            var userPersonsRef = rootRef.child('/agents/' + $scope.agentId + '/persons');

            var persons = response.getPersons();

            for (var i = 0, len = persons.length; i < len; i++) {
              var person = persons[i];

              // we must not display or store living persons
              if (!person.living) {
                $scope.persons.push(person);

                $firebase(personsRef.child(person.id)).$set(true);
                $firebase(userPersonsRef.child(person.id)).$set(true);

                findPersonChanges(person);
              }
              else {
                console.log('Skipping living person ' + person.display.name);
              }

              // if (person.living && person.display.ahnen !== 1) {
              //   var deathFact = new fsApi.Fact();
              //   deathFact.$setType('http://gedcomx.org/Death');
              //   person.$addFact(deathFact);
              //   person.$save();
              // }

            }

          });

        }

        $scope.getTree = function(generations) {

          $scope.persons = [];

          fsCurrentUserCache.getUser().then(function(user) {
            findAncestors(user, generations);
          });

        };

      function createParents(childId, ahnen, maxAhnen) {

        if (ahnen > maxAhnen) {
          return;
        }

        var fatherAhnen = 2*ahnen;
        var father = new fsApi.Person();
        father.$setGender('http://gedcomx.org/Male');
        father.$addName({givenName: 'Person' + fatherAhnen, surname: 'Surname'});
        var fatherDeathFact = new fsApi.Fact();
        fatherDeathFact.$setType('http://gedcomx.org/Death');
        father.$addFact(fatherDeathFact);
        father.$save('Created for testing', true).then(function(fatherId) {

          console.log('created father id = ' + fatherId + ' for person id = ' + childId);

          var motherAhnen = 2*ahnen + 1;
          var mother = new fsApi.Person();
          mother.$setGender('http://gedcomx.org/Female');
          mother.$addName({givenName: 'Person' + motherAhnen, surname: 'Surname'});
          var motherDeathFact = new fsApi.Fact();
          motherDeathFact.$setType('http://gedcomx.org/Death');
          mother.$addFact(motherDeathFact);
          mother.$save('Created for testing', true).then(function(motherId) {

            console.log('created mother id = ' + motherId + ' for person id = ' + childId);

            var rel = new fsApi.ChildAndParents();
            rel.$setFather(fatherId);
            rel.$setMother(motherId);
            rel.$setChild(childId);
            rel.$save('Created for testing').then(function() {

              var couple = new fsApi.Couple({husband: fatherId, wife: motherId});
              couple.$save('Created for testing').then(function() {

                createParents(fatherId, fatherAhnen, maxAhnen);
                createParents(motherId, motherAhnen, maxAhnen);
              });
            });
          });
        });

      }

      $scope.createAncestry = function(generations) {

        console.log('create ancestry for ' + generations + ' generations.');

        var maxAhnen = Math.pow(2, generations) - 1;

        fsCurrentUserCache.getUser().then(function(user) {
            createParents(user.personId, 1, maxAhnen);
        });
      };

    });
})();
